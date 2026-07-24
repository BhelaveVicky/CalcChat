import React, { useState } from 'react';
import {
  User, Key, Check, LogIn, LogOut, Mail, Fingerprint, Search,
  Lock, MessageSquare, Bell, Keyboard, Shield, X, HelpCircle, Eye, EyeOff,
  ArrowRightCircle
} from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const UserProfileView: React.FC = () => {
  const {
    user,
    updateProfile,
    authUser,
    authError,
    isFirebaseConfigured,
    signInWithGoogle,
    signOutGoogle,
    settings,
    updateSettings,
    lockVault
  } = useVault();

  // Primary state matching the UI list
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubPage, setActiveSubPage] = useState<null | 'profile' | 'account' | 'privacy' | 'chats' | 'shortcuts'>(null);
  
  // Edit profile sub-page local states
  const [name, setName] = useState(user.name);
  const [status, setStatus] = useState(user.status);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isOnline, setIsOnline] = useState(user.isOnline);
  const [saved, setSaved] = useState(false);

  // Password local state inside privacy
  const [passcode, setPasscode] = useState(settings.passcode);
  const [passcodeSaved, setPasscodeSaved] = useState(false);

  // Custom visual notification states
  const [notiMute, setNotiMute] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, status, avatar, isOnline });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setActiveSubPage(null);
    }, 1500);
  };

  const handleSavePasscode = () => {
    if (!passcode.trim()) return;
    updateSettings({ passcode: passcode.trim() });
    setPasscodeSaved(true);
    setTimeout(() => {
      setPasscodeSaved(false);
    }, 1500);
  };

  // Base list of options exactly matching the uploaded screenshot!
  const menuOptions = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'Name, profile photo, username',
      icon: <User className="w-6 h-6" />,
      onClick: () => setActiveSubPage('profile')
    },
    {
      id: 'account',
      title: 'Account',
      subtitle: 'Security notifications, account info',
      icon: <Key className="w-6 h-6" />,
      onClick: () => setActiveSubPage('account')
    },
    {
      id: 'privacy',
      title: 'Privacy',
      subtitle: 'Block contacts, disappearing messages',
      icon: <Lock className="w-6 h-6" />,
      onClick: () => setActiveSubPage('privacy')
    },
    {
      id: 'chats',
      title: 'Chats',
      subtitle: 'Theme, wallpapers, chat history',
      icon: <MessageSquare className="w-6 h-6" />,
      onClick: () => setActiveSubPage('chats')
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Message, group & call tones',
      icon: <Bell className="w-6 h-6" />,
      onClick: () => {
        setNotiMute(!notiMute);
        alert(`Notification sound alerts: ${!notiMute ? 'Muted 🔇' : 'Enabled 🔊'}`);
      }
    },
    {
      id: 'shortcuts',
      title: 'Keyboard shortcuts',
      subtitle: 'Quick actions from keyboard',
      icon: <Keyboard className="w-6 h-6" />,
      onClick: () => setActiveSubPage('shortcuts')
    },
    {
      id: 'logout',
      title: 'Log out',
      subtitle: 'Sign out of your account or local guest session',
      icon: <LogOut className="w-6 h-6 text-rose-500 group-hover:text-rose-400 transition-colors" />,
      onClick: () => setShowLogoutConfirm(true)
    }
  ];

  // Filter items if user uses search bar
  const filteredOptions = menuOptions.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] text-[#e9edef] overflow-hidden relative font-sans h-full min-h-0 select-none">
      
      {/* Search Input Bar (Matches screenshot top search bar) */}
      <div className="px-4 py-3 shrink-0 bg-[#0b141a]">
        <div className="relative flex items-center bg-[#202c33] rounded-full px-4 py-2 text-sm">
          <Search className="w-5 h-5 text-[#8596a0] mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[#e9edef] placeholder-[#8596a0] focus:outline-none text-base sm:text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#8596a0] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Settings Panel Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        
        {/* User Info Section (Centered round avatar, bold name, email) */}
        <div className="flex flex-col items-center justify-center pt-4 pb-6 px-4">
          <div 
            onClick={() => setActiveSubPage('profile')}
            className="relative group cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300"
            title="Edit Profile"
          >
            <img
              src={avatar}
              alt={name}
              className="w-24 h-24 sm:w-26 sm:h-26 rounded-full object-cover border-2 border-[#2a3942] bg-[#202c33]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-semibold">Edit</span>
            </div>
            {isOnline && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#25d366] border-2 border-[#0b141a] rounded-full shadow"></span>
            )}
          </div>

          <h2 className="text-[20px] font-bold text-white mt-4 text-center tracking-tight leading-snug">{name}</h2>
          <p className="text-[13.5px] text-[#8596a0] mt-0.5 text-center truncate max-w-xs">{authUser?.email || user.email || 'vickybhelave25@navgurukul.org'}</p>
        </div>

        {/* Settings Action List Items (Matches screenshot) */}
        <div className="divide-y divide-transparent">
          {filteredOptions.length === 0 ? (
            <p className="text-center text-sm text-[#8596a0] py-8">No matching options</p>
          ) : (
            filteredOptions.map(option => (
              <button
                key={option.id}
                onClick={option.onClick}
                className="w-full flex items-start gap-4 px-6 py-4.5 hover:bg-[#202c33]/40 active:bg-[#202c33] transition-colors text-left group"
              >
                <div className="shrink-0 text-[#8596a0] mt-0.5 group-hover:text-[#25d366] transition-colors">
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <p className="text-[16px] font-medium text-[#e9edef] leading-none">{option.title}</p>
                  <p className="text-[13px] text-[#8596a0] mt-1.5 leading-normal">{option.subtitle}</p>
                </div>
              </button>
            ))
          )}
        </div>



      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SUB-PAGES MODALS / BOTTOM SHEETS                         */}
      {/* ──────────────────────────────────────────────────────── */}

      {/* 1. EDIT PROFILE SUB-PAGE OVERLAY */}
      {activeSubPage === 'profile' && (
        <div className="absolute inset-0 z-40 bg-[#0b141a] flex flex-col animate-slide-up">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1f2c34] border-b border-[#2a3942] shrink-0">
            <button 
              onClick={() => setActiveSubPage(null)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[#8696a0]" />
            </button>
            <h2 className="text-white font-semibold text-lg flex-1">Profile Info</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Google Identity Header */}
            <div className="bg-[#233138] border border-[#2a3942] rounded-2xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#103629] border border-[#25d366]/40 flex items-center justify-center overflow-hidden shrink-0">
                    {authUser?.photoURL ? (
                      <img src={authUser.photoURL} alt={authUser.displayName || 'Google account'} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-[#25d366]" />
                    )}
                  </div>
                  <div className="min-w-0 text-xs">
                    <p className="text-[#8596a0] font-medium">Google Account Linking</p>
                    <p className="font-semibold text-white truncate mt-0.5">{authUser?.displayName || 'Not signed in'}</p>
                  </div>
                </div>
                {authUser ? (
                  <button
                    onClick={signOutGoogle}
                    className="px-3 py-1.5 rounded-xl bg-[#0b141a] hover:bg-slate-900 border border-[#2a3942] transition-colors text-xs flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                ) : (
                  <button
                    onClick={signInWithGoogle}
                    disabled={!isFirebaseConfigured}
                    className="px-3 py-1.5 rounded-xl bg-[#25d366] hover:bg-[#20ba5a] disabled:opacity-50 transition-colors text-xs flex items-center gap-1.5 text-[#0b141a] font-semibold"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Google Login
                  </button>
                )}
              </div>
            </div>

            {/* Editing Form */}
            <form onSubmit={handleSaveProfile} className="space-y-5 text-sm">
              
              {/* Avatar Chooser */}
              <div className="flex flex-col items-center gap-3 bg-[#1f2c34] rounded-2xl p-4 border border-[#2a3942]">
                <label className="text-[#8596a0] block text-xs font-semibold uppercase tracking-wider">Choose Profile Avatar</label>
                <div className="flex items-center justify-center gap-3 flex-wrap my-1.5">
                  {sampleAvatars.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Pick Avatar"
                      onClick={() => setAvatar(url)}
                      className={`w-11 h-11 rounded-full object-cover cursor-pointer transition-all ${avatar === url ? 'ring-2 ring-[#25d366] scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                    />
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Or paste custom picture URL..."
                  value={avatar}
                  onChange={e => setAvatar(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] focus:border-[#25d366] rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none"
                />
              </div>

              {/* Name field */}
              <div className="bg-[#1f2c34] p-4 rounded-2xl border border-[#2a3942] space-y-1">
                <label className="text-[#25d366] text-xs font-semibold uppercase tracking-wider block">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-transparent border-b border-[#2a3942] focus:border-[#25d366] text-white text-base font-semibold py-1.5 focus:outline-none"
                />
              </div>

              {/* Status field */}
              <div className="bg-[#1f2c34] p-4 rounded-2xl border border-[#2a3942] space-y-1">
                <label className="text-[#25d366] text-xs font-semibold uppercase tracking-wider block">About Status</label>
                <input
                  type="text"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-transparent border-b border-[#2a3942] focus:border-[#25d366] text-white py-1.5 focus:outline-none"
                />
              </div>

              {/* Online visibility */}
              <div className="flex items-center justify-between p-4 bg-[#1f2c34] rounded-2xl border border-[#2a3942]">
                <div>
                  <span className="font-semibold block text-[#e9edef]">Online Visibility</span>
                  <span className="text-xs text-[#8596a0]">Show green status dot</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOnline}
                    onChange={e => setIsOnline(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#2a3942] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#25d366]"></div>
                </label>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full bg-[#25d366] hover:bg-[#20ba5a] active:scale-95 text-[#0b141a] font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-base"
              >
                {saved ? (
                  <>
                    <Check className="w-5 h-5 text-[#0b141a]" /> Profile Saved!
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 2. ACCOUNT SECURITY OVERLAY */}
      {activeSubPage === 'account' && (
        <div className="absolute inset-0 z-40 bg-[#0b141a] flex flex-col animate-slide-up">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1f2c34] border-b border-[#2a3942] shrink-0">
            <button onClick={() => setActiveSubPage(null)} className="p-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5 text-[#8696a0]" /></button>
            <h2 className="text-white font-semibold text-lg flex-1">Account Info</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
            <div className="bg-[#1f2c34] rounded-2xl p-4 border border-[#2a3942] space-y-3">
              <h3 className="font-semibold text-white text-base">Security Notifications</h3>
              <p className="text-xs text-[#8596a0] leading-relaxed">
                Your messages, media files and settings inside this encrypted vault are protected by secure local client state and authenticated Firebase synchronization.
              </p>
            </div>

            <div className="bg-[#1f2c34] rounded-2xl p-4 border border-[#2a3942] space-y-2.5">
              <p className="text-xs text-[#8596a0] font-semibold uppercase tracking-wider">Session Details</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0b141a] p-2.5 rounded border border-[#2a3942]/60">
                  <span className="text-[#8596a0] block text-[10px]">User ID</span>
                  <span className="text-white font-mono truncate block mt-0.5">{authUser?.uid || 'local_guest'}</span>
                </div>
                <div className="bg-[#0b141a] p-2.5 rounded border border-[#2a3942]/60">
                  <span className="text-[#8596a0] block text-[10px]">Identity provider</span>
                  <span className="text-white block mt-0.5">{authUser ? 'Google Auth' : 'Local Sandbox'}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => alert("Verification code generated: 902-184")}
              className="w-full py-3 rounded-xl bg-[#202c33] border border-[#2a3942] hover:bg-[#2a3942] text-white font-semibold transition-all text-xs"
            >
              Verify Security Code
            </button>
          </div>
        </div>
      )}

      {/* 3. PRIVACY SUB-PAGE OVERLAY */}
      {activeSubPage === 'privacy' && (
        <div className="absolute inset-0 z-40 bg-[#0b141a] flex flex-col animate-slide-up">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1f2c34] border-b border-[#2a3942] shrink-0">
            <button onClick={() => setActiveSubPage(null)} className="p-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5 text-[#8696a0]" /></button>
            <h2 className="text-white font-semibold text-lg flex-1">Privacy & Security</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            
            {/* Vault Secret passcode */}
            <div className="bg-[#1f2c34] rounded-2xl p-5 border border-[#2a3942] space-y-1.5">
              <label className="text-[#25d366] font-semibold text-xs uppercase tracking-wider block">Vault Passcode</label>
              <p className="text-[#8596a0] text-xs leading-relaxed">Type this passcode into the calculator followed by "=" to unlock your vault.</p>
              <div className="flex gap-2.5 pt-2">
                <input
                  type="text"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  placeholder="e.g. 1234"
                  className="flex-1 bg-[#0b141a] border border-[#2a3942] focus:border-[#25d366] font-mono text-xl font-bold tracking-widest text-[#25d366] rounded-xl px-4 py-2.5 focus:outline-none"
                />
                <button 
                  onClick={() => setPasscode('1234')} 
                  className="px-3.5 bg-[#202c33] hover:bg-[#2a3942] rounded-xl text-[#8596a0] text-xs transition-colors font-medium"
                >
                  Reset
                </button>
              </div>
              <button
                onClick={handleSavePasscode}
                className="mt-3.5 w-full bg-[#25d366] hover:bg-[#20ba5a] text-[#0b141a] font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                {passcodeSaved ? <><Check className="w-4 h-4" />Passcode Saved!</> : <>Save Passcode</>}
              </button>
            </div>

            {/* Disappearing Messages */}
            <div className="flex items-center justify-between p-4.5 bg-[#1f2c34] rounded-2xl border border-[#2a3942]">
              <div>
                <span className="font-semibold block text-[#e9edef] text-sm">Disappearing Messages</span>
                <span className="text-xs text-[#8596a0] mt-0.5 block leading-normal">Delete local messages automatically</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.disappearingMessages}
                  onChange={e => updateSettings({ disappearingMessages: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#2a3942] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#25d366]"></div>
              </label>
            </div>

          </div>
        </div>
      )}

      {/* 4. CHATS / THEME SELECTION OVERLAY */}
      {activeSubPage === 'chats' && (
        <div className="absolute inset-0 z-40 bg-[#0b141a] flex flex-col animate-slide-up">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1f2c34] border-b border-[#2a3942] shrink-0">
            <button onClick={() => setActiveSubPage(null)} className="p-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5 text-[#8696a0]" /></button>
            <h2 className="text-white font-semibold text-lg flex-1">Chat Themes</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <p className="text-xs text-[#8596a0] font-semibold uppercase tracking-wider">Select Theme Presets</p>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { id: 'material-dark', label: 'Material Dark', desc: 'Sleek slate with emerald accents (WhatsApp standard)' },
                { id: 'amoled-black', label: 'AMOLED Black', desc: 'High-contrast pure black theme for battery saving' },
                { id: 'cyberpunk', label: 'Cyberpunk Neon', desc: 'Futuristic synthwave magenta visual style' },
                { id: 'emerald-vault', label: 'Matrix Emerald', desc: 'Geeky green terminal hacker visual theme' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    updateSettings({ theme: t.id as any });
                    setActiveSubPage(null);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${settings.theme === t.id ? 'bg-[#25d366]/10 border-[#25d366]' : 'bg-[#1f2c34] border-[#2a3942] hover:border-[#374151]'}`}
                >
                  <p className="font-bold text-[#e9edef] text-base">{t.label}</p>
                  <p className="text-xs text-[#8596a0] mt-1 leading-normal">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. KEYBOARD SHORTCUTS SUB-PAGE */}
      {activeSubPage === 'shortcuts' && (
        <div className="absolute inset-0 z-40 bg-[#0b141a] flex flex-col animate-slide-up">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1f2c34] border-b border-[#2a3942] shrink-0">
            <button onClick={() => setActiveSubPage(null)} className="p-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5 text-[#8696a0]" /></button>
            <h2 className="text-white font-semibold text-lg flex-1">Keyboard Shortcuts</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm leading-relaxed">
            <p className="text-xs text-[#8596a0] font-semibold uppercase tracking-wider">Quick Actions</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3.5 bg-[#1f2c34] border border-[#2a3942]/60 rounded-xl">
                <span>Lock & Close Vault instantly</span>
                <kbd className="px-2 py-1 bg-[#0b141a] border border-[#2a3942] rounded text-xs font-semibold font-mono text-[#25d366]">Esc</kbd>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-[#1f2c34] border border-[#2a3942]/60 rounded-xl">
                <span>Focus chat search input</span>
                <kbd className="px-2 py-1 bg-[#0b141a] border border-[#2a3942] rounded text-xs font-semibold font-mono text-[#25d366]">Ctrl + F</kbd>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-[#1f2c34] border border-[#2a3942]/60 rounded-xl">
                <span>Toggle secret debug frame</span>
                <kbd className="px-2 py-1 bg-[#0b141a] border border-[#2a3942] rounded text-xs font-semibold font-mono text-[#25d366]">Alt + S</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[#1f2c34] rounded-2xl p-6 shadow-2xl w-full max-w-[280px] animate-scale-in border border-[#2a3942] text-center space-y-5">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-white font-bold text-base">Confirm Log out</h3>
              <p className="text-xs text-[#8596a0] leading-relaxed">
                Are you sure you want to log out from this session? Your locked chats will remain secure.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#202c33] hover:bg-[#2a3942] active:scale-95 text-white text-xs font-semibold transition-all border border-[#2a3942]/60"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  signOutGoogle();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold transition-all shadow-md shadow-rose-900/20"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
