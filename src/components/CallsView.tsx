import React, { useState } from 'react';
import { 
  Search, Phone, Video, ArrowDownLeft, ArrowUpRight, PhoneCall, 
  Trash2, Plus, Clock, Filter 
} from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const CallsView: React.FC = () => {
  const { 
    callLogs, contacts, startCall, clearCallLogs, settings: vaultSettings, setActiveContactId,
    getContactDisplayName, customNicknames
  } = useVault();

  const isDark = vaultSettings.theme !== 'material-light' && vaultSettings.theme !== 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'missed' | 'voice' | 'video'>('all');
  const [showNewCallModal, setShowNewCallModal] = useState(false);

  // Filter logs based on search and selected tab
  const filteredLogs = callLogs.filter(log => {
    const contact = contacts.find(c => c.id === log.contactId);
    const displayName = getContactDisplayName(contact || log.contactId);
    const originalName = contact?.name || '';
    const nickname = customNicknames[log.contactId] || '';
    
    const matchesSearch = displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          nickname.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterTab === 'missed') return log.isMissed || log.status === 'missed' || log.status === 'rejected';
    if (filterTab === 'voice') return log.type === 'voice';
    if (filterTab === 'video') return log.type === 'video';
    return true;
  });

  return (
    <div className={`flex-1 flex flex-col overflow-y-auto no-scrollbar font-sans select-none relative h-full min-h-0 pb-20 transition-colors ${
      isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
    }`}>
      
      {/* Top Header & Search */}
      <div className={`px-4 pt-4 pb-2 sticky top-0 z-10 space-y-3 ${
        isDark ? 'bg-[#0b141a]' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>
            Calls History
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewCallModal(true)}
              className="p-2 rounded-full bg-[#00a8ff] text-[#0b141a] hover:bg-[#0091ea] transition-all active:scale-95 shadow-md"
              title="Start New Call"
            >
              <Plus className="w-5 h-5" />
            </button>

            {callLogs.length > 0 && (
              <button
                onClick={clearCallLogs}
                className={`p-2 rounded-full transition-all ${
                  isDark ? 'hover:bg-[#202c33] text-rose-400' : 'hover:bg-gray-100 text-rose-600'
                }`}
                title="Clear Call History"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full text-sm transition-all border ${
          isDark 
            ? 'bg-[#202c33] text-[#e9edef] border-transparent focus-within:border-[#00a8ff]/40' 
            : 'bg-gray-100 text-gray-900 border-gray-200 focus-within:border-sky-500/40'
        }`}>
          <Search className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contact or phone..."
            className={`bg-transparent border-none outline-none w-full text-sm ${
              isDark 
                ? 'placeholder:text-[#8596a0] text-[#e9edef]' 
                : 'placeholder:text-gray-400 text-gray-900'
            }`}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
          {[
            { id: 'all', label: 'All Calls' },
            { id: 'missed', label: 'Missed' },
            { id: 'voice', label: 'Voice' },
            { id: 'video', label: 'Video' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterTab === tab.id
                  ? 'bg-[#00a8ff] text-[#0b141a] shadow-sm'
                  : isDark
                    ? 'bg-[#202c33] text-[#8596a0] hover:text-white'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calls Log List */}
      <div className="divide-y divide-transparent mt-2 px-1">
        {filteredLogs.map((log) => {
          const contact = contacts.find(c => c.id === log.contactId);
          const name = getContactDisplayName(contact || log.contactId) || 'Unknown Contact';
          const avatar = contact?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
          const isMissed = log.isMissed || log.status === 'missed' || log.status === 'rejected';

          return (
            <div
              key={log.id}
              onClick={() => {
                if (contact) {
                  setActiveContactId(contact.id);
                }
              }}
              className={`px-4 py-3.5 flex items-center gap-3.5 cursor-pointer rounded-2xl transition-colors group ${
                isDark ? 'hover:bg-[#202c33]/60' : 'hover:bg-gray-100'
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={avatar}
                  alt={name}
                  className={`w-12 h-12 rounded-full object-cover border ${
                    isDark ? 'border-[#2a3942]/40' : 'border-gray-200'
                  }`}
                />
              </div>

              {/* Call Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className={`text-base font-semibold truncate ${
                  isMissed 
                    ? 'text-rose-500' 
                    : (isDark ? 'text-[#e9edef]' : 'text-gray-900')
                }`}>
                  {name}
                </h4>

                <div className="flex items-center gap-1.5 mt-1">
                  {isMissed ? (
                    <ArrowDownLeft className="w-4 h-4 text-rose-500 shrink-0 stroke-[2.5]" />
                  ) : log.direction === 'outgoing' ? (
                    <ArrowUpRight className="w-4 h-4 text-[#00a8ff] shrink-0 stroke-[2.5]" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4 text-[#00a8ff] shrink-0 stroke-[2.5]" />
                  )}

                  <span className={`text-xs font-medium truncate ${
                    isDark ? 'text-[#8596a0]' : 'text-gray-500'
                  }`}>
                    {isMissed ? 'Missed Call' : log.direction === 'outgoing' ? 'Outgoing' : 'Incoming'} • {log.duration || '00:00'}
                  </span>
                </div>
              </div>

              {/* Date & Trigger Button */}
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-normal ${
                  isDark ? 'text-[#8596a0]' : 'text-gray-500'
                }`}>
                  {log.timestamp}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startCall(log.contactId, log.type);
                  }}
                  className="p-2.5 text-[#00a8ff] hover:bg-[#00a8ff]/10 rounded-full transition-all active:scale-95"
                  title={`Call ${name}`}
                >
                  {log.type === 'video' ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <Phone className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className={`py-16 text-center text-sm flex flex-col items-center justify-center gap-2 ${
            isDark ? 'text-[#8596a0]' : 'text-gray-500'
          }`}>
            <Clock className="w-10 h-10 opacity-40 mb-1" />
            <p className="font-semibold text-base">No Call History Found</p>
            <p className="text-xs">Tap the "+" button above to initiate a call with any contact.</p>
          </div>
        )}
      </div>

      {/* Start New Call Modal */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl border ${
            isDark ? 'bg-[#111b21] border-[#202c33] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Select Contact to Call</h3>
              <button 
                onClick={() => setShowNewCallModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 no-scrollbar">
              {contacts.map(c => (
                <div 
                  key={c.id}
                  className={`p-3 rounded-2xl flex items-center justify-between border ${
                    isDark ? 'border-[#202c33] hover:bg-[#202c33]' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="font-semibold text-sm">{c.name}</h4>
                      <p className="text-xs text-slate-400">{c.status}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setShowNewCallModal(false);
                        startCall(c.id, 'voice');
                      }}
                      className="p-2 text-[#00a8ff] hover:bg-[#00a8ff]/20 rounded-full"
                      title="Voice Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowNewCallModal(false);
                        startCall(c.id, 'video');
                      }}
                      className="p-2 text-[#00a8ff] hover:bg-[#00a8ff]/20 rounded-full"
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
