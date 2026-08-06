import React, { useState, useMemo, useEffect } from 'react';
import { Users, UserPlus, UserCheck, Search, X, Check, Shield, Plus, Sparkles } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useVault } from '../context/VaultContext';
import { checkIsAdmin, VerifiedBadge } from '../lib/adminUtils';

interface SelectMembersModalProps {
  groupId: string;
  groupName?: string;
  existingMembers?: string[];
  onClose: () => void;
  onMembersAdded?: (count: number) => void;
}

export const SelectMembersModal: React.FC<SelectMembersModalProps> = ({
  groupId,
  groupName = 'Group',
  existingMembers = [],
  onClose,
  onMembersAdded,
}) => {
  const { 
    authUser, 
    user: currentUser, 
    contacts, 
    groupContacts,
    allRegisteredUsers, 
    addMembersToGroup,
    settings,
  } = useVault();

  const isDark = settings.theme !== 'material-light' && settings.theme !== 'light';
  const myUid = authUser?.uid || currentUser.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scoped member UIDs for THIS current group only
  const [groupDocMembers, setGroupDocMembers] = useState<string[]>([]);
  const [localAddedUids, setLocalAddedUids] = useState<string[]>([]);

  // Requirement 1 & 6: Fetch current group's document from Firestore and/or groupContacts scoped to groupId
  useEffect(() => {
    if (!groupId) return;

    // Read initial member state from local groupContacts for this groupId
    const grp = groupContacts.find(g => g.id === groupId);
    if (grp) {
      const uids = Array.isArray(grp.members) && grp.members.length > 0
        ? grp.members
        : Array.isArray(grp.memberUids) ? grp.memberUids : [];
      if (uids.length > 0) {
        setGroupDocMembers(uids.map(u => String(u)));
      }
    }

    // Subscribe to Firestore doc for this current group only
    if (db) {
      const groupRef = doc(db, 'groups', groupId);
      const unsubscribe = onSnapshot(
        groupRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const uids = data.members || data.memberUids || [];
            if (Array.isArray(uids)) {
              setGroupDocMembers(uids.map(u => String(u)));
            }
          }
        },
        (err) => {
          console.warn('Snapshot listener for group members error:', err);
        }
      );
      return () => unsubscribe();
    }
  }, [groupId, groupContacts]);

  // Requirement 2 & 5: Build a Set of member UIDs for ONLY the current group.
  const currentGroupMemberUidsSet = useMemo(() => {
    const set = new Set<string>();

    // 1. Members from current group document
    groupDocMembers.forEach(uid => {
      if (uid && typeof uid === 'string') {
        set.add(uid);
        set.add(uid.toLowerCase());
      }
    });

    // 2. Members from groupContacts for this groupId specifically
    const grp = groupContacts.find(g => g.id === groupId);
    if (grp) {
      if (Array.isArray(grp.members)) {
        grp.members.forEach(m => {
          if (m && typeof m === 'string') {
            set.add(m);
            set.add(m.toLowerCase());
          }
        });
      }
      if (Array.isArray(grp.memberUids)) {
        grp.memberUids.forEach(m => {
          if (m && typeof m === 'string') {
            set.add(m);
            set.add(m.toLowerCase());
          }
        });
      }
      if (grp.createdBy) {
        set.add(String(grp.createdBy));
        set.add(String(grp.createdBy).toLowerCase());
      }
      if (grp.ownerId) {
        set.add(String(grp.ownerId));
        set.add(String(grp.ownerId).toLowerCase());
      }
    }

    // 3. Member UIDs from existingMembers prop (filtered to this group)
    if (Array.isArray(existingMembers)) {
      existingMembers.forEach(m => {
        if (m && typeof m === 'string') {
          set.add(m);
          set.add(m.toLowerCase());
        }
      });
    }

    // 4. Locally added UIDs in this session
    localAddedUids.forEach(u => {
      set.add(u);
      set.add(u.toLowerCase());
    });

    return set;
  }, [groupDocMembers, groupContacts, groupId, existingMembers, localAddedUids]);

  // Consolidate candidate users list from contacts & allRegisteredUsers
  const availableUsers = useMemo(() => {
    const userMap = new Map<string, any>();

    // 1. Add registered users
    (allRegisteredUsers || []).forEach(u => {
      const uid = u.uid || u.id;
      if (!uid || uid === myUid) return;
      userMap.set(uid, {
        id: uid,
        uid: uid,
        name: u.displayName || u.name || 'CalChat User',
        username: u.username || '',
        email: u.email || '',
        avatar: u.photoURL || u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        isOnline: u.online || false,
        role: u.role,
      });
    });

    // 2. Add non-group contacts
    (contacts || []).forEach(c => {
      if (c.isGroup || c.isSelf || c.id === myUid) return;
      if (!userMap.has(c.id)) {
        userMap.set(c.id, {
          id: c.id,
          uid: c.id,
          name: c.name,
          username: c.username || '',
          email: c.email || '',
          avatar: c.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          isOnline: c.isOnline || false,
          role: (c as any).role,
        });
      }
    });

    return Array.from(userMap.values());
  }, [allRegisteredUsers, contacts, myUid]);

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return availableUsers;
    const q = searchQuery.toLowerCase().trim();
    return availableUsers.filter(u => 
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [availableUsers, searchQuery]);

  // Requirement 2 & 3: Compare each user's UID/ID only against currentGroup.members
  const isUserInGroup = (u: any) => {
    const userUid = String(u.uid || u.id || '');
    if (!userUid) return false;
    return currentGroupMemberUidsSet.has(userUid) || currentGroupMemberUidsSet.has(userUid.toLowerCase());
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const selectable = filteredUsers.filter(u => !isUserInGroup(u)).map(u => u.id);
    if (selectedUserIds.length >= selectable.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectable);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    // Process selected user IDs + any custom typed names/usernames
    const customList = customInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const membersToAdd = [...selectedUserIds, ...customList];
    if (membersToAdd.length === 0) {
      setToastMessage('Please select at least one member to add');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    setIsSubmitting(true);
    try {
      await addMembersToGroup(groupId, membersToAdd);
      setToastMessage(`Added ${membersToAdd.length} member${membersToAdd.length > 1 ? 's' : ''}!`);
      
      // Requirement 7: Immediately update local state so added users change to "Already Added"
      setLocalAddedUids(prev => [...prev, ...membersToAdd]);
      setSelectedUserIds([]);
      setCustomInput('');

      if (onMembersAdded) onMembersAdded(membersToAdd.length);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Error adding group members:', err);
      setToastMessage('Failed to add members. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none font-sans">
      <div className={`w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[88vh] ${
        isDark ? 'bg-[#111b21] border-[#202c33] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between border-b ${
          isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-gray-50 border-gray-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#00a8ff]/15 text-[#00a8ff] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Select Members</h3>
              <p className={`text-xs ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
                Add to <span className="font-semibold text-[#00a8ff]">{groupName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 space-y-3 border-b border-gray-500/10">
          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3.5 top-3 ${
              isDark ? 'text-[#8596a0]' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search users by name or username..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-medium focus:outline-none transition-all ${
                isDark 
                  ? 'bg-[#1f2c34] text-white placeholder-[#8596a0] border border-[#2a3942] focus:border-[#00a8ff]' 
                  : 'bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-[#00a8ff]'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            <span className={`font-semibold ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
              Available Users ({filteredUsers.length})
            </span>

            {filteredUsers.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[#00a8ff] font-bold hover:underline cursor-pointer"
              >
                {selectedUserIds.length >= filteredUsers.filter(u => !isUserInGroup(u)).length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>

        {/* User List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <Users className={`w-12 h-12 mb-2 opacity-30 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>No users found</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-[#8596a0]' : 'text-gray-400'}`}>Try searching for a different name or username</p>
            </div>
          ) : (
            filteredUsers.map(u => {
              const inGroup = isUserInGroup(u);
              const isSelected = selectedUserIds.includes(u.id);

              return (
                <div
                  key={u.id}
                  onClick={() => {
                    if (!inGroup) toggleUserSelection(u.id);
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                    inGroup
                      ? (isDark ? 'bg-[#182229]/60 opacity-60 cursor-not-allowed' : 'bg-gray-100 opacity-60 cursor-not-allowed')
                      : isSelected
                        ? (isDark ? 'bg-[#00a8ff]/15 border border-[#00a8ff]/40 cursor-pointer' : 'bg-[#00a8ff]/10 border border-[#00a8ff]/30 cursor-pointer')
                        : (isDark ? 'hover:bg-[#182229] border border-transparent cursor-pointer' : 'hover:bg-gray-100 border border-transparent cursor-pointer')
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-500/20 shadow-xs"
                      />
                      {u.isOnline && (
                        <span className="w-3 h-3 bg-emerald-500 border-2 border-[#111b21] rounded-full absolute bottom-0 right-0" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 text-left">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {u.name}
                        </span>
                        {checkIsAdmin(u) && <VerifiedBadge className="w-4 h-4 text-[#00a8ff] shrink-0" />}
                      </div>
                      <span className={`text-xs truncate ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
                        {u.username ? `@${u.username.replace(/^@/, '')}` : (u.email || 'CalChat Member')}
                      </span>
                    </div>
                  </div>

                  {/* Selection Checkbox / Tag */}
                  <div className="shrink-0 pl-2">
                    {inGroup ? (
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
                      }`}>
                        Already added
                      </span>
                    ) : (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#00a8ff] text-[#0b141a] shadow-md scale-105'
                          : (isDark ? 'border-2 border-[#2a3942] hover:border-[#00a8ff]' : 'border-2 border-gray-300 hover:border-[#00a8ff]')
                      }`}>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Manual Add by Username Box */}
        <div className={`px-4 py-3 border-t ${isDark ? 'bg-[#182229]/50 border-[#202c33]' : 'bg-gray-50 border-gray-100'}`}>
          <label className={`text-[11px] font-semibold block mb-1 text-left ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
            Add by Username or Name (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Rahul, @priya, alex (comma separated)"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium focus:outline-none ${
              isDark 
                ? 'bg-[#0b141a] text-white border border-[#2a3942] focus:border-[#00a8ff]' 
                : 'bg-white text-gray-900 border border-gray-300 focus:border-[#00a8ff]'
            }`}
          />
        </div>

        {/* Toast Alert Notice */}
        {toastMessage && (
          <div className="px-4 py-2 bg-[#00a8ff] text-[#0b141a] font-bold text-xs text-center animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* Footer Action Buttons */}
        <div className={`p-4 flex items-center justify-between border-t gap-3 ${
          isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="text-xs font-bold text-[#00a8ff]">
            {selectedUserIds.length > 0 && `${selectedUserIds.length} Selected`}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isDark ? 'bg-[#1f2c34] hover:bg-[#2a3942] text-slate-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting || (selectedUserIds.length === 0 && !customInput.trim())}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#00a8ff] hover:bg-[#0088cc] text-[#0b141a] transition-all shadow-md shadow-sky-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : (selectedUserIds.length > 0 ? `Done (${selectedUserIds.length})` : 'Done')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
