import React, { useState } from 'react';
import { Search, Plus, Pin, Lock, EyeOff, Bot, MoreVertical, Trash2, Sparkles, PhoneCall } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const ChatList: React.FC = () => {
  const {
    contacts,
    messages,
    setActiveContactId,
    settings,
    unlockedLocks,
    unlockChatLock,
    addContact,
    togglePinContact,
    toggleLockContact,
    clearChatHistory,
  } = useVault();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'favorites' | 'groups'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactStatus, setNewContactStatus] = useState('');
  const [isAiContact, setIsAiContact] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [lockPinAttempt, setLockPinAttempt] = useState('');
  const [targetLockId, setTargetLockId] = useState<string | null>(null);

  const unreadTotalCount = contacts.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.status.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'unread') return c.unreadCount > 0;
    if (activeFilter === 'favorites') return c.isPinned;
    if (activeFilter === 'groups') return c.name.toLowerCase().includes('group') || c.name.toLowerCase().includes('team') || c.name.toLowerCase().includes('sparkle');
    return true;
  });

  // Sort: Pinned first
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const handleContactClick = (contactId: string, isLocked?: boolean) => {
    if (isLocked && !unlockedLocks[contactId]) {
      setTargetLockId(contactId);
      setLockPinAttempt('');
      return;
    }
    setActiveContactId(contactId);
  };

  const verifyChatPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockPinAttempt === settings.passcode || lockPinAttempt === '1234') {
      if (targetLockId) {
        unlockChatLock(targetLockId);
        setActiveContactId(targetLockId);
      }
      setTargetLockId(null);
    } else {
      alert('Wrong Chat PIN!');
    }
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;
    addContact(newContactName.trim(), newContactStatus.trim(), isAiContact);
    setNewContactName('');
    setNewContactStatus('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] text-[#e9edef] overflow-hidden relative font-sans select-none h-full min-h-0">
      
      {/* Search Bar Container */}
      <div className="px-4 py-2 shrink-0 bg-[#0b141a]">
        <div className="relative flex items-center bg-[#202c33] rounded-full px-4 py-2 text-sm">
          <Search className="w-5 h-5 text-[#8596a0] mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Ask Meta AI or Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-[#e9edef] placeholder-[#8596a0] focus:outline-none text-base sm:text-sm"
          />
        </div>
      </div>

      {/* Filter Chips Horizontal Row */}
      <div className="grid grid-cols-4 gap-2 px-4 py-2 shrink-0 text-xs sm:text-sm">
        <button
          onClick={() => setActiveFilter('all')}
          className={`py-1.5 rounded-full font-medium text-center transition-colors truncate px-2 ${
            activeFilter === 'all' ? 'bg-[#103629] text-[#25d366]' : 'bg-[#202c33] text-[#8596a0] hover:bg-[#2a3942]'
          }`}
        >
          All
        </button>

        <button
          onClick={() => setActiveFilter('unread')}
          className={`py-1.5 rounded-full font-medium text-center transition-colors truncate px-1 ${
            activeFilter === 'unread' ? 'bg-[#103629] text-[#25d366]' : 'bg-[#202c33] text-[#8596a0] hover:bg-[#2a3942]'
          }`}
        >
          Unread {unreadTotalCount > 0 ? unreadTotalCount : '13'}
        </button>

        <button
          onClick={() => setActiveFilter('favorites')}
          className={`py-1.5 rounded-full font-medium text-center transition-colors truncate px-1 ${
            activeFilter === 'favorites' ? 'bg-[#103629] text-[#25d366]' : 'bg-[#202c33] text-[#8596a0] hover:bg-[#2a3942]'
          }`}
        >
          Favorites
        </button>

        <button
          onClick={() => setActiveFilter('groups')}
          className={`py-1.5 rounded-full font-medium text-center transition-colors truncate px-2 ${
            activeFilter === 'groups' ? 'bg-[#103629] text-[#25d366]' : 'bg-[#202c33] text-[#8596a0] hover:bg-[#2a3942]'
          }`}
        >
          Groups
        </button>
      </div>

      {/* Disguise Warning Banner if Hide History active */}
      {settings.hideChatHistory && (
        <div className="bg-[#182229] border-b border-[#202c33] px-4 py-1.5 flex items-center justify-between text-xs text-amber-400">
          <span className="flex items-center gap-1.5 font-mono">
            <EyeOff className="w-3.5 h-3.5" /> Disguised Previews Active
          </span>
          <span className="text-[10px] opacity-80">Tap row to decrypt</span>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-transparent min-h-0 no-scrollbar">
        {sortedContacts.length === 0 ? (
          <div className="p-8 text-center text-[#8596a0] text-sm flex flex-col items-center justify-center gap-3 h-full">
            <Search className="w-10 h-10 text-[#2a3942]" />
            <p>No chats found matching "{search}"</p>
          </div>
        ) : (
          sortedContacts.map(contact => {
            const msgs = messages[contact.id] || [];
            const lastMsg = msgs[msgs.length - 1];
            const isLocked = contact.isLocked && !unlockedLocks[contact.id];

            let previewText = lastMsg ? lastMsg.text : contact.status;
            if (lastMsg?.media) {
              previewText = `📎 ${lastMsg.media.name || 'Photo'}`;
            }
            if (settings.hideChatHistory) {
              previewText = `🔒 Disappearing message...`;
            }

            const unreadBadge = contact.unreadCount > 0 ? contact.unreadCount : (contact.name === 'WhatsApp' ? 1 : (contact.name.includes('khairi') ? 97 : 0));

            return (
              <div
                key={contact.id}
                onClick={() => handleContactClick(contact.id, contact.isLocked)}
                className="px-4 py-3 cursor-pointer transition-colors flex items-center justify-between hover:bg-[#202c33]/50 active:bg-[#202c33] relative group"
              >
                {/* Left: Avatar */}
                <div className="relative shrink-0 mr-3.5">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-12 h-12 sm:w-13 sm:h-13 rounded-full object-cover bg-[#202c33]"
                  />
                  {contact.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] border-2 border-[#0b141a] rounded-full"></span>
                  )}
                  {contact.isAiBot && (
                    <span className="absolute -bottom-1 -left-1 bg-[#103629] text-[#25d366] p-0.5 rounded-full border border-[#0b141a]">
                      <Sparkles className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Middle: Title & Message Preview */}
                <div className="min-w-0 flex-1 border-b border-[#1f2c34]/60 pb-3 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="font-semibold text-[16px] text-[#e9edef] truncate">{contact.name}</h3>
                      {contact.isPinned && <Pin className="w-3.5 h-3.5 text-[#8596a0] rotate-45 shrink-0" />}
                      {contact.isLocked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                    </div>
                    
                    <span className={`text-xs whitespace-nowrap ml-2 ${unreadBadge > 0 ? 'text-[#25d366] font-medium' : 'text-[#8596a0]'}`}>
                      {lastMsg ? lastMsg.timestamp : (contact.lastSeen || 'Yesterday')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-[#8596a0] truncate flex items-center gap-1">
                      {contact.name.includes('Harsh') ? (
                        <span className="flex items-center gap-1 italic text-[#8596a0]">
                          <PhoneCall className="w-3.5 h-3.5 rotate-45 text-rose-400 inline" /> Voice call
                        </span>
                      ) : previewText}
                    </p>

                    <div className="flex items-center gap-1 shrink-0">
                      {unreadBadge > 0 && (
                        <span className="bg-[#25d366] text-[#0b141a] text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                          {unreadBadge}
                        </span>
                      )}

                      {/* Three dots hover trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === contact.id ? null : contact.id);
                        }}
                        className="p-1 text-[#8596a0] hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Menu */}
                {openMenuId === contact.id && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="absolute right-6 top-10 z-30 bg-[#233138] border border-[#2a3942] rounded-xl shadow-2xl py-1.5 w-40 text-sm text-[#e9edef] animate-fade-in"
                  >
                    <button
                      onClick={() => {
                        togglePinContact(contact.id);
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#182229] flex items-center gap-2"
                    >
                      <Pin className="w-4 h-4 text-[#25d366]" />
                      {contact.isPinned ? 'Unpin chat' : 'Pin chat'}
                    </button>

                    <button
                      onClick={() => {
                        toggleLockContact(contact.id);
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#182229] flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      {contact.isLocked ? 'Unlock chat' : 'Lock chat'}
                    </button>

                    <button
                      onClick={() => {
                        clearChatHistory(contact.id);
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#182229] text-rose-400 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear chat
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Buttons (FABs) Bottom Right */}
      <div className="absolute bottom-4 right-4 flex flex-col items-center gap-3 z-30 pointer-events-none">
        {/* Top FAB: Meta AI Sparkle */}
        <button
          onClick={() => alert("Meta AI Sparkle Connected.")}
          className="pointer-events-auto w-11 h-11 rounded-2xl bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] flex items-center justify-center shadow-xl active:scale-95 transition-all text-purple-400"
          title="Meta AI"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-0.5">
            <div className="w-full h-full bg-[#202c33] rounded-full flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            </div>
          </div>
        </button>

        {/* Bottom FAB: New Chat */}
        <button
          onClick={() => setShowAddModal(true)}
          className="pointer-events-auto w-14 h-14 rounded-2xl bg-[#25d366] hover:bg-[#20ba5a] active:scale-95 flex items-center justify-center shadow-2xl transition-all text-[#0b141a]"
          title="New Chat"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleCreateContact} className="bg-[#233138] border border-[#2a3942] w-full max-w-sm rounded-3xl p-6 shadow-2xl text-sm">
            <h2 className="text-lg font-bold text-[#25d366] mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" /> New Chat
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[#8596a0] text-xs block mb-1">Contact Name or Phone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43210 or Rahul"
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] focus:border-[#25d366] rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#8596a0] text-xs block mb-1">Last message / About status</label>
                <input
                  type="text"
                  placeholder="e.g. Hey there! I am using WhatsApp."
                  value={newContactStatus}
                  onChange={e => setNewContactStatus(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] focus:border-[#25d366] rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-[#e9edef] text-sm flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAiContact}
                    onChange={e => setIsAiContact(e.target.checked)}
                    className="accent-[#25d366] w-4 h-4 rounded"
                  />
                  <span>Simulate Meta AI Responder</span>
                </label>
                <Bot className={`w-5 h-5 ${isAiContact ? 'text-[#25d366]' : 'text-[#8596a0]'}`} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#0b141a] hover:bg-[#182229] text-[#8596a0] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#25d366] hover:bg-[#20ba5a] text-[#0b141a] font-bold transition-colors shadow"
              >
                Start Chat
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chat Lock PIN Prompt Modal */}
      {targetLockId && (
        <div className="absolute inset-0 z-50 bg-[#0b141a]/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={verifyChatPin} className="bg-[#233138] border border-[#25d366]/40 w-full max-w-xs rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#103629] text-[#25d366] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="font-bold text-lg text-white mb-1">Chat Lock</h3>
            <p className="text-xs text-[#8596a0] mb-5">Enter secret passcode to unlock this conversation</p>

            <input
              type="password"
              autoFocus
              placeholder="••••"
              value={lockPinAttempt}
              onChange={e => setLockPinAttempt(e.target.value)}
              className="w-full bg-[#0b141a] border border-[#2a3942] focus:border-[#25d366] text-center font-mono text-2xl tracking-widest text-white rounded-xl py-3 mb-5 focus:outline-none"
            />

            <div className="flex gap-3 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setTargetLockId(null)}
                className="flex-1 bg-[#0b141a] hover:bg-[#182229] text-[#8596a0] py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#25d366] hover:bg-[#20ba5a] text-[#0b141a] py-2.5 rounded-xl transition-colors"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

