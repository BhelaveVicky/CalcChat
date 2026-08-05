export type ThemeMode = 'material-dark' | 'amoled-black' | 'cyberpunk' | 'material-light' | 'emerald-vault' | 'light';

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  status: string;
  about?: string;
  isOnline: boolean;
  lastSeen?: string;
  email?: string;
  providerId?: string;
  firebaseUid?: string;
  friends?: string[];
  followers?: string[];
  following?: string[];
}

export type CallType = 'voice' | 'video';
export type CallDirection = 'incoming' | 'outgoing';
export type CallStatus = 'completed' | 'missed' | 'rejected' | 'cancelled' | 'busy' | 'failed' | 'connected' | 'ended' | 'ringing' | 'connecting';

export interface CallInfo {
  id: string;
  type: CallType;
  callType?: CallType;
  direction: CallDirection;
  status: CallStatus;
  duration?: string;
  startedAt?: any;
  endedAt?: any;
  startTime?: string;
  endTime?: string;
  callerId: string;
  receiverId: string;
}

export interface CallLog {
  id: string;
  contactId: string;
  type: CallType;
  callType?: CallType;
  direction: CallDirection;
  status: CallStatus;
  timestamp: string;
  createdAt?: any;
  startedAt?: any;
  endedAt?: any;
  duration?: string;
  isMissed?: boolean;
  callerId: string;
  receiverId: string;
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'file' | 'audio' | 'location' | 'contact';
  url: string;
  name: string;
  size?: string;
  duration?: string;
  thumbnailUrl?: string;
  isViewOnce?: boolean;
  opened?: boolean;
  openedAt?: any;
  locationData?: {
    lat: number;
    lng: number;
    address?: string;
  };
  contactData?: {
    name: string;
    phone?: string;
    avatar?: string;
    id?: string;
  };
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  receiverId: string;
  text: string;
  timestamp: string;
  createdAt?: any;
  type?: 'text' | 'voice_call' | 'video_call';
  callInfo?: CallInfo;
  media?: MediaAttachment;
  isSent?: boolean;
  isDelivered?: boolean;
  isRead?: boolean;
  seen?: boolean;
  isStarred?: boolean;
  isPinned?: boolean;
  isEdited?: boolean;
  isForwarded?: boolean;
  isViewOnce?: boolean;
  opened?: boolean;
  deletedForEveryone?: boolean;
  deletedForMe?: boolean;
  deletedFor?: string[];
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  reactions?: Record<string, string>;
  statusReply?: {
    statusId: string;
    statusMediaUrl?: string;
    statusText?: string;
    statusMediaType?: 'image' | 'video';
    statusOwnerName?: string;
    statusOwnerId?: string;
    textReply?: string;
  };
  statusReaction?: {
    statusId: string;
    statusMediaUrl?: string;
    statusText?: string;
    statusMediaType?: 'image' | 'video';
    statusOwnerName?: string;
    statusOwnerId?: string;
    emoji: string;
  };
}

export type StatusReplyData = NonNullable<Message['statusReply']>;
export type StatusReactionData = NonNullable<Message['statusReaction']>;

export interface Contact {
  id: string;
  name: string;
  username?: string;
  email?: string;
  avatar: string;
  status: string;
  about?: string;
  isOnline: boolean;
  lastSeen?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  isArchived?: boolean;
  isAiBot?: boolean;
  isGroup?: boolean;
  groupMembers?: string[];
  members?: string[];
  createdBy?: string;
  admins?: string[];
  wallpaper?: string;
  unreadCount: number;
  isTyping?: boolean;
  isSelf?: boolean;
  isFavorite?: boolean;
  isMuted?: boolean;
  lastMessage?: string;
  lastMessageTime?: any;
  lastMessageSenderId?: string;
  lastActivityTime?: number;
}

export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'self';

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName?: string;
  senderPhoto?: string;
  senderUsername?: string;
  senderDisplayName?: string;
  senderPhotoURL?: string;
  receiverId: string;
  receiverName?: string;
  receiverPhoto?: string;
  receiverUsername?: string;
  receiverDisplayName?: string;
  receiverPhotoURL?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: any;
}

export interface StatusUpdate {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  caption?: string;
  bgColor?: string;
  privacyMode?: 'contacts' | 'only';
  allowedUserIds?: string[];
  createdAt: any;
  expiresAt: any;
  formattedTime?: string;
  likesCount?: number;
  seenCount?: number;
  repliesCount?: number;
  likes?: string[];
  seenUserIds?: string[];
}

export interface StatusSeenRecord {
  id: string;
  statusId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  seenAt?: any;
  seenTime: string;
}

export interface StatusLikeRecord {
  id: string;
  statusId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  likedAt?: any;
  likeTime: string;
}

export interface StatusReactionRecord {
  id: string;
  statusId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  emoji: string;
  createdAt: any;
  reactionTime: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'friend_request' | 'friend_accepted' | 'message' | 'call' | 'status';
  title: string;
  body: string;
  senderId?: string;
  senderName?: string;
  read: boolean;
  createdAt: any;
}

export interface VaultSettings {

  passcode: string; // e.g. "1234"
  autoLockMinutes: number; // 0 = immediate, 1, 5, 15
  hideChatHistory: boolean;
  disappearingMessages: boolean;
  theme: ThemeMode;
  showAndroidFrame: boolean;
  soundEffects: boolean;
  notificationsEnabled: boolean;
  chatWallpaper?: string;
}
