import React from 'react';
import { useVault } from '../context/VaultContext';
import luLogo from '@assets/lu-logo.png';
import securityLock from '@assets/security-lock.png';

const LoginPage: React.FC = () => {
  const { signInWithGoogle, authUser, authReady } = useVault();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  if (!authReady) {
    return (
      <div className="h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#091540]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8faff] h-screen flex flex-col items-center justify-center p-6">
      
      {/* LU Logo */}
      <div className="mb-6 flex justify-center">
        <img src={luLogo} alt="LU Logo" className="h-34 w-auto object-contain brightness-0" />
      </div>

      {/* Welcome Text */}
      <h1 className="text-[28px] font-bold text-[#091540] flex items-center gap-2 mb-2">
        Welcome Back <span className="animate-pulse">👋</span>
      </h1>
      <p className="text-[#718096] text-[15px] mb-8 font-medium">Sign in with Google to continue</p>

      {/* Security Lock Image */}
      <div className="relative w-full flex justify-center mb-10">
        <img src={securityLock} alt="Security Lock" className="h-44 w-auto object-contain" />
      </div>

      {/* Google Sign In Button */}
      <button 
        onClick={handleGoogleSignIn}
        className="w-full max-w-md flex items-center justify-center gap-3 bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] text-[#1a202c] font-semibold py-4 px-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 mb-8"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="text-[16px]">Continue with Google</span>
      </button>

      {/* Features Section */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-md border-t border-[#f1f5f9] pt-6 mb-8 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[#4a5568] text-[13px] font-medium">
          <i className="fa-solid fa-shield-halved text-[#3b82f6]"></i> Secure
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[#4a5568] text-[13px] font-medium border-x border-[#e2e8f0]">
          <i className="fa-solid fa-bolt text-[#3b82f6]"></i> Fast
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[#4a5568] text-[13px] font-medium">
          <i className="fa-solid fa-user text-[#3b82f6]"></i> Easy
        </div>
      </div>

      {/* Privacy Note */}
      <p className="text-[#718096] text-[12px] font-medium text-center leading-relaxed max-w-[320px]">
        By continuing, you agree to our 
        <a href="#" className="text-[#3b82f6] hover:underline">Terms of Service</a> 
        and <a href="#" className="text-[#3b82f6] hover:underline">Privacy Policy</a>
      </p>

    </div>
  );
};

export default LoginPage;
