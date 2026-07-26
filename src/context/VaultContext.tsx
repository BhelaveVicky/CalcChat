import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { Contact, MediaAttachment, Message, UserProfile, VaultSettings } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_USER, INITIAL_CONTACTS, INITIAL_MESSAGES } from '../data/initialData';
import { firebaseAuth, googleProvider, firebaseDb } from '../lib/firebase';
import { signInWithRedirect as firebaseSignInWithRedirect, getRedirectResult, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface VaultContextType {
  isUnlocked: boolean;
  user: UserProfile;
  settings: VaultSettings;
  contacts: Contact[];
  messages: Record<string, Message[]>;
  activeContactId: string | null;
  activeTab: 'chats' | 'gallery' | 'profile' | 'settings' | 'calls';
  unlockedLocks: Record<string, boolean>;
  authUser: FirebaseUser | null;
  authReady: boolean;
  authError: string | null;
  unlockVault: (code: string) => boolean;
  lockVault: () => void;
  signInWithGoogle: () => Promise<void>;
  signOutGoogle: () => Promise<void>;
  setActiveContactId: (id: string | null) => void;
  setActiveTab: (tab: 'chats' | 'gallery' | 'profile' | 'settings' | 'calls') => void;
  sendMessage: (receiverId: string, text: string, media?: MediaAttachment) => void;
  updateSettings: (newSettings: Partial<VaultSettings>) => void;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
  addContact: (name: string, status: string, isAi: boolean) => void;
  deleteMessage: (contactId: string, msgId: string) => void;
  clearChatHistory: (contactId: string) => void;
  togglePinContact: (contactId: string) => void;
  toggleLockContact: (contactId: string) => void;
  unlockChatLock: (contactId: string) => void;
  blockedContactIds: string[];
  unreadTotal: number;
  blockContact: (contactId: string) => void;
  unblockContact: (contactId: string) => void;
  clearAllChatHistory: () => void;
  toggleArchiveContact: (contactId: string) => void;
  startCall: (contactId: string, type: 'voice' | 'video') => void;
  createGroup: (name: string, members: string[]) => string;
  activeCall: { contactId: string; type: 'voice' | 'video' } | null;
  endCall: () => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'calc_vault_user_v1';
const STORAGE_KEY_SETTINGS = 'calc_vault_settings_v1';
const STORAGE_KEY_CONTACTS = 'calc_vault_contacts_v1';
const STORAGE_KEY_MESSAGES = 'calc_vault_messages_v1';
const CHANNEL_NAME = 'calc_vault_sync_channel';

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'gallery' | 'profile' | 'settings' | 'calls'>('chats');
  const [unlockedLocks, setUnlockedLocks] = useState<Record<string, boolean>>({});
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [settings, setSettings] = useState<VaultSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONTACTS);
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });

  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [blockedContactIds, setBlockedContactIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('calc_vault_blocked_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeCall, setActiveCall] = useState<{ contactId: string; type: 'voice' | 'video' } | null>(null);

  const unreadTotal = contacts.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Firebase Auth State Listener
  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener immediately
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      if (!isMounted) return;
      
      console.log('🔥 Auth state changed:', user ? 'User logged in' : 'User logged out');
      setAuthUser(user);
      setAuthReady(true);

      if (user) {
        // Save user to Firestore
        await saveUserToFirebase(user);
        
        // Load user data from Firestore
        await loadUserDataFromFirebase(user.uid);
        
        // Update user profile with Firebase data
        setUser(prev => ({
          ...prev,
          name: user.displayName || prev.name,
          avatar: user.photoURL || prev.avatar,
          email: user.email || prev.email,
          providerId: user.providerData[0]?.providerId || prev.providerId,
          firebaseUid: user.uid,
          isAdmin: user.email === 'bhelavevicky66@gmail.com',
        }));
      }
    });

    // Handle redirect result on page load (separate from auth state)
    getRedirectResult(firebaseAuth).then((result) => {
      if (result && result.user && isMounted) {
        console.log('✅ Redirect sign-in successful:', result.user);
        // Auth state will be handled by onAuthStateChanged
      }
    }).catch((error) => {
      console.error('❌ Redirect result error:', error);
      // Ignore redirect errors - might be normal page load without redirect
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const saveUserToFirebase = async (firebaseUser: FirebaseUser) => {
    try {
      const userRef = doc(firebaseDb, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      
      const userData = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        avatar: firebaseUser.photoURL,
        providerId: firebaseUser.providerData[0]?.providerId,
        isAdmin: firebaseUser.email === 'bhelavevicky66@gmail.com',
        updatedAt: new Date().toISOString(),
      };

      if (userDoc.exists()) {
        await updateDoc(userRef, userData);
      } else {
        await setDoc(userRef, {
          ...userData,
          createdAt: new Date().toISOString(),
          settings: DEFAULT_SETTINGS,
          contacts: INITIAL_CONTACTS,
          messages: INITIAL_MESSAGES,
        });
      }
    } catch (error) {
      console.error('Error saving user to Firebase:', error);
    }
  };

  const loadUserDataFromFirebase = async (uid: string) => {
    try {
      const userRef = doc(firebaseDb, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.settings) setSettings(data.settings);
        if (data.contacts) setContacts(data.contacts);
        if (data.messages) setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading user data from Firebase:', error);
    }
  };

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    // Sync to Firestore
    if (authUser) {
      saveSettingsToFirebase(authUser.uid, settings);
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
    // Sync to Firestore
    if (authUser) {
      saveContactsToFirebase(authUser.uid, contacts);
    }
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    // Sync to Firestore
    if (authUser) {
      saveMessagesToFirebase(authUser.uid, messages);
    }
  }, [messages]);

  const saveSettingsToFirebase = async (uid: string, settings: VaultSettings) => {
    try {
      const userRef = doc(firebaseDb, 'users', uid);
      await updateDoc(userRef, { settings });
    } catch (error) {
      console.error('Error saving settings to Firebase:', error);
    }
  };

  const saveContactsToFirebase = async (uid: string, contacts: Contact[]) => {
    try {
      const userRef = doc(firebaseDb, 'users', uid);
      await updateDoc(userRef, { contacts });
    } catch (error) {
      console.error('Error saving contacts to Firebase:', error);
    }
  };

  const saveMessagesToFirebase = async (uid: string, messages: Record<string, Message[]>) => {
    try {
      const userRef = doc(firebaseDb, 'users', uid);
      await updateDoc(userRef, { messages });
    } catch (error) {
      console.error('Error saving messages to Firebase:', error);
    }
  };

  // Broadcast channel for multi-tab real-time sync
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;
    const channel = new BroadcastChannel(CHANNEL_NAME);

    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'SYNC_MESSAGES') {
        setMessages(payload.messages);
        setContacts(payload.contacts);
      } else if (type === 'SYNC_SETTINGS') {
        setSettings(payload);
      } else if (type === 'SYNC_USER') {
        setUser(payload);
      } else if (type === 'LOCK_VAULT') {
        setIsUnlocked(false);
        setActiveContactId(null);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const broadcastSync = (type: string, payload: any) => {
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type, payload });
      channel.close();
    }
  };

  // Auto-lock timer
  useEffect(() => {
    if (!isUnlocked || settings.autoLockMinutes <= 0) return;

    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        lockVault();
      }, settings.autoLockMinutes * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [isUnlocked, settings.autoLockMinutes]);

  const unlockVault = (code: string): boolean => {
    if (code === settings.passcode) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const lockVault = () => {
    setIsUnlocked(false);
    setActiveContactId(null);
    broadcastSync('LOCK_VAULT', null);
  };

  const markChatRead = (contactId: string) => {
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, unreadCount: 0 } : c));
    setMessages(prev => {
      const msgs = prev[contactId] || [];
      return {
        ...prev,
        [contactId]: msgs.map(m => ({ ...m, isRead: true }))
      };
    });
  };

  const handleSetActiveContactId = (id: string | null) => {
    setActiveContactId(id);
    if (id) {
      markChatRead(id);
    }
  };

  const sendMessage = (receiverId: string, text: string, media?: MediaAttachment) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = {
      id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 6),
      senderId: user.id,
      receiverId,
      text,
      timestamp: timeStr,
      media,
      isRead: true,
    };

    const updatedMessages = {
      ...messages,
      [receiverId]: [...(messages[receiverId] || []), newMsg],
    };

    const updatedContacts = contacts.map(c => {
      if (c.id === receiverId) {
        return { ...c, lastSeen: 'Just now' };
      }
      return c;
    });

    setMessages(updatedMessages);
    setContacts(updatedContacts);
    broadcastSync('SYNC_MESSAGES', { messages: updatedMessages, contacts: updatedContacts });

    // Check if AI Bot reply needed
    const contact = contacts.find(c => c.id === receiverId);
    if (contact?.isAiBot) {
      setTimeout(() => {
        triggerAiBotReply(receiverId, text);
      }, 1200 + Math.random() * 1000);
    }
  };

  const triggerAiBotReply = (botId: string, userText: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let botReplyText = 'Roger that. Message received and encrypted.';
    const lower = userText.toLowerCase();

    if (botId === 'contact_novak') {
      if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        botReplyText = 'Agent Cipher! Status report: All surveillance channels are quiet. The calculator vault holds steady.';
      } else if (lower.includes('password') || lower.includes('passcode') || lower.includes('code')) {
        botReplyText = `Your current access passcode is "${settings.passcode}". Keep it memorized. Never write it down.`;
      } else if (lower.includes('help') || lower.includes('tips')) {
        botReplyText = 'Need backup? You can attach classified photos or secret documents using the + button. Or use the Emergency Erase in Settings if compromised.';
      } else if (lower.includes('media') || lower.includes('photo') || lower.includes('file')) {
        botReplyText = 'All uploaded media is stored securely inside the Media Vault tab. You can download or view it privately.';
      } else {
        const replies = [
          'Copy that. Storing this record in the encrypted SQLite matrix.',
          'Understood. I am running background diagnostics on our Flask proxy layer.',
          'Affirmative. No unauthorized access attempts detected on your profile.',
          'Message acknowledged. Standing by for further operational directives 🛡️',
        ];
        botReplyText = replies[Math.floor(Math.random() * replies.length)];
      }
    } else {
      botReplyText = `Vault Bot processed your query: "${userText}". All systems operational!`;
    }

    setMessages(prev => {
      const cur = prev[botId] || [];
      const replyMsg: Message = {
        id: 'msg_bot_' + Date.now(),
        senderId: botId,
        receiverId: user.id,
        text: botReplyText,
        timestamp: timeStr,
        isRead: activeContactId === botId,
      };
      const nMsgs = { ...prev, [botId]: [...cur, replyMsg] };

      setContacts(prevC => {
        const nContacts = prevC.map(c => {
          if (c.id === botId) {
            return {
              ...c,
              unreadCount: activeContactId === botId ? 0 : c.unreadCount + 1,
            };
          }
          return c;
        });
        broadcastSync('SYNC_MESSAGES', { messages: nMsgs, contacts: nContacts });
        return nContacts;
      });

      return nMsgs;
    });
  };

  const updateSettings = (newSettings: Partial<VaultSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      broadcastSync('SYNC_SETTINGS', updated);
      return updated;
    });
  };

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setUser(prev => {
      const updated = authUser
        ? {
            ...prev,
            ...newProfile,
            name: authUser.displayName || prev.name,
            avatar: authUser.photoURL || prev.avatar,
            email: authUser.email || prev.email,
            providerId: authUser.providerData[0]?.providerId || prev.providerId,
            firebaseUid: authUser.uid,
          }
        : { ...prev, ...newProfile };
      broadcastSync('SYNC_USER', updated);
      return updated;
    });
  };

 const signInWithGoogle = async () => {
  try {
    console.log("========== GOOGLE LOGIN START ==========");
    console.log("Current URL:", window.location.href);
    console.log("Firebase Auth:", firebaseAuth);
    console.log("Google Provider:", googleProvider);

    setAuthError(null);

    // Use popup for immediate authentication without page reload
    const { signInWithPopup } = await import('firebase/auth');
    await signInWithPopup(firebaseAuth, googleProvider);

    console.log("✅ Sign-in successful");
  } catch (error: any) {
    console.error("❌ Google Sign In Error");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    console.error("Full Error:", error);

    setAuthError(error.message || "Google Sign In Failed");

    throw error;
  }
};
  const signOutGoogle = async () => {
    try {
      await firebaseSignOut(firebaseAuth);
      setAuthUser(null);
      setUser(DEFAULT_USER);
      setAuthError(null);
    } catch (error: any) {
      console.error('Google sign-out error:', error);
      setAuthError(error.message || 'Failed to sign out');
      throw error;
    }
  };

  const addContact = (name: string, status: string, isAi: boolean) => {
    const newId = 'contact_' + Date.now();
    const avatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150&auto=format&fit=crop&q=80',
    ];
    const newContact: Contact = {
      id: newId,
      name,
      status: status || 'Available on Secure Vault',
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      isOnline: true,
      isAiBot: isAi,
      unreadCount: 0,
    };

    setContacts(prev => [newContact, ...prev]);
    setMessages(prev => ({ ...prev, [newId]: [] }));
  };

  const deleteMessage = (contactId: string, msgId: string) => {
    setMessages(prev => ({
      ...prev,
      [contactId]: (prev[contactId] || []).filter(m => m.id !== msgId)
    }));
  };

  const clearChatHistory = (contactId: string) => {
    setMessages(prev => ({ ...prev, [contactId]: [] }));
  };

  const togglePinContact = (contactId: string) => {
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isPinned: !c.isPinned } : c));
  };

  const toggleLockContact = (contactId: string) => {
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isLocked: !c.isLocked } : c));
  };

  const unlockChatLock = (contactId: string) => {
    setUnlockedLocks(prev => ({ ...prev, [contactId]: true }));
  };

  const blockContact = (contactId: string) => {
    setBlockedContactIds(prev => {
      const next = prev.includes(contactId) ? prev : [...prev, contactId];
      localStorage.setItem('calc_vault_blocked_v1', JSON.stringify(next));
      return next;
    });
  };

  const unblockContact = (contactId: string) => {
    setBlockedContactIds(prev => {
      const next = prev.filter(id => id !== contactId);
      localStorage.setItem('calc_vault_blocked_v1', JSON.stringify(next));
      return next;
    });
  };

  const clearAllChatHistory = () => {
    setMessages({});
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify({}));
  };

  const toggleArchiveContact = (contactId: string) => {
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isArchived: !c.isArchived } : c));
  };

  const startCall = (contactId: string, type: 'voice' | 'video') => {
    setActiveCall({ contactId, type });
  };

  const endCall = () => {
    setActiveCall(null);
  };

  const createGroup = (name: string, members: string[]): string => {
    const groupId = 'group_' + Date.now();
    const newGroupContact: Contact = {
      id: groupId,
      name,
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      status: `Group with ${members.length} members`,
      isOnline: false,
      unreadCount: 0,
      isGroup: true,
      groupMembers: members,
    };
    setContacts(prev => [newGroupContact, ...prev]);
    setMessages(prev => ({ ...prev, [groupId]: [] }));
    return groupId;
  };

  return (
    <VaultContext.Provider value={{
      isUnlocked,
      user,
      settings,
      contacts,
      messages,
      activeContactId,
      activeTab,
      unlockedLocks,
      authUser,
      authReady,
      authError,
      unlockVault,
      lockVault,
      signInWithGoogle,
      signOutGoogle,
      setActiveContactId: handleSetActiveContactId,
      setActiveTab,
      sendMessage,
      updateSettings,
      updateProfile,
      addContact,
      deleteMessage,
      clearChatHistory,
      togglePinContact,
      toggleLockContact,
      unlockChatLock,
      blockedContactIds,
      unreadTotal,
      blockContact,
      unblockContact,
      clearAllChatHistory,
      toggleArchiveContact,
      startCall,
      createGroup,
      activeCall,
      endCall,
    }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within a VaultProvider');
  return ctx;
};
