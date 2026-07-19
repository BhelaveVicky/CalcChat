import React from 'react';
import { useVault } from '../context/VaultContext';
import { Calculator } from './Calculator';
import { WhatsAppTopBar } from './WhatsAppTopBar';
import { WhatsAppBottomBar } from './WhatsAppBottomBar';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { MediaGallery } from './MediaGallery';
import { UserProfileView } from './UserProfileView';
import { VaultSettingsView } from './VaultSettingsView';
import { CallsView } from './CallsView';

export const VaultContainer: React.FC = () => {
  const { isUnlocked, activeTab, activeContactId, settings } = useVault();

  if (!isUnlocked) return <Calculator />;

  // Theme container classes (default to WhatsApp dark theme)
  let themeBg = 'bg-[#0b141a] text-[#e9edef] font-sans';
  if (settings.theme === 'amoled-black') themeBg = 'bg-black text-[#e9edef]';
  if (settings.theme === 'cyberpunk') themeBg = 'bg-purple-950 text-pink-100';
  if (settings.theme === 'emerald-vault') themeBg = 'bg-emerald-950 text-emerald-100';

  const isChatOpen = activeTab === 'chats' && activeContactId;

  return (
    <div className={`flex-1 flex flex-col w-full h-full max-w-md mx-auto shadow-2xl overflow-hidden relative transition-colors duration-300 ${themeBg}`}>
      {/* Top Header (Hidden when inside an active conversation) */}
      {!isChatOpen && <WhatsAppTopBar />}

      {/* Main Tab Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full h-full min-h-0">
        {activeTab === 'chats' && (
          activeContactId ? <ChatWindow /> : <ChatList />
        )}

        {activeTab === 'gallery' && <MediaGallery />}

        {activeTab === 'profile' && <UserProfileView />}

        {activeTab === 'calls' && <CallsView />}

        {activeTab === 'settings' && <VaultSettingsView />}
      </main>

      {/* Bottom Navigation (Hidden when inside an active conversation) */}
      {!isChatOpen && <WhatsAppBottomBar />}
    </div>
  );
};

