import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Plus, Smile, Image, Video, FileText, Trash2, ArrowLeft, ShieldCheck, 
  Lock, CheckCheck, Check, Paperclip, Camera, Phone, Mic, MoreVertical, X,
  Search, CheckSquare, Heart, Ban, MinusCircle, Copy, Pin, Archive, Star,
  CornerUpLeft, Play, Pause, Volume2, Edit3, Forward, Share2, Info, ChevronRight, File, PhoneCall
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useSettings } from '../context/SettingsContext';
import { MediaAttachment, Message, Contact } from '../types';

export const ChatWindow: React.FC = () => {
  const { 
    activeContactId, setActiveContactId, setActiveTab, contacts, messages, 
    sendMessage, editMessage, user, deleteMessage, deleteForEveryone, toggleStarMessage,
    togglePinMessage, forwardMessage, setTypingStatus, settings, togglePinContact,
    toggleArchiveContact, clearChatHistory, blockContact, startCall 
  } = useVault();
  const { settings: globalSettings } = useSettings();

  const isDark = globalSettings.darkMode && settings.theme !== 'material-light' && settings.theme !== 'light';
  
  // Input & Modal States
  const [inputText, setInputText] = useState('');
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);
  const [showFullAvatar, setShowFullAvatar] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // Message Action States
  const [replyingToMsg, setReplyingToMsg] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<Message | null>(null);
  const [forwardContactIds, setForwardContactIds] = useState<string[]>([]);
  const [msgContextMenuId, setMsgContextMenuId] = useState<string | null>(null);

  // Audio Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioPlaybackSpeeds, setAudioPlaybackSpeeds] = useState<Record<string, number>>({});
  const [playingAudioMsgId, setPlayingAudioMsgId] = useState<string | null>(null);

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contact = contacts.find(c => c.id === activeContactId);
  const curMessages = (activeContactId && messages[activeContactId]) || [];
  const pinnedMessage = curMessages.find(m => m.isPinned);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [curMessages.length, activeContactId]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording && !isRecordingPaused) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording, isRecordingPaused]);

  if (!contact || !activeContactId) {
    return (
      <div className="flex-1 bg-[#0b141a] flex flex-col items-center justify-center p-6 text-slate-500 text-xs select-none">
        <ShieldCheck className="w-12 h-12 text-[#25d366]/60 mb-2 animate-pulse" />
        <p className="font-mono text-slate-400">SELECT A CONVERSATION TO CHAT</p>
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (editingMsg) {
      editMessage(activeContactId, editingMsg.id, inputText.trim());
      setEditingMsg(null);
      showToast('Message edited');
    } else {
      const replyContext = replyingToMsg ? {
        id: replyingToMsg.id,
        senderName: replyingToMsg.senderId === user.id ? 'You' : contact.name,
        text: replyingToMsg.text,
      } : undefined;

      sendMessage(activeContactId, inputText.trim(), undefined, replyContext);
      setReplyingToMsg(null);
    }

    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsRecordingPaused(false);
    setRecordingSeconds(0);
  };

  const handlePauseRecording = () => {
    setIsRecordingPaused(prev => !prev);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecordingSeconds(0);
  };

  const handleSendRecording = () => {
    const mins = Math.floor(recordingSeconds / 60);
    const secs = recordingSeconds % 60;
    const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    const media: MediaAttachment = {
      id: 'voice_' + Date.now(),
      type: 'audio',
      name: `Voice note (${durationStr})`,
      url: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
      duration: durationStr,
    };

    sendMessage(activeContactId, '🎤 Voice message', media);
    handleCancelRecording();
    showToast('Voice message sent');
  };

  const toggleAudioSpeed = (msgId: string) => {
    setAudioPlaybackSpeeds(prev => {
      const current = prev[msgId] || 1;
      const next = current === 1 ? 1.5 : current === 1.5 ? 2 : 1;
      return { ...prev, [msgId]: next };
    });
  };

  const handleAttachMedia = (type: 'image' | 'video' | 'file') => {
    const sampleImages = [
      { name: 'Blueprint_TopSecret.png', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80' },
      { name: 'Confidential_Matrix_Code.jpg', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80' },
      { name: 'Surveillance_Camera_Grid.png', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80' }
    ];

    const sampleVideos = [
      { name: 'Drone_Surveillance_Feed.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-at-night-42861-large.mp4' },
      { name: 'Server_Room_Activity.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-data-center-server-room-41977-large.mp4' }
    ];

    let media: MediaAttachment;

    if (type === 'image') {
      const picked = sampleImages[Math.floor(Math.random() * sampleImages.length)];
      media = {
        id: 'att_' + Date.now(),
        type: 'image',
        name: picked.name,
        url: picked.url,
      };
      sendMessage(activeContactId, 'Attached confidential image', media);
    } else if (type === 'video') {
      const picked = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];
      media = {
        id: 'att_' + Date.now(),
        type: 'video',
        name: picked.name,
        url: picked.url,
      };
      sendMessage(activeContactId, 'Attached drone surveillance feed', media);
    } else {
      media = {
        id: 'att_' + Date.now(),
        type: 'file',
        name: `Document_Archive_${Math.floor(Math.random() * 900 + 100)}.pdf`,
        url: '#',
        size: '2.4 MB',
      };
      sendMessage(activeContactId, 'Uploaded PDF document', media);
    }

    setShowAttachModal(false);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const isAud = file.type.startsWith('audio/');
      const type = isImg ? 'image' : isVid ? 'video' : isAud ? 'audio' : 'file';

      const media: MediaAttachment = {
        id: 'upload_' + Date.now(),
        type,
        name: file.name,
        url: reader.result as string,
        size: (file.size / 1024).toFixed(1) + ' KB',
      };

      sendMessage(activeContactId, `Shared local attachment: ${file.name}`, media);
      setShowAttachModal(false);
    };
    reader.readAsDataURL(file);
  };

  const insertEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  return (
    <div className="flex-1 flex w-full h-full overflow-hidden relative font-sans select-none">
      
      {/* Main Conversation Pane */}
      <div className={`flex-1 flex flex-col overflow-hidden relative h-full min-h-0 transition-colors ${
        isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
      }`}>
        
        {/* Top Chat Header */}
        <div className={`px-3 py-2.5 flex items-center justify-between shrink-0 z-20 border-b transition-colors ${
          isDark ? 'bg-[#0b141a] border-[#1f2c34]/60 text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <button
              id="vault_nav_back_trigger"
              onClick={(e) => {
                e.stopPropagation();
                setActiveContactId(null);
              }}
              className={`p-1 rounded-full transition-colors mr-0.5 ${
                isDark ? 'hover:bg-[#202c33] text-[#e9edef]' : 'hover:bg-gray-100 text-gray-700'
              }`}
              title="Back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowFullAvatar(true);
              }} 
              className="relative shrink-0 cursor-pointer group"
              title="Click to view full photo"
            >
              <img
                src={contact.avatar}
                alt={contact.name}
                className={`w-10 h-10 rounded-full object-cover transition-transform group-hover:scale-105 ${isDark ? 'bg-[#202c33]' : 'bg-gray-200'}`}
              />
              {contact.isOnline && (
                <span className={`absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] rounded-full border-2 ${
                  isDark ? 'border-[#0b141a]' : 'border-white'
                }`}></span>
              )}
            </div>

            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowRightSidebar(true);
              }} 
              className="min-w-0 ml-1 cursor-pointer"
            >
              <h2 className={`font-semibold text-base flex items-center gap-1.5 truncate ${
                isDark ? 'text-[#e9edef]' : 'text-gray-900'
              }`}>
                {contact.name}
                {contact.isLocked && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </h2>
              <p className={`text-xs truncate ${
                contact.isTyping ? 'text-[#25d366] font-semibold animate-pulse' : (isDark ? 'text-[#8596a0]' : 'text-gray-500')
              }`}>
                {contact.isTyping ? 'typing...' : (contact.isOnline ? 'Online' : contact.lastSeen || 'last seen recently')}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-2.5 relative ${isDark ? 'text-[#e9edef]' : 'text-gray-700'}`}>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startCall(contact.id, 'video');
              }} 
              className="hover:opacity-80 p-1.5 rounded-full transition-colors text-[#25d366]"
              title="Video call"
            >
              <Video className="w-5 h-5" />
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startCall(contact.id, 'voice');
              }} 
              className="hover:opacity-80 p-1.5 rounded-full transition-colors text-[#25d366]"
              title="Voice call"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowRightSidebar(true);
              }}
              className="hover:opacity-80 p-1.5 rounded-full transition-colors hidden lg:block"
              title="Contact details"
            >
              <Info className="w-5 h-5" />
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowHeaderMenu(!showHeaderMenu);
              }} 
              className="hover:opacity-80 p-1.5 rounded-full transition-colors"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* 3-Dots Dropdown Menu */}
            {showHeaderMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowHeaderMenu(false)} 
                />
                <div className={`absolute right-0 top-10 z-50 rounded-2xl shadow-2xl py-2 w-56 text-sm font-sans select-none animate-scale-in border transition-all ${
                  isDark 
                    ? 'bg-[#233138] border-[#2a3942] text-[#e9edef]' 
                    : 'bg-white border-gray-200 text-gray-800 shadow-xl'
                }`}>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setShowInChatSearch(true);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Search className="w-4.5 h-4.5 opacity-80" />
                    <span>Search messages</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setShowRightSidebar(true);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Info className="w-4.5 h-4.5 opacity-80" />
                    <span>Contact Info</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setIsSelectMode(true);
                      setSelectedMsgIds([]);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                    }`}
                  >
                    <CheckSquare className="w-4.5 h-4.5 opacity-80" />
                    <span>Select messages</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      togglePinContact(contact.id);
                      showToast(contact.isPinned ? "Unpinned chat" : "Pinned chat");
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Pin className="w-4.5 h-4.5 opacity-80" />
                    <span>{contact.isPinned ? "Unpin chat" : "Pin chat"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      toggleArchiveContact(contact.id);
                      showToast(contact.isArchived ? "Unarchived chat" : "Archived chat");
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Archive className="w-4.5 h-4.5 opacity-80 text-[#25d366]" />
                    <span>{contact.isArchived ? "Unarchive chat" : "Archive chat"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      clearChatHistory(contact.id);
                      showToast("Cleared chat history");
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                    }`}
                  >
                    <MinusCircle className="w-4.5 h-4.5 opacity-80" />
                    <span>Clear messages</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      blockContact(contact.id);
                      showToast(`${contact.name} blocked`);
                      setActiveContactId(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors text-amber-500 ${
                      isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Ban className="w-4.5 h-4.5 opacity-80" />
                    <span>Block contact</span>
                  </button>

                </div>
              </>
            )}
          </div>
        </div>

        {/* Pinned Message Banner */}
        {pinnedMessage && (
          <div className={`px-4 py-2 flex items-center justify-between text-xs border-b shrink-0 animate-fade-in ${
            isDark ? 'bg-[#182229] border-[#202c33] text-[#e9edef]' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-2 truncate">
              <Pin className="w-3.5 h-3.5 text-[#25d366] shrink-0" />
              <span className="font-semibold text-[11px] text-[#25d366]">Pinned Message:</span>
              <span className="truncate text-xs opacity-90">{pinnedMessage.text}</span>
            </div>
            <button
              onClick={() => togglePinMessage(contact.id, pinnedMessage.id)}
              className="p-1 hover:bg-black/10 rounded text-gray-400"
              title="Unpin"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search in Chat Overlay */}
        {showInChatSearch && (
          <div className={`px-4 py-2 flex items-center gap-2 border-b animate-fade-in ${
            isDark ? 'bg-[#111b21] border-[#1f2c34]' : 'bg-gray-100 border-gray-200'
          }`}>
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={inChatSearchQuery}
              onChange={(e) => setInChatSearchQuery(e.target.value)}
              placeholder="Search messages in chat..."
              className={`w-full bg-transparent border-none outline-none text-sm ${
                isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
              }`}
              autoFocus
            />
            <button 
              type="button"
              onClick={() => {
                setShowInChatSearch(false);
                setInChatSearchQuery('');
              }}
              className="p-1 rounded-full hover:bg-gray-500/20 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Select Messages Top Bar */}
        {isSelectMode && (
          <div className={`px-4 py-2.5 flex items-center justify-between border-b animate-fade-in ${
            isDark ? 'bg-[#1f2c34] text-white border-[#2a3942]' : 'bg-[#128c7e] text-white border-[#0e7065]'
          }`}>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <button 
                type="button"
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedMsgIds([]);
                }}
                className="p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              <span>{selectedMsgIds.length} selected</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (selectedMsgIds.length === 0) return;
                  const selMsgs = curMessages.filter(m => selectedMsgIds.includes(m.id)).map(m => m.text).join('\n');
                  navigator.clipboard.writeText(selMsgs);
                  showToast(`Copied ${selectedMsgIds.length} messages`);
                  setIsSelectMode(false);
                  setSelectedMsgIds([]);
                }}
                className="p-1.5 hover:bg-white/10 rounded-full"
                title="Copy selected"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  selectedMsgIds.forEach(id => deleteMessage(contact.id, id));
                  showToast(`Deleted ${selectedMsgIds.length} messages`);
                  setIsSelectMode(false);
                  setSelectedMsgIds([]);
                }}
                className="p-1.5 hover:bg-white/10 rounded-full text-rose-300"
                title="Delete selected"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Messages View Area */}
        <div 
          className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 no-scrollbar min-h-0 transition-all ${
            isDark ? 'bg-[#0b141a]' : 'bg-[#efeae2]'
          }`}
        >
          {curMessages.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center text-center text-xs px-6 ${
              isDark ? 'text-[#8596a0]' : 'text-gray-500'
            }`}>
              <div className={`p-3.5 rounded-2xl mb-3 border ${
                isDark ? 'bg-[#182229] border-[#202c33]' : 'bg-white border-gray-200'
              }`}>
                <Lock className="w-6 h-6 text-[#25d366]" />
              </div>
              <p className={`font-semibold text-sm ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>End-to-End Encrypted</p>
              <p className={`max-w-xs mt-1 text-xs ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>Messages stay private and synchronized across all devices.</p>
            </div>
          ) : (
            (inChatSearchQuery.trim() 
              ? curMessages.filter(m => m.text.toLowerCase().includes(inChatSearchQuery.toLowerCase())) 
              : curMessages
            ).map(msg => {
              const isMe = msg.senderId === user.id;
              const isSelected = selectedMsgIds.includes(msg.id);
              const speed = audioPlaybackSpeeds[msg.id] || 1;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} relative`}
                >
                  <div
                    onClick={() => {
                      if (isSelectMode) {
                        if (isSelected) {
                          setSelectedMsgIds(selectedMsgIds.filter(id => id !== msg.id));
                        } else {
                          setSelectedMsgIds([...selectedMsgIds, msg.id]);
                        }
                      }
                    }}
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-sm relative shadow transition-all ${
                      isSelectMode ? 'cursor-pointer' : ''
                    } ${
                      isSelected ? 'ring-2 ring-[#25d366] scale-[1.01]' : ''
                    } ${
                      isMe
                        ? (isDark ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-xs' : 'bg-[#d9fdd3] text-gray-900 rounded-tr-xs')
                        : (isDark ? 'bg-[#202c33] text-[#e9edef] rounded-tl-xs' : 'bg-white text-gray-900 rounded-tl-xs border border-gray-100')
                    }`}
                  >
                    {/* Quoted Reply Context */}
                    {msg.replyTo && (
                      <div className={`p-2 rounded-lg border-l-4 mb-2 text-xs border-[#25d366] ${
                        isDark ? 'bg-black/20' : 'bg-black/5'
                      }`}>
                        <p className="font-semibold text-[#25d366]">{msg.replyTo.senderName}</p>
                        <p className="truncate opacity-80">{msg.replyTo.text}</p>
                      </div>
                    )}

                    {/* Attached Media Render */}
                    {msg.media && (
                      <div className="mb-2 mt-0.5 overflow-hidden rounded-xl bg-black/30 border border-white/5">
                        {msg.media.type === 'image' && (
                          <img
                            src={msg.media.url}
                            alt={msg.media.name}
                            onClick={() => setPreviewMedia(msg.media!.url)}
                            className="max-h-64 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          />
                        )}

                        {msg.media.type === 'video' && (
                          <video
                            src={msg.media.url}
                            controls
                            className="max-h-64 w-full bg-black rounded-lg"
                          />
                        )}

                        {msg.media.type === 'audio' && (
                          <div className="p-3 flex items-center gap-3">
                            <button
                              onClick={() => setPlayingAudioMsgId(playingAudioMsgId === msg.id ? null : msg.id)}
                              className="w-10 h-10 rounded-full bg-[#25d366] text-[#0b141a] flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
                            >
                              {playingAudioMsgId === msg.id ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-1">
                                <div className={`h-full bg-[#25d366] transition-all ${playingAudioMsgId === msg.id ? 'w-2/3 animate-pulse' : 'w-0'}`} />
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-[#8596a0]">
                                <span>{msg.media.duration || '0:15'}</span>
                                <span>Audio Voice Note</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleAudioSpeed(msg.id)}
                              className="px-2 py-1 rounded bg-black/30 text-[10px] font-bold hover:bg-black/50 transition-colors"
                            >
                              {speed}x
                            </button>
                          </div>
                        )}

                        {msg.media.type === 'file' && (
                          <div className="p-3 flex items-center gap-3">
                            <div className="p-2.5 bg-[#25d366]/20 text-[#25d366] rounded-xl shrink-0 font-mono text-xs font-bold">
                              <File className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold truncate text-sm text-[#e9edef]">{msg.media.name}</p>
                              <p className="text-xs text-[#8596a0] font-mono">{msg.media.size || '2.4 MB'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Call Card Render */}
                    {(msg.callInfo || msg.type === 'voice_call' || msg.type === 'video_call') && (
                      <div className="my-1.5 p-3 rounded-2xl bg-black/20 border border-white/10 flex flex-col gap-2.5 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-full shrink-0 ${
                            msg.callInfo?.status === 'missed' || msg.callInfo?.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {msg.type === 'video_call' || msg.callInfo?.type === 'video' ? (
                              <Video className="w-5 h-5" />
                            ) : (
                              <Phone className="w-5 h-5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm flex items-center gap-1.5 text-white truncate">
                              {msg.callInfo?.type === 'video' || msg.type === 'video_call' ? 'Video Call' : 'Voice Call'}
                              {msg.callInfo?.status === 'missed' && <span className="text-[10px] text-rose-400 font-bold px-1.5 py-0.2 rounded bg-rose-500/20">Missed</span>}
                              {msg.callInfo?.status === 'rejected' && <span className="text-[10px] text-rose-400 font-bold px-1.5 py-0.2 rounded bg-rose-500/20">Rejected</span>}
                            </h4>

                            <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                              <span>{msg.callInfo?.direction === 'outgoing' || isMe ? 'Outgoing' : 'Incoming'}</span>
                              {msg.callInfo?.duration && msg.callInfo.duration !== '00:00' && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">{msg.callInfo.duration}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startCall(contact.id, msg.callInfo?.type || (msg.type === 'video_call' ? 'video' : 'voice'));
                          }}
                          className="w-full py-1.5 px-3 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call Again</span>
                        </button>
                      </div>
                    )}

                    {/* Message Text */}
                    {!(msg.callInfo || msg.type === 'voice_call' || msg.type === 'video_call') && (
                      <p className={`leading-normal whitespace-pre-wrap break-words text-[15px] ${
                        msg.deletedForEveryone ? 'italic opacity-60 text-xs' : ''
                      }`}>{msg.text}</p>
                    )}

                    {/* Footer Timestamp & Status */}
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-[#8596a0]' : 'text-[#8596a0]'}`}>
                      {msg.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                      {msg.isEdited && <span className="italic text-[9px]">edited</span>}
                      <span>{msg.timestamp}</span>

                      {/* Delivery Status Indicator */}
                      {isMe && (
                        msg.isRead ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0" title="Seen" />
                        ) : msg.isDelivered ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#8696a0] shrink-0" title="Delivered" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-[#8696a0] shrink-0" title="Sent" />
                        )
                      )}
                    </div>

                    {/* Quick Hover Action Menu Trigger */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/40 rounded-lg p-0.5 backdrop-blur-sm">
                      <button
                        onClick={() => setReplyingToMsg(msg)}
                        className="p-1 hover:bg-white/20 rounded text-white"
                        title="Reply"
                      >
                        <CornerUpLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleStarMessage(contact.id, msg.id)}
                        className="p-1 hover:bg-white/20 rounded text-amber-300"
                        title="Star"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setForwardingMsg(msg);
                          setForwardContactIds([]);
                        }}
                        className="p-1 hover:bg-white/20 rounded text-white"
                        title="Forward"
                      >
                        <Forward className="w-3 h-3" />
                      </button>

                      {isMe && !msg.deletedForEveryone && (
                        <button
                          onClick={() => {
                            setEditingMsg(msg);
                            setInputText(msg.text);
                          }}
                          className="p-1 hover:bg-white/20 rounded text-emerald-300"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (isMe && confirm('Delete for everyone?')) {
                            deleteForEveryone(contact.id, msg.id);
                          } else {
                            deleteMessage(contact.id, msg.id);
                          }
                        }}
                        className="p-1 hover:bg-white/20 rounded text-rose-300"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Replying Banner above Input */}
        {replyingToMsg && (
          <div className={`px-4 py-2 flex items-center justify-between border-t border-[#25d366]/30 text-xs animate-fade-in ${
            isDark ? 'bg-[#182229] text-[#e9edef]' : 'bg-emerald-50 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2 border-l-2 border-[#25d366] pl-2 truncate">
              <CornerUpLeft className="w-3.5 h-3.5 text-[#25d366] shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-[#25d366] block">
                  Replying to {replyingToMsg.senderId === user.id ? 'yourself' : contact.name}
                </span>
                <span className="truncate block opacity-80">{replyingToMsg.text}</span>
              </div>
            </div>
            <button onClick={() => setReplyingToMsg(null)} className="p-1 hover:bg-black/10 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Editing Banner above Input */}
        {editingMsg && (
          <div className={`px-4 py-2 flex items-center justify-between border-t border-amber-500/30 text-xs animate-fade-in ${
            isDark ? 'bg-[#182229] text-[#e9edef]' : 'bg-amber-50 text-amber-900'
          }`}>
            <div className="flex items-center gap-2 border-l-2 border-amber-500 pl-2 truncate">
              <Edit3 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-semibold text-amber-500">Editing message</span>
            </div>
            <button onClick={() => { setEditingMsg(null); setInputText(''); }} className="p-1 hover:bg-black/10 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Voice Note Recorder Tray */}
        {isRecording ? (
          <div className={`p-3 flex items-center justify-between gap-3 border-t animate-fade-in z-20 ${
            isDark ? 'bg-[#111b21] border-[#222e35]' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-3 text-rose-500 font-mono font-bold text-sm">
              <span className="w-3 h-3 bg-rose-500 rounded-full animate-ping shrink-0" />
              <span>
                {Math.floor(recordingSeconds / 60)}:{recordingSeconds % 60 < 10 ? '0' : ''}{recordingSeconds % 60}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePauseRecording}
                className="p-2.5 rounded-full bg-[#202c33] text-white hover:bg-[#2a3942] transition-colors"
                title={isRecordingPaused ? "Resume" : "Pause"}
              >
                {isRecordingPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
              </button>

              <button
                type="button"
                onClick={handleCancelRecording}
                className="p-2.5 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                title="Discard"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleSendRecording}
                className="p-2.5 rounded-full bg-[#25d366] text-[#0b141a] hover:bg-[#20ba5a] transition-colors font-bold"
                title="Send Voice Note"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Bottom Input Bar */
          <form onSubmit={handleSend} className={`p-2 flex items-center gap-2 shrink-0 z-20 transition-colors ${
            isDark ? 'bg-[#0b141a]' : 'bg-gray-100 border-t border-gray-200'
          }`}>
            <div className={`flex-1 rounded-full flex items-center px-3 py-1.5 gap-2 border ${
              isDark ? 'bg-[#202c33] border-transparent' : 'bg-white border-gray-200'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowAttachModal(false);
                }}
                className={`p-1.5 transition-colors ${
                  isDark ? 'text-[#8596a0] hover:text-[#e9edef]' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Emojis"
              >
                <Smile className="w-6 h-6" />
              </button>

              <input
                type="text"
                placeholder="Message"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className={`flex-1 bg-transparent focus:outline-none text-base py-1 ${
                  isDark ? 'text-[#e9edef] placeholder-[#8596a0]' : 'text-gray-900 placeholder-gray-400'
                }`}
              />

              <button
                type="button"
                onClick={() => {
                  setShowAttachModal(!showAttachModal);
                  setShowEmojiPicker(false);
                }}
                className={`p-1.5 transition-colors -rotate-45 ${
                  isDark ? 'text-[#8596a0] hover:text-[#e9edef]' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Attach"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                className={`p-1.5 transition-colors hidden sm:block ${
                  isDark ? 'text-[#8596a0] hover:text-[#e9edef]' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Camera"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {inputText.trim() ? (
              <button
                type="submit"
                className="bg-[#25d366] hover:bg-[#20ba5a] active:scale-95 text-[#0b141a] w-11 h-11 rounded-full font-bold transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer"
                title="Send"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartRecording}
                className="bg-[#25d366] hover:bg-[#20ba5a] active:scale-95 text-[#0b141a] w-11 h-11 rounded-full font-bold transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer"
                title="Hold to Record Voice Message"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </form>
        )}

      </div>

      {/* Right Contact Info Sidebar Modal / Drawer */}
      {showRightSidebar && (
        <div 
          onClick={() => setShowRightSidebar(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm sm:w-80 h-full overflow-y-auto p-5 shadow-2xl flex flex-col border-l animate-slide-left ${
              isDark ? 'bg-[#111b21] border-[#222e35] text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-base">Contact Info</h3>
              <button 
                onClick={() => setShowRightSidebar(false)} 
                className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-500/20 mb-6">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-24 h-24 rounded-full object-cover shadow-xl mb-3 border-2 border-[#25d366]"
              />
              <h4 className="font-bold text-lg">{contact.name}</h4>
              <p className="text-xs text-[#8596a0] mt-0.5">{contact.email || 'Encrypted User'}</p>
              <p className="text-xs text-[#25d366] mt-2 font-medium">{contact.isOnline ? 'Online' : contact.lastSeen || 'Offline'}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <p className="text-[#8596a0] font-semibold mb-1 uppercase tracking-wider text-[10px]">About / Status</p>
                <p className="font-medium text-sm">{contact.status || 'Available'}</p>
              </div>

              <div className="pt-4 border-t border-gray-500/20">
                <p className="text-[#8596a0] font-semibold mb-2 uppercase tracking-wider text-[10px]">Shared Media & Files</p>
                <div className="grid grid-cols-3 gap-2">
                  {curMessages.filter(m => m.media?.type === 'image').slice(0, 6).map(m => (
                    <img
                      key={m.id}
                      src={m.media!.url}
                      alt="Shared"
                      className="w-full h-16 object-cover rounded-xl cursor-pointer hover:opacity-80"
                      onClick={() => setPreviewMedia(m.media!.url)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {forwardingMsg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl animate-scale-in ${
            isDark ? 'bg-[#111b21] border border-[#222e35] text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Forward Message</h3>
              <button onClick={() => setForwardingMsg(null)} className="p-1 hover:bg-black/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {contacts.map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    setForwardContactIds(prev =>
                      prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                    );
                  }}
                  className={`p-2.5 rounded-2xl flex items-center justify-between cursor-pointer border transition-colors ${
                    forwardContactIds.includes(c.id)
                      ? 'bg-[#25d366]/20 border-[#25d366]'
                      : (isDark ? 'bg-[#202c33] border-transparent' : 'bg-gray-100 border-gray-200')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={c.avatar} className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-xs font-semibold">{c.name}</span>
                  </div>
                  {forwardContactIds.includes(c.id) && <Check className="w-4 h-4 text-[#25d366]" />}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (forwardContactIds.length === 0) return;
                forwardMessage(forwardingMsg, forwardContactIds);
                showToast(`Forwarded to ${forwardContactIds.length} chats`);
                setForwardingMsg(null);
              }}
              disabled={forwardContactIds.length === 0}
              className="w-full bg-[#25d366] text-[#0b141a] font-bold py-3 rounded-xl text-xs hover:bg-[#20ba5a] transition-colors disabled:opacity-50"
            >
              Send Forward
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Full Image Preview */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <img src={previewMedia} alt="Media Lightbox" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
        </div>
      )}

      {/* Full Screen Avatar Modal */}
      {showFullAvatar && (
        <div 
          onClick={() => setShowFullAvatar(false)} 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 animate-fade-in text-white select-none backdrop-blur-md"
        >
          <div className="w-full flex items-center justify-between py-2 px-2 max-w-2xl mx-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setShowFullAvatar(false)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <span className="font-semibold text-lg text-white">{contact.name}</span>
            </div>
            <button 
              type="button"
              onClick={() => setShowFullAvatar(false)} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-2 max-w-2xl mx-auto w-full" onClick={e => e.stopPropagation()}>
            <img 
              src={contact.avatar} 
              alt={contact.name} 
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain shadow-2xl rounded-lg border border-white/10"
            />
          </div>

          <div className="py-2 text-center text-xs text-gray-400">
            Profile Photo • Tap anywhere to close
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#233138] border border-[#25d366]/40 text-[#25d366] px-5 py-2.5 rounded-full text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2 pointer-events-none">
          <CheckCheck className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
};

