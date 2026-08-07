import React, { useState } from 'react';
import { MessageSquare, Image, User, Settings, ShieldAlert, Sparkles, UserPlus, Phone, Crown } from 'lucide-react';
import { useVault, SUPER_ADMIN_EMAIL, ADMIN_EMAIL } from '../context/VaultContext';
import { FriendRequestsModal } from './FriendRequestsModal';
import { AdminPanelModal } from './AdminPanelModal';
import { CCLogo, CalcChatTitle } from './CalcChatBrand';

export const VaultNavbar: React.FC = () => {
  const { 
    activeTab, setActiveTab, lockVault, user, authUser, unreadTotal, unseenStatusCount, missedCallCount,
    pendingFriendRequests, acceptFriendRequest, rejectFriendRequest 
  } = useVault();
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const userEmail = (authUser?.email || user.email || '').toLowerCase();
  const showAdminBtn = userEmail === SUPER_ADMIN_EMAIL || userEmail === ADMIN_EMAIL || user.isAdmin || user.isSuperAdmin;

  return (
    <>
      <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-2.5 shrink-0 flex items-center justify-between text-white z-30">
        
        {/* Brand & Friend Request badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('chats')}>
            <CCLogo className="w-8 h-8" />
            <div>
              <div className="flex items-center gap-1.5">
                <CalcChatTitle size="sm" />
                <span className="text-[10px] bg-[#ff2e93]/20 text-[#ff2e93] font-mono px-1 rounded font-bold">SECURE</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[120px] sm:max-w-[180px]">
                {user.username ? `@${user.username}` : (user.status || 'Encrypted 256-bit')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {activeTab === 'chats' && (
              <button
                onClick={() => setIsRequestsOpen(true)}
                className="relative p-1.5 rounded-lg bg-[#ff2e93]/10 hover:bg-[#ff2e93]/20 text-[#ff2e93] border border-[#ff2e93]/30 transition-all cursor-pointer active:scale-95 ml-1"
                title="Friend Requests"
              >
                <UserPlus className="w-4 h-4" />
                {pendingFriendRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                    {pendingFriendRequests.length}
                  </span>
                )}
              </button>
            )}

            {/* Admin Panel Launcher Button */}
            {showAdminBtn && (
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className="relative p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer active:scale-95 flex items-center gap-1 text-xs font-bold"
                title="Admin Control Panel"
              >
                <Crown className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="hidden md:inline">Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Pill Buttons */}
        <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'chats'
                ? 'bg-[#ff2e93] text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Secret Chats"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chats</span>
            {unreadTotal > 0 && (
              <span className="bg-white text-[#ff2e93] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                {unreadTotal}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'bg-[#ff2e93] text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Stori Updates & Media"
          >
            <Image className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stori</span>
            {unseenStatusCount > 0 && (
              <span className="bg-white text-[#ff2e93] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                {unseenStatusCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('calls')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'calls'
                ? 'bg-[#ff2e93] text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Voice & Video Calls"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calls</span>
            {missedCallCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                {missedCallCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-[#ff2e93] text-white font-semibold shadow'
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
                ? 'bg-[#ff2e93] text-white font-semibold shadow'
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

      {/* Friend Requests Modal */}
      <FriendRequestsModal
        isOpen={isRequestsOpen}
        onClose={() => setIsRequestsOpen(false)}
        requests={pendingFriendRequests}
        onAccept={async (reqId, senderId) => {
          await acceptFriendRequest(reqId, senderId);
        }}
        onReject={async (reqId) => {
          await rejectFriendRequest(reqId);
        }}
      />

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />
    </>
  );
};
