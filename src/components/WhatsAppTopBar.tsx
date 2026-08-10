import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { FriendRequestsModal } from './FriendRequestsModal';
import { CCLogo, CalcChatTitle, StoriTitle, CallsTitle, ProfileTitle } from './CalcChatBrand';

export const WhatsAppTopBar: React.FC = () => {
  const {
    activeTab, setActiveTab, settings: vaultSettings,
    pendingFriendRequests, acceptFriendRequest, rejectFriendRequest
  } = useVault();
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);

  const isDark = vaultSettings.theme !== 'material-light' && vaultSettings.theme !== 'light';

  const getTitle = () => {
    switch (activeTab) {
      case 'gallery':
        return 'Updates';
      case 'profile':
        return 'Profile';
      case 'calls':
        return 'Calls';
      case 'settings':
        return 'Settings';
      default:
        return 'WhatsApp';
    }
  };

  return (
    <>
      <header className={`px-4 py-3 flex items-center justify-between select-none shrink-0 border-b z-30 transition-colors ${isDark ? 'bg-[#0b141a] text-white border-[#1f2c34]/40' : 'bg-white text-gray-900 border-gray-200'
        }`}>
        <div className="w-10"></div>

        {/* Brand / Tab Title */}
        <div className="flex items-center justify-center gap-2.5 cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveTab('chats')}>
          {activeTab === 'chats' ? (
            <div className="flex items-center gap-2.5">
              <CCLogo className="w-9 h-9 sm:w-10 sm:h-10" />
              <CalcChatTitle size="md" />
            </div>
          ) : activeTab === 'gallery' ? (
            <StoriTitle size="md" />
          ) : activeTab === 'calls' ? (
            <CallsTitle size="md" />
          ) : activeTab === 'profile' ? (
            <ProfileTitle size="md" />
          ) : (
            <h1 className={`font-bold text-xl sm:text-2xl tracking-normal ${isDark ? 'text-white' : 'text-gray-900'
              }`}>
              {getTitle()}
            </h1>
          )}
        </div>

        {/* Friend Request Icon with Badge (Only visible in Chats section) */}
        <div className="flex items-center gap-2 min-w-[40px] justify-end">
          {activeTab === 'chats' && (
            <button
              onClick={() => setIsRequestsOpen(true)}
              className={`relative p-2 rounded-xl transition-all cursor-pointer active:scale-95 border ${isDark
                  ? 'bg-[#202c33]/50 hover:bg-[#202c33] text-[#ff2e93] border-[#ff2e93]/30'
                  : 'bg-pink-50 hover:bg-pink-100 text-[#ff2e93] border-pink-200 shadow-xs'
                }`}
              title="Friend Requests"
            >
              <UserPlus className="w-5 h-5" />
              {pendingFriendRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-md">
                  {pendingFriendRequests.length}
                </span>
              )}
            </button>
          )}
        </div>
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
    </>
  );
};
