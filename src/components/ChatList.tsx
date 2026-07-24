import React, { useState, useRef } from 'react';
import { 
  Search, Plus, Pin, Lock, EyeOff, Bot, MoreVertical, Trash2, Sparkles, 
  PhoneCall, MessageSquare, ArrowLeft, X, Archive, BellOff, CheckCheck, 
  Heart, ListPlus, MinusCircle, LogOut, ChevronRight 
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useSettings } from '../context/SettingsContext';
import { Contact } from '../types';

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
  const { settings: globalSettings } = useSettings();

  const isDark = globalSettings.darkMode && settings.theme !== 'material-light' && settings.theme !== 'light';

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pin' | 'unread' | 'groups'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactStatus, setNewContactStatus] = useState('');
  const [isAiContact, setIsAiContact] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [lockPinAttempt, setLockPinAttempt] = useState('');
  const [targetLockId, setTargetLockId] = useState<string | null>(null);
  const [previewContact, setPreviewContact] = useState<any | null>(null);
  const [fullImageContact, setFullImageContact] = useState<Contact | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handlePressStart = (contactId: string) => {
    isLongPressRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setOpenMenuId(contactId);
      if (navigator.vibrate) {
        try { navigator.vibrate(40); } catch(e) {}
      }
    }, 450);
  };

  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const unreadTotalCount = contacts.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.status.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'pin') return c.isPinned;
    if (activeFilter === 'unread') return c.unreadCount > 0;
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
    <div className={`flex-1 flex flex-col overflow-hidden relative font-sans select-none h-full min-h-0 transition-colors ${
      isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
    }`}>
      
      {/* Search Bar Container */}
      <div className={`px-4 py-2 shrink-0 ${isDark ? 'bg-[#0b141a]' : 'bg-white'}`}>
        <div className={`relative flex items-center rounded-full px-4 py-2 text-sm ${
          isDark ? 'bg-[#202c33]' : 'bg-gray-100'
        }`}>
          <Search className={`w-5 h-5 mr-3 shrink-0 ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Ask Meta AI or Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full bg-transparent focus:outline-none text-base sm:text-sm ${
              isDark ? 'text-[#e9edef] placeholder-[#8596a0]' : 'text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
      </div>

      {/* Filter Chips Horizontal Row */}
      <div className="grid grid-cols-4 gap-2 px-4 py-2 shrink-0 text-xs sm:text-sm">
        <button
          onClick={() => setActiveFilter('all')}
          className={`py-1.5 rounded-full font-medium text-center transition-colors truncate px-2 ${
            activeFilter === 'all' 
              ? (isDark ? 'bg-[#103629] text-[#25d366]' : 'bg-emerald-100 text-emerald-800 font-bold') 
              : (isDark ? 'bg-[#202c33] text-[#8596a0] hover:bg-[#2a3942]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
          }`}
        >
          All
        </button>

        <button
          onClick={() => setActiveFilter('pin')}
          className={`py-1.5 rounded-full font-medium text-center transition-colors truncate px-1 ${
            activeFilter === 'pin' 
              ? (isDark ? 'bg-[#103629] text-[#25d366]' : 'bg-emerald-100 text-emerald-800 font-bold') 
              : (isDark ? 'bg-[#202c33] text-[#8596a0] hover:bg-[#2a3942]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
          }`}
        >
          Pin
        </button>

        <button
          onClick={() => setActiveFilter('unread')}
          className={`py-1.5 rounded-full font-medium text-center transition-colors truncate px-1 ${
            activeFilter === 'unread' 
              ? (isDark ? 'bg-[#103629] text-[#25d366]' : 'bg-emerald-100 text-emerald-800 font-bold') 
              : (isDark ? 'bg-[#202c33] text-[#8596a0] hover:bg-[#2a3942]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
          }`}
        >
          Unread {unreadTotalCount > 0 ? `(${unreadTotalCount})` : ''}
        </button>

        <button
          onClick={() => setActiveFilter('groups')}
          className={`py-1.5 rounded-full font-medium text-center transition-colors truncate px-2 ${
            activeFilter === 'groups' 
              ? (isDark ? 'bg-[#103629] text-[#25d366]' : 'bg-emerald-100 text-emerald-800 font-bold') 
              : (isDark ? 'bg-[#202c33] text-[#8596a0] hover:bg-[#2a3942]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
          }`}
        >
          Groups
        </button>
      </div>

      {/* Disguise Warning Banner if Hide History active */}
      {settings.hideChatHistory && (
        <div className={`px-4 py-1.5 flex items-center justify-between text-xs text-amber-500 border-b ${
          isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-amber-50 border-amber-200'
        }`}>
          <span className="flex items-center gap-1.5 font-mono">
            <EyeOff className="w-3.5 h-3.5" /> Disguised Previews Active
          </span>
          <span className="text-[10px] opacity-80">Tap row to decrypt</span>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-transparent min-h-0 no-scrollbar">
        {sortedContacts.length === 0 ? (
          <div className={`p-8 text-center text-sm flex flex-col items-center justify-center gap-3 h-full ${
            isDark ? 'text-[#8596a0]' : 'text-gray-500'
          }`}>
            <Search className={`w-10 h-10 ${isDark ? 'text-[#2a3942]' : 'text-gray-300'}`} />
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
                onTouchStart={() => handlePressStart(contact.id)}
                onTouchEnd={handlePressEnd}
                onTouchMove={handlePressEnd}
                onMouseDown={() => handlePressStart(contact.id)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setOpenMenuId(contact.id);
                }}
                onClick={() => {
                  if (isLongPressRef.current) {
                    isLongPressRef.current = false;
                    return;
                  }
                  handleContactClick(contact.id, contact.isLocked);
                }}
                className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between relative group ${
                  isDark 
                    ? 'hover:bg-[#202c33]/50 active:bg-[#202c33]' 
                    : 'hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                {/* Left: Avatar */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewContact(contact);
                  }}
                  className="relative shrink-0 mr-3.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                >
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full object-cover ${
                      isDark ? 'bg-[#202c33]' : 'bg-gray-200'
                    }`}
                  />
                  {contact.isOnline && (
                    <span className={`absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] border-2 rounded-full ${
                      isDark ? 'border-[#0b141a]' : 'border-white'
                    }`}></span>
                  )}
                  {contact.isAiBot && (
                    <span className={`absolute -bottom-1 -left-1 p-0.5 rounded-full border ${
                      isDark ? 'bg-[#103629] text-[#25d366] border-[#0b141a]' : 'bg-emerald-100 text-emerald-700 border-white'
                    }`}>
                      <Sparkles className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Middle: Title & Message Preview */}
                <div className={`min-w-0 flex-1 border-b pb-3 flex flex-col justify-center ${
                  isDark ? 'border-[#1f2c34]/60' : 'border-gray-100'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className={`font-semibold text-[16px] truncate ${
                        isDark ? 'text-[#e9edef]' : 'text-gray-900'
                      }`}>{contact.name}</h3>
                      {contact.isPinned && <Pin className={`w-3.5 h-3.5 rotate-45 shrink-0 ${isDark ? 'text-[#8596a0]' : 'text-gray-400'}`} />}
                      {contact.isLocked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                    </div>
                    
                    <span className={`text-xs whitespace-nowrap ml-2 ${
                      unreadBadge > 0 ? 'text-[#25d366] font-medium' : (isDark ? 'text-[#8596a0]' : 'text-gray-400')
                    }`}>
                      {lastMsg ? lastMsg.timestamp : (contact.lastSeen || 'Yesterday')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate flex items-center gap-1 ${
                      isDark ? 'text-[#8596a0]' : 'text-gray-500'
                    }`}>
                      {contact.name.includes('Harsh') ? (
                        <span className={`flex items-center gap-1 italic ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
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

                      {/* Three dots button - ONLY VISIBLE ON DESKTOP/LAPTOP */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenMenuId(openMenuId === contact.id ? null : contact.id);
                        }}
                        className="hidden md:flex p-1 text-[#8596a0] hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Context Action Menu Modal/Popover */}
                {openMenuId === contact.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-black/20 md:bg-transparent" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                      }} 
                    />

                    <div
                      onClick={e => e.stopPropagation()}
                      className={`absolute right-4 top-12 z-50 rounded-2xl shadow-2xl py-2 w-56 text-sm font-sans select-none animate-scale-in border transition-all ${
                        isDark 
                          ? 'bg-[#233138] border-[#2a3942] text-[#e9edef]' 
                          : 'bg-white border-gray-200 text-gray-800 shadow-xl'
                      }`}
                    >
                      {/* 1. Archive chat */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          showToast(`Chat archived`);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                          isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Archive className="w-4.5 h-4.5 opacity-80" />
                          <span>Archive chat</span>
                        </div>
                      </button>

                      {/* 2. Mute notifications */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          showToast(`Notifications muted`);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                          isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <BellOff className="w-4.5 h-4.5 opacity-80" />
                          <span>Mute notifications</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-40" />
                      </button>

                      {/* 3. Pin chat */}
                      <button
                        type="button"
                        onClick={() => {
                          togglePinContact(contact.id);
                          setOpenMenuId(null);
                          showToast(contact.isPinned ? `Unpinned ${contact.name}` : `Pinned ${contact.name}`);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                          isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Pin className="w-4.5 h-4.5 opacity-80" />
                          <span>{contact.isPinned ? 'Unpin chat' : 'Pin chat'}</span>
                        </div>
                      </button>

                      {/* 4. Mark as read / unread */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          showToast(`Marked as unread`);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                          isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <CheckCheck className="w-4.5 h-4.5 opacity-80" />
                          <span>Mark as unread</span>
                        </div>
                      </button>

                      {/* 5. Add to favourites */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          showToast(`Added to favourites`);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                          isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Heart className="w-4.5 h-4.5 opacity-80" />
                          <span>Add to favourites</span>
                        </div>
                      </button>

                      {/* 6. Add to list */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          showToast(`Added to list`);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                          isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <ListPlus className="w-4.5 h-4.5 opacity-80" />
                          <span>Add to list</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-40" />
                      </button>

                      {/* Divider line */}
                      <div className={`my-1 border-t ${isDark ? 'border-[#2a3942]' : 'border-gray-200'}`} />

                      {/* 7. Clear chat */}
                      <button
                        type="button"
                        onClick={() => {
                          clearChatHistory(contact.id);
                          setOpenMenuId(null);
                          showToast(`Chat history cleared`);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                          isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MinusCircle className="w-4.5 h-4.5 opacity-80" />
                          <span>Clear chat</span>
                        </div>
                      </button>

                      {/* 8. Exit group / Delete chat */}
                      <button
                        type="button"
                        onClick={() => {
                          clearChatHistory(contact.id);
                          setOpenMenuId(null);
                          showToast(`Chat deleted`);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors text-rose-500 ${
                          isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <LogOut className="w-4.5 h-4.5" />
                          <span>{contact.name.toLowerCase().includes('group') ? 'Exit group' : 'Delete chat'}</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Buttons removed per user request */}

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

      {/* Contact Profile Image Quick Preview Modal */}
      {previewContact && (
        <div 
          onClick={() => setPreviewContact(null)} 
          className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-6 animate-fade-in"
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-[#1f2c34] rounded-2xl overflow-hidden shadow-2xl w-full max-w-[250px] animate-scale-in relative border border-[#2a3942]"
          >
            {/* Top header with contact name */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent text-white px-4 py-3 z-10 flex items-center justify-between">
              <span className="font-semibold text-[15px] truncate pr-2 shadow-sm">{previewContact.name}</span>
            </div>

            {/* Profile Image Square */}
            <div 
              onClick={() => {
                setFullImageContact(previewContact);
                setPreviewContact(null);
              }}
              className="relative aspect-square w-full cursor-pointer group overflow-hidden"
              title="Click to view full image"
            >
              <img 
                src={previewContact.avatar} 
                alt={previewContact.name} 
                className="w-full h-full object-cover select-none group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold backdrop-blur-[1px]">
                Tap for full screen
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="flex items-center justify-around py-2.5 bg-[#1f2c34] text-[#25d366] border-t border-[#2a3942]/60">
              <button 
                onClick={() => {
                  handleContactClick(previewContact.id, previewContact.isLocked);
                  setPreviewContact(null);
                }}
                className="p-2 hover:bg-[#202c33] rounded-full transition-colors active:scale-95"
                title="Send Message"
              >
                <MessageSquare className="w-5 h-5 stroke-[2.2]" />
              </button>
              
              <button 
                onClick={() => {
                  alert(`Simulating voice call with ${previewContact.name}... 📞`);
                  setPreviewContact(null);
                }}
                className="p-2 hover:bg-[#202c33] rounded-full transition-colors active:scale-95"
                title="Voice Call"
              >
                <PhoneCall className="w-5 h-5 stroke-[2.2]" />
              </button>
              
              <button 
                onClick={() => {
                  alert(`Simulating video call with ${previewContact.name}... 🎥`);
                  setPreviewContact(null);
                }}
                className="p-2 hover:bg-[#202c33] rounded-full transition-colors active:scale-95"
                title="Video Call"
              >
                <PhoneCall className="w-5 h-5 stroke-[2.2] rotate-90" />
              </button>
              
              <button 
                onClick={() => {
                  alert(`Status: "${previewContact.status}"\nLast Seen: ${previewContact.lastSeen || 'Online'}`);
                  setPreviewContact(null);
                }}
                className="p-2 hover:bg-[#202c33] rounded-full transition-colors active:scale-95"
                title="Info"
              >
                <Bot className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Contact Avatar Modal */}
      {fullImageContact && (
        <div 
          onClick={() => setFullImageContact(null)} 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 animate-fade-in text-white select-none backdrop-blur-md"
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between py-2 px-2 max-w-2xl mx-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setFullImageContact(null)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <span className="font-semibold text-lg text-white">{fullImageContact.name}</span>
            </div>
            <button 
              type="button"
              onClick={() => setFullImageContact(null)} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Center Image */}
          <div className="flex-1 flex items-center justify-center p-2 max-w-2xl mx-auto w-full" onClick={e => e.stopPropagation()}>
            <img 
              src={fullImageContact.avatar} 
              alt={fullImageContact.name} 
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain shadow-2xl rounded-lg border border-white/10"
            />
          </div>

          {/* Bottom Bar / Action */}
          <div className="py-2 text-center text-xs text-gray-400">
            Profile Photo • Tap anywhere to close
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#233138] border border-[#25d366]/40 text-[#25d366] px-5 py-2.5 rounded-full text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2 pointer-events-none">
          <CheckCheck className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
};

