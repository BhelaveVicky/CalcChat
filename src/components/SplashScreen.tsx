import React from 'react';
import { CCLogo, CalcChatTitle } from './CalcChatBrand';

interface SplashScreenProps {
  isFadingOut?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isFadingOut = false }) => {
  return (
    <div 
      className={`fixed inset-0 z-50 bg-[#f8fafc] flex flex-col items-center justify-center p-6 select-none transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Soft Ambient Radial Blue Glow Background */}
      <div className="absolute w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none -z-10 animate-pulse"></div>

      {/* Main Content Box */}
      <div className="flex flex-col items-center justify-center space-y-5 animate-in fade-in zoom-in-95 duration-700">
        
        {/* App CC Logo */}
        <div className="relative">
          <CCLogo className="h-28 w-28 drop-shadow-[0_10px_20px_rgba(0,168,255,0.2)]" />
        </div>

        {/* CalcChat Title */}
        <div>
          <CalcChatTitle size="xl" />
        </div>

        {/* WhatsApp/Telegram Style 3 Animated Dots */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce"></span>
        </div>

      </div>
    </div>
  );
};
