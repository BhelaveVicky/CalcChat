import React from 'react';
import { useVault } from '../context/VaultContext';
import { useSettings } from '../context/SettingsContext';
import { Calculator } from './Calculator';
import { WhatsAppTopBar } from './WhatsAppTopBar';
import { WhatsAppBottomBar } from './WhatsAppBottomBar';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { MediaGallery } from './MediaGallery';
import { UserProfileView } from './UserProfileView';
import { VaultSettingsView } from './VaultSettingsView';
import { CallsView } from './CallsView';
import { CallModal } from './CallModal';

export const VaultContainer: React.FC = () => {
  const { isUnlocked, activeTab, activeContactId, settings: vaultSettings } = useVault();
  const { settings: globalSettings } = useSettings();

  if (!isUnlocked) return <Calculator />;

  const isDark = globalSettings.darkMode && vaultSettings.theme !== 'material-light' && vaultSettings.theme !== 'light';

  // Theme container classes
  let themeBg = isDark ? 'bg-[#0b141a] text-[#e9edef] font-sans' : 'bg-white text-gray-900 font-sans';
  if (isDark && vaultSettings.theme === 'amoled-black') themeBg = 'bg-black text-[#e9edef]';
  if (isDark && vaultSettings.theme === 'cyberpunk') themeBg = 'bg-purple-950 text-pink-100';
  if (isDark && vaultSettings.theme === 'emerald-vault') themeBg = 'bg-emerald-950 text-emerald-100';

  const isChatOpenOnMobile = activeTab === 'chats' && activeContactId;

  return (
    <div className={`flex-1 flex flex-col w-full h-full ${
      vaultSettings.showAndroidFrame ? 'max-w-md mx-auto shadow-2xl' : 'max-w-full'
    } overflow-hidden relative transition-colors duration-300 ${themeBg}`}>
      {/* Top Header (Shown on mobile when chat is not open, or always on mobile view) */}
      {!isChatOpenOnMobile && <WhatsAppTopBar />}

      {/* Main Tab Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full h-full min-h-0">
        {activeTab === 'chats' && (
          vaultSettings.showAndroidFrame ? (
            activeContactId ? <ChatWindow /> : <ChatList />
          ) : (
            /* Fullscreen / Desktop view: Split layout on md+ screens, single pane on mobile screens */
            <div className="flex-1 flex w-full h-full overflow-hidden">
              {/* Chat List column: visible on mobile if no active contact, or on md+ screens always */}
              <div className={`h-full border-r ${isDark ? 'border-[#202c33]' : 'border-gray-200'} ${
                activeContactId ? 'hidden md:flex md:w-80 lg:w-96 shrink-0' : 'flex flex-1 md:flex-none md:w-80 lg:w-96'
              } flex-col overflow-hidden`}>
                <ChatList />
              </div>

              {/* Chat Window column: visible on mobile if active contact, or on md+ screens always */}
              <div className={`h-full flex-1 ${
                activeContactId ? 'flex' : 'hidden md:flex'
              } flex-col overflow-hidden`}>
                {activeContactId ? (
                  <ChatWindow />
                ) : (
                  <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center select-none ${
                    isDark ? 'bg-[#111b21] text-[#8596a0]' : 'bg-gray-50 text-gray-500'
                  }`}>
                    <div className="w-16 h-16 rounded-full bg-[#25d366]/10 flex items-center justify-center mb-4 text-[#25d366]">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.35 5L2 22l5.12-1.32C8.56 21.52 10.22 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
                      </svg>
                    </div>
                    <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-[#e9edef]' : 'text-gray-800'}`}>WhatsApp Vault Web</h3>
                    <p className="text-sm max-w-sm">Select a contact or group to start chatting secretly.</p>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {activeTab === 'gallery' && <MediaGallery />}

        {activeTab === 'profile' && <UserProfileView />}

        {activeTab === 'calls' && <CallsView />}

        {activeTab === 'settings' && <VaultSettingsView />}
      </main>

      {/* Bottom Navigation (Hidden when inside an active conversation on mobile) */}
      {!isChatOpenOnMobile && <WhatsAppBottomBar />}

      {/* Global Call Screen Overlay */}
      <CallModal />
    </div>
  );
};


