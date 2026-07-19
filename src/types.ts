export type ThemeMode = 'material-dark' | 'amoled-black' | 'cyberpunk' | 'material-light' | 'emerald-vault';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  status: string;
  isOnline: boolean;
  email?: string;
  providerId?: string;
  firebaseUid?: string;
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'file' | 'audio';
  url: string;
  name: string;
  size?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  media?: MediaAttachment;
  isRead?: boolean;
  isStarred?: boolean;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: string;
  isOnline: boolean;
  lastSeen?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  isAiBot?: boolean;
  unreadCount: number;
}

export interface VaultSettings {
  passcode: string; // e.g. "1234" (we unlock on entering passcode + '=')
  autoLockMinutes: number; // 0 = immediate on blur, 1, 5, 15
  hideChatHistory: boolean;
  disappearingMessages: boolean;
  theme: ThemeMode;
  showAndroidFrame: boolean;
  soundEffects: boolean;
}
