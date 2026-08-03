import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, signInWithPopup, signOut, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, updateProfile as updateAuthProfile,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, orderBy, serverTimestamp, 
  addDoc, getDocs, writeBatch, arrayUnion, runTransaction
} from 'firebase/firestore';
import { 
  CallInfo, CallLog, CallType, CallDirection, CallStatus, Contact, MediaAttachment, Message, 
  UserProfile, VaultSettings, FriendRequest, FriendStatus, StatusUpdate 
} from '../types';
import { DEFAULT_SETTINGS, DEFAULT_USER } from '../data/initialData';
import { isFirebaseConfigured, firebaseAuth, googleProvider, db } from '../lib/firebase';
import { compressImage } from '../lib/mediaCompressor';
import { playMessageArrivalSound } from '../lib/soundUtils';

export interface ActiveCallState {
  id: string;
  contactId: string;
  type: CallType;
  direction: CallDirection;
  status: 'ringing' | 'incoming' | 'connecting' | 'connected' | 'ended' | 'rejected' | 'busy' | 'cancelled';
  durationSeconds: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isFrontCamera: boolean;
  signalBars: number;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  connectionQuality?: 'excellent' | 'good' | 'poor' | 'reconnecting';
}

interface VaultContextType {
  isUnlocked: boolean;
  user: UserProfile;
  settings: VaultSettings;
  contacts: Contact[];
  friendUids: string[];
  unreadTotal: number;
  messages: Record<string, Message[]>;
  callLogs: CallLog[];
  activeCall: ActiveCallState | null;
  callPermissionError: string | null;
  clearCallPermissionError: () => void;
  activeContactId: string | null;
  activeTab: 'chats' | 'gallery' | 'profile' | 'settings' | 'calls';
  unlockedLocks: Record<string, boolean>;
  blockedContactIds: string[];
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
  postStatusUpdate: (text?: string, mediaUrl?: string, mediaType?: 'image' | 'video') => Promise<void>;
  unlockVault: (code: string) => boolean;
  lockVault: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOutGoogle: () => Promise<void>;
  setActiveContactId: (id: string | null) => void;
  setActiveTab: (tab: 'chats' | 'gallery' | 'profile' | 'settings' | 'calls') => void;
  sendMessage: (receiverId: string, text: string, media?: MediaAttachment, replyTo?: Message['replyTo']) => Promise<void>;
  editMessage: (contactId: string, msgId: string, newText: string) => Promise<void>;
  deleteMessage: (contactId: string, msgId: string) => Promise<void>;
  deleteForEveryone: (contactId: string, msgId: string) => Promise<void>;
  toggleStarMessage: (contactId: string, msgId: string) => void;
  togglePinMessage: (contactId: string, msgId: string) => void;
  forwardMessage: (msg: Message, targetContactIds: string[]) => void;
  typingStatusMap?: Record<string, boolean>;
  setTypingStatus: (contactId: string, isTyping: boolean) => Promise<void>;
  markMessagesAsRead: (contactId: string) => Promise<void>;
  setCustomNickname: (contactId: string, nickname: string) => Promise<void>;
  clearCustomNickname: (contactId: string) => Promise<void>;
  getContactDisplayName: (contactOrId: Contact | string | null | undefined) => string;
  startCall: (contactId: string, type: CallType) => Promise<void>;
  acceptCall: () => void;
  rejectCall: () => void;
  cancelCall: () => void;
  endCall: () => void;
  toggleMuteCall: () => void;
  toggleVideoCall: () => void;
  toggleSpeakerCall: () => void;
  switchCameraCall: () => void;
  clearCallLogs: () => void;
  updateSettings: (newSettings: Partial<VaultSettings>) => void;
  updateProfile: (newProfile: Partial<UserProfile>) => Promise<void>;
  addContact: (name: string, status: string, isAi: boolean) => void;
  createGroup: (groupName: string, memberNames: string[]) => string;
  clearChatHistory: (contactId: string) => void;
  clearAllChatHistory: () => void;
  togglePinContact: (contactId: string) => void;
  toggleLockContact: (contactId: string) => void;
  toggleArchiveContact: (contactId: string) => void;
  unlockChatLock: (contactId: string) => void;
  blockContact: (contactId: string) => void;
  unblockContact: (contactId: string) => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const fallbackVaultContext: VaultContextType = {
  isUnlocked: false,
  user: DEFAULT_USER,
  settings: DEFAULT_SETTINGS,
  contacts: [],
  friendUids: [],
  unreadTotal: 0,
  messages: {},
  callLogs: [],
  activeCall: null,
  callPermissionError: null,
  clearCallPermissionError: () => {},
  activeContactId: null,
  activeTab: 'chats',
  unlockedLocks: {},
  blockedContactIds: [],
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
  toggleStarMessage: () => {},
  togglePinMessage: () => {},
  forwardMessage: () => {},
  typingStatusMap: {},
  setTypingStatus: async () => {},
  markMessagesAsRead: async () => {},
  setCustomNickname: async () => {},
  clearCustomNickname: async () => {},
  getContactDisplayName: () => 'User',
  startCall: async () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  cancelCall: () => {},
  endCall: () => {},
  toggleMuteCall: () => {},
  toggleVideoCall: () => {},
  toggleSpeakerCall: () => {},
  switchCameraCall: () => {},
  clearCallLogs: () => {},
  updateSettings: () => {},
  updateProfile: async () => {},
  addContact: () => {},
  createGroup: () => '',
  clearChatHistory: () => {},
  clearAllChatHistory: () => {},
  togglePinContact: () => {},
  toggleLockContact: () => {},
  toggleArchiveContact: () => {},
  unlockChatLock: () => {},
  blockContact: () => {},
  unblockContact: () => {},
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
  const [friendUids, setFriendUids] = useState<string[]>([]);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<FriendRequest[]>([]);
  const [sentFriendRequests, setSentFriendRequests] = useState<FriendRequest[]>([]);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [callPermissionError, setCallPermissionError] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [blockedContactIds, setBlockedContactIds] = useState<string[]>([]);
  const [customNicknames, setCustomNicknames] = useState<Record<string, string>>({});

  const unreadTotal = contacts.reduce((total, contact) => total + (contact.unreadCount || 0), 0);

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
      const photoURL = fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

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
            avatar: uData.photoURL || fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
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
        setContacts([selfContact]);
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
              isOnline: Boolean(data.online),
              lastSeen: data.lastSeen || 'Offline',
              unreadCount: 0,
            });
          }
        }
        setContacts(fetchedContacts);
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

  // Real-time listener for Messages with Confirmed Friends & Self Chat
  useEffect(() => {
    if (!authUser || needsUsername) {
      setMessages({});
      return;
    }

    const unsubs: Array<() => void> = [];
    const chatPartnerUids = Array.from(new Set([authUser.uid, ...friendUids]));

    chatPartnerUids.forEach(friendId => {
      const chatId = [authUser.uid, friendId].sort().join('_');
      const msgQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      const unsub = onSnapshot(msgQuery, (snapshot) => {
        // Play sound for new incoming message if not initial load
        if (!snapshot.metadata.hasPendingWrites) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (data.senderId && data.senderId !== authUser.uid) {
                playMessageArrivalSound(data.senderId);
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
              receiverId: data.receiverId,
              text: data.text || '',
              timestamp: timeStr,
              createdAt: data.createdAt,
              type: data.type || 'text',
              callInfo: data.callInfo,
              media: data.media,
              isSent: true,
              isDelivered: true,
              isRead: isRead,
              seen: seen,
              isStarred: Boolean(data.isStarred),
              isPinned: Boolean(data.isPinned),
              isEdited: Boolean(data.isEdited),
              replyTo: data.replyTo,
              deletedForEveryone: Boolean(data.deletedForEveryone),
              deletedFor: deletedForArr,
            };
          })
          .filter((m): m is Message => m !== null);

        setMessages(prev => ({
          ...prev,
          [friendId]: msgsList
        }));
        }, (err) => handleFirestoreError(`Messages snapshot error for chatId: ${chatId}`, err, () => {
          setMessages(prev => ({
            ...prev,
            [friendId]: prev[friendId] || []
          }));
        }));

      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach(u => u());
    };
  }, [authUser, needsUsername, friendUids]);

  // Real-time listener for typing status of friends
  const [typingStatusMap, setTypingStatusMap] = useState<Record<string, boolean>>({});

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
    if (!authUser || !contactId) return;
    const chatId = [authUser.uid, contactId].sort().join('_');
    const typingRef = doc(db, 'users', authUser.uid, 'typing', chatId);
    try {
      await setDoc(typingRef, {
        isTyping: Boolean(isTyping),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Failed to update typing status:', e);
    }
  };

  const markMessagesAsRead = async (contactId: string) => {
    if (!authUser || !contactId) return;
    const chatId = [authUser.uid, contactId].sort().join('_');
    const chatMsgs = messages[contactId] || [];
    const unseenMsgs = chatMsgs.filter(m => m.senderId === contactId && m.receiverId === authUser.uid && (!m.seen || !m.isRead));

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

  // Real-time listener for Friend Status Updates
  useEffect(() => {
    if (!authUser || needsUsername) return;

    const statusQuery = query(
      collection(db, 'status'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(statusQuery, (snapshot) => {
      const allowedUids = new Set([authUser.uid, ...friendUids]);
      const list: StatusUpdate[] = [];

      snapshot.docs.forEach(d => {
        const data = d.data();
        if (allowedUids.has(data.userId)) {
          list.push({
            id: d.id,
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
            text: data.text,
            mediaUrl: data.mediaUrl,
            mediaType: data.mediaType,
            createdAt: data.createdAt,
            expiresAt: data.expiresAt,
            likes: data.likes || [],
            repliesCount: data.repliesCount || 0,
          });
        }
      });

      setStatusUpdates(list);
    }, (err) => handleFirestoreError('Status snapshot error:', err, () => setStatusUpdates([])));

    return () => unsub();
  }, [authUser, needsUsername, friendUids]);

  // Check if contactId is in friends list
  const isFriend = (contactId: string): boolean => {
    if (authUser && contactId === authUser.uid) return true;
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
    if (!authUser) return;

    const friendshipId = [authUser.uid, contactId].sort().join('_');
    await deleteDoc(doc(db, 'friends', friendshipId)).catch(() => {});
  };

  // Post Status Update
  const postStatusUpdate = async (text?: string, mediaUrl?: string, mediaType?: 'image' | 'video') => {
    if (!authUser) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 Hours

    await addDoc(collection(db, 'status'), {
      userId: authUser.uid,
      userName: user.name,
      userAvatar: user.avatar,
      text: text || '',
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || 'image',
      createdAt: serverTimestamp(),
      expiresAt,
      likes: [],
      repliesCount: 0,
    });
  };

  // Send Message in Firestore
  const sendMessage = async (receiverId: string, text: string, media?: MediaAttachment, replyTo?: Message['replyTo']) => {
    if (!authUser || !isFriend(receiverId)) {
      throw new Error('You must become friends before you can chat.');
    }

    const chatId = [authUser.uid, receiverId].sort().join('_');
    const msgRef = collection(db, 'chats', chatId, 'messages');

    const isSelfChat = receiverId === authUser.uid;

    let finalMedia = media ? { ...media } : null;

    if (finalMedia && finalMedia.url) {
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
      // Safety guard: if dataUrl length still exceeds 700,000 chars (~500KB)
      if (finalMedia.url.length > 700000) {
        finalMedia.url = '';
        finalMedia.name = `${finalMedia.name} (File exceeds 500KB size limit)`;
      }
    }

    try {
      await addDoc(msgRef, {
        senderId: authUser.uid,
        receiverId,
        text: text || '',
        type: finalMedia ? finalMedia.type : 'text',
        media: finalMedia,
        replyTo: replyTo || null,
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
          receiverId,
          text: (text || '') + ' [Attachment exceeded cloud size limit]',
          type: 'text',
          media: null,
          replyTo: replyTo || null,
          seen: isSelfChat ? true : false,
          isRead: isSelfChat ? true : false,
          createdAt: serverTimestamp(),
        });
        setTypingStatus(receiverId, false).catch(() => {});
      } else {
        throw err;
      }
    }

    // Update chat lastMessage
    await setDoc(doc(db, 'chats', chatId), {
      participants: isSelfChat ? [authUser.uid] : [authUser.uid, receiverId],
      lastMessage: text || (finalMedia ? `[${finalMedia.type}]` : ''),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  };

  // Edit Message
  const editMessage = async (contactId: string, msgId: string, newText: string) => {
    if (!authUser) return;
    const chatId = [authUser.uid, contactId].sort().join('_');
    await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
      text: newText,
      isEdited: true,
    });
  };

  // Delete Message (Delete for Me)
  const deleteMessage = async (contactId: string, msgId: string) => {
    if (!authUser) return;
    const chatId = [authUser.uid, contactId].sort().join('_');
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
    const chatId = [authUser.uid, contactId].sort().join('_');
    await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
      text: 'This message was deleted',
      media: null,
      callInfo: null,
      deletedForEveryone: true,
      isStarred: false,
    });
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

  // Cleanup Call Resources
  const cleanupCall = (finalStatus: CallStatus | 'cancelled' | 'busy' | 'rejected' | 'ended' = 'ended') => {
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

      let resolvedStatus: CallStatus = 'ended';
      if (finalStatus === 'rejected') resolvedStatus = 'rejected';
      else if (finalStatus === 'cancelled') resolvedStatus = 'cancelled';
      else if (finalStatus === 'busy') resolvedStatus = 'busy';
      else if (currentCall.status !== 'connected') resolvedStatus = 'missed';

      const info: CallInfo = {
        id: currentCall.id,
        type: currentCall.type,
        direction: currentCall.direction,
        status: resolvedStatus,
        callerId: currentCall.direction === 'outgoing' ? user.id : currentCall.contactId,
        receiverId: currentCall.direction === 'outgoing' ? currentCall.contactId : user.id,
        duration: durStr,
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

        if (blockedContactIds.includes(data.callerId)) {
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
        } else if (activeCallRef.current && activeCallRef.current.id === callId) {
          if (data.status === 'rejected' || data.status === 'cancelled' || data.status === 'ended' || data.status === 'busy') {
            cleanupCall(data.status);
          }
        }
      });
    });

    return () => unsub();
  }, [authUser, needsUsername, blockedContactIds]);

  // Extract call logs from chat history automatically
  useEffect(() => {
    const logsMap = new Map<string, CallLog>();
    Object.entries(messages).forEach(([contactId, msgList]) => {
      if (Array.isArray(msgList)) {
        msgList.forEach(m => {
        if ((m.type === 'voice_call' || m.type === 'video_call') && m.callInfo) {
          const info = m.callInfo;
          const isOutgoing = m.senderId === authUser?.uid;
          logsMap.set(m.id, {
            id: m.id,
            contactId,
            type: info.type,
            direction: isOutgoing ? 'outgoing' : 'incoming',
            status: info.status,
            timestamp: m.timestamp,
            duration: info.duration || '00:00',
            isMissed: info.status === 'missed' || info.status === 'rejected' || info.status === 'busy',
          });
        }
      });
      }
    });
    const sorted = Array.from(logsMap.values()).reverse();
    setCallLogs(sorted);
  }, [messages, authUser?.uid]);

  // Calling logic with WebRTC and Firestore signaling
  const startCall = async (contactId: string, type: CallType) => {
    if (!authUser) {
      return;
    }

    if (authUser && contactId === authUser.uid) {
      throw new Error('You cannot start a call with yourself.');
    }

    if (!isFriend(contactId)) {
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
    });
  };

  const recordCallInChat = async (contactId: string, callInfo: CallInfo) => {
    if (!authUser || !isFriend(contactId)) return;

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
    await addDoc(msgRef, {
      senderId: callInfo.direction === 'outgoing' ? authUser.uid : contactId,
      receiverId: callInfo.direction === 'outgoing' ? contactId : authUser.uid,
      text: textLabel,
      type: callInfo.type === 'video' ? 'video_call' : 'voice_call',
      callInfo,
      isRead: true,
      createdAt: serverTimestamp(),
    }).catch(() => {});
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

  const clearCallLogs = () => {
    setCallLogs([]);
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
        console.error('Sign in failed:', error);
        if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
          const domainMsg = 'Google Sign-In is restricted on preview domains in Firebase Authorized Domains. Switching to Demo Session or use Guest Access.';
          setAuthError(domainMsg);
          setupLocalSession('google.user@calcchat.app', 'Google User');
          return;
        } else if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('operation-not-allowed')) {
          setupLocalSession('google.user@calcchat.app', 'Google User');
          return;
        }
        setAuthError(error.message);
        throw error;
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
    setUser(prev => ({ ...prev, ...newProfile }));
    if (authUser) {
      await updateDoc(doc(db, 'users', authUser.uid), {
        status: newProfile.status || user.status,
        displayName: newProfile.name || user.name,
      }).catch(() => {});
    }
  };

  const addContact = () => {};
  const createGroup = () => '';
  const clearChatHistory = () => {};
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
  const unlockChatLock = (contactId: string) => {
    setUnlockedLocks(prev => ({ ...prev, [contactId]: true }));
  };
  const blockContact = (contactId: string) => {
    setBlockedContactIds(prev => prev.includes(contactId) ? prev : [...prev, contactId]);
  };
  const unblockContact = (contactId: string) => {
    setBlockedContactIds(prev => prev.filter(id => id !== contactId));
  };
  const toggleStarMessage = async (contactId: string, msgId: string) => {
    if (!authUser) return;
    const chatId = [authUser.uid, contactId].sort().join('_');
    const msg = (messages[contactId] || []).find(m => m.id === msgId);
    if (!msg) return;
    await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
      isStarred: !msg.isStarred
    }).catch(err => console.warn('Failed to star message:', err));
  };

  const togglePinMessage = async (contactId: string, msgId: string) => {
    if (!authUser) return;
    const chatId = [authUser.uid, contactId].sort().join('_');
    const msg = (messages[contactId] || []).find(m => m.id === msgId);
    if (!msg) return;
    await updateDoc(doc(db, 'chats', chatId, 'messages', msgId), {
      isPinned: !msg.isPinned
    }).catch(err => console.warn('Failed to pin message:', err));
  };

  const forwardMessage = async (msg: Message, targetContactIds: string[]) => {
    if (!authUser || !msg || !targetContactIds || targetContactIds.length === 0) return;
    for (const targetId of targetContactIds) {
      try {
        await sendMessage(targetId, msg.text || '', msg.media || undefined, undefined);
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
      friendUids,
      unreadTotal: computedUnreadTotal,
      messages,
      callLogs,
      activeCall,
      callPermissionError,
      clearCallPermissionError,
      activeContactId,
      activeTab,
      unlockedLocks,
      blockedContactIds,
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
      completeUsernameSetup,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      unfriendContact,
      isFriend,
      searchFirebaseUsers,
      postStatusUpdate,
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
      toggleStarMessage,
      togglePinMessage,
      forwardMessage,
      typingStatusMap,
      setTypingStatus,
      markMessagesAsRead,
      setCustomNickname,
      clearCustomNickname,
      getContactDisplayName,
      startCall,
      acceptCall,
      rejectCall,
      cancelCall,
      endCall,
      toggleMuteCall,
      toggleVideoCall,
      toggleSpeakerCall,
      switchCameraCall,
      clearCallLogs,
      updateSettings,
      updateProfile,
      addContact,
      createGroup,
      clearChatHistory,
      clearAllChatHistory,
      togglePinContact,
      toggleLockContact,
      toggleArchiveContact,
      unlockChatLock,
      blockContact,
      unblockContact,
    }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const ctx = useContext(VaultContext);
  return ctx || fallbackVaultContext;
};
