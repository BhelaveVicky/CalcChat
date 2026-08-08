import React, { useEffect, useRef, useState } from 'react';
import { 
  Phone, Video, Mic, MicOff, VideoOff, PhoneOff, PhoneCall, 
  SwitchCamera, Volume2, ShieldCheck, Wifi, Maximize2, Minimize2,
  AlertCircle, Lock, RefreshCw, X, Sparkles, ArrowLeftRight, Check, Sliders
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { getContactNotificationSettings } from '../lib/contactSettings';

const VIDEO_FILTERS = [
  { id: 'none', label: 'Normal', css: 'none' },
  { id: 'bw', label: 'B&W', css: 'grayscale(100%)' },
  { id: 'sepia', label: 'Vintage', css: 'sepia(85%) contrast(110%)' },
  { id: 'warm', label: 'Warm', css: 'saturate(160%) contrast(105%)' },
  { id: 'cool', label: 'Cyber', css: 'hue-rotate(180deg) brightness(110%)' },
  { id: 'vivid', label: 'Vivid', css: 'contrast(125%) saturate(145%)' },
];

export const CallModal: React.FC = () => {
  const { 
    user, activeCall, contacts, groupContacts, acceptCall, joinGroupCall, rejectCall, cancelCall, endCall,
    toggleMuteCall, toggleVideoCall, toggleSpeakerCall, switchCameraCall,
    getContactDisplayName, callPermissionError, clearCallPermissionError
  } = useVault();

  const containerRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSelfViewPrimary, setIsSelfViewPrimary] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  const contact = contacts.find(c => c.id === activeCall?.contactId) || groupContacts.find(g => g.id === activeCall?.contactId);

  const activeFilterCss = VIDEO_FILTERS.find(f => f.id === selectedFilter)?.css || 'none';

  // Toggle browser fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Synthesize soft ringtone audio using Web Audio API when ringing
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let interval: NodeJS.Timeout | null = null;

    if (activeCall && (activeCall.status === 'ringing' || activeCall.status === 'incoming')) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();

          const playBeep = () => {
            if (!audioCtx || audioCtx.state === 'closed') return;
            if (activeCall?.contactId) {
              const notifSettings = getContactNotificationSettings(activeCall.contactId);
              if (!notifSettings.callNotifications) {
                // Call notification ringtone is turned OFF for this user
                return;
              }
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = activeCall.status === 'incoming' ? 440 : 425;
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.8);
          };

          playBeep();
          interval = setInterval(playBeep, 2000);
        }
      } catch (err) {
        console.warn('AudioContext ringtone warning:', err);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [activeCall?.status]);

  // Attach remote stream to audio element (voice and video calls)
  useEffect(() => {
    if (remoteAudioRef.current && activeCall?.remoteStream) {
      remoteAudioRef.current.srcObject = activeCall.remoteStream;
    }
  }, [activeCall?.remoteStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && activeCall?.remoteStream) {
      remoteVideoRef.current.srcObject = activeCall.remoteStream;
    }
  }, [activeCall?.remoteStream, isSelfViewPrimary]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && activeCall?.localStream) {
      localVideoRef.current.srcObject = activeCall.localStream;
    }
  }, [activeCall?.localStream, isSelfViewPrimary]);

  if (!activeCall && !callPermissionError) return null;

  // Permission error overlay modal
  if (callPermissionError) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-[#1f2c34] text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/10 relative">
          <button 
            onClick={clearCallPermissionError}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold mb-2">Permission Required</h3>
            <p className="text-sm text-slate-300 mb-6">{callPermissionError}</p>

            <div className="w-full bg-slate-900/60 rounded-2xl p-4 text-left text-xs text-slate-300 space-y-2 mb-6 border border-white/5">
              <div className="flex items-center gap-2 font-semibold text-[#ff2e93] mb-1">
                <Lock className="w-4 h-4" />
                <span>How to grant permission:</span>
              </div>
              <p>1. Click the site settings or lock icon next to the address bar in your browser.</p>
              <p>2. Set <strong>Microphone</strong> and <strong>Camera</strong> permissions to <strong>Allow</strong>.</p>
              <p>3. Refresh or try calling again.</p>
            </div>

            <button
              onClick={clearCallPermissionError}
              className="w-full py-3 bg-[#ff2e93] text-[#0b141a] font-bold rounded-2xl hover:bg-[#ff1e85] transition-all"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeCall || !contact) return null;

  const userAvatar = (user as any)?.photoURL || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  const contactAvatar = contact.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  const mins = Math.floor(activeCall.durationSeconds / 60);
  const secs = activeCall.durationSeconds % 60;
  const timerStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#0b141a] text-white flex flex-col items-center justify-between p-6 select-none font-sans overflow-hidden animate-fade-in"
    >
      {/* Hidden Remote Audio Element for playing remote audio track */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Background Ambient Picture / Blur */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0b141a]/90 via-[#0b141a]/60 to-[#0b141a]/95 pointer-events-none">
        {contact.avatar && (
          <img 
            src={contact.avatar} 
            alt={contact.name} 
            className="w-full h-full object-cover blur-3xl opacity-20 scale-110" 
          />
        )}
      </div>

      {/* Top Header Bar */}
      <div className="z-10 w-full max-w-lg flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#ff2e93]" />
          <span className="text-xs font-semibold text-[#ff2e93] tracking-wider uppercase">End-to-End Encrypted</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
            <Wifi className={`w-3.5 h-3.5 ${activeCall.connectionQuality === 'poor' ? 'text-rose-400' : 'text-[#ff2e93]'}`} />
            <span>
              {activeCall.connectionQuality === 'reconnecting' ? 'Reconnecting...' : 'HD 1080p'}
            </span>
          </div>

          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-slate-300 border border-white/10 backdrop-blur-md transition-all"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Profile / Video Container */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center w-full max-w-lg my-auto relative">
        
        {/* Video Call Active Screen */}
        {activeCall.type === 'video' && (activeCall.status === 'connected' || activeCall.status === 'connecting') ? (
          <div className="w-full h-[400px] sm:h-[500px] rounded-3xl overflow-hidden relative shadow-2xl border border-white/10 bg-slate-900 group flex items-center justify-center">
            
            {/* Main / Primary Video Stream */}
            <div className="w-full h-full relative flex items-center justify-center bg-slate-900 overflow-hidden">
              {!isSelfViewPrimary ? (
                /* Remote Video Stream as Primary */
                <>
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className={`w-full h-full object-cover transition-all duration-300 ${!activeCall.remoteStream || activeCall.isRemoteVideoOff ? 'hidden' : 'block'}`} 
                  />

                  {(!activeCall.remoteStream || activeCall.isRemoteVideoOff) && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-4">
                      <img 
                        src={contactAvatar} 
                        alt={contact.name} 
                        className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-slate-700/60 shadow-2xl" 
                      />
                      {activeCall.isRemoteVideoOff && (
                        <span className="mt-3 text-xs font-medium text-slate-400 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/5">
                          Camera Off
                        </span>
                      )}
                      {!activeCall.remoteStream && !activeCall.isRemoteVideoOff && (
                        <span className="mt-3 text-xs font-medium text-slate-300 animate-pulse">
                          Connecting video feed...
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Local Self-View Stream as Primary */
                <>
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{ filter: activeFilterCss }}
                    className={`w-full h-full object-cover transition-all duration-300 ${activeCall.isVideoOff || !activeCall.localStream ? 'hidden' : 'block'}`} 
                  />
                  {(activeCall.isVideoOff || !activeCall.localStream) && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-4 text-center">
                      <img 
                        src={userAvatar} 
                        alt="Me" 
                        className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-[#ff2e93] shadow-2xl" 
                      />
                      <span className="mt-3 text-xs font-medium text-slate-400 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/5">
                        Your Camera is Off
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Small PIP Secondary View Overlay - Click to Swap */}
            <div 
              onClick={() => setIsSelfViewPrimary(!isSelfViewPrimary)}
              title="Click to swap video view"
              className="absolute bottom-4 right-4 w-28 h-36 sm:w-32 sm:h-44 rounded-2xl overflow-hidden border-2 border-[#ff2e93] shadow-2xl bg-slate-900 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 z-20 group/pip"
            >
              {!isSelfViewPrimary ? (
                /* Local Self Video in PIP */
                <>
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{ filter: activeFilterCss }}
                    className={`w-full h-full object-cover ${activeCall.isVideoOff || !activeCall.localStream ? 'hidden' : 'block'}`} 
                  />
                  {(activeCall.isVideoOff || !activeCall.localStream) && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-2 text-center">
                      <img 
                        src={userAvatar} 
                        alt="Me" 
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-slate-700/60 shadow-md" 
                      />
                    </div>
                  )}
                </>
              ) : (
                /* Remote Stream in PIP */
                <>
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className={`w-full h-full object-cover ${!activeCall.remoteStream || activeCall.isRemoteVideoOff ? 'hidden' : 'block'}`} 
                  />
                  {(!activeCall.remoteStream || activeCall.isRemoteVideoOff) && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-2 text-center">
                      <img 
                        src={contactAvatar} 
                        alt={contact.name} 
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-slate-700/60 shadow-md" 
                      />
                    </div>
                  )}
                </>
              )}

              {/* Hover Swap Indicator Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/pip:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-center backdrop-blur-[2px]">
                <ArrowLeftRight className="w-5 h-5 text-white mb-1 animate-pulse" />
                <span className="text-[10px] font-bold text-white leading-tight">Click to Swap</span>
              </div>
            </div>

            {/* Top Bar Badges: Name Badge & Action Controls */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-2 border border-white/10 pointer-events-auto">
                <span className="w-2 h-2 rounded-full bg-[#ff2e93] animate-pulse" />
                <span>{isSelfViewPrimary ? `You (${(user as any)?.displayName || user?.name || 'Self'})` : getContactDisplayName(contact)}</span>
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Swap View Button */}
                <button
                  onClick={() => setIsSelfViewPrimary(!isSelfViewPrimary)}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-all active:scale-95 flex items-center gap-1.5 px-3 text-xs font-medium"
                  title="Swap view between remote and self"
                >
                  <ArrowLeftRight className="w-4 h-4 text-[#ff2e93]" />
                  <span className="hidden sm:inline">Swap</span>
                </button>

                {/* Filter Selector Toggle Button */}
                <button
                  onClick={() => setShowFilterPicker(!showFilterPicker)}
                  className={`p-2 rounded-full backdrop-blur-md border transition-all active:scale-95 flex items-center gap-1.5 px-3 text-xs font-medium ${
                    showFilterPicker || selectedFilter !== 'none'
                      ? 'bg-[#ff2e93] text-[#0b141a] font-bold border-[#ff2e93]'
                      : 'bg-black/60 hover:bg-black/80 text-white border-white/10'
                  }`}
                  title="Camera Filters & Effects"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">{selectedFilter !== 'none' ? VIDEO_FILTERS.find(f => f.id === selectedFilter)?.label : 'Filters'}</span>
                </button>
              </div>
            </div>

            {/* Video Filters Selector Bar */}
            {showFilterPicker && (
              <div className="absolute bottom-4 left-4 right-36 bg-black/90 backdrop-blur-xl p-3 rounded-2xl border border-white/15 z-30 animate-slide-up shadow-2xl">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff2e93]" />
                    <span>Camera Filters & Effects</span>
                  </div>
                  <button 
                    onClick={() => setShowFilterPicker(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {VIDEO_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id)}
                      className={`flex flex-col items-center min-w-[62px] p-2 rounded-xl text-xs font-medium transition-all ${
                        selectedFilter === f.id
                          ? 'bg-[#ff2e93] text-[#0b141a] font-bold shadow-lg scale-105'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <span className="truncate">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Voice Call / Ringing Screen */
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              {/* Ringing Waves Animation */}
              {(activeCall.status === 'ringing' || activeCall.status === 'incoming' || activeCall.status === 'connecting') && (
                <>
                  <div className="absolute -inset-4 rounded-full bg-[#ff2e93]/20 animate-ping" />
                  <div className="absolute -inset-8 rounded-full bg-[#ff2e93]/10 animate-pulse" />
                </>
              )}

              <img 
                src={contact.avatar} 
                alt={getContactDisplayName(contact)} 
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-[#ff2e93] shadow-2xl relative z-10" 
              />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">{getContactDisplayName(contact)}</h2>
            
            <p className="text-sm font-semibold text-[#ff2e93] tracking-wide mb-3">
              {activeCall.status === 'ringing' && 'Calling...'}
              {activeCall.status === 'incoming' && `Incoming ${activeCall.type === 'video' ? 'Video' : 'Voice'} Call`}
              {activeCall.status === 'connecting' && 'Connecting WebRTC call...'}
              {activeCall.status === 'connected' && `${activeCall.type === 'video' ? 'Video' : 'Voice'} Call`}
            </p>

            {activeCall.status === 'connected' && (
              <div className="text-lg font-mono font-bold text-[#ff2e93] bg-black/40 px-5 py-1.5 rounded-full border border-[#ff2e93]/30">
                {timerStr}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call Controls Bar */}
      <div className="z-10 w-full max-w-lg bg-[#1f2c34]/90 backdrop-blur-xl rounded-3xl p-4 border border-white/10 shadow-2xl">
        {activeCall.status === 'incoming' ? (
          /* Incoming Call Actions: Accept vs Decline */
          <div className="flex items-center justify-around">
            <button
              onClick={rejectCall}
              className="flex flex-col items-center gap-1.5 text-rose-400 group"
            >
              <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <PhoneOff className="w-8 h-8" />
              </div>
              <span className="text-xs font-semibold">Decline</span>
            </button>

            <button
              onClick={() => {
                if (activeCall.isGroupCall && contact?.id) {
                  joinGroupCall(contact.id, activeCall.type);
                } else {
                  acceptCall();
                }
              }}
              className="flex flex-col items-center gap-1.5 text-[#ff2e93] group"
            >
              <div className="w-16 h-16 rounded-full bg-[#ff2e93] text-[#0b141a] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform animate-bounce">
                <PhoneCall className="w-8 h-8" />
              </div>
              <span className="text-xs font-semibold">Answer</span>
            </button>
          </div>
        ) : (
          /* Active / Outgoing Ringing Call Controls */
          <div className="flex items-center justify-around">
            {/* Mic Mute */}
            <button
              onClick={toggleMuteCall}
              className={`p-3.5 rounded-2xl transition-all active:scale-95 ${
                activeCall.isMuted ? 'bg-rose-500 text-white' : 'bg-[#2a3942] text-white hover:bg-[#344550]'
              }`}
              title={activeCall.isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {activeCall.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideoCall}
              className={`p-3.5 rounded-2xl transition-all active:scale-95 ${
                activeCall.isVideoOff ? 'bg-rose-500 text-white' : 'bg-[#2a3942] text-white hover:bg-[#344550]'
              }`}
              title={activeCall.isVideoOff ? "Turn Video On" : "Turn Video Off"}
            >
              {activeCall.isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>

            {/* End / Cancel Call */}
            <button
              onClick={activeCall.status === 'ringing' ? cancelCall : endCall}
              className="p-4 rounded-2xl bg-rose-600 text-white shadow-xl hover:bg-rose-700 active:scale-95 transition-all"
              title="End Call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            {/* Speaker Toggle */}
            <button
              onClick={toggleSpeakerCall}
              className={`p-3.5 rounded-2xl transition-all active:scale-95 ${
                activeCall.isSpeakerOn ? 'bg-[#ff2e93] text-[#0b141a]' : 'bg-[#2a3942] text-white hover:bg-[#344550]'
              }`}
              title="Speaker Mode"
            >
              <Volume2 className="w-6 h-6" />
            </button>

            {/* Switch Camera */}
            {activeCall.type === 'video' && (
              <button
                onClick={switchCameraCall}
                className="p-3.5 rounded-2xl bg-[#2a3942] text-white hover:bg-[#344550] active:scale-95 transition-all"
                title="Switch Camera"
              >
                <SwitchCamera className="w-6 h-6" />
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
