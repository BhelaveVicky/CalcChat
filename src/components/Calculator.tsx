import React, { useState, useEffect } from 'react';
import { Sparkles, Settings as SettingsIcon, Delete, Lock, X } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useSettings } from '../context/SettingsContext';
import { Settings as SettingsComponent } from './Settings';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const formatDisplayNumber = (val: string): string => {
  if (val === 'Error' || val === 'NaN') return val;
  if (!val || val === '0') return '0';
  
  const parts = val.split('.');
  
  // Format the integer part with dot as thousands separator
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // If there is a decimal part, join with a comma (e.g. 12.5 -> 12,5)
  if (parts.length > 1) {
    return integerPart + ',' + parts[1];
  }
  
  return integerPart;
};

export const Calculator: React.FC = () => {
  const { settings, user, authUser, unlockVault, setActiveTab } = useVault();
  const { settings: appSettings, addToHistory, t } = useSettings();
  const [display, setDisplay] = useState<string>('0');
  const [equation, setEquation] = useState<string>('');
  const [unlocking, setUnlocking] = useState<boolean>(false);
  const [isCalculated, setIsCalculated] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const activeUid = user?.id || user?.uid || authUser?.uid || '';
  const activeEmail = (user?.email || authUser?.email || '').toLowerCase();

  const [showFirstTimeHint, setShowFirstTimeHint] = useState<boolean>(() => {
    try {
      if (!activeUid) return false;
      const perUserKey = `calcchat_calculator_hint_seen_${activeUid}`;
      const perEmailKey = activeEmail ? `calcchat_calculator_hint_seen_${activeEmail}` : '';
      const globalKey = 'calcchat_calculator_first_time_hint_seen';

      if (
        localStorage.getItem(perUserKey) ||
        (perEmailKey && localStorage.getItem(perEmailKey)) ||
        localStorage.getItem(globalKey)
      ) {
        return false;
      }

      if (user?.firstTimeHintDismissed || user?.firstTimeHintSeen) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!activeUid) {
      setShowFirstTimeHint(false);
      return;
    }

    const perUserKey = `calcchat_calculator_hint_seen_${activeUid}`;
    const perEmailKey = activeEmail ? `calcchat_calculator_hint_seen_${activeEmail}` : '';
    const globalKey = 'calcchat_calculator_first_time_hint_seen';

    const isDismissedLocal = !!(
      localStorage.getItem(perUserKey) ||
      (perEmailKey && localStorage.getItem(perEmailKey)) ||
      localStorage.getItem(globalKey)
    );

    const isDismissedDb = !!(user?.firstTimeHintDismissed || user?.firstTimeHintSeen);

    if (isDismissedLocal || isDismissedDb) {
      setShowFirstTimeHint(false);
    }
  }, [activeUid, activeEmail, user?.firstTimeHintDismissed, user?.firstTimeHintSeen]);

  const dismissFirstTimeHint = () => {
    setShowFirstTimeHint(false);
    try {
      localStorage.setItem('calcchat_calculator_first_time_hint_seen', 'true');
      if (activeUid) {
        localStorage.setItem(`calcchat_calculator_hint_seen_${activeUid}`, 'true');
      }
      if (activeEmail) {
        localStorage.setItem(`calcchat_calculator_hint_seen_${activeEmail}`, 'true');
      }
      if (activeUid && db) {
        updateDoc(doc(db, 'users', activeUid), {
          firstTimeHintDismissed: true,
          firstTimeHintSeen: true,
        }).catch(() => {});
      }
    } catch (e) {}
  };

  const handleButtonClick = (val: string) => {
    if (val === 'AC') {
      setDisplay('0');
      setEquation('');
      setIsCalculated(false);
      return;
    }

    if (val === 'C') {
      if (isCalculated) {
        setDisplay('0');
        setEquation('');
        setIsCalculated(false);
      } else {
        if (display.length > 1) {
          setDisplay(display.slice(0, -1));
        } else {
          setDisplay('0');
        }
      }
      return;
    }

    if (val === '%') {
      const num = parseFloat(display);
      if (!isNaN(num)) {
        const res = (num / 100).toString();
        setDisplay(res);
        if (isCalculated) {
          setEquation('');
          setIsCalculated(false);
        }
      }
      return;
    }

    if (val === '=') {
      if (isCalculated) return;

      // Check user passcode first, then settings passcode, then fallback '1234'
      const activePasscode = user.passcode || settings.passcode || '1234';
      if (display === activePasscode || equation + display === activePasscode) {
        dismissFirstTimeHint();
        setUnlocking(true);
        setTimeout(() => {
          unlockVault(activePasscode);
        }, 150);
        return;
      }

      // Normal Math Calculation
      try {
        let fullEq = equation + display;
        // Map UI operator 'x' to internal Math operator '*'
        fullEq = fullEq.replace(/x/g, '*');
        const res = new Function(`return ${fullEq}`)();
        if (res !== undefined && !isNaN(res)) {
          const formatted = Math.round(res * 100000000) / 100000000;
          const expression = equation + display;
          setEquation(expression + ' =');
          setDisplay(formatted.toString());
          setIsCalculated(true);

          // Save to history if enabled
          const now = new Date();
          const date = now.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          const time = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          addToHistory({
            expression: expression,
            result: formatted.toString(),
            date,
            time
          });
        }
      } catch {
        setDisplay('Error');
        setTimeout(() => {
          setDisplay('0');
          setEquation('');
          setIsCalculated(false);
        }, 1500);
      }
      return;
    }

    // Operator handling
    if (['+', '-', 'x', '/'].includes(val)) {
      if (isCalculated) {
        setEquation(display + ' ' + val + ' ');
        setDisplay('0');
        setIsCalculated(false);
      } else {
        setEquation(equation + display + ' ' + val + ' ');
        setDisplay('0');
      }
      return;
    }

    // Special case for '00'
    if (val === '00') {
      if (isCalculated) {
        setDisplay('0');
        setEquation('');
        setIsCalculated(false);
        return;
      }
      if (display === '0') return;
      if (display.length < 15) {
        setDisplay(display + '00');
      }
      return;
    }

    // Number / Decimal input
    if (val === '.') {
      if (isCalculated) {
        setDisplay('0.');
        setEquation('');
        setIsCalculated(false);
        return;
      }
      if (display.includes('.')) return;
      setDisplay(display + '.');
      return;
    }

    // Number digits input
    if (isCalculated) {
      setDisplay(val);
      setEquation('');
      setIsCalculated(false);
    } else {
      if (display === '0') {
        setDisplay(val);
      } else if (display.length < 15) {
        setDisplay(display + val);
      }
    }
  };

  if (showSettings) {
    return <SettingsComponent onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-0 select-none w-full h-full min-h-0 transition-colors duration-300 ${
      appSettings.darkMode ? 'bg-slate-900' : 'bg-slate-100'
    }`}>
      
      {/* Device wrapper - full height/width responsive */}
      <div className="w-full h-full min-h-0 relative flex flex-col bg-gradient-to-b from-[#ff8e6a] to-[#ff5676] overflow-hidden">
        
        {/* Desktop Device Notch (Optional / Hidden for fully responsive) */}
        <div className="hidden absolute top-0 left-1/2 -translate-x-1/2 z-20 w-40 h-6 bg-slate-950 rounded-b-2xl"></div>
        
        {/* Top Display Section (Balanced 50-50 flex-1 section) */}
        <div className="flex-1 flex flex-col justify-between pt-8 sm:pt-12 pb-4 sm:pb-6 px-4 sm:px-6 relative">
          {/* Top Bar with Settings and Title */}
          <div className="relative w-full flex items-center justify-center pt-1 min-h-[28px] flex-none">
            {/* Centered title */}
            <div className="text-center text-xs font-semibold tracking-widest uppercase font-sans text-white/95">
              {t('calculator')}
            </div>

            {/* Calculator Settings button */}
            <button 
              onClick={() => setShowSettings(true)}
              className="absolute right-0 text-white/80 hover:text-white transition-colors cursor-pointer p-1.5 active:scale-90 duration-150 rounded-full hover:bg-white/10"
              title="Calculator Settings"
            >
              <SettingsIcon className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* First Time User Onboarding Hint Banner (Shows ONLY ONCE on first login) */}
          {showFirstTimeHint && (
            <div className="my-auto py-2.5 px-3.5 rounded-2xl bg-black/25 backdrop-blur-md border border-white/30 text-white text-xs font-medium flex items-center justify-between gap-2.5 shadow-xl animate-fade-in z-10">
              <div className="flex items-center gap-2.5 text-left min-w-0">
                <div className="p-1.5 rounded-xl bg-white/20 shrink-0 text-amber-300 shadow-inner">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-[11.5px] leading-snug">
                    Type passcode <span className="underline decoration-amber-300 font-extrabold text-amber-200">({user?.passcode || settings.passcode || '1234'})</span> & press '=' to open Secret Chat 🔒
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissFirstTimeHint}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all shrink-0 active:scale-90"
                title="Dismiss hint"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Display Output area */}
          <div className="relative mt-auto mb-2 w-full flex flex-col items-end pr-1 pl-1">
            {/* Previous Equation History */}
            <div className="text-right text-base sm:text-lg font-medium tracking-wide font-sans mb-1 min-h-[24px] sm:min-h-[28px] select-text text-white/70 break-all w-full line-clamp-2">
              {equation.replace(/x/g, 'X')}
            </div>

            {/* Current Value / Result */}
            <div className="text-right text-4xl sm:text-6xl font-semibold tracking-tight font-sans truncate w-full select-text text-white">
              {formatDisplayNumber(display)}
            </div>
          </div>
        </div>

        {/* Keypad Bottom Sheet (Expanded to flex-1 to occupy remaining height) */}
        <div className={`flex-1 rounded-t-[32px] sm:rounded-t-[40px] px-4 sm:px-6 pb-6 sm:pb-8 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] flex flex-col justify-between overflow-hidden ${
              appSettings.darkMode ? 'bg-[#1a1a1a]' : 'bg-white'
            }`}>
          {/* Bottom sheet drag handle indicator */}
          <div className={`w-12 h-1.5 rounded-full mx-auto mb-4 sm:mb-6 mt-1 flex-none ${
              appSettings.darkMode ? 'bg-gray-700' : 'bg-gray-200/80'
            }`}></div>

          {/* Grid Layout for Buttons - Spans all available height */}
          <div className="grid grid-cols-4 grid-rows-5 gap-2.5 sm:gap-3.5 flex-1 mb-2">
            {/* Row 1 */}
            <button
              onClick={() => handleButtonClick('AC')}
              className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all shadow-[0_4px_10px_rgba(255,86,118,0.2)] flex items-center justify-center active:scale-95 ${
                appSettings.darkMode
                  ? 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
                  : 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
              }`}
            >
              AC
            </button>
            <button
              onClick={() => handleButtonClick('C')}
              className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all shadow-[0_4px_10px_rgba(255,86,118,0.2)] flex items-center justify-center active:scale-95 ${
                appSettings.darkMode
                  ? 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
                  : 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
              }`}
              title="Backspace"
            >
              <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={() => handleButtonClick('%')}
              className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all shadow-[0_4px_10px_rgba(255,86,118,0.2)] flex items-center justify-center active:scale-95 ${
                appSettings.darkMode
                  ? 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
                  : 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
              }`}
            >
              %
            </button>
            <button
              onClick={() => handleButtonClick('/')}
              className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-bold text-xl sm:text-2xl transition-all shadow-[0_4px_10px_rgba(255,86,118,0.2)] flex items-center justify-center active:scale-95 ${
                appSettings.darkMode
                  ? 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
                  : 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
              }`}
            >
              /
            </button>

            {/* Row 2 */}
            {['7', '8', '9'].map(num => (
              <button
                key={num}
                onClick={() => handleButtonClick(num)}
                className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-semibold text-lg sm:text-xl transition-all shadow-[0_2px_5px_rgba(0,0,0,0.04)] flex items-center justify-center active:scale-95 ${
                  appSettings.darkMode
                    ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700/70 hover:from-gray-700 hover:to-gray-800 text-white'
                    : 'bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-100/70 hover:from-gray-100 hover:to-gray-200 text-gray-800'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleButtonClick('x')}
              className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl transition-all shadow-[0_4px_10px_rgba(255,86,118,0.2)] flex items-center justify-center active:scale-95 ${
                appSettings.darkMode
                  ? 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
                  : 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
              }`}
            >
              x
            </button>

            {/* Row 3 */}
            {['4', '5', '6'].map(num => (
              <button
                key={num}
                onClick={() => handleButtonClick(num)}
                className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-semibold text-lg sm:text-xl transition-all shadow-[0_2px_5px_rgba(0,0,0,0.04)] flex items-center justify-center active:scale-95 ${
                  appSettings.darkMode
                    ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700/70 hover:from-gray-700 hover:to-gray-800 text-white'
                    : 'bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-100/70 hover:from-gray-100 hover:to-gray-200 text-gray-800'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleButtonClick('-')}
              className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-bold text-xl sm:text-2xl transition-all shadow-[0_4px_10px_rgba(255,86,118,0.2)] flex items-center justify-center active:scale-95 ${
                appSettings.darkMode
                  ? 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
                  : 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
              }`}
            >
              -
            </button>

            {/* Row 4 */}
            {['1', '2', '3'].map(num => (
              <button
                key={num}
                onClick={() => handleButtonClick(num)}
                className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-semibold text-lg sm:text-xl transition-all shadow-[0_2px_5px_rgba(0,0,0,0.04)] flex items-center justify-center active:scale-95 ${
                  appSettings.darkMode
                    ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700/70 hover:from-gray-700 hover:to-gray-800 text-white'
                    : 'bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-100/70 hover:from-gray-100 hover:to-gray-200 text-gray-800'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleButtonClick('+')}
              className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl transition-all shadow-[0_4px_10px_rgba(255,86,118,0.2)] flex items-center justify-center active:scale-95 ${
                appSettings.darkMode
                  ? 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
                  : 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
              }`}
            >
              +
            </button>

            {/* Row 5 */}
            <button
              onClick={() => handleButtonClick('00')}
              className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-semibold text-lg sm:text-xl transition-all shadow-[0_2px_5px_rgba(0,0,0,0.04)] flex items-center justify-center active:scale-95 ${
                appSettings.darkMode
                  ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700/70 hover:from-gray-700 hover:to-gray-800 text-white'
                  : 'bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-100/70 hover:from-gray-100 hover:to-gray-200 text-gray-800'
              }`}
            >
              00
            </button>
            <button
              onClick={() => handleButtonClick('0')}
              className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-semibold text-lg sm:text-xl transition-all shadow-[0_2px_5px_rgba(0,0,0,0.04)] flex items-center justify-center active:scale-95 ${
                appSettings.darkMode
                  ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700/70 hover:from-gray-700 hover:to-gray-800 text-white'
                  : 'bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-100/70 hover:from-gray-100 hover:to-gray-200 text-gray-800'
              }`}
            >
              0
            </button>
            <button
              onClick={() => handleButtonClick('.')}
              className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-semibold text-lg sm:text-xl transition-all shadow-[0_2px_5px_rgba(0,0,0,0.04)] flex items-center justify-center active:scale-95 ${
                appSettings.darkMode
                  ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700/70 hover:from-gray-700 hover:to-gray-800 text-white'
                  : 'bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-100/70 hover:from-gray-100 hover:to-gray-200 text-gray-800'
              }`}
            >
              .
            </button>
            <button
              onClick={() => handleButtonClick('=')}
              className={`h-full min-h-[44px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-bold text-xl sm:text-2xl transition-all shadow-[0_4px_10px_rgba(255,86,118,0.2)] flex items-center justify-center active:scale-95 ${
                appSettings.darkMode
                  ? 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
                  : 'bg-gradient-to-br from-[#ff8e6a] to-[#ff5676] hover:from-[#ff9c7b] hover:to-[#ff6785] text-white'
              }`}
            >
              =
            </button>
          </div>
        </div>
      </div>

      {/* Unlocking Vault Transition Overlay */}
      {unlocking && (
        <div className="fixed inset-0 z-50 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            <Sparkles className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="font-mono text-emerald-300 font-semibold tracking-wider text-sm">{t('decrypting')}</p>
        </div>
      )}
    </div>
  );
};

