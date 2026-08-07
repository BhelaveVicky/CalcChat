import React, { useState } from 'react';
import { Lock, Check, ArrowRight, Shield, KeyRound, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { CCLogo, CalcChatTitle } from './CalcChatBrand';
import securityBadge from '@assets/security-lock.png';

interface ChatPasswordModalProps {
  isOpen: boolean;
  onComplete: (passcode: string) => Promise<void>;
}

export const ChatPasswordModal: React.FC<ChatPasswordModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = (): boolean => {
    if (!passwordInput) {
      setErrorMsg('Please enter a chat password or PIN');
      return false;
    }

    if (passwordInput.length < 4) {
      setErrorMsg('Password must be at least 4 characters or digits');
      return false;
    }

    if (passwordInput !== confirmInput) {
      setErrorMsg('Passwords do not match');
      return false;
    }

    setErrorMsg(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onComplete(passwordInput.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save chat password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMatch = passwordInput.length >= 4 && confirmInput.length >= 4 && passwordInput === confirmInput;

  return (
    <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col items-center justify-between p-6 sm:p-8 font-sans select-none overflow-y-auto">
      
      {/* Top Header Section */}
      <div className="w-full max-w-sm flex flex-col items-center text-center mt-2 sm:mt-4">
        {/* CC Logo */}
        <div className="mb-3 flex justify-center">
          <CCLogo className="h-16 w-16" />
        </div>

        {/* CalcChat Title */}
        <div className="mb-2">
          <CalcChatTitle size="md" />
        </div>

        {/* Heading */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-2">
          Create Chat Password <span className="inline-block animate-bounce text-xl">🔒</span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-500 text-xs sm:text-sm font-medium mt-1.5 max-w-xs leading-relaxed">
          Set up a secret password or PIN to unlock your hidden chat vault from the calculator.
        </p>
      </div>

      {/* Center 3D Security Badge Illustration */}
      <div className="my-4 sm:my-6 flex items-center justify-center w-full max-w-xs">
        <img 
          src={securityBadge} 
          alt="3D Security Lock Badge" 
          className="w-44 h-44 sm:w-52 sm:h-52 object-contain rounded-3xl drop-shadow-lg transition-transform duration-500 hover:scale-105" 
        />
      </div>

      {/* Main Form Section */}
      <div className="w-full max-w-sm flex flex-col space-y-4 mb-4">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Password Input Field Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_4px_15px_-2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-1.5 mb-2 text-[#ff2e93] text-xs font-bold">
              <KeyRound className="w-4 h-4" />
              <span>Chat Password / PIN</span>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Enter password or PIN (min 4 chars)"
                className="w-full bg-gray-50/80 border border-gray-100 focus:border-[#ff2e93] rounded-xl pl-4 pr-10 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_4px_15px_-2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-1.5 mb-2 text-[#ff2e93] text-xs font-bold">
              <Lock className="w-4 h-4" />
              <span>Confirm Chat Password / PIN</span>
            </div>
            <div className="relative flex items-center">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmInput}
                onChange={(e) => {
                  setConfirmInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Re-enter password or PIN"
                className={`w-full bg-gray-50/80 border rounded-xl pl-4 pr-10 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none transition-all ${
                  isMatch
                    ? 'border-emerald-500 focus:border-emerald-500'
                    : confirmInput && !isMatch
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-gray-100 focus:border-[#ff2e93]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Status indicators */}
            {isMatch && (
              <p className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Passwords match</span>
              </p>
            )}

            {errorMsg && (
              <p className="mt-2 text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          {/* Action Button: Finish Setup */}
          <button
            type="submit"
            disabled={!passwordInput || passwordInput.length < 4 || passwordInput !== confirmInput || isSubmitting}
            className="w-full bg-[#ff2e93] hover:bg-[#ff1e85] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base py-3.5 px-6 rounded-2xl shadow-[0_10px_25px_-5px_rgba(255,46,147,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer mt-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving Password...</span>
              </>
            ) : (
              <>
                <span>Complete Setup & Open App</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Feature Badges Grid */}
        <div className="w-full grid grid-cols-3 divide-x divide-gray-200 text-center pt-2 pb-1">
          <div className="flex items-center justify-center gap-1 text-gray-600 font-semibold text-xs px-1">
            <Shield className="w-4 h-4 text-[#ff2e93] fill-[#ff2e93]/20 shrink-0" />
            <span className="truncate">Encrypted</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-gray-600 font-semibold text-xs px-1">
            <Lock className="w-4 h-4 text-[#ff2e93] fill-[#ff2e93]/20 shrink-0" />
            <span className="truncate">Hidden Vault</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-gray-600 font-semibold text-xs px-1">
            <KeyRound className="w-4 h-4 text-[#ff2e93] fill-[#ff2e93]/20 shrink-0" />
            <span className="truncate">Calculator Unlock</span>
          </div>
        </div>

      </div>

    </div>
  );
};
