import React, { useState, useEffect } from 'react';
import { User, Check, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface UsernameModalProps {
  isOpen: boolean;
  onComplete: (username: string, displayName: string) => Promise<void>;
  defaultDisplayName?: string;
  defaultEmail?: string;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({
  isOpen,
  onComplete,
  defaultDisplayName = '',
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState(defaultDisplayName);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultDisplayName) {
      setDisplayNameInput(defaultDisplayName);
    }
  }, [defaultDisplayName]);

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
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const cleanUsername = usernameInput.trim().toLowerCase();
      const cleanDisplayName = displayNameInput.trim() || cleanUsername;
      await onComplete(cleanUsername, cleanDisplayName);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save username. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#071014]/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="w-full max-w-md rounded-3xl bg-[#0b141a] text-white border border-[#1f2c34] shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#25d366] via-emerald-400 to-[#128c7e]" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#25d366]/10 border border-[#25d366]/30 flex items-center justify-center text-[#25d366] mb-3 shadow-lg">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Your Username</h2>
          <p className="text-xs text-[#8696a0] mt-1 max-w-xs">
            Choose a unique handle so your friends can find and connect with you on Secret Vault.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8696a0] mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-4 py-3 rounded-xl bg-[#111b21] text-white border border-[#202c33] focus:border-[#25d366] focus:outline-none text-sm transition-all placeholder:text-[#8696a0]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#8696a0]">
                Unique Username
              </label>
              {isChecking && (
                <span className="text-[11px] text-[#25d366] flex items-center gap-1 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0] font-semibold text-sm">
                @
              </span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="username"
                maxLength={20}
                className={`w-full pl-8 pr-10 py-3 rounded-xl bg-[#111b21] text-white border focus:outline-none text-sm font-medium transition-all ${
                  isAvailable === true
                    ? 'border-[#25d366] focus:border-[#25d366]'
                    : isAvailable === false
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-[#202c33] focus:border-[#25d366]'
                }`}
                autoFocus
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isAvailable === true ? (
                  <Check className="w-5 h-5 text-[#25d366] stroke-[3]" />
                ) : isAvailable === false ? (
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                ) : null}
              </div>
            </div>

            {errorMsg && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}

            {isAvailable === true && (
              <p className="mt-1.5 text-xs text-[#25d366] flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                <span>@{usernameInput.trim().toLowerCase()} is available!</span>
              </p>
            )}
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={!isAvailable || isChecking || isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#25d366] hover:bg-[#20ba5a] text-[#0b141a] font-bold text-sm shadow-lg shadow-[#25d366]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Setting Up Account...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Complete Setup & Enter</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
