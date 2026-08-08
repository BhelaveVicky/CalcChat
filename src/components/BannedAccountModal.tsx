import React from 'react';
import { ShieldAlert, LogOut, Mail, Lock } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const BannedAccountModal: React.FC = () => {
  const { user, authUser, signOutGoogle } = useVault();

  if (!user?.isBanned) return null;

  const email = user.email || authUser?.email || 'Your account';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 animate-fade-in select-none">
      <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-3xl p-6 sm:p-8 text-center text-slate-100 shadow-2xl shadow-red-950/50 space-y-5 relative overflow-hidden">
        
        {/* Glow Accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/20 blur-3xl rounded-full pointer-events-none" />

        {/* Banned Icon */}
        <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-inner text-red-500">
          <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
        </div>

        <div>
          <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-black uppercase tracking-wider">
            Account Suspended
          </span>
          <h2 className="text-2xl font-black text-white mt-3 tracking-wide">
            Your Account is Banned
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Access to CalcChat has been revoked by the Super Admin due to reports or community guidelines violations.
          </p>
        </div>

        {/* User Details */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Associated Email:</span>
            <span className="text-slate-200 font-mono font-semibold truncate max-w-[200px]">
              {email}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Status:</span>
            <span className="text-red-400 font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-red-400" /> Banned
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          If you believe this ban was applied in error, please contact support or the Super Admin.
        </p>

        {/* Logout Button */}
        <button
          onClick={signOutGoogle}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of Account</span>
        </button>
      </div>
    </div>
  );
};
