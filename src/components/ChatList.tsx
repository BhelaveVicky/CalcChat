import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Pin, Lock, EyeOff, Bot, MoreVertical, Trash2, Sparkles,
  PhoneCall, MessageSquare, ArrowLeft, X, Archive, Bell, BellOff, CheckCheck, Check,
  Heart, ListPlus, MinusCircle, LogOut, ChevronRight, Users, UserPlus, UserCheck,
  MessageSquarePlus, Tag, Video, User, Ban, UserMinus
} from 'lucide-react';
import { useVault, WELCOME_MESSAGE_TEXT } from '../context/VaultContext';
import { Contact, Message } from '../types';
import { NicknameModal } from './NicknameModal';
import { formatChatDate, formatMessageTime, formatLastSeen } from '../lib/dateUtils.ts';
import { WhatsAppProfileViewer } from './WhatsAppProfileViewer';
import { checkIsAdmin, VerifiedBadge } from '../lib/adminUtils';
import { AIChatWindow } from './AIChatWindow';
import { PINK_AI_AVATAR_SVG } from '../assets/aiAvatarData';

export const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    contacts,
    messages,
    setActiveContactId,
    settings,
    unlockedLocks,
    unlockChatLock,
    lockVault,
    addContact,
    createGroup,
    togglePinContact,
    toggleLockContact,
    toggleArchiveContact,
    toggleFavoriteContact,
    toggleMuteContact,
    clearChatHistory,
    customNicknames,
    getContactDisplayName,
    isUserOnline,
    allRegisteredUsers,
    pendingFriendRequests,
    sentFriendRequests,
    friendUids,
    sendFriendRequest,
    acceptFriendRequest,
    blockedContactIds,
    blockedByContactIds,
    blockContact,
    unblockContact,
    unfriendContact,
    pushOverlayHandler,
  } = useVault();

  const isDark = settings.theme !== 'material-light' && settings.theme !== 'light';

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    name: string;
    username: string;
    avatar: string;
    status: string;
    isOnline: boolean;
    about?: string;
    mutualFriendsCount?: number;
    friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'self';
    requestId?: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pin' | 'favourites' | 'groups'>('all');
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [nicknameTargetContact, setNicknameTargetContact] = useState<Contact | null>(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [customMemberInput, setCustomMemberInput] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactStatus, setNewContactStatus] = useState('');
  const [isAiContact, setIsAiContact] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [lockPinAttempt, setLockPinAttempt] = useState('');
  const [targetLockId, setTargetLockId] = useState<string | null>(null);
  const [previewContact, setPreviewContact] = useState<any | null>(null);
  const [fullImageContact, setFullImageContact] = useState<Contact | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showAIChat, setShowAIChat] = useState<boolean>(false);
  const [aiConversations, setAiConversations] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('calcchat_ai_conversations_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [aiPinned, setAiPinned] = useState<boolean>(() => localStorage.getItem('calcchat_ai_pinned') === 'true');
  const [aiMuted, setAiMuted] = useState<boolean>(() => localStorage.getItem('calcchat_ai_muted') === 'true');

  const reloadAiConvs = () => {
    try {
      const saved = localStorage.getItem('calcchat_ai_conversations_v2');
      setAiConversations(saved ? JSON.parse(saved) : []);
    } catch {
      setAiConversations([]);
    }
  };

  // Register overlay handlers so mobile hardware back button closes modals & popups step-by-step
  useEffect(() => {
    if (showAddModal) return pushOverlayHandler('showAddModal', () => setShowAddModal(false));
  }, [showAddModal, pushOverlayHandler]);

  useEffect(() => {
    if (showCreateGroupModal) return pushOverlayHandler('showCreateGroupModal', () => setShowCreateGroupModal(false));
  }, [showCreateGroupModal, pushOverlayHandler]);

  useEffect(() => {
    if (previewContact) return pushOverlayHandler('previewContact', () => setPreviewContact(null));
  }, [previewContact, pushOverlayHandler]);

  useEffect(() => {
    if (fullImageContact) return pushOverlayHandler('fullImageContact', () => setFullImageContact(null));
  }, [fullImageContact, pushOverlayHandler]);

  useEffect(() => {
    if (targetLockId) return pushOverlayHandler('targetLockId', () => setTargetLockId(null));
  }, [targetLockId, pushOverlayHandler]);

  useEffect(() => {
    if (openMenuId) return pushOverlayHandler('openMenuId', () => setOpenMenuId(null));
  }, [openMenuId, pushOverlayHandler]);

  useEffect(() => {
    if (showAIChat) return pushOverlayHandler('showAIChat', () => setShowAIChat(false));
  }, [showAIChat, pushOverlayHandler]);

  useEffect(() => {
    reloadAiConvs();
    const handleAiUpdate = () => reloadAiConvs();
    window.addEventListener('calcchat_ai_updated', handleAiUpdate);
    window.addEventListener('storage', handleAiUpdate);
    return () => {
      window.removeEventListener('calcchat_ai_updated', handleAiUpdate);
      window.removeEventListener('storage', handleAiUpdate);
    };
  }, []);

  // Active AI conversation check
  const activeAiConv = React.useMemo(() => {
    if (!aiConversations || !Array.isArray(aiConversations)) return null;
    return aiConversations.find((c: any) => c.messages && Array.isArray(c.messages) && c.messages.some((m: any) => m.sender === 'user')) || null;
  }, [aiConversations]);

  const selectableMembers = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatar: string; username?: string }>();

    // Add non-group, non-self contacts
    contacts.forEach(c => {
      if (!c.isGroup && !c.isSelf && c.id !== user.id) {
        map.set(c.id, {
          id: c.id,
          name: getContactDisplayName(c),
          avatar: c.avatar,
          username: c.username,
        });
      }
    });

    // Add registered users (except current user)
    allRegisteredUsers.forEach(u => {
      const uid = u.uid || u.id;
      if (uid && uid !== user.id && !map.has(uid)) {
        map.set(uid, {
          id: uid,
          name: u.displayName || u.name || u.username || 'User',
          avatar: u.photoURL || u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          username: u.username,
        });
      }
    });

    return Array.from(map.values());
  }, [contacts, allRegisteredUsers, user.id, getContactDisplayName]);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const q = search.trim().toLowerCase();
    const currentUid = user.id;

    const results = allRegisteredUsers
      .map((u) => {
        const uid = u.uid || u.id;
        if (blockedContactIds.includes(uid) || blockedByContactIds.includes(uid)) return null;
        const username = (u.username || '').toString();
        const displayName = (u.displayName || u.name || '').toString();
        const about = (u.about || u.status || 'Available on CalcChat').toString();
        const customNick = (customNicknames[uid] || '').toLowerCase();
        const matches =
          uid.toLowerCase().includes(q) ||
          username.toLowerCase().includes(q) ||
          displayName.toLowerCase().includes(q) ||
          about.toLowerCase().includes(q) ||
          customNick.includes(q);

        if (!matches) return null;

        let friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'self' = 'none';
        let requestId: string | undefined;
        if (uid === currentUid) {
          friendStatus = 'self';
        } else if (friendUids.includes(uid)) {
          friendStatus = 'friends';
        } else {
          const sent = sentFriendRequests.find((req) => req.receiverId === uid && req.status === 'pending');
          const incoming = pendingFriendRequests.find((req) => req.senderId === uid && req.status === 'pending');
          if (sent) {
            friendStatus = 'pending_sent';
            requestId = sent.id;
          } else if (incoming) {
            friendStatus = 'pending_received';
            requestId = incoming.id;
          }
        }

        const mutualFriendsCount = Array.isArray(u.friends)
          ? u.friends.filter((friendId: string) => friendUids.includes(friendId) && friendId !== uid).length
          : 0;

        return {
          id: uid,
          name: uid === currentUid ? `${displayName || username} (You)` : (customNicknames[uid] || displayName || username || 'User'),
          username,
          avatar: u.photoURL || u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          status: uid === currentUid ? 'Message yourself • Personal Notes' : (u.status || 'Available on CalcChat'),
          about,
          isOnline: isUserOnline(uid),
          mutualFriendsCount,
          friendStatus,
          requestId,
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        name: string;
        username: string;
        avatar: string;
        status: string;
        about?: string;
        isOnline: boolean;
        mutualFriendsCount?: number;
        friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'self';
        requestId?: string;
      }>;

    setSearchResults(results);
    setIsSearching(false);
  }, [search, allRegisteredUsers, customNicknames, friendUids, pendingFriendRequests, sentFriendRequests, user.id, blockedContactIds, blockedByContactIds]);

  const handlePressStart = (contactId: string) => {
    isLongPressRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setOpenMenuId(contactId);
      if (navigator.vibrate) {
        try { navigator.vibrate(40); } catch (e) { }
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
  const archivedContactsCount = contacts.filter(c => c.isArchived).length;

  const filteredContacts = contacts.filter(c => {
    if (blockedContactIds.includes(c.id) || blockedByContactIds.includes(c.id)) {
      return false;
    }
    const nickname = customNicknames[c.id] || '';
    const displayName = getContactDisplayName(c);
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      nickname.toLowerCase().includes(search.toLowerCase()) ||
      displayName.toLowerCase().includes(search.toLowerCase()) ||
      c.status.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (showArchivedOnly) {
      return !!c.isArchived;
    }

    if (c.isArchived && !search.trim()) return false;

    if (activeFilter === 'pin') return c.isPinned;
    if (activeFilter === 'favourites') return c.isFavorite;
    if (activeFilter === 'groups') return c.isGroup || c.name.toLowerCase().includes('group') || c.name.toLowerCase().includes('team') || c.name.toLowerCase().includes('sparkle');
    return true;
  });

  // Helper to determine latest message activity timestamp for sorting
  const getLatestActivity = (c: Contact): number => {
    if (typeof c.lastActivityTime === 'number' && c.lastActivityTime > 0) {
      return c.lastActivityTime;
    }
    const msgs = messages[c.id] || [];
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg) {
      if (lastMsg.createdAt?.toMillis) {
        return lastMsg.createdAt.toMillis();
      }
      if (lastMsg.createdAt?.seconds) {
        return lastMsg.createdAt.seconds * 1000;
      }
      if (typeof lastMsg.createdAt === 'number') {
        return lastMsg.createdAt;
      }
      return Date.now();
    }
    if (c.lastMessageTime) {
      if (c.lastMessageTime?.toMillis) {
        return c.lastMessageTime.toMillis();
      }
      if (c.lastMessageTime?.seconds) {
        return c.lastMessageTime.seconds * 1000;
      }
      if (typeof c.lastMessageTime === 'number') {
        return c.lastMessageTime;
      }
    }
    return 0;
  };

  // Sort: Pinned first, then by latest message activity (most recent first) exactly like WhatsApp
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    const timeA = getLatestActivity(a);
    const timeB = getLatestActivity(b);

    if (timeB !== timeA) {
      return timeB - timeA;
    }

    return a.name.localeCompare(b.name);
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
    const activePass = settings.passcode || user.passcode || '1234';
    if (lockPinAttempt === activePass) {
      if (targetLockId) {
        unlockChatLock(targetLockId);
        setActiveContactId(targetLockId);
      }
      setTargetLockId(null);
      setLockPinAttempt('');
    } else {
      setTargetLockId(null);
      setLockPinAttempt('');
      lockVault();
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

  const toggleSelectMember = (contactId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupNameInput.trim()) return;

    const customMembers = customMemberInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Pass member UIDs (selectedMemberIds) and custom entries so createGroup resolves all user UIDs for group propagation
    const allMembers = Array.from(new Set([...selectedMemberIds, ...customMembers]));

    const newGroupId = createGroup(groupNameInput.trim(), allMembers);
    showToast(`Group "${groupNameInput.trim()}" created!`);
    setGroupNameInput('');
    setCustomMemberInput('');
    setSelectedMemberIds([]);
    setShowCreateGroupModal(false);
    setActiveContactId(newGroupId);
  };

  if (showAIChat) {
    return (
      <AIChatWindow
        onClose={() => {
          setShowAIChat(false);
          reloadAiConvs();
        }}
        onClearAIChatFromList={() => {
          reloadAiConvs();
        }}
      />
    );
  }

  return (
    <div className={`flex-1 flex flex-col overflow-hidden relative font-sans select-none h-full min-h-0 transition-colors ${isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
      }`}>

      {/* Search Bar Container */}
      <div className={`px-4 py-2 shrink-0 ${isDark ? 'bg-[#0b141a]' : 'bg-white'}`}>
        <div className={`relative flex items-center rounded-full px-4 py-2 text-sm ${isDark ? 'bg-[#202c33]' : 'bg-gray-100'
          }`}>
          <Search className={`w-5 h-5 mr-3 shrink-0 ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Ask Meta AI or Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full bg-transparent focus:outline-none text-base sm:text-sm ${isDark ? 'text-[#e9edef] placeholder-[#8596a0]' : 'text-gray-900 placeholder-gray-400'
              }`}
          />
        </div>
      </div>

      {/* Filter Chips Horizontal Row */}
      <div className="flex items-center gap-2 px-4 py-2 shrink-0 text-xs sm:text-sm overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All' },
          { id: 'pin', label: 'Pin' },
          { id: 'favourites', label: `Favourites${contacts.filter(c => c.isFavorite).length > 0 ? ` (${contacts.filter(c => c.isFavorite).length})` : ''}` },
          { id: 'groups', label: 'Groups' },
        ].map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`flex-1 min-w-[68px] py-1.5 px-3 rounded-full font-medium text-center flex items-center justify-center transition-all whitespace-nowrap cursor-pointer ${isActive
                  ? (isDark ? 'bg-[#ff2e93]/20 text-[#ff2e93] font-bold border border-[#ff2e93]/40' : 'bg-pink-100 text-pink-700 font-bold border border-pink-300')
                  : (isDark ? 'bg-[#202c33] text-[#8596a0] hover:bg-[#2a3942]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Disguise Warning Banner if Hide History active */}
      {settings.hideChatHistory && (
        <div className={`px-4 py-1.5 flex items-center justify-between text-xs text-amber-500 border-b ${isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-amber-50 border-amber-200'
          }`}>
          <span className="flex items-center gap-1.5 font-mono">
            <EyeOff className="w-3.5 h-3.5" /> Disguised Previews Active
          </span>
          <span className="text-[10px] opacity-80">Tap row to decrypt</span>
        </div>
      )}

      {/* Archived Banner - SHOWN WHEN THERE ARE ARCHIVED CHATS */}
      {!showArchivedOnly && archivedContactsCount > 0 && (
        <div className={`px-4 py-2 shrink-0 border-b ${isDark ? 'border-[#2a3942]/30 bg-[#0b141a]' : 'border-gray-100 bg-white'}`}>
          <button
            type="button"
            onClick={() => setShowArchivedOnly(true)}
            className={`w-full py-2.5 px-4 rounded-2xl flex items-center justify-between transition-all font-medium text-sm shadow-xs group cursor-pointer ${isDark
                ? 'bg-[#182229] hover:bg-[#202c33] text-[#e9edef] border border-[#2a3942]'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isDark ? 'bg-[#202c33] text-[#ff2e93]' : 'bg-pink-100 text-pink-600'
                }`}>
                <Archive className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold block leading-tight">Archived</span>
                <span className="text-[11px] text-[#ff2e93] block">Tap to view archived chats</span>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#ff2e93] text-white shadow-sm">
              {archivedContactsCount}
            </span>
          </button>
        </div>
      )}

      {/* Header bar when viewing Archived list */}
      {showArchivedOnly && (
        <div className={`px-4 py-2.5 shrink-0 flex items-center justify-between border-b ${isDark ? 'bg-[#182229] border-[#2a3942] text-white' : 'bg-pink-50 border-pink-200 text-gray-900'
          }`}>
          <button
            type="button"
            onClick={() => setShowArchivedOnly(false)}
            className="flex items-center gap-2 text-sm font-bold text-[#ff2e93] hover:opacity-80"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Archived Chats ({archivedContactsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setShowArchivedOnly(false)}
            className="text-xs font-semibold px-3 py-1 rounded-full bg-[#ff2e93]/20 text-[#ff2e93] hover:bg-[#ff2e93]/30 transition-colors"
          >
            Back to All
          </button>
        </div>
      )}

      {/* Conversations & Global Search List */}
      <div className="flex-1 overflow-y-auto divide-y divide-transparent min-h-0 no-scrollbar">
        {/* AI Assistant Contact Item - ONLY VISIBLE AFTER USER SENDS FIRST MESSAGE */}
        {!showArchivedOnly && (!search.trim() || 'calcchat ai assistant'.includes(search.toLowerCase()) || 'ai'.includes(search.toLowerCase())) && activeAiConv && (
          (() => {
            const lastAiMsg = activeAiConv.messages && activeAiConv.messages.length > 0 
              ? activeAiConv.messages[activeAiConv.messages.length - 1] 
              : null;
            return (
              <div
                onClick={() => setShowAIChat(true)}
                className={`p-3 sm:p-3.5 mx-2 my-1.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between border select-none group relative ${
                  isDark
                    ? 'bg-[#182229] hover:bg-[#202c33] border-[#2a3942]/60 text-white'
                    : 'bg-white hover:bg-slate-50 border-gray-100 text-gray-900 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-[#ff2e93] via-[#ff62b0] to-[#f43f5e] shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
                      <img src={PINK_AI_AVATAR_SVG} alt="AI Bot" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0b141a] rounded-full animate-pulse" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="font-bold text-sm truncate tracking-wide text-white">CalcChat AI Assistant</h4>
                        <span className="bg-[#ff2e93] text-white text-[9px] font-black px-1.5 py-0.2 rounded shadow-sm">AI</span>
                        {aiMuted && <BellOff className="w-3.5 h-3.5 text-gray-400 shrink-0 opacity-80" />}
                        {aiPinned && <Pin className="w-3.5 h-3.5 rotate-45 text-pink-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {lastAiMsg ? lastAiMsg.timestamp : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#ff2e93] shrink-0" />
                      <span className="truncate">
                        {lastAiMsg ? (lastAiMsg.sender === 'user' ? `You: ${lastAiMsg.text}` : lastAiMsg.text) : 'Ask me anything'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* AI Chat Menu Options */}
                <div className="relative ml-2" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === 'ai_chat_menu' ? null : 'ai_chat_menu');
                    }}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenuId === 'ai_chat_menu' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                      <div className={`absolute right-0 top-8 z-50 rounded-2xl shadow-2xl py-2 w-48 text-xs font-sans border ${
                        isDark ? 'bg-[#233138] border-[#2a3942] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-800'
                      }`}>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            setShowAIChat(true);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 cursor-pointer font-medium"
                        >
                          <MessageSquare className="w-4 h-4 text-[#ff2e93]" />
                          <span>Open Chat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            const nextPinned = !aiPinned;
                            setAiPinned(nextPinned);
                            localStorage.setItem('calcchat_ai_pinned', nextPinned ? 'true' : 'false');
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 cursor-pointer font-medium"
                        >
                          <Pin className="w-4 h-4 text-amber-400" />
                          <span>{aiPinned ? 'Unpin Chat' : 'Pin Chat'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            const nextMuted = !aiMuted;
                            setAiMuted(nextMuted);
                            localStorage.setItem('calcchat_ai_muted', nextMuted ? 'true' : 'false');
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 cursor-pointer font-medium"
                        >
                          <BellOff className="w-4 h-4 text-cyan-400" />
                          <span>{aiMuted ? 'Unmute' : 'Mute Notifications'}</span>
                        </button>
                        <div className="my-1 border-t border-gray-700/50" />
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            localStorage.removeItem('calcchat_ai_conversations_v2');
                            localStorage.removeItem('calcchat_active_ai_id_v2');
                            window.dispatchEvent(new Event('calcchat_ai_updated'));
                            setToastMsg('AI Chat cleared & removed');
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-rose-500/20 text-rose-400 flex items-center gap-2.5 cursor-pointer font-semibold"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Clear / Delete Chat</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()
        )}
        {/* Global User Search Section when user is typing in search input */}
        {search.trim().length > 0 && (
          <div className="p-4 border-b border-[#2a3942]/40">
            <h4 className="text-xs font-bold text-[#ff2e93] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> Global User Search Results
            </h4>

            {isSearching ? (
              <p className="text-xs text-gray-400 animate-pulse py-2">Searching users in Firebase...</p>
            ) : searchResults.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border ${isDark ? 'bg-[#111b21] border-[#202c33] text-[#ff2e93]' : 'bg-pink-50 border-pink-200 text-pink-600'
                  }`}>
                  <Search className="w-8 h-8" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>No matching users</p>
                  <p className="text-xs text-gray-500 mt-1">Try searching by username or display name.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {searchResults.map(resUser => (
                  <div
                    key={resUser.id}
                    onClick={() => {
                      navigate(`/profile/${resUser.id}`);
                      setSearch('');
                    }}
                    className={`group flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl ${isDark ? 'bg-[#111b21] border-[#202c33] hover:border-[#ff2e93]/40' : 'bg-gray-50 border-gray-200 hover:border-[#ff2e93]/40'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={resUser.avatar}
                          alt={resUser.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#ff2e93]/30 transition-all"
                        />
                        {resUser.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0b141a]"></span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h5 className="font-bold text-sm text-white truncate">{resUser.name}</h5>
                          {checkIsAdmin(resUser) && <VerifiedBadge className="w-4 h-4 shrink-0 text-[#00a8ff]" />}
                          {resUser.isOnline && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Online</span>
                          )}
                        </div>
                        <p className="text-xs text-[#ff2e93] font-mono truncate">@{resUser.username}</p>
                        <p className={`text-[11px] mt-0.5 line-clamp-2 ${isDark ? 'text-[#8696a0]' : 'text-slate-500'}`}>
                          {resUser.about || resUser.status}
                        </p>
                        {resUser.mutualFriendsCount ? (
                          <p className="text-[10px] mt-1 text-[#ff2e93] font-medium">{resUser.mutualFriendsCount} mutual friends</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                      {resUser.friendStatus === 'none' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await sendFriendRequest(resUser.id);
                            showToast('Friend request sent.');
                          }}
                          className="px-4 py-2 rounded-xl bg-[#ff2e93] hover:bg-[#ff1e85] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-pink-500/20 transition-all active:scale-95 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Add Friend
                        </button>
                      )}

                      {resUser.friendStatus === 'pending_sent' && (
                        <span className="text-xs text-slate-300 font-semibold px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                          Request Sent
                        </span>
                      )}

                      {resUser.friendStatus === 'pending_received' && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (resUser.requestId) {
                              await acceptFriendRequest(resUser.requestId, resUser.id);
                              showToast('🎉 You are now friends!');
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0b141a] font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Accept
                        </button>
                      )}

                      {resUser.friendStatus === 'friends' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveContactId(resUser.id);
                            setSearch('');
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/20 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Chat
                        </button>
                      )}

                      {resUser.friendStatus === 'self' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveContactId(resUser.id);
                            setSearch('');
                          }}
                          className="px-4 py-2 rounded-xl bg-[#ff2e93] hover:bg-[#ff1e85] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-pink-500/20 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Message Yourself
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {sortedContacts.length === 0 && activeFilter === 'favourites' && !search.trim() ? (
          <div className={`p-8 text-center text-sm flex flex-col items-center justify-center gap-3 h-full min-h-[250px] ${isDark ? 'text-[#8596a0]' : 'text-gray-500'
            }`}>
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 shadow-inner">
              <Heart className="w-8 h-8 fill-red-500" />
            </div>
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>No Favourites Yet</h3>
            <p className="max-w-xs text-xs text-gray-400 leading-relaxed">
              Long press or click the 3-dots options menu on any chat and tap <span className="text-[#ff2e93] font-bold">"Add to favourites"</span> to filter them here!
            </p>
          </div>
        ) : sortedContacts.length === 0 && !search.trim() ? (
          <div className={`p-8 text-center text-sm flex flex-col items-center justify-center gap-3 h-full min-h-[300px] ${isDark ? 'text-[#8596a0]' : 'text-gray-500'
            }`}>
            <div className="w-16 h-16 rounded-3xl bg-[#ff2e93]/10 text-[#ff2e93] flex items-center justify-center border border-[#ff2e93]/20 shadow-inner">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-white">No Friends Yet</h3>
            <p className="max-w-xs text-xs text-gray-400 leading-relaxed">
              Use the search bar above to search for users by their username or display name and send them a friend request to unlock real-time chatting!
            </p>
          </div>
        ) : sortedContacts.length === 0 ? (
          <div className={`p-8 text-center text-sm flex flex-col items-center justify-center gap-3 h-full ${isDark ? 'text-[#8596a0]' : 'text-gray-500'
            }`}>
            <Search className={`w-10 h-10 ${isDark ? 'text-[#2a3942]' : 'text-gray-300'}`} />
            <p>No existing chats found matching "{search}"</p>
          </div>
        ) : (
          sortedContacts.map(contact => {
            const rawMsgs = messages[contact.id] || [];
            const currentUserId = user?.id || 'user';
            const msgs = rawMsgs.filter(m => !m.deletedForMe && (!m.deletedFor || !m.deletedFor.includes(currentUserId)));
            const lastMsg = msgs[msgs.length - 1];
            const isLocked = contact.isLocked && !unlockedLocks[contact.id];

            // Helper to generate WhatsApp style preview text and metadata
            const getWhatsAppPreviewData = () => {
              if (settings.hideChatHistory) {
                return {
                  text: '🔒 Disappearing message...',
                  isOutgoing: false,
                  status: null,
                };
              }

              if (!msgs || msgs.length === 0) {
                return {
                  text: 'New Chat',
                  isOutgoing: false,
                  status: null,
                };
              }

              const isOutgoing = lastMsg.senderId === currentUserId || lastMsg.senderId === 'user';

              // Check for welcome message or initial new chat
              if (
                lastMsg.text === WELCOME_MESSAGE_TEXT ||
                lastMsg.text?.includes('Welcome to CalcChat') ||
                lastMsg.text?.includes('👋 **Welcome') ||
                contact.lastMessage === 'New Chat'
              ) {
                return {
                  text: formatGroupSender('New Chat'),
                  isOutgoing,
                  status: getMsgStatus(lastMsg),
                };
              }

              // 1. Check if deleted
              if (lastMsg.deletedForEveryone || lastMsg.deletedForMe || lastMsg.text?.startsWith('🚫') || lastMsg.text?.includes('deleted this message')) {
                const text = isOutgoing ? '🚫 You deleted this message' : '🚫 This message was deleted';
                return {
                  text: formatGroupSender(text),
                  isOutgoing,
                  status: getMsgStatus(lastMsg),
                };
              }

              // 2. Count consecutive media / voice items from same sender
              let mediaCount = 1;
              const lastType = lastMsg.media?.type || (
                (lastMsg.text?.includes('🎤') || lastMsg.text?.toLowerCase().includes('voice message') || lastMsg.text?.toLowerCase().includes('voice note')) ? 'voice' : null
              );

              if (lastType) {
                for (let i = msgs.length - 2; i >= 0; i--) {
                  const prev = msgs[i];
                  const prevType = prev.media?.type || (
                    (prev.text?.includes('🎤') || prev.text?.toLowerCase().includes('voice message') || prev.text?.toLowerCase().includes('voice note')) ? 'voice' : null
                  );
                  if (prevType === lastType && prev.senderId === lastMsg.senderId) {
                    mediaCount++;
                  } else {
                    break;
                  }
                }
              }

              let text = '';

              // 3. Call messages (Only match actual call types or callInfo objects, not arbitrary text containing 'call')
              const isCall = (lastMsg.type === 'voice_call' || lastMsg.type === 'video_call' || !!lastMsg.callInfo) && lastMsg.type !== 'text';
              if (isCall) {
                const isVideo = lastMsg.type === 'video_call' || lastMsg.callInfo?.type === 'video' || lastMsg.text?.toLowerCase().includes('video');
                const isMissed = lastMsg.callInfo?.status === 'missed' || lastMsg.text?.toLowerCase().includes('missed');

                if (isMissed) {
                  text = isVideo ? '📹 Missed Video Call' : '📞 Missed Audio Call';
                } else if (isOutgoing) {
                  text = isVideo ? '📹 Outgoing Video Call' : '📞 Outgoing Audio Call';
                } else {
                  text = isVideo ? '📹 Incoming Video Call' : '📞 Incoming Audio Call';
                }
              }
              // 4. Voice Note / Voice Message
              else if (lastType === 'voice') {
                text = mediaCount > 1 ? `🎤 ${mediaCount} Voice Messages` : '🎤 Voice Message';
              }
              // 5. Media attachments
              else if (lastMsg.media) {
                const mType = lastMsg.media.type;
                if (mType === 'image') {
                  text = mediaCount > 1 ? `🖼️ ${mediaCount} Photos` : '🖼️ Photo';
                } else if (mType === 'video') {
                  text = mediaCount > 1 ? `🎥 ${mediaCount} Videos` : '🎥 Video';
                } else if (mType === 'audio') {
                  text = mediaCount > 1 ? `🎵 ${mediaCount} Audio Files` : '🎵 Audio';
                } else if (mType === 'file') {
                  text = mediaCount > 1 ? `📄 ${mediaCount} Documents` : '📄 Document';
                } else if (mType === 'location') {
                  text = '📍 Location';
                } else if (mType === 'contact') {
                  text = '👤 Contact';
                } else {
                  text = lastMsg.media.name || 'Attachment';
                }
              }
              // 6. GIF
              else if (lastMsg.text === 'GIF' || lastMsg.text?.includes('GIF')) {
                text = 'GIF';
              }
              // 7. Sticker
              else if (lastMsg.text?.includes('Sticker')) {
                text = '😊 Sticker';
              }
              // 8. Text Message
              else {
                text = lastMsg.text || 'Message';
              }

              return {
                text: formatGroupSender(text),
                isOutgoing,
                status: getMsgStatus(lastMsg),
              };
            };

            const getMsgStatus = (msg: Message) => {
              if (msg.isRead || msg.seen) return 'read';
              if (msg.isDelivered || msg.isSent) return 'delivered';
              if (msg.isSent) return 'sent';
              return 'sending';
            };

            const formatGroupSender = (previewText: string) => {
              const isGroup = contact.isGroup || contact.name.toLowerCase().includes('group') || (contact.members && contact.members.length > 0);
              if (isGroup && lastMsg) {
                const sender = (lastMsg.senderId === currentUserId || lastMsg.senderId === 'user')
                  ? 'You'
                  : (lastMsg.replyTo?.senderName || 'Member');
                return `${sender}: ${previewText}`;
              }
              return previewText;
            };

            const previewData = getWhatsAppPreviewData();
            const unreadBadge = contact.unreadCount > 0 ? contact.unreadCount : (contact.name === 'WhatsApp' ? 1 : 0);

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
                className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between relative group ${isDark
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
                    className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full object-cover ${isDark ? 'bg-[#202c33]' : 'bg-gray-200'
                      }`}
                  />
                  {!contact.isGroup && contact.isOnline && (
                    <span className={`absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 rounded-full ${isDark ? 'border-[#0b141a]' : 'border-white'
                      }`}></span>
                  )}
                  {contact.isAiBot && (
                    <span className={`absolute -bottom-1 -left-1 p-0.5 rounded-full border ${isDark ? 'bg-[#ff2e93]/20 text-[#ff2e93] border-[#0b141a]' : 'bg-pink-100 text-pink-700 border-white'
                      }`}>
                      <Sparkles className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Middle: Title & Message Preview */}
                <div className={`min-w-0 flex-1 border-b pb-3 flex flex-col justify-center ${isDark ? 'border-[#1f2c34]/60' : 'border-gray-100'
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className={`font-semibold text-[16px] truncate ${isDark ? 'text-[#e9edef]' : 'text-gray-900'
                        }`}>{getContactDisplayName(contact)}</h3>
                      {checkIsAdmin(contact) && <VerifiedBadge className="w-4 h-4 shrink-0 text-[#00a8ff]" />}
                      {contact.isMuted && <BellOff className="w-3.5 h-3.5 text-gray-400 shrink-0 opacity-80" />}
                      {contact.isPinned && <Pin className={`w-3.5 h-3.5 rotate-45 shrink-0 ${isDark ? 'text-[#8596a0]' : 'text-gray-400'}`} />}
                      {contact.isLocked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                    </div>

                    <span className={`text-xs whitespace-nowrap ml-2 ${unreadBadge > 0 ? 'text-[#ff2e93] font-semibold' : (isDark ? 'text-[#8596a0]' : 'text-gray-400')
                      }`}>
                      {lastMsg ? (
                        (() => {
                          const dateLabel = formatChatDate(lastMsg.createdAt || lastMsg.timestamp);
                          return dateLabel === 'Today'
                            ? formatMessageTime(lastMsg.createdAt || lastMsg.timestamp, lastMsg.timestamp)
                            : dateLabel;
                        })()
                      ) : (
                        (() => {
                          const ls: any = contact.lastSeen;
                          if (ls && typeof ls === 'object' && typeof ls.seconds === 'number') {
                            return formatLastSeen(ls);
                          }
                          return (typeof ls === 'string' ? ls : null) || 'Yesterday';
                        })()
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className={`text-sm truncate flex items-center gap-1.5 ${contact.isTyping ? 'text-pink-500 font-semibold animate-pulse' : (isDark ? 'text-[#8596a0]' : 'text-gray-500')
                      }`}>
                      {contact.isTyping ? (
                        <span className="truncate flex items-center gap-1 text-pink-500 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping inline-block"></span>
                          {getContactDisplayName(contact)} is typing...
                        </span>
                      ) : (
                        <>
                          {previewData.isOutgoing && previewData.status && (
                            <span className="shrink-0">
                              {previewData.status === 'read' ? (
                                <CheckCheck className="w-4 h-4 text-[#ff2e93] inline stroke-[2.5]" />
                              ) : previewData.status === 'delivered' ? (
                                <CheckCheck className="w-4 h-4 text-[#8596a0] inline" />
                              ) : (
                                <Check className="w-4 h-4 text-[#8596a0] inline" />
                              )}
                            </span>
                          )}
                          <span className="truncate">{previewData.text}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {unreadBadge > 0 && (
                        <span className="bg-[#ff2e93] text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0 min-w-[20px] text-center shadow-xs">
                          {unreadBadge > 99 ? '99+' : unreadBadge}
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
                      className={`absolute right-4 top-12 z-50 rounded-2xl shadow-2xl py-2 w-56 text-sm font-sans select-none animate-scale-in border transition-all ${isDark
                          ? 'bg-[#233138] border-[#2a3942] text-[#e9edef]'
                          : 'bg-white border-gray-200 text-gray-800 shadow-xl'
                        }`}
                    >
                      {/* Set Custom Name */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setNicknameTargetContact(contact);
                          setShowNicknameModal(true);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                          }`}
                      >
                        <div className="flex items-center gap-3 text-[#ff2e93] font-semibold">
                          <Tag className="w-4.5 h-4.5" />
                          <span>{customNicknames[contact.id] ? 'Edit Custom Name' : 'Set Custom Name'}</span>
                        </div>
                      </button>

                      {/* 1. Archive / Unarchive chat */}
                      <button
                        type="button"
                        onClick={() => {
                          toggleArchiveContact(contact.id);
                          setOpenMenuId(null);
                          showToast(contact.isArchived ? `Unarchived ${contact.name}` : `Archived ${contact.name}`);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <Archive className="w-4.5 h-4.5 text-[#ff2e93]" />
                          <span>{contact.isArchived ? 'Unarchive chat' : 'Archive chat'}</span>
                        </div>
                      </button>

                      {/* 2. Mute / Unmute notifications */}
                      <button
                        type="button"
                        onClick={() => {
                          toggleMuteContact(contact.id);
                          setOpenMenuId(null);
                          showToast(contact.isMuted ? 'Notifications unmuted' : 'Notifications muted');
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {contact.isMuted ? (
                            <>
                              <Bell className="w-4.5 h-4.5 text-[#ff2e93]" />
                              <span>Unmute notifications</span>
                            </>
                          ) : (
                            <>
                              <BellOff className="w-4.5 h-4.5 opacity-80" />
                              <span>Mute notifications</span>
                            </>
                          )}
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
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <Pin className="w-4.5 h-4.5 opacity-80" />
                          <span>{contact.isPinned ? 'Unpin chat' : 'Pin chat'}</span>
                        </div>
                      </button>

                      {/* 4. Add / Remove from favourites */}
                      <button
                        type="button"
                        onClick={() => {
                          toggleFavoriteContact(contact.id);
                          setOpenMenuId(null);
                          showToast(contact.isFavorite ? `Removed from favourites` : `Added to favourites`);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <Heart className={`w-4.5 h-4.5 ${contact.isFavorite ? 'fill-red-500 text-red-500' : 'opacity-80'}`} />
                          <span>{contact.isFavorite ? 'Remove from favourites' : 'Add to favourites'}</span>
                        </div>
                      </button>

                      {/* 5. Block / Unblock Contact */}
                      {contact.id !== user.id && !contact.isGroup && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            const isBlocked = blockedContactIds.includes(contact.id);
                            if (isBlocked) {
                              unblockContact(contact.id);
                              showToast(`Unblocked ${getContactDisplayName(contact)}`);
                            } else {
                              blockContact(contact.id);
                              showToast(`Blocked ${getContactDisplayName(contact)}`);
                            }
                          }}
                          className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                            }`}
                        >
                          <div className="flex items-center gap-3 text-amber-500">
                            <Ban className="w-4.5 h-4.5" />
                            <span>{blockedContactIds.includes(contact.id) ? 'Unblock contact' : 'Block contact'}</span>
                          </div>
                        </button>
                      )}

                      {/* 6. Unfriend Contact */}
                      {contact.id !== user.id && !contact.isGroup && friendUids.includes(contact.id) && (
                        <button
                          type="button"
                          onClick={async () => {
                            setOpenMenuId(null);
                            const targetName = getContactDisplayName(contact);
                            await unfriendContact(contact.id);
                            showToast(`Unfriended ${targetName}`);
                          }}
                          className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors text-rose-500 ${isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <UserMinus className="w-4.5 h-4.5" />
                            <span>Unfriend contact</span>
                          </div>
                        </button>
                      )}

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
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
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
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors text-rose-500 ${isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
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

      {/* Floating Action Button (Pink AI Assistant) - Positioned directly ABOVE Create Group button */}
      <button
        type="button"
        onClick={() => {
          setShowAIChat(true);
        }}
        className="absolute bottom-20 right-4 z-30 w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#ff2e93] via-[#ff62b0] to-[#f43f5e] hover:brightness-110 active:scale-90 text-white shadow-2xl shadow-pink-500/40 flex items-center justify-center transition-all cursor-pointer border-2 border-white/40 group overflow-hidden"
        title="CalcChat AI Assistant"
      >
        <div className="w-full h-full p-1 flex items-center justify-center relative">
          <img src={PINK_AI_AVATAR_SVG} alt="AI Bot" className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white text-white shadow-md">
            AI
          </span>
        </div>
      </button>

      {/* Floating Action Button (New Group) - Shown on Chat section above bottom bar */}
      <button
        type="button"
        onClick={() => setShowCreateGroupModal(true)}
        className="absolute bottom-4 right-4 z-30 w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#ff2e93] hover:bg-[#ff1e85] active:scale-90 text-white shadow-2xl shadow-pink-500/30 flex items-center justify-center transition-all cursor-pointer border border-[#ff2e93]/50 group"
        title="Create New Group"
      >
        <Users className="w-6 h-6 stroke-[2.3] group-hover:scale-110 transition-transform" />
      </button>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <form onSubmit={handleGroupSubmit} className="bg-[#233138] border border-[#2a3942] w-full max-w-sm rounded-3xl p-6 shadow-2xl text-sm flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 border-b border-[#2a3942] pb-3">
              <h2 className="text-lg font-bold text-[#ff2e93] flex items-center gap-2">
                <Users className="w-5 h-5" /> Create New Group
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-4 overflow-y-auto pr-1">
              <div>
                <label className="text-[#8596a0] text-xs font-semibold block mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Project Alpha, Family Vault, Friends"
                  value={groupNameInput}
                  onChange={e => setGroupNameInput(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] focus:border-[#ff2e93] rounded-xl px-3.5 py-2.5 text-white focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-[#8596a0] text-xs font-semibold block mb-2">Select Members from Contacts</label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 border border-[#2a3942] bg-[#0b141a] rounded-xl p-2">
                  {selectableMembers.length === 0 ? (
                    <p className="text-xs text-gray-500 py-2 text-center">No available members</p>
                  ) : (
                    selectableMembers.map(m => {
                      const isSelected = selectedMemberIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => toggleSelectMember(m.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-[#ff2e93]/20 text-white' : 'hover:bg-[#182229] text-gray-300'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-xs font-medium truncate">{m.name}</span>
                              {checkIsAdmin(m) && <VerifiedBadge className="w-3.5 h-3.5 shrink-0 text-[#00a8ff]" />}
                            </div>
                          </div>
                          {isSelected ? (
                            <UserCheck className="w-4 h-4 text-[#ff2e93] shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="text-[#8596a0] text-xs font-semibold block mb-1">Add Member Usernames / Names</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul, Priya, Alex (comma separated)"
                  value={customMemberInput}
                  onChange={e => setCustomMemberInput(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] focus:border-[#ff2e93] rounded-xl px-3.5 py-2.5 text-white focus:outline-none text-xs"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">Separate multiple usernames with commas</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#2a3942]">
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0b141a] hover:bg-[#182229] text-[#8596a0] transition-colors text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!groupNameInput.trim()}
                className="px-5 py-2 rounded-xl bg-[#ff2e93] hover:bg-[#ff1e85] text-white font-bold transition-colors shadow-lg shadow-pink-500/25 disabled:opacity-50 text-xs flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                Create Group
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleCreateContact} className="bg-[#233138] border border-[#2a3942] w-full max-w-sm rounded-3xl p-6 shadow-2xl text-sm">
            <h2 className="text-lg font-bold text-[#ff2e93] mb-4 flex items-center gap-2">
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
                  className="w-full bg-[#0b141a] border border-[#2a3942] focus:border-[#ff2e93] rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#8596a0] text-xs block mb-1">Last message / About status</label>
                <input
                  type="text"
                  placeholder="e.g. Hey there! I am using WhatsApp."
                  value={newContactStatus}
                  onChange={e => setNewContactStatus(e.target.value)}
                  className="w-full bg-[#0b141a] border border-[#2a3942] focus:border-[#ff2e93] rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-[#e9edef] text-sm flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAiContact}
                    onChange={e => setIsAiContact(e.target.checked)}
                    className="accent-[#ff2e93] w-4 h-4 rounded"
                  />
                  <span>Simulate Meta AI Responder</span>
                </label>
                <Bot className={`w-5 h-5 ${isAiContact ? 'text-[#ff2e93]' : 'text-[#8596a0]'}`} />
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
                className="px-5 py-2.5 rounded-xl bg-[#ff2e93] hover:bg-[#ff1e85] text-white font-bold transition-colors shadow-lg shadow-pink-500/25"
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
          <form onSubmit={verifyChatPin} className="bg-[#233138] border border-[#ff2e93]/40 w-full max-w-xs rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#ff2e93]/20 text-[#ff2e93] flex items-center justify-center mx-auto mb-4">
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
              className="w-full bg-[#0b141a] border border-[#2a3942] focus:border-[#ff2e93] text-center font-mono text-2xl tracking-widest text-white rounded-xl py-3 mb-5 focus:outline-none"
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
                className="flex-1 bg-[#ff2e93] hover:bg-[#ff1e85] text-white py-2.5 rounded-xl transition-colors shadow-md shadow-pink-500/20"
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
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-semibold text-[15px] truncate pr-1 shadow-sm">{previewContact.name}</span>
                {checkIsAdmin(previewContact) && <VerifiedBadge className="w-4 h-4 shrink-0 text-[#00a8ff]" />}
              </div>
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
            <div className="flex items-center justify-around py-2.5 bg-[#1f2c34] text-[#ff2e93] border-t border-[#2a3942]/60">
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
                  const targetId = previewContact.id;
                  setPreviewContact(null);
                  navigate(`/profile/${targetId}`);
                }}
                className="p-2 hover:bg-[#202c33] rounded-full transition-colors active:scale-95 flex items-center justify-center"
                title="View Profile"
              >
                <User className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen WhatsApp Contact Avatar Modal */}
      <WhatsAppProfileViewer
        isOpen={!!fullImageContact}
        onClose={() => setFullImageContact(null)}
        name={fullImageContact?.name || 'Profile Photo'}
        avatarUrl={fullImageContact?.avatar || ''}
        subText={fullImageContact?.username ? `@${fullImageContact.username}` : fullImageContact?.status || 'Available'}
        onSendMessage={fullImageContact ? () => handleContactClick(fullImageContact.id, fullImageContact.isLocked) : undefined}
        onVoiceCall={fullImageContact ? () => alert(`Calling ${fullImageContact.name}... 📞`) : undefined}
        onVideoCall={fullImageContact ? () => alert(`Starting video call with ${fullImageContact.name}... 📹`) : undefined}
      />

      {/* Custom Contact Nickname Modal */}
      <NicknameModal
        contact={nicknameTargetContact}
        isOpen={showNicknameModal}
        onClose={() => {
          setShowNicknameModal(false);
          setNicknameTargetContact(null);
        }}
      />

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#233138] border border-[#ff2e93]/40 text-[#ff2e93] px-5 py-2.5 rounded-full text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2 pointer-events-none">
          <CheckCheck className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
};

