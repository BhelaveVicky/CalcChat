import React, { useCallback, useMemo, useState } from 'react';
import { Search, Check, X, Users, ShieldCheck, UserPlus, Clock } from 'lucide-react';
import { FriendRequest } from '../types';
import { useVault } from '../context/VaultContext';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { checkIsAdmin, VerifiedBadge } from '../lib/adminUtils';

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests?: FriendRequest[];
  onAccept?: (requestId: string, senderId: string) => Promise<void>;
  onReject?: (requestId: string) => Promise<void>;
}

export const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  onReject,
}) => {
  const navigate = useNavigate();
  const {
    settings,
    authUser,
    allRegisteredUsers,
    isUserOnline,
    pendingFriendRequests,
    sentFriendRequests,
    friendUids,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useVault();

  const isDark = settings.theme !== 'material-light' && settings.theme !== 'light';
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const eligibleUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!authUser) return [];

    return allRegisteredUsers
      .map((u) => {
        const uid = u.uid || u.id;
        if (!uid || uid === authUser.uid) return null;
        if (friendUids.includes(uid)) return null;
        if (Array.isArray(u.friends) && u.friends.includes(authUser.uid)) return null;

        const name = (u.displayName || u.name || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const bio = (u.about || u.status || '').toLowerCase();
        if (q && !name.includes(q) && !username.includes(q) && !bio.includes(q)) return null;

        const mutualFriendsCount = Array.isArray(u.friends)
          ? u.friends.filter((friendId: string) => friendUids.includes(friendId)).length
          : 0;

        return {
          uid,
          name: u.displayName || u.name || 'User',
          username: u.username || '',
          bio: u.about || u.status || 'Available on CalcChat',
          avatar: u.photoURL || u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          online: isUserOnline(uid),
          mutualFriendsCount,
        };
      })
      .filter(Boolean) as Array<{
        uid: string;
        name: string;
        username: string;
        bio: string;
        avatar: string;
        online: boolean;
        mutualFriendsCount: number;
      }>;
  }, [allRegisteredUsers, authUser, friendUids, searchQuery]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pendingFriendRequests.filter((req) => {
      if (!q) return true;
      const dName = (req.senderName || req.senderDisplayName || '').toLowerCase();
      const uName = (req.senderUsername || '').toLowerCase();
      const bio = (req.senderName || req.senderDisplayName || '').toLowerCase();
      return dName.includes(q) || uName.includes(q) || bio.includes(q);
    });
  }, [pendingFriendRequests, searchQuery]);

  if (!isOpen) return null;

  const handleAccept = async (requestId: string, senderId: string) => {
    if (onAccept) {
      await onAccept(requestId, senderId);
    } else {
      await acceptFriendRequest(requestId, senderId);
    }
    showToast('🎉 You are now friends!');
  };

  const handleDecline = async (requestId: string) => {
    if (onReject) {
      await onReject(requestId);
    } else {
      await rejectFriendRequest(requestId);
    }
    showToast('Request declined.');
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans select-none"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
      <motion.div 
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 24, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        className={`w-full max-w-2xl rounded-3xl p-5 sm:p-6 relative overflow-hidden max-h-[88vh] flex flex-col shadow-2xl transition-colors ${
          isDark 
            ? 'bg-[#0b141a] text-white border border-[#1f2c34]' 
            : 'bg-white text-slate-900 border border-slate-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 gap-3">
          <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Find & Manage Friends
          </h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-[#202c33]' 
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-3 relative">
          <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-colors ${
            isDark 
              ? 'bg-[#111b21] border-[#202c33] focus-within:border-[#ff2e93]' 
              : 'bg-[#fdf2f8] border-pink-100 focus-within:border-[#ff2e93]'
          }`}>
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'friends' ? 'Search users by username or name...' : 'Search pending requests...'}
              className={`w-full bg-transparent text-sm focus:outline-none ${
                isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className={`p-0.5 cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs: Friends & Requests */}
        <div className={`flex items-center gap-2 mb-4 p-1 rounded-2xl border ${
          isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-pink-50 border-pink-100'
        }`}>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'friends'
                ? 'bg-gradient-to-r from-[#ff2e93] to-[#ff60b5] text-white shadow-md shadow-[#ff2e93]/25'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#1f2c34]/50' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Friends</span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-[#ff2e93] to-[#ff60b5] text-white shadow-md shadow-[#ff2e93]/25'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#1f2c34]/50' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Requests</span>
            {pendingFriendRequests.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'requests' ? 'bg-white text-[#ff2e93]' : 'bg-rose-500 text-white'
              }`}>
                {pendingFriendRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-[220px] py-1 space-y-3">
          {activeTab === 'friends' ? (
            /* FRIENDS TAB CONTENT */
            eligibleUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center my-auto">
                <div className="relative mb-3">
                  <Users className={`w-14 h-14 stroke-[1.25] ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                </div>
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {searchQuery ? 'No matching users' : 'No users found'}
                </h3>
                <p className={`text-xs mt-1 max-w-xs ${isDark ? 'text-[#8696a0]' : 'text-slate-500'}`}>
                  {searchQuery 
                    ? `Try a different username or display name.`
                    : 'All registered users are already your friends.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {eligibleUsers.map((u) => {
                const targetUid = u.uid;
                const isRequested = sentFriendRequests.some(
                  (r) => r.receiverId === targetUid && r.status === 'pending'
                );

                return (
                  <motion.div
                    key={targetUid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => navigate(`/profile/${targetUid}`)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isDark 
                        ? 'bg-[#111b21] border-[#202c33] hover:border-[#ff2e93]/40 hover:-translate-y-0.5' 
                        : 'bg-slate-50 border-slate-200 hover:border-[#ff2e93]/40 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div className="relative shrink-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-11 h-11 rounded-full object-cover border border-[#ff2e93]/40 shrink-0"
                        />
                        {u.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#111b21] rounded-full" title="Online" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {u.name}
                          </h4>
                          {u.online ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Online</span>
                          ) : null}
                        </div>
                        {u.username && (
                          <p className="text-xs text-[#ff2e93] font-medium truncate">
                            @{u.username}
                          </p>
                        )}
                        <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-[#8696a0]' : 'text-slate-500'}`}>
                          {u.bio}
                        </p>
                        {u.mutualFriendsCount > 0 ? (
                          <p className="text-[10px] mt-1 text-[#ff2e93] font-medium">{u.mutualFriendsCount} mutual friends</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isRequested ? (
                        <button
                          disabled
                          className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 font-bold text-xs border border-white/10 flex items-center gap-1 cursor-not-allowed"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Requested</span>
                        </button>
                      ) : (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await sendFriendRequest(u.uid);
                            showToast('Friend request sent.');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#ff2e93] to-[#ff60b5] text-white font-bold text-xs flex items-center gap-1 transition-all hover:opacity-90 active:scale-95 shadow-md shadow-[#ff2e93]/25 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Add Friend</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
                })}
              </div>
            )
          ) : (
            /* REQUESTS TAB CONTENT */
            filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center my-auto">
                <div className="relative mb-3">
                  <UserPlus className={`w-14 h-14 stroke-[1.25] ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                </div>
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  No friend requests
                </h3>
                <p className={`text-xs mt-1 max-w-xs ${isDark ? 'text-[#8696a0]' : 'text-slate-500'}`}>
                  {searchQuery 
                    ? 'No requests found matching your search.'
                    : "You don't have any pending requests."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
              {filteredRequests.map((req) => (
                <motion.div 
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => navigate(`/profile/${req.senderId}`)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isDark 
                      ? 'bg-[#111b21] border-[#202c33] hover:border-[#ff2e93]/40 hover:-translate-y-0.5' 
                      : 'bg-slate-50 border-slate-200 hover:border-[#ff2e93]/40 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <div className="relative shrink-0">
                      <img
                        src={req.senderPhoto || req.senderPhotoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt={req.senderName || req.senderDisplayName || req.senderUsername}
                        className="w-11 h-11 rounded-full object-cover border border-[#ff2e93]/40 shrink-0"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#ff2e93] border-2 border-[#111b21] rounded-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-bold text-sm truncate flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span className="truncate">{req.senderName || req.senderDisplayName || req.senderUsername || 'User'}</span>
                        {checkIsAdmin(req.senderUsername || req.senderName || req.senderId) && (
                          <VerifiedBadge className="w-3.5 h-3.5 shrink-0 text-[#ff2e93]" />
                        )}
                      </h4>
                      {req.senderUsername && (
                        <p className="text-xs text-[#ff2e93] font-medium truncate">
                          @{req.senderUsername}
                        </p>
                      )}
                      <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-[#8696a0]' : 'text-slate-500'}`}>
                        {req.senderDisplayName || req.senderName || 'User'} sent you a request
                      </p>
                      <p className="text-[10px] mt-1 text-[#ff2e93] font-medium">{new Date(req.createdAt?.seconds ? req.createdAt.seconds * 1000 : Date.now()).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleAccept(req.id, req.senderId)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center gap-1 transition-all active:scale-95 shadow cursor-pointer"
                      title="Accept Friend Request"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                        isDark 
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20' 
                          : 'bg-slate-200/80 hover:bg-slate-300 text-slate-600 border-slate-300'
                      }`}
                      title="Decline Request"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </motion.div>
              ))}
              </div>
            )
          )}
        </div>

        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-gradient-to-r from-[#ff2e93] to-[#ff60b5] text-white font-bold text-xs shadow-xl"
            >
              {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className={`pt-3 mt-2 border-t text-center ${isDark ? 'border-[#1f2c34]' : 'border-slate-200'}`}>
          <p className={`text-[11px] flex items-center justify-center gap-1.5 ${isDark ? 'text-[#8696a0]' : 'text-slate-500'}`}>
            <ShieldCheck className="w-3.5 h-3.5 text-[#ff2e93]" />
            <span>Connect & chat in real time across all devices</span>
          </p>
        </div>
      </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
