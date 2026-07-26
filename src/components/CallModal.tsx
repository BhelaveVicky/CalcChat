import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Video, PhoneCall } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useSettings } from '../context/SettingsContext';

export const CallModal: React.FC = () => {
  const { activeCall, endCall, contacts } = useVault();
  const { settings: globalSettings } = useSettings();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Reset states and handle timer when call is active
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeCall) {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall]);

  if (!activeCall) return null;

  const contact = contacts.find((c) => c.id === activeCall.contactId);
  const contactName = contact ? contact.name : 'Unknown Contact';
  const contactAvatar = contact ? contact.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isDark = globalSettings.darkMode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg animate-in fade-in duration-300">
      <div className={`relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl transition-all duration-300 ${
        isDark 
          ? 'bg-[#111b21] border-[#222e35] text-[#e9edef]' 
          : 'bg-white border-slate-100 text-slate-800'
      }`}>
        {/* Background Decorative Gradient Blobs */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center justify-between min-h-[500px] p-8 z-10 relative">
          
          {/* Header */}
          <div className="text-center w-full mt-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              activeCall.type === 'video' 
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {activeCall.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5" />}
              Classified {activeCall.type} call
            </span>
            
            <p className={`text-xs mt-3 ${isDark ? 'text-[#8596a0]' : 'text-slate-500'}`}>
              SECURE SYMMETRIC END-TO-END ENCRYPTION
            </p>
          </div>

          {/* Contact Avatar Area with Pulsing Wave Effect */}
          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute w-36 h-36 bg-emerald-500/15 rounded-full animate-ping duration-1000 opacity-75" />
              <div className="absolute w-44 h-44 bg-emerald-500/5 rounded-full animate-pulse duration-1000" />
              
              {/* Inner Avatar Frame */}
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-500 shadow-2xl">
                <img 
                  src={contactAvatar} 
                  alt={contactName} 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>

            <h3 className={`text-2xl font-bold mt-6 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {contactName}
            </h3>

            <span className="font-mono text-sm font-semibold tracking-widest text-emerald-500 mt-2 bg-emerald-500/10 px-3 py-0.5 rounded-full">
              {formatDuration(callDuration)}
            </span>
          </div>

          {/* Call Controls Bar */}
          <div className="w-full max-w-xs flex justify-between items-center px-4 mb-4">
            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full transition-all duration-200 active:scale-95 border ${
                isMuted 
                  ? 'bg-rose-500 border-rose-500 text-white shadow-rose-500/20' 
                  : isDark 
                    ? 'bg-[#202c33] border-transparent hover:bg-[#2a3942] text-[#e9edef]' 
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={endCall}
              className="p-5 rounded-full bg-rose-500 text-white shadow-xl hover:bg-rose-600 active:scale-90 transition-all duration-200"
              title="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Speaker Button */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-4 rounded-full transition-all duration-200 active:scale-95 border ${
                isSpeakerOn 
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20' 
                  : isDark 
                    ? 'bg-[#202c33] border-transparent hover:bg-[#2a3942] text-[#e9edef]' 
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
              }`}
              title={isSpeakerOn ? 'Turn speaker off' : 'Turn speaker on'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
