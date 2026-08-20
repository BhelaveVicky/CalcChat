import React, { useState, useEffect } from 'react';
import { Lock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onComplete: () => Promise<void>;
}

export const OnboardingTutorialModal: React.FC<OnboardingTutorialModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [countdown, setCountdown] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNextClick = async () => {
    if (countdown > 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onComplete();
    } catch (err) {
      console.error('Failed to complete onboarding tutorial:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-[#0b141a]/95 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#111b21] border border-[#202c33] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#182229] via-[#202c33] to-[#182229] border-b border-[#202c33] flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff2e93] to-[#ea4c89] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>CalcChat</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff2e93]/20 text-[#ff2e93] border border-[#ff2e93]/40 uppercase tracking-widest">
                  Important Guide
                </span>
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>First Time Setup</span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Main Title & Subtitle matching user provided image text */}
          <div className="text-center space-y-1.5 select-none">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center justify-center gap-2">
              <span>Yeh sirf <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2e93] to-[#ea4c89]">Calculator</span> nahi hai!</span>
              <Lock className="w-5 h-5 text-amber-400 inline shrink-0 animate-bounce" />
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-medium max-w-md mx-auto leading-relaxed">
              Apko isme ek <span className="text-pink-400 font-bold">Secret Code (Password)</span> dalna hai aur phir aapka <span className="text-emerald-400 font-bold">Chat App</span> open hoga.
            </p>
          </div>

          {/* Tutorial Image Container */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 group transition-all">
            <img
              src="/onboarding-guide.png"
              alt="CalcChat Secret Guide"
              className="w-full h-auto object-contain max-h-[52vh] mx-auto transition-transform duration-500 group-hover:scale-[1.01]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/default-chat-bg.jpg';
              }}
            />
          </div>

          {/* Quick Tip Box */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 text-amber-200 text-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
              💡
            </div>
            <p className="leading-snug">
              <strong className="text-amber-300">Tip:</strong> Yeh sirf aapke liye hai. Apna password kisi ke saath share mat kare!
            </p>
          </div>
        </div>

        {/* Bottom Fixed Action Footer with 10s Countdown Next Button */}
        <div className="p-4 bg-[#182229] border-t border-[#202c33] flex flex-col gap-2 shrink-0 select-none">
          <button
            type="button"
            disabled={countdown > 0 || isSubmitting}
            onClick={handleNextClick}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 ${
              countdown > 0
                ? 'bg-slate-800 text-slate-400 border border-slate-700/60 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-[#ff2e93] via-[#ea4c89] to-[#3b82f6] text-white shadow-[0_0_30px_rgba(255,46,147,0.6)] hover:opacity-95 active:scale-98 cursor-pointer'
            }`}
          >
            {countdown > 0 ? (
              <>
                <span className="font-mono bg-slate-900/90 text-pink-400 px-2.5 py-0.5 rounded-full text-xs border border-pink-500/40 font-bold animate-pulse">
                  Wait {countdown}s
                </span>
                <span>Next</span>
              </>
            ) : isSubmitting ? (
              <span>Opening Calculator...</span>
            ) : (
              <>
                <span>Next / Start App</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-gray-400">
            {countdown > 0 ? `Please view the guide above. Next button unlocks in ${countdown} seconds.` : 'Click Next to continue to Calculator Chat!'}
          </p>
        </div>

      </div>
    </div>
  );
};
