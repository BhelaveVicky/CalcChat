import React from 'react';
import { MessageSquare, Image, User, Settings, ShieldAlert, Sparkles } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const VaultNavbar: React.FC = () => {
  const { activeTab, setActiveTab, lockVault, user, settings } = useVault();

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-2.5 shrink-0 flex items-center justify-between text-white z-30">
      
      {/* Brand & Theme Accent */}
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('chats')}>
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm relative">
          <Sparkles className="w-4 h-4" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
        </div>
        <div>
          <h1 className="font-bold tracking-tight text-sm flex items-center gap-1.5">
            Secret Vault
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1 rounded">SECURE</span>
          </h1>
          <p className="text-[10px] text-slate-400 truncate max-w-[120px] sm:max-w-[180px]">
            {user.status || 'Encrypted 256-bit'}
          </p>
        </div>
      </div>

      {/* Navigation Pill Buttons */}
      <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={() => setActiveTab('chats')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'chats'
              ? 'bg-emerald-500 text-slate-950 font-semibold shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Secret Chats"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Chats</span>
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'gallery'
              ? 'bg-emerald-500 text-slate-950 font-semibold shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Media Storage Gallery"
        >
          <Image className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Media</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-emerald-500 text-slate-950 font-semibold shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="User Profile"
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-emerald-500 text-slate-950 font-semibold shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          title="Vault Settings"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </nav>

      {/* Panic Lock Button */}
      <button
        onClick={lockVault}
        className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-medium text-xs px-2.5 py-1.5 rounded-xl shadow-lg transition-all"
        title="Panic Button: Return to Calculator immediately"
      >
        <ShieldAlert className="w-4 h-4 animate-bounce" />
        <span className="hidden md:inline">Panic Lock</span>
      </button>

    </header>
  );
};
