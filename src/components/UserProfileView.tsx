import React, { useState } from 'react';
import { User, Key, Check, LogIn, LogOut, Mail, Fingerprint } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const UserProfileView: React.FC = () => {
  const { user, updateProfile, authUser, authError, isFirebaseConfigured, signInWithGoogle, signOutGoogle } = useVault();
  const [name, setName] = useState(user.name);
  const [status, setStatus] = useState(user.status);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isOnline, setIsOnline] = useState(user.isOnline);
  const [saved, setSaved] = useState(false);

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, status, avatar, isOnline });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] text-[#e9edef] overflow-y-auto p-4 sm:p-6 font-sans h-full min-h-0">
      <div className="max-w-md mx-auto w-full space-y-6">

        <div className="bg-[#233138] border border-[#2a3942] rounded-3xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#103629] border border-[#25d366]/40 flex items-center justify-center overflow-hidden shrink-0">
                {authUser?.photoURL ? (
                  <img src={authUser.photoURL} alt={authUser.displayName || 'Google account'} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-[#25d366]" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#8596a0]">Google account</p>
                <p className="font-semibold text-white truncate">{authUser?.displayName || user.name}</p>
                <p className="text-[11px] text-[#8596a0] truncate">{authUser?.email || user.email || 'Not signed in'}</p>
              </div>
            </div>
            {authUser ? (
              <button
                onClick={signOutGoogle}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors text-xs flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                disabled={!isFirebaseConfigured}
                className="px-3 py-2 rounded-xl bg-[#25d366] hover:bg-[#20ba5a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs flex items-center gap-2 text-[#0b141a] font-semibold"
              >
                <LogIn className="w-4 h-4" />
                Google Login
              </button>
            )}
          </div>

          {authUser && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#c7d0d6]">
              <div className="bg-[#0b141a] border border-[#2a3942] rounded-xl p-2.5">
                <div className="flex items-center gap-2 text-[#25d366] font-semibold mb-1">
                  <Mail className="w-3.5 h-3.5" /> Email
                </div>
                <div className="truncate text-[#e9edef]">{authUser.email || '—'}</div>
              </div>
              <div className="bg-[#0b141a] border border-[#2a3942] rounded-xl p-2.5">
                <div className="flex items-center gap-2 text-[#25d366] font-semibold mb-1">
                  <Fingerprint className="w-3.5 h-3.5" /> UID
                </div>
                <div className="truncate text-[#e9edef]">{authUser.uid}</div>
              </div>
              <div className="bg-[#0b141a] border border-[#2a3942] rounded-xl p-2.5">
                <div className="flex items-center gap-2 text-[#25d366] font-semibold mb-1">
                  <User className="w-3.5 h-3.5" /> Name
                </div>
                <div className="truncate text-[#e9edef]">{authUser.displayName || user.name}</div>
              </div>
            </div>
          )}

          {authError && (
            <div className="text-rose-200 bg-rose-950/50 border border-rose-500/30 rounded-xl px-3 py-2 text-xs">
              {authError}
            </div>
          )}
        </div>
        
        {/* Header Banner */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-[#103629] border border-[#25d366]/40 text-[#25d366] flex items-center justify-center mx-auto mb-3 shadow-sm">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Profile</h2>
          <p className="text-xs text-[#8596a0] mt-1">Manage your linked name, bio, and online presence</p>
        </div>

        {/* Profile Card Form */}
        <form onSubmit={handleSave} className="bg-[#233138] border border-[#2a3942] rounded-3xl p-6 shadow-xl space-y-5 text-sm">
          
          {/* Avatar Preview & Selection */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={avatar}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-[#25d366] shadow-md bg-[#0b141a]"
              />
              <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#233138] ${isOnline ? 'bg-[#25d366]' : 'bg-[#8596a0]'}`}></span>
            </div>

            <div className="text-center w-full">
              <label className="text-[#8596a0] block mb-1.5 font-medium text-xs">Choose Avatar</label>
              <div className="flex items-center justify-center gap-2.5 flex-wrap mb-3">
                {sampleAvatars.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt="Pick Avatar"
                    onClick={() => setAvatar(url)}
                    className={`w-10 h-10 rounded-full object-cover cursor-pointer transition-all ${avatar === url ? 'ring-2 ring-[#25d366] scale-110' : 'opacity-60 hover:opacity-100'}`}
                  />
                ))}
              </div>
              <input
                type="url"
                placeholder="Or paste image URL..."
                value={avatar}
                onChange={e => setAvatar(e.target.value)}
                className="w-full bg-[#0b141a] border border-[#2a3942] focus:border-[#25d366] rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="text-[#8596a0] block mb-1 font-medium text-xs">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              readOnly={!!authUser}
              className="w-full bg-[#0b141a] border border-[#2a3942] focus:border-[#25d366] rounded-xl px-3.5 py-2.5 text-white text-base font-semibold focus:outline-none"
            />
            {authUser && <p className="mt-1 text-[11px] text-[#8596a0]">Linked to your Google account.</p>}
          </div>

          {/* Status Bio */}
          <div>
            <label className="text-[#8596a0] block mb-1 font-medium text-xs">About</label>
            <input
              type="text"
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-[#0b141a] border border-[#2a3942] focus:border-[#25d366] rounded-xl px-3.5 py-2.5 text-white text-base focus:outline-none"
            />
          </div>

          {/* Online Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-[#0b141a] rounded-2xl border border-[#2a3942]">
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

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#25d366] hover:bg-[#20ba5a] active:scale-95 text-[#0b141a] font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-base"
          >
            {saved ? (
              <>
                <Check className="w-5 h-5 text-[#0b141a]" /> Saved!
              </>
            ) : (
              <>
                Save
              </>
            )}
          </button>
        </form>

        {/* Cryptographic Key Display */}
        <div className="bg-[#233138] border border-[#2a3942] rounded-2xl p-4 text-xs font-mono text-[#8596a0]">
          <div className="flex items-center gap-2 text-[#25d366] font-semibold mb-1">
            <Key className="w-4 h-4" /> End-to-end encryption key
          </div>
          <p className="truncate text-[#8596a0] select-all bg-[#0b141a] p-2 rounded border border-[#2a3942]">
            0x9F8831A044E119B2773C...84F00E9923
          </p>
        </div>

      </div>
    </div>
  );
};
