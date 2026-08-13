import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, KeyRound, ShieldCheck, ArrowLeft, X, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface ForgotPasswordModalProps {
  onClose: () => void;
  initialEmail?: string;
  onSuccess?: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  onClose,
  initialEmail = '',
  onSuccess
}) => {
  const { user, authUser, updateSettings } = useVault();

  // Step state: 1 = Email Input, 2 = OTP Input, 3 = Create New Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [email, setEmail] = useState<string>(initialEmail || authUser?.email || user?.email || '');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // UI / Timer / Lockout states
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Timers
  const [expireSeconds, setExpireSeconds] = useState<number>(300); // 5 minutes
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0); // 30s resend cooldown
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Input Refs for 6-digit OTP
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer Countdown Effect
  useEffect(() => {
    let timer: any = null;
    if (step === 2 && expireSeconds > 0) {
      timer = setInterval(() => {
        setExpireSeconds(prev => {
          if (prev <= 1) {
            setErrorMessage('OTP has expired (5 minute limit). Please request a new OTP.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, expireSeconds]);

  // Resend Cooldown Countdown Effect
  useEffect(() => {
    let cooldownTimer: any = null;
    if (cooldownSeconds > 0) {
      cooldownTimer = setInterval(() => {
        setCooldownSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(cooldownTimer);
  }, [cooldownSeconds]);

  // Focus first OTP input when reaching step 2
  useEffect(() => {
    if (step === 2 && otpInputRefs.current[0]) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  const [displayMaskedEmail, setDisplayMaskedEmail] = useState<string>('');

  // Handler for sending OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanInput = email.trim();
    if (!cleanInput) {
      setErrorMessage('Please enter a valid registered email address or username.');
      return;
    }

    try {
      setIsLoading(true);

      // Backend user lookup, OTP generation & official Postmark API email dispatch
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanInput, email: cleanInput }),
      });

      let data: any = {};
      const resText = await res.text();
      try {
        data = JSON.parse(resText);
      } catch (e) {
        throw new Error(!res.ok ? `Server error (${res.status}). Please check Vercel deployment backend.` : 'Invalid server response');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP code to email.');
      }

      if (data.targetEmail) {
        setEmail(data.targetEmail);
      }

      const masked = data.maskedEmail || data.targetEmail || cleanInput;
      setDisplayMaskedEmail(masked);
      setSuccessMessage(data.message || `OTP sent successfully to registered email (${masked}). Please check your email inbox and spam folder.`);
      setStep(2);
      setExpireSeconds(300); // Reset 5 minutes
      setCooldownSeconds(60); // 60 seconds resend cooldown
      setAttemptsRemaining(5);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for OTP input changes
  const handleOtpDigitChange = (index: number, value: string) => {
    // Handle pasted content
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      if (pasted.length > 0) {
        const nextDigits = [...otpDigits];
        pasted.forEach((char, i) => {
          if (index + i < 6) {
            nextDigits[index + i] = char;
          }
        });
        setOtpDigits(nextDigits);
        const nextFocusIndex = Math.min(index + pasted.length, 5);
        otpInputRefs.current[nextFocusIndex]?.focus();

        // Auto verify if 6 digits filled
        if (nextDigits.every(d => d !== '')) {
          handleVerifyOtp(nextDigits.join(''));
        }
      }
      return;
    }

    // Single digit input
    const char = value.replace(/\D/g, '');
    const nextDigits = [...otpDigits];
    nextDigits[index] = char;
    setOtpDigits(nextDigits);

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto trigger verify if last digit entered
    if (char && index === 5 && nextDigits.every(d => d !== '')) {
      handleVerifyOtp(nextDigits.join(''));
    }
  };

  // Handler for Backspace key navigation in OTP inputs
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handler for OTP Verification
  const handleVerifyOtp = async (codeToVerify?: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const otpCode = codeToVerify || otpDigits.join('');
    if (otpCode.length < 6) {
      setErrorMessage('Please enter all 6 digits of the OTP.');
      return;
    }

    if (expireSeconds <= 0) {
      setErrorMessage('OTP has expired. Please click Resend OTP.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error && data.error.includes('attempt(s) remaining')) {
          const match = data.error.match(/(\d+)\s+attempt/);
          if (match) {
            setAttemptsRemaining(parseInt(match[1], 10));
          }
        }
        throw new Error(data.error || 'OTP Verification Failed');
      }

      setResetToken(data.resetToken);
      setSuccessMessage('OTP verified successfully.');
      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for Resetting Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newPassword || newPassword.trim().length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          resetToken,
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      // Sync active vault settings context & local storage passcode
      updateSettings({ passcode: newPassword.trim() });
      if (authUser?.uid) {
        localStorage.setItem(`calcchat_passcode_${authUser.uid}`, newPassword.trim());
      }
      localStorage.setItem('calcchat_passcode_guest', newPassword.trim());

      setStep(4);
      setSuccessMessage('Password changed successfully');

      if (onSuccess) {
        onSuccess();
      }

      // Auto redirect/close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  // Format seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
      <div className="bg-[#111b21] border border-[#2a3942] rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col text-[#e9edef]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3942] bg-[#1f2c34]/50">
          <div className="flex items-center gap-2.5">
            {step > 1 && step < 4 && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setStep((step - 1) as any);
                }}
                className="text-[#8696a0] hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors mr-1"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="p-2 bg-[#00a8ff]/10 rounded-xl border border-[#00a8ff]/20">
              <KeyRound className="w-5 h-5 text-[#00a8ff]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white tracking-wide">Forgot Password</h2>
              <p className="text-[11px] text-[#8696a0]">
                {step === 1 && 'Step 1 of 3: Registered Email'}
                {step === 2 && 'Step 2 of 3: OTP Verification'}
                {step === 3 && 'Step 3 of 3: New Password'}
                {step === 4 && 'Complete! Redirecting...'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#8696a0] hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-2xl flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message Banner */}
          {successMessage && step !== 4 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-3 rounded-2xl flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* STEP 1: ENTER REGISTERED EMAIL */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-center space-y-1.5 py-1">
                <p className="text-sm font-semibold text-white">Reset Vault Password / Passcode</p>
                <p className="text-xs text-[#8696a0] leading-relaxed">
                  Enter your registered email address below. We will send a secure 6-digit OTP to verify your account identity.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8696a0] mb-1.5">Registered Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. user@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#111b21] border border-[#2a3942] focus:border-[#00a8ff] rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#8696a0] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full bg-[#00a8ff] hover:bg-[#008fdb] active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-[#00a8ff]/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating OTP...</span>
                  </>
                ) : (
                  <span>Send OTP</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 6-BOX OTP VERIFICATION */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-white">Verify 6-Digit OTP Code</p>
                <p className="text-xs text-[#8696a0]">
                  Enter the 6-digit verification code sent to registered email: <strong className="text-[#00a8ff] font-mono">{displayMaskedEmail || email}</strong>
                </p>
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="flex items-center justify-between gap-2 my-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-bold bg-[#1f2c34] border border-[#2a3942] focus:border-[#00a8ff] focus:ring-1 focus:ring-[#00a8ff] rounded-2xl text-white focus:outline-none transition-all"
                  />
                ))}
              </div>

              {/* Timer & Attempt Details */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-1.5 text-[#8696a0]">
                  <span>⏱️ Expire in:</span>
                  <span className={`font-mono font-bold ${expireSeconds < 60 ? 'text-red-400' : 'text-[#00a8ff]'}`}>
                    {formatTimer(expireSeconds)}
                  </span>
                </div>

                {attemptsRemaining !== null && (
                  <div className="text-amber-400 font-medium">
                    ⚠️ {attemptsRemaining} attempt(s) left
                  </div>
                )}
              </div>

              {/* Verify & Resend Actions */}
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={isLoading || otpDigits.join('').length < 6 || expireSeconds <= 0}
                  className="w-full bg-[#00a8ff] hover:bg-[#008fdb] active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-[#00a8ff]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>Verify OTP</span>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={cooldownSeconds > 0 || isLoading}
                    className="text-xs text-[#00a8ff] hover:underline disabled:text-[#8696a0] disabled:no-underline font-medium inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    {cooldownSeconds > 0 ? (
                      <span>Resend OTP in {cooldownSeconds}s</span>
                    ) : (
                      <span>Resend OTP</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CREATE NEW PASSWORD */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center space-y-1 py-1">
                <p className="text-sm font-semibold text-white">Create New Password</p>
                <p className="text-xs text-[#8696a0]">
                  Choose a new passcode or password for your CalcChat account.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8696a0] mb-1.5">New Password / Passcode</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-3.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password (min 4 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#111b21] border border-[#2a3942] focus:border-[#00a8ff] rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-[#8696a0] focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3.5 text-[#8696a0] hover:text-white p-0.5"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8696a0] mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#111b21] border border-[#2a3942] focus:border-[#00a8ff] rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-[#8696a0] focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-[#8696a0] hover:text-white p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Match Status Indicator */}
              {confirmPassword.length > 0 && (
                <div className="text-xs flex items-center gap-1.5 px-1">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match!
                    </span>
                  ) : (
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full bg-[#00a8ff] hover:bg-[#008fdb] active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-[#00a8ff]/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS RECOVERY SCREEN */}
          {step === 4 && (
            <div className="text-center py-6 space-y-5 animate-scale-up">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                <ShieldCheck className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Password Reset Successfully</h3>
                <p className="text-xs text-[#8696a0]">
                  Your new vault password / passcode has been updated securely. You can now log in with your new password.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-[#00a8ff] hover:bg-[#008fdb] active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-[#00a8ff]/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Go to Login</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
