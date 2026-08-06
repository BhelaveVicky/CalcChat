import React, { useState, useEffect } from 'react';
import { User, Check, ArrowRight, Shield, Zap, AlertCircle, Loader2, AtSign } from 'lucide-react';
import { CCLogo, CalcChatTitle } from './CalcChatBrand';
import usernameBadge from '@assets/security-lock.png';

interface UsernameModalProps {
  isOpen: boolean;
  onComplete: (username: string, displayName: string) => Promise<void>;
  defaultDisplayName?: string;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({
  isOpen,
  onComplete,
  defaultDisplayName = '',
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState(defaultDisplayName);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultDisplayName) {
      setDisplayNameInput(defaultDisplayName);
    }
  }, [defaultDisplayName]);

  useEffect(() => {
    // Auto-prefill username suggestion based on display name if empty
    if (displayNameInput && !usernameInput) {
      const suggested = displayNameInput.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '');
      if (suggested.length >= 3) {
        setUsernameInput(suggested);
      }
    }
  }, [displayNameInput]);

  useEffect(() => {
    const trimmed = usernameInput.trim().toLowerCase().replace(/^@/, '');
    
    if (!trimmed) {
      setIsAvailable(null);
      setErrorMsg(null);
      return;
    }

    if (trimmed.length < 3 || trimmed.length > 20) {
      setIsAvailable(false);
      setErrorMsg('Username must be 3–20 characters');
      return;
    }

    const validRegex = /^[a-zA-Z0-9_.]+$/;
    if (!validRegex.test(trimmed)) {
      setIsAvailable(false);
      setErrorMsg('Only letters, numbers, "_" and "." are allowed');
      return;
    }

    setErrorMsg(null);
    setIsAvailable(true);
  }, [usernameInput]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = usernameInput.trim().toLowerCase().replace(/^@/, '');
    const cleanDisplayName = displayNameInput.trim() || cleanUsername;

    if (!cleanUsername) {
      setErrorMsg('Please enter a username');
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onComplete(cleanUsername, cleanDisplayName);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save username. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUsernameChange = (val: string) => {
    // If user types @, strip or keep appropriately
    const clean = val.startsWith('@') ? val.slice(1) : val;
    setUsernameInput(clean);
  };

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
          Create Your Username <span className="inline-block animate-bounce text-xl">👋</span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-500 text-xs sm:text-sm font-medium mt-1.5 max-w-xs leading-relaxed">
          Choose a unique username so your friends can easily find and connect with you.
        </p>
      </div>

      {/* Center 3D Avatar Illustration */}
      <div className="my-4 sm:my-6 flex items-center justify-center w-full max-w-xs">
        <img 
          src={usernameBadge} 
          alt="3D Security Username Badge" 
          className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-3xl drop-shadow-lg transition-transform duration-500 hover:scale-105" 
        />
      </div>

      {/* Main Form Section */}
      <div className="w-full max-w-sm flex flex-col space-y-4 mb-4">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Display Name Field Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_4px_15px_-2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-1.5 mb-2 text-[#ff2e93] text-xs font-bold">
              <User className="w-4 h-4 fill-[#ff2e93]/10" />
              <span>Display Name</span>
            </div>
            <input
              type="text"
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="e.g. Vicky Kumar"
              className="w-full bg-gray-50/80 border border-gray-100 focus:border-[#ff2e93] rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none transition-all"
            />
          </div>

          {/* Username Field Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_4px_15px_-2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-1.5 mb-2 text-[#ff2e93] text-xs font-bold">
              <AtSign className="w-4 h-4" />
              <span>Username</span>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                value={usernameInput ? `@${usernameInput}` : ''}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="@vicky_kumar"
                maxLength={21}
                className={`w-full bg-gray-50/80 border rounded-xl pl-4 pr-10 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none transition-all ${
                  isAvailable === true
                    ? 'border-emerald-500 focus:border-emerald-500'
                    : isAvailable === false
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-gray-100 focus:border-[#ff2e93]'
                }`}
              />
              <div className="absolute right-3.5 flex items-center justify-center">
                {isAvailable === true ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : isAvailable === false ? (
                  <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Availability / Error status */}
            {isAvailable === true && (
              <p className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Username available</span>
              </p>
            )}

            {errorMsg && (
              <p className="mt-2 text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          {/* Action Button: Continue */}
          <button
            type="submit"
            disabled={!isAvailable || isSubmitting}
            className="w-full bg-[#ff2e93] hover:bg-[#ff1e85] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base py-3.5 px-6 rounded-2xl shadow-[0_10px_25px_-5px_rgba(255,46,147,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer mt-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Setting Username...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Feature Badges Grid */}
        <div className="w-full grid grid-cols-3 divide-x divide-gray-200 text-center pt-2 pb-1">
          <div className="flex items-center justify-center gap-1 text-gray-600 font-semibold text-xs px-1">
            <Shield className="w-4 h-4 text-[#ff2e93] fill-[#ff2e93]/20 shrink-0" />
            <span className="truncate">Secure</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-gray-600 font-semibold text-xs px-1">
            <User className="w-4 h-4 text-[#ff2e93] fill-[#ff2e93]/20 shrink-0" />
            <span className="truncate">Easy to Find</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-gray-600 font-semibold text-xs px-1">
            <Zap className="w-4 h-4 text-[#ff2e93] fill-[#ff2e93]/20 shrink-0" />
            <span className="truncate">Fast Setup</span>
          </div>
        </div>

        {/* Terms & Privacy Policy Disclaimer */}
        <div className="text-center text-xs text-gray-400 font-medium leading-relaxed max-w-xs mx-auto">
          By continuing, you agree to our{' '}
          <a href="#" onClick={(e) => e.preventDefault()} className="text-[#ff2e93] hover:underline font-semibold">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" onClick={(e) => e.preventDefault()} className="text-[#ff2e93] hover:underline font-semibold">
            Privacy Policy
          </a>
        </div>

      </div>

    </div>
  );
};
