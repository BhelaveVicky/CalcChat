import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import {
  Shield, Crown, CheckCircle2, Search, X, MessageSquare, UserPlus,
  ShieldAlert, Sparkles, User, Mail, Flag, Ban, Check, Trash2, Clock, AlertTriangle, Users, BadgeCheck, RefreshCw
} from 'lucide-react';
import { VerifiedBadge } from '../lib/adminUtils';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    authUser,
    allRegisteredUsers,
    toggleUserAdminStatus,
    toggleUserVerifiedBadge,
    toggleUserBannedStatus,
    followUserDirectly,
    setActiveContactId,
    setActiveTab,
    reports = [],
    updateReportStatus,
    deleteReport,
  } = useVault();

  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'reports'>('users');
  const [userFilter, setUserFilter] = useState<'all' | 'verified' | 'admins' | 'banned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUid, setLoadingUid] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentEmail = (authUser?.email || user.email || '').toLowerCase();
  const isSuperAdmin = currentEmail === 'bhelavevicky66@gmail.com' || Boolean(user.isSuperAdmin);
  const isAdmin = isSuperAdmin || currentEmail === 'vickybhelave25@navgurukul.com' || Boolean(user.isAdmin);

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  const filteredUsers = allRegisteredUsers.filter(u => {
    const term = searchTerm.toLowerCase();
    const name = (u.displayName || u.name || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();

    const matchesSearch = name.includes(term) || username.includes(term) || email.includes(term);
    if (!matchesSearch) return false;

    const uEmail = (u.email || '').toLowerCase();
    const isTargetSuperAdmin = uEmail === 'bhelavevicky66@gmail.com' || u.isSuperAdmin;
    const isTargetAdmin = isTargetSuperAdmin || uEmail === 'vickybhelave25@navgurukul.com' || u.isAdmin;
    const isTargetVerified = u.isVerified !== undefined ? Boolean(u.isVerified) : Boolean(isTargetSuperAdmin || isTargetAdmin);
    const isTargetBanned = Boolean(u.isBanned);

    if (userFilter === 'verified') return isTargetVerified && !isTargetBanned;
    if (userFilter === 'admins') return isTargetAdmin && !isTargetBanned;
    if (userFilter === 'banned') return isTargetBanned;
    return true;
  });

  const verifiedCount = allRegisteredUsers.filter(u => {
    const uEmail = (u.email || '').toLowerCase();
    return u.isVerified || uEmail === 'bhelavevicky66@gmail.com' || uEmail === 'vickybhelave25@navgurukul.com' || u.isSuperAdmin || u.isAdmin;
  }).length;

  const adminsCount = allRegisteredUsers.filter(u => {
    const uEmail = (u.email || '').toLowerCase();
    return uEmail === 'bhelavevicky66@gmail.com' || uEmail === 'vickybhelave25@navgurukul.com' || u.isAdmin || u.isSuperAdmin;
  }).length;

  const bannedCount = allRegisteredUsers.filter(u => u.isBanned).length;

  const handleToggleAdmin = async (targetUid: string, currentIsAdmin: boolean, targetName: string) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin (bhelavevicky66@gmail.com) can modify Admin roles.');
      return;
    }
    setLoadingUid(targetUid);
    try {
      if (toggleUserAdminStatus) {
        await toggleUserAdminStatus(targetUid, !currentIsAdmin);
        setActionSuccess(currentIsAdmin ? `Removed Admin role from ${targetName}.` : `Granted Admin role to ${targetName}.`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update admin status.');
    } finally {
      setLoadingUid(null);
    }
  };

  const handleToggleVerified = async (targetUid: string, currentIsVerified: boolean, targetName: string) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin (bhelavevicky66@gmail.com) can grant or remove Verified Blue Badges.');
      return;
    }
    setLoadingUid(targetUid);
    try {
      if (toggleUserVerifiedBadge) {
        await toggleUserVerifiedBadge(targetUid, !currentIsVerified);
        setActionSuccess(currentIsVerified ? `Removed Verified Blue Tick from ${targetName}.` : `Granted Verified Blue Tick to ${targetName}! 🔹`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update verification status.');
    } finally {
      setLoadingUid(null);
    }
  };

  const handleToggleBan = async (targetUid: string, currentIsBanned: boolean, targetName: string) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin (bhelavevicky66@gmail.com) can ban or unban accounts.');
      return;
    }
    const confirmMsg = currentIsBanned
      ? `Are you sure you want to UNBAN ${targetName}?`
      : `Are you sure you want to BAN ${targetName}? They will be immediately blocked from accessing CalcChat.`;

    if (!window.confirm(confirmMsg)) return;

    setLoadingUid(targetUid);
    try {
      if (toggleUserBannedStatus) {
        await toggleUserBannedStatus(targetUid, !currentIsBanned);
        setActionSuccess(currentIsBanned ? `User ${targetName} unbanned.` : `User ${targetName} banned successfully.`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update ban status.');
    } finally {
      setLoadingUid(null);
    }
  };

  const handleStartChat = (targetUid: string) => {
    setActiveContactId(targetUid);
    setActiveTab('chats');
    onClose();
  };

  const handleFollowUser = async (targetUid: string) => {
    if (followUserDirectly) {
      await followUserDirectly(targetUid);
      setActionSuccess('Now following user.');
      setTimeout(() => setActionSuccess(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0b141a] border border-[#202c33] text-slate-100 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-[#182229] via-[#111b21] to-[#182229] border-b border-[#202c33] shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-[#0095f6] p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-[#0b141a] rounded-[14px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                  <span>CalcChat Super Admin Panel</span>
                  <VerifiedBadge className="w-5 h-5" />
                </h2>
                {isSuperAdmin && (
                  <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 rounded-full flex items-center gap-1 shadow-sm">
                    <Crown className="w-3 h-3 text-amber-400" /> Super Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Control center for Verified Blue Ticks, Admins, User Reports & Security</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#202c33] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Success Notification Toast Banner */}
        {actionSuccess && (
          <div className="bg-gradient-to-r from-emerald-500/20 via-emerald-600/30 to-emerald-500/20 border-b border-emerald-500/40 px-6 py-2.5 text-xs font-bold text-emerald-300 flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-md">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
              {actionSuccess}
            </span>
          </div>
        )}

        {/* Developer & System Stats Header Banner */}
        <div className="p-4 sm:p-5 bg-[#111b21] border-b border-[#202c33]">
          <div className="bg-gradient-to-r from-amber-500/10 via-[#182229] to-[#0095f6]/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Vicky Bhelave"
                  className="w-13 h-13 rounded-2xl border-2 border-amber-400 object-cover shadow-xl"
                />
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-1 shadow-md">
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">Vicky Bhelave</h3>
                  <VerifiedBadge className="w-4 h-4" />
                </div>
                <p className="text-xs text-amber-300 font-bold">App Owner & Super Admin</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-amber-400" /> bhelavevicky66@gmail.com</span>
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#0095f6]" /> vickybhelave25@navgurukul.com</span>
                </div>
              </div>
            </div>

            {/* Quick Live Stats */}
            <div className="grid grid-cols-4 gap-2 w-full md:w-auto text-center">
              <div className="px-3 py-2 bg-[#1f2c34] rounded-xl border border-[#263238]">
                <span className="block text-sm font-black text-white">{allRegisteredUsers.length}</span>
                <span className="text-[10px] font-semibold text-gray-400">Total Users</span>
              </div>
              <div className="px-3 py-2 bg-[#0095f6]/10 rounded-xl border border-[#0095f6]/30">
                <span className="block text-sm font-black text-[#0095f6] flex items-center justify-center gap-1">
                  {verifiedCount} <VerifiedBadge className="w-3.5 h-3.5 inline" />
                </span>
                <span className="text-[10px] font-semibold text-blue-300">Verified</span>
              </div>
              <div className="px-3 py-2 bg-amber-500/10 rounded-xl border border-amber-500/30">
                <span className="block text-sm font-black text-amber-400">{adminsCount}</span>
                <span className="text-[10px] font-semibold text-amber-300">Admins</span>
              </div>
              <div className="px-3 py-2 bg-red-950/40 rounded-xl border border-red-500/30">
                <span className="block text-sm font-black text-red-400">{bannedCount}</span>
                <span className="text-[10px] font-semibold text-red-300">Banned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <div className="flex border-b border-[#202c33] bg-[#111b21] px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border-t border-x ${
              activeAdminTab === 'users'
                ? 'bg-[#0b141a] border-[#202c33] text-amber-400 shadow-lg'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory ({allRegisteredUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('reports')}
            className={`px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border-t border-x relative ${
              activeAdminTab === 'reports'
                ? 'bg-[#0b141a] border-[#202c33] text-red-400 shadow-lg'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Flag className="w-4 h-4 text-red-400" />
            <span>User Reports</span>
            {pendingReportsCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-black animate-pulse shadow-md">
                {pendingReportsCount}
              </span>
            )}
          </button>
        </div>

        {activeAdminTab === 'users' ? (
          <>
            {/* Search Bar & Category Filter Chips */}
            <div className="p-4 bg-[#111b21] border-b border-[#202c33] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search user by name, username, or email..."
                  className="w-full bg-[#182229] border border-[#202c33] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#0095f6] transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar shrink-0">
                <button
                  onClick={() => setUserFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    userFilter === 'all'
                      ? 'bg-[#ff2e93] text-white shadow-md'
                      : 'bg-[#182229] text-gray-400 hover:text-white border border-[#202c33]'
                  }`}
                >
                  All ({allRegisteredUsers.length})
                </button>
                <button
                  onClick={() => setUserFilter('verified')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    userFilter === 'verified'
                      ? 'bg-[#0095f6] text-white shadow-md'
                      : 'bg-[#182229] text-gray-400 hover:text-white border border-[#202c33]'
                  }`}
                >
                  <VerifiedBadge className="w-3.5 h-3.5" /> Verified ({verifiedCount})
                </button>
                <button
                  onClick={() => setUserFilter('admins')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    userFilter === 'admins'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-[#182229] text-gray-400 hover:text-white border border-[#202c33]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> Admins ({adminsCount})
                </button>
                <button
                  onClick={() => setUserFilter('banned')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    userFilter === 'banned'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-[#182229] text-gray-400 hover:text-white border border-[#202c33]'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5 text-red-400" /> Banned ({bannedCount})
                </button>
              </div>
            </div>

            {/* User List Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 max-h-[460px] custom-scrollbar bg-[#0b141a]">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs flex flex-col items-center gap-2">
                  <Users className="w-8 h-8 opacity-40 text-gray-400" />
                  <p>No users found matching "{searchTerm}"</p>
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const uUid = u.uid || u.id;
                  const uEmail = (u.email || '').toLowerCase();
                  const isTargetSuperAdmin = uEmail === 'bhelavevicky66@gmail.com' || u.isSuperAdmin;
                  const isTargetAdmin = isTargetSuperAdmin || uEmail === 'vickybhelave25@navgurukul.com' || u.isAdmin;
                  const isTargetVerified = u.isVerified !== undefined ? Boolean(u.isVerified) : Boolean(isTargetSuperAdmin || isTargetAdmin);
                  const isTargetBanned = Boolean(u.isBanned);
                  const isUserLoading = loadingUid === uUid;
                  const uName = u.displayName || u.name || u.username || 'User';

                  return (
                    <div
                      key={uUid}
                      className={`border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        isTargetBanned
                          ? 'bg-red-950/20 border-red-500/40'
                          : isTargetVerified
                          ? 'bg-gradient-to-r from-[#0095f6]/10 via-[#182229] to-[#182229] border-[#0095f6]/40 shadow-md'
                          : 'bg-[#182229] border-[#202c33] hover:border-[#2a3942]'
                      }`}
                    >
                      {/* User Avatar & Details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={u.photoURL || u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                            alt={uName}
                            className={`w-12 h-12 rounded-full object-cover border-2 ${
                              isTargetBanned 
                                ? 'border-red-500 opacity-60' 
                                : isTargetVerified 
                                ? 'border-[#0095f6] shadow-lg' 
                                : 'border-[#202c33]'
                            }`}
                          />
                          {u.online && !isTargetBanned && (
                            <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0b141a] absolute bottom-0 right-0 shadow" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-sm font-bold truncate ${isTargetBanned ? 'text-red-300 line-through' : 'text-white'}`}>
                              {uName}
                            </span>

                            {/* Verified Blue Tick Badge */}
                            {!isTargetBanned && isTargetVerified && (
                              <VerifiedBadge className="w-4.5 h-4.5 shrink-0" />
                            )}

                            {/* Banned Badge */}
                            {isTargetBanned && (
                              <span className="px-2 py-0.5 text-[9px] font-black bg-red-600 text-white border border-red-500 rounded-full flex items-center gap-0.5">
                                <Ban className="w-2.5 h-2.5 text-white" /> BANNED
                              </span>
                            )}

                            {/* Super Admin Badge */}
                            {isTargetSuperAdmin && (
                              <span className="px-2 py-0.5 text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5 text-amber-400" /> Super Admin
                              </span>
                            )}

                            {/* Admin Badge */}
                            {!isTargetSuperAdmin && isTargetAdmin && (
                              <span className="px-2 py-0.5 text-[9px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-full flex items-center gap-0.5">
                                <Shield className="w-2.5 h-2.5 text-blue-400" /> Admin
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-400 font-medium">@{u.username || 'user'}</p>
                          {u.email && (
                            <p className="text-[11px] text-gray-500 font-mono mt-0.5">{u.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Super Admin Actions */}
                      <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                        {/* Direct Chat */}
                        <button
                          type="button"
                          onClick={() => handleStartChat(uUid)}
                          className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          title="Direct message user"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Chat</span>
                        </button>

                        {/* Verified Blue Tick Toggle (Super Admin Exclusive) */}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            disabled={isUserLoading}
                            onClick={() => handleToggleVerified(uUid, isTargetVerified, uName)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                              isTargetVerified
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                                : 'bg-[#0095f6]/20 text-[#0095f6] border border-[#0095f6]/40 hover:bg-[#0095f6]/30 shadow-md'
                            }`}
                          >
                            <VerifiedBadge className="w-3.5 h-3.5" />
                            <span>{isTargetVerified ? 'Remove Blue Tick' : 'Give Blue Tick 🔹'}</span>
                          </button>
                        )}

                        {/* Admin Role Toggle (Super Admin Exclusive) */}
                        {isSuperAdmin && !isTargetSuperAdmin && (
                          <button
                            type="button"
                            disabled={isUserLoading}
                            onClick={() => handleToggleAdmin(uUid, isTargetAdmin, uName)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                              isTargetAdmin
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                                : 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>{isTargetAdmin ? 'Remove Admin' : 'Make Admin'}</span>
                          </button>
                        )}

                        {/* Ban / Unban Account Toggle (Super Admin Exclusive) */}
                        {isSuperAdmin && !isTargetSuperAdmin && (
                          <button
                            type="button"
                            disabled={isUserLoading}
                            onClick={() => handleToggleBan(uUid, isTargetBanned, uName)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                              isTargetBanned
                                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                                : 'bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/30'
                            }`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{isTargetBanned ? 'Unban Account' : 'Ban Account'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* User Reports Tab */
          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[460px] custom-scrollbar bg-[#0b141a]">
            {reports.length === 0 ? (
              <div className="text-center py-16 text-gray-500 space-y-3">
                <ShieldAlert className="w-12 h-12 mx-auto text-gray-600" />
                <p className="text-sm font-bold text-gray-300">No user reports received yet.</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">When users report profiles via the 3-dot chat menu, reported accounts appear here for Super Admin review.</p>
              </div>
            ) : (
              reports.map((report) => {
                const targetUserObj = allRegisteredUsers.find(
                  u => u.uid === report.reportedUid || u.id === report.reportedUid
                );
                const isTargetBanned = Boolean(targetUserObj?.isBanned);
                const targetName = targetUserObj?.displayName || targetUserObj?.name || report.reportedName || 'Reported User';

                return (
                  <div
                    key={report.id}
                    className="border border-[#202c33] bg-[#182229] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-red-400 uppercase tracking-wider bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                            Reason: {report.reason}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(report.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">
                          Reported User: <span className="text-amber-300">{targetName}</span>
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Reported by: <span className="text-gray-200">{report.reporterName || 'Anonymous User'}</span>
                        </p>
                        {(report as any).details && (
                          <div className="p-3 bg-[#0b141a] rounded-xl border border-[#202c33] text-xs text-gray-300 mt-2">
                            "{(report as any).details}"
                          </div>
                        )}
                      </div>

                      {/* Report Action Status */}
                      {isSuperAdmin && (
                        <div className="flex items-center gap-2 shrink-0">
                          {!isTargetBanned && (
                            <button
                              type="button"
                              onClick={() => handleToggleBan(report.reportedUid, false, targetName)}
                              className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/40 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-red-600/30 transition-all cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Ban Reported User</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              if (deleteReport) {
                                await deleteReport(report.id);
                                setActionSuccess('Report dismissed.');
                                setTimeout(() => setActionSuccess(null), 2000);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#202c33] rounded-xl transition-colors cursor-pointer"
                            title="Dismiss Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
};
