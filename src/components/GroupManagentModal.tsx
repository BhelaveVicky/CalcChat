import React, { useState, useMemo } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Crown,
  UserPlus,
  UserX,
  X,
  Check,
  Search,
  Settings,
  Lock,
  Unlock,
  QrCode,
  Link as LinkIcon,
  Copy,
  RefreshCw,
  VolumeX,
  Volume2,
  Ban,
  Trash2,
  Edit3,
  Camera,
  History,
  FileText,
  MessageSquare,
  Image,
  Video,
  File,
  Mic,
  Smile,
  PhoneCall,
  ChevronRight,
  LogOut,
  AlertTriangle,
  UserCheck,
  Globe,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { getGroupMembersList, GroupMemberItem } from '../lib/groupUtils';
import { Contact, GroupPermissions, GroupJoinRequest, GroupActivityLog, DeletedMessageLog } from '../types';
import { SelectMembersModal } from './SelectMembersModal';

interface GroupManagementModalProps {
  groupId: string;
  onClose: () => void;
  initialTab?: 'overview' | 'members' | 'requests' | 'permissions' | 'activity' | 'deleted_logs';
}

export const GroupManagementModal: React.FC<GroupManagementModalProps> = ({
  groupId,
  onClose,
  initialTab = 'overview',
}) => {
  const {
    authUser,
    user: currentUser,
    contacts,
    groupContacts,
    allRegisteredUsers,
    settings,
    updateGroupDetails,
    updateGroupPermissions,
    transferGroupOwnership,
    toggleGroupAdmin,
    removeMemberFromGroup,
    leaveGroup,
    toggleGroupMuteMember,
    toggleGroupBanMember,
    approveJoinRequest,
    rejectJoinRequest,
    regenerateGroupInviteLink,
    toggleGroupInviteLinkDisabled,
    updateGroupPrivacy,
    clearGroupChatHistoryForEveryone,
    deleteGroup,
  } = useVault();

  const isDark = settings.theme !== 'material-light' && settings.theme !== 'light';
  const myUid = authUser?.uid || currentUser.id;

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'requests' | 'permissions' | 'activity' | 'deleted_logs'>(initialTab);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [searchActivityQuery, setSearchActivityQuery] = useState('');
  const [showSelectMembersModal, setShowSelectMembersModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferTarget, setSelectedTransferTarget] = useState<GroupMemberItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Editable fields
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescInput, setEditDescInput] = useState('');

  // Find target group
  const group = useMemo((): Contact => {
    const found = groupContacts.find(g => g.id === groupId) || contacts.find(c => c.id === groupId);
    if (found) return found;
    return {
      id: groupId,
      name: 'Group Chat',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      status: 'Group',
      isOnline: true,
      unreadCount: 0,
      isGroup: true,
      members: [],
      groupMembers: [],
      admins: [],
      mutedMembers: [],
      bannedMembers: [],
      joinRequests: [],
      activityLogs: [],
      deletedMessageLogs: [],
      inviteLink: `https://calchat.app/join/${groupId}`,
      inviteLinkDisabled: false,
      isPublic: false,
      joinApprovalRequired: false,
    };
  }, [groupContacts, contacts, groupId]);

  // Roles determination
  const isOwner = Boolean(
    (group.ownerId && (group.ownerId === myUid || group.ownerId === currentUser.id)) ||
    (group.createdBy && (group.createdBy === myUid || group.createdBy === currentUser.id))
  );

  const isGroupAdmin = isOwner || Boolean(
    Array.isArray(group.admins) && (
      group.admins.includes(myUid) || group.admins.includes(currentUser.id)
    )
  );

  const memberList = useMemo(() => {
    return getGroupMembersList(group, allRegisteredUsers, contacts, currentUser);
  }, [group, allRegisteredUsers, contacts, currentUser]);

  const filteredMembers = useMemo(() => {
    if (!searchMemberQuery.trim()) return memberList;
    const q = searchMemberQuery.toLowerCase();
    return memberList.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
  }, [memberList, searchMemberQuery]);

  const activityLogsList = useMemo(() => {
    const logs: GroupActivityLog[] = Array.isArray(group.activityLogs) ? group.activityLogs : [];
    if (!searchActivityQuery.trim()) return logs;
    const q = searchActivityQuery.toLowerCase();
    return logs.filter(l => l.actorName.toLowerCase().includes(q) || l.details.toLowerCase().includes(q) || l.action.toLowerCase().includes(q));
  }, [group.activityLogs, searchActivityQuery]);

  const deletedLogsList = useMemo(() => {
    return (Array.isArray(group.deletedMessageLogs) ? group.deletedMessageLogs : []) as DeletedMessageLog[];
  }, [group.deletedMessageLogs]);

  const joinRequestsList = useMemo(() => {
    return (Array.isArray(group.joinRequests) ? group.joinRequests : []) as GroupJoinRequest[];
  }, [group.joinRequests]);

  const currentPermissions: GroupPermissions = useMemo(() => {
    return {
      sendMessages: true,
      sendImages: true,
      sendVideos: true,
      sendFiles: true,
      sendVoice: true,
      sendGifs: true,
      editGroupInfo: true,
      addMembers: true,
      shareInviteLink: true,
      startGroupCalls: true,
      onlyAdminsSend: false,
      disableMediaSharing: false,
      ...(group.permissions || {}),
    };
  }, [group.permissions]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveName = async () => {
    if (!editNameInput.trim()) return;
    try {
      await updateGroupDetails(groupId, { name: editNameInput.trim() });
      setIsEditingName(false);
      showToast('Group name updated!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update group name');
    }
  };

  const handleSaveDesc = async () => {
    try {
      await updateGroupDetails(groupId, { description: editDescInput.trim() });
      setIsEditingDesc(false);
      showToast('Group description updated!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update group description');
    }
  };

  const handleTogglePermission = async (key: keyof GroupPermissions) => {
    if (!isGroupAdmin) {
      showToast('Only admins can change group permissions');
      return;
    }
    const val = !currentPermissions[key];
    try {
      await updateGroupPermissions(groupId, { [key]: val });
      showToast('Permission updated');
    } catch (err: any) {
      showToast(err.message || 'Failed to update permission');
    }
  };

  const handleCopyInviteLink = () => {
    const link = group.inviteLink || `https://calchat.app/join/${group.id}`;
    navigator.clipboard.writeText(link);
    showToast('Group invite link copied to clipboard!');
  };

  const handleRegenerateLink = async () => {
    try {
      const newLink = await regenerateGroupInviteLink(groupId);
      showToast('New invite link generated!');
    } catch (err: any) {
      showToast('Failed to regenerate invite link');
    }
  };

  const handleConfirmTransfer = async () => {
    if (!selectedTransferTarget) return;
    try {
      await transferGroupOwnership(groupId, selectedTransferTarget.id);
      setShowTransferModal(false);
      setSelectedTransferTarget(null);
      showToast(`Ownership transferred to ${selectedTransferTarget.name}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to transfer ownership');
    }
  };

  const handleDeleteGroupPermanently = async () => {
    try {
      await deleteGroup(groupId);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete group');
    }
  };

  // Helper for generating SVG QR matrix mock for group invite
  const inviteUrl = group.inviteLink || `https://calchat.app/join/${group.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] bg-[#00a8ff] text-[#0b141a] px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className={`w-full max-w-2xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
        isDark ? 'bg-[#111b21] border-[#202c33] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <img
                src={group.avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80'}
                alt={group.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#00a8ff]"
              />
              {isOwner ? (
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black p-0.5 rounded-full shadow" title="Group Owner">
                  <Crown className="w-3 h-3" />
                </div>
              ) : isGroupAdmin ? (
                <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white p-0.5 rounded-full shadow" title="Admin">
                  <Shield className="w-3 h-3" />
                </div>
              ) : null}
            </div>

            <div className="min-w-0">
              <h2 className="font-bold text-base truncate flex items-center gap-2">
                <span>{group.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  isOwner
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : isGroupAdmin
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-emerald-500/15 text-emerald-400'
                }`}>
                  {isOwner ? '👑 Owner' : isGroupAdmin ? '🛡️ Admin' : '👤 Member'}
                </span>
              </h2>
              <p className={`text-xs truncate ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                {memberList.length} members • {group.isPublic ? 'Public Group' : 'Private Group'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#222e35] text-[#8696a0]' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className={`px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 ${
          isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-gray-100 border-gray-200'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#00a8ff] text-[#0b141a] shadow-md'
                : isDark ? 'text-[#8696a0] hover:bg-[#182229]' : 'text-gray-600 hover:bg-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'members'
                ? 'bg-[#00a8ff] text-[#0b141a] shadow-md'
                : isDark ? 'text-[#8696a0] hover:bg-[#182229]' : 'text-gray-600 hover:bg-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({memberList.length})</span>
          </button>

          {(isGroupAdmin || joinRequestsList.length > 0) && (
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer relative ${
                activeTab === 'requests'
                  ? 'bg-[#00a8ff] text-[#0b141a] shadow-md'
                  : isDark ? 'text-[#8696a0] hover:bg-[#182229]' : 'text-gray-600 hover:bg-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Requests</span>
              {joinRequestsList.length > 0 && (
                <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {joinRequestsList.length}
                </span>
              )}
            </button>
          )}

          {isGroupAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('permissions')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'permissions'
                  ? 'bg-[#00a8ff] text-[#0b141a] shadow-md'
                  : isDark ? 'text-[#8696a0] hover:bg-[#182229]' : 'text-gray-600 hover:bg-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Permissions</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-[#00a8ff] text-[#0b141a] shadow-md'
                : isDark ? 'text-[#8696a0] hover:bg-[#182229]' : 'text-gray-600 hover:bg-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity Log</span>
          </button>

          {isGroupAdmin && deletedLogsList.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('deleted_logs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'deleted_logs'
                  ? 'bg-[#00a8ff] text-[#0b141a] shadow-md'
                  : isDark ? 'text-[#8696a0] hover:bg-[#182229]' : 'text-gray-600 hover:bg-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Deleted Logs ({deletedLogsList.length})</span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: OVERVIEW & SETTINGS */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Group Name & Description Card */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-gray-50 border-gray-200'
              }`}>
                {/* Name */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#8696a0] uppercase tracking-wider">Group Name</label>
                    {isGroupAdmin && !isEditingName && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditNameInput(group.name);
                          setIsEditingName(true);
                        }}
                        className="text-xs text-[#00a8ff] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {isEditingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={editNameInput}
                        onChange={e => setEditNameInput(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-[#00a8ff] ${
                          isDark ? 'bg-[#0b141a] border-[#202c33] text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Enter group name..."
                      />
                      <button
                        type="button"
                        onClick={handleSaveName}
                        className="px-3 py-2 rounded-xl bg-[#00a8ff] text-[#0b141a] font-bold text-xs cursor-pointer active:scale-95"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(false)}
                        className={`px-3 py-2 rounded-xl font-bold text-xs cursor-pointer ${
                          isDark ? 'bg-[#222e35] text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="font-bold text-base">{group.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#8696a0] uppercase tracking-wider">Group Description</label>
                    {isGroupAdmin && !isEditingDesc && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditDescInput(group.description || group.about || '');
                          setIsEditingDesc(true);
                        }}
                        className="text-xs text-[#00a8ff] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {isEditingDesc ? (
                    <div className="space-y-2 mt-1">
                      <textarea
                        rows={3}
                        value={editDescInput}
                        onChange={e => setEditDescInput(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#00a8ff] ${
                          isDark ? 'bg-[#0b141a] border-[#202c33] text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Add group description / rules..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingDesc(false)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                            isDark ? 'bg-[#222e35] text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDesc}
                          className="px-3 py-1.5 rounded-xl bg-[#00a8ff] text-[#0b141a] font-bold text-xs cursor-pointer active:scale-95"
                        >
                          Save Description
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {group.description || group.about || 'No group description set yet.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Invite Link & QR Code Card */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-[#00a8ff]" />
                    <span className="font-bold text-xs uppercase tracking-wider text-[#8696a0]">Group Invite Link</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Code</span>
                  </button>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono break-all ${
                  isDark ? 'bg-[#0b141a] border-[#202c33] text-gray-300' : 'bg-white border-gray-300 text-gray-800'
                }`}>
                  <span className="truncate mr-2">{inviteUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="p-1.5 rounded-lg bg-[#00a8ff]/20 text-[#00a8ff] hover:bg-[#00a8ff]/30 cursor-pointer shrink-0"
                    title="Copy Link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isGroupAdmin && (
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleRegenerateLink}
                      className="text-xs text-[#00a8ff] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Regenerate Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleGroupInviteLinkDisabled(groupId)}
                      className={`text-xs font-bold flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg ${
                        group.inviteLinkDisabled
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {group.inviteLinkDisabled ? 'Disabled (Enable)' : 'Active (Disable)'}
                    </button>
                  </div>
                )}
              </div>

              {/* Privacy & Security Settings Card */}
              {isGroupAdmin && (
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#8696a0] mb-2 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#00a8ff]" />
                    <span>Privacy & Security Controls</span>
                  </h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs">Public Group Visibility</p>
                      <p className={`text-[11px] ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                        {group.isPublic ? 'Anyone can search and view group' : 'Private group (invite only)'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateGroupPrivacy(groupId, !group.isPublic, !!group.joinApprovalRequired)}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                        group.isPublic ? 'bg-[#00a8ff]' : isDark ? 'bg-[#222e35]' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        group.isPublic ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-500/20">
                    <div>
                      <p className="font-bold text-xs">Require Join Approval</p>
                      <p className={`text-[11px] ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                        Admins must approve requests before new members can join
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateGroupPrivacy(groupId, !!group.isPublic, !group.joinApprovalRequired)}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                        group.joinApprovalRequired ? 'bg-[#00a8ff]' : isDark ? 'bg-[#222e35]' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        group.joinApprovalRequired ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200'
              }`}>
                <h3 className="font-bold text-xs uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Management Actions</span>
                </h3>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Transfer Group Ownership</span>
                  </button>
                )}

                {isGroupAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Group Chat History for Everyone</span>
                  </button>
                )}

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-500 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Group Permanently</span>
                  </button>
                )}

                {!isOwner && (
                  <button
                    type="button"
                    onClick={async () => {
                      await leaveGroup(groupId);
                      onClose();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Leave Group</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MEMBERS & ROLES */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Top Controls: Search + Add Members Button */}
              <div className="flex items-center gap-2">
                <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border ${
                  isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-gray-100 border-gray-200'
                }`}>
                  <Search className="w-4 h-4 text-[#8696a0]" />
                  <input
                    type="text"
                    value={searchMemberQuery}
                    onChange={e => setSearchMemberQuery(e.target.value)}
                    placeholder="Search members..."
                    className="w-full bg-transparent text-xs focus:outline-none"
                  />
                </div>

                {isGroupAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowSelectMembersModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Members</span>
                  </button>
                )}
              </div>

              {/* Members List */}
              <div className="space-y-2">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#8696a0]">
                    No members match your search query.
                  </div>
                ) : (
                  filteredMembers.map((m, idx) => {
                    const isTargetOwner = m.role === 'Creator';
                    const isTargetAdmin = m.role === 'Admin' || isTargetOwner;
                    const isSelf = m.id === myUid || m.id === currentUser.id;

                    const isTargetMuted = Array.isArray(group.mutedMembers) && (group.mutedMembers.includes(m.id) || group.mutedMembers.includes(m.name));
                    const isTargetBanned = Array.isArray(group.bannedMembers) && (group.bannedMembers.includes(m.id) || group.bannedMembers.includes(m.name));

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                          isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                              alt={m.name}
                              className="w-10 h-10 rounded-full object-cover border border-[#00a8ff]/30"
                            />
                            {isTargetMuted && (
                              <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-0.5 rounded-full" title="Muted">
                                <VolumeX className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs truncate">{m.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                                m.role === 'Creator'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : m.role === 'Admin'
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'bg-emerald-500/15 text-emerald-400'
                              }`}>
                                {m.role === 'Creator' ? '👑 Owner' : m.role === 'Admin' ? '🛡️ Admin' : '👤 Member'}
                              </span>
                            </div>
                            <p className={`text-[10px] ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                              {isSelf ? 'You' : `ID: ${m.id}`}
                            </p>
                          </div>
                        </div>

                        {/* Management Actions per member */}
                        {isGroupAdmin && !isSelf && (
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Owner controls: Promote / Demote Admin */}
                            {isOwner && !isTargetOwner && (
                              <button
                                type="button"
                                onClick={() => toggleGroupAdmin(groupId, m.id || m.name)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                  m.role === 'Admin'
                                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30'
                                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20'
                                }`}
                                title={m.role === 'Admin' ? 'Demote from Admin' : 'Promote to Admin'}
                              >
                                {m.role === 'Admin' ? 'Demote' : 'Make Admin'}
                              </button>
                            )}

                            {/* Admin or Owner controls: Mute/Unmute */}
                            {(!isTargetOwner && (isOwner || !isTargetAdmin)) && (
                              <button
                                type="button"
                                onClick={() => toggleGroupMuteMember(groupId, m.id || m.name)}
                                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isTargetMuted
                                    ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                                    : isDark ? 'hover:bg-[#222e35] text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                                }`}
                                title={isTargetMuted ? 'Unmute member' : 'Mute member'}
                              >
                                {isTargetMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                              </button>
                            )}

                            {/* Admin or Owner controls: Remove Member */}
                            {(!isTargetOwner && (isOwner || !isTargetAdmin)) && (
                              <button
                                type="button"
                                onClick={() => removeMemberFromGroup(groupId, m.id || m.name)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title={`Remove ${m.name}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: JOIN REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#8696a0] flex items-center justify-between">
                <span>Pending Join Requests ({joinRequestsList.length})</span>
                {joinRequestsList.length > 0 && (
                  <span className="text-amber-400 text-[11px] normal-case">Approval required to join</span>
                )}
              </h3>

              {joinRequestsList.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#8696a0]">
                  No pending join requests for this group.
                </div>
              ) : (
                <div className="space-y-2">
                  {joinRequestsList.map(req => (
                    <div
                      key={req.id || req.userId}
                      className={`p-3 rounded-2xl border flex items-center justify-between ${
                        isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={req.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={req.userName}
                          className="w-10 h-10 rounded-full object-cover border border-[#00a8ff]"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate">{req.userName}</p>
                          <p className={`text-[10px] ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                            Requested on {new Date(req.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {isGroupAdmin && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => approveJoinRequest(groupId, req.userId)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectJoinRequest(groupId, req.userId)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GROUP PERMISSIONS CONFIGURATION */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-sm">Group Permission Settings</h3>
                  <p className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                    Configure what regular members are allowed to do inside this group
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'sendMessages', label: 'Send Messages', desc: 'Allow sending text chat messages', icon: MessageSquare },
                  { key: 'sendImages', label: 'Send Images', desc: 'Allow sending photo attachments', icon: Image },
                  { key: 'sendVideos', label: 'Send Videos', desc: 'Allow sending video recordings', icon: Video },
                  { key: 'sendFiles', label: 'Send Files', desc: 'Allow sending PDF/Doc attachments', icon: File },
                  { key: 'sendVoice', label: 'Send Voice Notes', desc: 'Allow sending audio voice notes', icon: Mic },
                  { key: 'sendGifs', label: 'Send GIFs & Stickers', desc: 'Allow sending stickers & animated GIFs', icon: Smile },
                  { key: 'editGroupInfo', label: 'Edit Group Info', desc: 'Allow editing group name & photo', icon: Edit3 },
                  { key: 'addMembers', label: 'Add New Members', desc: 'Allow members to invite friends', icon: UserPlus },
                  { key: 'shareInviteLink', label: 'Share Invite Link', desc: 'Allow members to view/share invite link', icon: LinkIcon },
                  { key: 'startGroupCalls', label: 'Start Group Calls', desc: 'Allow initiating group voice/video calls', icon: PhoneCall },
                  { key: 'onlyAdminsSend', label: 'Only Admins Send', desc: 'Restrict message sending to admins only', icon: Lock },
                  { key: 'disableMediaSharing', label: 'Disable Media Sharing', desc: 'Turn off all media attachments', icon: Ban },
                ].map(({ key, label, desc, icon: Icon }) => {
                  const permKey = key as keyof GroupPermissions;
                  const isChecked = Boolean(currentPermissions[permKey]);

                  return (
                    <div
                      key={key}
                      onClick={() => handleTogglePermission(permKey)}
                      className={`p-3.5 rounded-2xl border flex items-start justify-between cursor-pointer transition-all ${
                        isChecked
                          ? isDark ? 'bg-[#182229] border-[#00a8ff]/40' : 'bg-blue-50/50 border-[#00a8ff]/40'
                          : isDark ? 'bg-[#182229]/50 border-[#202c33] opacity-60' : 'bg-gray-100 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 pr-2">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          isChecked ? 'bg-[#00a8ff]/15 text-[#00a8ff]' : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate">{label}</p>
                          <p className={`text-[10px] leading-tight mt-0.5 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>{desc}</p>
                        </div>
                      </div>

                      <div className={`relative w-10 h-5 rounded-full transition-colors shrink-0 mt-1 ${
                        isChecked ? 'bg-[#00a8ff]' : 'bg-gray-400'
                      }`}>
                        <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                          isChecked ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: REAL-TIME ACTIVITY LOG */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border ${
                  isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-gray-100 border-gray-200'
                }`}>
                  <Search className="w-4 h-4 text-[#8696a0]" />
                  <input
                    type="text"
                    value={searchActivityQuery}
                    onChange={e => setSearchActivityQuery(e.target.value)}
                    placeholder="Search activity logs..."
                    className="w-full bg-transparent text-xs focus:outline-none"
                  />
                </div>
              </div>

              {activityLogsList.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#8696a0]">
                  No group activity logs recorded yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {activityLogsList.map((log, idx) => (
                    <div
                      key={log.id || idx}
                      className={`p-3 rounded-2xl border flex items-start gap-3 transition-all ${
                        isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-[#00a8ff]/15 text-[#00a8ff] shrink-0 mt-0.5">
                        <History className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#00a8ff]">{log.action || 'ACTION'}</span>
                          <span className={`text-[10px] ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold mt-0.5">{log.details}</p>
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                          Actor: {log.actorName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DELETED MESSAGES LOG */}
          {activeTab === 'deleted_logs' && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#8696a0]">
                Deleted Message Audit Trail ({deletedLogsList.length})
              </h3>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {deletedLogsList.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className={`p-3 rounded-2xl border space-y-1 ${
                      isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                      <span>Original Sender: {log.senderName}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs italic bg-black/20 p-2 rounded-xl border border-rose-500/20 text-gray-300">
                      "{log.originalText}"
                    </p>
                    <p className="text-[10px] text-rose-400 font-semibold">
                      Deleted by Admin: {log.deletedByName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Select Members Modal */}
      {showSelectMembersModal && (
        <SelectMembersModal
          groupId={groupId}
          groupName={group.name}
          existingMembers={memberList.map(m => m.id)}
          onClose={() => setShowSelectMembersModal(false)}
          onMembersAdded={count => showToast(`${count} member(s) added!`)}
        />
      )}

      {/* Group QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-sm rounded-3xl p-6 border text-center space-y-4 ${
            isDark ? 'bg-[#111b21] border-[#202c33] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Group QR Code</h3>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl inline-block shadow-xl border-4 border-[#00a8ff]">
              <div className="w-48 h-48 bg-gradient-to-br from-gray-900 to-black rounded-xl flex flex-col items-center justify-center text-white p-4 font-mono text-[10px]">
                <QrCode className="w-24 h-24 text-[#00a8ff] mb-2 animate-pulse" />
                <span className="text-emerald-400 font-bold truncate max-w-full">{group.name}</span>
                <span className="text-gray-400 text-[8px] mt-1">Scan to join group</span>
              </div>
            </div>

            <p className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
              Anyone with this QR code can scan to join <span className="font-bold text-[#00a8ff]">{group.name}</span>.
            </p>

            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="w-full py-2.5 rounded-xl bg-[#00a8ff] text-[#0b141a] font-bold text-xs cursor-pointer active:scale-95"
            >
              Copy Invite Link
            </button>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-md rounded-3xl p-6 border space-y-4 ${
            isDark ? 'bg-[#111b21] border-[#202c33] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <h3 className="font-bold text-base flex items-center gap-2 text-amber-400">
              <Crown className="w-5 h-5" />
              <span>Transfer Group Ownership</span>
            </h3>

            <p className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-600'}`}>
              Select a member to become the new <span className="font-bold text-amber-400">Group Owner</span>. You will remain an admin.
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {memberList.filter(m => m.role !== 'Creator').map(m => (
                <div
                  key={m.id}
                  onClick={() => setSelectedTransferTarget(m)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedTransferTarget?.id === m.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img src={m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} className="w-8 h-8 rounded-full object-cover" alt="" />
                    <span className="font-bold text-xs">{m.name}</span>
                  </div>
                  {selectedTransferTarget?.id === m.id && <Check className="w-4 h-4 text-amber-400" />}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isDark ? 'bg-[#222e35] text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedTransferTarget}
                onClick={handleConfirmTransfer}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-extrabold text-xs cursor-pointer"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-sm rounded-3xl p-6 border space-y-4 text-center ${
            isDark ? 'bg-[#111b21] border-[#202c33] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base">Clear Group Chat History?</h3>
            <p className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-600'}`}>
              This will permanently delete all messages for all members in this group.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs ${
                  isDark ? 'bg-[#222e35] text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowClearConfirm(false);
                  await clearGroupChatHistoryForEveryone(groupId);
                  showToast('Group chat history cleared!');
                }}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-sm rounded-3xl p-6 border space-y-4 text-center ${
            isDark ? 'bg-[#111b21] border-[#202c33] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-rose-500">Delete Group Permanently?</h3>
            <p className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-600'}`}>
              As the Group Owner, this action will permanently delete <span className="font-bold text-white">{group.name}</span> and remove all members.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs ${
                  isDark ? 'bg-[#222e35] text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGroupPermanently}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
