import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

interface WallpaperSuccessOverlayProps {
  show: boolean;
  message?: string;
  subMessage?: string;
  onClose?: () => void;
}

export const WallpaperSuccessOverlay: React.FC<WallpaperSuccessOverlayProps> = ({
  show,
  message = 'Wallpaper Set!',
  subMessage = 'Successfully set wallpaper',
  onClose,
}) => {
  useEffect(() => {
    if (show && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in select-none px-6 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center text-center max-w-xs sm:max-w-sm w-full animate-scale-in"
      >
        {/* Mint Green Disk with Inner Dark Ring & Checkmark */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#a7f3d0] shadow-[0_0_60px_rgba(34,197,94,0.55)] flex items-center justify-center transition-transform hover:scale-105">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[2.5px] border-[#047857] flex items-center justify-center text-[#047857]">
              <Check className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3.5]" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          {message}
        </h3>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-400 font-normal mb-8">
          {subMessage}
        </p>

        {/* OK action indicator */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 text-white/95 hover:text-white text-sm sm:text-base font-semibold py-2 px-6 rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>OK</span>
        </button>
      </div>
    </div>
  );
};

