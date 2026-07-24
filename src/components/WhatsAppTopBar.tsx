import React from 'react';
import { useVault } from '../context/VaultContext';
import { useSettings } from '../context/SettingsContext';

export const WhatsAppTopBar: React.FC = () => {
  const { activeTab, setActiveTab, settings: vaultSettings } = useVault();
  const { settings: globalSettings } = useSettings();

  const isDark = globalSettings.darkMode && vaultSettings.theme !== 'material-light' && vaultSettings.theme !== 'light';

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
    <header className={`px-4 py-3 flex items-center justify-center select-none shrink-0 border-b z-30 transition-colors ${
      isDark ? 'bg-[#0b141a] text-white border-[#1f2c34]/40' : 'bg-white text-gray-900 border-gray-200'
    }`}>
      {/* Brand / Tab Title */}
      <div className="flex items-center justify-center w-full">
        <div className="flex flex-col leading-tight cursor-pointer text-center" onClick={() => setActiveTab('chats')}>
          <h1 className={`font-bold text-xl sm:text-2xl tracking-normal text-center ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {getTitle()}
          </h1>
        </div>
      </div>
    </header>
  );
};

