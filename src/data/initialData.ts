import { Contact, Message, UserProfile, VaultSettings } from '../types';

export const DEFAULT_USER: UserProfile = {
  id: 'user_me',
  name: 'Agent Cipher',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  status: 'In the encrypted vault 🤫',
  isOnline: true,
  email: '',
  providerId: 'local',
  firebaseUid: '',
};

export const DEFAULT_SETTINGS: VaultSettings = {
  passcode: '',
  autoLockMinutes: 5,
  hideChatHistory: false,
  disappearingMessages: false,
  theme: 'material-dark',
  showAndroidFrame: false,
  soundEffects: true,
};




export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'contact_novak',
    name: 'Agent Novak (AI)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'Confidential channel secure 🛡️',
    isOnline: true,
    isPinned: true,
    isAiBot: true,
    unreadCount: 1,
  },
  
  {
    id: 'contact_maya',
    name: 'Maya (Private)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'Meeting at 8 PM. Keep encrypted.',
    isOnline: true,
    isPinned: true,
    unreadCount: 0,
  },
  {
    id: 'contact_syndicate',
    name: 'Vault Syndicate Group',
    avatar: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
    status: '3 members active',
    isOnline: false,
    lastSeen: '10 mins ago',
    unreadCount: 2,
    isLocked: false,
  },
  {
    id: 'contact_vault_bot',
    name: 'Vault Helper Bot',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    status: 'Automated security assistant',
    isOnline: true,
    isAiBot: true,
    unreadCount: 0,
  }
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  'contact_novak': [
    {
      id: 'msg_1',
      senderId: 'contact_novak',
      receiverId: 'user_me',
      text: 'Cipher, I verified the perimeter. The calculator disguise is working flawlessly. Nobody suspects this app.',
      timestamp: '10:15 AM',
      isRead: true,
    },
    {
      id: 'msg_2',
      senderId: 'user_me',
      receiverId: 'contact_novak',
      text: 'Excellent. Have you uploaded the blueprint media files?',
      timestamp: '10:18 AM',
      isRead: true,
    },
    {
      id: 'msg_3',
      senderId: 'contact_novak',
      receiverId: 'user_me',
      text: 'Yes, attached below. Remember, typing your passcode followed by "=" unlocks this vault anytime.',
      timestamp: '10:20 AM',
      media: {
        id: 'media_1',
        type: 'image',
        name: 'classified_satellite_grid.jpg',
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      },
      isRead: false,
    }
  ],
  'contact_maya': [
    {
      id: 'msg_m1',
      senderId: 'contact_maya',
      receiverId: 'user_me',
      text: 'Hey! Are we still on for dinner tonight?',
      timestamp: 'Yesterday',
      isRead: true,
    },
    {
      id: 'msg_m2',
      senderId: 'user_me',
      receiverId: 'contact_maya',
      text: 'Yes! Let us meet at the Italian place downtown at 8 PM.',
      timestamp: 'Yesterday',
      isRead: true,
    }
  ],
  'contact_syndicate': [
    {
      id: 'msg_s1',
      senderId: 'contact_syndicate',
      receiverId: 'user_me',
      text: 'Welcome to the Syndicate encrypted chat. Media sharing is enabled.',
      timestamp: 'Mon',
      isRead: true,
    },
    {
      id: 'msg_s2',
      senderId: 'contact_syndicate',
      receiverId: 'user_me',
      text: 'Check out the new project documentation file.',
      timestamp: '09:30 AM',
      media: {
        id: 'media_f1',
        type: 'file',
        name: 'Project_Alpha_Specs_v2.pdf',
        url: '#',
        size: '4.2 MB',
      },
      isRead: false,
    }
  ],
  'contact_vault_bot': [
    {
      id: 'msg_v1',
      senderId: 'contact_vault_bot',
      receiverId: 'user_me',
      text: '👋 Welcome to Secret Calculator Chat Vault! Here are some quick tips:\n\n1️⃣ **Passcode Unlock:** On the calculator screen, type your passcode (default: 1234) and tap the "=" button to open this secret vault.\n2️⃣ **Media Sharing:** Tap the "+" icon inside any chat to send Photos, Videos, or Files.\n3️⃣ **Privacy:** Use Settings to change your passcode, enable Dark/Cyberpunk theme, or disguise chat previews.\n4️⃣ **AI Chat:** Chat with Agent Novak or me anytime for instant responses!',
      timestamp: 'Just now',
      isRead: true,
    }
  ]
};
