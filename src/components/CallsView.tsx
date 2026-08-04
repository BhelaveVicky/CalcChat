import React, { useState } from 'react';
import { 
  Search, Phone, Video, PhoneCall, Trash2, Plus, Clock, 
  PhoneMissed, PhoneIncoming, PhoneOutgoing 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVault } from '../context/VaultContext';
import { formatCallDateTime } from '../lib/dateUtils';

type FilterTab = 'all' | 'missed' | 'received_voice' | 'received_video';

export const CallsView: React.FC = () => {
  const { 
    callLogs, contacts, startCall, clearCallLogs, settings: vaultSettings, setActiveContactId,
    getContactDisplayName, customNicknames, allRegisteredUsers
  } = useVault();

  const isDark = vaultSettings.theme !== 'material-light' && vaultSettings.theme !== 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [showNewCallModal, setShowNewCallModal] = useState(false);

  // Filter logs based on search and selected tab
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

    const isMissed = log.isMissed || log.status === 'missed' || log.status === 'rejected' || log.status === 'busy' || log.status === 'cancelled';
    const isIncoming = log.direction === 'incoming';
    const isAnswered = !isMissed && (log.status === 'ended' || log.status === 'connected');

    // 1. Missed Calls: ONLY calls that the current user did NOT answer
    if (filterTab === 'missed') {
      return isIncoming && isMissed;
    }

    // 2. Received Voice Calls: ONLY successfully answered incoming Voice Calls
    if (filterTab === 'received_voice') {
      return isIncoming && log.type === 'voice' && isAnswered;
    }

    // 3. Received Video Calls: ONLY successfully answered incoming Video Calls
    if (filterTab === 'received_video') {
      return isIncoming && log.type === 'video' && isAnswered;
    }

    // 4. All Calls: every call made or received by current user
    return true;
  });

  return (
    <div className={`flex-1 flex flex-col overflow-y-auto no-scrollbar font-sans select-none relative h-full min-h-0 pb-20 transition-colors ${
      isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
    }`}>
      
      {/* Top Header & Search */}
      <div className={`px-4 pt-4 pb-2 sticky top-0 z-10 space-y-3 backdrop-blur-md ${
        isDark ? 'bg-[#0b141a]/95' : 'bg-white/95'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff2e93] to-[#ff758c] flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <PhoneCall className="w-4 h-4" />
            </div>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
              Call History
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewCallModal(true)}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ff2e93] to-[#ff60b5] text-white hover:opacity-90 transition-all active:scale-95 shadow-md shadow-pink-500/25 flex items-center gap-1.5 text-xs font-semibold"
              title="Start New Call"
            >
              <Plus className="w-4 h-4" />
              <span>New Call</span>
            </button>

            {callLogs.length > 0 && (
              <button
                onClick={clearCallLogs}
                className={`p-2 rounded-full transition-all ${
                  isDark ? 'hover:bg-[#202c33] text-rose-400' : 'hover:bg-rose-50 text-rose-600'
                }`}
                title="Clear Call History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full text-sm transition-all border ${
          isDark 
            ? 'bg-[#202c33] text-[#e9edef] border-pink-500/10 focus-within:border-[#ff2e93]/50' 
            : 'bg-gray-100 text-gray-900 border-gray-200 focus-within:border-[#ff2e93]/50'
        }`}>
          <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-pink-400/70' : 'text-pink-500/70'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search call history..."
            className={`bg-transparent border-none outline-none w-full text-sm ${
              isDark 
                ? 'placeholder:text-[#8596a0] text-[#e9edef]' 
                : 'placeholder:text-gray-400 text-gray-900'
            }`}
          />
        </div>

        {/* 4 Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
          {[
            { id: 'all', label: 'All Calls' },
            { id: 'missed', label: 'Missed Calls' },
            { id: 'received_voice', label: 'Received Voice Calls' },
            { id: 'received_video', label: 'Received Video Calls' },
          ].map(tab => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as FilterTab)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ff2e93] to-[#ff60b5] text-white shadow-md shadow-pink-500/30'
                    : isDark
                      ? 'bg-[#202c33] text-gray-300 hover:text-white hover:bg-[#202c33]/80'
                      : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calls Log List */}
      <div className="mt-2 px-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={filterTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-2"
          >
            {filteredLogs.map((log) => {
              const contact = contacts.find(c => c.id === log.contactId);
              const registeredUser = allRegisteredUsers.find(u => u.uid === log.contactId || u.id === log.contactId);
              const name = getContactDisplayName(contact || log.contactId) || registeredUser?.displayName || registeredUser?.username || 'User';
              const avatar = contact?.avatar || registeredUser?.photoURL || registeredUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
              
              const isMissed = log.isMissed || log.status === 'missed' || log.status === 'rejected' || log.status === 'busy' || log.status === 'cancelled';
              const isIncoming = log.direction === 'incoming';
              const { dateStr, timeStr } = formatCallDateTime(log.createdAt, log.timestamp);

              // Render call status label & iconography according to active tab specifications
              const renderCallLabelAndIcon = () => {
                if (filterTab === 'missed') {
                  return {
                    icon: <PhoneMissed className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
                    text: log.type === 'video' ? 'Missed Video Call' : 'Missed Voice Call',
                    textClass: 'text-rose-500 font-semibold',
                  };
                }

                if (filterTab === 'received_voice') {
                  return {
                    icon: <PhoneIncoming className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
                    text: `Voice Call • Received (${log.duration || '00:00'})`,
                    textClass: 'text-emerald-500 font-medium',
                  };
                }

                if (filterTab === 'received_video') {
                  return {
                    icon: <Video className="w-3.5 h-3.5 text-pink-500 shrink-0" />,
                    text: `Video Call • Received (${log.duration || '00:00'})`,
                    textClass: 'text-pink-500 font-medium',
                  };
                }

                // Default 'all' tab
                if (isMissed) {
                  return {
                    icon: <PhoneMissed className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
                    text: log.type === 'video' ? 'Missed Video Call' : 'Missed Voice Call',
                    textClass: 'text-rose-500 font-semibold',
                  };
                }

                if (isIncoming) {
                  return {
                    icon: <PhoneIncoming className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
                    text: `Incoming ${log.type === 'video' ? 'Video' : 'Voice'} Call (${log.duration || '00:00'})`,
                    textClass: isDark ? 'text-gray-300' : 'text-gray-600',
                  };
                }

                return {
                  icon: <PhoneOutgoing className="w-3.5 h-3.5 text-sky-500 shrink-0" />,
                  text: `Outgoing ${log.type === 'video' ? 'Video' : 'Voice'} Call (${log.duration || '00:00'})`,
                  textClass: isDark ? 'text-gray-300' : 'text-gray-600',
                };
              };

              const callBadge = renderCallLabelAndIcon();

              return (
                <motion.div
                  key={log.id}
                  layout
                  onClick={() => {
                    if (contact) {
                      setActiveContactId(contact.id);
                    }
                  }}
                  className={`p-3 flex items-center gap-3.5 cursor-pointer rounded-2xl transition-all border ${
                    isDark 
                      ? 'bg-[#111b21] hover:bg-[#202c33]/70 border-[#202c33]' 
                      : 'bg-white hover:bg-pink-50/40 border-gray-100 shadow-xs'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={avatar}
                      alt={name}
                      className={`w-12 h-12 rounded-full object-cover border-2 ${
                        isMissed
                          ? 'border-rose-500/50'
                          : isDark ? 'border-[#ff2e93]/30' : 'border-pink-200'
                      }`}
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 p-1 rounded-full ${
                      log.type === 'video' ? 'bg-[#ff2e93] text-white' : 'bg-emerald-500 text-white'
                    }`}>
                      {log.type === 'video' ? (
                        <Video className="w-2.5 h-2.5" />
                      ) : (
                        <Phone className="w-2.5 h-2.5" />
                      )}
                    </div>
                  </div>

                  {/* Call Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className={`text-sm font-semibold truncate ${
                      isMissed 
                        ? 'text-rose-500' 
                        : (isDark ? 'text-[#e9edef]' : 'text-gray-900')
                    }`}>
                      {name}
                    </h4>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      {callBadge.icon}
                      <span className={`text-xs truncate ${callBadge.textClass}`}>
                        {callBadge.text}
                      </span>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex flex-col items-end shrink-0 text-right gap-1">
                    <div className="text-xs font-semibold text-[#ff2e93] dark:text-pink-400">
                      {dateStr}
                    </div>
                    <div className={`text-[11px] ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
                      {timeStr}
                    </div>
                  </div>

                  {/* Quick Re-Call Action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startCall(log.contactId, log.type);
                    }}
                    className="p-2 text-[#ff2e93] hover:bg-[#ff2e93]/10 rounded-full transition-all active:scale-95 shrink-0 ml-1"
                    title={`Call ${name} again`}
                  >
                    {log.type === 'video' ? (
                      <Video className="w-4.5 h-4.5" />
                    ) : (
                      <Phone className="w-4.5 h-4.5" />
                    )}
                  </button>
                </motion.div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className={`py-16 text-center text-sm flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed ${
                isDark ? 'border-[#202c33] text-[#8596a0]' : 'border-pink-200 text-gray-500 bg-pink-50/20'
              }`}>
                <Clock className="w-10 h-10 text-[#ff2e93]/50 mb-1" />
                <p className="font-semibold text-base text-gray-800 dark:text-gray-200">No Call History Found</p>
                <p className="text-xs max-w-xs">
                  {filterTab === 'missed' && 'You have no missed calls.'}
                  {filterTab === 'received_voice' && 'No answered incoming voice calls.'}
                  {filterTab === 'received_video' && 'No answered incoming video calls.'}
                  {filterTab === 'all' && 'No calls recorded yet. Tap "New Call" above to initiate a call.'}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
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

    </div>
  );
};
