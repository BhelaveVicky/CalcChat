import React, { useState, useEffect } from 'react';
import {
  Sparkles, Settings as SettingsIcon, Delete, X, Trash2, Clock, Database,
  Volume2, Moon, Sun, Shield, Minus, Square, ExternalLink
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useSettings } from '../context/SettingsContext';
import { Settings as SettingsComponent } from './Settings';

// Format number with standard commas for thousands and period for decimal
const formatDisplayNumber = (val: string): string => {
  if (!val || val === 'Error' || val === 'NaN' || val === 'Infinity' || val === '-Infinity') return val || '0';
  if (val === '0') return '0';

  const parts = val.split('.');
  // Standard thousands grouping with commas: 1,234,567
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  if (parts.length > 1) {
    return integerPart + '.' + parts[1];
  }
  return integerPart;
};

// Play a subtle high-frequency mechanical tactile click sound
const playKeyClickSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);

    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, 100);
  } catch {}
};

export const Calculator: React.FC = () => {
  const { settings: vaultSettings, user, authUser, unlockVault } = useVault();
  const { settings: appSettings, history, addToHistory, clearHistory, updateSettings: updateAppSettings, t } = useSettings();

  const [display, setDisplay] = useState<string>('0');
  const [equation, setEquation] = useState<string>('');
  const [unlocking, setUnlocking] = useState<boolean>(false);
  const [isCalculated, setIsCalculated] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Sidebar Tabs (History vs Memory)
  const [sidebarTab, setSidebarTab] = useState<'history' | 'memory'>('history');

  // Memory list & active memory state
  const [memoryList, setMemoryList] = useState<Array<{ id: string; value: number; timestamp: string }>>(() => {
    try {
      const saved = localStorage.getItem('calc_memory_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [memoryValue, setMemoryValue] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('calc_memory_val');
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Mobile Drawer State
  const [showMobileDrawer, setShowMobileDrawer] = useState<boolean>(false);
  const [showPasscodeHintModal, setShowPasscodeHintModal] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('calc_memory_list', JSON.stringify(memoryList));
    localStorage.setItem('calc_memory_val', memoryValue.toString());
  }, [memoryList, memoryValue]);

  const triggerHaptic = () => {
    if (appSettings.soundEnabled) {
      playKeyClickSound();
    }
    if (appSettings.vibrationEnabled && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  };

  // Keyboard navigation & typing listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or modal
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleButtonClick(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleButtonClick('.');
      } else if (e.key === '+' || e.key === '-') {
        e.preventDefault();
        handleButtonClick(e.key);
      } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handleButtonClick('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleButtonClick('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleButtonClick('=');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleButtonClick('BACKSPACE');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleButtonClick('C');
      } else if (e.key === '%') {
        e.preventDefault();
        handleButtonClick('%');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Memory Actions
  const handleMemoryAction = (action: 'MC' | 'MR' | 'M+' | 'M-' | 'MS') => {
    triggerHaptic();
    const currentNum = parseFloat(display) || 0;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (action === 'MC') {
      // Memory Clear
      setMemoryValue(0);
      setMemoryList([]);
    } else if (action === 'MR') {
      // Memory Recall
      setDisplay(memoryValue.toString());
      setIsCalculated(true);
    } else if (action === 'MS') {
      // Memory Store
      setMemoryValue(currentNum);
      setMemoryList(prev => [{ id: Date.now().toString(), value: currentNum, timestamp: timeStr }, ...prev.slice(0, 19)]);
    } else if (action === 'M+') {
      // Memory Add
      const newVal = memoryValue + currentNum;
      setMemoryValue(newVal);
      setMemoryList(prev => [{ id: Date.now().toString(), value: newVal, timestamp: timeStr }, ...prev.slice(0, 19)]);
    } else if (action === 'M-') {
      // Memory Subtract
      const newVal = memoryValue - currentNum;
      setMemoryValue(newVal);
      setMemoryList(prev => [{ id: Date.now().toString(), value: newVal, timestamp: timeStr }, ...prev.slice(0, 19)]);
    }
  };

  const handleButtonClick = (val: string) => {
    triggerHaptic();

    // Clear All
    if (val === 'C') {
      setDisplay('0');
      setEquation('');
      setIsCalculated(false);
      return;
    }

    // Clear Entry (resets only the current display number to 0)
    if (val === 'CE') {
      setDisplay('0');
      setIsCalculated(false);
      return;
    }

    // Backspace / Delete
    if (val === 'BACKSPACE') {
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

    // Percent
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

    // Reciprocal 1/x
    if (val === '1/x') {
      const num = parseFloat(display);
      if (!isNaN(num) && num !== 0) {
        const res = (1 / num);
        const formatted = Math.round(res * 100000000) / 100000000;
        setEquation(`1/(${display})`);
        setDisplay(formatted.toString());
        setIsCalculated(true);
        saveCalculationToHistory(`1/(${display})`, formatted.toString());
      } else {
        setDisplay('Error');
        setTimeout(() => setDisplay('0'), 1200);
      }
      return;
    }

    // Square x²
    if (val === 'x²') {
      const num = parseFloat(display);
      if (!isNaN(num)) {
        const res = num * num;
        const formatted = Math.round(res * 100000000) / 100000000;
        setEquation(`sqr(${display})`);
        setDisplay(formatted.toString());
        setIsCalculated(true);
        saveCalculationToHistory(`sqr(${display})`, formatted.toString());
      }
      return;
    }

    // Square Root √x
    if (val === '√x') {
      const num = parseFloat(display);
      if (!isNaN(num) && num >= 0) {
        const res = Math.sqrt(num);
        const formatted = Math.round(res * 100000000) / 100000000;
        setEquation(`√(${display})`);
        setDisplay(formatted.toString());
        setIsCalculated(true);
        saveCalculationToHistory(`√(${display})`, formatted.toString());
      } else {
        setDisplay('Error');
        setTimeout(() => setDisplay('0'), 1200);
      }
      return;
    }

    // Plus/Minus Negate (+/-)
    if (val === '+/-') {
      if (display === '0') return;
      if (display.startsWith('-')) {
        setDisplay(display.slice(1));
      } else {
        setDisplay('-' + display);
      }
      return;
    }

    // Equals (=)
    if (val === '=') {
      if (isCalculated) return;

      // Check Secret Vault Passcode
      const savedLocalPass = authUser?.uid ? localStorage.getItem(`calcchat_passcode_${authUser.uid}`) : null;
      const activePasscode = (user?.passcode && user.passcode.trim()) || 
                             (vaultSettings?.passcode && vaultSettings.passcode.trim()) || 
                             (savedLocalPass && savedLocalPass.trim()) || 
                             '';

      if (activePasscode && (display === activePasscode || equation + display === activePasscode)) {
        setUnlocking(true);
        setTimeout(() => {
          unlockVault(activePasscode);
        }, 200);
        return;
      }

      // Normal Calculation
      try {
        let cleanEq = equation + display;
        // Normalize symbols to JS math
        const exprToSave = cleanEq;
        cleanEq = cleanEq.replace(/×/g, '*').replace(/÷/g, '/').replace(/–/g, '-');

        const res = new Function(`return ${cleanEq}`)();
        if (res !== undefined && !isNaN(res) && isFinite(res)) {
          const formatted = Math.round(res * 100000000) / 100000000;
          setEquation(exprToSave + ' =');
          setDisplay(formatted.toString());
          setIsCalculated(true);

          saveCalculationToHistory(exprToSave, formatted.toString());
        } else {
          setDisplay('Error');
          setTimeout(() => {
            setDisplay('0');
            setEquation('');
            setIsCalculated(false);
          }, 1500);
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

    // Math Operators: +, –, ×, ÷
    if (['+', '–', '-', '×', 'x', '÷', '/'].includes(val)) {
      const normalizedOp = val === '/' ? '÷' : val === '*' || val === 'x' ? '×' : val === '-' ? '–' : val;
      if (isCalculated) {
        setEquation(display + ' ' + normalizedOp + ' ');
        setDisplay('0');
        setIsCalculated(false);
      } else {
        setEquation(equation + display + ' ' + normalizedOp + ' ');
        setDisplay('0');
      }
      return;
    }

    // Decimal Point
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

    // Digits 0-9
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

  const saveCalculationToHistory = (expr: string, resultStr: string) => {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const time = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    addToHistory({
      expression: expr,
      result: resultStr,
      date,
      time,
    });
  };

  const handleSelectHistoryItem = (item: { expression: string; result: string }) => {
    triggerHaptic();
    setDisplay(item.result);
    setEquation(item.expression + ' =');
    setIsCalculated(true);
  };

  if (showSettings) {
    return <SettingsComponent onClose={() => setShowSettings(false)} />;
  }

  // Active user passcode for disguise tips
  const currentPasscode = user?.passcode || vaultSettings?.passcode || '1234';
  const isDark = appSettings.darkMode;

  return (
    <div className={`w-full h-full min-h-[100dvh] flex flex-col select-none transition-colors duration-200 ${
      isDark ? 'bg-[#191919] text-[#f5f5f5]' : 'bg-[#faf8f7] text-[#1f1f1f]'
    }`}>

      {/* ─── WINDOW TITLE BAR (Windows Desktop Style) ─── */}
      <div className={`w-full h-8 px-3 flex items-center justify-between shrink-0 select-none text-xs ${
        isDark ? 'bg-[#191919] text-[#a0a0a0] border-b border-[#292929]' : 'bg-[#faf8f7] text-[#5c5c5c]'
      }`}>
        {/* Left: Window Icon + App Title */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-[#ff5b48] flex items-center justify-center text-white text-[10px] font-bold shadow-xs">
            🧮
          </div>
          <span className="font-medium text-xs tracking-tight">Calculator</span>
        </div>

        {/* Right: Window Controls */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              setShowPasscodeHintModal(true);
            }}
            className={`w-10 h-8 flex items-center justify-center transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#2b2b2b] text-[#c0c0c0]' : 'hover:bg-gray-200/80 text-gray-700'
            }`}
            title="Minimize / Hint"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              } else {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            }}
            className={`w-10 h-8 flex items-center justify-center transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#2b2b2b] text-[#c0c0c0]' : 'hover:bg-gray-200/80 text-gray-700'
            }`}
            title="Maximize Window"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDisplay('0');
              setEquation('');
            }}
            className="w-11 h-8 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
            title="Close / Reset"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── APP SUB-HEADER (Standard Title, History/Memory Tabs, Settings) ─── */}
      <div className="w-full px-4 sm:px-6 pt-1 pb-1 flex items-center justify-between shrink-0">
        {/* Left: Mode Title & Passcode Quick View */}
        <div className="flex items-center gap-3">
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {t('calculator') || 'Calculator'}
          </h2>

          <button
            onClick={() => setShowPasscodeHintModal(true)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-[#888888] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]' : 'text-gray-400 hover:text-gray-700 hover:bg-[#f0ece9]'
            }`}
            title="Keep on top / Passcode Hint"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Desktop History / Memory Tab Switcher & Settings */}
        <div className="flex items-center gap-4">
          {/* Desktop Tabs */}
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <button
              onClick={() => setSidebarTab('history')}
              className={`py-1 relative transition-colors cursor-pointer ${
                sidebarTab === 'history'
                  ? isDark ? 'text-white font-bold' : 'text-gray-900 font-bold'
                  : isDark ? 'text-[#888888] hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              History
              {sidebarTab === 'history' && (
                <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#ff5b48] rounded-full shadow-xs" />
              )}
            </button>

            <button
              onClick={() => setSidebarTab('memory')}
              className={`py-1 relative transition-colors cursor-pointer ${
                sidebarTab === 'memory'
                  ? isDark ? 'text-white font-bold' : 'text-gray-900 font-bold'
                  : isDark ? 'text-[#888888] hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Memory
              {sidebarTab === 'memory' && (
                <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#ff5b48] rounded-full shadow-xs" />
              )}
            </button>
          </div>

          {/* Mobile History Drawer Button */}
          <button
            id="calc_mobile_history_btn"
            onClick={() => setShowMobileDrawer(true)}
            className={`md:hidden p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#2a2a2a] text-[#e0e0e0]' : 'hover:bg-[#f0ece9] text-gray-800'
            }`}
            title="View History"
          >
            <Clock className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Settings Button */}
          <button
            id="calc_settings_top_btn"
            onClick={() => setShowSettings(true)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#2a2a2a] text-[#a0a0a0] hover:text-white' : 'hover:bg-[#f0ece9] text-gray-500 hover:text-gray-800'
            }`}
            title="Settings"
          >
            <SettingsIcon className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* ─── MAIN RESPONSIVE FULL-SCREEN BODY (Keypad on Left, History on Right) ─── */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        
        {/* LEFT / MAIN CALCULATOR PANE */}
        <div className="flex-1 flex flex-col h-full min-h-0 px-3 sm:px-6 pb-3 pt-0 overflow-hidden">
          
          {/* Display Section: Sub-Equation and Big Number Display (Right-aligned) */}
          <div className="w-full flex flex-col justify-end items-end px-3 py-2 sm:py-4 shrink-0 min-h-[90px] sm:min-h-[120px]">
            {/* Previous Equation Expression */}
            <div className={`text-right text-sm sm:text-base font-medium truncate select-text min-h-[22px] ${
              isDark ? 'text-[#999999]' : 'text-gray-500'
            }`}>
              {equation || '\u00A0'}
            </div>

            {/* Main Result Display (Large Bold Windows Typography) */}
            <div className={`text-right text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight select-text truncate leading-tight transition-all duration-100 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {formatDisplayNumber(display)}
            </div>
          </div>

          {/* Memory Functions Bar: MC, MR, M+, M-, MS */}
          <div className="w-full grid grid-cols-5 gap-1 sm:gap-2 mb-2 px-1 shrink-0">
            {[
              { label: 'MC', action: 'MC' as const, title: 'Memory Clear' },
              { label: 'MR', action: 'MR' as const, title: 'Memory Recall' },
              { label: 'M+', action: 'M+' as const, title: 'Memory Add' },
              { label: 'M-', action: 'M-' as const, title: 'Memory Subtract' },
              { label: 'MS', action: 'MS' as const, title: 'Memory Store' },
            ].map(item => {
              const hasMem = memoryValue !== 0 || memoryList.length > 0;
              const isEnabled = (item.label === 'MR' || item.label === 'MC') ? hasMem : true;

              return (
                <button
                  key={item.label}
                  onClick={() => handleMemoryAction(item.action)}
                  className={`py-1.5 text-center font-semibold text-xs sm:text-sm tracking-wide rounded-lg transition-all active:scale-90 cursor-pointer ${
                    isEnabled
                      ? isDark
                        ? 'text-[#e0e0e0] hover:bg-[#282828]'
                        : 'text-gray-700 hover:bg-[#eae5e2]'
                      : isDark
                      ? 'text-[#555555] cursor-not-allowed opacity-40'
                      : 'text-gray-400 cursor-not-allowed opacity-40'
                  } ${
                    (item.label === 'MR' || item.label === 'MC') && hasMem
                      ? 'text-[#ff5b48] font-bold'
                      : ''
                  }`}
                  title={item.title}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* ─── FULL KEYPAD GRID (6 Rows × 4 Columns, Image 2 Layout + Image 1 Color Palette) ─── */}
          <div className="flex-1 grid grid-cols-4 grid-rows-6 gap-1.5 sm:gap-2 w-full min-h-0">
            
            {/* ROW 1: %, CE, C, ⌫ */}
            <button
              onClick={() => handleButtonClick('%')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-medium text-base sm:text-lg flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2d2d2d] border-[#303030] text-zinc-100'
                  : 'bg-white hover:bg-[#fff6f4] hover:border-[#ff5b48]/30 border-gray-200/80 text-gray-800 shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
              }`}
            >
              %
            </button>

            <button
              onClick={() => handleButtonClick('CE')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2d2d2d] border-[#303030] text-zinc-100'
                  : 'bg-white hover:bg-[#fff6f4] hover:border-[#ff5b48]/30 border-gray-200/80 text-gray-800 shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
              }`}
              title="Clear Entry"
            >
              CE
            </button>

            <button
              onClick={() => handleButtonClick('C')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2d2d2d] border-[#303030] text-zinc-100'
                  : 'bg-white hover:bg-[#fff6f4] hover:border-[#ff5b48]/30 border-gray-200/80 text-gray-800 shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
              }`}
              title="Clear All"
            >
              C
            </button>

            {/* ⌫ Delete / Backspace Button */}
            <button
              onClick={() => handleButtonClick('BACKSPACE')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2d2d2d] border-[#303030] text-[#ff6b58]'
                  : 'bg-white hover:bg-[#fff6f4] hover:border-[#ff5b48]/40 border-gray-200/80 text-[#ff5b48] shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
              }`}
              title="Backspace"
            >
              <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* ROW 2: 1/x, x², √x, ÷ */}
            <button
              onClick={() => handleButtonClick('1/x')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-medium text-sm sm:text-base italic flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2d2d2d] border-[#303030] text-zinc-100'
                  : 'bg-white hover:bg-[#fff6f4] hover:border-[#ff5b48]/30 border-gray-200/80 text-gray-800 shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
              }`}
              title="Reciprocal"
            >
              ¹/x
            </button>

            <button
              onClick={() => handleButtonClick('x²')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-medium text-sm sm:text-base italic flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2d2d2d] border-[#303030] text-zinc-100'
                  : 'bg-white hover:bg-[#fff6f4] hover:border-[#ff5b48]/30 border-gray-200/80 text-gray-800 shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
              }`}
              title="Square"
            >
              x²
            </button>

            <button
              onClick={() => handleButtonClick('√x')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-medium text-sm sm:text-base italic flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2d2d2d] border-[#303030] text-zinc-100'
                  : 'bg-white hover:bg-[#fff6f4] hover:border-[#ff5b48]/30 border-gray-200/80 text-gray-800 shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
              }`}
              title="Square Root"
            >
              ²√x
            </button>

            {/* Divide Operator ÷ */}
            <button
              onClick={() => handleButtonClick('÷')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-medium text-2xl flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#262626] hover:bg-[#333333] border-[#363636] text-[#ff6b58]'
                  : 'bg-[#faf6f4] hover:bg-[#ffece8] hover:border-[#ff5b48]/40 border-gray-200/90 text-[#ff5b48] font-bold'
              }`}
              title="Divide"
            >
              ÷
            </button>

            {/* ROW 3: 7, 8, 9, × */}
            {['7', '8', '9'].map(num => (
              <button
                key={num}
                onClick={() => handleButtonClick(num)}
                className={`w-full h-full rounded-xl sm:rounded-2xl font-semibold text-lg sm:text-xl md:text-2xl flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                  isDark
                    ? 'bg-[#2b2b2b] hover:bg-[#383838] border-[#383838] text-white'
                    : 'bg-white hover:bg-[#fff7f5] hover:border-[#ff5b48]/40 border-gray-200/90 text-gray-900 shadow-[0_2px_6px_rgba(0,0,0,0.03)]'
                }`}
              >
                {num}
              </button>
            ))}
            {/* Multiply Operator × */}
            <button
              onClick={() => handleButtonClick('×')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-medium text-2xl flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#262626] hover:bg-[#333333] border-[#363636] text-[#ff6b58]'
                  : 'bg-[#faf6f4] hover:bg-[#ffece8] hover:border-[#ff5b48]/40 border-gray-200/90 text-[#ff5b48] font-bold'
              }`}
              title="Multiply"
            >
              ×
            </button>

            {/* ROW 4: 4, 5, 6, − */}
            {['4', '5', '6'].map(num => (
              <button
                key={num}
                onClick={() => handleButtonClick(num)}
                className={`w-full h-full rounded-xl sm:rounded-2xl font-semibold text-lg sm:text-xl md:text-2xl flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                  isDark
                    ? 'bg-[#2b2b2b] hover:bg-[#383838] border-[#383838] text-white'
                    : 'bg-white hover:bg-[#fff7f5] hover:border-[#ff5b48]/40 border-gray-200/90 text-gray-900 shadow-[0_2px_6px_rgba(0,0,0,0.03)]'
                }`}
              >
                {num}
              </button>
            ))}
            {/* Subtract Operator − */}
            <button
              onClick={() => handleButtonClick('–')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-medium text-2xl flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#262626] hover:bg-[#333333] border-[#363636] text-[#ff6b58]'
                  : 'bg-[#faf6f4] hover:bg-[#ffece8] hover:border-[#ff5b48]/40 border-gray-200/90 text-[#ff5b48] font-bold'
              }`}
              title="Subtract"
            >
              −
            </button>

            {/* ROW 5: 1, 2, 3, + */}
            {['1', '2', '3'].map(num => (
              <button
                key={num}
                onClick={() => handleButtonClick(num)}
                className={`w-full h-full rounded-xl sm:rounded-2xl font-semibold text-lg sm:text-xl md:text-2xl flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                  isDark
                    ? 'bg-[#2b2b2b] hover:bg-[#383838] border-[#383838] text-white'
                    : 'bg-white hover:bg-[#fff7f5] hover:border-[#ff5b48]/40 border-gray-200/90 text-gray-900 shadow-[0_2px_6px_rgba(0,0,0,0.03)]'
                }`}
              >
                {num}
              </button>
            ))}
            {/* Add Operator + */}
            <button
              onClick={() => handleButtonClick('+')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-medium text-2xl flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#262626] hover:bg-[#333333] border-[#363636] text-[#ff6b58]'
                  : 'bg-[#faf6f4] hover:bg-[#ffece8] hover:border-[#ff5b48]/40 border-gray-200/90 text-[#ff5b48] font-bold'
              }`}
              title="Add"
            >
              +
            </button>

            {/* ROW 6: +/-, 0, ., = */}
            <button
              onClick={() => handleButtonClick('+/-')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-medium text-base sm:text-lg flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2d2d2d] border-[#303030] text-zinc-100'
                  : 'bg-white hover:bg-[#fff6f4] hover:border-[#ff5b48]/30 border-gray-200/80 text-gray-800 shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
              }`}
              title="Plus/Minus Negate"
            >
              +/-
            </button>

            <button
              onClick={() => handleButtonClick('0')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-semibold text-lg sm:text-xl md:text-2xl flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#2b2b2b] hover:bg-[#383838] border-[#383838] text-white'
                  : 'bg-white hover:bg-[#fff7f5] hover:border-[#ff5b48]/40 border-gray-200/90 text-gray-900 shadow-[0_2px_6px_rgba(0,0,0,0.03)]'
              }`}
            >
              0
            </button>

            <button
              onClick={() => handleButtonClick('.')}
              className={`w-full h-full rounded-xl sm:rounded-2xl font-bold text-2xl flex items-center justify-center transition-all duration-100 active:scale-[0.98] border cursor-pointer ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2d2d2d] border-[#303030] text-zinc-100'
                  : 'bg-white hover:bg-[#fff6f4] hover:border-[#ff5b48]/30 border-gray-200/80 text-gray-800 shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
              }`}
            >
              .
            </button>

            {/* ═══ EQUALS BUTTON (=) with Signature Coral / Salmon Red Color (Image 1) ═══ */}
            <button
              id="calc_equals_btn"
              onClick={() => handleButtonClick('=')}
              className="w-full h-full rounded-xl sm:rounded-2xl font-bold text-2xl sm:text-3xl flex items-center justify-center transition-all duration-100 active:scale-[0.98] text-white bg-gradient-to-r from-[#ff624c] via-[#ff563e] to-[#ff472e] hover:from-[#ff6e5a] hover:to-[#ff533c] shadow-[0_4px_16px_rgba(255,86,62,0.38)] cursor-pointer"
              title="Calculate / Unlock Vault"
            >
              =
            </button>

          </div>
        </div>

        {/* ─── RIGHT DESKTOP SIDEBAR (History & Memory) ─── */}
        <div className={`hidden md:flex md:w-80 lg:w-96 xl:w-[420px] flex-col h-full border-l transition-colors duration-200 shrink-0 ${
          isDark ? 'bg-[#191919] border-[#292929] text-zinc-100' : 'bg-[#faf8f7] border-[#eee8e5] text-gray-800'
        }`}>
          
          {/* History / Memory Content List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col justify-between">
            
            {/* HISTORY TAB CONTENT */}
            {sidebarTab === 'history' && (
              <div className="flex-1 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-zinc-500 text-center">
                    <Clock className="w-10 h-10 stroke-[1.5] mb-2 opacity-30 text-[#ff5b48]" />
                    <p className="text-sm font-medium">There's no history yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectHistoryItem(item)}
                        className="group flex flex-col items-end pb-3 border-b border-gray-200/60 dark:border-zinc-800/80 hover:opacity-80 transition-opacity cursor-pointer text-right"
                        title="Click to load into calculator"
                      >
                        {/* Expression */}
                        <div className="text-xs sm:text-sm text-gray-400 dark:text-zinc-400 font-medium select-text">
                          {item.expression}
                        </div>
                        {/* Result in large bold font */}
                        <div className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight select-text mt-0.5 group-hover:text-[#ff5b48] transition-colors">
                          {formatDisplayNumber(item.result)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MEMORY TAB CONTENT */}
            {sidebarTab === 'memory' && (
              <div className="flex-1 overflow-y-auto pr-1">
                {memoryList.length === 0 && memoryValue === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-zinc-500 text-center">
                    <Database className="w-10 h-10 stroke-[1.5] mb-2 opacity-30 text-[#ff5b48]" />
                    <p className="text-sm font-medium">There's nothing saved in memory.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memoryList.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-2xl bg-white dark:bg-zinc-800/80 border border-gray-200/80 dark:border-zinc-700/60 shadow-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                            {formatDisplayNumber(item.value.toString())}
                          </div>
                          <div className="text-[11px] text-gray-400 dark:text-zinc-500">
                            {item.timestamp}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            triggerHaptic();
                            setDisplay(item.value.toString());
                            setIsCalculated(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#fff1ee] dark:bg-zinc-700 text-[#ff5b48] dark:text-[#ff7a6b] hover:bg-[#ffe5e0] transition-colors cursor-pointer"
                          title="Recall into display"
                        >
                          MR
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Clear History / Memory Trash Button */}
            <div className="pt-3 pb-1 flex items-center justify-between border-t border-gray-200/70 dark:border-zinc-800/80 shrink-0">
              <button
                id="calc_clear_history_btn"
                onClick={() => {
                  triggerHaptic();
                  if (sidebarTab === 'history') {
                    clearHistory();
                  } else {
                    setMemoryList([]);
                    setMemoryValue(0);
                  }
                }}
                className="p-2 text-[#ff5b48] hover:bg-[#ffece8] dark:hover:bg-rose-950/40 rounded-xl transition-all active:scale-95 cursor-pointer"
                title={sidebarTab === 'history' ? 'Clear Calculation History' : 'Clear Memory'}
              >
                <Trash2 className="w-4.5 h-4.5 stroke-[2]" />
              </button>

              <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                {sidebarTab === 'history' ? `${history.length} calculations` : `${memoryList.length} stored`}
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* ─── MOBILE DRAWER (History & Memory) ─── */}
      {showMobileDrawer && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-5/6 max-w-sm h-full bg-white dark:bg-[#18181b] shadow-2xl flex flex-col animate-slide-up">
            
            {/* Mobile Drawer Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-5">
                <button
                  onClick={() => setSidebarTab('history')}
                  className={`text-sm font-semibold pb-1 relative ${
                    sidebarTab === 'history' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400'
                  }`}
                >
                  History
                  {sidebarTab === 'history' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff5b48] rounded-full"></div>
                  )}
                </button>

                <button
                  onClick={() => setSidebarTab('memory')}
                  className={`text-sm font-semibold pb-1 relative ${
                    sidebarTab === 'memory' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400'
                  }`}
                >
                  Memory
                  {sidebarTab === 'memory' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff5b48] rounded-full"></div>
                  )}
                </button>
              </div>

              <button
                onClick={() => setShowMobileDrawer(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {sidebarTab === 'history' ? (
                history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center">
                    <Clock className="w-8 h-8 opacity-40 mb-2 text-[#ff5b48]" />
                    <p className="text-sm">There's no history yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          handleSelectHistoryItem(item);
                          setShowMobileDrawer(false);
                        }}
                        className="flex flex-col items-end pb-3 border-b border-gray-100 dark:border-zinc-800 text-right cursor-pointer"
                      >
                        <div className="text-xs text-gray-400">{item.expression}</div>
                        <div className="text-xl font-bold text-gray-800 dark:text-zinc-100">
                          {formatDisplayNumber(item.result)}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                memoryList.length === 0 && memoryValue === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center">
                    <Database className="w-8 h-8 opacity-40 mb-2 text-[#ff5b48]" />
                    <p className="text-sm">There's nothing saved in memory.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memoryList.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        onClick={() => {
                          setDisplay(item.value.toString());
                          setIsCalculated(true);
                          setShowMobileDrawer(false);
                        }}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-between cursor-pointer"
                      >
                        <span className="text-base font-bold text-gray-900 dark:text-zinc-100">
                          {formatDisplayNumber(item.value.toString())}
                        </span>
                        <span className="text-xs text-gray-400">{item.timestamp}</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Mobile Drawer Bottom Trash button */}
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <button
                onClick={() => {
                  triggerHaptic();
                  if (sidebarTab === 'history') clearHistory();
                  else {
                    setMemoryList([]);
                    setMemoryValue(0);
                  }
                }}
                className="p-2 text-[#ff5b48] hover:bg-[#ffece8] dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear {sidebarTab === 'history' ? 'History' : 'Memory'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── PASSCODE HINT MODAL ─── */}
      {showPasscodeHintModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-zinc-800 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-[#ff5b48]/10 text-[#ff5b48] flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-1">
              Secret Chat Vault
            </h3>
            <p className="text-xs text-center text-gray-500 dark:text-zinc-400 mb-4">
              Your secret passcode unlocks encrypted chats, status updates, calls, and settings.
            </p>

            <div className="bg-[#fff3f0] dark:bg-[#2e1c18] border border-[#ffcdb4] dark:border-[#5c2e24] rounded-2xl p-4 text-center mb-5">
              <span className="text-xs text-[#ff5b48] font-semibold block mb-1">
                Your Secret Passcode
              </span>
              <span className="font-mono text-2xl font-black text-[#ff5b48] dark:text-[#ff7e6f] tracking-widest">
                {currentPasscode}=
              </span>
              <span className="text-[11px] text-gray-600 dark:text-zinc-400 block mt-1">
                (Type <strong className="font-mono text-[#ff5b48]">{currentPasscode}</strong> and press <strong className="font-mono text-[#ff5b48]">=</strong> on the calculator)
              </span>
            </div>

            <button
              onClick={() => setShowPasscodeHintModal(false)}
              className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ─── UNLOCKING VAULT TRANSITION OVERLAY ─── */}
      {unlocking && (
        <div className="fixed inset-0 z-50 bg-[#121212]/95 backdrop-blur-md flex flex-col items-center justify-center gap-4 animate-fade-in select-none">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#ff5b48] border-t-transparent animate-spin"></div>
            <Sparkles className="w-6 h-6 text-[#ff5b48] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="font-mono text-[#ff8070] font-semibold tracking-wider text-sm">{t('decrypting')}</p>
        </div>
      )}

    </div>
  );
};
