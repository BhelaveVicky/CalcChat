import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Shield, Smartphone, Maximize2, Minimize2 } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const AndroidFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSettings, lockVault, isUnlocked } = useVault();
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const toggleFrame = () => {
    updateSettings({ showAndroidFrame: !settings.showAndroidFrame });
  };

  if (!settings.showAndroidFrame) {
    return (
      <div className="h-[100dvh] bg-[#0b141a] text-[#e9edef] flex flex-col relative font-sans w-full overflow-hidden select-none">
        <div className="flex-1 flex flex-col w-full h-full overflow-hidden min-h-0">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-6 font-sans select-none overflow-x-hidden w-full">
      {/* Top Controller Bar */}
      <div className="w-full max-w-sm my-2 flex items-center justify-between px-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-slate-300 text-[11px] sm:text-xs">Vault Active</span>
        </div>
        <div className="flex items-center gap-2">
          {isUnlocked && (
            <button
              onClick={lockVault}
              className="flex items-center gap-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-2 py-1 rounded-md transition-colors border border-rose-500/30 text-[11px] sm:text-xs"
            >
              <Shield className="w-3 h-3" />
              Lock
            </button>
          )}
          <button
            onClick={toggleFrame}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md transition-colors border border-slate-700 text-[11px] sm:text-xs"
            title="Expand to Full Responsive View"
          >
            <Maximize2 className="w-3 h-3 text-emerald-400" />
            Full Screen
          </button>
        </div>
      </div>

      {/* Android Device Mockup Shell - Full width/height on mobile, Framed mockup on tablet/desktop */}
      <div className="relative w-full h-[calc(100dvh-48px)] sm:h-[840px] sm:max-h-[90vh] sm:max-w-[420px] bg-black rounded-none sm:rounded-[46px] p-0 sm:p-[11px] shadow-none sm:shadow-[0_0_50px_-12px_rgba(16,185,129,0.25)] border-0 sm:border-[4px] border-slate-800 flex flex-col overflow-hidden">
        {/* Hardware side buttons simulation (hidden on mobile) */}
        <div className="hidden sm:block absolute -right-[15px] top-[180px] w-[4px] h-[45px] bg-slate-700 rounded-r-md"></div>
        <div className="hidden sm:block absolute -right-[15px] top-[240px] w-[4px] h-[90px] bg-slate-700 rounded-r-md"></div>
        
        {/* Inner AMOLED Screen */}
        <div className="relative w-full h-full bg-slate-950 rounded-none sm:rounded-[36px] overflow-hidden flex flex-col border-0 sm:border border-slate-900/80 shadow-inner">
          
          {/* Android Status Bar */}
          <div className="w-full h-8 px-6 pt-1 flex items-center justify-between text-slate-200 text-xs font-medium z-40 bg-transparent shrink-0">
            {/* Left: Time & notification icon */}
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight">{currentTime}</span>
              <Shield className="w-3 h-3 text-emerald-500 opacity-80" />
            </div>

            {/* Center: Punch Hole Camera Cutout */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 w-4 h-4 bg-black rounded-full border border-slate-800/80 flex items-center justify-center pointer-events-none">
              <div className="w-1.5 h-1.5 bg-slate-900 rounded-full border border-slate-800"></div>
            </div>

            {/* Right: Status Icons */}
            <div className="flex items-center gap-1.5 text-slate-300">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5 ml-0.5">
                <span className="text-[10px] font-mono">88%</span>
                <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              </div>
            </div>
          </div>

          {/* App Body Viewport */}
          <div className="flex-1 w-full h-full overflow-hidden flex flex-col relative">
            {children}
          </div>

          {/* Android Bottom Navigation Bar */}
          <div className="w-full h-11 bg-black/90 backdrop-blur border-t border-slate-900/60 flex items-center justify-around px-8 text-slate-400 shrink-0 z-40">
            {/* Back Button */}
            <button
              onClick={() => {
                if (isUnlocked) {
                  // If in chat window, back to chat list
                  const backBtn = document.getElementById('vault_nav_back_trigger');
                  if (backBtn) backBtn.click();
                }
              }}
              className="p-2 hover:text-white hover:bg-white/5 rounded-full transition-colors active:scale-95"
              title="Android Back"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>

            {/* Home Pill / Button */}
            <button
              onClick={() => {
                if (isUnlocked) lockVault();
              }}
              className="p-2 hover:text-white hover:bg-white/5 rounded-full transition-colors active:scale-95"
              title="Android Home (Return to Calculator)"
            >
              <div className="w-4 h-4 rounded-full border-2 border-currentColor"></div>
            </button>

            {/* App Switcher / Recents */}
            <button
              onClick={() => {
                // Hint for passcode
                alert(`🔐 Disguise Hint:\nDefault Passcode is "${settings.passcode}" followed by "="\n\nExample: Type 1234= to enter secret chat vault.`);
              }}
              className="p-2 hover:text-white hover:bg-white/5 rounded-full transition-colors active:scale-95"
              title="Android Recents (Show Passcode Hint)"
            >
              <div className="w-3.5 h-3.5 rounded-sm border-2 border-currentColor"></div>
            </button>
          </div>

        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3 text-center text-xs text-slate-500 max-w-sm">
        💡 <span className="text-slate-400">Tip:</span> Type passcode <strong className="text-emerald-400 font-mono">{settings.passcode}=</strong> on the calculator to unlock secret chats.
      </div>
    </div>
  );
};
