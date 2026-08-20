import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

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

  const progressPercentage = ((10 - countdown) / 10) * 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-md md:max-w-lg bg-gradient-to-b from-[#fbf7ff] via-[#f7f0fe] to-[#f2e7fe] border border-purple-200/80 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col my-auto max-h-[95vh] text-slate-800">
        
        {/* Top Header Card */}
        <div className="px-4 py-3 bg-white/80 backdrop-blur-md border-b border-purple-100 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ec4899] to-[#d946ef] flex items-center justify-center text-white shadow-md">
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0-2-.9-2-2V4c0-1.1-.9-2-2-2zm-3 9h-2v2h-2v-2H7V9h4V7h2v2h4v2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-extrabold bg-gradient-to-r from-[#d946ef] to-[#ec4899] bg-clip-text text-transparent tracking-tight">
                CalcChat
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-purple-700 font-bold bg-purple-100/90 px-3 py-1 rounded-full border border-purple-200 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Guide & Tutorial</span>
          </div>
        </div>

        {/* Scrollable Infographic Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          
          {/* Main Title & Description matching User Image */}
          <div className="text-center space-y-1.5 select-none pt-1">
            <div className="inline-flex items-center justify-center gap-1.5 mb-0.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#ec4899] to-[#d946ef] flex items-center justify-center text-white shadow-xs">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0-2-.9-2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <span className="font-extrabold text-sm text-slate-800 tracking-wide">CalcChat</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5 flex-wrap">
              <span>Yeh sirf</span>
              <span className="text-[#ec4899]">Calculator</span>
              <span>nahi hai!</span>
              <span className="inline-block text-xl">🔒</span>
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-sm mx-auto leading-relaxed">
              Apko isme ek <span className="text-purple-600 font-bold">Secret Code (Password)</span> dalna hai aur phir aapka <span className="text-[#ec4899] font-bold">Chat App</span> open hoga.
            </p>
          </div>

          {/* Central Phone Mockup & Callout Infographic */}
          <div className="relative bg-gradient-to-b from-[#f3e8ff]/80 to-[#fae8ff]/80 border border-purple-200/90 rounded-3xl p-3 sm:p-4 shadow-sm overflow-hidden select-none">
            
            {/* Soft decorative background glows */}
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-purple-300/30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-pink-300/30 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-center justify-between gap-1 sm:gap-2">
              
              {/* Left Side Callout 1 & 3D Lock */}
              <div className="flex flex-col items-center gap-3 w-28 sm:w-32 shrink-0">
                <div className="bg-white/95 backdrop-blur-xs border border-pink-200 text-[#ec4899] text-[11px] sm:text-xs font-bold px-2.5 py-1.5 rounded-2xl shadow-sm flex items-center gap-1.5 text-center leading-tight">
                  <span className="w-4 h-4 rounded-full bg-[#ec4899] text-white flex items-center justify-center text-[10px] shrink-0 font-extrabold">1</span>
                  <span>Apna Secret Password dalen</span>
                </div>

                {/* 3D Blue/Purple Lock Graphic */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#3b82f6] via-[#6366f1] to-[#a855f7] p-0.5 shadow-lg shadow-indigo-400/30 flex items-center justify-center transform -rotate-6 transition-transform hover:rotate-0">
                  <div className="w-full h-full bg-gradient-to-b from-[#4f46e5] to-[#3b82f6] rounded-2xl flex flex-col items-center justify-center text-white relative">
                    <div className="w-6 h-5 border-3 border-amber-300 rounded-t-full -mt-2 bg-transparent" />
                    <div className="w-8 h-7 bg-amber-400 rounded-lg shadow-inner flex items-center justify-center">
                      <div className="w-1.5 h-2.5 bg-amber-900 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Phone Mockup with Calculator Keypad */}
              <div className="w-36 sm:w-40 bg-[#1e293b] rounded-[26px] p-2 border-2 border-slate-700 shadow-2xl shadow-purple-900/20 shrink-0">
                {/* Phone Status Bar */}
                <div className="flex justify-between items-center px-1.5 pb-1 text-[8px] text-slate-400 font-mono">
                  <span>9:30</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Phone Screen Display showing masked dots */}
                <div className="bg-[#0f172a] rounded-xl p-2 mb-2 border border-slate-800 text-right">
                  <div className="flex justify-center items-center gap-1.5 py-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#ec4899] animate-pulse"></span>
                    <span className="w-2 h-2 rounded-full bg-[#ec4899] animate-pulse delay-75"></span>
                    <span className="w-2 h-2 rounded-full bg-[#ec4899] animate-pulse delay-150"></span>
                    <span className="w-2 h-2 rounded-full bg-[#ec4899] animate-pulse delay-300"></span>
                  </div>
                </div>

                {/* Mini Calculator Grid */}
                <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-center text-slate-200">
                  <span className="p-1 rounded bg-slate-800 text-slate-400">C</span>
                  <span className="p-1 rounded bg-slate-800 text-slate-400">()</span>
                  <span className="p-1 rounded bg-slate-800 text-slate-400">%</span>
                  <span className="p-1 rounded bg-[#ec4899] text-white">÷</span>

                  <span className="p-1 rounded bg-slate-800">7</span>
                  <span className="p-1 rounded bg-slate-800">8</span>
                  <span className="p-1 rounded bg-slate-800">9</span>
                  <span className="p-1 rounded bg-[#ec4899] text-white">×</span>

                  <span className="p-1 rounded bg-slate-800">4</span>
                  <span className="p-1 rounded bg-slate-800">5</span>
                  <span className="p-1 rounded bg-slate-800">6</span>
                  <span className="p-1 rounded bg-[#ec4899] text-white">-</span>

                  <span className="p-1 rounded bg-slate-800">1</span>
                  <span className="p-1 rounded bg-slate-800">2</span>
                  <span className="p-1 rounded bg-slate-800">3</span>
                  <span className="p-1 rounded bg-[#ec4899] text-white">+</span>

                  <span className="p-1 rounded bg-slate-800">0</span>
                  <span className="p-1 rounded bg-slate-800">.</span>
                  <span className="col-span-2 p-1 rounded bg-gradient-to-r from-[#ec4899] to-[#f43f5e] text-white font-extrabold text-[11px] shadow-sm shadow-pink-500/50 flex items-center justify-center">
                    =
                  </span>
                </div>
              </div>

              {/* Right Side Callouts (Step 2 and Step 3) */}
              <div className="flex flex-col items-center gap-2.5 w-28 sm:w-32 shrink-0">
                <div className="bg-white/95 backdrop-blur-xs border border-purple-200 text-purple-700 text-[11px] sm:text-xs font-bold px-2.5 py-1.5 rounded-2xl shadow-sm flex items-center gap-1.5 text-center leading-tight">
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] shrink-0 font-extrabold">2</span>
                  <span>"=" (Equal) Button dabaye</span>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 text-[11px] sm:text-xs font-bold px-2.5 py-1.5 rounded-2xl shadow-sm flex items-center gap-1.5 text-center leading-tight">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-extrabold">3</span>
                  <span>CalcChat Open ho jayega! 🎉</span>
                </div>
              </div>

            </div>
          </div>

          {/* Section Divider: "Kaise Use Kare?" */}
          <div className="relative flex items-center justify-center my-1 select-none">
            <div className="border-t border-purple-200 w-full" />
            <span className="bg-[#ede9fe] text-purple-900 font-extrabold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider border border-purple-300 shadow-xs shrink-0 mx-2">
              Kaise Use Kare?
            </span>
            <div className="border-t border-purple-200 w-full" />
          </div>

          {/* 3 Step Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 select-none">
            
            {/* Step 1 */}
            <div className="bg-white/90 border border-purple-100 rounded-2xl p-3 shadow-xs hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <div className="w-6 h-6 rounded-full bg-[#ec4899] text-white font-extrabold text-xs flex items-center justify-center mb-1.5 shadow-xs">
                1
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-pink-400 flex flex-col items-center justify-center gap-0.5 mb-1.5 border border-slate-800 shadow-inner">
                <div className="flex gap-1">
                  <span className="w-1 h-1 rounded-full bg-pink-400"></span>
                  <span className="w-1 h-1 rounded-full bg-pink-400"></span>
                  <span className="w-1 h-1 rounded-full bg-pink-400"></span>
                </div>
                <span className="text-[8px] font-mono text-slate-400">1 2 3</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-0.5">Password dalen</h4>
              <p className="text-[11px] text-slate-600 leading-snug">
                Jo aapka secret code hai, use calculator me dalen.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white/90 border border-purple-100 rounded-2xl p-3 shadow-xs hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center mb-1.5 shadow-xs">
                2
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center font-black text-xl mb-1.5 shadow-md shadow-pink-500/20">
                =
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-0.5">"=" Dabaye</h4>
              <p className="text-[11px] text-slate-600 leading-snug">
                Equal button dabate hi app open hoga.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white/90 border border-purple-100 rounded-2xl p-3 shadow-xs hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center mb-1.5 shadow-xs">
                3
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ec4899] via-[#d946ef] to-[#3b82f6] text-white flex items-center justify-center mb-1.5 shadow-md shadow-purple-500/20">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0-2-.9-2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-0.5">Chat Shuru</h4>
              <p className="text-[11px] text-slate-600 leading-snug">
                Aapka private chat screen open ho jayega.
              </p>
            </div>

          </div>

          {/* Tip Banner matching the second image */}
          <div className="p-3 rounded-2xl bg-[#fffbeb] border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-200/70 border border-amber-300 flex items-center justify-center shrink-0 text-base shadow-xs">
                💡
              </div>
              <p className="leading-snug text-[11px] sm:text-xs">
                <strong className="text-amber-950 font-bold">Tip:</strong> Yeh sirf aapke liye hai. Apna code kisi ke saath share mat kare.
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
          </div>

        </div>

        {/* Bottom Fixed Action Footer with Live 10-Second Countdown Next Button */}
        <div className="p-4 bg-white/95 border-t border-purple-100 flex flex-col gap-2 shrink-0 select-none shadow-md">
          
          {/* Animated 10s Timer Progress Bar */}
          {countdown > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-semibold text-purple-800">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-pink-600 animate-spin" />
                  Please read the guide carefully:
                </span>
                <span className="font-mono text-pink-600 font-bold bg-pink-100 px-2 py-0.5 rounded-md">
                  {countdown}s remaining
                </span>
              </div>
              <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Next Button with Live 10s Countdown */}
          <button
            type="button"
            disabled={countdown > 0 || isSubmitting}
            onClick={handleNextClick}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 ${
              countdown > 0
                ? 'bg-slate-200 text-slate-500 border border-slate-300/80 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-[#ec4899] via-[#d946ef] to-[#3b82f6] text-white shadow-[0_8px_25px_rgba(236,72,153,0.45)] hover:opacity-95 active:scale-98 cursor-pointer hover:shadow-[0_8px_30px_rgba(236,72,153,0.6)]'
            }`}
          >
            {countdown > 0 ? (
              <div className="flex items-center gap-2">
                <span className="font-mono bg-slate-300/90 text-pink-600 px-2.5 py-0.5 rounded-full text-xs border border-pink-400/30 font-extrabold animate-pulse">
                  {countdown}s
                </span>
                <span>Next ({countdown}s)</span>
              </div>
            ) : isSubmitting ? (
              <span>Opening Calculator...</span>
            ) : (
              <>
                <span>Next / Aage Badhein</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-500">
            {countdown > 0 ? (
              <span>Next button unlocks automatically after {countdown} seconds.</span>
            ) : (
              <span className="text-emerald-600 font-bold">✨ Setup complete! Click Next to open your Calculator Vault.</span>
            )}
          </p>
        </div>

      </div>
    </div>
  );
};
