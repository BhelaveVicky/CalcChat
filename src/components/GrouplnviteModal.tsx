import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, Clock, X, ShieldAlert, ArrowRight, Link as LinkIcon, Send } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GroupJoinRequest } from '../types';

interface GroupInviteModalProps {
  isOpen?: boolean;
  groupId?: string | null;
  onClose?: () => void;
  onSelectGroup?: (groupId: string) => void;
}

export const GroupInviteModal: React.FC<GroupInviteModalProps> = ({
  isOpen: propsIsOpen,
  groupId: propsGroupId,
  onClose: propsOnClose,
  onSelectGroup,
}) => {
  const { groupContacts = [], contacts = [], user: vaultUser, authUser, requestToJoinGroup } = useVault();

  const [activeGroupId, setActiveGroupId] = useState<string | null>(propsGroupId || null);
  const [isOpen, setIsOpen] = useState<boolean>(Boolean(propsIsOpen));
  const [loading, setLoading] = useState<boolean>(false);
  const [groupData, setGroupData] = useState<any>(null);
  const [hasRequested, setHasRequested] = useState<boolean>(false);
  const [requestSentToast, setRequestSentToast] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');

  const handleClose = () => {
    setIsOpen(false);
    setActiveGroupId(null);
    setGroupData(null);
    setHasRequested(false);
    setRequestSentToast(false);
    setManualInput('');
    if (propsOnClose) propsOnClose();
  };

  // Sync props if passed
  useEffect(() => {
    if (propsGroupId) {
      setActiveGroupId(propsGroupId);
    }
    if (propsIsOpen !== undefined) {
      setIsOpen(propsIsOpen);
    }
  }, [propsGroupId, propsIsOpen]);

  // Listen for global custom event 'openGroupInvite'
  useEffect(() => {
    const handleOpenEvent = (e: any) => {
      const gId = e.detail?.groupId;
      if (gId) {
        setActiveGroupId(gId);
        setIsOpen(true);
      }
    };

    window.addEventListener('openGroupInvite', handleOpenEvent);
    return () => {
      window.removeEventListener('openGroupInvite', handleOpenEvent);
    };
  }, []);

  const myUid = authUser?.uid || vaultUser?.id || vaultUser?.firebaseUid || '';

  // Fetch or resolve group data whenever activeGroupId changes
  useEffect(() => {
    if (!isOpen || !activeGroupId) return;

    let cleanId = activeGroupId;
    if (cleanId.startsWith('g_group_')) {
      cleanId = cleanId.replace('g_', '');
    }

    // Check local contacts first
    const localGroup = groupContacts.find(g => g.id === cleanId || g.id === activeGroupId) ||
                       contacts.find(c => c.id === cleanId || c.id === activeGroupId);

    if (localGroup) {
      setGroupData(localGroup);
      const reqs = (localGroup.joinRequests || []) as GroupJoinRequest[];
      if (reqs.some(r => r.userId === myUid)) {
        setHasRequested(true);
      }
    } else if (db) {
      // Fetch from Firestore doc if not available locally
      setLoading(true);
      getDoc(doc(db, 'groups', cleanId))
        .then(snap => {
          if (snap.exists()) {
            const data = snap.data();
            const resolved = {
              id: cleanId,
              name: data.name || data.groupName || 'Group Chat',
              avatar: data.avatar || data.photoURL || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
              description: data.description || data.about || 'Official Group Chat',
              members: data.members || data.memberUids || [],
              groupMembers: data.groupMembers || data.memberNames || [],
              ownerId: data.ownerId || data.createdBy,
              createdBy: data.createdBy,
              admins: data.admins || [],
              inviteLinkDisabled: !!data.inviteLinkDisabled,
              joinRequests: data.joinRequests || [],
            };
            setGroupData(resolved);
            if (Array.isArray(resolved.joinRequests) && resolved.joinRequests.some((r: any) => r.userId === myUid)) {
              setHasRequested(true);
            }
          } else {
            // Fallback object for missing doc
            setGroupData({
              id: cleanId,
              name: 'Group Chat',
              avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
              description: 'Official Group Chat',
              members: [],
              inviteLinkDisabled: false,
              joinRequests: [],
            });
          }
        })
        .catch(() => {
          setGroupData({
            id: cleanId,
            name: 'Group Chat',
            avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
            description: 'Official Group Chat',
            members: [],
            inviteLinkDisabled: false,
            joinRequests: [],
          });
        })
        .finally(() => setLoading(false));
    } else {
      setGroupData({
        id: cleanId,
        name: 'Group Chat',
        avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
        description: 'Official Group Chat',
        members: [],
        inviteLinkDisabled: false,
        joinRequests: [],
      });
    }
  }, [isOpen, activeGroupId, groupContacts, contacts, myUid]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    let raw = manualInput.trim();
    const joinMatch = raw.match(/\/join\/([^/\s?#]+)/i);
    if (joinMatch && joinMatch[1]) {
      raw = joinMatch[1];
    }
    if (raw.startsWith('g_')) raw = raw.replace(/^g_/, '');
    const clean = raw.startsWith('group_') ? raw : (raw.includes('_') ? raw : `group_${raw}`);
    setActiveGroupId(clean);
  };

  if (!isOpen) return null;

  const targetId = groupData?.id || activeGroupId;
  const isMember = groupData && (
    (Array.isArray(groupData.members) && groupData.members.includes(myUid)) ||
    (Array.isArray(groupData.memberUids) && groupData.memberUids.includes(myUid))
  );
  const isDisabled = groupData?.inviteLinkDisabled === true;
  const memberCount = groupData
    ? (groupData.members?.length || groupData.groupMembers?.length || 1)
    : 1;

  const handleSendRequest = async () => {
    if (!targetId) return;
    await requestToJoinGroup(targetId);
    setHasRequested(true);
    setRequestSentToast(true);
    setTimeout(() => {
      setRequestSentToast(false);
    }, 4000);
  };

  const handleOpenGroupChat = () => {
    if (onSelectGroup && targetId) {
      onSelectGroup(targetId);
    } else {
      // Dispatch event to select chat globally
      window.dispatchEvent(new CustomEvent('selectChatContact', { detail: { contactId: targetId } }));
    }
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans select-none">
      <div className="w-full max-w-md bg-[#111b21] text-white border border-[#202c33] rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-[#202c33] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon Badge */}
        <div className="w-10 h-10 rounded-2xl bg-[#00a8ff]/15 text-[#00a8ff] flex items-center justify-center mb-4 border border-[#00a8ff]/30">
          <LinkIcon className="w-5 h-5" />
        </div>

        <h2 className="text-xl font-black text-white mb-1 tracking-tight">
          Group Invite Link
        </h2>
        <p className="text-xs text-[#8696a0] mb-6">
          You were invited to join a CalChat group
        </p>

        {!activeGroupId ? (
          <form onSubmit={handleManualSubmit} className="w-full space-y-4">
            <div className="text-left">
              <label className="text-xs font-bold text-[#8696a0] block mb-1.5">
                Paste Group Invite Link or ID
              </label>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="https://calchat.app/join/group_123..."
                className="w-full px-4 py-3 rounded-2xl bg-[#182229] border border-[#202c33] text-white text-xs focus:outline-none focus:border-[#00a8ff]"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-[#00a8ff] hover:bg-[#0088cc] disabled:opacity-50 text-[#0b141a] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Preview & Join Group</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#00a8ff] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#8696a0] font-medium">Loading group details...</p>
          </div>
        ) : (
          <>
            {/* Group Preview Card */}
            <div className="w-full bg-[#182229] border border-[#202c33] rounded-2xl p-5 mb-6 flex flex-col items-center">
              {/* Group Avatar */}
              <div className="relative mb-3">
                {groupData?.avatar ? (
                  <img
                    src={groupData.avatar}
                    alt={groupData.name || 'Group'}
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#00a8ff]/40 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#1f2c34] text-[#00a8ff] border-2 border-[#00a8ff]/40 flex items-center justify-center font-bold text-2xl shadow-lg">
                    {groupData?.name?.charAt(0) || 'G'}
                  </div>
                )}
              </div>

              {/* Group Name */}
              <h3 className="text-lg font-extrabold text-white truncate max-w-full mb-1">
                {groupData?.name || 'Group Chat'}
              </h3>

              {/* Description */}
              <p className="text-xs text-[#8696a0] line-clamp-2 max-w-full mb-3 px-2">
                {groupData?.description || 'Official Group Chat'}
              </p>

              {/* Member count pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#202c33] text-[#00a8ff] text-xs font-bold border border-[#00a8ff]/20">
                <Users className="w-3.5 h-3.5" />
                <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
              </div>
            </div>

            {/* Request Toast Notification */}
            {requestSentToast && (
              <div className="w-full mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Join request sent to group owner! You will be notified once accepted.</span>
              </div>
            )}

            {/* STATUS & ACTIONS */}
            {isMember ? (
              <div className="w-full space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>You are already a member of this group</span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenGroupChat}
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
                >
                  <span>Open Group Chat</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : isDisabled ? (
              <div className="w-full space-y-3">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>This invite link has been disabled by group admins</span>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#202c33] hover:bg-[#2a3942] text-white transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : hasRequested ? (
              <div className="w-full space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold leading-relaxed text-left flex items-start gap-2.5">
                  <Clock className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-amber-300 text-xs mb-0.5">
                      Join Request Sent ⏳
                    </p>
                    <p className="text-[11px] text-amber-200/80">
                      Your request was sent to the group owner. Once accepted, you will directly join the group chat!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#202c33] text-amber-400/80 border border-amber-500/30 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>Request Pending Owner Approval</span>
                </button>
              </div>
            ) : (
              <div className="w-full space-y-3">
                <p className="text-xs text-[#8696a0]">
                  Click below to send a join request to the group owner.
                </p>

                <button
                  type="button"
                  onClick={handleSendRequest}
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Join Request</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
