import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, UserCheck, UserPlus, Edit3, ArrowLeft, Shield, ShieldCheck, Lock, X, 
  Images, Bell, BellOff, Phone, PhoneOff, ChevronRight, Download, Play, FileText, Video, Link as LinkIcon, Users,
  Crown, VolumeX, Volume2, ShieldAlert, Sliders, QrCode, Globe, Trash2, Check, Copy, RefreshCw, Settings, UserX
} from 'lucide-react';
import { checkIsAdmin, VerifiedBadge } from '../lib/adminUtils';
import { getContactNotificationSettings, setContactNotificationSettings } from '../lib/contactSettings';
import { Message, GroupPermissions, GroupJoinRequest, GroupActivityLog, DeletedMessageLog } from '../types';
import { WhatsAppProfileViewer } from './WhatsAppProfileViewer';
import { SelectMembersModal } from './SelectMembersModal';
import { GroupManagementModal } from './GroupManagentModal';
import { useVault } from '../context/VaultContext';
import { getGroupMembersList } from '../lib/groupUtils';

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
  description?: string;
  followers?: string[];
  following?: string[];
  isOnline?: boolean;
  email?: string;
  isGroup?: boolean;
  groupMembers?: string[];
  members?: string[];
  memberNames?: string[];
  memberUids?: string[];
  createdBy?: string;
  ownerId?: string;
  admins?: string[];
  bannedMembers?: string[];
  mutedMembers?: string[];
  joinRequests?: GroupJoinRequest[];
  inviteLink?: string;
  inviteLinkDisabled?: boolean;
  isPublic?: boolean;
  joinApprovalRequired?: boolean;
  permissions?: GroupPermissions;
  activityLogs?: GroupActivityLog[];
  deletedMessageLogs?: DeletedMessageLog[];
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
  const { 
    allRegisteredUsers = [], contacts = [], user: vaultUser, 
    removeMemberFromGroup, leaveGroup, toggleGroupAdmin,
    updateGroupDetails, updateGroupPermissions, transferGroupOwnership,
    toggleGroupMuteMember, toggleGroupBanMember, approveJoinRequest,
    rejectJoinRequest, regenerateGroupInviteLink, toggleGroupInviteLinkDisabled,
    updateGroupPrivacy, deleteGroup
  } = useVault();

  const [showPrivateNotice, setShowPrivateNotice] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showSelectMembersModal, setShowSelectMembersModal] = useState(false);
  const [showFullPhotoViewer, setShowFullPhotoViewer] = useState(false);
  const [showGroupSettingsModal, setShowGroupSettingsModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferTarget, setSelectedTransferTarget] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState('');
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
  const isGroup = Boolean(user.isGroup || targetUid.startsWith('group_') || user.username === 'group');

  const myUid = vaultUser?.id || vaultUser?.firebaseUid || currentUserUid || '';
  const groupContact = contacts.find(c => c.id === targetUid) || user;
  const isOwner = isGroup && (groupContact.ownerId === myUid || groupContact.createdBy === myUid || (groupContact.createdBy && groupContact.createdBy.includes(myUid)));
  const isGroupAdmin = isOwner || (isGroup && Array.isArray(groupContact.admins) && groupContact.admins.includes(myUid));
  const canEditGroupInfo = isOwner || isGroupAdmin || groupContact.permissions?.editGroupInfo !== false;
  const canAddMembers = isOwner || isGroupAdmin || groupContact.permissions?.addMembers !== false;

  const avatarUrl = user.photoURL || user.avatar;
  const displayName = user.name || 'CalChat User';
  const usernameStr = isGroup ? '@group' : (user.username ? `@${user.username.replace(/^@/, '')}` : '@username');
  
  const rawBio = user.description || user.bio || user.status || user.about || '';
  const bioText = isGroup
    ? (rawBio.includes('members:') || rawBio.includes('member:') ? 'Official Group Chat' : (rawBio || 'Official Group Chat'))
    : (rawBio || '"An emptiholic heart with quiet dreams" 🌙 💖 🥀');

  const groupMemberList = getGroupMembersList(user, allRegisteredUsers, contacts, vaultUser);
  const groupMembersCount = isGroup ? groupMemberList.length : 0;

  const followersCount = isGroup ? groupMembersCount : (isAdmin ? '2K' : (Array.isArray(user.followers) ? user.followers.length : 0));
  const followingCount = isGroup ? 0 : (Array.isArray(user.following) ? user.following.length : 0);

  const handleFollowersClick = () => {
    if (isAdmin) {
      setShowPrivateNotice(true);
      return;
    }
    if (onFollowersClick) {
      onFollowersClick();
    }
  };

  // Extract real media from messages list only (no fake default placeholders)
  const realMedia = messagesList
    .filter(m => m.media && m.media.url && !m.deletedForEveryone)
    .map(m => m.media!);

  const effectiveMediaItems = realMedia;
  const totalMediaCount = realMedia.length;

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
          <div 
            className="relative shrink-0 cursor-pointer group"
            onClick={() => setShowFullPhotoViewer(true)}
            title="View full profile photo in WhatsApp style"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 shadow-xl group-hover:scale-105 transition-transform ${
                  isDark ? 'border-[#202c33]' : 'border-gray-200'
                }`}
              />
            ) : (
              <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-4xl font-bold shadow-xl border-2 group-hover:scale-105 transition-transform ${
                isDark ? 'bg-[#1f2c34] text-[#e9edef] border-[#202c33]' : 'bg-[#1e293b] text-white border-gray-200'
              }`}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {user.isOnline && (
              <span className={`w-4 h-4 bg-emerald-500 border-2 rounded-full absolute bottom-1 right-1 ${
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

        {/* User Statistics Row: Clickable Followers / Members & Following */}
        <div className="flex items-center gap-2 text-sm sm:text-base font-bold my-2 text-left">
          <button
            type="button"
            onClick={handleFollowersClick}
            className={`hover:underline cursor-pointer transition-colors flex items-center gap-1 ${
              isDark ? 'text-white hover:text-[#00a8ff]' : 'text-gray-900 hover:text-[#00a8ff]'
            }`}
          >
            <span>{isGroup ? groupMembersCount : followersCount}</span>{' '}
            <span className={isDark ? 'text-[#e9edef]' : 'text-gray-800'}>
              {isGroup ? 'members' : 'followers'}
            </span>
          </button>

          {!isGroup && (
            <>
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
            </>
          )}
        </div>

        {/* Bio / About Section */}
        <div className="mt-3 text-sm sm:text-base leading-relaxed text-left w-full font-normal">
          <p className={isDark ? 'text-[#e9edef]' : 'text-gray-900'}>
            {bioText}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-3 w-full mt-5">
          {isGroup ? (
            <>
              {/* Add Member (+) Button for Group Info */}
              <button
                type="button"
                onClick={() => setShowSelectMembersModal(true)}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] border border-[#00a8ff] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Member</span>
              </button>

              {/* Group Permissions & Settings Button */}
              <button
                type="button"
                onClick={() => setShowGroupSettingsModal(true)}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                  isDark
                    ? 'bg-[#1f2c34] hover:bg-[#2a3942] text-white border border-[#2a3942]'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Group Permissions</span>
              </button>

              {/* Message Button */}
              {onMessageClick && (
                <button
                  type="button"
                  onClick={onMessageClick}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                    isDark 
                      ? 'bg-[#1f2c34] hover:bg-[#2a3942] text-white border border-[#2a3942]' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-[#00a8ff]" />
                  <span>Chat</span>
                </button>
              )}
            </>
          ) : isSelf ? (
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
              {/* Add Friend / Unfriend Button */}
              {onFollowToggle && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (isFollowing) {
                        setShowUnfriendConfirm(true);
                      } else {
                        onFollowToggle();
                      }
                    }}
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
                        <UserCheck className="w-4 h-4 text-rose-400" />
                        <span>Unfriend</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Add Friend</span>
                      </>
                    )}
                  </button>

                  {/* Unfriend Confirmation Modal */}
                  {showUnfriendConfirm && (
                    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                      <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${
                        isDark ? 'bg-[#111b21] border-[#202c33] text-white' : 'bg-white border-gray-200 text-gray-900'
                      }`}>
                        <h3 className="font-extrabold text-lg mb-2">Remove this friend?</h3>
                        <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                          Are you sure you want to remove <span className="font-bold text-current">{displayName}</span> from your friends list? Chat features will be disabled until you become friends again.
                        </p>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setShowUnfriendConfirm(false)}
                            className={`flex-1 py-2.5 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                              isDark ? 'bg-[#202c33] hover:bg-[#2a3942] border-[#2a3942] text-white' : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowUnfriendConfirm(false);
                              onFollowToggle();
                            }}
                            className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all active:scale-95 cursor-pointer"
                          >
                            Unfriend
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
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

        {/* Group Pending Join Requests Card for Group Owner/Admins */}
        {isGroup && isGroupAdmin && Array.isArray(groupContact.joinRequests) && groupContact.joinRequests.length > 0 && (
          <div className={`w-full mt-4 rounded-2xl p-4 border border-amber-500/30 transition-all ${
            isDark ? 'bg-amber-500/10' : 'bg-amber-50'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <span className={`text-sm font-extrabold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                  Pending Join Requests ({groupContact.joinRequests.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupSettingsModal(true)}
                className="text-xs font-bold text-[#00a8ff] hover:underline cursor-pointer"
              >
                Manage All
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {groupContact.joinRequests.map((req: GroupJoinRequest) => (
                <div
                  key={req.id || req.userId}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    isDark ? 'bg-[#111b21] border-[#202c33] text-white' : 'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={req.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt={req.userName}
                      className="w-8 h-8 rounded-full object-cover border border-[#00a8ff]"
                    />
                    <div className="min-w-0">
                      <p className="font-bold truncate">{req.userName}</p>
                      <p className={`text-[10px] ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                        Requested to join
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => approveJoinRequest(targetUid, req.userId)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      title="Approve Request"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectJoinRequest(targetUid, req.userId)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      title="Reject Request"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group Members Card for Group Info Screen */}
        {isGroup && (
          <div className={`w-full mt-5 rounded-2xl p-4 border transition-all ${
            isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-[#f8f9fa] border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00a8ff]" />
                <span className={`text-sm sm:text-base font-bold ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                  Group Members ({groupMemberList.length})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowSelectMembersModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                title="Add (+) Members to Group"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add (+)</span>
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {groupMemberList.length === 0 ? (
                <p className={`text-xs py-2 ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
                  No members added yet. Click <span className="text-[#00a8ff] font-bold">Add (+)</span> to add members!
                </p>
              ) : (
                groupMemberList.map((m, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                    isDark ? 'bg-[#182229] border-[#202c33] text-white' : 'bg-white border-gray-200 text-gray-800'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#00a8ff]/30" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#00a8ff]/20 text-[#00a8ff] flex items-center justify-center font-bold text-xs shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        m.role === 'Creator'
                          ? 'bg-[#00a8ff]/20 text-[#00a8ff] border border-[#00a8ff]/30'
                          : m.role === 'Admin'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {m.role}
                      </span>
                      {m.role !== 'Creator' && m.id !== currentUserUid && (
                        <button
                          type="button"
                          onClick={() => removeMemberFromGroup(targetUid, m.id || m.name)}
                          className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                          title={`Remove ${m.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Leave Group Button */}
            <button
              type="button"
              onClick={() => {
                leaveGroup(targetUid);
                if (onBackClick) onBackClick();
              }}
              className="w-full mt-3 py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-500 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <X className="w-4 h-4" />
              <span>Leave Group</span>
            </button>
          </div>
        )}

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
          {effectiveMediaItems.length > 0 ? (
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
          ) : (
            <div className="py-2 text-left">
              <p className={`text-xs font-medium ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                No photos, videos or docs shared yet
              </p>
            </div>
          )}
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
      {/* Full Screen WhatsApp Profile Viewer Modal */}
      <WhatsAppProfileViewer
        isOpen={showFullPhotoViewer}
        onClose={() => setShowFullPhotoViewer(false)}
        name={displayName || 'Profile Photo'}
        avatarUrl={avatarUrl || ''}
        subText={usernameStr}
        onSendMessage={onMessageClick}
      />

      {/* Select Members Modal for Group */}
      {showSelectMembersModal && (
        <SelectMembersModal
          groupId={targetUid}
          groupName={displayName}
          existingMembers={user.members || user.memberUids || []}
          onClose={() => setShowSelectMembersModal(false)}
        />
      )}

      {/* Group Owner Permission Management System Modal */}
      {showGroupSettingsModal && (
        <GroupManagementModal
          groupId={targetUid}
          onClose={() => setShowGroupSettingsModal(false)}
        />
      )}

    </div>
  );
};
