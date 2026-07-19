import React, { useState } from 'react';
import { Camera, MoreVertical, Search, PlusCircle, ShieldAlert } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const WhatsAppTopBar: React.FC = () => {
  const { lockVault, activeTab, setActiveTab, user } = useVault();
  const [showMenu, setShowMenu] = useState(false);

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
    <header className="bg-[#0b141a] px-4 py-3 flex items-center justify-between text-white select-none shrink-0 border-b border-[#1f2c34]/40 z-30">
      {/* Brand / Tab Title */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col leading-tight cursor-pointer" onClick={() => setActiveTab('chats')}>
          <h1 className="font-bold text-xl sm:text-2xl text-white tracking-normal">
            {getTitle()}
          </h1>
          {activeTab === 'profile' && (
            <span className="text-[11px] text-[#8596a0]">Signed in as {user.name}</span>
          )}
        </div>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-4 sm:gap-5 text-[#f1f1f2]">
        {activeTab === 'chats' && (
          <button 
            onClick={() => alert("₹ Meta Pay Secure Channel Ready.")} 
            className="hover:opacity-80 active:scale-95 transition-all p-1"
            title="Payments"
          >
            <div className="w-6 h-6 rounded-full border-1.5 border-current flex items-center justify-center text-xs font-semibold">
              ₹
            </div>
          </button>
        )}

        {activeTab === 'gallery' && (
          <button 
            onClick={() => alert("Add new status update")} 
            className="hover:opacity-80 active:scale-95 transition-all p-1 text-[#e9edef]"
            title="Create Status"
          >
            <PlusCircle className="w-6 h-6 stroke-[1.8]" />
          </button>
        )}

        {activeTab === 'calls' && (
          <button 
            onClick={() => alert("Search calls history")} 
            className="hover:opacity-80 active:scale-95 transition-all p-1 text-[#e9edef]"
            title="Search"
          >
            <Search className="w-6 h-6 stroke-[1.8]" />
          </button>
        )}

        {activeTab !== 'gallery' && (
          <button 
            onClick={() => setActiveTab('gallery')} 
            className="hover:opacity-80 active:scale-95 transition-all p-1"
            title="Camera"
          >
            <Camera className="w-6 h-6" />
          </button>
        )}

        {/* More Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="hover:opacity-80 active:scale-95 transition-all p-1"
            title="More options"
          >
            <MoreVertical className="w-6 h-6" />
          </button>

          {showMenu && (
            <div 
              onClick={() => setShowMenu(false)}
              className="absolute right-0 top-10 w-48 bg-[#233138] rounded-xl shadow-2xl py-2 text-sm text-[#e9edef] z-50 border border-[#2a3942] animate-fade-in"
            >
              <button 
                onClick={() => setActiveTab('settings')}
                className="w-full text-left px-4 py-2.5 hover:bg-[#182229] transition-colors"
              >
                Settings
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-full text-left px-4 py-2.5 hover:bg-[#182229] transition-colors"
              >
                Profile
              </button>
              <button 
                onClick={lockVault}
                className="w-full text-left px-4 py-2.5 hover:bg-[#182229] text-rose-400 font-medium flex items-center gap-2 transition-colors border-t border-[#2a3942]/60 mt-1"
              >
                <ShieldAlert className="w-4 h-4" />
                Lock Vault
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
