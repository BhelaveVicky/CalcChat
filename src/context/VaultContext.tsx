import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, signInWithPopup, signOut, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, updateProfile as updateAuthProfile,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, collectionGroup, doc, getDoc, setDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, orderBy, serverTimestamp, 
  addDoc, getDocs, writeBatch, arrayUnion, arrayRemove, runTransaction, deleteField, increment
} from 'firebase/firestore';
import { 
  CallInfo, CallLog, CallType, CallDirection, CallStatus, Contact, MediaAttachment, Message, 
  UserProfile, VaultSettings, FriendRequest, FriendStatus, StatusUpdate,
  StatusSeenRecord, StatusLikeRecord, StatusReactionRecord, StatusReplyData, StatusReactionData,
  AdminWallpaper, GroupPermissions, GroupJoinRequest, GroupActivityLog, DeletedMessageLog, DEFAULT_GROUP_PERMISSIONS
} from '../types';
import { DEFAULT_SETTINGS, DEFAULT_USER } from '../data/initialData';
import { isFirebaseConfigured, firebaseAuth, googleProvider, db } from '../lib/firebase';
import { compressImage } from '../lib/mediaCompressor';
import { saveMediaBlob, getMediaBlob } from '../lib/mediaStorage';
import { extractVideoMetadata } from '../lib/videoUtils';
import { playMessageArrivalSound } from '../lib/soundUtils';
import { formatStatusTime, parseMessageDate, formatLastSeen } from '../lib/dateUtils';
import { getGroupMembersList } from '../lib/groupUtils';

export interface GroupCallParticipant {
  uid: string;
  name: string;
  avatar: string;
  joinedAt?: number;
  isMuted?: boolean;
}

export interface ActiveCallState {
  id: string;
  contactId: string;
  type: CallType;
  direction: CallDirection;
  status: 'ringing' | 'incoming' | 'connecting' | 'connected' | 'ended' | 'rejected' | 'busy' | 'cancelled';
  durationSeconds: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isRemoteVideoOff?: boolean;
  isSpeakerOn: boolean;
  isFrontCamera: boolean;
  signalBars: number;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  connectionQuality?: 'excellent' | 'good' | 'poor' | 'reconnecting';
  isGroupCall?: boolean;
  participants?: GroupCallParticipant[];
}

interface VaultContextType {
  isUnlocked: boolean;
  user: UserProfile;
  settings: VaultSettings;
  contacts: Contact[];
  groupContacts: Contact[];
  friendUids: string[];
  unreadTotal: number;
  unseenStatusCount: number;
  missedCallCount: number;
  clearMissedCallsBadge: () => void;
  messages: Record<string, Message[]>;
  callLogs: CallLog[];
  activeCall: ActiveCallState | null;
  callPermissionError: string | null;
  clearCallPermissionError: () => void;
  activeContactId: string | null;
  activeTab: 'chats' | 'gallery' | 'profile' | 'settings' | 'calls';
  unlockedLocks: Record<string, boolean>;
  blockedContactIds: string[];
  blockedByContactIds: string[];
  customNicknames: Record<string, string>;
  authUser: FirebaseUser | null;
  authReady: boolean;
  authError: string | null;
  isFirebaseConfigured: boolean;
  needsUsername: boolean;
  pendingFriendRequests: FriendRequest[];
  sentFriendRequests: FriendRequest[];
  allRegisteredUsers: any[];
  statusUpdates: StatusUpdate[];
  completeUsernameSetup: (username: string, displayName: string) => Promise<void>;
  sendFriendRequest: (targetUserId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string, senderId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  unfriendContact: (contactId: string) => Promise<void>;
  isFriend: (contactId: string) => boolean;
  searchFirebaseUsers: (term: string) => Promise<Array<{
    id: string;
    name: string;
    username: string;
    avatar: string;
    status: string;
    isOnline: boolean;
    friendStatus: FriendStatus;
    requestId?: string;
  }>>;
  postStatusUpdate: (
    text?: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    caption?: string,
    bgColor?: string,
    privacyMode?: 'contacts' | 'only',
    allowedUserIds?: string[]
  ) => Promise<void>;
  deleteStatusUpdate: (statusId: string) => Promise<void>;
  likeStatusUpdate: (statusId: string) => Promise<void>;
  markStatusAsSeen: (statusId: string) => Promise<void>;
  replyToStatus: (status: StatusUpdate, replyText: string) => Promise<void>;
  reactToStatus: (status: StatusUpdate, emoji: string) => Promise<void>;
  getSeenRecords: (statusId: string) => StatusSeenRecord[];
  getLikeRecords: (statusId: string) => StatusLikeRecord[];
  statusSeenRecordsMap?: Record<string, StatusSeenRecord[]>;
  statusLikeRecordsMap?: Record<string, StatusLikeRecord[]>;
  unlockVault: (code: string) => boolean;
  lockVault: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOutGoogle: () => Promise<void>;
  setActiveContactId: (id: string | null) => void;
  setActiveTab: (tab: 'chats' | 'gallery' | 'profile' | 'settings' | 'calls') => void;
  sendMessage: (receiverId: string, text: string, media?: MediaAttachment, replyTo?: Message['replyTo'], statusReply?: StatusReplyData, statusReaction?: StatusReactionData, isForwarded?: boolean) => Promise<void>;
  editMessage: (contactId: string, msgId: string, newText: string) => Promise<void>;
  deleteMessage: (contactId: string, msgId: string) => Promise<void>;
  deleteForEveryone: (contactId: string, msgId: string) => Promise<void>;
  markViewOnceOpened: (contactId: string, msgId: string) => Promise<void>;
  toggleStarMessage: (contactId: string, msgId: string) => void;
  togglePinMessage: (contactId: string, msgId: string) => void;
  forwardMessage: (msg: Message, targetContactIds: string[]) => void;
  addReactionMessage: (contactId: string, msgId: string, emoji: string) => Promise<void>;
  removeReactionMessage: (contactId: string, msgId: string) => Promise<void>;
  deleteMultipleMessages: (contactId: string, msgIds: string[], deleteForEveryoneFlag?: boolean) => Promise<void>;
  typingStatusMap?: Record<string, boolean>;
  setTypingStatus: (contactId: string, isTyping: boolean) => Promise<void>;
  markMessagesAsRead: (contactId: string) => Promise<void>;
  setCustomNickname: (contactId: string, nickname: string) => Promise<void>;
  clearCustomNickname: (contactId: string) => Promise<void>;
  getContactDisplayName: (contactOrId: Contact | string | null | undefined) => string;
  isUserOnline: (userId: string | null | undefined) => boolean;
  startCall: (contactId: string, type: CallType) => Promise<void>;
  acceptCall: () => void;
  rejectCall: () => void;
  cancelCall: () => void;
  endCall: () => void;
  toggleMuteCall: () => void;
  toggleVideoCall: () => void;
  toggleSpeakerCall: () => void;
  switchCameraCall: () => void;
  deleteCallLog: (callId: string) => Promise<void>;
  deleteMultipleCallLogs: (callIds: string[]) => Promise<void>;
  clearCallLogs: () => Promise<void>;
  updateSettings: (newSettings: Partial<VaultSettings>) => void;
  updateProfile: (newProfile: Partial<UserProfile>) => Promise<void>;
  addContact: (name: string, status: string, isAi: boolean) => void;
  createGroup: (groupName: string, memberNames: string[]) => string;
  addMembersToGroup: (groupId: string, memberNamesOrUids: string[]) => Promise<void>;
  removeMemberFromGroup: (groupId: string, memberIdOrName: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  toggleGroupAdmin: (groupId: string, memberIdOrName: string) => Promise<void>;
  sendGroupSystemMessage: (groupId: string, systemAction: any, systemText: string) => Promise<void>;
  joinGroupCall: (groupId: string, type?: CallType) => Promise<void>;
  updateGroupDetails: (groupId: string, updates: { name?: string; avatar?: string; wallpaper?: string; description?: string }) => Promise<void>;
  updateGroupPermissions: (groupId: string, permissions: Partial<GroupPermissions>) => Promise<void>;
  transferGroupOwnership: (groupId: string, newOwnerId: string) => Promise<void>;
  toggleGroupMuteMember: (groupId: string, memberIdOrName: string) => Promise<void>;
  toggleGroupBanMember: (groupId: string, memberIdOrName: string) => Promise<void>;
  approveJoinRequest: (groupId: string, userId: string) => Promise<void>;
  rejectJoinRequest: (groupId: string, userId: string) => Promise<void>;
  requestToJoinGroup: (groupId: string) => Promise<void>;
  regenerateGroupInviteLink: (groupId: string) => Promise<string>;
  toggleGroupInviteLinkDisabled: (groupId: string) => Promise<void>;
  updateGroupDescription: (groupId: string, description: string) => Promise<void>;
  updateGroupPrivacy: (groupId: string, isPublic: boolean, joinApprovalRequired: boolean) => Promise<void>;
  deleteGroupMessageForEveryone: (groupId: string, msgId: string) => Promise<void>;
  clearGroupChatHistoryForEveryone: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  clearChatHistory: (contactId: string) => void;
  clearAllChatHistory: () => void;
  togglePinContact: (contactId: string) => void;
  toggleLockContact: (contactId: string) => void;
  toggleArchiveContact: (contactId: string) => void;
  toggleFavoriteContact: (contactId: string) => void;
  toggleMuteContact: (contactId: string) => void;
  unlockChatLock: (contactId: string) => void;
  blockContact: (contactId: string) => void;
  unblockContact: (contactId: string) => void;
  adminWallpapers: AdminWallpaper[];
  addAdminWallpaper: (name: string, url: string, color?: string) => Promise<void>;
  deleteAdminWallpaper: (wallpaperId: string) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const fallbackVaultContext: VaultContextType = {
  isUnlocked: false,
  user: DEFAULT_USER,
  settings: DEFAULT_SETTINGS,
  contacts: [],
  groupContacts: [],
  friendUids: [],
  unreadTotal: 0,
  unseenStatusCount: 0,
  missedCallCount: 0,
  clearMissedCallsBadge: () => {},
  messages: {},
  callLogs: [],
  activeCall: null,
  callPermissionError: null,
  clearCallPermissionError: () => {},
  activeContactId: null,
  activeTab: 'chats',
  unlockedLocks: {},
  blockedContactIds: [],
  blockedByContactIds: [],
  customNicknames: {},
  authUser: null,
  authReady: false,
  authError: null,
  isFirebaseConfigured: false,
  needsUsername: false,
  pendingFriendRequests: [],
  sentFriendRequests: [],
  allRegisteredUsers: [],
  statusUpdates: [],
  completeUsernameSetup: async () => {},
  sendFriendRequest: async () => {},
  acceptFriendRequest: async () => {},
  rejectFriendRequest: async () => {},
  unfriendContact: async () => {},
  isFriend: () => false,
  searchFirebaseUsers: async () => [],
  postStatusUpdate: async () => {},
  deleteStatusUpdate: async () => {},
  likeStatusUpdate: async () => {},
  markStatusAsSeen: async () => {},
  replyToStatus: async () => {},
  reactToStatus: async () => {},
  getSeenRecords: () => [],
  getLikeRecords: () => [],
  statusSeenRecordsMap: {},
  statusLikeRecordsMap: {},
  unlockVault: () => false,
  lockVault: () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInAsGuest: async () => {},
  signOutGoogle: async () => {},
  setActiveContactId: () => {},
  setActiveTab: () => {},
  sendMessage: async () => {},
  editMessage: async () => {},
  deleteMessage: async () => {},
  deleteForEveryone: async () => {},
  markViewOnceOpened: async () => {},
  toggleStarMessage: () => {},
  togglePinMessage: () => {},
  forwardMessage: () => {},
  typingStatusMap: {},
  setTypingStatus: async () => {},
  markMessagesAsRead: async () => {},
  setCustomNickname: async () => {},
  clearCustomNickname: async () => {},
  getContactDisplayName: () => 'User',
  isUserOnline: () => false,
  startCall: async () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  cancelCall: () => {},
  endCall: () => {},
  toggleMuteCall: () => {},
  toggleVideoCall: () => {},
  toggleSpeakerCall: () => {},
  switchCameraCall: () => {},
  deleteCallLog: async () => {},
  deleteMultipleCallLogs: async () => {},
  clearCallLogs: async () => {},
  updateSettings: () => {},
  updateProfile: async () => {},
  addContact: () => {},
  createGroup: () => '',
  addMembersToGroup: async () => {},
  removeMemberFromGroup: async () => {},
  leaveGroup: async () => {},
  toggleGroupAdmin: async () => {},
  sendGroupSystemMessage: async () => {},
  joinGroupCall: async () => {},
  updateGroupDetails: async () => {},
  updateGroupPermissions: async () => {},
  transferGroupOwnership: async () => {},
  toggleGroupMuteMember: async () => {},
  toggleGroupBanMember: async () => {},
  approveJoinRequest: async () => {},
  rejectJoinRequest: async () => {},
  requestToJoinGroup: async () => {},
  regenerateGroupInviteLink: async () => '',
  toggleGroupInviteLinkDisabled: async () => {},
  updateGroupDescription: async () => {},
  updateGroupPrivacy: async () => {},
  deleteGroupMessageForEveryone: async () => {},
  clearGroupChatHistoryForEveryone: async () => {},
  deleteGroup: async () => {},
  clearChatHistory: () => {},
  clearAllChatHistory: () => {},
  togglePinContact: () => {},
  toggleLockContact: () => {},
  toggleArchiveContact: () => {},
  toggleFavoriteContact: () => {},
  toggleMuteContact: () => {},
  unlockChatLock: () => {},
  blockContact: () => {},
  unblockContact: () => {},
  addReactionMessage: async () => {},
  removeReactionMessage: async () => {},
  deleteMultipleMessages: async () => {},
  adminWallpapers: [],
  addAdminWallpaper: async () => {},
  deleteAdminWallpaper: async () => {},
};

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

const isPermissionDeniedError = (error: unknown): boolean => {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code || '') : '';
  const message = error instanceof Error ? error.message : String(error || '');
  return /permission-denied|missing or insufficient permissions|code-permission-denied/i.test(`${code} ${message}`);
};

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'gallery' | 'profile' | 'settings' | 'calls'>('chats');
  const [unlockedLocks, setUnlockedLocks] = useState<Record<string, boolean>>({});
  
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsUsername, setNeedsUsername] = useState<boolean>(false);

  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [settings, setSettings] = useState<VaultSettings>(() => {
    try {
      const saved = localStorage.getItem('secret_vault_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed, passcode: parsed.passcode || '1234' };
      }
    } catch (e) {
      console.error('Error loading settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [friendContacts, setFriendContacts] = useState<Contact[]>([]);
  const [groupContacts, setGroupContacts] = useState<Contact[]>([]);
  const [friendUids, setFriendUids] = useState<string[]>([]);
  const [favoriteContactIds, setFavoriteContactIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('calcchat_favorite_contacts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [mutedContactIds, setMutedContactIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('calcchat_muted_contacts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [typingStatusMap, setTypingStatusMap] = useState<Record<string, boolean>>({});
  const [presenceMap, setPresenceMap] = useState<Record<string, { isOnline: boolean; lastSeen: any; isTyping: boolean; typingTo: string | null }>>({});
  const [presenceTick, setPresenceTick] = useState(0);
  const [chatMetadata, setChatMetadata] = useState<Record<string, { lastMessage?: string; lastMessageTime?: any; lastMessageSenderId?: string }>>({});
  const [adminWallpapers, setAdminWallpapers] = useState<AdminWallpaper[]>([]);

  // Ticker to instantly refresh staleness checks every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPresenceTick(t => t + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Real-time listener for Firestore Presence Collection
  useEffect(() => {
    if (!authUser || needsUsername || !db) {
      setPresenceMap({});
      return;
    }

    try {
      const presenceQuery = collection(db, 'presence');
      const unsub = onSnapshot(presenceQuery, (snapshot) => {
        const pMap: Record<string, any> = {};
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          pMap[docSnap.id] = {
            isOnline: Boolean(data.isOnline ?? data.online),
            lastSeen: data.lastSeen || data.lastActiveAt || null,
            isTyping: Boolean(data.isTyping),
            typingTo: data.typingTo || null,
          };
        });
        setPresenceMap(pMap);
      }, (err) => handleFirestoreError('Presence snapshot error:', err, () => {}));

      return () => unsub();
    } catch (e) {
      console.warn('Presence listener error:', e);
    }
  }, [authUser, needsUsername, db]);

  // Real-time Presence Lifecycle Manager for Current User (Online/Offline/Last Seen/Heartbeat)
  useEffect(() => {
    if (!authUser || needsUsername || !db) return;

    const setPresenceStateSync = (online: boolean, typing: boolean = false, targetUid: string | null = null) => {
      try {
        const userRef = doc(db, 'users', authUser.uid);
        const presenceRef = doc(db, 'presence', authUser.uid);

        const payload = {
          uid: authUser.uid,
          isOnline: online,
          online: online,
          lastSeen: serverTimestamp(),
          lastActiveAt: serverTimestamp(),
          isTyping: typing,
          typingTo: targetUid,
          updatedAt: serverTimestamp(),
        };

        setDoc(presenceRef, payload, { merge: true }).catch(() => {});
        updateDoc(userRef, {
          online: online,
          isOnline: online,
          lastSeen: serverTimestamp(),
          lastActiveAt: serverTimestamp(),
          isTyping: typing,
          typingTo: targetUid,
        }).catch(() => {});
      } catch (err) {
        // ignore write issues
      }
    };

    // Mark online on initial activation
    setPresenceStateSync(true, false, null);

    // Fast heartbeat every 8 seconds to maintain active presence state
    const heartbeat = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && navigator.onLine) {
        setPresenceStateSync(true, false, null);
      }
    }, 8000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setPresenceStateSync(false, false, null);
      } else if (document.visibilityState === 'visible') {
        setPresenceStateSync(true, false, null);
      }
    };

    const handleOnline = () => setPresenceStateSync(true, false, null);
    const handleOffline = () => setPresenceStateSync(false, false, null);
    const handleBeforeUnload = () => setPresenceStateSync(false, false, null);
    const handlePageHide = () => setPresenceStateSync(false, false, null);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('freeze', handlePageHide);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('freeze', handlePageHide);
      setPresenceStateSync(false, false, null);
    };
  }, [authUser, needsUsername, db]);

  // Real-time listener for Admin Wallpapers with LocalStorage fallback
  useEffect(() => {
    let localWps: AdminWallpaper[] = [];
    try {
      const saved = localStorage.getItem('calcchat_admin_wallpapers');
      if (saved) {
        localWps = JSON.parse(saved);
        setAdminWallpapers(localWps);
      }
    } catch (e) {
      console.warn('Error loading local admin wallpapers:', e);
    }

    if (!db) return;
    try {
      const wpQuery = collection(db, 'admin_wallpapers');
      const unsub = onSnapshot(wpQuery, (snapshot) => {
        const firestoreList: AdminWallpaper[] = [];
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.url) {
            firestoreList.push({
              id: docSnap.id,
              name: data.name || 'Admin Wallpaper',
              url: data.url || '',
              color: data.color || '#1e293b',
              createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
              addedBy: data.addedBy || '',
            });
          }
        });

        // Merge firestore items with local items so all users get Firestore updates
        const map = new Map<string, AdminWallpaper>();
        firestoreList.forEach(w => map.set(w.url || w.id, w));
        localWps.forEach(w => {
          if (!map.has(w.url || w.id)) {
            map.set(w.url || w.id, w);
          }
        });

        const merged = Array.from(map.values());
        setAdminWallpapers(merged);
        try {
          localStorage.setItem('calcchat_admin_wallpapers', JSON.stringify(merged));
        } catch (e) {}
      }, (err) => {
        console.warn('Admin wallpapers snapshot error:', err);
      });

      return () => unsub();
    } catch (e) {
      console.warn('Admin wallpapers listener error:', e);
    }
  }, [db]);

  const addAdminWallpaper = async (name: string, url: string, color?: string) => {
    let finalUrl = url.trim();
    if (!finalUrl) throw new Error('Wallpaper URL is empty');

    // Compress base64 data URLs aggressively if needed to ensure lightweight storage
    if (finalUrl.startsWith('data:image/')) {
      try {
        finalUrl = await compressImage(finalUrl, 600, 100000);
      } catch (e) {
        console.warn('Wallpaper compression warning:', e);
      }
    }

    const tempId = 'admin_wp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newWp: AdminWallpaper = {
      id: tempId,
      name: name.trim() || 'Admin Wallpaper',
      url: finalUrl,
      color: color || '#1e293b',
      createdAt: Date.now(),
      addedBy: authUser?.email || user.email || 'Admin',
    };

    // Optimistically update local state & localStorage immediately
    setAdminWallpapers(prev => {
      const updated = [newWp, ...prev.filter(p => p.url !== newWp.url && p.id !== newWp.id)];
      try {
        localStorage.setItem('calcchat_admin_wallpapers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (db) {
      try {
        const docRef = await addDoc(collection(db, 'admin_wallpapers'), {
          name: newWp.name,
          url: newWp.url,
          color: newWp.color,
          createdAt: serverTimestamp(),
          addedBy: newWp.addedBy,
        });
        newWp.id = docRef.id;
      } catch (err) {
        console.warn('Firestore addDoc warning for admin wallpaper:', err);
      }
    }
  };

  const deleteAdminWallpaper = async (wallpaperId: string) => {
    setAdminWallpapers(prev => {
      const updated = prev.filter(w => w.id !== wallpaperId);
      try {
        localStorage.setItem('calcchat_admin_wallpapers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (db && wallpaperId && !wallpaperId.startsWith('admin_wp_')) {
      try {
        await deleteDoc(doc(db, 'admin_wallpapers', wallpaperId));
      } catch (err) {
        console.warn('Error deleting admin wallpaper from Firestore:', err);
      }
    }
  };

  // Sync friendContacts and groupContacts into contacts with metadata & real-time sorting keys
  useEffect(() => {
    const map = new Map<string, Contact>();

    const enrichContact = (c: Contact): Contact => {
      const msgs = messages[c.id] || [];
      const lastMsg = msgs[msgs.length - 1];

      let msgTime = 0;
      let lastMsgText = c.status || '';
      let lastMsgSenderId = '';

      if (lastMsg) {
        if (lastMsg.createdAt?.toMillis) {
          msgTime = lastMsg.createdAt.toMillis();
        } else if (lastMsg.createdAt?.seconds) {
          msgTime = lastMsg.createdAt.seconds * 1000;
        } else if (typeof lastMsg.createdAt === 'number') {
          msgTime = lastMsg.createdAt;
        } else if (typeof lastMsg.timestamp === 'number') {
          msgTime = lastMsg.timestamp;
        } else {
          msgTime = Date.now();
        }
        lastMsgText = lastMsg.text || (lastMsg.media ? `[${lastMsg.media.type}]` : '');
        lastMsgSenderId = lastMsg.senderId || '';
      }

      const isGroup = c.isGroup || groupContacts.some(g => g.id === c.id) || c.id.startsWith('group_');
      const chatId = isGroup ? c.id : [authUser?.uid || '', c.id].sort().join('_');
      const meta = chatMetadata[chatId];

      let metaTime = 0;
      if (meta && meta.lastMessageTime) {
        if (meta.lastMessageTime?.toMillis) {
          metaTime = meta.lastMessageTime.toMillis();
        } else if (meta.lastMessageTime?.seconds) {
          metaTime = meta.lastMessageTime.seconds * 1000;
        } else if (typeof meta.lastMessageTime === 'number') {
          metaTime = meta.lastMessageTime;
        }
      }

      const finalLastActivityTime = Math.max(msgTime, metaTime);
      const finalLastMessage = meta?.lastMessage || lastMsgText;
      const finalLastSenderId = meta?.lastMessageSenderId || lastMsgSenderId;

      const unreadCount = msgs.filter(
        m => m.senderId === c.id && authUser && m.receiverId === authUser.uid && (!m.seen && !m.isRead)
      ).length;

      const p = presenceMap[c.id];
      let isOnline = false;
      let lastSeen = p?.lastSeen || c.lastSeen;

      if (!c.isGroup) {
        if (authUser && (c.id === authUser.uid || c.isSelf)) {
          isOnline = true;
        } else if (p && p.isOnline) {
          const lastActiveDate = parseMessageDate(p.lastSeen);
          if (lastActiveDate) {
            const diff = Date.now() - lastActiveDate.getTime();
            isOnline = diff >= 0 && diff < 20000;
          }
        }
      }

      // Typing is visible ONLY if contact is typing to ME and is online
      const isTyping = isOnline && p 
        ? (Boolean(p.isTyping) && p.typingTo === authUser?.uid)
        : Boolean(typingStatusMap[c.id]);

      return {
        ...c,
        isOnline,
        lastSeen,
        isFavorite: favoriteContactIds.includes(c.id),
        isMuted: mutedContactIds.includes(c.id),
        unreadCount,
        isTyping,
        lastMessage: finalLastMessage,
        lastMessageTime: meta?.lastMessageTime || (lastMsg?.createdAt || null),
        lastMessageSenderId: finalLastSenderId,
        lastActivityTime: finalLastActivityTime,
      };
    };

    friendContacts.forEach(c => map.set(c.id, enrichContact(c)));
    groupContacts.forEach(g => map.set(g.id, enrichContact(g)));

    setContacts(prev => {
      const prevMap = new Map(prev.map(c => [c.id, c]));
      return Array.from(map.values()).map(c => {
        const existing = prevMap.get(c.id);
        return {
          ...c,
          isPinned: existing?.isPinned ?? c.isPinned,
          isLocked: existing?.isLocked ?? c.isLocked,
          isArchived: existing?.isArchived ?? c.isArchived,
          isMuted: mutedContactIds.includes(c.id) || existing?.isMuted,
        };
      });
    });
  }, [friendContacts, groupContacts, favoriteContactIds, mutedContactIds, messages, chatMetadata, typingStatusMap, presenceMap, presenceTick, authUser]);

  const getChatIdForContact = (contactId: string): string => {
    if (!contactId) return '';
    const isGroup = contacts.some(c => c.id === contactId && c.isGroup) || groupContacts.some(g => g.id === contactId) || contactId.startsWith('group_');
    if (isGroup) return contactId;
    return [authUser?.uid || '', contactId].sort().join('_');
  };
  const [pendingFriendRequests, setPendingFriendRequests] = useState<FriendRequest[]>([]);
  const [sentFriendRequests, setSentFriendRequests] = useState<FriendRequest[]>([]);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [callPermissionError, setCallPermissionError] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [statusSeenRecordsMap, setStatusSeenRecordsMap] = useState<Record<string, StatusSeenRecord[]>>({});
  const [statusLikeRecordsMap, setStatusLikeRecordsMap] = useState<Record<string, StatusLikeRecord[]>>({});
  const [blockedContactIds, setBlockedContactIds] = useState<string[]>([]);
  const [blockedByContactIds, setBlockedByContactIds] = useState<string[]>([]);
  const [customNicknames, setCustomNicknames] = useState<Record<string, string>>({});

  const unreadTotal = contacts.reduce((total, contact) => total + (contact.unreadCount || 0), 0);

  // Status updates unseen count (from other users)
  const unseenStatusCount = statusUpdates.filter(s => {
    if (!authUser) return false;
    if (s.userId === authUser.uid) return false;
    const seen = s.seenUserIds || [];
    return !seen.includes(authUser.uid);
  }).length;

  // Missed calls badge tracking
  const [lastSeenCallsTabAt, setLastSeenCallsTabAt] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('calcchat_last_seen_calls_at') || '0', 10);
    } catch {
      return 0;
    }
  });

  const clearMissedCallsBadge = () => {
    const now = Date.now();
    setLastSeenCallsTabAt(now);
    try {
      localStorage.setItem('calcchat_last_seen_calls_at', now.toString());
    } catch (e) {
      console.warn('Failed to save lastSeenCallsTabAt', e);
    }
  };

  const missedCallCount = callLogs.filter(log => {
    const isIncoming = log.direction === 'incoming' || (log.receiverId === user?.id || (log.callerId && log.callerId !== user?.id));
    const isMissed = log.status === 'missed' || log.status === 'rejected' || log.status === 'busy' || log.status === 'cancelled' || log.status === 'failed';
    if (!isIncoming || !isMissed) return false;

    let callTime = 0;
    if (log.createdAt?.toMillis) {
      callTime = log.createdAt.toMillis();
    } else if (log.createdAt?.seconds) {
      callTime = log.createdAt.seconds * 1000;
    } else if (log.timestamp) {
      callTime = new Date(log.timestamp).getTime() || 0;
    }

    return callTime > lastSeenCallsTabAt;
  }).length;

  useEffect(() => {
    if (activeTab === 'calls') {
      clearMissedCallsBadge();
    }
  }, [activeTab]);

  const clearCallPermissionError = () => setCallPermissionError(null);

  const handleFirestoreError = (scope: string, error: unknown, onPermissionDenied?: () => void) => {
    if (isPermissionDeniedError(error)) {
      onPermissionDenied?.();
      return;
    }
    console.error(scope, error);
  };

  const activeCallRef = useRef<ActiveCallState | null>(null);
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const callDocUnsubRef = useRef<(() => void) | null>(null);
  const candidatesUnsubRef = useRef<(() => void) | null>(null);

  // Real-time call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (activeCall && activeCall.status === 'connected') {
      timer = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall?.status]);

  // 30-second timeout for unanswered calls (auto disconnect if not picked up in 30s)
  useEffect(() => {
    let timeoutTimer: NodeJS.Timeout | null = null;
    if (activeCall && (activeCall.status === 'ringing' || activeCall.status === 'incoming' || activeCall.status === 'connecting')) {
      timeoutTimer = setTimeout(() => {
        if (activeCallRef.current && (activeCallRef.current.status === 'ringing' || activeCallRef.current.status === 'incoming' || activeCallRef.current.status === 'connecting')) {
          const callId = activeCallRef.current.id;
          if (activeCallRef.current.direction === 'outgoing') {
            if (callId) {
              updateDoc(doc(db, 'calls', callId), { status: 'cancelled' }).catch(() => {});
            }
            cleanupCall('cancelled');
          } else {
            if (callId) {
              updateDoc(doc(db, 'calls', callId), { status: 'rejected' }).catch(() => {});
            }
            cleanupCall('rejected');
          }
        }
      }, 30000); // 30 seconds limit
    }
    return () => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [activeCall?.status, activeCall?.id]);

  // Auth state listener & User Profile loading
  useEffect(() => {
    if (!firebaseAuth) {
      setAuthReady(true);
      return;
    }

    const applyFallbackUser = (fbUser: FirebaseUser, requireUsername = true) => {
      setUser({
        id: fbUser.uid,
        name: fbUser.displayName || 'User',
        username: fbUser.email?.split('@')[0] || 'user',
        avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        status: 'Available on Secret Vault',
        isOnline: true,
        email: fbUser.email || '',
        providerId: 'google.com',
        firebaseUid: fbUser.uid,
      });
      setNeedsUsername(requireUsername);
      setContacts([]);
      setMessages({});
      setFriendUids([]);
      setPendingFriendRequests([]);
      setSentFriendRequests([]);
      setAllRegisteredUsers([]);
      setCustomNicknames({});
    };

    const ensureUserDocument = async (fbUser: FirebaseUser) => {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef).catch(() => null);
      if (!snap || !snap.exists()) {
        const photoURL = fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=1200&auto=format&fit=crop&q=95';

        await setDoc(userRef, {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          username: fbUser.email?.split('@')[0]?.toLowerCase() || '',
          usernameLower: fbUser.email?.split('@')[0]?.toLowerCase() || '',
          photoURL,
          avatar: photoURL,
          status: 'Available on Secret Vault',
          about: 'Available on CalcChat',
          online: true,
          lastSeen: 'Online',
          lastLogin: serverTimestamp(),
          isProfileComplete: false,
        }, { merge: true });
      } else {
        // Just update lastLogin and online status
        await updateDoc(userRef, {
          online: true,
          lastSeen: 'Online',
          lastLogin: serverTimestamp(),
        }).catch(() => {});
      }
    };

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      try {
        setAuthUser(fbUser);

        if (!fbUser) {
          setUser(DEFAULT_USER);
          setNeedsUsername(false);
          setContacts([]);
          setMessages({});
          setFriendUids([]);
          setPendingFriendRequests([]);
          setSentFriendRequests([]);
          setAllRegisteredUsers([]);
          setCustomNicknames({});
          return;
        }

        // Stay in setup mode until we positively confirm a profile exists.
        setNeedsUsername(true);

        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          setAuthError('Firestore is offline. Loading local session.');
          applyFallbackUser(fbUser, true);
          return;
        }

        // Fetch or listen to users/{uid}
        const userRef = doc(db, 'users', fbUser.uid);
        try {
          await ensureUserDocument(fbUser);
        } catch (seedError) {
          if (!isPermissionDeniedError(seedError)) {
            console.warn('User doc seed error:', seedError);
          }
        }

        const snap = await getDoc(userRef).catch((readError) => {
          if (isPermissionDeniedError(readError)) {
            return null;
          }
          throw readError;
        });

        if (snap && snap.exists() && (snap.data()?.username || snap.data()?.isProfileComplete)) {
          const uData = snap.data();
          setUser({
            id: fbUser.uid,
            name: uData.displayName || fbUser.displayName || 'User',
            username: uData.username,
            avatar: uData.avatar || uData.photoURL || fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=1200&auto=format&fit=crop&q=95',
            status: uData.status || 'Available on Secret Vault',
            isOnline: true,
            email: fbUser.email || '',
            providerId: 'google.com',
            firebaseUid: fbUser.uid,
          });
          setNeedsUsername(false);

          if (uData.settings) {
            setSettings(prev => {
              const updated = { ...prev, ...uData.settings, passcode: uData.settings.passcode || prev.passcode || '1234' };
              try {
                localStorage.setItem('secret_vault_settings', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }

          // Update last login and online status in Firestore
          await updateDoc(userRef, {
            online: true,
            lastSeen: 'Online',
            lastLogin: serverTimestamp(),
          }).catch(() => {});
        } else {
          applyFallbackUser(fbUser, true);
        }
      } catch (error) {
        console.error('Auth profile load error:', error);
        setAuthError('Unable to load profile data right now.');
        if (fbUser) {
          applyFallbackUser(fbUser, true);
        } else {
          setUser(DEFAULT_USER);
          setNeedsUsername(false);
        }
      } finally {
        setAuthReady(true);
      }
    }, (error) => {
      console.error('Auth listener error:', error);
      setAuthError('Authentication state could not be loaded.');
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for Blocked Contacts (contacts I blocked)
  useEffect(() => {
    if (!authUser || needsUsername) {
      setBlockedContactIds([]);
      return;
    }

    const blockedQuery = collection(db, 'users', authUser.uid, 'blockedContacts');
    const unsub = onSnapshot(blockedQuery, (snapshot) => {
      const ids = snapshot.docs.map(d => d.id);
      setBlockedContactIds(ids);
    }, (err) => handleFirestoreError('Blocked contacts snapshot error:', err, () => setBlockedContactIds([])));

    return () => unsub();
  }, [authUser, needsUsername]);

  // Real-time listener for Users who blocked ME
  useEffect(() => {
    if (!authUser || needsUsername) {
      setBlockedByContactIds([]);
      return;
    }

    try {
      const blockedByQuery = query(
        collectionGroup(db, 'blockedContacts'),
        where('blockedUid', '==', authUser.uid)
      );
      const unsub = onSnapshot(blockedByQuery, (snapshot) => {
        const blockerIds: string[] = [];
        snapshot.docs.forEach(d => {
          const blockerUid = d.ref.parent.parent?.id;
          if (blockerUid && blockerUid !== authUser.uid) {
            blockerIds.push(blockerUid);
          }
        });
        setBlockedByContactIds(blockerIds);
      }, (err) => handleFirestoreError('Blocked by contacts snapshot error:', err, () => setBlockedByContactIds([])));

      return () => unsub();
    } catch (e) {
      console.warn('CollectionGroup query error:', e);
    }
  }, [authUser, needsUsername]);

  // Real-time listener for Custom Nicknames
  useEffect(() => {
    if (!authUser || needsUsername) return;

    const nickQuery = query(
      collection(db, 'customNicknames'),
      where('ownerUid', '==', authUser.uid)
    );

    const unsub = onSnapshot(nickQuery, (snapshot) => {
      const nMap: Record<string, string> = {};
      snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.contactUid && data.nickname) {
          nMap[data.contactUid] = data.nickname;
        }
      });
      setCustomNicknames(nMap);
    }, (err) => handleFirestoreError('Nicknames snapshot error:', err, () => setCustomNicknames({})));

    return () => unsub();
  }, [authUser, needsUsername]);

  // Real-time listener for Chat Metadata in Firestore
  useEffect(() => {
    if (!authUser || needsUsername) {
      setChatMetadata({});
      return;
    }

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', authUser.uid)
    );

    const unsub = onSnapshot(chatsQuery, (snapshot) => {
      const metaMap: Record<string, any> = {};
      snapshot.docs.forEach(d => {
        const data = d.data();
        metaMap[d.id] = {
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime || data.updatedAt || null,
          lastMessageSenderId: data.lastMessageSenderId || '',
        };
      });
      setChatMetadata(metaMap);
    }, (err) => handleFirestoreError('Chats metadata snapshot error:', err, () => {}));

    return () => unsub();
  }, [authUser, needsUsername]);

  // Real-time listener for All Registered Users
  useEffect(() => {
    if (!authUser || needsUsername) {
      setAllRegisteredUsers([]);
      return;
    }

    const usersQuery = query(collection(db, 'users'));
    const unsub = onSnapshot(usersQuery, (snapshot) => {
      const uList: any[] = [];
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        uList.push({
          uid: docSnap.id,
          id: docSnap.id,
          displayName: data.displayName || data.username || 'User',
          username: data.username || '',
          photoURL: data.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          avatar: data.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          about: data.about || data.status || 'Available on CalcChat',
          status: data.status || data.about || 'Available on CalcChat',
          online: Boolean(data.online),
          isOnline: Boolean(data.online),
          lastSeen: data.lastSeen || 'Offline',
          friends: Array.isArray(data.friends) ? data.friends : [],
        });
      });
      setAllRegisteredUsers(uList);
    }, (err) => handleFirestoreError('All users snapshot error:', err, () => setAllRegisteredUsers([])));

    return () => unsub();
  }, [authUser, needsUsername]);

  // Real-time listener for Pending & Sent Friend Requests
  useEffect(() => {
    if (!authUser || needsUsername) return;

    // Pending incoming requests
    const incomingReqQuery = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', authUser.uid),
      where('status', '==', 'pending')
    );

    const unsubInc = onSnapshot(incomingReqQuery, (snapshot) => {
      const reqs: FriendRequest[] = [];
      snapshot.docs.forEach(d => {
        reqs.push({ id: d.id, ...d.data() } as FriendRequest);
      });
      setPendingFriendRequests(reqs);
    }, (err) => handleFirestoreError('Incoming requests snapshot error:', err, () => setPendingFriendRequests([])));

    // Sent requests
    const sentReqQuery = query(
      collection(db, 'friendRequests'),
      where('senderId', '==', authUser.uid),
      where('status', '==', 'pending')
    );

    const unsubSent = onSnapshot(sentReqQuery, (snapshot) => {
      const reqs: FriendRequest[] = [];
      snapshot.docs.forEach(d => {
        reqs.push({ id: d.id, ...d.data() } as FriendRequest);
      });
      setSentFriendRequests(reqs);
    }, (err) => handleFirestoreError('Sent requests snapshot error:', err, () => setSentFriendRequests([])));

    return () => {
      unsubInc();
      unsubSent();
    };
  }, [authUser, needsUsername]);

  // Real-time listener for Confirmed Friends
  useEffect(() => {
    if (!authUser || needsUsername) return;

    const friendsQuery1 = query(
      collection(db, 'friends'),
      where('user1Id', '==', authUser.uid)
    );
    const friendsQuery2 = query(
      collection(db, 'friends'),
      where('user2Id', '==', authUser.uid)
    );

    let uids1: string[] = [];
    let uids2: string[] = [];

    const updateCombinedFriends = async () => {
      const combined = Array.from(new Set([...uids1, ...uids2]));
      setFriendUids(combined);

      const selfContact: Contact = {
        id: authUser.uid,
        name: user.name ? `${user.name} (You)` : 'You (Message Yourself)',
        username: user.username,
        avatar: user.avatar || authUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        status: 'Message yourself • Personal Notes',
        isOnline: true,
        lastSeen: 'Online',
        unreadCount: 0,
        isSelf: true,
      };

      if (combined.length === 0) {
        setFriendContacts([selfContact]);
        return;
      }

      // Fetch user docs for all friend UIDs
      try {
        const fetchedContacts: Contact[] = [selfContact];
        for (const fUid of combined) {
          if (fUid === authUser.uid) continue;
          const uDoc = await getDoc(doc(db, 'users', fUid));
          if (uDoc.exists()) {
            const data = uDoc.data();
            fetchedContacts.push({
              id: fUid,
              name: data.displayName || data.username || 'User',
              username: data.username,
              avatar: data.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              status: data.status || 'Available on Secret Vault',
              isOnline: false,
              lastSeen: data.lastSeen || 'Offline',
              unreadCount: 0,
            });
          }
        }
        setFriendContacts(fetchedContacts);
      } catch (err) {
        console.error('Error fetching friend user profiles:', err);
      }
    };

    const unsub1 = onSnapshot(friendsQuery1, (snapshot) => {
      uids1 = snapshot.docs.map(d => d.data().user2Id);
      updateCombinedFriends();
    });

    const unsub2 = onSnapshot(friendsQuery2, (snapshot) => {
      uids2 = snapshot.docs.map(d => d.data().user1Id);
      updateCombinedFriends();
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [authUser, needsUsername]);

  // Real-time listener for Groups in Firestore
  useEffect(() => {
    if (!authUser || needsUsername) {
      setGroupContacts([]);
      return;
    }

    const identifiers = Array.from(new Set([
      authUser.uid,
      user.id,
      user.username,
      user.name,
      authUser.displayName
    ].filter(Boolean) as string[]));

    const unsubs: Array<() => void> = [];
    const docsGroupMap = new Map<string, any>();

    const updateGroupContactsFromMaps = () => {
      const fetchedGroups: Contact[] = Array.from(docsGroupMap.entries()).map(([gId, data]) => {
        const memberNames: string[] = Array.isArray(data.memberNames) ? data.memberNames : [];
        const memberUids: string[] = Array.isArray(data.members) ? data.members : (Array.isArray(data.memberUids) ? data.memberUids : []);
        const gName = data.groupName || data.name || 'Group Chat';
        const gAvatar = data.groupPhoto || data.avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80';
        const createdBy = data.createdBy || '';
        const admins = Array.isArray(data.admins) ? data.admins : (createdBy ? [createdBy] : []);

        // Real-time group call check for current user
        if (data.activeCall && data.activeCall.status === 'active') {
          const callParts: GroupCallParticipant[] = Array.isArray(data.activeCall.participants) ? data.activeCall.participants : [];
          const isInCall = callParts.some(p => p.uid === authUser.uid || p.uid === user.id);
          
          if (!isInCall && !activeCallRef.current) {
            // Trigger incoming group call for group members
            setActiveCall({
              id: data.activeCall.callId || 'group_call_' + gId,
              contactId: data.groupId || gId,
              type: data.activeCall.type || 'voice',
              direction: 'incoming',
              status: 'incoming',
              durationSeconds: 0,
              isMuted: false,
              isVideoOff: false,
              isSpeakerOn: true,
              isFrontCamera: true,
              signalBars: 4,
              isGroupCall: true,
              participants: callParts,
            });
          } else if (isInCall && activeCallRef.current && activeCallRef.current.contactId === (data.groupId || gId)) {
            setActiveCall(prev => prev ? { ...prev, participants: callParts } : null);
          }
        }

        return {
          id: data.groupId || data.id || gId,
          name: gName,
          username: 'group',
          avatar: gAvatar,
          status: data.status || `${memberNames.length || memberUids.length || 1} members`,
          isOnline: true,
          lastSeen: 'Group',
          unreadCount: 0,
          isGroup: true,
          groupMembers: memberNames,
          members: memberUids,
          createdBy: createdBy,
          ownerId: data.ownerId || createdBy,
          admins: admins,
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime || null,
          wallpaper: data.wallpaper || data.chatWallpaper,
          description: data.description || data.about || '',
          bannedMembers: Array.isArray(data.bannedMembers) ? data.bannedMembers : [],
          mutedMembers: Array.isArray(data.mutedMembers) ? data.mutedMembers : [],
          joinRequests: Array.isArray(data.joinRequests) ? data.joinRequests : [],
          inviteLink: data.inviteLink || `https://calchat.app/join/${data.groupId || data.id || gId}`,
          inviteLinkDisabled: !!data.inviteLinkDisabled,
          isPublic: data.isPublic !== undefined ? data.isPublic : false,
          joinApprovalRequired: data.joinApprovalRequired !== undefined ? data.joinApprovalRequired : false,
          permissions: data.permissions ? { ...DEFAULT_GROUP_PERMISSIONS, ...data.permissions } : DEFAULT_GROUP_PERMISSIONS,
          activityLogs: Array.isArray(data.activityLogs) ? data.activityLogs : [],
          deletedMessageLogs: Array.isArray(data.deletedMessageLogs) ? data.deletedMessageLogs : [],
        };
      });

      setGroupContacts(fetchedGroups);
    };

    identifiers.forEach(idVal => {
      const q1 = query(collection(db, 'groups'), where('members', 'array-contains', idVal));
      const q2 = query(collection(db, 'groups'), where('memberUids', 'array-contains', idVal));
      const q3 = query(collection(db, 'groups'), where('createdBy', '==', idVal));

      const handleSnapshotChanges = (snapshot: any) => {
        snapshot.docChanges().forEach((change: any) => {
          if (change.type === 'removed') {
            const removedId = change.doc.id;
            docsGroupMap.delete(removedId);
            setGroupContacts(prev => prev.filter(g => g.id !== removedId));
            setMessages(prev => {
              const next = { ...prev };
              delete next[removedId];
              return next;
            });
            if (activeContactId === removedId) {
              setActiveContactId(null);
            }
          } else {
            docsGroupMap.set(change.doc.id, change.doc.data());
          }
        });
        updateGroupContactsFromMaps();
      };

      const u1 = onSnapshot(q1, handleSnapshotChanges, (err) => handleFirestoreError('Groups snapshot error (members):', err, () => {}));
      const u2 = onSnapshot(q2, handleSnapshotChanges, (err) => handleFirestoreError('Groups snapshot error (memberUids):', err, () => {}));
      const u3 = onSnapshot(q3, handleSnapshotChanges, (err) => handleFirestoreError('Groups snapshot error (createdBy):', err, () => {}));

      unsubs.push(u1, u2, u3);
    });

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, [authUser, needsUsername, user.id, user.username, user.name]);

  // Real-time listener for Messages with Confirmed Friends, Self Chat & Groups
  useEffect(() => {
    if (!authUser || needsUsername) {
      setMessages({});
      return;
    }

    const unsubs: Array<() => void> = [];
    const friendChatUids = Array.from(new Set([authUser.uid, ...friendUids]));
    const groupIds = groupContacts.map(g => g.id);
    const allPartnerIds = Array.from(new Set([...friendChatUids, ...groupIds]));

    allPartnerIds.forEach(targetId => {
      const isGroup = groupContacts.some(g => g.id === targetId) || targetId.startsWith('group_');
      const chatId = isGroup ? targetId : [authUser.uid, targetId].sort().join('_');

      const msgQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      const unsub = onSnapshot(msgQuery, (snapshot) => {
        if (!snapshot.metadata.hasPendingWrites) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (data.senderId && data.senderId !== authUser.uid) {
                const isMuted = mutedContactIds.includes(data.senderId) || mutedContactIds.includes(targetId);
                if (!isMuted) {
                  playMessageArrivalSound(data.senderId);
                }
              }
            }
          });
        }

        const msgsList: Message[] = snapshot.docs
          .map((d): Message | null => {
            const data = d.data();
            const deletedForArr: string[] = data.deletedFor || [];
            if (authUser && deletedForArr.includes(authUser.uid)) {
              return null;
            }

            const timeStr = data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now';

            const isRead = Boolean(data.isRead || data.seen);
            const seen = data.seen !== undefined ? Boolean(data.seen) : isRead;

            return {
              id: d.id,
              senderId: data.senderId,
              senderName: data.senderName,
              senderAvatar: data.senderAvatar,
              receiverId: data.receiverId,
              text: data.text || '',
              timestamp: timeStr,
              createdAt: data.createdAt,
              type: data.type || 'text',
              systemAction: data.systemAction,
              systemText: data.systemText || data.text || '',
              callInfo: data.callInfo,
              media: data.media,
              isSent: true,
              isDelivered: true,
              isRead: isRead,
              seen: seen,
              isStarred: Boolean(data.isStarred),
              isPinned: Boolean(data.isPinned),
              isEdited: Boolean(data.isEdited),
              isForwarded: Boolean(data.isForwarded),
              replyTo: data.replyTo,
              deletedForEveryone: Boolean(data.deletedForEveryone),
              deletedFor: deletedForArr,
              reactions: data.reactions || {},
            };
          })
          .filter((m): m is Message => m !== null);

        setMessages(prev => ({
          ...prev,
          [targetId]: msgsList
        }));
      }, (err) => handleFirestoreError(`Messages snapshot error for chatId: ${chatId}`, err, () => {
        setMessages(prev => ({
          ...prev,
          [targetId]: prev[targetId] || []
        }));
      }));

      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach(u => u());
    };
  }, [authUser, needsUsername, friendUids, groupContacts]);

  // Real-time listener for typing status of friends
  useEffect(() => {
    if (!authUser || needsUsername || friendUids.length === 0) {
      setTypingStatusMap({});
      return;
    }

    const unsubs: Array<() => void> = [];

    friendUids.forEach(friendId => {
      const chatId = [authUser.uid, friendId].sort().join('_');
      const typingRef = doc(db, 'users', friendId, 'typing', chatId);

      const unsub = onSnapshot(typingRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setTypingStatusMap(prev => ({
            ...prev,
            [friendId]: Boolean(data?.isTyping)
          }));
        } else {
          setTypingStatusMap(prev => ({
            ...prev,
            [friendId]: false
          }));
        }
      }, (err) => {
        handleFirestoreError(`Typing status error for ${friendId}`, err, () => {});
      });

      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach(u => u());
    };
  }, [authUser, needsUsername, friendUids]);

  const setTypingStatus = async (contactId: string, isTyping: boolean) => {
    if (!authUser || !contactId || !db) return;
    const isGroup = groupContacts.some(g => g.id === contactId) || contactId.startsWith('group_');
    const chatId = isGroup ? contactId : [authUser.uid, contactId].sort().join('_');
    const typingRef = doc(db, 'users', authUser.uid, 'typing', chatId);
    const presenceRef = doc(db, 'presence', authUser.uid);
    const userRef = doc(db, 'users', authUser.uid);

    try {
      await setDoc(typingRef, {
        isTyping: Boolean(isTyping),
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});

      await setDoc(presenceRef, {
        uid: authUser.uid,
        isTyping: Boolean(isTyping),
        typingTo: isTyping ? contactId : null,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});

      await updateDoc(userRef, {
        isTyping: Boolean(isTyping),
        typingTo: isTyping ? contactId : null,
      }).catch(() => {});
    } catch (e) {
      console.warn('Failed to update typing status:', e);
    }
  };

  const markMessagesAsRead = async (contactId: string) => {
    if (!authUser || !contactId) return;
    const isGroup = groupContacts.some(g => g.id === contactId) || contactId.startsWith('group_');
    const chatId = isGroup ? contactId : [authUser.uid, contactId].sort().join('_');
    const chatMsgs = messages[contactId] || [];
    const unseenMsgs = chatMsgs.filter(m => m.senderId !== authUser.uid && (!m.seen || !m.isRead));

    if (unseenMsgs.length === 0) return;

    try {
      const batch = writeBatch(db);
      let count = 0;
      unseenMsgs.forEach(m => {
        const msgRef = doc(db, 'chats', chatId, 'messages', m.id);
        batch.update(msgRef, { seen: true, isRead: true });
        count++;
      });
      if (count > 0) {
        await batch.commit();
      }
    } catch (err) {
      console.warn('Failed marking messages as read:', err);
    }
  };

  // Automatically mark messages as read when active contact is open
  useEffect(() => {
    if (activeContactId && authUser) {
      markMessagesAsRead(activeContactId);
    }
  }, [activeContactId, messages, authUser]);

  // Real-time listener for Friend Status Updates with 24-hour auto delete filter
  useEffect(() => {
    if (!authUser || needsUsername) return;

    const statusQuery = query(
      collection(db, 'status'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(statusQuery, (snapshot) => {
      const allowedUids = new Set([authUser.uid, ...friendUids]);
      const list: StatusUpdate[] = [];
      const nowMs = Date.now();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      snapshot.docs.forEach(d => {
        const data = d.data();
        if (allowedUids.has(data.userId)) {
          // Status Privacy Filter ('only share with...')
          const privacyMode = data.privacyMode || 'contacts';
          const allowedUserIds = Array.isArray(data.allowedUserIds) ? data.allowedUserIds : [];

          // If status is restricted to specific contacts, non-owner users must be in allowedUserIds list
          if (privacyMode === 'only' && data.userId !== authUser.uid) {
            const isPermitted = allowedUserIds.includes(authUser.uid) ||
                                (user.username && allowedUserIds.includes(user.username)) ||
                                (user.id && allowedUserIds.includes(user.id));
            if (!isPermitted) {
              return; // User is not in the allowed list for this status!
            }
          }

          // Calculate creation time
          let createdMs = nowMs;
          if (data.createdAt?.toMillis) {
            createdMs = data.createdAt.toMillis();
          } else if (data.createdAt?.seconds) {
            createdMs = data.createdAt.seconds * 1000;
          } else if (typeof data.createdAt === 'number') {
            createdMs = data.createdAt;
          }

          // Exclude statuses older than 24 hours
          if (nowMs - createdMs <= twentyFourHoursMs) {
            list.push({
              id: d.id,
              userId: data.userId,
              userName: data.userName,
              userAvatar: data.userAvatar,
              text: data.text,
              mediaUrl: data.mediaUrl,
              mediaType: data.mediaType,
              caption: data.caption,
              bgColor: data.bgColor,
              privacyMode: data.privacyMode || 'contacts',
              allowedUserIds: data.allowedUserIds || [],
              createdAt: data.createdAt,
              expiresAt: data.expiresAt,
              likesCount: data.likesCount || (data.likes ? data.likes.length : 0),
              seenCount: data.seenCount || (data.seenUserIds ? data.seenUserIds.length : 0),
              repliesCount: data.repliesCount || 0,
              likes: data.likes || [],
              seenUserIds: data.seenUserIds || [],
            });
          }
        }
      });

      setStatusUpdates(list);
    }, (err) => handleFirestoreError('Status snapshot error:', err, () => setStatusUpdates([])));

    return () => unsub();
  }, [authUser, needsUsername, friendUids]);

  // Real-time listeners for Status Subcollections (Seen & Likes)
  useEffect(() => {
    if (!authUser || needsUsername || statusUpdates.length === 0) return;

    const unsubs: Array<() => void> = [];

    statusUpdates.forEach((st) => {
      // Subcollection listener for Seen
      const seenQuery = query(collection(db, 'status', st.id, 'seen'));
      const unsubSeen = onSnapshot(seenQuery, (snap) => {
        const records: StatusSeenRecord[] = snap.docs.map(d => ({
          id: d.id,
          statusId: st.id,
          ...d.data()
        } as StatusSeenRecord));
        setStatusSeenRecordsMap(prev => ({ ...prev, [st.id]: records }));
      }, () => {});
      unsubs.push(unsubSeen);

      // Subcollection listener for Likes
      const likesQuery = query(collection(db, 'status', st.id, 'likes'));
      const unsubLikes = onSnapshot(likesQuery, (snap) => {
        const records: StatusLikeRecord[] = snap.docs.map(d => ({
          id: d.id,
          statusId: st.id,
          ...d.data()
        } as StatusLikeRecord));
        setStatusLikeRecordsMap(prev => ({ ...prev, [st.id]: records }));
      }, () => {});
      unsubs.push(unsubLikes);
    });

    return () => {
      unsubs.forEach(u => u());
    };
  }, [authUser, needsUsername, statusUpdates]);

  // Check if contactId is in friends list or is a group
  const isFriend = (contactId: string): boolean => {
    if (!contactId) return false;
    if (authUser && contactId === authUser.uid) return true;
    if (contacts.some(c => c.id === contactId && c.isGroup)) return true;
    if (groupContacts.some(g => g.id === contactId)) return true;
    if (contactId.startsWith('group_')) return true;
    return friendUids.includes(contactId);
  };

  // Complete Username Setup
  const completeUsernameSetup = async (username: string, displayName: string) => {
    if (!authUser) return;

    const uLower = username.toLowerCase();
    const userRef = doc(db, 'users', authUser.uid);
    const photoURL = authUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    await runTransaction(db, async (transaction) => {
      const usernameRef = doc(db, 'usernames', uLower);
      const usernameSnap = await transaction.get(usernameRef);

      if (usernameSnap.exists() && usernameSnap.data()?.uid !== authUser.uid) {
        throw new Error('Username is already taken');
      }

      transaction.set(usernameRef, {
        uid: authUser.uid,
        username: uLower,
        createdAt: serverTimestamp(),
      });

      transaction.set(userRef, {
        uid: authUser.uid,
        username: uLower,
        usernameLower: uLower,
        displayName: displayName || uLower,
        photoURL,
        avatar: photoURL,
        email: authUser.email || '',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        lastSeen: 'Online',
        online: true,
        status: 'Available on Secret Vault',
        about: 'Available on CalcChat',
        isProfileComplete: true,
        settings: settings,
      }, { merge: true });
    });

    setUser({
      id: authUser.uid,
      name: displayName || uLower,
      username: uLower,
      avatar: photoURL,
      status: 'Available on Secret Vault',
      isOnline: true,
      email: authUser.email || '',
      providerId: 'google.com',
      firebaseUid: authUser.uid,
    });

    setNeedsUsername(false);
  };

  // Search real Firestore users
  const searchFirebaseUsers = async (term: string) => {
    if (!authUser || !term.trim()) return [];

    const cleanTerm = term.trim().toLowerCase();
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    const results: Array<{
      id: string;
      name: string;
      username: string;
      avatar: string;
      status: string;
      isOnline: boolean;
      friendStatus: FriendStatus;
      requestId?: string;
    }> = [];

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const uid = docSnap.id || data.uid;

      if (blockedContactIds.includes(uid) || blockedByContactIds.includes(uid)) {
        return;
      }

      const uName = (data.username || '').toLowerCase();
      const dName = (data.displayName || '').toLowerCase();
      const customNick = (customNicknames[uid] || '').toLowerCase();

      if (uName.includes(cleanTerm) || dName.includes(cleanTerm) || customNick.includes(cleanTerm)) {
        let fStatus: FriendStatus = 'none';
        let reqId: string | undefined = undefined;

        if (uid === authUser.uid) {
          fStatus = 'self';
        } else if (friendUids.includes(uid)) {
          fStatus = 'friends';
        } else {
          const pendingSent = sentFriendRequests.find(r => r.receiverId === uid);
          if (pendingSent) {
            fStatus = 'pending_sent';
            reqId = pendingSent.id;
          } else {
            const pendingRec = pendingFriendRequests.find(r => r.senderId === uid);
            if (pendingRec) {
              fStatus = 'pending_received';
              reqId = pendingRec.id;
            }
          }
        }

        results.push({
          id: uid,
          name: uid === authUser.uid 
            ? `${data.displayName || data.username} (You)`
            : (customNicknames[uid] || data.displayName || data.username),
          username: data.username,
          avatar: data.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          status: uid === authUser.uid ? 'Message yourself • Personal Notes' : (data.status || 'Available'),
          isOnline: Boolean(data.online),
          friendStatus: fStatus,
          requestId: reqId,
        });
      }
    });

    return results;
  };

  // Send Friend Request
  const sendFriendRequest = async (targetUserOrId: string | any) => {
    if (!authUser || needsUsername) return;

    const targetUid = typeof targetUserOrId === 'string' ? targetUserOrId : targetUserOrId?.uid || targetUserOrId?.id;
    if (!targetUid || targetUid === authUser.uid) return;

    // Check duplicate request
    const alreadySent = sentFriendRequests.some(r => r.receiverId === targetUid && r.status === 'pending');
    if (alreadySent) return;

    let targetData: any = typeof targetUserOrId === 'object' ? targetUserOrId : null;
    if (!targetData) {
      const uDoc = await getDoc(doc(db, 'users', targetUid));
      if (uDoc.exists()) {
        targetData = uDoc.data();
      }
    }

    const sName = user.name || user.username || authUser.displayName || 'User';
    const sPhoto = user.avatar || authUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    const rName = targetData?.displayName || targetData?.name || targetData?.username || 'User';
    const rPhoto = targetData?.photoURL || targetData?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    await addDoc(collection(db, 'friendRequests'), {
      senderId: authUser.uid,
      senderName: sName,
      senderDisplayName: sName,
      senderPhoto: sPhoto,
      senderPhotoURL: sPhoto,
      senderUsername: user.username || '',
      receiverId: targetUid,
      receiverName: rName,
      receiverDisplayName: rName,
      receiverPhoto: rPhoto,
      receiverPhotoURL: rPhoto,
      receiverUsername: targetData?.username || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    const myDocRef = doc(db, 'users', authUser.uid);
    await updateDoc(myDocRef, {
      following: arrayUnion(targetUid)
    }).catch(() => {});

    setUser(prev => ({
      ...prev,
      following: Array.from(new Set([...(prev.following || []), targetUid]))
    }));
  };

  // Accept Friend Request
  const acceptFriendRequest = async (requestId: string, senderId: string) => {
    if (!authUser) return;

    // Update request status to accepted
    await updateDoc(doc(db, 'friendRequests', requestId), {
      status: 'accepted',
    }).catch(() => {});

    // Add both users to each other's friends list
    const myDocRef = doc(db, 'users', authUser.uid);
    const senderDocRef = doc(db, 'users', senderId);

    await updateDoc(myDocRef, {
      friends: arrayUnion(senderId),
      following: arrayUnion(senderId),
      followers: arrayUnion(senderId),
    }).catch(() => {});

    await updateDoc(senderDocRef, {
      friends: arrayUnion(authUser.uid),
      following: arrayUnion(authUser.uid),
      followers: arrayUnion(authUser.uid),
    }).catch(() => {});

    // Create friendship document in friends collection
    const friendshipId = [authUser.uid, senderId].sort().join('_');
    await setDoc(doc(db, 'friends', friendshipId), {
      user1Id: authUser.uid,
      user2Id: senderId,
      createdAt: serverTimestamp(),
    }, { merge: true });

    // Automatically create a private chat in chats collection
    const chatId = friendshipId;
    await setDoc(doc(db, 'chats', chatId), {
      participants: [authUser.uid, senderId],
      lastMessage: '',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    // Update local user state
    setUser(prev => ({
      ...prev,
      friends: Array.from(new Set([...(prev.friends || []), senderId])),
      following: Array.from(new Set([...(prev.following || []), senderId])),
      followers: Array.from(new Set([...(prev.followers || []), senderId])),
    }));
  };

  // Reject Friend Request
  const rejectFriendRequest = async (requestId: string) => {
    if (!authUser) return;
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
    } catch (err) {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'rejected',
      }).catch(() => {});
    }
  };

  // Unfriend Contact
  const unfriendContact = async (contactId: string) => {
    if (!authUser || !contactId) return;

    try {
      // 1. Delete friendship document from 'friends' collection
      const friendshipId = [authUser.uid, contactId].sort().join('_');
      await deleteDoc(doc(db, 'friends', friendshipId)).catch(() => {});

      // 2. Remove or update friendRequests between authUser.uid and contactId
      const reqQuery1 = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', authUser.uid),
        where('receiverId', '==', contactId)
      );
      const reqQuery2 = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', contactId),
        where('receiverId', '==', authUser.uid)
      );

      const [snap1, snap2] = await Promise.all([
        getDocs(reqQuery1).catch(() => null),
        getDocs(reqQuery2).catch(() => null)
      ]);

      const deletePromises: Promise<any>[] = [];
      if (snap1) {
        snap1.docs.forEach(d => deletePromises.push(deleteDoc(doc(db, 'friendRequests', d.id)).catch(() => {})));
      }
      if (snap2) {
        snap2.docs.forEach(d => deletePromises.push(deleteDoc(doc(db, 'friendRequests', d.id)).catch(() => {})));
      }
      await Promise.all(deletePromises);

      // 3. Remove contactId from my user document arrays (friends, following, followers)
      const myDocRef = doc(db, 'users', authUser.uid);
      await updateDoc(myDocRef, {
        friends: arrayRemove(contactId),
        following: arrayRemove(contactId),
        followers: arrayRemove(contactId),
      }).catch(() => {});

      // 4. Remove my UID from contact's user document arrays (friends, following, followers)
      const contactDocRef = doc(db, 'users', contactId);
      await updateDoc(contactDocRef, {
        friends: arrayRemove(authUser.uid),
        following: arrayRemove(authUser.uid),
        followers: arrayRemove(authUser.uid),
      }).catch(() => {});

      // 5. Update local states immediately
      setUser(prev => ({
        ...prev,
        friends: (prev.friends || []).filter(id => id !== contactId),
        following: (prev.following || []).filter(id => id !== contactId),
        followers: (prev.followers || []).filter(id => id !== contactId),
      }));

      setFriendUids(prev => prev.filter(id => id !== contactId));
      setFriendContacts(prev => prev.filter(c => c.id !== contactId));

      // 6. Close chat window if open with this contact
      if (activeContactId === contactId) {
        setActiveContactId(null);
      }
    } catch (err) {
      console.error('Error during unfriendContact:', err);
    }
  };

  // Post Status Update
  const postStatusUpdate = async (
    text?: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
    caption?: string,
    bgColor?: string,
    privacyMode: 'contacts' | 'only' = 'contacts',
    allowedUserIds: string[] = []
  ) => {
    let currentAuthUser = authUser;
    if (!currentAuthUser && firebaseAuth) {
      try {
        const res = await signInAnonymously(firebaseAuth);
        currentAuthUser = res.user;
      } catch (e) {
        console.warn('Anonymous sign in attempt failed before posting status:', e);
      }
    }

    if (!currentAuthUser) {
      console.warn('No authenticated user available to post status update.');
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 Hours

    let processedMediaUrl = mediaUrl || '';
    if (processedMediaUrl && mediaType === 'image' && processedMediaUrl.length > 300000) {
      try {
        const compressed = await compressImage(processedMediaUrl, 1080, 350000);
        if (compressed) processedMediaUrl = compressed;
      } catch (e) {
        console.warn('Status image compression error:', e);
      }
    }

    try {
      await addDoc(collection(db, 'status'), {
        userId: currentAuthUser.uid,
        userName: user.name || currentAuthUser.displayName || 'User',
        userAvatar: user.avatar || currentAuthUser.photoURL || '',
        text: text || '',
        mediaUrl: processedMediaUrl,
        mediaType: mediaType || 'image',
        caption: caption || '',
        bgColor: bgColor || '#ff2e93',
        privacyMode: privacyMode || 'contacts',
        allowedUserIds: Array.isArray(allowedUserIds) ? allowedUserIds : [],
        createdAt: serverTimestamp(),
        expiresAt: expiresAt.toISOString(),
        likesCount: 0,
        seenCount: 0,
        repliesCount: 0,
        likes: [],
        seenUserIds: [],
      });
    } catch (err: any) {
      console.error('Failed to post status:', err);
      handleFirestoreError('postStatusUpdate', err);
    }
  };

  // Delete Status Update
  const deleteStatusUpdate = async (statusId: string) => {
    if (!authUser || !statusId) return;
    try {
      await deleteDoc(doc(db, 'status', statusId));
    } catch (e) {
      console.error('Error deleting status:', e);
    }
  };

  // Like or Unlike Status Update
  const likeStatusUpdate = async (statusId: string) => {
    if (!authUser || !statusId) return;

    const statusRef = doc(db, 'status', statusId);
    const likeDocRef = doc(db, 'status', statusId, 'likes', authUser.uid);

    const now = new Date();
    const timeFormatted = formatStatusTime(now);

    const bestName = user.name && user.name !== 'User' ? user.name : (authUser.displayName || user.username || 'User');
    const bestAvatar = user.avatar || authUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    try {
      const likeDocSnap = await getDoc(likeDocRef).catch(() => null);

      if (likeDocSnap && likeDocSnap.exists()) {
        // Unlike
        await deleteDoc(likeDocRef).catch(() => {});
        await updateDoc(statusRef, {
          likes: arrayRemove(authUser.uid),
          likesCount: increment(-1),
        }).catch(() => {});

        // Instant local state updates
        setStatusUpdates(prev => prev.map(s => {
          if (s.id === statusId) {
            const currentLikes = s.likes || [];
            return {
              ...s,
              likes: currentLikes.filter(id => id !== authUser.uid),
              likesCount: Math.max(0, (s.likesCount || 0) - 1),
            };
          }
          return s;
        }));

        setStatusLikeRecordsMap(prev => {
          const current = prev[statusId] || [];
          return {
            ...prev,
            [statusId]: current.filter(r => r.userId !== authUser.uid)
          };
        });
      } else {
        // Like
        const newRecord: StatusLikeRecord = {
          id: authUser.uid,
          statusId,
          userId: authUser.uid,
          userName: bestName,
          userAvatar: bestAvatar,
          likeTime: timeFormatted,
        };

        await setDoc(likeDocRef, {
          userId: authUser.uid,
          userName: bestName,
          userAvatar: bestAvatar,
          likedAt: serverTimestamp(),
          likeTime: timeFormatted,
        }).catch(() => {});

        await updateDoc(statusRef, {
          likes: arrayUnion(authUser.uid),
          likesCount: increment(1),
        }).catch(() => {});

        // Instant local state updates
        setStatusUpdates(prev => prev.map(s => {
          if (s.id === statusId) {
            const currentLikes = s.likes || [];
            if (!currentLikes.includes(authUser.uid)) {
              return {
                ...s,
                likes: [...currentLikes, authUser.uid],
                likesCount: (s.likesCount || 0) + 1,
              };
            }
          }
          return s;
        }));

        setStatusLikeRecordsMap(prev => {
          const current = prev[statusId] || [];
          if (!current.some(r => r.userId === authUser.uid)) {
            return {
              ...prev,
              [statusId]: [...current, newRecord]
            };
          }
          return prev;
        });
      }
    } catch (e) {
      console.warn('Error toggling status like:', e);
    }
  };

  // Mark Status As Seen
  const markStatusAsSeen = async (statusId: string) => {
    if (!authUser || !statusId) return;

    const statusRef = doc(db, 'status', statusId);
    const seenDocRef = doc(db, 'status', statusId, 'seen', authUser.uid);

    const now = new Date();
    const timeFormatted = formatStatusTime(now);

    const bestName = user.name && user.name !== 'User' ? user.name : (authUser.displayName || user.username || 'User');
    const bestAvatar = user.avatar || authUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    try {
      const seenSnap = await getDoc(seenDocRef).catch(() => null);
      if (!seenSnap || !seenSnap.exists()) {
        await setDoc(seenDocRef, {
          userId: authUser.uid,
          userName: bestName,
          userAvatar: bestAvatar,
          seenAt: serverTimestamp(),
          seenTime: timeFormatted,
        }).catch(() => {});

        await updateDoc(statusRef, {
          seenUserIds: arrayUnion(authUser.uid),
          seenCount: increment(1),
        }).catch(() => {});

        // Instant local state updates
        setStatusUpdates(prev => prev.map(s => {
          if (s.id === statusId) {
            const currentSeen = s.seenUserIds || [];
            if (!currentSeen.includes(authUser.uid)) {
              return {
                ...s,
                seenUserIds: [...currentSeen, authUser.uid],
                seenCount: (s.seenCount || 0) + 1,
              };
            }
          }
          return s;
        }));

        const newRecord: StatusSeenRecord = {
          id: authUser.uid,
          statusId,
          userId: authUser.uid,
          userName: bestName,
          userAvatar: bestAvatar,
          seenTime: timeFormatted,
        };

        setStatusSeenRecordsMap(prev => {
          const current = prev[statusId] || [];
          if (!current.some(r => r.userId === authUser.uid)) {
            return {
              ...prev,
              [statusId]: [...current, newRecord]
            };
          }
          return prev;
        });
      }
    } catch (e) {
      console.warn('Error marking status as seen:', e);
    }
  };

  // Reply to Status Update
  const replyToStatus = async (status: StatusUpdate, replyText: string) => {
    if (!authUser || !status) return;

    let createdAtFormatted: any = Date.now();
    if (status.createdAt?.toMillis) {
      createdAtFormatted = status.createdAt.toMillis();
    } else if (status.createdAt?.seconds) {
      createdAtFormatted = status.createdAt.seconds * 1000;
    } else if (typeof status.createdAt === 'number') {
      createdAtFormatted = status.createdAt;
    }

    const resolvedType = status.mediaType || (status.mediaUrl ? 'image' : 'text');

    const statusReplyData: StatusReplyData = {
      statusId: status.id,
      statusOwnerId: status.userId,
      statusType: resolvedType,
      statusThumbnail: status.mediaUrl || '',
      statusMediaUrl: status.mediaUrl || '',
      statusText: status.text || status.caption || '',
      statusMediaType: resolvedType,
      statusOwnerName: status.userName || 'User',
      statusCreatedAt: createdAtFormatted,
      textReply: replyText,
    };

    await sendMessage(status.userId, replyText, undefined, undefined, statusReplyData);

    await updateDoc(doc(db, 'status', status.id), {
      repliesCount: increment(1),
    }).catch(() => {});
  };

  // React to Status Update with Emoji
  const reactToStatus = async (status: StatusUpdate, emoji: string) => {
    if (!authUser || !status) return;

    let createdAtFormatted: any = Date.now();
    if (status.createdAt?.toMillis) {
      createdAtFormatted = status.createdAt.toMillis();
    } else if (status.createdAt?.seconds) {
      createdAtFormatted = status.createdAt.seconds * 1000;
    } else if (typeof status.createdAt === 'number') {
      createdAtFormatted = status.createdAt;
    }

    const resolvedType = status.mediaType || (status.mediaUrl ? 'image' : 'text');

    const statusReactionData: StatusReactionData = {
      statusId: status.id,
      statusOwnerId: status.userId,
      statusType: resolvedType,
      statusThumbnail: status.mediaUrl || '',
      statusMediaUrl: status.mediaUrl || '',
      statusText: status.text || status.caption || '',
      statusMediaType: resolvedType,
      statusOwnerName: status.userName || 'User',
      statusCreatedAt: createdAtFormatted,
      emoji: emoji,
    };

    const reactionText = `Reacted ${emoji} to your Status`;
    await sendMessage(status.userId, reactionText, undefined, undefined, undefined, statusReactionData);

    const now = new Date();
    const timeFormatted = formatStatusTime(now);

    await setDoc(doc(db, 'status', status.id, 'reactions', authUser.uid), {
      userId: authUser.uid,
      userName: user.name || authUser.displayName || 'User',
      userAvatar: user.avatar || authUser.photoURL || '',
      emoji: emoji,
      createdAt: serverTimestamp(),
      reactionTime: timeFormatted,
    }).catch(() => {});
  };

  const getSeenRecords = (statusId: string): StatusSeenRecord[] => {
    const mapRecords = statusSeenRecordsMap[statusId] || [];
    const st = statusUpdates.find(s => s.id === statusId);
    
    const recordUserIds = new Set(mapRecords.map(r => r.userId));
    const merged: StatusSeenRecord[] = [...mapRecords];

    if (st && st.seenUserIds && Array.isArray(st.seenUserIds)) {
      st.seenUserIds.forEach(uid => {
        if (!recordUserIds.has(uid)) {
          recordUserIds.add(uid);
          const contact = contacts.find(c => c.id === uid);
          const regUser = allRegisteredUsers.find(u => u.uid === uid || u.id === uid);
          const name = customNicknames[uid] || 
                       (contact ? getContactDisplayName(contact) : null) || 
                       regUser?.displayName || 
                       regUser?.username || 
                       'User';
          const avatar = contact?.avatar || regUser?.photoURL || regUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
          
          merged.push({
            id: `seen_${uid}`,
            statusId,
            userId: uid,
            userName: name,
            userAvatar: avatar,
            seenTime: 'Recently',
          });
        }
      });
    }

    return merged.map(r => {
      const contact = contacts.find(c => c.id === r.userId);
      const regUser = allRegisteredUsers.find(u => u.uid === r.userId || u.id === r.userId);
      const resolvedName = customNicknames[r.userId] || 
                           (contact ? getContactDisplayName(contact) : null) || 
                           regUser?.displayName || 
                           regUser?.username || 
                           (r.userName && r.userName !== 'User' ? r.userName : '') || 
                           r.userName || 
                           'User';
      const resolvedAvatar = contact?.avatar || regUser?.photoURL || regUser?.avatar || r.userAvatar;
      return {
        ...r,
        userName: resolvedName,
        userAvatar: resolvedAvatar,
      };
    });
  };

  const getLikeRecords = (statusId: string): StatusLikeRecord[] => {
    const mapRecords = statusLikeRecordsMap[statusId] || [];
    const st = statusUpdates.find(s => s.id === statusId);
    
    const recordUserIds = new Set(mapRecords.map(r => r.userId));
    const merged: StatusLikeRecord[] = [...mapRecords];

    if (st && st.likes && Array.isArray(st.likes)) {
      st.likes.forEach(uid => {
        if (!recordUserIds.has(uid)) {
          recordUserIds.add(uid);
          const contact = contacts.find(c => c.id === uid);
          const regUser = allRegisteredUsers.find(u => u.uid === uid || u.id === uid);
          const name = customNicknames[uid] || 
                       (contact ? getContactDisplayName(contact) : null) || 
                       regUser?.displayName || 
                       regUser?.username || 
                       'User';
          const avatar = contact?.avatar || regUser?.photoURL || regUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
          
          merged.push({
            id: `like_${uid}`,
            statusId,
            userId: uid,
            userName: name,
            userAvatar: avatar,
            likeTime: 'Recently',
          });
        }
      });
    }

    return merged.map(r => {
      const contact = contacts.find(c => c.id === r.userId);
      const regUser = allRegisteredUsers.find(u => u.uid === r.userId || u.id === r.userId);
      const resolvedName = customNicknames[r.userId] || 
                           (contact ? getContactDisplayName(contact) : null) || 
                           regUser?.displayName || 
                           regUser?.username || 
                           (r.userName && r.userName !== 'User' ? r.userName : '') || 
                           r.userName || 
                           'User';
      const resolvedAvatar = contact?.avatar || regUser?.photoURL || regUser?.avatar || r.userAvatar;
      return {
        ...r,
        userName: resolvedName,
        userAvatar: resolvedAvatar,
      };
    });
  };

  // Send Message in Firestore
  const sendMessage = async (
    receiverId: string,
    text: string,
    media?: MediaAttachment,
    replyTo?: Message['replyTo'],
    statusReply?: StatusReplyData,
    statusReaction?: StatusReactionData,
    isForwarded?: boolean
  ) => {
    const isGroupChat = contacts.some(c => c.id === receiverId && c.isGroup) || groupContacts.some(g => g.id === receiverId) || receiverId.startsWith('group_');

    if (!authUser) throw new Error('Not authenticated.');
    if (blockedContactIds.includes(receiverId) || blockedByContactIds.includes(receiverId)) {
      throw new Error('You cannot send messages to this contact because they are blocked.');
    }
    if (!isGroupChat && !isFriend(receiverId)) {
      throw new Error('You must become friends before you can chat.');
    }

    if (isGroupChat) {
      const targetGroup = groupContacts.find(g => g.id === receiverId) || contacts.find(c => c.id === receiverId);
      if (targetGroup) {
        const myUid = authUser.uid;
        const myName = user.name || authUser.displayName || 'You';

        if (targetGroup.bannedMembers && (targetGroup.bannedMembers.includes(myUid) || targetGroup.bannedMembers.includes(myName))) {
          throw new Error('You have been banned from this group.');
        }

        if (targetGroup.mutedMembers && (targetGroup.mutedMembers.includes(myUid) || targetGroup.mutedMembers.includes(myName))) {
          throw new Error('You are currently muted in this group.');
        }

        const isOwner = (targetGroup.ownerId === myUid || targetGroup.createdBy === myUid);
        const isAdmin = isOwner || (targetGroup.admins && targetGroup.admins.includes(myUid));

        if (!isAdmin) {
          const perms = targetGroup.permissions ? { ...DEFAULT_GROUP_PERMISSIONS, ...targetGroup.permissions } : DEFAULT_GROUP_PERMISSIONS;
          if (perms.onlyAdminsSend || perms.sendMessages === false) {
            throw new Error('Only group admins can send messages in this group.');
          }
          if (media) {
            if (perms.disableMediaSharing) {
              throw new Error('Media sharing is disabled in this group.');
            }
            const isGifOrSticker = Boolean(media.isGif || (media.name && media.name.toLowerCase().endsWith('.gif')));
            if (isGifOrSticker && perms.sendGifs === false) {
              throw new Error('Sending GIFs & stickers is disabled in this group.');
            }
            if (media.type === 'image' && perms.sendImages === false) {
              throw new Error('Sending images is disabled in this group.');
            }
            if (media.type === 'video' && perms.sendVideos === false) {
              throw new Error('Sending videos is disabled in this group.');
            }
            if (media.type === 'file' && perms.sendFiles === false) {
              throw new Error('Sending files is disabled in this group.');
            }
            if (media.type === 'audio' && perms.sendVoice === false) {
              throw new Error('Sending voice notes is disabled in this group.');
            }
          }
        }
      }
    }

    const chatId = getChatIdForContact(receiverId);
    const msgRef = collection(db, 'chats', chatId, 'messages');

    const isSelfChat = receiverId === authUser.uid;

    let finalMedia = media ? { ...media } : null;

    if (finalMedia && finalMedia.url) {
      // 1. Save media blob/data URL to IndexedDB for offline & instant video playback
      if (finalMedia.id) {
        saveMediaBlob(finalMedia.id, finalMedia.url).catch(() => {});
      }

      // 2. Compress image if payload is large
      if (finalMedia.type === 'image' && finalMedia.url.length > 400000) {
        try {
          const compressed = await compressImage(finalMedia.url, 1024, 450000);
          if (compressed) {
            finalMedia.url = compressed;
          }
        } catch (e) {
          console.warn('Failed to compress image payload:', e);
        }
      }

      // 3. Extract thumbnail for video if missing
      if (finalMedia.type === 'video' && !finalMedia.thumbnailUrl) {
        try {
          const meta = await extractVideoMetadata(finalMedia.url);
          if (meta && meta.thumbnailUrl) {
            finalMedia.thumbnailUrl = meta.thumbnailUrl;
          }
          if (meta && meta.durationStr && !finalMedia.duration) {
            finalMedia.duration = meta.durationStr;
          }
        } catch (e) {
          console.warn('Failed to extract video thumbnail:', e);
        }
      }
    }

    // Prepare media payload for Firestore (keep under 1MB Firestore document limit)
    let firestoreMedia = finalMedia ? { ...finalMedia } : null;
    if (firestoreMedia && firestoreMedia.url && firestoreMedia.url.length > 700000) {
      firestoreMedia.url = '';
    }

    try {
      const messageType = statusReply
        ? 'status_reply'
        : statusReaction
        ? 'status_reaction'
        : finalMedia
        ? finalMedia.type
        : 'text';

      await addDoc(msgRef, {
        senderId: authUser.uid,
        senderName: user.name || authUser?.displayName || 'You',
        senderAvatar: user.avatar || authUser.photoURL || '',
        receiverId,
        text: text || '',
        type: messageType,
        media: firestoreMedia,
        replyTo: replyTo || null,
        statusReply: statusReply || null,
        statusReaction: statusReaction || null,
        isForwarded: Boolean(isForwarded),
        seen: isSelfChat ? true : false,
        isRead: isSelfChat ? true : false,
        createdAt: serverTimestamp(),
      });
      setTypingStatus(receiverId, false).catch(() => {});
    } catch (err: any) {
      console.error('Error sending message to Firestore:', err);
      if (err?.message?.includes('exceeds the maximum allowed size') || err?.code === 'invalid-argument') {
        // Retry without heavy attachment
        await addDoc(msgRef, {
          senderId: authUser.uid,
          senderName: user.name || authUser?.displayName || 'You',
          senderAvatar: user.avatar || authUser.photoURL || '',
          receiverId,
          text: (text || '') + ' [Attachment exceeded cloud size limit]',
          type: 'text',
          media: null,
          replyTo: replyTo || null,
          statusReply: statusReply || null,
          statusReaction: statusReaction || null,
          isForwarded: Boolean(isForwarded),
          seen: isSelfChat ? true : false,
          isRead: isSelfChat ? true : false,
          createdAt: serverTimestamp(),
        });
        setTypingStatus(receiverId, false).catch(() => {});
      } else {
        throw err;
      }
    }

    // Update chat lastMessage, lastMessageTime, lastMessageSenderId
    const groupObj = groupContacts.find(g => g.id === receiverId);
    const participantsList = isGroupChat
      ? (groupObj?.members || [authUser.uid])
      : (isSelfChat ? [authUser.uid] : [authUser.uid, receiverId]);

    const lastMsgSummary = text || (finalMedia ? `[${finalMedia.type}]` : '');

    await setDoc(doc(db, 'chats', chatId), {
      participants: participantsList,
      lastMessage: lastMsgSummary,
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: authUser.uid,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    if (isGroupChat) {
      await updateDoc(doc(db, 'groups', receiverId), {
        lastMessage: lastMsgSummary,
        lastMessageTime: serverTimestamp(),
      }).catch(err => console.warn('Failed to update group lastMessage:', err));
    }
  };

  // Edit Message (Max 2 minute limit)
  const editMessage = async (contactId: string, msgId: string, newText: string) => {
    if (!authUser) return;
    const msg = messages[contactId]?.find(m => m.id === msgId);
    if (msg) {
      const msgTime = typeof msg.timestamp === 'number'
        ? msg.timestamp
        : (msg.createdAt?.toMillis ? msg.createdAt.toMillis() : (msg.createdAt?.seconds ? msg.createdAt.seconds * 1000 : Date.now()));
      if (Date.now() - msgTime > 2 * 60 * 1000) {
        console.warn('Cannot edit message: 2-minute time limit exceeded');
        return;
      }
    }
    const chatId = getChatIdForContact(contactId);
    await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
      text: newText,
      isEdited: true,
    });
  };

  // Delete Message (Delete for Me)
  const deleteMessage = async (contactId: string, msgId: string) => {
    if (!authUser) return;
    const chatId = getChatIdForContact(contactId);
    await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
      deletedFor: arrayUnion(authUser.uid)
    }).catch(async () => {
      // Fallback if doc update fails or schema issue
      await deleteDoc(doc(db, 'chats', chatId, 'messages', msgId)).catch(() => {});
    });
  };

  // Delete For Everyone
  const deleteForEveryone = async (contactId: string, msgId: string) => {
    if (!authUser) return;
    const chatId = getChatIdForContact(contactId);
    await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
      text: 'This message was deleted',
      media: null,
      callInfo: null,
      deletedForEveryone: true,
      isStarred: false,
    });
  };

  // Mark View Once Media as Opened
  const markViewOnceOpened = async (contactId: string, msgId: string) => {
    if (!authUser) return;
    const chatId = getChatIdForContact(contactId);
    try {
      const msgRef = doc(db, 'chats', chatId, 'messages', msgId);
      await updateDoc(msgRef, {
        opened: true,
        'media.opened': true,
        openedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Error marking view once opened:', err);
    }
  };

  // Set Custom Nickname
  const setCustomNickname = async (contactId: string, nickname: string) => {
    if (!authUser) return;
    const trimmed = nickname.trim().slice(0, 30);
    const docId = `${authUser.uid}_${contactId}`;

    if (!trimmed) {
      await deleteDoc(doc(db, 'customNicknames', docId)).catch(() => {});
    } else {
      await setDoc(doc(db, 'customNicknames', docId), {
        ownerUid: authUser.uid,
        contactUid: contactId,
        nickname: trimmed,
        updatedAt: serverTimestamp(),
      });
    }
  };

  // Clear Custom Nickname
  const clearCustomNickname = async (contactId: string) => {
    if (!authUser) return;
    const docId = `${authUser.uid}_${contactId}`;
    await deleteDoc(doc(db, 'customNicknames', docId)).catch(() => {});
  };

  // Helper display name
  const getContactDisplayName = (contactOrId: Contact | string | null | undefined): string => {
    if (!contactOrId) return '';
    if (typeof contactOrId === 'string') {
      if (customNicknames[contactOrId]) return customNicknames[contactOrId];
      const found = contacts.find(c => c.id === contactOrId);
      return found ? found.name : contactOrId;
    }
    if (customNicknames[contactOrId.id]) {
      return customNicknames[contactOrId.id];
    }
    return contactOrId.name;
  };

  // Helper check real-time online status
  const isUserOnline = (userId: string | null | undefined): boolean => {
    if (!userId) return false;
    if (authUser && (userId === authUser.uid || userId === user.id)) return true;

    const p = presenceMap[userId];
    if (!p || !p.isOnline) return false;

    const lastActiveDate = parseMessageDate(p.lastSeen);
    if (!lastActiveDate) return false;

    const diff = Date.now() - lastActiveDate.getTime();
    return diff >= 0 && diff < 20000;
  };

  // Cleanup Call Resources
  const cleanupCall = (finalStatus: CallStatus | 'cancelled' | 'busy' | 'rejected' | 'ended' | 'failed' | 'missed' = 'ended') => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (callDocUnsubRef.current) {
      callDocUnsubRef.current();
      callDocUnsubRef.current = null;
    }
    if (candidatesUnsubRef.current) {
      candidatesUnsubRef.current();
      candidatesUnsubRef.current = null;
    }

    const currentCall = activeCallRef.current;
    if (currentCall) {
      const mins = Math.floor(currentCall.durationSeconds / 60);
      const secs = currentCall.durationSeconds % 60;
      const durStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

      let resolvedStatus: CallStatus = 'completed';
      if (finalStatus === 'rejected') resolvedStatus = 'rejected';
      else if (finalStatus === 'cancelled') resolvedStatus = 'cancelled';
      else if (finalStatus === 'busy') resolvedStatus = 'busy';
      else if (finalStatus === 'failed') resolvedStatus = 'failed';
      else if (finalStatus === 'missed') resolvedStatus = 'missed';
      else if (currentCall.status !== 'connected') resolvedStatus = 'missed';

      const callerId = currentCall.direction === 'outgoing' ? user.id : currentCall.contactId;
      const receiverId = currentCall.direction === 'outgoing' ? currentCall.contactId : user.id;

      if (currentCall.id) {
        setDoc(doc(db, 'calls', currentCall.id), {
          callType: currentCall.type,
          type: currentCall.type,
          callerId,
          receiverId,
          status: resolvedStatus,
          duration: resolvedStatus === 'completed' ? durStr : '00:00',
          durationSeconds: currentCall.durationSeconds,
          endedAt: serverTimestamp(),
        }, { merge: true }).catch(err => console.warn('Error saving call doc status:', err));
      }

      const info: CallInfo = {
        id: currentCall.id,
        type: currentCall.type,
        callType: currentCall.type,
        direction: currentCall.direction,
        status: resolvedStatus,
        callerId,
        receiverId,
        duration: resolvedStatus === 'completed' ? durStr : undefined,
      };

      recordCallInChat(currentCall.contactId, info);
    }

    setActiveCall(null);
  };

  // Real-time listener for incoming Firestore calls
  useEffect(() => {
    if (!authUser || needsUsername) return;

    const incomingQuery = query(
      collection(db, 'calls'),
      where('receiverId', '==', authUser.uid),
      where('status', 'in', ['ringing', 'connecting', 'connected'])
    );

    const unsub = onSnapshot(incomingQuery, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const callId = docSnap.id;

        if (blockedContactIds.includes(data.callerId) || blockedByContactIds.includes(data.callerId)) {
          updateDoc(doc(db, 'calls', callId), { status: 'rejected' }).catch(() => {});
          return;
        }

        if (!isFriend(data.callerId)) {
          updateDoc(doc(db, 'calls', callId), { status: 'rejected' }).catch(() => {});
          return;
        }

        if (activeCallRef.current && activeCallRef.current.id !== callId) {
          if (data.status === 'ringing') {
            updateDoc(doc(db, 'calls', callId), { status: 'busy' }).catch(() => {});
          }
          return;
        }

        if (!activeCallRef.current && data.status === 'ringing') {
          setActiveCall({
            id: callId,
            contactId: data.callerId,
            type: data.type || 'voice',
            direction: 'incoming',
            status: 'incoming',
            durationSeconds: 0,
            isMuted: false,
            isVideoOff: false,
            isSpeakerOn: true,
            isFrontCamera: true,
            signalBars: 4,
            localStream: null,
            remoteStream: null,
            connectionQuality: 'excellent',
          });

          if (callDocUnsubRef.current) {
            callDocUnsubRef.current();
          }
          callDocUnsubRef.current = onSnapshot(doc(db, 'calls', callId), (snap) => {
            if (!snap.exists()) {
              cleanupCall('cancelled');
              return;
            }
            const cData = snap.data();
            if (cData.status === 'rejected' || cData.status === 'cancelled' || cData.status === 'ended' || cData.status === 'busy') {
              cleanupCall(cData.status);
            }
            if (cData.callerVideoOff !== undefined) {
              setActiveCall(prev => prev ? { ...prev, isRemoteVideoOff: !!cData.callerVideoOff } : null);
            }
          });
        } else if (activeCallRef.current && activeCallRef.current.id === callId) {
          if (data.status === 'rejected' || data.status === 'cancelled' || data.status === 'ended' || data.status === 'busy') {
            cleanupCall(data.status);
          }
        }
      });
    });

    return () => unsub();
  }, [authUser, needsUsername, blockedContactIds]);

  // Real-time listener for Call History from Firestore calls collection and messages
  useEffect(() => {
    if (!authUser || needsUsername) {
      setCallLogs([]);
      return;
    }

    const parseCallDoc = (docSnap: any): CallLog => {
      const data = docSnap.data();
      const isOutgoing = data.callerId === authUser.uid;
      const contactId = isOutgoing ? data.receiverId : data.callerId;

      let rawStatus: CallStatus = data.status || 'completed';
      if ((rawStatus as string) === 'ended' || (rawStatus as string) === 'connected') {
        rawStatus = 'completed';
      }

      const isMissed = rawStatus === 'missed' || rawStatus === 'rejected' || rawStatus === 'busy' || rawStatus === 'cancelled' || rawStatus === 'failed';

      let dur = data.duration || '00:00';
      if (!data.duration && data.durationSeconds) {
        const mins = Math.floor(data.durationSeconds / 60);
        const secs = data.durationSeconds % 60;
        dur = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
      }

      const callType = data.callType || data.type || 'voice';

      return {
        id: docSnap.id,
        contactId,
        type: callType,
        callType,
        direction: isOutgoing ? 'outgoing' : 'incoming',
        status: rawStatus,
        createdAt: data.createdAt || data.startedAt,
        startedAt: data.startedAt || data.createdAt,
        endedAt: data.endedAt,
        timestamp: (data.createdAt || data.startedAt)?.toDate ? (data.createdAt || data.startedAt).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        duration: rawStatus === 'completed' ? dur : '',
        isMissed,
        callerId: data.callerId || (isOutgoing ? authUser.uid : contactId),
        receiverId: data.receiverId || (isOutgoing ? contactId : authUser.uid),
      };
    };

    const getLocalDeletedCallIds = (): Set<string> => {
      try {
        const item = localStorage.getItem(`vault_deleted_calls_${authUser.uid}`);
        if (item) {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed)) return new Set(parsed);
        }
      } catch (e) {}
      return new Set();
    };

    let callerDocs: CallLog[] = [];
    let receiverDocs: CallLog[] = [];
    let deletedCallIds = getLocalDeletedCallIds();

    const updateCombinedCallLogs = () => {
      const logsMap = new Map<string, CallLog>();

      // 1. Add calls extracted from chat messages
      Object.entries(messages).forEach(([cId, msgList]) => {
        if (Array.isArray(msgList)) {
          msgList.forEach(m => {
            if ((m.type === 'voice_call' || m.type === 'video_call') && m.callInfo) {
              const info = m.callInfo;
              const isOutgoing = m.senderId === authUser.uid;
              const isMissed = info.status === 'missed' || info.status === 'rejected' || info.status === 'busy' || info.status === 'cancelled';
              const logKey = info.id || m.id;
              logsMap.set(logKey, {
                id: logKey,
                contactId: isOutgoing ? (m.receiverId || cId) : (m.senderId || cId),
                type: info.type,
                direction: isOutgoing ? 'outgoing' : 'incoming',
                status: info.status,
                createdAt: m.createdAt,
                timestamp: m.timestamp,
                duration: info.duration || '00:00',
                isMissed,
                callerId: info.callerId,
                receiverId: info.receiverId,
              });
            }
          });
        }
      });

      // 2. Add/override with direct Firestore calls collection docs
      [...callerDocs, ...receiverDocs].forEach(cLog => {
        if (cLog.status !== 'ringing' && cLog.status !== 'connecting') {
          logsMap.set(cLog.id, cLog);
        }
      });

      // Filter out deleted calls
      const currentDeleted = getLocalDeletedCallIds();
      deletedCallIds.forEach(id => currentDeleted.add(id));

      const filtered = Array.from(logsMap.values()).filter(log => {
        if (!log || !log.id) return false;
        if (currentDeleted.has(log.id)) return false;
        if (log.callerId && currentDeleted.has(log.callerId + '_' + log.id)) return false;
        return true;
      });

      // Sort by creation time descending
      const sorted = filtered.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

      // Secondary deduplication pass to ensure single calls are never shown twice
      const deduplicated: CallLog[] = [];
      sorted.forEach(log => {
        const timeMs = log.createdAt?.toMillis ? log.createdAt.toMillis() : (log.createdAt?.seconds ? log.createdAt.seconds * 1000 : 0);

        const isDuplicate = deduplicated.some(existing => {
          if (existing.id === log.id) return true;
          if (existing.contactId !== log.contactId) return false;
          if (existing.type !== log.type) return false;

          const existingTimeMs = existing.createdAt?.toMillis ? existing.createdAt.toMillis() : (existing.createdAt?.seconds ? existing.createdAt.seconds * 1000 : 0);

          if (timeMs > 0 && existingTimeMs > 0) {
            // Within 2 minutes (120,000ms) for same contact & call type
            return Math.abs(timeMs - existingTimeMs) < 120000;
          }

          // Fallback timestamp check
          return existing.timestamp && log.timestamp && existing.timestamp === log.timestamp;
        });

        if (!isDuplicate) {
          deduplicated.push(log);
        }
      });

      setCallLogs(deduplicated);
    };

    const unsubDeleted = onSnapshot(collection(db, 'users', authUser.uid, 'deletedCalls'), (snap) => {
      const remoteIds = snap.docs.map(d => d.id);
      const local = getLocalDeletedCallIds();
      remoteIds.forEach(id => local.add(id));
      deletedCallIds = local;
      try {
        localStorage.setItem(`vault_deleted_calls_${authUser.uid}`, JSON.stringify(Array.from(local)));
      } catch (e) {}
      updateCombinedCallLogs();
    }, (err) => {
      console.warn('Deleted calls snapshot warning:', err);
      updateCombinedCallLogs();
    });

    const callerQuery = query(
      collection(db, 'calls'),
      where('callerId', '==', authUser.uid)
    );

    const receiverQuery = query(
      collection(db, 'calls'),
      where('receiverId', '==', authUser.uid)
    );

    const unsubCaller = onSnapshot(callerQuery, (snap) => {
      callerDocs = snap.docs.map(parseCallDoc);
      updateCombinedCallLogs();
    }, (err) => handleFirestoreError('Caller calls snapshot error:', err, () => {}));

    const unsubReceiver = onSnapshot(receiverQuery, (snap) => {
      receiverDocs = snap.docs.map(parseCallDoc);
      updateCombinedCallLogs();
    }, (err) => handleFirestoreError('Receiver calls snapshot error:', err, () => {}));

    return () => {
      unsubDeleted();
      unsubCaller();
      unsubReceiver();
    };
  }, [authUser, needsUsername, messages]);

  // Calling logic with WebRTC and Firestore signaling
  const joinGroupCall = async (groupId: string, type: CallType = 'voice') => {
    if (!authUser) return;
    if (activeCallRef.current && activeCallRef.current.contactId === groupId && activeCallRef.current.status === 'connected') return;

    const targetGroup = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    if (targetGroup) {
      const myUid = authUser?.uid || user.id;
      const isOwner = targetGroup.ownerId === myUid || targetGroup.createdBy === myUid;
      const isAdmin = isOwner || (targetGroup.admins && targetGroup.admins.includes(myUid));
      if (!isAdmin) {
        const perms = targetGroup.permissions ? { ...DEFAULT_GROUP_PERMISSIONS, ...targetGroup.permissions } : DEFAULT_GROUP_PERMISSIONS;
        if (perms.startGroupCalls === false) {
          throw new Error('Group calls are disabled for regular members in this group.');
        }
      }
    }

    setCallPermissionError(null);
    let localStream: MediaStream | null = null;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: type === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });
      localStreamRef.current = localStream;
    } catch (err: any) {
      console.warn('getUserMedia error joining call:', err);
    }

    const myParticipant: GroupCallParticipant = {
      uid: authUser.uid,
      name: user.name || authUser.displayName || 'User',
      avatar: user.avatar || authUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      joinedAt: Date.now(),
      isMuted: false,
    };

    const groupDocRef = doc(db, 'groups', groupId);
    const gSnap = await getDoc(groupDocRef);
    if (gSnap.exists()) {
      const gData = gSnap.data();
      const currentCall = gData.activeCall;
      if (currentCall) {
        const existingParts: GroupCallParticipant[] = Array.isArray(currentCall.participants) ? currentCall.participants : [];
        const updatedParts = [...existingParts.filter(p => p.uid !== authUser.uid && p.uid !== user.id), myParticipant];

        await updateDoc(groupDocRef, {
          'activeCall.participants': updatedParts,
          'activeCall.status': 'active',
        }).catch(e => console.warn('Error joining group call:', e));

        if (currentCall.callId) {
          await updateDoc(doc(db, 'calls', currentCall.callId), {
            participants: updatedParts,
            status: 'active',
          }).catch(() => {});
        }

        await sendMessage(groupId, `📥 ${user.name || 'A member'} joined the group call`).catch(() => {});

        setActiveCall({
          id: currentCall.callId || 'group_call_' + groupId,
          contactId: groupId,
          type: currentCall.type || type,
          direction: 'incoming',
          status: 'connected',
          durationSeconds: 0,
          isMuted: false,
          isVideoOff: false,
          isSpeakerOn: true,
          isFrontCamera: true,
          signalBars: 4,
          localStream,
          remoteStream: null,
          connectionQuality: 'excellent',
          isGroupCall: true,
          participants: updatedParts,
        });
      }
    }
  };

  const startCall = async (contactId: string, type: CallType) => {
    if (!authUser) {
      return;
    }

    const isGroup = groupContacts.some(g => g.id === contactId) || contactId.startsWith('group_') || contacts.some(c => c.id === contactId && c.isGroup);

    if (isGroup) {
      const targetGroup = groupContacts.find(g => g.id === contactId) || contacts.find(c => c.id === contactId);
      if (targetGroup) {
        const myUid = authUser?.uid || user.id;
        const isOwner = targetGroup.ownerId === myUid || targetGroup.createdBy === myUid;
        const isAdmin = isOwner || (targetGroup.admins && targetGroup.admins.includes(myUid));
        if (!isAdmin) {
          const perms = targetGroup.permissions ? { ...DEFAULT_GROUP_PERMISSIONS, ...targetGroup.permissions } : DEFAULT_GROUP_PERMISSIONS;
          if (perms.startGroupCalls === false) {
            throw new Error('Group calls are disabled for regular members in this group.');
          }
        }
      }
    }

    if (!isGroup && authUser && contactId === authUser.uid) {
      throw new Error('You cannot start a call with yourself.');
    }

    if (!isGroup && (blockedContactIds.includes(contactId) || blockedByContactIds.includes(contactId))) {
      throw new Error('Cannot call blocked contact.');
    }

    if (!isGroup && !isFriend(contactId)) {
      throw new Error('Become friends to start a call.');
    }

    if (activeCallRef.current) {
      throw new Error('You are already in an active call.');
    }

    setCallPermissionError(null);

    let localStream: MediaStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === 'video' ? {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
      });
    } catch (err: any) {
      console.warn('getUserMedia error when starting call:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        const errMsg = `Microphone or camera permission was blocked. Please enable access in browser settings.`;
        setCallPermissionError(errMsg);
      } else if (err.name === 'NotFoundError') {
        setCallPermissionError('No microphone or camera device found.');
      } else {
        setCallPermissionError('Unable to access microphone or camera.');
      }
      return;
    }

    localStreamRef.current = localStream;

    const myParticipant: GroupCallParticipant = {
      uid: authUser.uid,
      name: user.name || authUser.displayName || 'User',
      avatar: user.avatar || authUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      joinedAt: Date.now(),
      isMuted: false,
    };

    if (isGroup) {
      const callDocRef = doc(collection(db, 'calls'));
      const callId = callDocRef.id;

      await setDoc(callDocRef, {
        callerId: authUser.uid,
        callerName: user.name || authUser.displayName || 'User',
        callerAvatar: user.avatar || authUser.photoURL || '',
        receiverId: contactId,
        groupId: contactId,
        type,
        status: 'active',
        isGroupCall: true,
        participants: [myParticipant],
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'groups', contactId), {
        activeCall: {
          callId,
          groupId: contactId,
          type,
          hostUid: authUser.uid,
          hostName: user.name || 'User',
          status: 'active',
          startedAt: Date.now(),
          participants: [myParticipant],
        }
      }).catch(err => console.warn('Error updating group activeCall:', err));

      await sendMessage(contactId, `📞 Started a group ${type} call`).catch(() => {});

      const initialCallState: ActiveCallState = {
        id: callId,
        contactId,
        type,
        direction: 'outgoing',
        status: 'connected',
        durationSeconds: 0,
        isMuted: false,
        isVideoOff: false,
        isSpeakerOn: true,
        isFrontCamera: true,
        signalBars: 4,
        localStream,
        remoteStream: null,
        connectionQuality: 'excellent',
        isGroupCall: true,
        participants: [myParticipant],
      };

      setActiveCall(initialCallState);
      return;
    }

    const callDocRef = doc(collection(db, 'calls'));
    const callId = callDocRef.id;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setActiveCall((prev) => prev ? { ...prev, remoteStream: event.streams[0] } : null);
      }
      if (event.track && event.track.kind === 'video') {
        event.track.onmute = () => {
          setActiveCall(prev => prev ? { ...prev, isRemoteVideoOff: true } : null);
        };
        event.track.onunmute = () => {
          setActiveCall(prev => prev ? { ...prev, isRemoteVideoOff: false } : null);
        };
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(collection(db, 'calls', callId, 'callerCandidates'), event.candidate.toJSON()).catch(() => {});
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        setActiveCall(prev => prev ? { ...prev, connectionQuality: 'excellent', signalBars: 4 } : null);
      } else if (state === 'disconnected') {
        setActiveCall(prev => prev ? { ...prev, connectionQuality: 'reconnecting', signalBars: 1 } : null);
      } else if (state === 'failed') {
        setActiveCall(prev => prev ? { ...prev, connectionQuality: 'poor', signalBars: 0 } : null);
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await setDoc(callDocRef, {
      callerId: authUser.uid,
      callerName: user.name,
      callerAvatar: user.avatar,
      receiverId: contactId,
      type,
      status: 'ringing',
      offer: { type: offer.type, sdp: offer.sdp },
      createdAt: serverTimestamp(),
    });

    const initialCallState: ActiveCallState = {
      id: callId,
      contactId,
      type,
      direction: 'outgoing',
      status: 'ringing',
      durationSeconds: 0,
      isMuted: false,
      isVideoOff: false,
      isSpeakerOn: true,
      isFrontCamera: true,
      signalBars: 4,
      localStream,
      remoteStream: null,
      connectionQuality: 'excellent',
    };

    setActiveCall(initialCallState);

    const initialCallInfo: CallInfo = {
      id: callId,
      type,
      callType: type,
      direction: 'outgoing',
      status: 'ringing',
      callerId: authUser.uid,
      receiverId: contactId,
    };
    recordCallInChat(contactId, initialCallInfo);

    callDocUnsubRef.current = onSnapshot(callDocRef, async (snap) => {
      if (!snap.exists()) {
        cleanupCall('cancelled');
        return;
      }
      const data = snap.data();
      if (data.status === 'rejected' || data.status === 'busy' || data.status === 'cancelled' || data.status === 'ended') {
        cleanupCall(data.status);
        return;
      }

      if (data.receiverVideoOff !== undefined) {
        setActiveCall(prev => prev ? { ...prev, isRemoteVideoOff: !!data.receiverVideoOff } : null);
      }

      if (data.answer && pc.signalingState !== 'stable' && !pc.currentRemoteDescription) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);

          candidatesUnsubRef.current = onSnapshot(collection(db, 'calls', callId, 'receiverCandidates'), (candidateSnap) => {
            candidateSnap.docChanges().forEach(async (change) => {
              if (change.type === 'added') {
                const candData = change.doc.data();
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(candData));
                } catch (e) {
                  console.warn('Error adding receiver ICE candidate:', e);
                }
              }
            });
          });
        } catch (err) {
          console.error('Error setting remote description:', err);
        }
      }
    });
  };

  const acceptCall = async () => {
    if (!activeCallRef.current || activeCallRef.current.direction !== 'incoming') return;
    const callId = activeCallRef.current.id;
    const callType = activeCallRef.current.type;

    setCallPermissionError(null);

    let localStream: MediaStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === 'video' ? {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
      });
    } catch (err: any) {
      console.warn('getUserMedia error when accepting call:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        const errMsg = `Microphone or camera permission was blocked. Please enable access in browser settings.`;
        setCallPermissionError(errMsg);
      } else {
        setCallPermissionError('Unable to access microphone or camera.');
      }
      await updateDoc(doc(db, 'calls', callId), { status: 'rejected' }).catch(() => {});
      cleanupCall('rejected');
      return;
    }

    localStreamRef.current = localStream;
    setActiveCall(prev => prev ? { ...prev, localStream, status: 'connecting' } : null);

    await updateDoc(doc(db, 'calls', callId), { status: 'connecting' }).catch(() => {});

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setActiveCall((prev) => prev ? { ...prev, remoteStream: event.streams[0] } : null);
      }
      if (event.track && event.track.kind === 'video') {
        event.track.onmute = () => {
          setActiveCall(prev => prev ? { ...prev, isRemoteVideoOff: true } : null);
        };
        event.track.onunmute = () => {
          setActiveCall(prev => prev ? { ...prev, isRemoteVideoOff: false } : null);
        };
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(collection(db, 'calls', callId, 'receiverCandidates'), event.candidate.toJSON()).catch(() => {});
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        setActiveCall(prev => prev ? { ...prev, connectionQuality: 'excellent', signalBars: 4 } : null);
      } else if (state === 'disconnected') {
        setActiveCall(prev => prev ? { ...prev, connectionQuality: 'reconnecting', signalBars: 1 } : null);
      } else if (state === 'failed') {
        setActiveCall(prev => prev ? { ...prev, connectionQuality: 'poor', signalBars: 0 } : null);
      }
    };

    const callSnap = await getDoc(doc(db, 'calls', callId));
    if (!callSnap.exists()) {
      cleanupCall('cancelled');
      return;
    }
    const callData = callSnap.data();
    if (!callData.offer) {
      cleanupCall('cancelled');
      return;
    }

    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await updateDoc(doc(db, 'calls', callId), {
      answer: { type: answer.type, sdp: answer.sdp },
      status: 'connected',
    });

    setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);

    candidatesUnsubRef.current = onSnapshot(collection(db, 'calls', callId, 'callerCandidates'), (candidateSnap) => {
      candidateSnap.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candData = change.doc.data();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candData));
          } catch (e) {
            console.warn('Error adding caller ICE candidate:', e);
          }
        }
      });
    });

    callDocUnsubRef.current = onSnapshot(doc(db, 'calls', callId), (snap) => {
      if (!snap.exists()) {
        cleanupCall('ended');
        return;
      }
      const data = snap.data();
      if (data.status === 'ended' || data.status === 'rejected' || data.status === 'cancelled') {
        cleanupCall(data.status);
      }
      if (data.callerVideoOff !== undefined) {
        setActiveCall(prev => prev ? { ...prev, isRemoteVideoOff: !!data.callerVideoOff } : null);
      }
    });
  };

  const recordCallInChat = async (contactId: string, callInfo: CallInfo) => {
    if (!authUser || !contactId) return;

    const chatId = [authUser.uid, contactId].sort().join('_');
    let textLabel = `${callInfo.type === 'video' ? '📹 Video Call' : '📞 Voice Call'}`;
    if (callInfo.status === 'missed') {
      textLabel = `❌ Missed ${callInfo.type === 'video' ? 'Video' : 'Voice'} Call`;
    } else if (callInfo.status === 'rejected') {
      textLabel = '❌ Rejected Call';
    } else if (callInfo.status === 'cancelled') {
      textLabel = '❌ Call Cancelled';
    } else if (callInfo.status === 'busy') {
      textLabel = '📞 Busy';
    } else if (callInfo.duration) {
      textLabel = `${callInfo.direction === 'outgoing' ? '📞 Outgoing' : '📞 Incoming'} ${callInfo.type === 'video' ? 'Video' : 'Voice'} Call (Duration: ${callInfo.duration})`;
    }

    const msgRef = collection(db, 'chats', chatId, 'messages');
    const senderId = callInfo.direction === 'outgoing' ? authUser.uid : contactId;
    const receiverId = callInfo.direction === 'outgoing' ? contactId : authUser.uid;
    const isSelfChat = contactId === authUser.uid;

    try {
      let existingDocId: string | null = null;
      if (callInfo.id) {
        const q = query(msgRef, where('callInfo.id', '==', callInfo.id));
        const snap = await getDocs(q);
        if (!snap.empty) {
          existingDocId = snap.docs[0].id;
        }
      }

      if (existingDocId) {
        await updateDoc(doc(db, 'chats', chatId, 'messages', existingDocId), {
          text: textLabel,
          callInfo,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(msgRef, {
          senderId,
          receiverId,
          text: textLabel,
          type: callInfo.type === 'video' ? 'video_call' : 'voice_call',
          callInfo,
          seen: isSelfChat ? true : false,
          isRead: isSelfChat ? true : false,
          createdAt: serverTimestamp(),
        });
      }

      await setDoc(doc(db, 'chats', chatId), {
        participants: [authUser.uid, contactId],
        lastMessage: textLabel,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: senderId,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Error recording call in chat:', err);
    }
  };

  const rejectCall = () => {
    if (!activeCallRef.current) return;
    const callId = activeCallRef.current.id;
    updateDoc(doc(db, 'calls', callId), { status: 'rejected' }).catch(() => {});
    cleanupCall('rejected');
  };

  const cancelCall = () => {
    if (!activeCallRef.current) return;
    const callId = activeCallRef.current.id;
    updateDoc(doc(db, 'calls', callId), { status: 'cancelled' }).catch(() => {});
    cleanupCall('cancelled');
  };

  const endCall = () => {
    if (!activeCallRef.current) return;
    const callId = activeCallRef.current.id;
    updateDoc(doc(db, 'calls', callId), { status: 'ended' }).catch(() => {});
    cleanupCall('ended');
  };

  const toggleMuteCall = () => {
    if (!activeCallRef.current) return;
    const newMuted = !activeCallRef.current.isMuted;
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
    }
    setActiveCall(prev => prev ? { ...prev, isMuted: newMuted } : null);
  };

  const toggleVideoCall = () => {
    if (!activeCallRef.current) return;
    const newVideoOff = !activeCallRef.current.isVideoOff;
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !newVideoOff;
      });
    }
    setActiveCall(prev => prev ? { ...prev, isVideoOff: newVideoOff } : null);

    const callId = activeCallRef.current.id;
    if (callId && authUser) {
      const isCaller = activeCallRef.current.callerId === authUser.uid || activeCallRef.current.direction === 'outgoing';
      updateDoc(doc(db, 'calls', callId), isCaller ? { callerVideoOff: newVideoOff } : { receiverVideoOff: newVideoOff }).catch(() => {});
    }
  };

  const toggleSpeakerCall = () => {
    if (!activeCallRef.current) return;
    setActiveCall(prev => prev ? { ...prev, isSpeakerOn: !prev.isSpeakerOn } : null);
  };

  const switchCameraCall = async () => {
    if (!activeCallRef.current || activeCallRef.current.type !== 'video' || !localStreamRef.current) return;
    const nextIsFront = !activeCallRef.current.isFrontCamera;
    const facingMode = nextIsFront ? 'user' : 'environment';

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
        localStreamRef.current.removeTrack(oldVideoTrack);
      }

      localStreamRef.current.addTrack(newVideoTrack);

      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }

      setActiveCall(prev => prev ? { ...prev, isFrontCamera: nextIsFront, localStream: localStreamRef.current } : null);
    } catch (err) {
      console.warn('Switch camera error:', err);
    }
  };

  const markCallsDeleted = (ids: string[]) => {
    if (!authUser || !ids.length) return;
    try {
      const key = `vault_deleted_calls_${authUser.uid}`;
      const raw = localStorage.getItem(key);
      const existing: string[] = raw ? JSON.parse(raw) : [];
      const updated = Array.from(new Set([...existing, ...ids]));
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {}
  };

  const deleteCallLog = async (callId: string) => {
    setCallLogs(prev => prev.filter(c => c.id !== callId));
    if (!authUser) return;
    markCallsDeleted([callId]);

    try {
      await deleteDoc(doc(db, 'calls', callId)).catch(() => {});
      await setDoc(doc(db, 'users', authUser.uid, 'deletedCalls', callId), { deletedAt: serverTimestamp() }).catch(() => {});
    } catch (e) {
      console.warn('Error deleting call log:', e);
    }
  };

  const deleteMultipleCallLogs = async (callIds: string[]) => {
    if (!callIds || !callIds.length) return;
    const setIds = new Set(callIds);
    setCallLogs(prev => prev.filter(c => !setIds.has(c.id)));
    if (!authUser) return;
    markCallsDeleted(callIds);

    try {
      const batch = writeBatch(db);
      callIds.forEach(cId => {
        batch.delete(doc(db, 'calls', cId));
        batch.set(doc(db, 'users', authUser.uid, 'deletedCalls', cId), { deletedAt: serverTimestamp() });
      });
      await batch.commit().catch(() => {});
    } catch (e) {
      console.warn('Error deleting multiple call logs:', e);
    }
  };

  const clearCallLogs = async () => {
    const allIds = callLogs.map(c => c.id);
    setCallLogs([]);
    if (!authUser) return;
    if (allIds.length > 0) {
      markCallsDeleted(allIds);
      try {
        const batch = writeBatch(db);
        allIds.forEach(cId => {
          batch.delete(doc(db, 'calls', cId));
          batch.set(doc(db, 'users', authUser.uid, 'deletedCalls', cId), { deletedAt: serverTimestamp() });
        });
        await batch.commit().catch(() => {});
      } catch (e) {
        console.warn('Error clearing call logs:', e);
      }
    }
  };

  const unlockVault = (code: string): boolean => {
    const activePasscode = settings.passcode || '1234';
    if (code === activePasscode) {
      setActiveTab('chats');
      setActiveContactId(null);
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const lockVault = () => {
    setIsUnlocked(false);
    setActiveContactId(null);
    setActiveTab('chats');
  };

  const setupLocalSession = (email: string, displayName: string) => {
    const username = email.split('@')[0]?.toLowerCase() || 'guest';
    const uid = 'demo_' + String(username).replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.random().toString(36).substring(2, 6);
    const mockUser: any = {
      uid,
      email: email || 'guest@calcchat.app',
      displayName: displayName || 'Demo User',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    setAuthUser(mockUser);
    setUser({
      id: uid,
      name: mockUser.displayName,
      username: username,
      avatar: mockUser.photoURL,
      status: 'Available on Secret Vault',
      isOnline: true,
      email: mockUser.email,
      providerId: 'demo',
      firebaseUid: uid,
    });
    setNeedsUsername(false);
    return mockUser;
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    if (firebaseAuth && googleProvider) {
      try {
        await signInWithPopup(firebaseAuth, googleProvider);
      } catch (error: any) {
        console.warn('Google Sign-In error:', error?.code || error?.message);
        if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain') || error?.code === 'auth/operation-not-allowed' || error?.message?.includes('operation-not-allowed')) {
          try {
            const anonRes = await signInAnonymously(firebaseAuth);
            if (anonRes.user) {
              await updateAuthProfile(anonRes.user, { displayName: 'Google User (Demo)' });
            }
            return;
          } catch (anonErr) {
            setupLocalSession('google.user@calcchat.app', 'Google User');
            return;
          }
        }
        setAuthError(error.message);
      }
    } else {
      setupLocalSession('google.user@calcchat.app', 'Google User');
    }
  };

  const signInAsGuest = async () => {
    setAuthError(null);
    if (!firebaseAuth) {
      setupLocalSession('guest@calcchat.app', 'Guest User');
      return;
    }
    try {
      await signInAnonymously(firebaseAuth);
    } catch (anonErr: any) {
      console.warn('Anonymous auth failed or disabled, trying demo email or local session fallback:', anonErr);
      const demoEmail = 'guest.demo@calcchat.app';
      const demoPass = 'DemoVault123!';
      try {
        await signInWithEmailAndPassword(firebaseAuth, demoEmail, demoPass);
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          try {
            const res = await createUserWithEmailAndPassword(firebaseAuth, demoEmail, demoPass);
            if (res.user) {
              await updateAuthProfile(res.user, { displayName: 'Guest User' });
            }
          } catch (createErr) {
            setupLocalSession('guest.demo@calcchat.app', 'Guest User');
          }
        } else {
          setupLocalSession('guest.demo@calcchat.app', 'Guest User');
        }
      }
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    if (!firebaseAuth) {
      setupLocalSession(email, email.split('@')[0] || 'Demo User');
      return;
    }
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, pass);
    } catch (error: any) {
      console.error('Email sign in failed:', error);
      if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('operation-not-allowed')) {
        console.warn('Firebase Email auth is disabled in console. Switching to Demo Local Session.');
        setupLocalSession(email, email.split('@')[0] || 'Demo User');
        return;
      }
      setAuthError(error.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    if (!firebaseAuth) {
      setupLocalSession(email, name || email.split('@')[0] || 'Demo User');
      return;
    }
    try {
      const res = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
      if (res.user) {
        await updateAuthProfile(res.user, { displayName: name });
      }
    } catch (error: any) {
      console.error('Email registration failed:', error);
      if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('operation-not-allowed')) {
        console.warn('Firebase Email auth is disabled in console. Switching to Demo Local Session.');
        setupLocalSession(email, name || email.split('@')[0] || 'Demo User');
        return;
      }
      setAuthError(error.message);
      throw error;
    }
  };

  const signOutGoogle = async () => {
    setAuthError(null);
    if (firebaseAuth) {
      try {
        await signOut(firebaseAuth);
        setAuthUser(null);
      } catch (error: any) {
        console.error('Sign out failed:', error);
        setAuthError(error.message);
      }
    }
  };

  const updateSettings = async (newSettings: Partial<VaultSettings>) => {
    let settingsToApply = { ...newSettings };
    if (settingsToApply.chatWallpaper && settingsToApply.chatWallpaper.startsWith('data:image/')) {
      try {
        const compressed = await compressImage(settingsToApply.chatWallpaper, 800, 200000);
        if (compressed) {
          settingsToApply.chatWallpaper = compressed;
        }
      } catch (err) {
        console.warn('Failed to compress chat wallpaper:', err);
      }
    }

    let updatedSettings: VaultSettings = DEFAULT_SETTINGS;
    setSettings(prev => {
      updatedSettings = { ...prev, ...settingsToApply };
      try {
        localStorage.setItem('secret_vault_settings', JSON.stringify(updatedSettings));
      } catch (e) {
        console.error('Error saving settings to localStorage:', e);
      }
      return updatedSettings;
    });

    if (authUser) {
      let safeSettings = { ...updatedSettings };
      if (safeSettings.chatWallpaper && safeSettings.chatWallpaper.length > 300000) {
        try {
          const recompressed = await compressImage(safeSettings.chatWallpaper, 600, 150000);
          if (recompressed) {
            safeSettings.chatWallpaper = recompressed;
          }
        } catch (_) {}
      }

      await updateDoc(doc(db, 'users', authUser.uid), {
        settings: safeSettings,
      }).catch(err => console.error('Failed to sync settings to Firestore:', err));
    }
  };

  const updateProfile = async (newProfile: Partial<UserProfile>) => {
    const updatedUser = { ...user, ...newProfile };
    setUser(updatedUser);

    try {
      localStorage.setItem('secret_vault_user_profile', JSON.stringify(updatedUser));
    } catch (_) {}

    // Synchronize contacts or allRegisteredUsers if self is listed
    if (newProfile.avatar) {
      setContacts(prev => prev.map(c => c.isSelf || c.id === user.id ? { ...c, avatar: newProfile.avatar! } : c));
      setAllRegisteredUsers(prev => prev.map(u => u.uid === user.id ? { ...u, photoURL: newProfile.avatar!, avatar: newProfile.avatar! } : u));
    }

    if (authUser) {
      const docUpdates: Record<string, any> = {};
      if (newProfile.name !== undefined) docUpdates.displayName = newProfile.name;
      if (newProfile.status !== undefined) docUpdates.status = newProfile.status;
      if (newProfile.username !== undefined) {
        docUpdates.username = newProfile.username;
        docUpdates.usernameLower = newProfile.username.toLowerCase();
      }
      if (newProfile.avatar !== undefined) {
        docUpdates.avatar = newProfile.avatar;
        docUpdates.photoURL = newProfile.avatar;
      }

      if (Object.keys(docUpdates).length > 0) {
        await updateDoc(doc(db, 'users', authUser.uid), docUpdates).catch(err => {
          console.warn('Failed to update user document in Firestore:', err);
        });
      }

      if (newProfile.avatar || newProfile.name) {
        await updateAuthProfile(authUser, {
          displayName: newProfile.name || authUser.displayName || undefined,
          photoURL: newProfile.avatar || authUser.photoURL || undefined,
        }).catch(() => {});
      }
    }
  };

  const addContact = () => {};

  const createGroup = (groupName: string, memberNamesOrIds: string[] = []): string => {
    if (!groupName.trim()) return '';

    const groupId = 'group_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const myUid = authUser?.uid || user.id;
    const myName = user.name || authUser?.displayName || 'You';
    const myUsername = user.username || '';

    const memberUidsSet = new Set<string>();
    if (myUid) memberUidsSet.add(myUid);
    if (user.id) memberUidsSet.add(user.id);
    if (myUsername) memberUidsSet.add(myUsername);
    if (user.name) memberUidsSet.add(user.name);

    const memberNamesSet = new Set<string>();
    if (myName) memberNamesSet.add(myName);

    // Build lookup array combining contacts & allRegisteredUsers & friendContacts
    const combinedList: Array<{ id: string; uid?: string; name?: string; username?: string; email?: string }> = [
      ...contacts.map(c => ({ id: c.id, uid: c.id, name: c.name, username: c.username, email: c.email })),
      ...friendContacts.map(c => ({ id: c.id, uid: c.id, name: c.name, username: c.username, email: c.email })),
      ...allRegisteredUsers.map(u => ({ id: u.uid || u.id, uid: u.uid || u.id, name: u.displayName || u.name, username: u.username, email: u.email }))
    ];

    memberNamesOrIds.forEach(item => {
      if (!item) return;
      const matched = combinedList.find(u => 
        u.id === item || 
        (u.uid && u.uid === item) ||
        (u.name && u.name.toLowerCase() === item.toLowerCase()) || 
        (u.username && u.username.toLowerCase() === item.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === item.toLowerCase())
      );

      if (matched) {
        if (matched.id) memberUidsSet.add(matched.id);
        if (matched.uid) memberUidsSet.add(matched.uid);
        if (matched.username) memberUidsSet.add(matched.username);
        if (matched.name) memberNamesSet.add(matched.name);
      } else {
        memberUidsSet.add(item);
        memberNamesSet.add(item);
      }
    });

    const memberUids = Array.from(memberUidsSet);
    const memberNames = Array.from(memberNamesSet);

    const avatar = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80';
    const statusStr = `${memberNames.length} members: ${memberNames.slice(0, 3).join(', ')}${memberNames.length > 3 ? '...' : ''}`;

    const newGroupContact: Contact = {
      id: groupId,
      name: groupName.trim(),
      avatar,
      status: statusStr,
      isOnline: true,
      lastSeen: 'Group',
      unreadCount: 0,
      isGroup: true,
      groupMembers: memberNames,
      members: memberUids,
      createdBy: myUid,
      admins: [myUid],
    };

    // Optimistically update groupContacts
    setGroupContacts(prev => [newGroupContact, ...prev.filter(g => g.id !== groupId)]);

    // Save group to Firestore with exact required schema fields
    if (authUser) {
      setDoc(doc(db, 'groups', groupId), {
        groupId: groupId,
        groupName: groupName.trim(),
        groupPhoto: avatar,
        createdBy: myUid,
        createdAt: serverTimestamp(),
        members: memberUids,
        admins: [myUid],
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        id: groupId,
        name: groupName.trim(),
        avatar: avatar,
        memberUids: memberUids,
        memberNames: memberNames,
        isGroup: true,
        status: statusStr,
        activeCall: null,
      }).catch(err => console.error('Error saving group to Firestore:', err));

      // Asynchronously resolve custom username/email inputs against Firestore users collection
      (async () => {
        try {
          let updatedNeeded = false;
          const freshMemberUids = new Set(memberUids);
          const freshMemberNames = new Set(memberNames);

          for (const item of memberNamesOrIds) {
            if (!item) continue;
            const usersRef = collection(db, 'users');
            const [q1, q2] = await Promise.all([
              getDocs(query(usersRef, where('username', '==', item))),
              getDocs(query(usersRef, where('displayName', '==', item))),
            ]);
            [...q1.docs, ...q2.docs].forEach(uDoc => {
              if (uDoc.exists()) {
                const uData = uDoc.data();
                freshMemberUids.add(uDoc.id);
                if (uData.username) freshMemberUids.add(uData.username);
                if (uData.displayName) freshMemberNames.add(uData.displayName);
                updatedNeeded = true;
              }
            });
          }

          if (updatedNeeded) {
            await updateDoc(doc(db, 'groups', groupId), {
              members: Array.from(freshMemberUids),
              memberUids: Array.from(freshMemberUids),
              memberNames: Array.from(freshMemberNames),
            });
          }
        } catch (e) {
          console.warn('Async resolve users for group error:', e);
        }
      })();
    }

    return groupId;
  };

  const sendGroupSystemMessage = async (
    groupId: string,
    systemAction: any,
    systemText: string
  ) => {
    if (!groupId) return;
    try {
      const myUid = authUser?.uid || user.id || 'system';
      const myName = user.name || authUser?.displayName || 'Admin';

      const activityLogItem: GroupActivityLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: String(systemAction).toUpperCase(),
        actorId: myUid,
        actorName: myName,
        details: systemText,
        timestamp: new Date().toISOString(),
      };

      setGroupContacts(prev => prev.map(g => {
        if (g.id === groupId) {
          const logs = g.activityLogs || [];
          return { ...g, activityLogs: [activityLogItem, ...logs] };
        }
        return g;
      }));

      if (db) {
        const msgRef = collection(db, 'chats', groupId, 'messages');
        await addDoc(msgRef, {
          senderId: myUid,
          senderName: myName,
          receiverId: groupId,
          text: systemText,
          type: 'system',
          systemAction: systemAction,
          systemText: systemText,
          createdAt: serverTimestamp(),
        }).catch(() => {});

        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef).catch(() => null);
        if (groupSnap?.exists()) {
          const existingLogs = Array.isArray(groupSnap.data().activityLogs) ? groupSnap.data().activityLogs : [];
          await updateDoc(groupRef, {
            activityLogs: [activityLogItem, ...existingLogs].slice(0, 100),
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error sending group system message:', err);
    }
  };

  const addMembersToGroup = async (groupId: string, newMemberInputs: string[]): Promise<void> => {
    if (!groupId || newMemberInputs.length === 0) return;

    try {
      const myUid = authUser?.uid || user.id;
      const actorName = user.name || authUser?.displayName || 'Admin';

      // Find current target group from local groupContacts or contacts
      const targetGroup = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
      if (targetGroup) {
        const isOwner = targetGroup.ownerId === myUid || targetGroup.createdBy === myUid;
        const isAdmin = isOwner || (targetGroup.admins && targetGroup.admins.includes(myUid));
        if (!isAdmin) {
          const perms = targetGroup.permissions ? { ...DEFAULT_GROUP_PERMISSIONS, ...targetGroup.permissions } : DEFAULT_GROUP_PERMISSIONS;
          if (perms.addMembers === false) {
            throw new Error('Adding new members is disabled in this group.');
          }
        }
      }
      const existingMembers = targetGroup?.members || [];
      const existingNames = targetGroup?.groupMembers || [];

      const memberUidsSet = new Set<string>(existingMembers);
      const memberNamesSet = new Set<string>(existingNames);

      const combinedList: Array<{ id: string; uid?: string; name?: string; username?: string; email?: string }> = [
        ...contacts.map(c => ({ id: c.id, uid: c.id, name: c.name, username: c.username, email: c.email })),
        ...friendContacts.map(c => ({ id: c.id, uid: c.id, name: c.name, username: c.username, email: c.email })),
        ...allRegisteredUsers.map(u => ({ id: u.uid || u.id, uid: u.uid || u.id, name: u.displayName || u.name, username: u.username, email: u.email }))
      ];

      const newlyAddedDisplayNames: string[] = [];

      for (const item of newMemberInputs) {
        if (!item) continue;
        const matched = combinedList.find(u => 
          u.id === item || 
          (u.uid && u.uid === item) ||
          (u.name && u.name.toLowerCase() === item.toLowerCase()) || 
          (u.username && u.username.toLowerCase() === item.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === item.toLowerCase())
        );

        if (matched) {
          if (matched.id) memberUidsSet.add(matched.id);
          if (matched.uid) memberUidsSet.add(matched.uid);
          if (matched.username) memberUidsSet.add(matched.username);
          if (matched.name) {
            memberNamesSet.add(matched.name);
            newlyAddedDisplayNames.push(matched.name);
          }
        } else {
          memberUidsSet.add(item);
          memberNamesSet.add(item);
          newlyAddedDisplayNames.push(item);
        }
      }

      const updatedUids = Array.from(memberUidsSet);
      const updatedNames = Array.from(memberNamesSet);
      const statusStr = `${updatedNames.length} members: ${updatedNames.slice(0, 3).join(', ')}${updatedNames.length > 3 ? '...' : ''}`;

      // Optimistically update groupContacts & contacts
      setGroupContacts(prev => prev.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            members: updatedUids,
            groupMembers: updatedNames,
            status: statusStr,
          };
        }
        return g;
      }));

      setContacts(prev => prev.map(c => {
        if (c.id === groupId || (c as any).groupId === groupId) {
          return {
            ...c,
            members: updatedUids,
            groupMembers: updatedNames,
            status: statusStr,
          };
        }
        return c;
      }));

      if (db && authUser) {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          members: updatedUids,
          memberUids: updatedUids,
          memberNames: updatedNames,
          status: statusStr,
        }).catch(async () => {
          await setDoc(groupRef, {
            members: updatedUids,
            memberUids: updatedUids,
            memberNames: updatedNames,
            status: statusStr,
          }, { merge: true }).catch(err => console.error('Error updating group members in Firestore:', err));
        });
      }

      // WhatsApp-style system message
      if (newlyAddedDisplayNames.length > 0) {
        const sysMsgText = `🟢 ${actorName} added ${newlyAddedDisplayNames.join(', ')}`;
        await sendGroupSystemMessage(groupId, 'member_added', sysMsgText);
      }
    } catch (err) {
      console.error('Failed to add members to group:', err);
    }
  };

  const removeMemberFromGroup = async (groupId: string, memberIdOrName: string) => {
    if (!groupId || !memberIdOrName) return;
    const actorName = user.name || authUser?.displayName || 'Admin';

    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    if (!group) return;

    const myUid = authUser?.uid || user.id || '';
    const isOwner = group.ownerId === myUid || group.createdBy === myUid || (group.createdBy && group.createdBy.includes(myUid));
    if (!isOwner) {
      console.warn('Only the Group Creator can remove members from the group.');
      return;
    }

    const memberList = getGroupMembersList(group, allRegisteredUsers, contacts, user);
    const resolvedTarget = memberList.find(
      m => m.id === memberIdOrName || m.name.toLowerCase().includes(memberIdOrName.toLowerCase())
    );

    const targetName = resolvedTarget ? resolvedTarget.name.replace(/\s*\(You\)$/, '') : memberIdOrName;
    const targetId = resolvedTarget ? resolvedTarget.id : memberIdOrName;

    const existingMembers = group.members || [];
    const existingNames = group.groupMembers || [];
    const existingAdmins = group.admins || [];

    const updatedUids = existingMembers.filter(id => id !== targetId && id !== targetName);
    const updatedNames = existingNames.filter(n => n.toLowerCase() !== targetName.toLowerCase());
    const updatedAdmins = existingAdmins.filter(a => a !== targetId && a !== targetName);
    const statusStr = `${updatedNames.length} members: ${updatedNames.slice(0, 3).join(', ')}${updatedNames.length > 3 ? '...' : ''}`;

    setGroupContacts(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          members: updatedUids,
          groupMembers: updatedNames,
          admins: updatedAdmins,
          status: statusStr,
        };
      }
      return g;
    }));

    if (db && authUser) {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        members: updatedUids,
        memberUids: updatedUids,
        memberNames: updatedNames,
        admins: updatedAdmins,
        status: statusStr,
      }).catch(err => console.error('Error removing group member in Firestore:', err));
    }

    // WhatsApp-style system message
    const sysMsgText = `🔴 ${actorName} removed ${targetName}`;
    await sendGroupSystemMessage(groupId, 'member_removed', sysMsgText);
  };

  const leaveGroup = async (groupId: string) => {
    if (!groupId) return;
    const myUid = authUser?.uid || user.id;
    const actorName = user.name || authUser?.displayName || 'Member';

    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);

    if (group) {
      const existingMembers = group.members || [];
      const existingNames = group.groupMembers || [];
      const existingAdmins = group.admins || [];

      const updatedUids = existingMembers.filter(id => id !== myUid && id !== actorName);
      const updatedNames = existingNames.filter(n => n.toLowerCase() !== actorName.toLowerCase() && !n.includes('(You)'));
      const updatedAdmins = existingAdmins.filter(a => a !== myUid);
      const statusStr = `${updatedNames.length} members: ${updatedNames.slice(0, 3).join(', ')}${updatedNames.length > 3 ? '...' : ''}`;

      setGroupContacts(prev => prev.filter(g => g.id !== groupId));

      if (db && authUser) {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          members: updatedUids,
          memberUids: updatedUids,
          memberNames: updatedNames,
          admins: updatedAdmins,
          status: statusStr,
        }).catch(err => console.error('Error updating group leave in Firestore:', err));
      }
    }

    // WhatsApp-style system message
    const sysMsgText = `🚪 ${actorName} left the group.`;
    await sendGroupSystemMessage(groupId, 'member_left', sysMsgText);

    if (activeContactId === groupId) {
      setActiveContactId(null);
    }
  };

  const toggleGroupAdmin = async (groupId: string, memberIdOrName: string) => {
    if (!groupId || !memberIdOrName) return;
    const actorName = user.name || authUser?.displayName || 'Admin';

    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    if (!group) return;

    const memberList = getGroupMembersList(group, allRegisteredUsers, contacts, user);
    const resolvedTarget = memberList.find(
      m => m.id === memberIdOrName || m.name.toLowerCase().includes(memberIdOrName.toLowerCase())
    );

    const targetName = resolvedTarget ? resolvedTarget.name.replace(/\s*\(You\)$/, '') : memberIdOrName;
    const targetId = resolvedTarget ? resolvedTarget.id : memberIdOrName;

    const currentAdmins = group.admins || [];
    const isAlreadyAdmin = currentAdmins.includes(targetId) || currentAdmins.includes(targetName);

    let updatedAdmins: string[];
    let sysMsgText: string;
    let actionType: 'admin_added' | 'admin_removed';

    if (isAlreadyAdmin) {
      updatedAdmins = currentAdmins.filter(a => a !== targetId && a !== targetName);
      sysMsgText = `👑 ${actorName} removed ${targetName} as an admin.`;
      actionType = 'admin_removed';
    } else {
      updatedAdmins = [...currentAdmins, targetId];
      sysMsgText = `👑 ${actorName} made ${targetName} an admin.`;
      actionType = 'admin_added';
    }

    setGroupContacts(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          admins: updatedAdmins,
        };
      }
      return g;
    }));

    if (db && authUser) {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        admins: updatedAdmins,
      }).catch(err => console.error('Error toggling admin in Firestore:', err));
    }

    await sendGroupSystemMessage(groupId, actionType, sysMsgText);
  };

  const updateGroupDetails = async (groupId: string, updates: { name?: string; avatar?: string; wallpaper?: string; description?: string }) => {
    if (!groupId) return;
    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    const myUid = authUser?.uid || user.id;

    const isOwner = group?.ownerId === myUid || group?.createdBy === myUid;
    const isAdmin = isOwner || (group?.admins && group.admins.includes(myUid));
    const canEdit = isOwner || isAdmin || group?.permissions?.editGroupInfo !== false;

    if (!canEdit) {
      throw new Error('You do not have permission to edit group details.');
    }

    const firestoreUpdates: Record<string, any> = {};
    const actorName = user.name || authUser?.displayName || 'Admin';

    if (updates.name !== undefined && updates.name.trim() && updates.name.trim() !== (group?.name || '')) {
      const newName = updates.name.trim();
      firestoreUpdates.name = newName;
      firestoreUpdates.groupName = newName;
      const sysMsgText = `✏️ ${actorName} changed the group name to "${newName}".`;
      sendGroupSystemMessage(groupId, 'group_name_changed', sysMsgText).catch(() => {});
    }

    if (updates.avatar !== undefined && updates.avatar !== (group?.avatar || '')) {
      firestoreUpdates.avatar = updates.avatar;
      firestoreUpdates.groupPhoto = updates.avatar;
      const sysMsgText = `🖼️ ${actorName} changed the group photo.`;
      sendGroupSystemMessage(groupId, 'group_photo_changed', sysMsgText).catch(() => {});
    }

    if (updates.wallpaper !== undefined) {
      firestoreUpdates.wallpaper = updates.wallpaper;
    }

    if (updates.description !== undefined && updates.description !== (group?.description || group?.about || '')) {
      firestoreUpdates.description = updates.description.trim();
      firestoreUpdates.about = updates.description.trim();
      firestoreUpdates.bio = updates.description.trim();
      const sysMsgText = `📝 ${actorName} updated the group description.`;
      sendGroupSystemMessage(groupId, 'description_changed', sysMsgText).catch(() => {});
    }

    if (Object.keys(firestoreUpdates).length === 0) return;

    setGroupContacts(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        ...(updates.name ? { name: updates.name.trim() } : {}),
        ...(updates.avatar ? { avatar: updates.avatar } : {}),
        ...(updates.wallpaper ? { wallpaper: updates.wallpaper } : {}),
        ...(updates.description ? { description: updates.description.trim(), about: updates.description.trim() } : {}),
      };
    }));

    if (authUser && db) {
      await updateDoc(doc(db, 'groups', groupId), firestoreUpdates).catch(err => {
        console.error('Failed to update group in Firestore:', err);
      });
    }
  };

  const updateGroupPermissions = async (groupId: string, newPerms: Partial<GroupPermissions>) => {
    if (!groupId) return;
    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    const myUid = authUser?.uid || user.id;

    const isOwner = group?.ownerId === myUid || group?.createdBy === myUid;

    if (!isOwner) {
      throw new Error('Only the Group Creator can update group permissions.');
    }

    const currentPerms: GroupPermissions = group?.permissions || {
      sendMessages: true,
      sendImages: true,
      sendVideos: true,
      sendFiles: true,
      sendVoice: true,
      sendGifs: true,
      editGroupInfo: true,
      addMembers: true,
      shareInviteLink: true,
      startGroupCalls: true,
      onlyAdminsSend: false,
      disableMediaSharing: false,
    };

    const updatedPermissions = { ...currentPerms, ...newPerms };
    const actorName = user.name || authUser?.displayName || 'Admin';

    setGroupContacts(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, permissions: updatedPermissions };
      }
      return g;
    }));

    if (authUser && db) {
      await updateDoc(doc(db, 'groups', groupId), { permissions: updatedPermissions }).catch(err => {
        console.error('Failed to update group permissions:', err);
      });
    }

    const sysMsgText = `⚙️ ${actorName} updated group permission settings.`;
    await sendGroupSystemMessage(groupId, 'permissions_updated', sysMsgText);
  };

  const transferGroupOwnership = async (groupId: string, newOwnerId: string) => {
    if (!groupId || !newOwnerId) return;
    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    const myUid = authUser?.uid || user.id;

    const isOwner = group?.ownerId === myUid || group?.createdBy === myUid;
    if (!isOwner) {
      throw new Error('Only the current Group Owner can transfer ownership.');
    }

    const memberList = getGroupMembersList(group, allRegisteredUsers, contacts, user);
    const targetMember = memberList.find(m => m.id === newOwnerId || m.name.toLowerCase().includes(newOwnerId.toLowerCase()));
    if (!targetMember) throw new Error('Target member not found in group.');

    const targetId = targetMember.id;
    const targetName = targetMember.name.replace(/\s*\(You\)$/, '');
    const actorName = user.name || authUser?.displayName || 'Owner';

    const currentAdmins = group?.admins || [];
    const updatedAdmins = Array.from(new Set([...currentAdmins, myUid, targetId]));

    setGroupContacts(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          ownerId: targetId,
          createdBy: targetId,
          admins: updatedAdmins,
        };
      }
      return g;
    }));

    if (authUser && db) {
      await updateDoc(doc(db, 'groups', groupId), {
        ownerId: targetId,
        createdBy: targetId,
        admins: updatedAdmins,
      }).catch(err => console.error('Failed to transfer group ownership in Firestore:', err));
    }

    const sysMsgText = `👑 ${actorName} transferred group ownership to ${targetName}.`;
    await sendGroupSystemMessage(groupId, 'ownership_transferred', sysMsgText);
  };

  const toggleGroupMuteMember = async (groupId: string, memberIdOrName: string) => {
    if (!groupId || !memberIdOrName) return;
    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    const myUid = authUser?.uid || user.id;

    const isOwner = group?.ownerId === myUid || group?.createdBy === myUid;
    const isAdmin = isOwner || (group?.admins && group.admins.includes(myUid));
    if (!isAdmin) throw new Error('Only admins can mute or unmute members.');

    const memberList = getGroupMembersList(group, allRegisteredUsers, contacts, user);
    const targetMember = memberList.find(m => m.id === memberIdOrName || m.name.toLowerCase().includes(memberIdOrName.toLowerCase()));
    if (!targetMember) return;

    const targetId = targetMember.id;
    const targetName = targetMember.name.replace(/\s*\(You\)$/, '');
    const actorName = user.name || authUser?.displayName || 'Admin';

    const currentMuted = group?.mutedMembers || [];
    const isMuted = currentMuted.includes(targetId) || currentMuted.includes(targetName);

    let updatedMuted: string[];
    let sysMsgText: string;

    if (isMuted) {
      updatedMuted = currentMuted.filter(m => m !== targetId && m !== targetName);
      sysMsgText = `🔊 ${actorName} unmuted ${targetName}.`;
    } else {
      updatedMuted = [...currentMuted, targetId];
      sysMsgText = `🔇 ${actorName} muted ${targetName}.`;
    }

    setGroupContacts(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, mutedMembers: updatedMuted };
      }
      return g;
    }));

    if (authUser && db) {
      await updateDoc(doc(db, 'groups', groupId), { mutedMembers: updatedMuted }).catch(() => {});
    }

    await sendGroupSystemMessage(groupId, isMuted ? 'member_unmuted' : 'member_muted', sysMsgText);
  };

  const toggleGroupBanMember = async (groupId: string, memberIdOrName: string) => {
    if (!groupId || !memberIdOrName) return;
    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    const myUid = authUser?.uid || user.id;

    const isOwner = group?.ownerId === myUid || group?.createdBy === myUid;
    const isAdmin = isOwner || (group?.admins && group.admins.includes(myUid));
    if (!isAdmin) throw new Error('Only admins can ban or unban members.');

    const memberList = getGroupMembersList(group, allRegisteredUsers, contacts, user);
    const targetMember = memberList.find(m => m.id === memberIdOrName || m.name.toLowerCase().includes(memberIdOrName.toLowerCase()));

    const targetId = targetMember ? targetMember.id : memberIdOrName;
    const targetName = targetMember ? targetMember.name.replace(/\s*\(You\)$/, '') : memberIdOrName;
    const actorName = user.name || authUser?.displayName || 'Admin';

    const currentBanned = group?.bannedMembers || [];
    const isBanned = currentBanned.includes(targetId) || currentBanned.includes(targetName);

    let updatedBanned: string[];
    let sysMsgText: string;

    if (isBanned) {
      updatedBanned = currentBanned.filter(b => b !== targetId && b !== targetName);
      sysMsgText = `✅ ${actorName} unbanned ${targetName}.`;
    } else {
      updatedBanned = [...currentBanned, targetId];
      sysMsgText = `🚫 ${actorName} banned ${targetName} from the group.`;

      const existingMembers = group?.members || [];
      const existingNames = group?.groupMembers || [];
      const existingAdmins = group?.admins || [];

      const updatedUids = existingMembers.filter(id => id !== targetId && id !== targetName);
      const updatedNames = existingNames.filter(n => n.toLowerCase() !== targetName.toLowerCase());
      const updatedAdmins = existingAdmins.filter(a => a !== targetId && a !== targetName);

      setGroupContacts(prev => prev.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            members: updatedUids,
            groupMembers: updatedNames,
            admins: updatedAdmins,
            bannedMembers: updatedBanned,
          };
        }
        return g;
      }));

      if (authUser && db) {
        await updateDoc(doc(db, 'groups', groupId), {
          members: updatedUids,
          memberUids: updatedUids,
          memberNames: updatedNames,
          admins: updatedAdmins,
          bannedMembers: updatedBanned,
        }).catch(() => {});
      }
      await sendGroupSystemMessage(groupId, 'member_banned', sysMsgText);
      return;
    }

    setGroupContacts(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, bannedMembers: updatedBanned };
      }
      return g;
    }));

    if (authUser && db) {
      await updateDoc(doc(db, 'groups', groupId), { bannedMembers: updatedBanned }).catch(() => {});
    }

    await sendGroupSystemMessage(groupId, 'member_unbanned', sysMsgText);
  };

  const approveJoinRequest = async (groupId: string, userId: string) => {
    if (!groupId || !userId) return;
    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    const actorName = user.name || authUser?.displayName || 'Admin';

    const currentRequests = group?.joinRequests || [];
    const targetReq = currentRequests.find(r => r.userId === userId || r.id === userId);
    const targetName = targetReq?.userName || userId;

    const updatedRequests = currentRequests.filter(r => r.userId !== userId && r.id !== userId);

    const existingMembers = group?.members || [];
    const existingNames = group?.groupMembers || [];

    const updatedUids = Array.from(new Set([...existingMembers, userId]));
    const updatedNames = Array.from(new Set([...existingNames, targetName]));

    setGroupContacts(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          members: updatedUids,
          groupMembers: updatedNames,
          joinRequests: updatedRequests,
        };
      }
      return g;
    }));

    if (authUser && db) {
      await updateDoc(doc(db, 'groups', groupId), {
        members: updatedUids,
        memberUids: updatedUids,
        memberNames: updatedNames,
        joinRequests: updatedRequests,
      }).catch(() => {});
    }

    const sysMsgText = `🟢 ${actorName} approved join request for ${targetName}.`;
    await sendGroupSystemMessage(groupId, 'join_request_approved', sysMsgText);
  };

  const rejectJoinRequest = async (groupId: string, userId: string) => {
    if (!groupId || !userId) return;
    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    const currentRequests = group?.joinRequests || [];
    const updatedRequests = currentRequests.filter(r => r.userId !== userId && r.id !== userId);

    setGroupContacts(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, joinRequests: updatedRequests };
      }
      return g;
    }));

    if (authUser && db) {
      await updateDoc(doc(db, 'groups', groupId), { joinRequests: updatedRequests }).catch(() => {});
    }
  };

  const requestToJoinGroup = async (groupId: string) => {
    if (!groupId || !authUser) return;
    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    const myUid = authUser.uid;
    const myName = user.name || authUser.displayName || 'User';

    const reqObj: GroupJoinRequest = {
      id: `req_${myUid}_${Date.now()}`,
      userId: myUid,
      userName: myName,
      userAvatar: user.avatar || authUser.photoURL || '',
      requestedAt: new Date().toISOString(),
    };

    const existingRequests = group?.joinRequests || [];
    if (existingRequests.some(r => r.userId === myUid)) return;

    const updatedRequests = [...existingRequests, reqObj];

    setGroupContacts(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, joinRequests: updatedRequests };
      }
      return g;
    }));

    if (db) {
      await updateDoc(doc(db, 'groups', groupId), { joinRequests: updatedRequests }).catch(() => {});
    }
  };

  const regenerateGroupInviteLink = async (groupId: string): Promise<string> => {
    const newCode = `https://vault.chat/join/g_${groupId}_${Math.random().toString(36).substring(2, 9)}`;
    const actorName = user.name || authUser?.displayName || 'Admin';

    setGroupContacts(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, inviteLink: newCode, inviteLinkDisabled: false };
      }
      return g;
    }));

    if (authUser && db) {
      await updateDoc(doc(db, 'groups', groupId), { inviteLink: newCode, inviteLinkDisabled: false }).catch(() => {});
    }

    const sysMsgText = `🔗 ${actorName} regenerated the group invite link.`;
    await sendGroupSystemMessage(groupId, 'invite_link_regenerated', sysMsgText);
    return newCode;
  };

  const toggleGroupInviteLinkDisabled = async (groupId: string) => {
    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    const nextDisabled = !group?.inviteLinkDisabled;
    const actorName = user.name || authUser?.displayName || 'Admin';

    setGroupContacts(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, inviteLinkDisabled: nextDisabled };
      }
      return g;
    }));

    if (authUser && db) {
      await updateDoc(doc(db, 'groups', groupId), { inviteLinkDisabled: nextDisabled }).catch(() => {});
    }

    const sysMsgText = `🔗 ${actorName} ${nextDisabled ? 'disabled' : 'enabled'} group invite links.`;
    await sendGroupSystemMessage(groupId, 'invite_link_toggled', sysMsgText);
  };

  const updateGroupDescription = async (groupId: string, description: string) => {
    await updateGroupDetails(groupId, { description });
  };

  const updateGroupPrivacy = async (groupId: string, isPublic: boolean, joinApprovalRequired: boolean) => {
    const actorName = user.name || authUser?.displayName || 'Admin';

    setGroupContacts(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, isPublic, joinApprovalRequired };
      }
      return g;
    }));

    if (authUser && db) {
      await updateDoc(doc(db, 'groups', groupId), { isPublic, joinApprovalRequired }).catch(() => {});
    }

    const sysMsgText = `🔒 ${actorName} changed group to ${isPublic ? 'Public' : 'Private'} (Join Approval: ${joinApprovalRequired ? 'Required' : 'Disabled'}).`;
    await sendGroupSystemMessage(groupId, 'privacy_changed', sysMsgText);
  };

  const deleteGroupMessageForEveryone = async (groupId: string, msgId: string) => {
    if (!authUser || !groupId || !msgId) return;
    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    const myUid = authUser.uid;
    const actorName = user.name || authUser.displayName || 'Admin';

    const isOwner = group?.ownerId === myUid || group?.createdBy === myUid;
    const isAdmin = isOwner || (group?.admins && group.admins.includes(myUid));

    const chatId = getChatIdForContact(groupId);
    const msgRef = doc(db, 'chats', chatId, 'messages', msgId);

    const msgSnap = await getDoc(msgRef).catch(() => null);
    const msgData = msgSnap?.data();
    const origText = msgData?.text || 'Media Message';
    const senderName = msgData?.senderName || 'Member';
    const senderId = msgData?.senderId || 'unknown';

    if (!isAdmin && senderId !== myUid) {
      throw new Error('Only admins can delete messages from other members.');
    }

    await updateDoc(msgRef, {
      text: 'This message was deleted by an admin',
      media: null,
      callInfo: null,
      deletedForEveryone: true,
      isStarred: false,
      deletedBy: actorName,
    }).catch(() => {});

    if (isAdmin && senderId !== myUid) {
      const logEntry = {
        id: `del_${Date.now()}`,
        messageId: msgId,
        senderName,
        senderId,
        deletedByName: actorName,
        deletedById: myUid,
        originalText: origText,
        timestamp: new Date().toISOString(),
      };

      const existingLogs = group?.deletedMessageLogs || [];
      const updatedLogs = [logEntry, ...existingLogs];

      setGroupContacts(prev => prev.map(g => g.id === groupId ? { ...g, deletedMessageLogs: updatedLogs } : g));
      if (db) {
        await updateDoc(doc(db, 'groups', groupId), { deletedMessageLogs: updatedLogs }).catch(() => {});
      }
    }
  };

  const clearGroupChatHistoryForEveryone = async (groupId: string) => {
    if (!authUser || !groupId) return;
    const group = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    const myUid = authUser.uid;

    const isOwner = group?.ownerId === myUid || group?.createdBy === myUid;
    const isAdmin = isOwner || (group?.admins && group.admins.includes(myUid));
    if (!isAdmin) throw new Error('Only admins can clear group chat history.');

    const chatId = getChatIdForContact(groupId);
    const msgsSnap = await getDocs(collection(db, 'chats', chatId, 'messages')).catch(() => null);
    if (msgsSnap) {
      const batch = writeBatch(db);
      msgsSnap.docs.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit().catch(() => {});
    }

    const actorName = user.name || authUser.displayName || 'Admin';
    await sendGroupSystemMessage(groupId, 'chat_cleared', `🧹 ${actorName} cleared the group chat history.`);
  };

  const deleteGroup = async (groupId: string) => {
    if (!groupId) return;
    const group = groupContacts.find(g => g.id === groupId);
    const myUid = authUser?.uid || user.id;

    const isOwner = !group?.ownerId || group?.ownerId === myUid || group?.createdBy === myUid;

    if (!isOwner) {
      throw new Error('Only the Group Creator can delete this group permanently.');
    }

    // Optimistically remove group from local state
    setGroupContacts(prev => prev.filter(g => g.id !== groupId));
    setMessages(prev => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    if (activeContactId === groupId) {
      setActiveContactId(null);
    }

    if (authUser && db) {
      // 1. Delete main group doc
      await deleteDoc(doc(db, 'groups', groupId)).catch(err => {
        console.error('Failed to delete group from Firestore:', err);
      });

      // 2. Delete chat doc
      await deleteDoc(doc(db, 'chats', groupId)).catch(() => {});

      // 3. Delete messages in subcollections
      try {
        const msgsSnap = await getDocs(collection(db, 'chats', groupId, 'messages')).catch(() => null);
        if (msgsSnap && !msgsSnap.empty) {
          const batchPromises = msgsSnap.docs.map(mDoc => deleteDoc(mDoc.ref));
          await Promise.all(batchPromises).catch(() => {});
        }
        const groupMsgsSnap = await getDocs(collection(db, 'groups', groupId, 'messages')).catch(() => null);
        if (groupMsgsSnap && !groupMsgsSnap.empty) {
          const batchPromises = groupMsgsSnap.docs.map(mDoc => deleteDoc(mDoc.ref));
          await Promise.all(batchPromises).catch(() => {});
        }
      } catch (err) {
        console.error('Error cleaning up group messages in Firestore:', err);
      }
    }
  };

  const clearChatHistory = async (contactId: string) => {
    if (!authUser || !contactId) return;
    const chatId = getChatIdForContact(contactId);
    const msgs = messages[contactId] || [];
    for (const m of msgs) {
      await updateDoc(doc(db, 'chats', chatId, 'messages', m.id), {
        deletedFor: arrayUnion(authUser.uid)
      }).catch(() => {});
    }
  };

  const clearAllChatHistory = () => {};
  const togglePinContact = (contactId: string) => {
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isPinned: !c.isPinned } : c));
  };
  const toggleArchiveContact = (contactId: string) => {
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isArchived: !c.isArchived } : c));
  };
  const toggleLockContact = (contactId: string) => {
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isLocked: !c.isLocked } : c));
  };
  const toggleFavoriteContact = (contactId: string) => {
    setFavoriteContactIds(prev => {
      const updated = prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId];
      try {
        localStorage.setItem('calcchat_favorite_contacts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c));
  };
  const toggleMuteContact = (contactId: string) => {
    setMutedContactIds(prev => {
      const updated = prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId];
      try {
        localStorage.setItem('calcchat_muted_contacts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isMuted: !c.isMuted } : c));
  };
  const unlockChatLock = (contactId: string) => {
    setUnlockedLocks(prev => ({ ...prev, [contactId]: true }));
  };
  const blockContact = async (contactId: string) => {
    if (!contactId) return;
    setBlockedContactIds(prev => prev.includes(contactId) ? prev : [...prev, contactId]);
    if (activeContactId === contactId) {
      setActiveContactId(null);
    }
    if (authUser) {
      const ref = doc(db, 'users', authUser.uid, 'blockedContacts', contactId);
      await setDoc(ref, {
        blockedUid: contactId,
        blockedAt: serverTimestamp(),
      }, { merge: true }).catch(err => console.error('Error blocking contact in Firestore:', err));
    }
  };
  const unblockContact = async (contactId: string) => {
    if (!contactId) return;
    setBlockedContactIds(prev => prev.filter(id => id !== contactId));
    if (authUser) {
      const ref = doc(db, 'users', authUser.uid, 'blockedContacts', contactId);
      await deleteDoc(ref).catch(err => console.error('Error unblocking contact in Firestore:', err));
    }
  };
  const toggleStarMessage = async (contactId: string, msgId: string) => {
    if (!authUser) return;
    const chatId = getChatIdForContact(contactId);
    const msg = (messages[contactId] || []).find(m => m.id === msgId);
    if (!msg) return;
    await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
      isStarred: !msg.isStarred
    }).catch(err => console.warn('Failed to star message:', err));
  };

  const togglePinMessage = async (contactId: string, msgId: string) => {
    if (!authUser) return;
    const chatId = getChatIdForContact(contactId);
    const msgList = messages[contactId] || [];
    const targetMsg = msgList.find(m => m.id === msgId);
    if (!targetMsg) return;

    const isCurrentlyPinned = targetMsg.isPinned;

    if (isCurrentlyPinned) {
      await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
        isPinned: false
      }).catch(err => console.warn('Failed to unpin message:', err));
    } else {
      // Unpin any existing pinned message first (ONLY ONE pinned message per chat)
      const currentlyPinned = msgList.filter(m => m.isPinned);
      for (const oldPin of currentlyPinned) {
        await updateDoc(doc(db, 'chats', chatId, 'messages', oldPin.id), {
          isPinned: false
        }).catch(() => {});
      }
      await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
        isPinned: true
      }).catch(err => console.warn('Failed to pin message:', err));
    }
  };

  const addReactionMessage = async (contactId: string, msgId: string, emoji: string) => {
    if (!authUser) return;
    const chatId = getChatIdForContact(contactId);
    const msg = (messages[contactId] || []).find(m => m.id === msgId);
    if (!msg) return;

    const existingReaction = msg.reactions?.[authUser.uid];
    const msgRef = doc(db, 'chats', chatId, 'messages', msgId);

    if (existingReaction === emoji) {
      await updateDoc(msgRef, {
        [`reactions.${authUser.uid}`]: deleteField()
      }).catch(err => console.warn('Failed to remove reaction:', err));
    } else {
      await updateDoc(msgRef, {
        [`reactions.${authUser.uid}`]: emoji
      }).catch(err => console.warn('Failed to add reaction:', err));
    }
  };

  const removeReactionMessage = async (contactId: string, msgId: string) => {
    if (!authUser) return;
    const chatId = getChatIdForContact(contactId);
    const msgRef = doc(db, 'chats', chatId, 'messages', msgId);
    await updateDoc(msgRef, {
      [`reactions.${authUser.uid}`]: deleteField()
    }).catch(err => console.warn('Failed to remove reaction:', err));
  };

  const deleteMultipleMessages = async (contactId: string, msgIds: string[], deleteForEveryoneFlag: boolean = false) => {
    if (!authUser || !msgIds || msgIds.length === 0) return;
    for (const msgId of msgIds) {
      if (deleteForEveryoneFlag) {
        await deleteForEveryone(contactId, msgId).catch(() => {});
      } else {
        await deleteMessage(contactId, msgId).catch(() => {});
      }
    }
  };

  const forwardMessage = async (msg: Message, targetContactIds: string[]) => {
    if (!authUser || !msg || !targetContactIds || targetContactIds.length === 0) return;
    for (const targetId of targetContactIds) {
      try {
        await sendMessage(targetId, msg.text || '', msg.media || undefined, undefined, undefined, undefined, true);
      } catch (err) {
        console.warn(`Error forwarding message to ${targetId}:`, err);
      }
    }
  };

  const contactsWithUnreadAndTyping = contacts.map(c => {
    const cMsgs = messages[c.id] || [];
    const unreadCount = c.isSelf
      ? 0
      : cMsgs.filter(m => m.senderId === c.id && m.receiverId === authUser?.uid && (!m.seen || !m.isRead)).length;
    const isTyping = Boolean(typingStatusMap[c.id]);
    return {
      ...c,
      unreadCount,
      isTyping,
    };
  });

  const computedUnreadTotal = contactsWithUnreadAndTyping.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <VaultContext.Provider value={{
      isUnlocked,
      user,
      settings,
      contacts: contactsWithUnreadAndTyping,
      groupContacts,
      friendUids,
      unreadTotal: computedUnreadTotal,
      unseenStatusCount,
      missedCallCount,
      clearMissedCallsBadge,
      messages,
      callLogs,
      activeCall,
      callPermissionError,
      clearCallPermissionError,
      activeContactId,
      activeTab,
      unlockedLocks,
      blockedContactIds,
      blockedByContactIds,
      customNicknames,
      authUser,
      authReady,
      authError,
      isFirebaseConfigured,
      needsUsername,
      pendingFriendRequests,
      sentFriendRequests,
      allRegisteredUsers,
      statusUpdates,
      statusSeenRecordsMap,
      statusLikeRecordsMap,
      completeUsernameSetup,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      unfriendContact,
      isFriend,
      searchFirebaseUsers,
      postStatusUpdate,
      deleteStatusUpdate,
      likeStatusUpdate,
      markStatusAsSeen,
      replyToStatus,
      reactToStatus,
      getSeenRecords,
      getLikeRecords,
      unlockVault,
      lockVault,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signInAsGuest,
      signOutGoogle,
      setActiveContactId,
      setActiveTab,
      sendMessage,
      editMessage,
      deleteMessage,
      deleteForEveryone,
      markViewOnceOpened,
      toggleStarMessage,
      togglePinMessage,
      forwardMessage,
      addReactionMessage,
      removeReactionMessage,
      deleteMultipleMessages,
      typingStatusMap,
      setTypingStatus,
      markMessagesAsRead,
      setCustomNickname,
      clearCustomNickname,
      getContactDisplayName,
      isUserOnline,
      startCall,
      acceptCall,
      rejectCall,
      cancelCall,
      endCall,
      toggleMuteCall,
      toggleVideoCall,
      toggleSpeakerCall,
      switchCameraCall,
      deleteCallLog,
      deleteMultipleCallLogs,
      clearCallLogs,
      updateSettings,
      updateProfile,
      addContact,
      createGroup,
      addMembersToGroup,
      removeMemberFromGroup,
      leaveGroup,
      toggleGroupAdmin,
      sendGroupSystemMessage,
      joinGroupCall,
      updateGroupDetails,
      updateGroupPermissions,
      transferGroupOwnership,
      toggleGroupMuteMember,
      toggleGroupBanMember,
      approveJoinRequest,
      rejectJoinRequest,
      requestToJoinGroup,
      regenerateGroupInviteLink,
      toggleGroupInviteLinkDisabled,
      updateGroupDescription,
      updateGroupPrivacy,
      deleteGroupMessageForEveryone,
      clearGroupChatHistoryForEveryone,
      deleteGroup,
      clearChatHistory,
      clearAllChatHistory,
      togglePinContact,
      toggleLockContact,
      toggleArchiveContact,
      toggleFavoriteContact,
      toggleMuteContact,
      unlockChatLock,
      blockContact,
      unblockContact,
      adminWallpapers,
      addAdminWallpaper,
      deleteAdminWallpaper,
    }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const ctx = useContext(VaultContext);
  return ctx || fallbackVaultContext;
};
