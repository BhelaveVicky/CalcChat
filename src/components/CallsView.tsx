import React, { useState, useRef, useCallback } from 'react';
import { 
  Search, Phone, Video, PhoneCall, Trash2, Plus, Clock, 
  PhoneMissed, PhoneIncoming, PhoneOutgoing, Check, CheckSquare, X,
  AlertTriangle, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVault } from '../context/VaultContext';
import { formatCallDateTime } from '../lib/dateUtils';
import { checkIsAdmin, VerifiedBadge } from '../lib/adminUtils';
import { CallLog } from '../types';

type FilterTab = 'all' | 'missed' | 'received_voice' | 'received_video';

export const CallsView: React.FC = () => {
  const { 
    user, callLogs, contacts, startCall, clearCallLogs, deleteCallLog, deleteMultipleCallLogs,
    settings: vaultSettings, setActiveContactId, getContactDisplayName, 
    customNicknames, allRegisteredUsers 
  } = useVault();

  const isDark = vaultSettings.theme !== 'material-light' && vaultSettings.theme !== 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [showNewCallModal, setShowNewCallModal] = useState(false);

  // Confirmation Modals State
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);

  // Multi-Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());

  // Long press handling timer
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startLongPressTimer = (logId: string) => {
    if (isSelectionMode) return;
    longPressTimerRef.current = setTimeout(() => {
      setIsSelectionMode(true);
      setSelectedLogIds(new Set([logId]));
    }, 500);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const toggleSelectLog = (logId: string) => {
    setSelectedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      if (next.size === 0) {
        setIsSelectionMode(false);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedLogIds.size === filteredLogs.length) {
      setSelectedLogIds(new Set());
    } else {
      setSelectedLogIds(new Set(filteredLogs.map(l => l.id)));
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedLogIds(new Set());
  };

  // Filter logs based on search query and tab
  const filteredLogs = callLogs.filter(log => {
    const contact = contacts.find(c => c.id === log.contactId);
    const registeredUser = allRegisteredUsers.find(u => u.uid === log.contactId || u.id === log.contactId);
    
    const displayName = getContactDisplayName(contact || log.contactId) || registeredUser?.displayName || registeredUser?.username || 'User';
    const originalName = contact?.name || registeredUser?.displayName || '';
    const nickname = customNicknames[log.contactId] || '';
    
    const matchesSearch = !searchQuery.trim() ||
                          displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          nickname.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const isOutgoing = log.direction === 'outgoing' || (log.callerId && log.callerId === user?.id);
    let normStatus: string = log.status || 'completed';
    if (normStatus === 'ended' || normStatus === 'connected') {
      normStatus = 'completed';
    }

    const isAnswered = normStatus === 'completed';
    const isMissed = !isAnswered;
    const isIncoming = !isOutgoing;

    if (filterTab === 'missed') {
      return isIncoming && isMissed;
    }
    if (filterTab === 'received_voice') {
      return isIncoming && log.type === 'voice' && isAnswered;
    }
    if (filterTab === 'received_video') {
      return isIncoming && log.type === 'video' && isAnswered;
    }
    return true;
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
    return timeB - timeA;
  });

  const handleConfirmClearAll = async () => {
    await clearCallLogs();
    setShowClearAllConfirm(false);
    exitSelectionMode();
  };

  const handleConfirmDeleteSelected = async () => {
    await deleteMultipleCallLogs(Array.from(selectedLogIds));
    setShowDeleteSelectedConfirm(false);
    exitSelectionMode();
  };

  return (
    <div className={`flex-1 flex w-full h-full overflow-hidden font-sans select-none relative transition-colors ${
      isDark ? 'bg-[#111b21] text-[#e9edef]' : 'bg-white text-gray-900'
    }`}>
      
      {/* Left Column: Calls Sidebar */}
      <div className={`h-full flex flex-col border-r ${
        isDark ? 'border-[#202c33] bg-[#111b21]' : 'border-gray-200 bg-white'
      } w-full md:w-80 lg:w-[380px] xl:w-[420px] 2xl:w-[460px] shrink-0 overflow-hidden`}>

        {/* Top Header */}
        <div className={`px-4 py-3.5 flex flex-col gap-3 border-b ${
          isDark ? 'border-[#202c33] bg-[#111b21]' : 'border-gray-100 bg-white'
        } shrink-0`}>
          {isSelectionMode ? (
            /* Selection Header Toolbar */
            <div className="flex items-center justify-between py-1 animate-fade-in">
              <div className="flex items-center gap-3">
                <button
                  onClick={exitSelectionMode}
                  className={`p-2 rounded-full transition-all cursor-pointer ${
                    isDark ? 'hover:bg-[#202c33] text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  title="Cancel Selection"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="font-bold text-base text-[#ff2e93]">
                  {selectedLogIds.size} Selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                    isDark ? 'border-[#202c33] hover:bg-[#202c33] text-gray-200' : 'border-gray-200 hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  {selectedLogIds.size === filteredLogs.length ? 'Deselect All' : 'Select All'}
                </button>

                <button
                  disabled={selectedLogIds.size === 0}
                  onClick={() => setShowDeleteSelectedConfirm(true)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 text-white transition-all shadow-md cursor-pointer ${
                    selectedLogIds.size > 0
                      ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-rose-500/25'
                      : 'bg-rose-400/50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selectedLogIds.size})</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Header Matching Image 1 (Responsive for mobile & desktop) */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#ff2e93] to-[#ff60b5] text-white flex items-center justify-center shadow-md shadow-[#ff2e93]/25 shrink-0">
                  <Phone className="w-4.5 h-4.5 fill-white text-transparent" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Call History</h2>
              </div>

              <div className="flex items-center justify-end gap-2 md:w-auto">
                <button
                  onClick={() => setShowNewCallModal(true)}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ff2e93] to-[#ff60b5] text-white hover:opacity-95 transition-all active:scale-95 shadow-md shadow-[#ff2e93]/25 flex items-center justify-center cursor-pointer shrink-0"
                  title="Start New Call"
                >
                  <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
                </button>

                <button
                  onClick={() => {
                    setIsSelectionMode(true);
                    setSelectedLogIds(new Set());
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'text-[#8696a0] hover:text-white hover:bg-[#202c33]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  title="Select Multiple"
                >
                  <CheckSquare className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowClearAllConfirm(true)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'text-[#ff2e93] hover:text-rose-400 hover:bg-[#202c33]' : 'text-[#ff2e93] hover:text-rose-600 hover:bg-rose-50'
                  }`}
                  title="Clear All Call History"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Search Bar - Rounded Pill matching Image 1 */}
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full text-sm transition-all ${
            isDark 
              ? 'bg-[#202c33] text-[#e9edef] border border-transparent focus-within:border-[#ff2e93]/50' 
              : 'bg-gray-100 text-gray-900 border border-transparent focus-within:border-[#ff2e93]/50'
          }`}>
            <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-pink-400' : 'text-[#ff2e93]'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or number..."
              className={`bg-transparent border-none outline-none w-full text-[13.5px] ${
                isDark 
                  ? 'placeholder:text-[#8696a0] text-[#e9edef]' 
                  : 'placeholder:text-gray-400 text-gray-900'
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Chips / Tabs Matching Image 1 */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5 pb-0.5">
            {[
              { id: 'all', label: 'All Calls' },
              { id: 'missed', label: 'Missed Calls' },
              { id: 'received_voice', label: 'Received Voice' },
              { id: 'received_video', label: 'Received Video' },
            ].map(tab => {
              const isActive = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as FilterTab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#ff2e93] to-[#ff60b5] text-white shadow-md shadow-[#ff2e93]/25'
                      : isDark
                        ? 'bg-[#202c33] text-pink-400/90 border border-[#ff2e93]/20 hover:bg-[#202c33]/80'
                        : 'bg-pink-50/80 text-[#ff2e93] border border-pink-100 hover:bg-pink-100/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Call History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
          {/* Section: RECENT */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider px-2 text-gray-400 dark:text-[#8696a0]">
              RECENT
            </h4>

            {sortedLogs.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {sortedLogs.map((log) => {
                  const contact = contacts.find(c => c.id === log.contactId);
                  const registeredUser = allRegisteredUsers.find(u => u.uid === log.contactId || u.id === log.contactId);
                  const name = getContactDisplayName(contact || log.contactId) || registeredUser?.displayName || registeredUser?.username || 'User';
                  const avatar = contact?.avatar || registeredUser?.photoURL || registeredUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                  
                  const isSelected = selectedLogIds.has(log.id);
                  const { dateStr, timeStr } = formatCallDateTime(log.createdAt || log.startedAt, log.timestamp);

                  const isOutgoing = log.direction === 'outgoing' || (log.callerId && log.callerId === user?.id);
                  let normStatus = log.status || 'completed';
                  if ((normStatus as string) === 'ended' || (normStatus as string) === 'connected') {
                    normStatus = 'completed';
                  }

                  const isAnswered = normStatus === 'completed';
                  const isMissed = !isAnswered && !isOutgoing;

                  return (
                    <div
                      key={log.id}
                      onMouseDown={() => startLongPressTimer(log.id)}
                      onMouseUp={clearLongPressTimer}
                      onTouchStart={() => startLongPressTimer(log.id)}
                      onTouchEnd={clearLongPressTimer}
                      onClick={() => {
                        if (isSelectionMode) {
                          toggleSelectLog(log.id);
                        } else if (contact) {
                          setActiveContactId(contact.id);
                        }
                      }}
                      className={`p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer border select-none group relative shadow-xs hover:shadow-md ${
                        isSelected
                          ? isDark
                            ? 'bg-[#202c33] border-[#ff2e93] ring-1 ring-[#ff2e93]'
                            : 'bg-pink-50 border-[#ff2e93] ring-1 ring-[#ff2e93]'
                          : isDark
                          ? 'bg-[#182229]/60 hover:bg-[#182229] border-[#202c33]'
                          : 'bg-white hover:bg-gray-50/80 border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectLog(log.id);
                            }}
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                              isSelected 
                                ? 'bg-[#ff2e93] border-[#ff2e93] text-white' 
                                : isDark ? 'border-[#8696a0]' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        )}

                        {/* Avatar with Status Badge */}
                        <div className="relative shrink-0">
                          <img
                            src={avatar}
                            alt={name}
                            className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                          />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#111b21] flex items-center justify-center text-white shadow-xs ${
                            isAnswered ? 'bg-emerald-500' : isOutgoing ? 'bg-amber-500' : 'bg-rose-500'
                          }`}>
                            {log.type === 'video' && isAnswered ? (
                              <Video className="w-2.5 h-2.5" />
                            ) : isAnswered ? (
                              <Phone className="w-2.5 h-2.5" />
                            ) : isOutgoing ? (
                              <PhoneOutgoing className="w-2.5 h-2.5" />
                            ) : (
                              <PhoneMissed className="w-2.5 h-2.5" />
                            )}
                          </div>
                        </div>

                        {/* Middle: Contact Name & Call Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <h4 className="font-bold text-[13.5px] truncate text-teal-600 dark:text-teal-400">
                              {name}
                            </h4>
                            {checkIsAdmin(log.contactId) && <VerifiedBadge className="w-3.5 h-3.5" />}
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs mt-0.5">
                            {log.type === 'video' && isAnswered ? (
                              <>
                                <Video className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                <span className="text-teal-600 dark:text-teal-400 font-semibold text-[11.5px]">{log.duration || '00:21'}</span>
                              </>
                            ) : isAnswered ? (
                              <>
                                <Phone className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                <span className="text-teal-600 dark:text-teal-400 font-semibold text-[11.5px]">{log.duration || '00:14'}</span>
                              </>
                            ) : isMissed ? (
                              <>
                                <PhoneMissed className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="text-rose-500 font-semibold text-[11.5px]">Missed</span>
                              </>
                            ) : (
                              <>
                                <PhoneOutgoing className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="text-amber-500 font-semibold text-[11.5px]">Declined / Busy</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Stacked Date/Time & Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <div className="flex flex-col items-end text-right">
                          <span className="text-[#ff2e93] font-semibold text-[11px] leading-tight">
                            {dateStr}
                          </span>
                          <span className="text-gray-400 dark:text-[#8696a0] text-[10px] mt-0.5">
                            {timeStr}
                          </span>
                        </div>

                        {!isSelectionMode && (
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCallLog(log.id);
                              }}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark 
                                  ? 'text-pink-400/80 hover:text-rose-400 hover:bg-[#202c33]' 
                                  : 'text-pink-400/80 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title="Delete Call Log"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startCall(log.contactId, log.type || 'voice');
                              }}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark 
                                  ? 'text-[#ff2e93] hover:text-[#ff60b5] hover:bg-[#202c33]' 
                                  : 'text-[#ff2e93] hover:text-[#ff0077] hover:bg-pink-50'
                              }`}
                              title={`Call back with ${log.type === 'video' ? 'Video' : 'Voice'}`}
                            >
                              {log.type === 'video' ? (
                                <Video className="w-4.5 h-4.5" />
                              ) : (
                                <Phone className="w-4.5 h-4.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-8 text-center text-sm text-gray-400 dark:text-[#8696a0]">
                {filterTab === 'missed' && 'No missed calls'}
                {filterTab === 'received_voice' && 'No voice calls'}
                {filterTab === 'received_video' && 'No video calls'}
                {filterTab === 'all' && 'No recent calls'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Desktop Welcome / Calls Standby Screen */}
      <div className={`hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center relative select-none ${
        isDark ? 'bg-[#0b141a] text-[#8696a0]' : 'bg-[#f0f2f5] text-gray-600'
      }`}>
        <div className="max-w-md w-full flex flex-col items-center animate-fade-in">
          {/* Circular Phone Icon with dashed ring */}
          <div className="w-20 h-20 rounded-full border-4 border-pink-300 dark:border-pink-900/50 border-dashed flex items-center justify-center mb-6 opacity-75">
            <Phone className="w-8 h-8 text-[#ff2e93] stroke-[1.75]" />
          </div>

          {/* Heading */}
          <h3 className={`text-2xl font-bold mb-2 tracking-tight ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
            Make free calls
          </h3>

          {/* Subtitle */}
          <p className="text-sm leading-relaxed max-w-sm text-gray-500 dark:text-[#8696a0] mb-6">
            Call your contacts with end-to-end encrypted voice and video calls directly from your desktop.
          </p>

          <button
            type="button"
            onClick={() => setShowNewCallModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2e93] to-[#ff60b5] hover:opacity-90 text-white text-sm font-semibold shadow-md shadow-[#ff2e93]/25 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Start a new call</span>
          </button>
        </div>

        {/* End-to-end Encrypted Footer Note */}
        <div className="absolute bottom-8 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>Your personal calls are end-to-end encrypted</span>
        </div>
      </div>

      {/* Start New Call Modal */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl border ${
            isDark ? 'bg-[#111b21] border-[#202c33] text-white' : 'bg-white border-pink-100 text-gray-900'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-[#ff2e93]">
                <PhoneCall className="w-5 h-5" />
                Select Contact to Call
              </h3>
              <button 
                onClick={() => setShowNewCallModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 no-scrollbar">
              {contacts.map(c => (
                <div 
                  key={c.id}
                  className={`p-3 rounded-2xl flex items-center justify-between border ${
                    isDark ? 'border-[#202c33] hover:bg-[#202c33]' : 'border-gray-100 hover:bg-pink-50/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm truncate">{c.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{c.status}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setShowNewCallModal(false);
                        startCall(c.id, 'voice');
                      }}
                      className="p-2 text-[#ff2e93] hover:bg-[#ff2e93]/20 rounded-full transition-all"
                      title="Voice Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowNewCallModal(false);
                        startCall(c.id, 'video');
                      }}
                      className="p-2 text-[#ff2e93] hover:bg-[#ff2e93]/20 rounded-full transition-all"
                      title="Video Call"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete ALL Call History */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center space-y-4 ${
            isDark ? 'bg-[#111b21] border-[#202c33] text-white' : 'bg-white border-pink-100 text-gray-900'
          }`}>
            <div className="w-14 h-14 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold">Delete all call history?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This will permanently remove all call records from your history. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowClearAllConfirm(false)}
                className={`flex-1 py-2.5 rounded-full font-semibold text-xs transition-all ${
                  isDark ? 'bg-[#202c33] text-gray-300 hover:bg-[#202c33]/80' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearAll}
                className="flex-1 py-2.5 rounded-full font-semibold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete SELECTED Call Logs */}
      {showDeleteSelectedConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center space-y-4 ${
            isDark ? 'bg-[#111b21] border-[#202c33] text-white' : 'bg-white border-pink-100 text-gray-900'
          }`}>
            <div className="w-14 h-14 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold">Delete selected call history?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to delete {selectedLogIds.size} selected call record(s)?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteSelectedConfirm(false)}
                className={`flex-1 py-2.5 rounded-full font-semibold text-xs transition-all ${
                  isDark ? 'bg-[#202c33] text-gray-300 hover:bg-[#202c33]/80' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteSelected}
                className="flex-1 py-2.5 rounded-full font-semibold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
