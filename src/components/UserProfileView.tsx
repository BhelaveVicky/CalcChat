import React, { useState, useRef } from 'react';
import { 
  User, Key, Lock, MessageSquare, Bell, Keyboard, LogOut, Search, X, 
  Camera, Check, Eye, Edit3, RotateCw, ZoomIn, ZoomOut, RefreshCw,
  ChevronLeft, ChevronRight, Circle, Info, Smile, CheckCheck,
  Ban, UserPlus, Plus, ShieldAlert, Trash2, Code2, Heart, Sparkles,
  Users, Phone
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useSettings } from '../context/SettingsContext';

export const UserProfileView: React.FC = () => {
  const { 
    user, updateProfile, signOutGoogle, lockVault, 
    contacts, blockedContactIds, blockContact, unblockContact,
    settings: vaultSettings, updateSettings: updateVaultSettings,
    clearAllChatHistory
  } = useVault();
  const { settings, updateSettings: updateGlobalSettings } = useSettings();
  const isDark = settings.darkMode;
  const [search, setSearch] = useState('');
  const [snack, setSnack] = useState('');
  
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [showProfileOptionsModal, setShowProfileOptionsModal] = useState(false);
  const [showViewProfileModal, setShowViewProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showAddBlockContactModal, setShowAddBlockContactModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [showChatsModal, setShowChatsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyGroups, setNotifyGroups] = useState(true);
  const [notifyStatus, setNotifyStatus] = useState(true);
  const [notifyCalls, setNotifyCalls] = useState(true);
  const [showClearHistoryConfirmModal, setShowClearHistoryConfirmModal] = useState(false);
  const [blockSearch, setBlockSearch] = useState('');

  // Privacy states
  const [privacyLastSeen, setPrivacyLastSeen] = useState('My contacts, Everyone');
  const [privacyPhoto, setPrivacyPhoto] = useState('Everyone');
  const [privacyAbout, setPrivacyAbout] = useState('My contacts');
  const [privacyStatus, setPrivacyStatus] = useState('1 contact included');
  const [readReceipts, setReadReceipts] = useState(true);
  const [activePrivacyItem, setActivePrivacyItem] = useState<{ id: string; title: string; current: string; options: string[] } | null>(null);

  // Edit states
  const [editName, setEditName] = useState(user.name || 'paurnima bhelave');
  const [editUsername, setEditUsername] = useState(user.username || 'vicky_bhelave');
  const [editStatus, setEditStatus] = useState(user.status || '');
  const [editAvatar, setEditAvatar] = useState(user.avatar || '');
  const [saved, setSaved] = useState(false);

  // Crop states
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [cropPos, setCropPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const userName = user.name || 'paurnima bhelave';
  const userUsername = user.username || 'vicky_bhelave';
  const userEmail = user.email || 'paurnimabhelave@gmail.com';

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
    setEditName(userName);
    setEditUsername(userUsername);
    setEditStatus(user.status || '');
    setEditAvatar(user.avatar || '');
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
      const outputSize = 400; // high quality 400x400 avatar output
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

      const croppedUrl = canvas.toDataURL('image/jpeg', 0.92);
      setEditAvatar(croppedUrl);
      setShowCropModal(false);
      showSnack('Photo cropped successfully');
    };
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName.trim() || userName,
      username: editUsername.trim().replace(/^@/, '') || userUsername,
      status: editStatus.trim(),
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
      sub: 'Security notifications, account info',
      onClick: () => showSnack('Account settings')
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
          {/* Green Online Status Dot */}
          <span className={`w-4 h-4 bg-[#25d366] border-2 rounded-full absolute bottom-0.5 right-0.5 ${
            isDark ? 'border-[#0b141a]' : 'border-white'
          }`}></span>
        </div>

        <h2 className={`text-xl font-bold mt-3 tracking-wide text-center ${
          isDark ? 'text-[#e9edef]' : 'text-gray-900'
        }`}>
          {userName}
        </h2>
        <p className="text-xs text-[#0095f6] font-medium mt-0.5 text-center">
          @{userUsername}
        </p>
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
                <div className="p-2.5 rounded-xl bg-[#00a884]/10 text-[#00a884]">
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
            <div className="relative mb-6">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={userName}
                  className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full object-cover border-4 shadow-2xl ${
                    isDark ? 'border-[#1f2c34]' : 'border-gray-100'
                  }`}
                />
              ) : (
                <div className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center text-7xl font-normal shadow-2xl border-4 ${
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
                    options: ['My contacts', '1 contact included', 'My contacts except...', 'Only share with...']
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
                {contacts
                  .filter(c => blockedContactIds.includes(c.id))
                  .map(c => (
                    <div 
                      key={c.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {c.avatar ? (
                          <img 
                            src={c.avatar} 
                            alt={c.name} 
                            className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-500/20"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                            isDark ? 'bg-[#1f2c34] text-[#e9edef]' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className={`font-semibold text-base truncate ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                            {c.name}
                          </p>
                          <p className={`text-xs truncate ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                            {c.status || 'Blocked contact'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          unblockContact(c.id);
                          showSnack(`Unblocked ${c.name}`);
                        }}
                        className="ml-3 px-3.5 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-semibold shrink-0 transition-colors"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0095f6] to-[#00c853] p-0.5 shadow-lg mb-4 flex items-center justify-center">
                <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                  isDark ? 'bg-[#111b21]' : 'bg-white'
                }`}>
                  <Code2 className="w-8 h-8 text-[#0095f6]" />
                </div>
              </div>

              <h2 className="text-xl font-bold mb-1">App Creator</h2>
              <p className={`text-xs font-medium mb-5 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                Calculator Vault & Chat Platform
              </p>

              <div className={`w-full rounded-2xl p-4 mb-5 border text-left space-y-3 ${
                isDark ? 'bg-[#1f2c34]/60 border-[#2a3942]' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>Developer:</span>
                  <span className="text-xs font-semibold text-[#0095f6]">Paurnima Bhelave</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-500/10 pt-2">
                  <span className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>App Name:</span>
                  <span className="text-xs font-semibold">Calculator Vault Messenger</span>
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
                    updateGlobalSettings('darkMode', false);
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
                    updateGlobalSettings('darkMode', true);
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
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-[#8696a0]' : 'text-gray-800'}`}>
                Wallpaper
              </h3>

              {/* 6 Preset Color Swatches */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { name: 'Default', bg: '#f0f2f5', class: 'bg-[#f0f2f5]' },
                  { name: 'Sky Blue', bg: '#e3f2fd', class: 'bg-[#e3f2fd]' },
                  { name: 'Mint Green', bg: '#e8f5e9', class: 'bg-[#e8f5e9]' },
                  { name: 'Lavender', bg: '#f3e5f5', class: 'bg-[#f3e5f5]' },
                  { name: 'Warm Yellow', bg: '#fffde7', class: 'bg-[#fffde7]' },
                  { name: 'Blush Pink', bg: '#fce4ec', class: 'bg-[#fce4ec]' },
                ].map((swatch) => {
                  const isSelected = (vaultSettings?.chatWallpaper || '#f0f2f5') === swatch.bg || ((!vaultSettings?.chatWallpaper || vaultSettings?.chatWallpaper === 'default') && swatch.name === 'Default');
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      onClick={() => {
                        updateVaultSettings({ chatWallpaper: swatch.bg });
                        showSnack(`Wallpaper set to ${swatch.name}`);
                      }}
                      className={`h-16 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${swatch.class} ${
                        isSelected 
                          ? 'border-[#0095f6] ring-2 ring-[#0095f6]/30 shadow-md scale-[1.02]' 
                          : 'border-gray-300/40 hover:opacity-90'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <Check className="w-5 h-5 text-[#0095f6]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Upload Custom Wallpaper Button */}
              <input
                ref={wallpaperInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        updateVaultSettings({ chatWallpaper: event.target.result as string });
                        showSnack('Custom wallpaper uploaded successfully!');
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />

              <button
                type="button"
                onClick={() => wallpaperInputRef.current?.click()}
                className={`w-full p-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2.5 transition-colors text-sm font-medium cursor-pointer ${
                  isDark 
                    ? 'border-[#2a3942] hover:border-gray-500 text-[#8696a0] hover:text-[#e9edef]' 
                    : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900'
                }`}
              >
                <Camera className="w-5 h-5 opacity-70" />
                <span>Upload custom wallpaper</span>
              </button>
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
                  setNotifyMessages(!notifyMessages);
                  showSnack(`Messages notifications turned ${!notifyMessages ? 'On' : 'Off'}`);
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

            {/* 2. Groups */}
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Users className={`w-6 h-6 shrink-0 ${isDark ? 'text-[#8696a0]' : 'text-gray-700'}`} />
                <div>
                  <h3 className={`text-base font-semibold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                    Groups
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
                  setNotifyGroups(!notifyGroups);
                  showSnack(`Groups notifications turned ${!notifyGroups ? 'On' : 'Off'}`);
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
                  setNotifyStatus(!notifyStatus);
                  showSnack(`Status notifications turned ${!notifyStatus ? 'On' : 'Off'}`);
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
                  setNotifyCalls(!notifyCalls);
                  showSnack(`Calls notifications turned ${!notifyCalls ? 'On' : 'Off'}`);
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

      {/* Snackbar Notification */}
      {snack && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#1f2c34] border border-[#2a3942] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 whitespace-nowrap animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#00a884]"></span>
          {snack}
        </div>
      )}

    </div>
  );
};
