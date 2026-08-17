import React from 'react';
import { MessageSquare, CircleDashed, Phone, User, ArrowRightCircle } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const WhatsAppBottomBar: React.FC = () => {
  const { activeTab, setActiveTab, unreadTotal, unseenStatusCount, missedCallCount, clearMissedCallsBadge, lockVault, settings: vaultSettings } = useVault();

  const isDark = vaultSettings.theme !== 'material-light' && vaultSettings.theme !== 'light';

  return (
    <nav className={`px-2 py-2 flex items-center justify-around text-xs select-none shrink-0 z-30 border-t transition-colors ${isDark ? 'bg-[#0b141a] border-[#202c33]' : 'bg-white border-gray-200'
      }`}>
      {/* 1. Chats */}
      <button
        onClick={() => setActiveTab('chats')}
        className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all group ${activeTab === 'chats' ? 'text-[#ff2e93] font-semibold' : (isDark ? 'text-[#8596a0] hover:text-[#d1d7db]' : 'text-gray-500 hover:text-gray-800')
          }`}
      >
        <div className="relative flex items-center justify-center">
          <div className={`px-2 sm:px-4 py-1 rounded-full transition-colors ${activeTab === 'chats' ? (isDark ? 'bg-[#ff2e93]/20' : 'bg-pink-100') : ''
            }`}>
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          {unreadTotal > 0 && (
            <span className="absolute -top-1 right-1 bg-[#ff2e93] text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-xs">
              {unreadTotal > 99 ? '99+' : unreadTotal}
            </span>
          )}
        </div>
        <span className="text-[10px] sm:text-xs">Chats</span>
      </button>

      {/* 2. Updates / Status */}
      <button
        onClick={() => setActiveTab('gallery')}
        className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all group ${activeTab === 'gallery' ? 'text-[#ff2e93] font-semibold' : (isDark ? 'text-[#8596a0] hover:text-[#d1d7db]' : 'text-gray-500 hover:text-gray-800')
          }`}
      >
        <div className="relative flex items-center justify-center">
          <div className={`px-2 sm:px-4 py-1 rounded-full transition-colors ${activeTab === 'gallery' ? (isDark ? 'bg-[#ff2e93]/20' : 'bg-pink-100') : ''
            }`}>
            <CircleDashed className="w-5 h-5 stroke-[2.2]" />
          </div>
          {unseenStatusCount > 0 && (
            <span className="absolute -top-1 right-1 bg-[#ff2e93] text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-xs">
              {unseenStatusCount > 99 ? '99+' : unseenStatusCount}
            </span>
          )}
        </div>
        <span className="text-[10px] sm:text-xs">Status</span>
      </button>

      {/* 3. Calls */}
      <button
        onClick={() => {
          setActiveTab('calls');
          clearMissedCallsBadge();
        }}
        className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all group ${activeTab === 'calls' ? 'text-[#ff2e93] font-semibold' : (isDark ? 'text-[#8596a0] hover:text-[#d1d7db]' : 'text-gray-500 hover:text-gray-800')
          }`}
      >
        <div className="relative flex items-center justify-center">
          <div className={`px-2 sm:px-4 py-1 rounded-full transition-colors ${activeTab === 'calls' ? (isDark ? 'bg-[#ff2e93]/20' : 'bg-pink-100') : ''
            }`}>
            <Phone className="w-5 h-5" />
          </div>
          {missedCallCount > 0 && (
            <span className="absolute -top-1 right-1 bg-red-500 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-xs animate-pulse">
              {missedCallCount > 99 ? '99+' : missedCallCount}
            </span>
          )}
        </div>
        <span className="text-[10px] sm:text-xs">Calls</span>
      </button>

      {/* 4. Profile */}
      <button
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all group ${activeTab === 'profile' ? 'text-[#ff2e93] font-semibold' : (isDark ? 'text-[#8596a0] hover:text-[#d1d7db]' : 'text-gray-500 hover:text-gray-800')
          }`}
      >
        <div className="relative flex items-center justify-center">
          <div className={`px-2 sm:px-4 py-1 rounded-full transition-colors ${activeTab === 'profile' ? (isDark ? 'bg-[#ff2e93]/20' : 'bg-pink-100') : ''
            }`}>
            <User className="w-5 h-5" />
          </div>
        </div>
        <span className="text-[10px] sm:text-xs">Profile</span>
      </button>

      {/* 5. Back to Calculator */}
      <button
        onClick={() => lockVault()}
        className="flex flex-col items-center justify-center gap-1 flex-1 transition-all group text-rose-500 hover:text-rose-400"
      >
        <div className="relative flex items-center justify-center">
          <div className="px-2 sm:px-4 py-1 rounded-full bg-rose-500/10 group-hover:bg-rose-500/20 transition-colors">
            <ArrowRightCircle className="w-5 h-5 stroke-[2.2] text-rose-500 animate-pulse" />
          </div>
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-rose-500">Back</span>
      </button>
    </nav>
  );
};

