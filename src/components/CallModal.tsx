import React, { useEffect, useRef, useState } from 'react';
import { 
  Phone, Video, Mic, MicOff, VideoOff, PhoneOff, PhoneCall, 
  SwitchCamera, Volume2, ShieldCheck, Wifi, Maximize2, Minimize2,
  AlertCircle, Lock, RefreshCw, X
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { getContactNotificationSettings } from '../lib/contactSettings';

export const CallModal: React.FC = () => {
  const { 
    activeCall, contacts, acceptCall, rejectCall, cancelCall, endCall,
    toggleMuteCall, toggleVideoCall, toggleSpeakerCall, switchCameraCall,
    getContactDisplayName, callPermissionError, clearCallPermissionError
  } = useVault();

  const containerRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const contact = contacts.find(c => c.id === activeCall?.contactId);

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
  }, [activeCall?.remoteStream]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && activeCall?.localStream) {
      localVideoRef.current.srcObject = activeCall.localStream;
    }
  }, [activeCall?.localStream]);

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
              <div className="flex items-center gap-2 font-semibold text-sky-400 mb-1">
                <Lock className="w-4 h-4" />
                <span>How to grant permission:</span>
              </div>
              <p>1. Click the site settings or lock icon next to the address bar in your browser.</p>
              <p>2. Set <strong>Microphone</strong> and <strong>Camera</strong> permissions to <strong>Allow</strong>.</p>
              <p>3. Refresh or try calling again.</p>
            </div>

            <button
              onClick={clearCallPermissionError}
              className="w-full py-3 bg-[#00a8ff] text-[#0b141a] font-bold rounded-2xl hover:bg-[#0091ea] transition-all"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeCall || !contact) return null;

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
          <ShieldCheck className="w-5 h-5 text-[#00a8ff]" />
          <span className="text-xs font-semibold text-sky-400 tracking-wider uppercase">End-to-End Encrypted</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
            <Wifi className={`w-3.5 h-3.5 ${activeCall.connectionQuality === 'poor' ? 'text-rose-400' : 'text-[#00a8ff]'}`} />
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
          <div className="w-full h-[400px] sm:h-[500px] rounded-3xl overflow-hidden relative shadow-2xl border border-white/10 bg-slate-900 group">
            
            {/* Remote Video Stream */}
            {activeCall.remoteStream ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300">
                <img 
                  src={contact.avatar} 
                  alt={contact.name} 
                  className="w-24 h-24 rounded-full object-cover border-2 border-sky-500 mb-3 animate-pulse" 
                />
                <span className="text-sm font-medium">Connecting video feed...</span>
              </div>
            )}

            {/* PIP Local Self Video Overlay */}
            <div className="absolute bottom-4 right-4 w-28 h-36 sm:w-32 sm:h-44 rounded-2xl overflow-hidden border-2 border-[#00a8ff] shadow-2xl bg-black">
              {!activeCall.isVideoOff && activeCall.localStream ? (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs">
                  <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                  <span>Cam Off</span>
                </div>
              )}
            </div>

            {/* Remote Contact Name Badge */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-2 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>{getContactDisplayName(contact)}</span>
            </div>
          </div>
        ) : (
          /* Voice Call / Ringing Screen */
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              {/* Ringing Waves Animation */}
              {(activeCall.status === 'ringing' || activeCall.status === 'incoming' || activeCall.status === 'connecting') && (
                <>
                  <div className="absolute -inset-4 rounded-full bg-[#00a8ff]/20 animate-ping" />
                  <div className="absolute -inset-8 rounded-full bg-[#00a8ff]/10 animate-pulse" />
                </>
              )}

              <img 
                src={contact.avatar} 
                alt={getContactDisplayName(contact)} 
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-[#00a8ff] shadow-2xl relative z-10" 
              />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">{getContactDisplayName(contact)}</h2>
            
            <p className="text-sm font-semibold text-[#00a8ff] tracking-wide mb-3">
              {activeCall.status === 'ringing' && 'Calling...'}
              {activeCall.status === 'incoming' && `Incoming ${activeCall.type === 'video' ? 'Video' : 'Voice'} Call`}
              {activeCall.status === 'connecting' && 'Connecting WebRTC call...'}
              {activeCall.status === 'connected' && `${activeCall.type === 'video' ? 'Video' : 'Voice'} Call`}
            </p>

            {activeCall.status === 'connected' && (
              <div className="text-lg font-mono font-bold text-sky-400 bg-black/40 px-5 py-1.5 rounded-full border border-sky-500/30">
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
              onClick={acceptCall}
              className="flex flex-col items-center gap-1.5 text-sky-400 group"
            >
              <div className="w-16 h-16 rounded-full bg-[#00a8ff] text-[#0b141a] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform animate-bounce">
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
                activeCall.isSpeakerOn ? 'bg-[#00a8ff] text-[#0b141a]' : 'bg-[#2a3942] text-white hover:bg-[#344550]'
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
