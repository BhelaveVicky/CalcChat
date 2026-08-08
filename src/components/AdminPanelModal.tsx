import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import {
  Shield, Crown, CheckCircle2, Search, X, MessageSquare, UserPlus,
  ShieldAlert, Sparkles, User, Mail, Flag, Ban, Check, Trash2, Clock, AlertTriangle, Users
} from 'lucide-react';

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
    return name.includes(term) || username.includes(term) || email.includes(term);
  });

  const handleToggleAdmin = async (targetUid: string, currentIsAdmin: boolean) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin (bhelavevicky66@gmail.com) can modify Admin roles.');
      return;
    }
    setLoadingUid(targetUid);
    try {
      if (toggleUserAdminStatus) {
        await toggleUserAdminStatus(targetUid, !currentIsAdmin);
        setActionSuccess(`Updated admin status for user.`);
        setTimeout(() => setActionSuccess(null), 2500);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update admin status.');
    } finally {
      setLoadingUid(null);
    }
  };

  const handleToggleVerified = async (targetUid: string, currentIsVerified: boolean) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin (bhelavevicky66@gmail.com) can grant Blue Tick verification.');
      return;
    }
    setLoadingUid(targetUid);
    try {
      if (toggleUserVerifiedBadge) {
        await toggleUserVerifiedBadge(targetUid, !currentIsVerified);
        setActionSuccess(`Updated Blue Tick status for user.`);
        setTimeout(() => setActionSuccess(null), 2500);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update verification status.');
    } finally {
      setLoadingUid(null);
    }
  };

  const handleToggleBan = async (targetUid: string, currentIsBanned: boolean) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin (bhelavevicky66@gmail.com) can ban or unban accounts.');
      return;
    }
    const confirmMsg = currentIsBanned
      ? 'Are you sure you want to UNBAN this user?'
      : 'Are you sure you want to BAN this user? They will be immediately blocked from accessing CalcChat.';

    if (!window.confirm(confirmMsg)) return;

    setLoadingUid(targetUid);
    try {
      if (toggleUserBannedStatus) {
        await toggleUserBannedStatus(targetUid, !currentIsBanned);
        setActionSuccess(currentIsBanned ? 'User account unbanned.' : 'User account banned successfully.');
        setTimeout(() => setActionSuccess(null), 2500);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">CalcChat Admin Panel</h2>
                {isSuperAdmin && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" /> Super Admin
                  </span>
                )}
                {!isSuperAdmin && isAdmin && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3 text-blue-400" /> Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">System control center, user reports & account bans</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action success alert */}
        {actionSuccess && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-4 py-2 text-xs font-medium text-emerald-300 flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {actionSuccess}
            </span>
          </div>
        )}

        {/* Developer Banner */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80">
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-blue-500/10 border border-amber-500/20 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Vicky Bhelave"
                  className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 shadow">
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white">Vicky Bhelave</h3>
                  <CheckCircle2 className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                </div>
                <p className="text-xs text-amber-300 font-medium">Developer – CalcChat App</p>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-amber-400" /> bhelavevicky66@gmail.com</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-blue-400" /> vickybhelave25@navgurukul.com</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center text-xs">
              <div className="px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-300 text-center">
                <span className="block text-xs font-bold text-white">{allRegisteredUsers.length}</span>
                <span className="text-[10px] text-slate-400">Users</span>
              </div>
              <div className="px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-300 text-center">
                <span className="block text-xs font-bold text-amber-400">
                  {allRegisteredUsers.filter(u => u.email?.toLowerCase() === 'bhelavevicky66@gmail.com' || u.email?.toLowerCase() === 'vickybhelave25@navgurukul.com' || u.isAdmin || u.isSuperAdmin).length}
                </span>
                <span className="text-[10px] text-slate-400">Admins</span>
              </div>
              <div className="px-2.5 py-1 bg-red-950/60 rounded-lg border border-red-500/30 text-slate-300 text-center">
                <span className="block text-xs font-bold text-red-400">{reports.length}</span>
                <span className="text-[10px] text-red-300">Reports</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-2 border-t border-x ${
              activeAdminTab === 'users'
                ? 'bg-slate-900 border-slate-700 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory ({filteredUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('reports')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-2 border-t border-x relative ${
              activeAdminTab === 'reports'
                ? 'bg-slate-900 border-slate-700 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flag className="w-4 h-4 text-red-400" />
            <span>User Reports</span>
            {pendingReportsCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-black animate-pulse">
                {pendingReportsCount}
              </span>
            )}
          </button>
        </div>

        {activeAdminTab === 'users' ? (
          <>
            {/* User Search & Controls */}
            <div className="p-3 border-b border-slate-800 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search user by name, username, or email..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[420px] custom-scrollbar">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No users found matching "{searchTerm}"
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const uUid = u.uid || u.id;
                  const uEmail = (u.email || '').toLowerCase();
                  const isTargetSuperAdmin = uEmail === 'bhelavevicky66@gmail.com' || u.isSuperAdmin;
                  const isTargetAdmin = isTargetSuperAdmin || uEmail === 'vickybhelave25@navgurukul.com' || u.isAdmin;
                  const isTargetVerified = u.isVerified !== undefined ? Boolean(u.isVerified) : Boolean(isTargetSuperAdmin || isTargetAdmin);
                  const isTargetBanned = Boolean(u.isBanned);

                  return (
                    <div
                      key={uUid}
                      className={`border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isTargetBanned
                          ? 'bg-red-950/20 border-red-500/40'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700/80'
                      }`}
                    >
                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={u.photoURL || u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                            alt={u.displayName || u.username}
                            className={`w-10 h-10 rounded-full object-cover border ${isTargetBanned ? 'border-red-500 opacity-60' : 'border-slate-700'}`}
                          />
                          {u.online && !isTargetBanned && (
                            <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 absolute bottom-0 right-0" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-bold ${isTargetBanned ? 'text-red-300 line-through' : 'text-white'}`}>
                              {u.displayName || u.username || 'User'}
                            </span>

                            {/* Banned Badge */}
                            {isTargetBanned && (
                              <span className="px-1.5 py-0.2 text-[9px] font-black bg-red-600 text-white border border-red-500 rounded flex items-center gap-0.5">
                                <Ban className="w-2.5 h-2.5 text-white" /> BANNED
                              </span>
                            )}

                            {/* Verified Blue Tick Badge */}
                            {!isTargetBanned && isTargetVerified && (
                              <span title="Verified CalcChat Account" className="inline-flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                              </span>
                            )}

                            {/* Super Admin Badge */}
                            {isTargetSuperAdmin && (
                              <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5 text-amber-400" /> Super Admin
                              </span>
                            )}

                            {/* Admin Badge */}
                            {!isTargetSuperAdmin && isTargetAdmin && (
                              <span className="px-1.5 py-0.2 text-[9px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded flex items-center gap-0.5">
                                <Shield className="w-2.5 h-2.5 text-blue-400" /> Admin
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400">@{u.username || 'user'}</p>
                          {u.email && (
                            <p className="text-[10px] text-slate-500 font-mono">{u.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-center">
                        {/* Chat Now button */}
                        <button
                          onClick={() => handleStartChat(uUid)}
                          className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Direct message without follow required"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-400" />
                          <span>Chat</span>
                        </button>

                        {/* Follow button */}
                        {uUid !== authUser?.uid && (
                          <button
                            onClick={() => handleFollowUser(uUid)}
                            className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <UserPlus className="w-3 h-3 text-blue-400" />
                            <span>Follow</span>
                          </button>
                        )}

                        {/* Admin Toggle (Only for Super Admin) */}
                        {isSuperAdmin && !isTargetSuperAdmin && (
                          <button
                            disabled={loadingUid === uUid}
                            onClick={() => handleToggleAdmin(uUid, isTargetAdmin)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                              isTargetAdmin
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                                : 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30'
                            }`}
                          >
                            <Shield className="w-3 h-3" />
                            <span>{isTargetAdmin ? 'Remove Admin' : 'Make Admin'}</span>
                          </button>
                        )}

                        {/* Verified Blue Tick Toggle (Only for Super Admin) */}
                        {isSuperAdmin && (
                          <button
                            disabled={loadingUid === uUid}
                            onClick={() => handleToggleVerified(uUid, isTargetVerified)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                              isTargetVerified
                                ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                                : 'bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3 text-blue-400" />
                            <span>{isTargetVerified ? 'Remove Blue Tick' : 'Give Blue Tick'}</span>
                          </button>
                        )}

                        {/* Ban / Unban Account Toggle (Only for Super Admin) */}
                        {isSuperAdmin && !isTargetSuperAdmin && (
                          <button
                            disabled={loadingUid === uUid}
                            onClick={() => handleToggleBan(uUid, isTargetBanned)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                              isTargetBanned
                                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40'
                                : 'bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/40'
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
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[420px] custom-scrollbar">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <ShieldAlert className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs font-medium">No user reports received yet.</p>
                <p className="text-[11px] text-slate-600">When users report profiles via the 3-dot menu, reports appear here.</p>
              </div>
            ) : (
              reports.map((report) => {
                const targetUserObj = allRegisteredUsers.find(
                  u => u.uid === report.reportedUid || u.id === report.reportedUid
                );
                const isTargetBanned = Boolean(targetUserObj?.isBanned);

                return (
                  <div
                    key={report.id}
                    className={`p-4 rounded-xl border space-y-3 transition-colors ${
                      report.status === 'pending'
                        ? 'bg-red-950/20 border-red-500/40'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    {/* Report Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
                          <Flag className="w-5 h-5 fill-red-500/20" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              Reported User: <span className="text-red-400">{report.reportedName}</span>
                            </span>
                            {isTargetBanned && (
                              <span className="px-1.5 py-0.2 text-[9px] bg-red-600 text-white rounded font-bold">
                                BANNED
                              </span>
                            )}
                          </div>
                          {report.reportedEmail && (
                            <p className="text-[10px] text-slate-400 font-mono">{report.reportedEmail}</p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider ${
                          report.status === 'pending'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : report.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>

                    {/* Report Reason */}
                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Reason / Details:
                      </span>
                      <p className="text-slate-200 font-medium leading-relaxed">
                        {report.reason}
                      </p>
                    </div>

                    {/* Reporter Info & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 text-xs border-t border-slate-800/60">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reported by: <strong className="text-slate-200">{report.reporterName}</strong> ({report.reporterEmail || 'User'})</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Ban Account Button */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleToggleBan(report.reportedUid, isTargetBanned)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                              isTargetBanned
                                ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow'
                            }`}
                          >
                            <Ban className="w-3 h-3" />
                            <span>{isTargetBanned ? 'Unban Account' : 'Ban Account'}</span>
                          </button>
                        )}

                        {/* Resolve Report */}
                        {updateReportStatus && report.status !== 'resolved' && (
                          <button
                            onClick={() => updateReportStatus(report.id, 'resolved')}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Resolve</span>
                          </button>
                        )}

                        {/* Dismiss Report */}
                        {deleteReport && (
                          <button
                            onClick={() => deleteReport(report.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Dismiss</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-amber-400/90 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Automatic welcome message active for new users
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
