import React, { useState, useRef, useCallback } from 'react';
import { 
  Search, Phone, Video, PhoneCall, Trash2, Plus, Clock, 
  PhoneMissed, PhoneIncoming, PhoneOutgoing, Check, CheckSquare, X,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVault } from '../context/VaultContext';
import { formatCallDateTime } from '../lib/dateUtils';
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

    let normStatus: string = log.status || 'completed';
    if (normStatus === 'ended' || normStatus === 'connected') {
      normStatus = 'completed';
    }

    const isMissed = normStatus === 'missed' || normStatus === 'rejected';
    const isIncoming = log.direction === 'incoming';
    const isAnswered = normStatus === 'completed';

    if (filterTab === 'missed') {
      return isMissed;
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
    <div className={`flex-1 flex flex-col overflow-y-auto no-scrollbar font-sans select-none relative h-full min-h-0 pb-20 transition-colors ${
      isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
    }`}>
      
      {/* Top Header */}
      <div className={`px-4 pt-4 pb-2 sticky top-0 z-20 space-y-3 backdrop-blur-md transition-all ${
        isDark ? 'bg-[#0b141a]/95 border-b border-[#202c33]/50' : 'bg-white/95 border-b border-gray-100'
      }`}>
        {isSelectionMode ? (
          /* Selection Header Toolbar */
          <div className="flex items-center justify-between py-1 animate-fade-in">
            <div className="flex items-center gap-3">
              <button
                onClick={exitSelectionMode}
                className={`p-2 rounded-full transition-all ${
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
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  isDark ? 'border-[#202c33] hover:bg-[#202c33] text-gray-200' : 'border-gray-200 hover:bg-gray-100 text-gray-800'
                }`}
              >
                {selectedLogIds.size === filteredLogs.length ? 'Deselect All' : 'Select All'}
              </button>

              <button
                disabled={selectedLogIds.size === 0}
                onClick={() => setShowDeleteSelectedConfirm(true)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 text-white transition-all shadow-md ${
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
          /* Standard Header */
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#ff2e93] to-[#ff758c] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <PhoneCall className="w-4.5 h-4.5" />
              </div>
              <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
                Call History
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewCallModal(true)}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#ff2e93] to-[#ff60b5] text-white hover:opacity-90 transition-all active:scale-95 shadow-md shadow-blue-500/25 flex items-center gap-1.5 text-xs font-semibold"
                title="Start New Call"
              >
                <Plus className="w-4 h-4" />
                <span>New Call</span>
              </button>

              {callLogs.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      setIsSelectionMode(true);
                      setSelectedLogIds(new Set());
                    }}
                    className={`p-2 rounded-full transition-all ${
                      isDark ? 'hover:bg-[#202c33] text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    title="Select Multiple"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowClearAllConfirm(true)}
                    className={`p-2 rounded-full transition-all ${
                      isDark ? 'hover:bg-[#202c33] text-rose-400' : 'hover:bg-rose-50 text-rose-600'
                    }`}
                    title="Clear All Call History"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full text-sm transition-all border ${
          isDark 
            ? 'bg-[#202c33] text-[#e9edef] border-blue-500/10 focus-within:border-[#ff2e93]/50' 
            : 'bg-gray-100 text-gray-900 border-gray-200 focus-within:border-[#ff2e93]/50'
        }`}>
          <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-blue-400/70' : 'text-blue-500/70'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or number..."
            className={`bg-transparent border-none outline-none w-full text-sm ${
              isDark 
                ? 'placeholder:text-[#8596a0] text-[#e9edef]' 
                : 'placeholder:text-gray-400 text-gray-900'
            }`}
          />
        </div>

        {/* 4 Filter Tabs */}
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
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ff2e93] to-[#ff60b5] text-white shadow-md shadow-blue-500/30'
                    : isDark
                      ? 'bg-[#202c33] text-gray-300 hover:text-white hover:bg-[#202c33]/80'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Call History List */}
      <div className="mt-2 px-3 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={filterTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-2"
          >
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

              // Status configuration strictly adhering to WhatsApp requirements
              let statusText = '';
              let textColorClass = 'text-gray-400';
              let badgeBg = 'bg-gray-400';
              let isRed = false;

              switch (normStatus) {
                case 'completed':
                  statusText = isOutgoing ? 'Outgoing Call' : 'Incoming Call';
                  textColorClass = 'text-emerald-500 dark:text-emerald-400';
                  badgeBg = 'bg-emerald-500';
                  if (log.duration) {
                    statusText += ` • ${log.duration}`;
                  }
                  break;

                case 'missed':
                  statusText = 'Missed Call';
                  textColorClass = 'text-rose-500 dark:text-rose-400';
                  badgeBg = 'bg-rose-500';
                  isRed = true;
                  break;

                case 'rejected':
                  statusText = isOutgoing ? 'Rejected' : 'Declined';
                  textColorClass = 'text-rose-500 dark:text-rose-400';
                  badgeBg = 'bg-rose-500';
                  isRed = true;
                  break;

                case 'cancelled':
                  statusText = 'Cancelled';
                  textColorClass = 'text-gray-400 dark:text-gray-400';
                  badgeBg = 'bg-gray-400';
                  break;

                case 'busy':
                  statusText = 'Busy';
                  textColorClass = 'text-orange-500 dark:text-amber-400';
                  badgeBg = 'bg-orange-500';
                  break;

                case 'failed':
                  statusText = 'Failed';
                  textColorClass = 'text-gray-400 dark:text-gray-400';
                  badgeBg = 'bg-gray-400';
                  break;

                default:
                  statusText = isOutgoing ? 'Outgoing Call' : 'Incoming Call';
                  textColorClass = 'text-gray-400';
                  badgeBg = 'bg-gray-400';
                  break;
              }

              const IconComponent = log.type === 'video' ? Video : Phone;

              return (
                <motion.div
                  key={log.id}
                  layout
                  onMouseDown={() => startLongPressTimer(log.id)}
                  onTouchStart={() => startLongPressTimer(log.id)}
                  onMouseUp={clearLongPressTimer}
                  onMouseLeave={clearLongPressTimer}
                  onTouchEnd={clearLongPressTimer}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleSelectLog(log.id);
                    } else if (contact) {
                      setActiveContactId(contact.id);
                    }
                  }}
                  className={`p-3 flex items-center gap-3.5 cursor-pointer rounded-2xl transition-all border ${
                    isSelected
                      ? isDark 
                        ? 'bg-[#ff2e93]/20 border-[#ff2e93]' 
                        : 'bg-blue-100 border-blue-400'
                      : isDark 
                        ? 'bg-[#111b21] hover:bg-[#202c33]/70 border-[#202c33]' 
                        : 'bg-white hover:bg-blue-50/40 border-gray-100 shadow-xs'
                  }`}
                >
                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 border ${
                      isSelected 
                        ? 'bg-[#ff2e93] border-[#ff2e93] text-white' 
                        : isDark ? 'border-gray-600 bg-[#202c33]' : 'border-gray-300 bg-gray-50'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={avatar}
                      alt={name}
                      className={`w-12 h-12 rounded-full object-cover border-2 ${
                        isRed
                          ? 'border-rose-500/60'
                          : isDark ? 'border-[#ff2e93]/30' : 'border-blue-200'
                      }`}
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 p-1 rounded-full text-white ${badgeBg}`}>
                      <IconComponent className="w-2.5 h-2.5" />
                    </div>
                  </div>

                  {/* Call Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className={`text-sm font-semibold truncate ${
                      isRed 
                        ? 'text-rose-500' 
                        : (isDark ? 'text-[#e9edef]' : 'text-gray-900')
                    }`}>
                      {name}
                    </h4>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <IconComponent className={`w-3.5 h-3.5 ${textColorClass} shrink-0`} />
                      <span className={`text-xs truncate font-medium ${textColorClass}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex flex-col items-end shrink-0 text-right gap-0.5">
                    <div className="text-xs font-semibold text-[#ff2e93] dark:text-blue-400">
                      {dateStr}
                    </div>
                    <div className={`text-[11px] ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
                      {timeStr}
                    </div>
                  </div>

                  {/* Actions (Re-call / Single Delete) */}
                  {!isSelectionMode && (
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCallLog(log.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-full transition-all active:scale-95"
                        title="Delete this call record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startCall(log.contactId, log.type);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        className="p-2 text-[#ff2e93] hover:bg-[#ff2e93]/10 rounded-full transition-all active:scale-95"
                        title={`Call ${name} again`}
                      >
                        {log.type === 'video' ? (
                          <Video className="w-4.5 h-4.5" />
                        ) : (
                          <Phone className="w-4.5 h-4.5" />
                        )}
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Empty State when no logs match */}
            {filteredLogs.length === 0 && (
              <div className={`py-16 px-6 text-center text-sm flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed my-4 ${
                isDark ? 'border-[#202c33] bg-[#111b21]/50 text-[#8596a0]' : 'border-blue-200 text-gray-500 bg-blue-50/20'
              }`}>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ff2e93]/20 to-[#ff758c]/20 flex items-center justify-center text-[#ff2e93]">
                  <PhoneCall className="w-8 h-8" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center justify-center gap-1.5">
                    <span>📞</span>
                    <span>No call history yet</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    {filterTab === 'missed' && 'You have no missed call records.'}
                    {filterTab === 'received_voice' && 'No answered incoming voice calls.'}
                    {filterTab === 'received_video' && 'No answered incoming video calls.'}
                    {filterTab === 'all' && 'Your recent calls will appear here.'}
                  </p>
                </div>

                {filterTab === 'all' && (
                  <button
                    onClick={() => setShowNewCallModal(true)}
                    className="mt-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#ff2e93] to-[#ff60b5] text-white text-xs font-semibold shadow-md shadow-blue-500/20 hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Start a New Call</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Start New Call Modal */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl border ${
            isDark ? 'bg-[#111b21] border-[#202c33] text-white' : 'bg-white border-blue-100 text-gray-900'
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
                    isDark ? 'border-[#202c33] hover:bg-[#202c33]' : 'border-gray-100 hover:bg-blue-50/40'
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
            isDark ? 'bg-[#111b21] border-[#202c33] text-white' : 'bg-white border-blue-100 text-gray-900'
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
            isDark ? 'bg-[#111b21] border-[#202c33] text-white' : 'bg-white border-blue-100 text-gray-900'
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
