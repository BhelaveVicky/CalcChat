import { CallLog, Contact, Message, UserProfile, VaultSettings } from '../types';

export const DEFAULT_USER: UserProfile = {
  id: '',
  name: '',
  username: '',
  avatar: '',
  status: 'Available',
  isOnline: true,
  email: '',
  providerId: 'google.com',
  firebaseUid: '',
};

export const DEFAULT_SETTINGS: VaultSettings = {
  passcode: '1234',
  autoLockMinutes: 5,
  hideChatHistory: false,
  disappearingMessages: false,
  theme: 'material-light',
  showAndroidFrame: false,
  soundEffects: true,
  chatWallpaper: 'default',
  chatWallpaperBlur: 0,
  chatWallpaperBrightness: 100,
  chatWallpaperRecent: [],
  chatWallpaperFavorites: [],
  chatWallpaperCustomList: [],
  notificationsEnabled: true,
};

export const INITIAL_CALL_LOGS: CallLog[] = [];

export const INITIAL_CONTACTS: Contact[] = [];

export const INITIAL_MESSAGES: Record<string, Message[]> = {};

