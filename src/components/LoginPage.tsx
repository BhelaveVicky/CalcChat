import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { CCLogo, CalcChatTitle } from './CalcChatBrand';
import securityLock from '@assets/security-lock.png';
import { Shield, Zap, User, Mail, Lock, X } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, authReady, authError } = useVault();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setLocalError(null);
      await signInWithGoogle();
    } catch (error: any) {
      setLocalError(error.message || 'Google sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password');
      return;
    }

    if (authMode === 'register' && !displayName.trim()) {
      setLocalError('Please enter your display name');
      return;
    }

    try {
      setIsLoading(true);
      if (authMode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center text-gray-800">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-xs text-gray-400 font-medium">Securing session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#f8fafc] flex flex-col items-center justify-between p-6 sm:p-8 font-sans select-none overflow-y-auto">
      
      {/* Top Section: Logo & Welcome Header */}
      <div className="w-full max-w-sm flex flex-col items-center text-center mt-3 sm:mt-6">
        {/* CC Logo */}
        <div className="mb-4 flex justify-center">
          <CCLogo className="h-20 w-20" />
        </div>

        {/* CalcChat Title */}
        <div className="mb-2">
          <CalcChatTitle size="lg" />
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight flex items-center justify-center gap-2">
          Welcome Back <span className="inline-block animate-bounce text-xl">👋</span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-500 text-xs sm:text-sm font-medium mt-1">
          Sign in with Google or Email to access CalcChat
        </p>
      </div>

      {/* Middle Section: 3D blue Lock Graphic */}
      <div className="my-6 sm:my-8 flex items-center justify-center w-full max-w-xs">
        <img 
          src={securityLock} 
          alt="3D Security Padlock" 
          className="w-56 h-56 sm:w-64 sm:h-64 object-contain transition-transform duration-500 hover:scale-105" 
        />
      </div>

      {/* Bottom Section: Action Button & Footer Features */}
      <div className="w-full max-w-sm flex flex-col items-center space-y-6 mb-4 sm:mb-6">
        
        {/* Error Message Display if any */}
        {(localError || authError) && (
          <div className="w-full bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-2xl text-center shadow-sm">
            {localError || authError}
          </div>
        )}

        {/* Primary Action: Continue with Google Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          type="button"
          className="w-full bg-white hover:bg-gray-50 active:scale-[0.98] border border-gray-100/80 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.12),0_8px_10px_-6px_rgba(0,0,0,0.04)] rounded-2xl py-4 px-6 text-gray-800 font-bold text-base flex items-center justify-center gap-3.5 transition-all cursor-pointer"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
          ) : (
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Feature Badges Grid (Secure | Fast | Easy) */}
        <div className="w-full grid grid-cols-3 divide-x divide-gray-200 text-center py-1">
          <div className="flex items-center justify-center gap-1.5 text-gray-600 font-semibold text-xs px-2">
            <Shield className="w-4 h-4 text-blue-500 fill-blue-500/20" />
            <span>Secure</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-gray-600 font-semibold text-xs px-2">
            <Zap className="w-4 h-4 text-blue-500 fill-blue-500/20" />
            <span>Fast</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-gray-600 font-semibold text-xs px-2">
            <User className="w-4 h-4 text-blue-500 fill-blue-500/20" />
            <span>Easy</span>
          </div>
        </div>

        {/* Terms of Service & Privacy Policy Disclaimer */}
        <div className="text-center text-xs text-gray-400 font-medium leading-relaxed max-w-xs">
          By continuing, you agree to our{' '}
          <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-500 hover:underline font-semibold">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-500 hover:underline font-semibold">
            Privacy Policy
          </a>
        </div>

        {/* Email Sign In Option */}
        <button
          type="button"
          onClick={() => setShowEmailModal(true)}
          className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors pt-1 underline cursor-pointer"
        >
          Sign in with Email & Password
        </button>

      </div>

      {/* Email / Custom Login Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative border border-gray-100 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">
              {authMode === 'login' ? 'Sign In with Email' : 'Create Account'}
            </h3>
            <p className="text-xs text-gray-500 text-center mb-5">
              Enter your credentials to access Secret Vault
            </p>

            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  authMode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  authMode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Agent Cipher"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoginPage;
