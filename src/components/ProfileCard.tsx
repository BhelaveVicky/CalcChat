import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, UserCheck, UserPlus, Edit3, ArrowLeft, Shield, Lock, X, 
  Images, Bell, BellOff, Phone, PhoneOff, ChevronRight, Download, Play, FileText, Video, Link as LinkIcon
} from 'lucide-react';
import { checkIsAdmin, VerifiedBadge } from '../lib/adminUtils';
import { getContactNotificationSettings, setContactNotificationSettings } from '../lib/contactSettings';
import { Message } from '../types';

export interface ProfileData {
  uid: string;
  id?: string;
  name: string;
  username: string;
  photoURL?: string;
  avatar?: string;
  bio?: string;
  status?: string;
  about?: string;
  followers?: string[];
  following?: string[];
  isOnline?: boolean;
  email?: string;
}

interface ProfileCardProps {
  user: ProfileData;
  currentUserUid?: string;
  isFollowing?: boolean;
  messagesList?: Message[];
  onFollowToggle?: () => void;
  onMessageClick?: () => void;
  onEditProfileClick?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  onBackClick?: () => void;
  isDark?: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  currentUserUid,
  isFollowing = false,
  messagesList = [],
  onFollowToggle,
  onMessageClick,
  onEditProfileClick,
  onFollowersClick,
  onFollowingClick,
  onBackClick,
  isDark = true,
}) => {
  const targetUid = user.uid || user.id || '';

  const [showPrivateNotice, setShowPrivateNotice] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'videos' | 'links'>('photos');
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<any | null>(null);

  // Notification settings for this specific contact
  const [notifSettings, setNotifSettings] = useState(() => 
    getContactNotificationSettings(targetUid)
  );

  useEffect(() => {
    if (targetUid) {
      setNotifSettings(getContactNotificationSettings(targetUid));
    }
  }, [targetUid]);

  const handleToggleChatNotif = () => {
    const updated = setContactNotificationSettings(targetUid, {
      chatNotifications: !notifSettings.chatNotifications
    });
    setNotifSettings(updated);
  };

  const handleToggleCallNotif = () => {
    const updated = setContactNotificationSettings(targetUid, {
      callNotifications: !notifSettings.callNotifications
    });
    setNotifSettings(updated);
  };

  const isSelf = currentUserUid ? (targetUid === currentUserUid) : false;
  const isAdmin = checkIsAdmin(user);
  const avatarUrl = user.photoURL || user.avatar;
  const displayName = user.name || 'CalChat User';
  const usernameStr = user.username ? `@${user.username.replace(/^@/, '')}` : '@username';
  const bioText = user.bio || user.status || user.about || '"An emptiholic heart with quiet dreams" 🌙 💖 🥀';

  const followersCount = isAdmin ? '2K' : (Array.isArray(user.followers) ? user.followers.length : 0);
  const followingCount = Array.isArray(user.following) ? user.following.length : 0;

  const handleFollowersClick = () => {
    if (isAdmin) {
      setShowPrivateNotice(true);
      return;
    }
    if (onFollowersClick) {
      onFollowersClick();
    }
  };

  // Extract real media from messages list
  const realMedia = messagesList
    .filter(m => m.media && m.media.url && !m.deletedForEveryone)
    .map(m => m.media!);

  // Default sample media if no chat attachments exist yet (matching the WhatsApp second image screenshot)
  const defaultSampleMedia = [
    {
      id: 'sample-1',
      type: 'video' as const,
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80',
      name: 'Vid_2026_01.mp4',
      duration: '0:03'
    },
    {
      id: 'sample-2',
      type: 'video' as const,
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&auto=format&fit=crop&q=80',
      name: 'Vid_2026_02.mp4',
      duration: '0:11'
    },
    {
      id: 'sample-3',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&auto=format&fit=crop&q=80',
      name: 'Scenery.jpg'
    },
    {
      id: 'sample-4',
      type: 'file' as const,
      url: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=400&auto=format&fit=crop&q=80',
      name: 'Document.pdf'
    }
  ];

  const effectiveMediaItems = realMedia.length > 0 ? realMedia : defaultSampleMedia;
  const totalMediaCount = realMedia.length > 0 ? realMedia.length : 9;

  // Filter items for full media modal
  const filteredMedia = effectiveMediaItems.filter(item => {
    if (activeMediaTab === 'photos') return item.type === 'image';
    if (activeMediaTab === 'videos') return item.type === 'video';
    return false;
  });

  return (
    <div className={`w-full max-w-lg mx-auto font-sans select-none transition-colors ${
      isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
    }`}>
      {/* Navigation Header with Back Button */}
      {onBackClick && (
        <div className={`flex items-center justify-between px-4 py-3 sticky top-0 z-20 border-b ${
          isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-white border-gray-100'
        }`}>
          <button
            onClick={onBackClick}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'text-[#8696a0] hover:bg-[#1f2c34] hover:text-[#e9edef]' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h2 className={`font-bold text-base truncate px-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {usernameStr}
          </h2>

          <div className="w-9 h-9 flex items-center justify-center opacity-0 pointer-events-none">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Main Instagram Style Profile Container */}
      <div className="px-6 py-6 flex flex-col items-start">
        {/* Top Header Section: Profile Photo + Name & Username */}
        <div className="flex items-center gap-5 w-full mb-4">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 shadow-xl ${
                  isDark ? 'border-[#202c33]' : 'border-gray-200'
                }`}
              />
            ) : (
              <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-4xl font-bold shadow-xl border-2 ${
                isDark ? 'bg-[#1f2c34] text-[#e9edef] border-[#202c33]' : 'bg-[#1e293b] text-white border-gray-200'
              }`}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {user.isOnline && (
              <span className={`w-4 h-4 bg-[#00a8ff] border-2 rounded-full absolute bottom-1 right-1 ${
                isDark ? 'border-[#0b141a]' : 'border-white'
              }`} />
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight truncate leading-tight flex items-center gap-1.5 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="truncate">{displayName}</span>
              {isAdmin && <VerifiedBadge className="w-6 h-6 shrink-0" />}
            </h1>

            <p className={`text-sm sm:text-base font-medium mt-0.5 truncate ${
              isDark ? 'text-[#8596a0]' : 'text-gray-500'
            }`}>
              {usernameStr}
            </p>
          </div>
        </div>

        {/* User Statistics Row: Clickable Followers & Following */}
        <div className="flex items-center gap-2 text-sm sm:text-base font-bold my-2 text-left">
          <button
            type="button"
            onClick={handleFollowersClick}
            className={`hover:underline cursor-pointer transition-colors flex items-center gap-1 ${
              isDark ? 'text-white hover:text-[#00a8ff]' : 'text-gray-900 hover:text-[#00a8ff]'
            }`}
          >
            <span>{followersCount}</span>{' '}
            <span className={isDark ? 'text-[#e9edef]' : 'text-gray-800'}>followers</span>
          </button>

          <span className={`mx-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>•</span>

          <button
            type="button"
            onClick={onFollowingClick}
            className={`hover:underline cursor-pointer transition-colors ${
              isDark ? 'text-white hover:text-[#00a8ff]' : 'text-gray-900 hover:text-[#00a8ff]'
            }`}
          >
            <span>{followingCount}</span>{' '}
            <span className={isDark ? 'text-[#e9edef]' : 'text-gray-800'}>following</span>
          </button>
        </div>

        {/* Bio / About Section */}
        <div className="mt-3 text-sm sm:text-base leading-relaxed text-left w-full font-normal">
          <p className={isDark ? 'text-[#e9edef]' : 'text-gray-900'}>
            {bioText}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-3 w-full mt-5">
          {isSelf ? (
            <button
              type="button"
              onClick={onEditProfileClick}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                isDark 
                  ? 'bg-[#1f2c34] hover:bg-[#2a3942] text-white border border-[#2a3942]' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
              }`}
            >
              <Edit3 className="w-4 h-4 text-[#00a8ff]" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <>
              {/* Follow / Unfollow Button */}
              {onFollowToggle && (
                <button
                  type="button"
                  onClick={onFollowToggle}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    isFollowing
                      ? (isDark 
                          ? 'bg-[#1f2c34] hover:bg-rose-950/40 hover:border-rose-500/50 text-white border border-[#2a3942]' 
                          : 'bg-gray-100 hover:bg-rose-50 text-gray-900 border border-gray-300')
                      : 'bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] border border-[#00a8ff]'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 text-[#00a8ff]" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}

              {/* Message Button */}
              {onMessageClick && (
                <button
                  type="button"
                  onClick={onMessageClick}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    isDark 
                      ? 'bg-[#1f2c34] hover:bg-[#2a3942] text-white border border-[#2a3942]' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-[#00a8ff]" />
                  <span>Message</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Media, links and docs Card (WhatsApp Style as requested) */}
        <div className={`w-full mt-6 rounded-2xl p-4 border transition-all ${
          isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-[#f8f9fa] border-gray-200'
        }`}>
          {/* Header row */}
          <button
            type="button"
            onClick={() => setShowMediaModal(true)}
            className="w-full flex items-center justify-between text-left group cursor-pointer mb-3"
          >
            <div className="flex items-center gap-3">
              <Images className={`w-5 h-5 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`} />
              <span className={`text-sm sm:text-base font-semibold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                Photos, videos and docs
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                {totalMediaCount}
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                isDark ? 'text-[#8696a0]' : 'text-gray-400'
              }`} />
            </div>
          </button>

          {/* Thumbnails Row */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {effectiveMediaItems.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => {
                  setSelectedPreviewItem(item);
                  setShowMediaModal(true);
                }}
                className={`relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden cursor-pointer group border shadow-xs ${
                  isDark ? 'border-[#202c33] bg-[#1f2c34]' : 'border-gray-200 bg-gray-200'
                }`}
              >
                {item.type === 'video' ? (
                  <>
                    <img src={item.url} alt="Video thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white drop-shadow-md" />
                    </div>
                    <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-[10px] text-white px-1.5 py-0.5 rounded-md font-mono flex items-center gap-1 font-bold">
                      <Video className="w-3 h-3 text-white" />
                      <span>{item.duration || '0:03'}</span>
                    </div>
                  </>
                ) : item.type === 'image' ? (
                  <img src={item.url} alt="Media photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#00a8ff]/10 text-[#00a8ff] p-2 text-center">
                    <Download className="w-6 h-6 mb-1" />
                    <span className="text-[10px] truncate max-w-full font-bold">{item.name || 'Document'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notifications & Call Control Switches Section */}
        {!isSelf && (
          <div className={`w-full mt-4 rounded-2xl p-4 border transition-colors ${
            isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-[#f8f9fa] border-gray-200'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 text-left ${
              isDark ? 'text-[#8696a0]' : 'text-gray-500'
            }`}>
              Notification & Sound Options
            </h3>

            <div className="space-y-4">
              {/* Chat Notification Toggle */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
                    notifSettings.chatNotifications ? 'bg-[#00a8ff]/15 text-[#00a8ff]' : 'bg-gray-500/15 text-gray-400'
                  }`}>
                    {notifSettings.chatNotifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                  </div>
                  <div className="text-left min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                      Chat Notification
                    </p>
                    <p className={`text-xs truncate ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                      {notifSettings.chatNotifications ? 'Play tone when receiving messages' : 'Silent mode (no sound tone)'}
                    </p>
                  </div>
                </div>

                {/* ON / OFF Switch */}
                <button
                  type="button"
                  onClick={handleToggleChatNotif}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                    notifSettings.chatNotifications ? 'bg-[#00a8ff]' : (isDark ? 'bg-[#202c33]' : 'bg-gray-300')
                  }`}
                  title={notifSettings.chatNotifications ? 'Turn Off Chat Notification' : 'Turn On Chat Notification'}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    notifSettings.chatNotifications ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className={`h-[1px] w-full ${isDark ? 'bg-[#202c33]' : 'bg-gray-200'}`} />

              {/* Calls Notification Toggle */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
                    notifSettings.callNotifications ? 'bg-[#00a8ff]/15 text-[#00a8ff]' : 'bg-gray-500/15 text-gray-400'
                  }`}>
                    {notifSettings.callNotifications ? <Phone className="w-5 h-5" /> : <PhoneOff className="w-5 h-5" />}
                  </div>
                  <div className="text-left min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                      Calls Notification
                    </p>
                    <p className={`text-xs truncate ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                      {notifSettings.callNotifications ? 'Play ringtone for incoming calls' : 'Mute ringtone on calls'}
                    </p>
                  </div>
                </div>

                {/* ON / OFF Switch */}
                <button
                  type="button"
                  onClick={handleToggleCallNotif}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                    notifSettings.callNotifications ? 'bg-[#00a8ff]' : (isDark ? 'bg-[#202c33]' : 'bg-gray-300')
                  }`}
                  title={notifSettings.callNotifications ? 'Turn Off Calls Notification' : 'Turn On Calls Notification'}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    notifSettings.callNotifications ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Private Notice Modal for Admin Followers */}
        {showPrivateNotice && (
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
                onClick={() => setShowPrivateNotice(false)}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#00a8ff] text-[#0b141a] hover:bg-[#0088cc] cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Full Media, Links & Docs Modal */}
        {showMediaModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
            <div className={`w-full max-w-xl max-h-[85vh] rounded-3xl p-5 shadow-2xl border flex flex-col ${
              isDark ? 'bg-[#111b21] border-[#202c33] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
            }`}>
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#202c33]">
                <div className="flex items-center gap-2">
                  <Images className="w-5 h-5 text-[#00a8ff]" />
                  <h3 className="font-bold text-lg">Photos, videos and links</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMediaModal(false);
                    setSelectedPreviewItem(null);
                  }}
                  className="p-1 rounded-full text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs Bar */}
              <div className="flex items-center gap-2 my-4 border-b border-gray-200 dark:border-[#202c33] pb-2">
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('photos')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                    activeMediaTab === 'photos'
                      ? 'bg-[#00a8ff] text-[#0b141a]'
                      : (isDark ? 'bg-[#1f2c34] text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600')
                  }`}
                >
                  Photos ({effectiveMediaItems.filter(i => i.type === 'image').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('videos')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                    activeMediaTab === 'videos'
                      ? 'bg-[#00a8ff] text-[#0b141a]'
                      : (isDark ? 'bg-[#1f2c34] text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600')
                  }`}
                >
                  Videos ({effectiveMediaItems.filter(i => i.type === 'video').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('links')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                    activeMediaTab === 'links'
                      ? 'bg-[#00a8ff] text-[#0b141a]'
                      : (isDark ? 'bg-[#1f2c34] text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600')
                  }`}
                >
                  Links (0)
                </button>
              </div>

              {/* Media Content Grid */}
              <div className="flex-1 overflow-y-auto min-h-[250px] p-1">
                {activeMediaTab === 'links' ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                    <LinkIcon className="w-10 h-10 mb-2 opacity-40 text-[#00a8ff]" />
                    <p className="text-sm font-medium">No shared links found in this chat</p>
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                    <FileText className="w-10 h-10 mb-2 opacity-40 text-[#00a8ff]" />
                    <p className="text-sm font-medium">No media found in this category</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5">
                    {filteredMedia.map((item, i) => (
                      <div
                        key={item.id || i}
                        onClick={() => setSelectedPreviewItem(item)}
                        className={`relative aspect-square rounded-2xl overflow-hidden border cursor-pointer group ${
                          isDark ? 'border-[#202c33] bg-[#1f2c34]' : 'border-gray-200 bg-gray-100'
                        }`}
                      >
                        {item.type === 'video' ? (
                          <>
                            <img src={item.url} alt="Video" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Play className="w-8 h-8 text-white fill-white drop-shadow-md" />
                            </div>
                          </>
                        ) : item.type === 'image' ? (
                          <img src={item.url} alt="Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-[#00a8ff]/10 text-[#00a8ff]">
                            <Download className="w-8 h-8 mb-1" />
                            <span className="text-xs font-bold truncate max-w-full">{item.name || 'Document'}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Item Full Preview Overlay */}
              {selectedPreviewItem && (
                <div className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4">
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewItem(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="max-w-xl max-h-[80vh] flex flex-col items-center justify-center">
                    {selectedPreviewItem.type === 'video' ? (
                      <video src={selectedPreviewItem.url} controls autoPlay className="max-w-full max-h-[70vh] rounded-2xl" />
                    ) : selectedPreviewItem.type === 'image' ? (
                      <img src={selectedPreviewItem.url} alt="Full view" className="max-w-full max-h-[70vh] rounded-2xl object-contain" />
                    ) : (
                      <div className="p-8 bg-[#111b21] rounded-3xl border border-[#202c33] text-center text-white">
                        <Download className="w-12 h-12 text-[#00a8ff] mx-auto mb-3" />
                        <p className="font-bold text-lg mb-4">{selectedPreviewItem.name || 'Shared Document'}</p>
                        <a
                          href={selectedPreviewItem.url}
                          download={selectedPreviewItem.name || 'file'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-6 py-2.5 rounded-xl bg-[#00a8ff] text-[#0b141a] font-bold text-sm inline-block"
                        >
                          Download File
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
