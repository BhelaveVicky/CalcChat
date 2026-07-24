import React, { useState } from 'react';
import { Search, Phone, Video, ArrowDownLeft, ArrowUpRight, PhoneCall, Mic, MicOff, PhoneOff } from 'lucide-react';

interface CallItem {
  id: string;
  name: string;
  time: string;
  type: 'missed-voice' | 'missed-video' | 'outgoing-voice' | 'incoming-voice';
  avatar: string;
  isVideo?: boolean;
}

const RECENT_CALLS: CallItem[] = [
  {
    id: 'call_1',
    name: 'Chalo khairighat 🚩🏁',
    time: 'Yesterday',
    type: 'missed-voice',
    avatar: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'call_2',
    name: 'Harsh Brother',
    time: 'Yesterday',
    type: 'missed-voice',
    avatar: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'call_3',
    name: 'Faiyaz Ushmani Ng',
    time: 'Friday',
    type: 'missed-voice',
    avatar: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'call_4',
    name: 'Poornima Bhelave',
    time: '17/06/2026',
    type: 'missed-video',
    avatar: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=150&auto=format&fit=crop&q=80',
    isVideo: true,
  },
  {
    id: 'call_5',
    name: 'Pranay Malewar',
    time: '17/06/2026',
    type: 'outgoing-voice',
    avatar: 'https://images.unsplash.com/photo-1567591414240-e9451552a4f4?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'call_6',
    name: 'Ambar Kamli',
    time: '17/06/2026',
    type: 'missed-voice',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'call_7',
    name: 'Pranay Malewar',
    time: '08/06/2026',
    type: 'missed-video',
    avatar: 'https://images.unsplash.com/photo-1567591414240-e9451552a4f4?w=150&auto=format&fit=crop&q=80',
    isVideo: true,
  },
  {
    id: 'call_8',
    name: '+91 96431 20346',
    time: '02/06/2026',
    type: 'missed-voice',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'call_9',
    name: 'Harsh Brother, Faiyaz Us...',
    time: '28/05/2026',
    type: 'missed-video',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    isVideo: true,
  },
];

export const CallsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCall, setActiveCall] = useState<CallItem | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const filteredCalls = RECENT_CALLS.filter(call =>
    call.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] text-[#e9edef] overflow-y-auto no-scrollbar font-sans select-none relative h-full min-h-0 pb-16">
      
      {/* Search Bar */}
      <div className="px-4 pt-3 pb-2 sticky top-0 bg-[#0b141a] z-10">
        <div className="flex items-center gap-3 bg-[#202c33] px-4 py-2 rounded-full text-sm text-[#e9edef] border border-transparent focus-within:border-[#00a884]/40 transition-all">
          <Search className="w-4 h-4 text-[#8596a0] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or number"
            className="bg-transparent border-none outline-none w-full text-sm placeholder:text-[#8596a0] text-[#e9edef]"
          />
        </div>
      </div>



      {/* Section Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-base font-semibold text-[#e9edef] tracking-wide">Recent</h2>
      </div>

      {/* Calls List */}
      <div className="divide-y divide-transparent">
        {filteredCalls.map((call) => (
          <div
            key={call.id}
            onClick={() => setActiveCall(call)}
            className="px-4 py-3 flex items-center gap-3.5 hover:bg-[#202c33]/50 cursor-pointer transition-colors group"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={call.avatar}
                alt={call.name}
                className="w-12 h-12 rounded-full object-cover border border-[#2a3942]/40"
              />
            </div>

            {/* Call Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className={`text-base font-normal truncate ${call.type.includes('missed') ? 'text-[#f15c6d]' : 'text-[#e9edef]'}`}>
                {call.name}
              </h4>

              <div className="flex items-center gap-1.5 mt-0.5">
                {call.type === 'missed-voice' && (
                  <ArrowDownLeft className="w-4 h-4 text-[#f15c6d] shrink-0 stroke-[2.5]" />
                )}
                {call.type === 'missed-video' && (
                  <Video className="w-3.5 h-3.5 text-[#f15c6d] shrink-0 fill-current" />
                )}
                {call.type === 'outgoing-voice' && (
                  <ArrowUpRight className="w-4 h-4 text-[#00a884] shrink-0 stroke-[2.5]" />
                )}
                {call.type === 'incoming-voice' && (
                  <ArrowDownLeft className="w-4 h-4 text-[#00a884] shrink-0 stroke-[2.5]" />
                )}

                <span className="text-xs text-[#8596a0] font-normal truncate">
                  {call.type.includes('missed') ? 'Missed' : call.type === 'outgoing-voice' ? 'Outgoing' : 'Incoming'}
                </span>
              </div>
            </div>

            {/* Timestamp & Action Button */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-[#8596a0] font-normal">
                {call.time}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCall(call);
                }}
                className="p-2 text-[#00a884] hover:bg-[#202c33] rounded-full transition-all active:scale-95"
                title={`Call ${call.name}`}
              >
                {call.isVideo ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <Phone className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ))}

        {filteredCalls.length === 0 && (
          <div className="py-12 text-center text-[#8596a0] text-sm">
            No calls found matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* Active Call Overlay Modal */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-[#0b141a]/95 backdrop-blur-md flex flex-col items-center justify-between py-16 px-6 animate-in fade-in duration-200">
          <div className="flex flex-col items-center text-center mt-8">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#00a884] shadow-2xl mb-4 relative animate-pulse">
              <img src={activeCall.avatar} alt={activeCall.name} className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-semibold text-[#e9edef] mb-1">{activeCall.name}</h2>
            <p className="text-sm text-[#00a884] font-medium tracking-wide">
              {activeCall.isVideo ? 'WhatsApp Video Calling...' : 'WhatsApp Calling...'}
            </p>
            <span className="text-xs text-[#8596a0] mt-1">End-to-end encrypted</span>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-8 w-full max-w-xs mb-8">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full transition-all active:scale-95 ${isMuted ? 'bg-[#f15c6d] text-white' : 'bg-[#202c33] text-[#e9edef]'}`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={() => setActiveCall(null)}
              className="p-5 rounded-full bg-[#f15c6d] text-white shadow-lg hover:bg-[#d14455] active:scale-95 transition-all"
              title="End call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            <button
              onClick={() => alert("Speaker toggled")}
              className="p-4 rounded-full bg-[#202c33] text-[#e9edef] hover:bg-[#2a3942] active:scale-95 transition-all"
              title="Speaker"
            >
              <PhoneCall className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
