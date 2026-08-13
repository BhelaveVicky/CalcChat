import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Key, Lock, MessageSquare, Bell, Keyboard, LogOut, Search, X, 
  Camera, Check, Eye, EyeOff, Edit3, RotateCw, ZoomIn, ZoomOut, RefreshCw,
  ChevronLeft, ChevronRight, Circle, Info, Smile, CheckCheck,
  Ban, UserPlus, Plus, ShieldAlert, Trash2, Code2, Heart, Sparkles,
  Users, Phone, ShieldCheck, Crown, Activity, BadgeCheck, Palette, MoreHorizontal
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useVault } from '../context/VaultContext';
import { useSettings } from '../context/SettingsContext';
import { CCLogo, CalcChatTitle } from './CalcChatBrand';
import { compressImage } from '../lib/mediaCompressor';
import { checkIsAdmin, VerifiedBadge, ADMIN_EMAILS } from '../lib/adminUtils';
import { FollowersList } from './FollowersList';
import { FollowingList } from './FollowingList';
import { WhatsAppProfileViewer } from './WhatsAppProfileViewer';
import { GET_PRESET_WALLPAPERS } from '../data/presetWalpapers';
import { WallpaperSuccessOverlay } from './WallpaperSuccessOverlay';
import { SetChatWallpaperModal } from './SetChatWallpaperModal';

export const UserProfileView: React.FC = () => {
  const { 
    user, authUser, updateProfile, signOutGoogle, lockVault, 
    contacts, blockedContactIds, blockContact, unblockContact,
    settings: vaultSettings, updateSettings: updateVaultSettings,
    clearAllChatHistory, allRegisteredUsers,
    adminWallpapers, addAdminWallpaper, deleteAdminWallpaper,
    completeChatPasswordSetup
  } = useVault();
  const { settings, updateSettings: updateGlobalSettings } = useSettings();
  const isDark = vaultSettings.theme !== 'material-light' && vaultSettings.theme !== 'light';
  const [search, setSearch] = useState('');
  const [snack, setSnack] = useState('');
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState('');
  const [adminWpTitle, setAdminWpTitle] = useState('');
  const [adminWpUrl, setAdminWpUrl] = useState('');
  const [isAddingAdminWp, setIsAddingAdminWp] = useState(false);
  const [fullScreenSuccessMsg, setFullScreenSuccessMsg] = useState<string | null>(null);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [previewWallpaperChoice, setPreviewWallpaperChoice] = useState<string | undefined>(undefined);

  const triggerSuccessOverlay = (msg: string = 'Wallpaper Set!') => {
    setFullScreenSuccessMsg(msg);
    setTimeout(() => {
      setFullScreenSuccessMsg(null);
    }, 2200);
  };
  
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const adminWpInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = checkIsAdmin(user) || checkIsAdmin(authUser?.email);

  // Modals
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showFollowersListModal, setShowFollowersListModal] = useState(false);
  const [showFollowingListModal, setShowFollowingListModal] = useState(false);
  const [showPrivateFollowersNotice, setShowPrivateFollowersNotice] = useState(false);
  const [showProfileOptionsModal, setShowProfileOptionsModal] = useState(false);
  const [showViewProfileModal, setShowViewProfileModal] = useState(false);
  const [showFullPhotoViewer, setShowFullPhotoViewer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showAddBlockContactModal, setShowAddBlockContactModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [showChatsModal, setShowChatsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifyMessages, setNotifyMessages] = useState(() => localStorage.getItem('calcchat_global_notify_messages') !== 'false');
  const [notifyGroups, setNotifyGroups] = useState(() => localStorage.getItem('calcchat_global_notify_groups') !== 'false');
  const [notifyStatus, setNotifyStatus] = useState(() => localStorage.getItem('calcchat_global_notify_status') !== 'false');
  const [notifyCalls, setNotifyCalls] = useState(() => localStorage.getItem('calcchat_global_notify_calls') !== 'false');
  const [showClearHistoryConfirmModal, setShowClearHistoryConfirmModal] = useState(false);
  const [blockSearch, setBlockSearch] = useState('');

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showChangePasscodeModal, setShowChangePasscodeModal] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);

  // Admin User Search & Blue Tick Management States
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);
  const [isLoadingAdminUsers, setIsLoadingAdminUsers] = useState(false);

  const loadAdminUsers = async () => {
    if (!db) return;
    setIsLoadingAdminUsers(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          uid: docSnap.id,
          name: data.displayName || data.name || data.username || 'User',
          username: data.username || '',
          email: data.email || '',
          avatar: data.photoURL || data.avatar || '',
          isVerified: Boolean(
            data.isVerified ||
            data.verified ||
            checkIsAdmin({ email: data.email, username: data.username, name: data.displayName })
          ),
        });
      });
      setAdminUsersList(list);
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setIsLoadingAdminUsers(false);
    }
  };

  useEffect(() => {
    if (showAdminModal) {
      loadAdminUsers();
    }
  }, [showAdminModal]);

  const handleToggleBlueTick = async (targetUser: any) => {
    if (!db) return;
    const newVerified = !targetUser.isVerified;
    try {
      await updateDoc(doc(db, 'users', targetUser.id), {
        isVerified: newVerified,
        verified: newVerified,
        isVerifiedAdmin: newVerified,
      });

      setAdminUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isVerified: newVerified } : u))
      );

      const targetHandle = targetUser.username ? `@${targetUser.username}` : targetUser.name;
      setSnack(
        newVerified
          ? `Blue Tick granted to ${targetHandle}!`
          : `Blue Tick removed for ${targetHandle}.`
      );
    } catch (err) {
      console.error('Error updating blue tick:', err);
      setSnack('Failed to update verification status.');
    }
  };

  // Privacy states
  const [privacyLastSeen, setPrivacyLastSeen] = useState('My contacts, Everyone');
  const [privacyPhoto, setPrivacyPhoto] = useState('Everyone');
  const [privacyAbout, setPrivacyAbout] = useState('My contacts');
  const [privacyStatus, setPrivacyStatus] = useState('1 contact included');
  const [readReceipts, setReadReceipts] = useState(true);
  const [activePrivacyItem, setActivePrivacyItem] = useState<{ id: string; title: string; current: string; options: string[] } | null>(null);

  // Edit states
  const [editName, setEditName] = useState(user.name || authUser?.displayName || '');
  const [editUsername, setEditUsername] = useState(user.username || '');
  const [editStatus, setEditStatus] = useState(user.status || user.about || user.bio || '');
  const [editAvatar, setEditAvatar] = useState(user.avatar || authUser?.photoURL || '');
  const [saved, setSaved] = useState(false);

  // Sync state whenever user context updates from real-time listener
  useEffect(() => {
    if (user.name && !editName) setEditName(user.name);
    if (user.username && !editUsername) setEditUsername(user.username);
    if ((user.status || user.about || user.bio) && !editStatus) setEditStatus(user.status || user.about || user.bio || '');
    if (user.avatar && !editAvatar) setEditAvatar(user.avatar);
  }, [user.name, user.username, user.status, user.about, user.bio, user.avatar]);

  // Crop states
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [cropPos, setCropPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const userName = user.name || authUser?.displayName || 'User';
  const userUsername = user.username || '';
  const userEmail = user.email || authUser?.email || '';

  const showSnack = (msg: string) => {
    setSnack(msg);
    setTimeout(() => setSnack(''), 3000);
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await signOutGoogle();
      lockVault();
    }
  };

  const openProfileOptions = () => {
    setShowProfileOptionsModal(true);
  };

  const handleOpenEditModal = () => {
    setEditName(user.name || authUser?.displayName || '');
    setEditUsername(user.username || '');
    setEditStatus(user.status || user.about || user.bio || '');
    setEditAvatar(user.avatar || authUser?.photoURL || '');
    setShowProfileOptionsModal(false);
    setShowViewProfileModal(false);
    setShowEditModal(true);
  };

  const handleOpenViewModal = () => {
    setShowProfileOptionsModal(false);
    setShowViewProfileModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setRawImage(reader.result);
          setZoom(1);
          setRotation(0);
          setCropPos({ x: 0, y: 0 });
          setShowCropModal(true);
        }
      };
      reader.readAsDataURL(file);
      // reset input value so re-selecting same image triggers change
      e.target.value = '';
    }
  };

  const applyCrop = () => {
    if (!rawImage) return;
    const img = new Image();
    img.src = rawImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const outputSize = 800; // high quality 800x800 HD avatar output
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, outputSize, outputSize);
      ctx.save();

      // Translate center + scaled drag offset (viewport circle is 240px wide)
      const scaleFactor = outputSize / 240;
      ctx.translate(outputSize / 2 + cropPos.x * scaleFactor, outputSize / 2 + cropPos.y * scaleFactor);
      ctx.rotate((rotation * Math.PI) / 180);

      const baseFit = Math.max(outputSize / img.width, outputSize / img.height);
      const drawW = img.width * baseFit * zoom;
      const drawH = img.height * baseFit * zoom;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const croppedUrl = canvas.toDataURL('image/jpeg', 0.95);
      setEditAvatar(croppedUrl);
      setShowCropModal(false);
      showSnack('Photo cropped successfully');
    };
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = editName.trim() || userName;
    const finalUsername = editUsername.trim().replace(/^@/, '') || userUsername;
    const finalStatus = editStatus.trim();

    await updateProfile({
      name: finalName,
      username: finalUsername,
      status: finalStatus,
      about: finalStatus,
      bio: finalStatus,
      avatar: editAvatar
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowEditModal(false);
      showSnack('Profile updated successfully');
    }, 800);
  };

  const menuItems = [
    ...(isAdmin ? [{
      id: 'admin_panel',
      icon: <ShieldCheck className="w-5 h-5 text-[#00a8ff]" />,
      label: 'Admin Panel',
      sub: 'System control, verified blue badge & security',
      onClick: () => setShowAdminModal(true)
    }] : []),
    {
      id: 'profile',
      icon: <User className="w-5 h-5 text-[#8696a0]" />,
      label: 'Profile',
      sub: `Name, profile photo, @${userUsername}`,
      onClick: openProfileOptions
    },
    {
      id: 'account',
      icon: <Key className="w-5 h-5 text-[#8696a0]" />,
      label: 'Account',
      sub: 'Security notifications, account info & change password',
      onClick: () => setShowAccountModal(true)
    },
    {
      id: 'privacy',
      icon: <Lock className="w-5 h-5 text-[#8696a0]" />,
      label: 'Privacy',
      sub: 'Block contacts, disappearing messages',
      onClick: () => setShowPrivacyModal(true)
    },
    {
      id: 'chats',
      icon: <MessageSquare className="w-5 h-5 text-[#8696a0]" />,
      label: 'Chats',
      sub: 'Theme, wallpapers, chat history',
      onClick: () => setShowChatsModal(true)
    },
    {
      id: 'notifications',
      icon: <Bell className="w-5 h-5 text-[#8696a0]" />,
      label: 'Notifications',
      sub: 'Message, group & call tones',
      onClick: () => setShowNotificationsModal(true)
    },
    {
      id: 'creator',
      icon: <Code2 className="w-5 h-5 text-[#8696a0]" />,
      label: 'App Creator',
      sub: 'Developer & system information',
      onClick: () => setShowCreatorModal(true)
    },
    {
      id: 'logout',
      icon: <LogOut className="w-5 h-5 text-rose-500" />,
      label: 'Log out',
      sub: 'Sign out of your account or local guest session',
      onClick: handleSignOut,
      danger: true
    }
  ];

  const filteredItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.sub.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`flex-1 flex flex-col h-full overflow-y-auto select-none font-sans transition-colors ${
      isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
    }`}>
      
      {/* Search Bar */}
      <div className={`px-4 py-3 sticky top-0 z-10 ${isDark ? 'bg-[#0b141a]' : 'bg-white'}`}>
        <div className={`flex items-center gap-3 rounded-full px-4 py-2.5 ${isDark ? 'bg-[#1f2c34]' : 'bg-gray-100'}`}>
          <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            className={`flex-1 bg-transparent text-[14.5px] focus:outline-none ${
              isDark ? 'text-[#e9edef] placeholder-[#8696a0]' : 'text-gray-900 placeholder-gray-400'
            }`}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X className={`w-4 h-4 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`} />
            </button>
          )}
        </div>
      </div>

      {/* User Info Header Section (Matches Screenshot) */}
      <div className="flex flex-col items-center justify-center pt-2 pb-6 px-4">
        <div 
          className="relative cursor-pointer group"
          onClick={openProfileOptions}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={userName}
              className={`w-24 h-24 rounded-full object-cover border group-hover:opacity-90 transition-opacity ${
                isDark ? 'border-[#2a3942]' : 'border-gray-200 shadow-md'
              }`}
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#5c6bc0] text-white flex items-center justify-center text-4xl font-normal border border-[#3b4a54] group-hover:opacity-90 transition-opacity">
              {userName ? userName.charAt(0).toLowerCase() : 'p'}
            </div>
          )}
          {/* Sky Blue Online Status Dot */}
          <span className={`w-4 h-4 bg-[#00a8ff] border-2 rounded-full absolute bottom-0.5 right-0.5 ${
            isDark ? 'border-[#0b141a]' : 'border-white'
          }`}></span>
        </div>

        <h2 className={`text-xl font-bold mt-3 tracking-wide text-center flex items-center justify-center gap-1.5 ${
          isDark ? 'text-[#e9edef]' : 'text-gray-900'
        }`}>
          <span>{userName}</span>
          {isAdmin && <VerifiedBadge className="w-5 h-5 shrink-0" />}
        </h2>
        <p className="text-xs text-[#0095f6] font-medium mt-0.5 text-center">
          @{userUsername}
        </p>

        {/* Followers & Following Statistics */}
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold mt-2.5 text-center">
          <button
            type="button"
            onClick={() => {
              if (isAdmin) {
                setShowPrivateFollowersNotice(true);
              } else {
                setShowFollowersListModal(true);
              }
            }}
            className={`hover:underline cursor-pointer transition-colors ${
              isDark ? 'text-[#e9edef] hover:text-[#00a8ff]' : 'text-gray-900 hover:text-[#00a8ff]'
            }`}
          >
            <span className="font-bold">{isAdmin ? '2K' : (Array.isArray(user.followers) ? user.followers.length : 0)}</span>{' '}
            <span className={isDark ? 'text-[#8696a0]' : 'text-gray-500'}>followers</span>
          </button>
          
          <span className={isDark ? 'text-[#8696a0]' : 'text-gray-400'}>•</span>

          <button
            type="button"
            onClick={() => setShowFollowingListModal(true)}
            className={`hover:underline cursor-pointer transition-colors ${
              isDark ? 'text-[#e9edef] hover:text-[#00a8ff]' : 'text-gray-900 hover:text-[#00a8ff]'
            }`}
          >
            <span className="font-bold">{Array.isArray(user.following) ? user.following.length : 0}</span>{' '}
            <span className={isDark ? 'text-[#8696a0]' : 'text-gray-500'}>following</span>
          </button>
        </div>
      </div>

      {/* Menu Options List */}
      <div className={`flex-1 divide-y ${isDark ? 'divide-[#1f2c34]/40' : 'divide-gray-100'}`}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={item.onClick}
            className={`w-full flex items-center gap-5 px-6 py-4.5 transition-colors cursor-pointer text-left ${
              isDark ? 'hover:bg-white/5 active:bg-white/10' : 'hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-[15px] font-medium leading-tight ${
                item.danger ? 'text-rose-500 font-semibold' : (isDark ? 'text-[#e9edef]' : 'text-gray-900')
              }`}>
                {item.label}
              </p>
              <p className={`text-[12.5px] mt-1.5 truncate ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                {item.sub}
              </p>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className={`text-center py-12 text-sm ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
            No matching settings found
          </div>
        )}
      </div>

      {/* Edit Profile Full View (Adapts to Dark / Light Mode) */}
      {showEditModal && (
        <div className={`fixed inset-0 z-50 flex flex-col h-full w-full overflow-y-auto font-sans animate-fade-in transition-colors ${
          isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
        }`}>
          {/* Top Bar */}
          <div className={`flex items-center gap-4 px-5 py-4 sticky top-0 z-10 border-b transition-colors ${
            isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-white border-gray-100'
          }`}>
            <button 
              onClick={() => setShowEditModal(false)}
              className={`p-1.5 rounded-full transition-colors ${
                isDark ? 'text-[#8696a0] hover:bg-[#1f2c34] hover:text-[#e9edef]' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
            <h1 className={`text-xl font-bold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
              Edit Profile
            </h1>
          </div>

          <form onSubmit={handleSaveProfile} className="flex-1 px-6 py-6 flex flex-col max-w-md mx-auto w-full">
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center mb-6">
              <div 
                className="relative cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {editAvatar ? (
                  <img
                    src={editAvatar}
                    alt={editName}
                    className={`w-28 h-28 rounded-full object-cover border-2 shadow-sm ${
                      isDark ? 'border-[#2a3942]' : 'border-gray-100'
                    }`}
                  />
                ) : (
                  <div className={`w-28 h-28 rounded-full flex items-center justify-center text-5xl font-normal shadow-sm ${
                    isDark ? 'bg-[#1f2c34] text-[#e9edef] border border-[#2a3942]' : 'bg-[#1e293b] text-white'
                  }`}>
                    {editName ? editName.charAt(0).toLowerCase() : 'p'}
                  </div>
                )}
                {/* Blue Camera Badge */}
                <div className={`absolute bottom-0 right-0 bg-[#0095f6] text-white p-2.5 rounded-full shadow-lg border-2 hover:bg-[#0081d6] transition-colors ${
                  isDark ? 'border-[#0b141a]' : 'border-white'
                }`}>
                  <Camera className="w-5 h-5" />
                </div>
              </div>

              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />

              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`text-xs font-medium mt-3 hover:text-[#0095f6] transition-colors ${
                  isDark ? 'text-[#8696a0]' : 'text-gray-500'
                }`}
              >
                Click photo to change
              </button>
            </div>

            {/* Name Input Section */}
            <div className="mb-5">
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-[#e9edef]' : 'text-gray-800'
              }`}>
                Name
              </label>
              <input
                type="text"
                maxLength={50}
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className={`w-full rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0095f6] transition-all font-normal ${
                  isDark 
                    ? 'bg-[#1f2c34] text-[#e9edef] placeholder-[#8696a0] border border-[#2a3942]' 
                    : 'bg-[#f0f4f8] text-gray-900 placeholder-gray-400 border-none'
                }`}
                placeholder="Enter your name"
              />
              <p className={`text-xs mt-1.5 text-left font-normal ${
                isDark ? 'text-[#8696a0]' : 'text-gray-400'
              }`}>
                {editName.length} / 50
              </p>
            </div>

            {/* Reserved Username Section (Matches Image 2) */}
            <div className="mb-5">
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-[#e9edef]' : 'text-gray-800'
              }`}>
                Reserved Username
              </label>
              <div className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base transition-all ${
                isDark 
                  ? 'bg-[#1f2c34] text-[#e9edef] border border-[#2a3942] focus-within:ring-2 focus-within:ring-[#0095f6]' 
                  : 'bg-[#f0f4f8] text-gray-900 border-none focus-within:ring-2 focus-within:ring-[#0095f6]'
              }`}>
                <span className={`text-xl font-medium shrink-0 select-none ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                  @
                </span>
                <input
                  type="text"
                  maxLength={30}
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, ''))}
                  className="w-full bg-transparent border-none p-0 focus:outline-none font-normal"
                  placeholder="username"
                />
              </div>
              <p className={`text-xs mt-1.5 text-left font-normal ${
                isDark ? 'text-[#8696a0]' : 'text-gray-400'
              }`}>
                {editUsername.length} / 30
              </p>
            </div>

            {/* About Section */}
            <div className="mb-8">
              <label className={`block text-sm font-semibold mb-2 ${
                isDark ? 'text-[#e9edef]' : 'text-gray-800'
              }`}>
                About
              </label>
              <textarea
                maxLength={139}
                rows={4}
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                className={`w-full rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0095f6] transition-all resize-none font-normal ${
                  isDark 
                    ? 'bg-[#1f2c34] text-[#e9edef] placeholder-[#8696a0] border border-[#2a3942]' 
                    : 'bg-[#f0f4f8] text-gray-900 placeholder-gray-400 border-none'
                }`}
                placeholder="Add a bio or status..."
              />
              <p className={`text-xs mt-1.5 text-left font-normal ${
                isDark ? 'text-[#8696a0]' : 'text-gray-400'
              }`}>
                {editStatus.length} / 139
              </p>
            </div>

            {/* Save Changes Button */}
            <div className="mt-auto pt-4 pb-2">
              <button
                type="submit"
                className="w-full bg-[#0095f6] hover:bg-[#0081d6] active:scale-[0.99] text-white font-semibold py-3.5 rounded-2xl text-base shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {saved ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Saved Changes</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Options Sheet / Dialog (View Profile vs Edit Profile) */}
      {showProfileOptionsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 border shadow-2xl transition-colors ${
            isDark ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200/10">
              <h3 className="font-bold text-base">Profile Options</h3>
              <button 
                onClick={() => setShowProfileOptionsModal(false)}
                className="p-1 rounded-full opacity-70 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Option 1: View Profile */}
              <button
                type="button"
                onClick={handleOpenViewModal}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-medium transition-colors ${
                  isDark 
                    ? 'hover:bg-[#1f2c34] text-[#e9edef]' 
                    : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-[#0095f6]/10 text-[#0095f6]">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">View Profile</p>
                  <p className="text-xs text-gray-400">See photo and account info</p>
                </div>
              </button>

              {/* Option 2: Edit Profile */}
              <button
                type="button"
                onClick={handleOpenEditModal}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-medium transition-colors ${
                  isDark 
                    ? 'hover:bg-[#1f2c34] text-[#e9edef]' 
                    : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-[#00a8ff]/10 text-[#00a8ff]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Edit Profile</p>
                  <p className="text-xs text-gray-400">Change name, username, bio & photo</p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowProfileOptionsModal(false)}
              className="w-full mt-4 py-3 text-center text-sm font-medium text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* View Profile Full View Modal */}
      {showViewProfileModal && (
        <div className={`fixed inset-0 z-50 flex flex-col h-full w-full overflow-y-auto font-sans animate-fade-in transition-colors ${
          isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
        }`}>
          {/* Top Bar */}
          <div className={`flex items-center justify-between px-5 py-4 sticky top-0 z-10 border-b transition-colors ${
            isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowViewProfileModal(false)}
                className={`p-1.5 rounded-full transition-colors ${
                  isDark ? 'text-[#8696a0] hover:bg-[#1f2c34] hover:text-[#e9edef]' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
              <h1 className={`text-xl font-bold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                Profile Details
              </h1>
            </div>

            <button
              onClick={handleOpenEditModal}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-[#0095f6]/10 text-[#0095f6] hover:bg-[#0095f6]/20 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>

          <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center">
            {/* Enlarged Photo Display */}
            <div 
              className="relative mb-6 cursor-pointer group"
              onClick={() => setShowFullPhotoViewer(true)}
              title="Click to view full photo in WhatsApp style"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={userName}
                  className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full object-cover border-4 shadow-2xl group-hover:scale-105 transition-transform ${
                    isDark ? 'border-[#1f2c34]' : 'border-gray-100'
                  }`}
                />
              ) : (
                <div className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center text-7xl font-normal shadow-2xl border-4 group-hover:scale-105 transition-transform ${
                  isDark ? 'bg-[#1f2c34] text-[#e9edef] border-[#2a3942]' : 'bg-[#1e293b] text-white border-gray-100'
                }`}>
                  {userName ? userName.charAt(0).toLowerCase() : 'p'}
                </div>
              )}
            </div>

            {/* User Info List */}
            <div className="w-full space-y-3.5">
              <div className={`p-4 rounded-2xl text-left border ${
                isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-gray-50 border-gray-100'
              }`}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Name</p>
                <p className="text-lg font-bold">{userName}</p>
              </div>

              <div className={`p-4 rounded-2xl text-left border ${
                isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-gray-50 border-gray-100'
              }`}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Username</p>
                <p className="text-base font-semibold text-[#0095f6]">@{userUsername}</p>
              </div>

              <div className={`p-4 rounded-2xl text-left border ${
                isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-gray-50 border-gray-100'
              }`}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">About / Bio</p>
                <p className="text-sm font-normal">{user.status || 'No bio set'}</p>
              </div>

              <div className={`p-4 rounded-2xl text-left border ${
                isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-gray-50 border-gray-100'
              }`}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Email</p>
                <p className="text-sm font-normal text-gray-400">{userEmail}</p>
              </div>
            </div>

            <button
              onClick={handleOpenEditModal}
              className="w-full mt-6 bg-[#0095f6] hover:bg-[#0081d6] text-white font-semibold py-3.5 rounded-2xl text-base shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Edit3 className="w-5 h-5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactive Photo Crop & Position Modal */}
      {showCropModal && rawImage && (
        <div className="fixed inset-0 z-50 bg-black/95 text-white flex flex-col h-full w-full overflow-hidden animate-fade-in font-sans">
          {/* Top Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-[#0b141a]">
            <h2 className="text-lg font-bold text-white">Adjust & Crop Photo</h2>
            <button
              onClick={() => setShowCropModal(false)}
              className="p-1.5 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Interactive Crop Viewport */}
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden select-none touch-none">
            {/* Viewport Mask Guide (Circular cutout) */}
            <div 
              className="relative w-[240px] h-[240px] rounded-full border-2 border-[#0095f6] shadow-[0_0_0_9999px_rgba(0,0,0,0.78)] z-10 pointer-events-none flex items-center justify-center"
            >
              <span className="absolute text-[11px] font-semibold text-white/90 bg-black/70 px-3 py-1 rounded-full -top-10 shadow-sm border border-white/10">
                Drag photo to position
              </span>
            </div>

            {/* Draggable/Zoomable Image Behind Mask */}
            <div
              className="absolute cursor-grab active:cursor-grabbing transition-transform duration-75"
              style={{
                transform: `translate(${cropPos.x}px, ${cropPos.y}px) rotate(${rotation}deg) scale(${zoom})`,
              }}
              onMouseDown={(e) => {
                isDraggingRef.current = true;
                dragStartRef.current = { x: e.clientX - cropPos.x, y: e.clientY - cropPos.y };
              }}
              onMouseMove={(e) => {
                if (isDraggingRef.current) {
                  setCropPos({
                    x: e.clientX - dragStartRef.current.x,
                    y: e.clientY - dragStartRef.current.y
                  });
                }
              }}
              onMouseUp={() => { isDraggingRef.current = false; }}
              onMouseLeave={() => { isDraggingRef.current = false; }}
              onTouchStart={(e) => {
                isDraggingRef.current = true;
                dragStartRef.current = { 
                  x: e.touches[0].clientX - cropPos.x, 
                  y: e.touches[0].clientY - cropPos.y 
                };
              }}
              onTouchMove={(e) => {
                if (isDraggingRef.current) {
                  setCropPos({
                    x: e.touches[0].clientX - dragStartRef.current.x,
                    y: e.touches[0].clientY - dragStartRef.current.y
                  });
                }
              }}
              onTouchEnd={() => { isDraggingRef.current = false; }}
            >
              <img
                src={rawImage}
                alt="Crop preview"
                className="max-w-none max-h-none pointer-events-none select-none"
                style={{ width: '280px', height: 'auto' }}
              />
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-[#111b21] border-t border-gray-800 px-6 py-5 flex flex-col gap-4">
            {/* Zoom Slider */}
            <div className="flex items-center gap-4">
              <ZoomOut className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-[#0095f6] h-1.5 bg-gray-700 rounded-lg cursor-pointer"
              />
              <ZoomIn className="w-5 h-5 text-gray-400 shrink-0" />
            </div>

            {/* Extra Controls: Rotate & Reset */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 transition-colors"
              >
                <RotateCw className="w-4 h-4 text-[#0095f6]" />
                <span>Rotate 90°</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                  setCropPos({ x: 0, y: 0 });
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
                <span>Reset</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCropModal(false)}
                className="flex-1 py-3.5 rounded-2xl bg-gray-800 hover:bg-gray-700 text-sm font-semibold text-gray-300 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={applyCrop}
                className="flex-1 py-3.5 rounded-2xl bg-[#0095f6] hover:bg-[#0081d6] text-sm font-semibold text-white shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Apply & Crop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings Modal View */}
      {showPrivacyModal && (
        <div className={`fixed inset-0 z-50 flex flex-col h-full w-full overflow-y-auto font-sans animate-fade-in transition-colors ${
          isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
        }`}>
          {/* Header */}
          <div className={`flex items-center gap-4 px-5 py-4 sticky top-0 z-10 border-b transition-colors ${
            isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-white border-gray-100'
          }`}>
            <button 
              onClick={() => setShowPrivacyModal(false)}
              className={`p-1.5 rounded-full transition-colors ${
                isDark ? 'text-[#8696a0] hover:bg-[#1f2c34] hover:text-[#e9edef]' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Privacy</h1>
          </div>

          {/* Privacy Options List */}
          <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full space-y-7">
            {/* Section 1: Who can see my personal info */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-[#8696a0]' : 'text-gray-800'}`}>
                Who can see my personal info
              </h3>

              <div className="space-y-1">
                {/* Last seen and online */}
                <button
                  onClick={() => setActivePrivacyItem({
                    id: 'lastSeen',
                    title: 'Last seen and online',
                    current: privacyLastSeen,
                    options: ['Everyone', 'My contacts', 'My contacts except...', 'Nobody']
                  })}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-colors text-left ${
                    isDark ? 'hover:bg-[#111b21]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Circle className={`w-5 h-5 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-600'}`} />
                    <div>
                      <p className={`text-base font-semibold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                        Last seen and online
                      </p>
                      <p className={`text-sm ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                        {privacyLastSeen}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`} />
                </button>

                {/* Profile picture */}
                <button
                  onClick={() => setActivePrivacyItem({
                    id: 'photo',
                    title: 'Profile picture',
                    current: privacyPhoto,
                    options: ['Everyone', 'My contacts', 'My contacts except...', 'Nobody']
                  })}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-colors text-left ${
                    isDark ? 'hover:bg-[#111b21]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <User className={`w-5 h-5 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-600'}`} />
                    <div>
                      <p className={`text-base font-semibold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                        Profile picture
                      </p>
                      <p className={`text-sm ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                        {privacyPhoto}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`} />
                </button>

                {/* About */}
                <button
                  onClick={() => setActivePrivacyItem({
                    id: 'about',
                    title: 'About',
                    current: privacyAbout,
                    options: ['Everyone', 'My contacts', 'My contacts except...', 'Nobody']
                  })}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-colors text-left ${
                    isDark ? 'hover:bg-[#111b21]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Info className={`w-5 h-5 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-600'}`} />
                    <div>
                      <p className={`text-base font-semibold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                        About
                      </p>
                      <p className={`text-sm ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                        {privacyAbout}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`} />
                </button>

                {/* Status */}
                <button
                  onClick={() => setActivePrivacyItem({
                    id: 'status',
                    title: 'Status',
                    current: privacyStatus,
                    options: ['My contacts', 'Only share with...']
                  })}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-colors text-left ${
                    isDark ? 'hover:bg-[#111b21]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Smile className={`w-5 h-5 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-600'}`} />
                    <div>
                      <p className={`text-base font-semibold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                        Status
                      </p>
                      <p className={`text-sm ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                        {privacyStatus}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`} />
                </button>
              </div>
            </div>

            {/* Section 2: Read receipts */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-[#8696a0]' : 'text-gray-800'}`}>
                Read receipts
              </h3>

              <div className={`flex items-start justify-between p-3.5 rounded-2xl transition-colors ${
                isDark ? 'hover:bg-[#111b21]' : 'hover:bg-gray-50'
              }`}>
                <div className="flex items-start gap-4 pr-3">
                  <CheckCheck className={`w-5 h-5 mt-0.5 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-600'}`} />
                  <div>
                    <p className={`text-base font-semibold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                      Read receipts
                    </p>
                    <p className={`text-sm leading-snug mt-0.5 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                      If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats.
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setReadReceipts(!readReceipts);
                    showSnack(`Read receipts turned ${!readReceipts ? 'ON' : 'OFF'}`);
                  }}
                  className={`w-12 h-7 shrink-0 rounded-full p-1 transition-colors relative focus:outline-none ${
                    readReceipts ? 'bg-[#00c853]' : (isDark ? 'bg-gray-700' : 'bg-gray-300')
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                    readReceipts ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Section 3: Blocked contacts */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-[#8696a0]' : 'text-gray-800'}`}>
                Disappearing messages & Security
              </h3>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setShowBlockedModal(true)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-colors text-left ${
                    isDark ? 'hover:bg-[#111b21]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Ban className={`w-5 h-5 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-600'}`} />
                    <div>
                      <p className={`text-base font-semibold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                        Blocked contacts
                      </p>
                      <p className={`text-sm ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                        {blockedContactIds.length === 0 
                          ? 'None' 
                          : `${blockedContactIds.length} ${blockedContactIds.length === 1 ? 'contact' : 'contacts'}`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Contacts View Modal */}
      {showBlockedModal && (
        <div className={`fixed inset-0 z-50 flex flex-col h-full w-full overflow-y-auto font-sans animate-fade-in transition-colors ${
          isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 sticky top-0 z-10 border-b transition-colors ${
            isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowBlockedModal(false)}
                className={`p-1.5 rounded-full transition-colors ${
                  isDark ? 'text-[#8696a0] hover:bg-[#1f2c34] hover:text-[#e9edef]' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold">Blocked contacts</h1>
            </div>

            <button
              onClick={() => {
                setBlockSearch('');
                setShowAddBlockContactModal(true);
              }}
              className="p-2 rounded-full bg-[#0095f6]/10 text-[#0095f6] hover:bg-[#0095f6]/20 transition-colors flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Block Contact</span>
            </button>
          </div>

          <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full">
            <p className={`text-xs mb-6 px-1 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
              Blocked contacts will no longer be able to call you or send you messages.
            </p>

            {/* Blocked Users List */}
            {blockedContactIds.length > 0 ? (
              <div className="space-y-3">
                {blockedContactIds.map(blockedId => {
                  const u = contacts.find(c => c.id === blockedId) || 
                            allRegisteredUsers.find((r: any) => (r.uid || r.id) === blockedId);
                  const name = u?.name || u?.displayName || u?.username || 'Blocked Contact';
                  const username = u?.username ? `@${u.username}` : '';
                  const avatar = u?.avatar || u?.photoURL;
                  const about = u?.about || u?.status || 'Available on CalcChat';
                  return (
                    <div 
                      key={blockedId}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {avatar ? (
                          <img 
                            src={avatar} 
                            alt={name} 
                            className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-500/20"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                            isDark ? 'bg-[#1f2c34] text-[#e9edef]' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {name ? name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className={`font-semibold text-base truncate ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                            {name}
                          </p>
                          {username && (
                            <p className={`text-xs truncate ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                              {username}
                            </p>
                          )}
                          <p className={`text-xs truncate ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                            {about}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          unblockContact(blockedId);
                          showSnack(`Unblocked ${name}`);
                        }}
                        className="ml-3 px-3.5 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                      >
                        Unblock
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                  isDark ? 'bg-[#111b21] text-[#8696a0]' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Ban className="w-10 h-10 stroke-[1.5]" />
                </div>
                <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                  No blocked contacts
                </h3>
                <p className={`text-xs max-w-xs mb-6 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                  You haven't added anyone to your block list yet.
                </p>
                <button
                  onClick={() => {
                    setBlockSearch('');
                    setShowAddBlockContactModal(true);
                  }}
                  className="bg-[#0095f6] hover:bg-[#0081d6] text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Block a contact</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Select Contact to Block Modal */}
      {showAddBlockContactModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className={`w-full max-w-md rounded-3xl p-5 border shadow-2xl flex flex-col max-h-[85vh] transition-colors ${
            isDark ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/10">
              <h3 className="font-bold text-lg">Select contact to block</h3>
              <button 
                onClick={() => setShowAddBlockContactModal(false)}
                className="p-1 rounded-full opacity-70 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mt-4 mb-3 relative">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-[#8696a0]' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search contacts..."
                value={blockSearch}
                onChange={e => setBlockSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none ${
                  isDark ? 'bg-[#1f2c34] text-[#e9edef] border border-[#2a3942]' : 'bg-gray-100 text-gray-900 border-none'
                }`}
              />
            </div>

            {/* Contacts list */}
            <div className="flex-1 overflow-y-auto space-y-1 my-1 pr-1">
              {contacts
                .filter(c => !blockedContactIds.includes(c.id))
                .filter(c => c.name.toLowerCase().includes(blockSearch.toLowerCase()))
                .map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      blockContact(c.id);
                      showSnack(`${c.name} blocked`);
                      setShowAddBlockContactModal(false);
                    }}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-colors ${
                      isDark ? 'hover:bg-[#1f2c34]' : 'hover:bg-gray-100'
                    }`}
                  >
                    {c.avatar ? (
                      <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        isDark ? 'bg-[#1f2c34] text-[#e9edef]' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      <p className={`text-xs truncate ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                        {c.status || 'Contact'}
                      </p>
                    </div>
                    <Ban className="w-4 h-4 text-red-400 opacity-60 hover:opacity-100 shrink-0" />
                  </button>
                ))}

              {contacts.filter(c => !blockedContactIds.includes(c.id)).length === 0 && (
                <p className="text-center py-8 text-xs text-gray-400">
                  No contacts available to block.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAddBlockContactModal(false)}
              className="mt-3 py-2.5 text-center text-sm font-medium text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sub-option Selector Modal (e.g. Choose Everyone / My Contacts) */}
      {activePrivacyItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 border shadow-2xl transition-colors ${
            isDark ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200/10">
              <h3 className="font-bold text-base">{activePrivacyItem.title}</h3>
              <button 
                onClick={() => setActivePrivacyItem(null)}
                className="p-1 rounded-full opacity-70 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              {activePrivacyItem.options.map((option) => {
                const isSelected = activePrivacyItem.current === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (activePrivacyItem.id === 'lastSeen') setPrivacyLastSeen(option);
                      if (activePrivacyItem.id === 'photo') setPrivacyPhoto(option);
                      if (activePrivacyItem.id === 'about') setPrivacyAbout(option);
                      if (activePrivacyItem.id === 'status') setPrivacyStatus(option);
                      showSnack(`${activePrivacyItem.title} updated`);
                      setActivePrivacyItem(null);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left text-sm font-medium transition-colors ${
                      isSelected 
                        ? 'bg-[#0095f6]/10 text-[#0095f6] font-semibold' 
                        : (isDark ? 'hover:bg-[#1f2c34] text-[#e9edef]' : 'hover:bg-gray-100 text-gray-800')
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#0095f6]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* App Creator Modal */}
      {showCreatorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl transition-colors relative overflow-hidden ${
            isDark ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <button 
              onClick={() => setShowCreatorModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center pt-2 pb-1">
              <div className="mb-3 flex justify-center">
                <CCLogo className="w-16 h-16" />
              </div>
              <div className="mb-2">
                <CalcChatTitle size="md" />
              </div>

              <h2 className="text-[#0095f6] font-bold text-sm mb-1">App Creator</h2>
              <p className={`text-xs font-medium mb-5 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                CalcChat Vault & Secure Messaging Platform
              </p>

              <div className={`w-full rounded-2xl p-4 mb-5 border text-left space-y-3 ${
                isDark ? 'bg-[#1f2c34]/60 border-[#2a3942]' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>Developer:</span>
                  <span className="text-xs font-semibold text-[#0095f6]">Vicky Ashok Bhelave</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-500/10 pt-2">
                  <span className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>App Name:</span>
                  <span className="text-xs font-semibold">CalcChat Vault Messenger</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-500/10 pt-2">
                  <span className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>Version:</span>
                  <span className="text-xs font-semibold">v2.5.0</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center mb-6">
                {['React 18', 'TypeScript', 'Tailwind CSS', 'Gemini AI'].map(tech => (
                  <span 
                    key={tech}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                      isDark 
                        ? 'bg-[#1f2c34] border-[#2a3942] text-[#8696a0]' 
                        : 'bg-gray-100 border-gray-200 text-gray-600'
                    }`}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setShowCreatorModal(false)}
                className="w-full bg-[#0095f6] hover:bg-[#0081d6] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Settings Modal View */}
      {showAccountModal && (
        <div className={`fixed inset-0 z-50 flex flex-col h-full w-full overflow-y-auto font-sans animate-fade-in transition-colors ${
          isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
        }`}>
          {/* Header */}
          <div className={`flex items-center gap-4 px-5 py-4 sticky top-0 z-10 border-b transition-colors ${
            isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-white border-gray-100'
          }`}>
            <button 
              onClick={() => setShowAccountModal(false)}
              className={`p-1.5 rounded-full transition-colors ${
                isDark ? 'text-[#8696a0] hover:bg-[#1f2c34] hover:text-[#e9edef]' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Account</h1>
          </div>

          <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full space-y-6">
            {/* Account Info Box */}
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-gray-50 border-gray-100'
            }`}>
              <p className="text-xs font-semibold text-[#0095f6] uppercase tracking-wider mb-2">Account Information</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-[#8696a0]' : 'text-gray-500'}>Name:</span>
                  <span className="font-semibold">{userName}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-500/10 pt-2">
                  <span className={isDark ? 'text-[#8696a0]' : 'text-gray-500'}>Username:</span>
                  <span className="font-semibold text-[#0095f6]">@{userUsername}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-500/10 pt-2">
                  <span className={isDark ? 'text-[#8696a0]' : 'text-gray-500'}>Email:</span>
                  <span className="font-normal text-xs text-gray-400">{userEmail}</span>
                </div>
              </div>
            </div>

            {/* Account Security Section */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-[#8696a0]' : 'text-gray-800'}`}>
                Security & Passcode
              </h3>

              <div className="space-y-2">
                {/* Change Password / PIN Option */}
                <button
                  type="button"
                  onClick={() => {
                    setNewPasscode('');
                    setConfirmPasscode('');
                    setPassError(null);
                    setShowChangePasscodeModal(true);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors text-left border ${
                    isDark 
                      ? 'bg-[#111b21] border-[#1f2c34] hover:bg-[#1f2c34]' 
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-[#0095f6]/10 text-[#0095f6]">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-base font-semibold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                        Change Password / PIN
                      </p>
                      <p className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                        Update your vault password or secret calculator passcode
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password / PIN Sub Modal */}
      {showChangePasscodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl transition-colors ${
            isDark ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-500/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#0095f6]/10 text-[#0095f6]">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">Change Password</h3>
              </div>
              <button 
                onClick={() => setShowChangePasscodeModal(false)}
                className="p-1 rounded-full opacity-70 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const cleanNew = newPasscode.trim();
                const cleanConfirm = confirmPasscode.trim();

                if (!cleanNew) {
                  setPassError('Please enter a new password or PIN');
                  return;
                }
                if (cleanNew.length < 4) {
                  setPassError('Password must be at least 4 characters');
                  return;
                }
                if (cleanNew !== cleanConfirm) {
                  setPassError('Passwords do not match');
                  return;
                }

                try {
                  setIsSubmittingPass(true);
                  setPassError(null);
                  await completeChatPasswordSetup(cleanNew);
                  setShowChangePasscodeModal(false);
                  showSnack('Password updated successfully! Next time log in with your new password.');
                } catch (err: any) {
                  setPassError(err.message || 'Failed to update password');
                } finally {
                  setIsSubmittingPass(false);
                }
              }}
              className="space-y-4"
            >
              {/* New Password Input */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#8696a0]' : 'text-gray-700'}`}>
                  Enter New Password / PIN
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newPasscode}
                    onChange={(e) => {
                      const numericOnly = e.target.value.replace(/\D/g, '');
                      setNewPasscode(numericOnly);
                      setPassError(null);
                    }}
                    placeholder="Enter new PIN (numbers only)"
                    className={`w-full rounded-2xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0095f6] font-normal transition-all ${
                      isDark 
                        ? 'bg-[#1f2c34] text-[#e9edef] placeholder-[#8696a0] border border-[#2a3942]' 
                        : 'bg-gray-100 text-gray-900 placeholder-gray-400 border-none'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 text-gray-400 hover:text-gray-200 p-1"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#8696a0]' : 'text-gray-700'}`}>
                  Confirm Password / PIN
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={confirmPasscode}
                    onChange={(e) => {
                      const numericOnly = e.target.value.replace(/\D/g, '');
                      setConfirmPasscode(numericOnly);
                      setPassError(null);
                    }}
                    placeholder="Re-enter new PIN"
                    className={`w-full rounded-2xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0095f6] font-normal transition-all ${
                      newPasscode && confirmPasscode && newPasscode === confirmPasscode
                        ? 'border-2 border-emerald-500'
                        : isDark 
                        ? 'bg-[#1f2c34] text-[#e9edef] placeholder-[#8696a0] border border-[#2a3942]' 
                        : 'bg-gray-100 text-gray-900 placeholder-gray-400 border-none'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 text-gray-400 hover:text-gray-200 p-1"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {newPasscode.length >= 4 && confirmPasscode.length >= 4 && newPasscode === confirmPasscode && (
                  <p className="mt-1.5 text-xs text-emerald-500 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Passwords match</span>
                  </p>
                )}
              </div>

              {/* Error Message */}
              {passError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {/* Save & Apply Button */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowChangePasscodeModal(false)}
                  className="flex-1 py-3 rounded-2xl font-semibold text-sm bg-gray-500/10 hover:bg-gray-500/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPasscode || newPasscode.length < 4 || newPasscode !== confirmPasscode || isSubmittingPass}
                  className="flex-1 py-3 rounded-2xl font-semibold text-sm bg-[#0095f6] hover:bg-[#0081d6] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  {isSubmittingPass ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chats Settings Modal View */}
      {showChatsModal && (
        <div className={`fixed inset-0 z-50 flex flex-col h-full w-full overflow-y-auto font-sans animate-fade-in transition-colors ${
          isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
        }`}>
          {/* Header */}
          <div className={`flex items-center gap-4 px-5 py-4 sticky top-0 z-10 border-b transition-colors ${
            isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-white border-gray-100'
          }`}>
            <button 
              onClick={() => setShowChatsModal(false)}
              className={`p-1.5 rounded-full transition-colors ${
                isDark ? 'text-[#8696a0] hover:bg-[#1f2c34] hover:text-[#e9edef]' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Chats</h1>
          </div>

          <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full space-y-7">
            {/* Theme Section */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-[#8696a0]' : 'text-gray-800'}`}>
                Theme
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Light Option */}
                <button
                  type="button"
                  onClick={() => {
                    updateVaultSettings({ theme: 'material-light' });
                    showSnack('Light theme applied');
                  }}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all h-32 cursor-pointer ${
                    !isDark 
                      ? 'border-[#0095f6] bg-[#f0f8ff]' 
                      : (isDark ? 'border-[#1f2c34] bg-[#111b21] hover:border-gray-600' : 'border-gray-200 bg-white')
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-300 mb-2 shadow-sm flex items-center justify-center">
                    <div className="w-7 h-7 rounded-md bg-white border border-gray-200"></div>
                  </div>
                  <span className={`text-sm font-bold ${!isDark ? 'text-[#0095f6]' : (isDark ? 'text-[#e9edef]' : 'text-gray-900')}`}>
                    Light
                  </span>
                </button>

                {/* Dark Option */}
                <button
                  type="button"
                  onClick={() => {
                    updateVaultSettings({ theme: 'material-dark' });
                    showSnack('Dark theme applied');
                  }}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all h-32 cursor-pointer ${
                    isDark 
                      ? 'border-[#0095f6] bg-[#111b21]' 
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#1f2c34] border border-[#2a3942] mb-2 shadow-sm flex items-center justify-center">
                    <div className="w-7 h-7 rounded-md bg-[#0b141a]"></div>
                  </div>
                  <span className={`text-sm font-bold ${isDark ? 'text-[#0095f6]' : 'text-gray-900'}`}>
                    Dark
                  </span>
                </button>
              </div>
            </div>

            {/* Wallpaper Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold ${isDark ? 'text-[#8696a0]' : 'text-gray-800'}`}>
                  Chat Wallpaper
                </h3>
                {vaultSettings?.chatWallpaper && vaultSettings.chatWallpaper !== 'default' && (
                  <button
                    type="button"
                    onClick={() => {
                      updateVaultSettings({ chatWallpaper: 'default' });
                      showSnack('Reset to default wallpaper');
                    }}
                    className="text-xs text-[#0095f6] hover:underline font-medium cursor-pointer"
                  >
                    Reset to Default
                  </button>
                )}
              </div>

              {/* Current Active Wallpaper Preview */}
              {vaultSettings?.chatWallpaper && vaultSettings.chatWallpaper !== 'default' && (
                <div className={`mb-4 p-3 rounded-2xl border flex items-center gap-3 ${
                  isDark ? 'bg-[#111b21] border-[#2a3942]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div 
                    className="w-14 h-14 rounded-xl border border-gray-300 shadow-sm shrink-0 overflow-hidden relative"
                    style={
                      vaultSettings.chatWallpaper.startsWith('data:') || vaultSettings.chatWallpaper.startsWith('http') || vaultSettings.chatWallpaper.startsWith('blob:')
                        ? { backgroundImage: `url("${vaultSettings.chatWallpaper}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { backgroundColor: vaultSettings.chatWallpaper }
                    }
                  >
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                      Active Custom Wallpaper
                    </p>
                    <p className={`text-[11px] truncate ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                      Applied to all personal and group chats
                    </p>
                  </div>
                </div>
              )}

              {/* Live Chat Wallpaper Preview Button */}
              <button
                type="button"
                onClick={() => {
                  setPreviewWallpaperChoice(vaultSettings?.chatWallpaper);
                  setShowWallpaperModal(true);
                }}
                className="w-full mb-4 py-3 px-4 rounded-2xl bg-[#00a8ff]/15 hover:bg-[#00a8ff]/25 border border-[#00a8ff]/40 text-[#00a8ff] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
              >
                <Palette className="w-4 h-4" />
                <span>Live Chat Preview & Wallpaper Filters</span>
              </button>

              {/* Vertical Portrait Wallpaper Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 mb-4 p-1">
                {[
                  ...GET_PRESET_WALLPAPERS(isDark),
                  ...(adminWallpapers || []).map((wp, idx) => ({
                    id: wp.id,
                    name: wp.name || `Admin Wallpaper ${idx + 1}`,
                    bg: wp.url,
                    color: wp.color || '#1e293b',
                    isImage: true,
                    isAdminAdded: true,
                  }))
                ].map((swatch, idx) => {
                  const isSelected = 
                    (swatch.bg === 'default' && (!vaultSettings?.chatWallpaper || vaultSettings?.chatWallpaper === 'default')) ||
                    vaultSettings?.chatWallpaper === swatch.bg;

                  const isImage = swatch.isImage || swatch.bg.startsWith('data:') || swatch.bg.startsWith('http') || swatch.bg.startsWith('blob:');

                  return (
                    <div key={swatch.id || swatch.name || idx} className="flex flex-col gap-1.5 relative group">
                      <button
                        type="button"
                        title={swatch.name}
                        onClick={() => {
                          setPreviewWallpaperChoice(swatch.bg);
                          setShowWallpaperModal(true);
                        }}
                        className={`w-full aspect-[9/16] rounded-[22px] border-2 transition-all cursor-pointer relative overflow-hidden shadow-md group ${
                          isSelected 
                            ? 'border-[#00a8ff] ring-3 ring-[#00a8ff]/40 scale-[1.02] shadow-xl z-10' 
                            : isDark ? 'border-transparent hover:border-gray-500' : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={
                          !isImage && swatch.bg === 'default'
                            ? { backgroundColor: isDark ? '#0b141a' : '#efeae2' }
                            : !isImage
                            ? { backgroundColor: swatch.color }
                            : undefined
                        }
                      >
                        {isImage ? (
                          <img 
                            src={swatch.bg} 
                            alt={swatch.name} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                            loading="lazy" 
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col justify-between p-3">
                            <span className="px-2 py-0.5 bg-black/40 text-white/80 text-[9px] font-semibold rounded-full w-fit backdrop-blur-xs">
                              Solid
                            </span>
                            <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-xl text-white text-[11px] font-semibold text-center truncate">
                              {swatch.name}
                            </div>
                          </div>
                        )}

                        {isSelected && (
                          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#00a8ff] text-white flex items-center justify-center shadow-lg border border-white/30 z-20">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex items-center gap-1 z-10">
                          {swatch.isAdminAdded ? (
                            <span className="px-2 py-0.5 bg-[#00a8ff] text-[#0b141a] text-[9px] font-black rounded-md uppercase tracking-wider shadow">
                              ADMIN
                            </span>
                          ) : isImage ? (
                            <span className="px-2 py-0.5 bg-black/50 text-white text-[9px] font-black tracking-wider rounded-md backdrop-blur-md border border-white/10 shadow">
                              HD
                            </span>
                          ) : null}
                        </div>
                      </button>

                      {/* Title and Three Dots Option Bar like Image 2 */}
                      <div className="flex items-center justify-between px-1.5">
                        <span className={`text-[11px] font-medium truncate max-w-[80%] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {swatch.name}
                        </span>
                        <button type="button" className="text-gray-400 hover:text-white p-0.5 cursor-pointer">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      {isAdmin && swatch.isAdminAdded && swatch.id && (
                        <button
                          type="button"
                          title="Delete Admin Wallpaper"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Remove "${swatch.name}" from global wallpapers?`)) {
                              await deleteAdminWallpaper(swatch.id);
                              showSnack('Admin wallpaper deleted');
                            }
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-all z-30"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Upload Custom Wallpaper Button (Admin Only) */}
              {isAdmin && (
                <>
                  <input
                    ref={wallpaperInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          if (event.target?.result) {
                            const raw = event.target.result as string;
                            const compressed = await compressImage(raw, 800, 200000);
                            updateVaultSettings({ chatWallpaper: compressed || raw });
                            triggerSuccessOverlay('Wallpaper Set!');
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => wallpaperInputRef.current?.click()}
                      className={`w-full p-3.5 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 transition-colors text-xs font-semibold cursor-pointer ${
                        isDark 
                          ? 'border-[#2a3942] hover:border-gray-500 text-[#8696a0] hover:text-[#e9edef] bg-[#111b21]' 
                          : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900 bg-gray-50'
                      }`}
                    >
                      <Camera className="w-4 h-4 text-[#0095f6]" />
                      <span>Upload custom image from device</span>
                    </button>

                    {/* Custom Image URL Input */}
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customWallpaperUrl}
                        onChange={(e) => setCustomWallpaperUrl(e.target.value)}
                        placeholder="Or paste wallpaper image URL..."
                        className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                          isDark 
                            ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef] placeholder-[#8696a0] focus:border-[#0095f6]' 
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0095f6]'
                        }`}
                      />
                      <button
                        type="button"
                        disabled={!customWallpaperUrl.trim()}
                        onClick={() => {
                          if (customWallpaperUrl.trim()) {
                            updateVaultSettings({ chatWallpaper: customWallpaperUrl.trim() });
                            triggerSuccessOverlay('Wallpaper Set!');
                            setCustomWallpaperUrl('');
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#0088cc] disabled:opacity-40 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
                      >
                        Apply URL
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Chat History Section */}
            <div>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-[#8696a0]' : 'text-gray-800'}`}>
                Chat History
              </h3>

              <button
                type="button"
                onClick={() => setShowClearHistoryConfirmModal(true)}
                className={`w-full p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                  isDark 
                    ? 'border-red-900/40 bg-red-950/20 hover:bg-red-950/30' 
                    : 'border-red-200 bg-red-50/50 hover:bg-red-50'
                }`}
              >
                <p className="text-sm font-bold text-red-500 mb-1">
                  Clear Chat History
                </p>
                <p className={`text-xs ${isDark ? 'text-red-400/70' : 'text-red-600/80'}`}>
                  Delete all chat messages permanently
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className={`fixed inset-0 z-50 flex flex-col h-full w-full overflow-y-auto font-sans animate-fade-in transition-colors ${
          isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
        }`}>
          {/* Top Header */}
          <div className={`sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b ${
            isDark ? 'bg-[#0b141a] border-[#1f2c34]' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className={`p-1.5 rounded-full transition-colors ${
                  isDark ? 'hover:bg-[#1f2c34] text-[#e9edef]' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-center flex-1 sm:text-left">Notifications</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowNotificationsModal(false)}
              className={`p-1.5 rounded-full transition-colors ${
                isDark ? 'hover:bg-[#1f2c34] text-[#8696a0]' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Settings List */}
          <div className="flex-1 max-w-2xl mx-auto w-full divide-y divide-gray-100 dark:divide-[#1f2c34]/60 px-4 py-2">
            
            {/* 1. Messages */}
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MessageSquare className={`w-6 h-6 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-700'}`} />
                <div>
                  <h3 className={`text-base font-semibold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                    Messages
                  </h3>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                    {notifyMessages ? 'On' : 'Off'}
                  </p>
                </div>
              </div>

              {/* Blue Switch Toggle */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !notifyMessages;
                  setNotifyMessages(nextVal);
                  localStorage.setItem('calcchat_global_notify_messages', String(nextVal));
                  showSnack(`Messages notifications turned ${nextVal ? 'On' : 'Off'}`);
                }}
                className={`w-12 h-7 shrink-0 rounded-full p-1 transition-colors relative focus:outline-none cursor-pointer ${
                  notifyMessages ? 'bg-[#0095f6]' : (isDark ? 'bg-gray-700' : 'bg-gray-300')
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  notifyMessages ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* 2. Group Calls / Notifications */}
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Users className={`w-6 h-6 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-700'}`} />
                <div>
                  <h3 className={`text-base font-semibold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                    Group Calls / Notifications
                  </h3>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                    {notifyGroups ? 'On' : 'Off'}
                  </p>
                </div>
              </div>

              {/* Blue Switch Toggle */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !notifyGroups;
                  setNotifyGroups(nextVal);
                  localStorage.setItem('calcchat_global_notify_groups', String(nextVal));
                  showSnack(`Groups notifications turned ${nextVal ? 'On' : 'Off'}`);
                }}
                className={`w-12 h-7 shrink-0 rounded-full p-1 transition-colors relative focus:outline-none cursor-pointer ${
                  notifyGroups ? 'bg-[#0095f6]' : (isDark ? 'bg-gray-700' : 'bg-gray-300')
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  notifyGroups ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* 3. Status */}
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Circle className={`w-6 h-6 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-700'}`} />
                <div>
                  <h3 className={`text-base font-semibold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                    Status
                  </h3>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                    {notifyStatus ? 'On' : 'Off'}
                  </p>
                </div>
              </div>

              {/* Blue Switch Toggle */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !notifyStatus;
                  setNotifyStatus(nextVal);
                  localStorage.setItem('calcchat_global_notify_status', String(nextVal));
                  showSnack(`Status notifications turned ${nextVal ? 'On' : 'Off'}`);
                }}
                className={`w-12 h-7 shrink-0 rounded-full p-1 transition-colors relative focus:outline-none cursor-pointer ${
                  notifyStatus ? 'bg-[#0095f6]' : (isDark ? 'bg-gray-700' : 'bg-gray-300')
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  notifyStatus ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* 4. Calls */}
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Phone className={`w-6 h-6 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-700'}`} />
                <div>
                  <h3 className={`text-base font-semibold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                    Calls
                  </h3>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                    {notifyCalls ? 'On' : 'Off'}
                  </p>
                </div>
              </div>

              {/* Blue Switch Toggle */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !notifyCalls;
                  setNotifyCalls(nextVal);
                  localStorage.setItem('calcchat_global_notify_calls', String(nextVal));
                  showSnack(`Calls notifications turned ${nextVal ? 'On' : 'Off'}`);
                }}
                className={`w-12 h-7 shrink-0 rounded-full p-1 transition-colors relative focus:outline-none cursor-pointer ${
                  notifyCalls ? 'bg-[#0095f6]' : (isDark ? 'bg-gray-700' : 'bg-gray-300')
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  notifyCalls ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal to Clear Chat History */}
      {showClearHistoryConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl transition-colors ${
            isDark ? 'bg-[#111b21] border-[#2a3942] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center gap-3 mb-3 text-red-500">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg">Clear Chat History?</h3>
            </div>

            <p className={`text-sm mb-6 ${isDark ? 'text-[#8696a0]' : 'text-gray-600'}`}>
              Are you sure you want to permanently delete all chat messages from all conversations? This action cannot be undone.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearHistoryConfirmModal(false)}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                  isDark ? 'bg-[#1f2c34] hover:bg-[#2a3942] text-[#e9edef]' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllChatHistory();
                  setShowClearHistoryConfirmModal(false);
                  showSnack('All chat history deleted permanently');
                }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors shadow-md"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Modal */}
      {showAdminModal && (
        <div className={`fixed inset-0 z-50 flex flex-col h-full w-full overflow-y-auto font-sans animate-fade-in transition-colors ${
          isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
        }`}>
          {/* Admin Header */}
          <div className={`flex items-center justify-between px-5 py-4 sticky top-0 z-10 border-b transition-colors ${
            isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowAdminModal(false)}
                className={`p-1.5 rounded-full transition-colors ${
                  isDark ? 'text-[#8696a0] hover:bg-[#1f2c34] hover:text-[#e9edef]' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-400" />
                <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Admin Panel
                </h1>
              </div>
            </div>

            <span className="px-3 py-1 bg-[#00a8ff]/10 text-[#00a8ff] text-xs font-bold rounded-full border border-[#00a8ff]/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
            </span>
          </div>

          <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full space-y-6">
            {/* Admin Profile Overview Card */}
            <div className={`p-5 rounded-3xl border shadow-lg ${
              isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {user.avatar ? (
                    <img src={user.avatar} alt={userName} className="w-16 h-16 rounded-full object-cover border-2 border-[#00a8ff]" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#1e293b] text-[#00a8ff] font-bold text-2xl flex items-center justify-center border-2 border-[#00a8ff]">
                      {userName.charAt(0)}
                    </div>
                  )}
                  <span className="w-4 h-4 bg-[#00a8ff] border-2 border-[#0b141a] rounded-full absolute bottom-0 right-0"></span>
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <h3 className="font-bold text-lg flex items-center gap-1.5 truncate">
                    <span className="truncate">{userName}</span>
                    <VerifiedBadge className="w-5 h-5 shrink-0" />
                  </h3>
                  <p className="text-xs text-[#00a8ff] font-semibold truncate">@{userUsername}</p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{authUser?.email || user.email || 'vickybhelave25@navgurukul.org'}</p>
                </div>
              </div>

              {/* Followers & Verification Info */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#202c33] grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 rounded-2xl bg-[#0b141a]/40 border border-[#202c33]">
                  <p className="text-xs text-gray-400 font-medium">Followers Count</p>
                  <p className="text-lg font-black text-[#00a8ff]">2K Followers</p>
                  <p className="text-[10px] text-amber-400 font-medium mt-0.5">🔒 Private & Hidden</p>
                </div>

                <div className="p-2.5 rounded-2xl bg-[#0b141a]/40 border border-[#202c33]">
                  <p className="text-xs text-gray-400 font-medium">Verified Status</p>
                  <p className="text-lg font-black text-emerald-400 flex items-center justify-center gap-1">
                    <VerifiedBadge className="w-4 h-4" /> Active
                  </p>
                  <p className="text-[10px] text-emerald-400/80 font-medium mt-0.5">Blue Tick On</p>
                </div>
              </div>
            </div>

            {/* User Search & Grant Blue Tick Section */}
            <div className={`p-5 rounded-3xl border shadow-lg ${
              isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm text-left flex items-center gap-2 text-white">
                  <BadgeCheck className="w-5 h-5 text-[#00a8ff]" /> Search & Grant Blue Tick
                </h4>
                <button
                  type="button"
                  onClick={loadAdminUsers}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Refresh Users"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingAdminUsers ? 'animate-spin text-[#00a8ff]' : ''}`} />
                </button>
              </div>

              <p className="text-xs text-gray-400 text-left mb-3">
                Search any registered user by name or username to grant or remove their verified blue tick.
              </p>

              {/* Search Bar Input */}
              <div className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 border mb-3 transition-colors ${
                isDark ? 'bg-[#0b141a] border-[#202c33] text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}>
                <Search className="w-4 h-4 text-[#00a8ff] shrink-0" />
                <input
                  type="text"
                  value={adminUserSearch}
                  onChange={(e) => setAdminUserSearch(e.target.value)}
                  placeholder="Type user name or @username..."
                  className="w-full bg-transparent text-xs sm:text-sm focus:outline-none placeholder-gray-500"
                />
                {adminUserSearch && (
                  <button type="button" onClick={() => setAdminUserSearch('')} className="cursor-pointer">
                    <X className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                )}
              </div>

              {/* Users Search Results List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {isLoadingAdminUsers ? (
                  <div className="py-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#00a8ff]" /> Loading users database...
                  </div>
                ) : (() => {
                  const filtered = adminUsersList.filter((u) => {
                    const q = adminUserSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      u.name.toLowerCase().includes(q) ||
                      u.username.toLowerCase().includes(q) ||
                      u.email.toLowerCase().includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <p className="text-xs text-gray-400 py-6 text-center">
                        {adminUserSearch ? `No users matching "${adminUserSearch}"` : 'No users found'}
                      </p>
                    );
                  }

                  return filtered.map((u) => (
                    <div
                      key={u.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-colors ${
                        isDark ? 'bg-[#0b141a] border-[#202c33]' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#00a8ff]/30 shadow-xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#1e293b] text-[#00a8ff] font-bold text-sm flex items-center justify-center shrink-0 border border-[#00a8ff]/30">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1">
                            <span className="truncate">{u.name}</span>
                            {u.isVerified && <VerifiedBadge className="w-4 h-4 shrink-0" />}
                          </p>
                          <p className="text-[11px] text-[#00a8ff] font-medium truncate">
                            @{u.username || 'user'}
                          </p>
                          {u.email && (
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{u.email}</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleBlueTick(u)}
                        className={`ml-2 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                          u.isVerified
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                            : 'bg-[#00a8ff] text-[#0b141a] hover:bg-[#0091ea] shadow-xs'
                        }`}
                      >
                        {u.isVerified ? (
                          <>Remove Tick</>
                        ) : (
                          <>
                            <VerifiedBadge className="w-3.5 h-3.5" /> Give Blue Tick
                          </>
                        )}
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Configured Admin Emails List */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className="font-bold text-sm mb-3 text-left flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00a8ff]" /> Designated Admin Emails
              </h4>

              <div className="space-y-2 text-left">
                {ADMIN_EMAILS.map((emailItem) => (
                  <div key={emailItem} className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b141a] border border-[#202c33] text-xs">
                    <span className="font-semibold text-gray-200">{emailItem}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">VERIFIED ADMIN</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Features Control Panel */}
            <div className={`p-5 rounded-3xl border space-y-3 ${
              isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className="font-bold text-sm text-left flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-[#00a8ff]" /> Privacy & Badge Rules
              </h4>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0b141a] border border-[#202c33] text-xs text-left">
                <div>
                  <p className="font-bold text-white">Blue Verified Badge</p>
                  <p className="text-gray-400 text-[11px]">Displays on all admin profiles and chats</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#00a8ff]/20 text-[#00a8ff] font-bold text-xs">ENABLED</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0b141a] border border-[#202c33] text-xs text-left">
                <div>
                  <p className="font-bold text-white">Followers Count Display</p>
                  <p className="text-gray-400 text-[11px]">Locked to 2K for Admin accounts</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#00a8ff]/20 text-[#00a8ff] font-bold text-xs">2K LOCKED</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0b141a] border border-[#202c33] text-xs text-left">
                <div>
                  <p className="font-bold text-white">Hide Followers List</p>
                  <p className="text-gray-400 text-[11px]">Only admin following list is viewable</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">PROTECTED</span>
              </div>
            </div>

            {/* Admin Wallpaper Management Card */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm text-left flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#00a8ff]" /> Admin Preset Wallpapers
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-[#00a8ff]/20 text-[#00a8ff] text-[10px] font-bold">
                  {adminWallpapers.length} Wallpapers
                </span>
              </div>
              <p className="text-xs text-gray-400 text-left mb-3">
                Upload wallpapers here to add them to all users' chat wallpaper selection swatches.
              </p>

              <input
                ref={adminWpInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setIsAddingAdminWp(true);
                    try {
                      const compressed = await compressImage(file, 800, 150000);
                      const title = adminWpTitle.trim() || file.name.split('.')[0] || 'Admin Wallpaper';
                      await addAdminWallpaper(title, compressed);
                      showSnack('Admin wallpaper added successfully!');
                      setAdminWpTitle('');
                      setAdminWpUrl('');
                    } catch (err: any) {
                      console.error('Error uploading admin wallpaper:', err);
                      showSnack('Failed to add wallpaper: ' + (err?.message || 'Error'));
                    } finally {
                      setIsAddingAdminWp(false);
                      if (e.target) e.target.value = '';
                    }
                  }
                }}
              />

              <div className="space-y-2 mb-4">
                <input
                  type="text"
                  value={adminWpTitle}
                  onChange={(e) => setAdminWpTitle(e.target.value)}
                  placeholder="Wallpaper Title (e.g. Sunset Glow)"
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-[#0b141a] border-[#202c33] text-white focus:border-[#00a8ff]' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isAddingAdminWp}
                    onClick={() => adminWpInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#00a8ff]/10 hover:bg-[#00a8ff]/20 text-[#00a8ff] border border-[#00a8ff]/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isAddingAdminWp ? 'Uploading...' : 'Upload Image File'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={!adminWpUrl.trim() || isAddingAdminWp}
                    onClick={async () => {
                      if (!adminWpUrl.trim()) return;
                      setIsAddingAdminWp(true);
                      try {
                        await addAdminWallpaper(adminWpTitle || 'Admin Wallpaper', adminWpUrl.trim());
                        showSnack('Admin wallpaper added from URL!');
                        setAdminWpTitle('');
                        setAdminWpUrl('');
                      } catch (err) {
                        showSnack('Failed to add wallpaper');
                      } finally {
                        setIsAddingAdminWp(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#00a8ff] hover:bg-[#0088cc] disabled:opacity-40 text-[#0b141a] text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add URL</span>
                  </button>
                </div>

                <input
                  type="url"
                  value={adminWpUrl}
                  onChange={(e) => setAdminWpUrl(e.target.value)}
                  placeholder="Or paste direct image URL..."
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-[#0b141a] border-[#202c33] text-white focus:border-[#00a8ff]' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              {/* Admin Wallpapers Grid in Admin Panel */}
              {adminWallpapers.length > 0 ? (
                <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {adminWallpapers.map((wp) => (
                    <div key={wp.id} className="relative group rounded-xl overflow-hidden border border-[#202c33] h-20 bg-cover bg-center shadow-sm" style={{ backgroundImage: `url("${wp.url}")` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-1.5 flex flex-col justify-end">
                        <p className="text-[10px] font-bold text-white truncate">{wp.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Delete "${wp.name}"?`)) {
                            await deleteAdminWallpaper(wp.id);
                            showSnack('Wallpaper deleted');
                          }
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white shadow cursor-pointer transition-colors"
                        title="Delete wallpaper"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-500 italic text-center py-2">
                  No admin wallpapers added yet. Add one above to populate swatches!
                </p>
              )}
            </div>

            {/* Quick Action Button */}
            <button
              type="button"
              onClick={() => {
                showSnack('Admin settings active');
                setShowAdminModal(false);
              }}
              className="w-full py-3 rounded-2xl font-bold text-sm bg-[#00a8ff] text-[#0b141a] hover:bg-[#0088cc] transition-colors shadow-lg cursor-pointer"
            >
              Done & Save Admin View
            </button>
          </div>
        </div>
      )}

      {/* Snackbar Notification */}
      {snack && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#1f2c34] border border-[#2a3942] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 whitespace-nowrap animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#00a8ff]"></span>
          {snack}
        </div>
      )}

      {/* Followers List Modal */}
      <FollowersList
        isOpen={showFollowersListModal}
        onClose={() => setShowFollowersListModal(false)}
        followers={(user.followers || []).map((idOrName: string) => {
          const contactMatch = contacts.find(c => c.id === idOrName || c.username === idOrName);
          return {
            uid: idOrName,
            name: contactMatch?.name || idOrName,
            username: contactMatch?.username || idOrName,
            avatar: contactMatch?.avatar,
            status: contactMatch?.status,
          };
        })}
        isDark={isDark}
      />

      {/* Following List Modal */}
      <FollowingList
        isOpen={showFollowingListModal}
        onClose={() => setShowFollowingListModal(false)}
        following={(user.following || []).map((idOrName: string) => {
          const contactMatch = contacts.find(c => c.id === idOrName || c.username === idOrName);
          return {
            uid: idOrName,
            name: contactMatch?.name || idOrName,
            username: contactMatch?.username || idOrName,
            avatar: contactMatch?.avatar,
            status: contactMatch?.status,
          };
        })}
        isDark={isDark}
      />

      {/* Private Followers Notice Modal */}
      {showPrivateFollowersNotice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center ${
            isDark ? 'bg-[#111b21] border-[#202c33] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="w-12 h-12 rounded-full bg-[#00a8ff]/10 text-[#00a8ff] flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-1">Followers Hidden</h3>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              The followers list for this verified Admin account is private and cannot be viewed.
            </p>
            <button
              type="button"
              onClick={() => setShowPrivateFollowersNotice(false)}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#00a8ff] text-[#0b141a] hover:bg-[#0088cc] cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Style Full Screen Profile Photo Viewer */}
      <WhatsAppProfileViewer
        isOpen={showFullPhotoViewer}
        onClose={() => setShowFullPhotoViewer(false)}
        name={userName || 'My Profile'}
        avatarUrl={user.avatar || ''}
        subText={`@${userUsername}`}
        isSelf={true}
        onEditPhoto={handleOpenEditModal}
      />

      {/* Full Screen Wallpaper Success Overlay */}
      <WallpaperSuccessOverlay
        show={Boolean(fullScreenSuccessMsg)}
        message={fullScreenSuccessMsg || undefined}
        onClose={() => setFullScreenSuccessMsg(null)}
      />

      {/* Set Chat Wallpaper Live Preview Modal */}
      <SetChatWallpaperModal
        isOpen={showWallpaperModal}
        onClose={() => setShowWallpaperModal(false)}
        contactName="Live Chat Preview"
        isDark={isDark}
        isAdmin={isAdmin}
        currentWallpaper={previewWallpaperChoice || vaultSettings?.chatWallpaper || 'default'}
        currentBlur={vaultSettings?.chatWallpaperBlur || 0}
        currentBrightness={vaultSettings?.chatWallpaperBrightness || 100}
        adminWallpapers={adminWallpapers?.map(w => ({ id: w.id || '', name: w.name, url: w.url })) || []}
        onApplyWallpaper={(payload) => {
          updateVaultSettings({
            chatWallpaper: payload.wallpaper,
            chatWallpaperBlur: payload.blur,
            chatWallpaperBrightness: payload.brightness,
          });
          setShowWallpaperModal(false);
          triggerSuccessOverlay('Wallpaper Set!');
        }}
        onResetWallpaper={() => {
          updateVaultSettings({
            chatWallpaper: 'default',
            chatWallpaperBlur: 0,
            chatWallpaperBrightness: 100,
          });
          setShowWallpaperModal(false);
          triggerSuccessOverlay('Wallpaper Reset!');
        }}
      />

    </div>
  );
};
