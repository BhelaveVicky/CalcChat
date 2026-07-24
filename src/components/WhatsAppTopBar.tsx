import React from 'react';
import { useVault } from '../context/VaultContext';

export const WhatsAppTopBar: React.FC = () => {
  const { activeTab, setActiveTab, user } = useVault();

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
    <header className="bg-[#0b141a] px-4 py-3 flex items-center justify-center text-white select-none shrink-0 border-b border-[#1f2c34]/40 z-30">
      {/* Brand / Tab Title */}
      <div className="flex items-center justify-center w-full">
        <div className="flex flex-col leading-tight cursor-pointer text-center" onClick={() => setActiveTab('chats')}>
          <h1 className="font-bold text-xl sm:text-2xl text-white tracking-normal text-center">
            {getTitle()}
          </h1>
        </div>
      </div>
    </header>
  );
};
