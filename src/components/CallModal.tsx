import React, { useEffect, useRef, useState } from 'react';
import { 
  Phone, Video, Mic, MicOff, VideoOff, PhoneOff, PhoneCall, 
  SwitchCamera, Volume2, ShieldCheck, Wifi, Maximize2, Minimize2,
  AlertCircle, Lock, RefreshCw, X, Sparkles, ArrowLeftRight, Check, Sliders, MoreVertical, LayoutGrid
} from 'lucide-react';
import { useVault, GroupCallParticipant } from '../context/VaultContext';
import { getContactNotificationSettings } from '../lib/contactSettings';

const VIDEO_FILTERS = [
  { id: 'none', label: 'Normal', css: 'none' },
  { id: 'bw', label: 'B&W', css: 'grayscale(100%)' },
  { id: 'sepia', label: 'Vintage', css: 'sepia(85%) contrast(110%)' },
  { id: 'warm', label: 'Warm', css: 'saturate(160%) contrast(105%)' },
  { id: 'cool', label: 'Cyber', css: 'hue-rotate(180deg) brightness(110%)' },
  { id: 'vivid', label: 'Vivid', css: 'contrast(125%) saturate(145%)' },
];

const ParticipantVideoTile: React.FC<{
  participant: {
    uid: string;
    name: string;
    avatar?: string;
  };
  stream: MediaStream | null;
  isSelf: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  filterCss: string;
  isMainFocus?: boolean;
  onClick?: () => void;
}> = ({ participant, stream, isSelf, isMuted, isVideoOff, filterCss, isMainFocus, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [hasActiveVideoTrack, setHasActiveVideoTrack] = useState<boolean>(() => {
    if (!stream) return false;
    const tracks = stream.getVideoTracks();
    return tracks.length > 0 && tracks.some(t => t.enabled && t.readyState === 'live');
  });

  useEffect(() => {
    if (!stream) {
      setHasActiveVideoTrack(false);
      return;
    }

    const checkTrackState = () => {
      const tracks = stream.getVideoTracks();
      const active = tracks.length > 0 && tracks.some(t => t.enabled && t.readyState === 'live');
      setHasActiveVideoTrack(active);
    };

    checkTrackState();

    const handleTrackEvent = () => checkTrackState();

    stream.addEventListener('addtrack', handleTrackEvent);
    stream.addEventListener('removetrack', handleTrackEvent);

    const allTracks = stream.getTracks();
    allTracks.forEach(t => {
      t.addEventListener('mute', handleTrackEvent);
      t.addEventListener('unmute', handleTrackEvent);
      t.addEventListener('ended', handleTrackEvent);
    });

    return () => {
      stream.removeEventListener('addtrack', handleTrackEvent);
      stream.removeEventListener('removetrack', handleTrackEvent);
      allTracks.forEach(t => {
        t.removeEventListener('mute', handleTrackEvent);
        t.removeEventListener('unmute', handleTrackEvent);
        t.removeEventListener('ended', handleTrackEvent);
      });
    };
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (audioRef.current && !isSelf && stream) {
      if (audioRef.current.srcObject !== stream) {
        audioRef.current.srcObject = stream;
      }
      audioRef.current.play().catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  }, [stream, isSelf, isVideoOff, hasActiveVideoTrack]);

  const shouldShowVideo = !isVideoOff && stream && hasActiveVideoTrack;

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden bg-slate-900 rounded-2xl border transition-all duration-200 group/tile ${
        isMainFocus 
          ? 'w-full h-full border-[#ff2e93] shadow-2xl flex items-center justify-center' 
          : 'w-full h-full min-h-[160px] sm:min-h-[220px] border-slate-700/60 hover:border-[#ff2e93] hover:shadow-[0_0_20px_rgba(255,46,147,0.3)] cursor-pointer active:scale-[0.98]'
      }`}
    >
      {/* Dedicated audio element for remote participants to guarantee 100% audio playback */}
      {!isSelf && <audio ref={audioRef} autoPlay playsInline />}

      <video 
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf}
        style={{ filter: filterCss }}
        className={`w-full h-full object-cover ${!shouldShowVideo ? 'hidden' : 'block'}`}
      />

      {!shouldShowVideo && (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-slate-950 text-center select-none">
          <img 
            src={participant.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
            alt={participant.name}
            className={`${isMainFocus ? 'w-28 h-28 sm:w-36 sm:h-36' : 'w-16 h-16 sm:w-20 sm:h-20'} rounded-full object-cover border-4 border-slate-700/60 shadow-xl`}
          />
          <span className="mt-2.5 text-xs font-semibold text-slate-300">
            {isVideoOff ? 'Camera Off' : 'Connecting feed...'}
          </span>
        </div>
      )}

      {/* Participant Name Badge & Mic Mute Indicator */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 border border-white/10 max-w-[80%] truncate shadow-md">
          <span className="truncate">{isSelf ? `You (${participant.name})` : participant.name}</span>
        </div>

        {isMuted && (
          <div className="p-1.5 rounded-full bg-rose-500/90 text-white backdrop-blur-md border border-white/20 shadow-md" title="Muted">
            <MicOff className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
};

const GroupAudioPlayerTile: React.FC<{ stream: MediaStream | null }> = ({ stream }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current || !stream) {
      if (audioRef.current) audioRef.current.srcObject = null;
      return;
    }

    if (audioRef.current.srcObject !== stream) {
      audioRef.current.srcObject = stream;
    }

    const attemptPlay = () => {
      if (audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.warn('[CALL] Audio autoplay blocked by browser policy:', err);
          const unlock = () => {
            if (audioRef.current) audioRef.current.play().catch(() => {});
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
          };
          window.addEventListener('click', unlock, { once: true });
          window.addEventListener('touchstart', unlock, { once: true });
        });
      }
    };

    attemptPlay();

    const handleTrackAdded = () => attemptPlay();
    stream.addEventListener('addtrack', handleTrackAdded);
    return () => {
      stream.removeEventListener('addtrack', handleTrackAdded);
    };
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
};

export const CallModal: React.FC = () => {
  const { 
    user, authUser, activeCall, contacts, groupContacts, acceptCall, joinGroupCall, rejectCall, cancelCall, endCall,
    toggleMuteCall, toggleVideoCall, toggleSpeakerCall, switchCameraCall,
    getContactDisplayName, callPermissionError, clearCallPermissionError,
    isCallMinimized, minimizeCall, setCallFilter
  } = useVault();

  const containerRef = useRef<HTMLDivElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusedUid, setFocusedUid] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [activeCall?.remoteStream, activeCall?.status]);

  if (!activeCall && !callPermissionError) return null;

  // When call is minimized, keep audio track playing in background
  if (isCallMinimized && activeCall) {
    return (
      <div className="hidden pointer-events-none">
        <audio ref={remoteAudioRef} autoPlay playsInline />
        {activeCall.isGroupCall && activeCall.peerStreams && (
          Object.entries(activeCall.peerStreams).map(([peerUid, pStream]) => (
            <GroupAudioPlayerTile key={peerUid} stream={pStream} />
          ))
        )}
      </div>
    );
  }

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

  // Find contact object from ID (Could be 1-on-1 contact or Group)
  let contactObj: any = contacts.find((c) => c.id === activeCall?.contactId) || 
                      groupContacts.find((g) => g.id === activeCall?.contactId);

  if (!contactObj) {
    contactObj = {
      id: activeCall?.contactId || 'unknown',
      name: activeCall?.isGroupCall ? 'Group Call' : 'Unknown User',
      avatar: activeCall?.isGroupCall 
        ? 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80' 
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
  }

  const contact = contactObj;
  const contactAvatar = contact.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  const userAvatar = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  const activeFilterCss = VIDEO_FILTERS.find(f => f.id === selectedFilter)?.css || 'none';
  const remoteFilterCss = activeCall?.remoteFilter ? VIDEO_FILTERS.find(f => f.id === activeCall.remoteFilter)?.css || 'none' : 'none';

  const mins = Math.floor((activeCall?.durationSeconds || 0) / 60);
  const secs = (activeCall?.durationSeconds || 0) % 60;
  const timerStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  // Gather active participants list
  const rawParticipants = activeCall?.participants || [];
  const participantsList = rawParticipants.length > 0 
    ? rawParticipants 
    : [
        {
          uid: authUser?.uid || user.id,
          name: user.name || (authUser as any)?.displayName || 'You',
          avatar: userAvatar,
          isMuted: activeCall?.isMuted,
          isVideoOff: activeCall?.isVideoOff,
        },
        {
          uid: contact.id,
          name: getContactDisplayName(contact),
          avatar: contactAvatar,
          isMuted: false,
          isVideoOff: activeCall?.isRemoteVideoOff,
        }
      ];

  // Helper to extract properties for each participant
  const getParticipantProps = (p: GroupCallParticipant | any) => {
    const isSelf = p.uid === (authUser?.uid || user.id);
    let stream: MediaStream | null = null;

    if (isSelf) {
      stream = activeCall?.localStream || null;
    } else {
      stream = activeCall?.peerStreams?.[p.uid] || (participantsList.length <= 2 ? (activeCall?.remoteStream || null) : null);
    }

    const isMuted = isSelf ? !!activeCall?.isMuted : !!p.isMuted;
    const isVideoOff = isSelf ? !!activeCall?.isVideoOff : (!!p.isVideoOff || (participantsList.length <= 2 && !!activeCall?.isRemoteVideoOff));
    const filterCss = isSelf ? activeFilterCss : (p.filter ? VIDEO_FILTERS.find(f => f.id === p.filter)?.css || 'none' : remoteFilterCss);

    return { isSelf, stream, isMuted, isVideoOff, filterCss };
  };

  const focusedParticipant = focusedUid ? participantsList.find(p => p.uid === focusedUid) : null;

  // Grid column styling based on participant count
  let gridClass = 'grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 w-full h-full max-w-5xl mx-auto items-center justify-center';
  if (participantsList.length === 1) {
    gridClass = 'flex items-center justify-center p-4 w-full h-full max-w-2xl mx-auto';
  } else if (participantsList.length === 3) {
    gridClass = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3 w-full h-full max-w-6xl mx-auto items-center justify-center';
  } else if (participantsList.length === 4) {
    gridClass = 'grid grid-cols-2 gap-3 p-3 w-full h-full max-w-5xl mx-auto items-center justify-center';
  } else if (participantsList.length >= 5) {
    gridClass = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3 w-full h-full overflow-y-auto';
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#0b141a] text-white flex flex-col items-center justify-between p-4 sm:p-6 select-none font-sans overflow-hidden animate-fade-in"
    >
      {/* Hidden Remote Audio Element for playing remote audio track in 1-on-1 calls */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Dedicated Audio Players for All Group Call Participants (Voice & Video Calls) */}
      {activeCall?.isGroupCall && activeCall?.peerStreams && (
        Object.entries(activeCall.peerStreams).map(([peerUid, pStream]) => (
          <GroupAudioPlayerTile key={peerUid} stream={pStream} />
        ))
      )}

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

      {/* Main Profile / Video Container */}
      <div className="z-10 absolute inset-0 w-full h-full flex flex-col pointer-events-none">
        
        {/* Video Call Active Screen */}
        {activeCall.type === 'video' && (activeCall.status === 'connected' || activeCall.status === 'connecting') ? (
          <div className="w-full h-full overflow-hidden relative bg-slate-900 group flex flex-col items-center justify-center pointer-events-auto p-2 sm:p-4 pb-28">
            
            {/* Top Bar Action Controls */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-2 border border-white/10 pointer-events-auto shadow-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff2e93] animate-pulse" />
                <span>{getContactDisplayName(contact)} ({participantsList.length} participant{participantsList.length > 1 ? 's' : ''})</span>
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Return to Grid View Button when in Focus Mode */}
                {focusedParticipant && (
                  <button
                    onClick={() => setFocusedUid(null)}
                    className="p-2 rounded-full bg-[#ff2e93] text-[#0b141a] hover:bg-[#ff1e85] font-bold backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 px-3 text-xs shadow-lg"
                    title="Return to Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>Grid View</span>
                  </button>
                )}

                {/* Minimize Call Button */}
                <button
                  onClick={minimizeCall}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-all active:scale-95 flex items-center gap-1.5 px-3 text-xs font-medium shadow-md"
                  title="Minimize Call view"
                >
                  <Minimize2 className="w-4 h-4 text-[#ff2e93]" />
                  <span className="hidden sm:inline">Minimize</span>
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

            {/* Video Filters Selector Dropdown */}
            {showFilterPicker && (
              <div className="absolute top-16 right-4 w-72 bg-[#1f2c34]/95 backdrop-blur-2xl p-3 rounded-2xl border border-[#ff2e93]/40 z-40 animate-slide-down shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between mb-2 px-1 pb-1.5 border-b border-white/10">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Sparkles className="w-4 h-4 text-[#ff2e93]" />
                    <span>Camera Effects & Filters</span>
                  </div>
                  <button 
                    onClick={() => setShowFilterPicker(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                    title="Close filters"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {VIDEO_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setSelectedFilter(f.id);
                        setCallFilter(f.id);
                      }}
                      className={`flex items-center justify-center p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                        selectedFilter === f.id
                          ? 'bg-[#ff2e93] text-[#0b141a] font-bold shadow-md scale-105 border border-[#ff2e93]'
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                      }`}
                    >
                      <span className="truncate">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MAIN VIDEO DISPLAY AREA */}
            {focusedParticipant ? (
              /* FOCUS MODE: Large Main Video + Thumbnail Bar */
              <div className="w-full h-full flex flex-col items-center justify-center relative pt-12">
                {/* Large Main Video */}
                <div className="w-full flex-1 relative overflow-hidden rounded-3xl mb-3">
                  <ParticipantVideoTile 
                    participant={focusedParticipant}
                    {...getParticipantProps(focusedParticipant)}
                    isMainFocus={true}
                  />
                </div>

                {/* Thumbnails Row for Switching Focus */}
                <div className="w-full max-w-3xl flex gap-2 overflow-x-auto p-2 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 shrink-0 z-20">
                  {participantsList.filter(p => p.uid !== focusedParticipant.uid).map(otherP => {
                    const props = getParticipantProps(otherP);
                    return (
                      <div key={otherP.uid} className="w-24 h-28 sm:w-32 sm:h-36 shrink-0">
                        <ParticipantVideoTile
                          participant={otherP}
                          {...props}
                          onClick={() => setFocusedUid(otherP.uid)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* GRID MODE: Responsive Video Grid */
              <div className="w-full h-full pt-12 flex items-center justify-center">
                <div className={gridClass}>
                  {participantsList.map(p => {
                    const props = getParticipantProps(p);
                    return (
                      <ParticipantVideoTile
                        key={p.uid}
                        participant={p}
                        {...props}
                        onClick={() => setFocusedUid(p.uid)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Voice Call / Ringing Screen */
          <div className="flex flex-col items-center text-center my-auto">
            <div className="relative mb-6">
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
      <div className="z-50 w-full max-w-lg bg-[#1f2c34]/90 backdrop-blur-xl rounded-3xl p-4 border border-white/10 shadow-2xl mt-auto">
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
          <div className="flex items-center justify-around relative">
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

            {/* More Controls (3 Dot) Menu Toggle */}
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`p-3.5 rounded-2xl transition-all active:scale-95 ${
                showMoreMenu ? 'bg-[#ff2e93] text-[#0b141a]' : 'bg-[#2a3942] text-white hover:bg-[#344550]'
              }`}
              title="More options"
            >
              <MoreVertical className="w-6 h-6" />
            </button>

            {/* More Options Popup */}
            {showMoreMenu && (
              <div className="absolute bottom-20 right-0 bg-black/90 backdrop-blur-xl p-3 rounded-2xl border border-white/15 z-30 animate-slide-up shadow-2xl flex flex-col gap-2 min-w-[150px]">
                {/* Speaker Toggle */}
                <button
                  onClick={toggleSpeakerCall}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all active:scale-95 text-xs font-semibold ${
                    activeCall.isSpeakerOn ? 'bg-[#ff2e93] text-[#0b141a]' : 'bg-[#2a3942] text-white hover:bg-[#344550]'
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                  {activeCall.isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
                </button>

                {/* Switch Camera */}
                {activeCall.type === 'video' && (
                  <button
                    onClick={switchCameraCall}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#2a3942] text-white hover:bg-[#344550] active:scale-95 transition-all text-xs font-semibold"
                  >
                    <SwitchCamera className="w-5 h-5" />
                    Switch Camera
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
