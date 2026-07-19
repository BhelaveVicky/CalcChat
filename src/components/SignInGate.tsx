import React from 'react';
import { LogIn } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const SignInGate: React.FC = () => {
  const { signInWithGoogle, authError, isFirebaseConfigured } = useVault();

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#071014]">
      <div className="max-w-sm w-full mx-4 bg-[#0b141a] border border-[#1f2c34] rounded-2xl p-6 text-center shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Sign in with Google</h2>
        <p className="text-sm text-[#9aa8ad] mb-4">You must sign in to access the Secret Calculator Chat Vault.</p>

        <button
          onClick={signInWithGoogle}
          disabled={!isFirebaseConfigured}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#25d366] hover:bg-[#20ba5a] disabled:opacity-50 disabled:cursor-not-allowed text-[#04110a] font-semibold"
        >
          <LogIn className="w-5 h-5" />
          Continue with Google
        </button>

        {authError && <p className="mt-3 text-rose-300 text-sm">{authError}</p>}

        {!isFirebaseConfigured && (
          <p className="mt-3 text-sm text-[#8596a0]">Firebase not configured. Set VITE_FIREBASE_* env vars.</p>
        )}
      </div>
    </div>
  );
};
