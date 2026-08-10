import React from 'react';
import { Phone, Video, Maximize2, PhoneOff } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const ActiveCallFloatingBanner: React.FC = () => {
  const { activeCall, isCallMinimized, maximizeCall, endCall, contacts, groupContacts, getContactDisplayName } = useVault();

  if (!activeCall || !isCallMinimized) return null;

  const contact = contacts.find(c => c.id === activeCall.contactId) || groupContacts.find(g => g.id === activeCall.contactId);
  const displayName = contact ? getContactDisplayName(contact) : (activeCall.isGroupCall ? 'Group Call' : 'Call');
  const avatar = contact?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  const mins = Math.floor(activeCall.durationSeconds / 60);
  const secs = activeCall.durationSeconds % 60;
  const timerStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div 
      onClick={maximizeCall}
      className="fixed top-2 left-1/2 -translate-x-1/2 z-[90] w-[92%] max-w-lg bg-[#1f2c34]/95 backdrop-blur-xl border border-[#ff2e93]/50 shadow-[0_8px_32px_rgba(255,46,147,0.3)] rounded-2xl p-2.5 flex items-center justify-between text-white select-none cursor-pointer transition-all hover:scale-[1.01] active:scale-95 animate-slide-down"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative shrink-0">
          <img 
            src={avatar} 
            alt={displayName} 
            className="w-10 h-10 rounded-full object-cover border-2 border-[#ff2e93] shadow"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#1f2c34] animate-ping" />
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#1f2c34]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-xs">{displayName}</h4>
            <span className="text-[10px] font-mono font-bold text-[#ff2e93] bg-black/40 px-2 py-0.5 rounded-full border border-[#ff2e93]/30 shrink-0">
              {activeCall.status === 'connected' ? timerStr : (activeCall.status === 'connecting' ? 'Connecting...' : 'Ringing...')}
            </span>
          </div>
          <p className="text-[11px] font-medium text-emerald-400 flex items-center gap-1 mt-0.5">
            {activeCall.type === 'video' ? <Video className="w-3 h-3 text-[#ff2e93]" /> : <Phone className="w-3 h-3 text-[#ff2e93]" />}
            <span>Tap to return to active call</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            maximizeCall();
          }}
          className="p-2 rounded-xl bg-[#ff2e93] text-[#0b141a] font-bold text-xs flex items-center gap-1 hover:bg-[#ff1e85] transition-all shadow active:scale-95"
          title="Return to full call screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            endCall();
          }}
          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow active:scale-95"
          title="End Call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
