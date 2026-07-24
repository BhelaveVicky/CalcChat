import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Plus, Smile, Image, Video, FileText, Trash2, ArrowLeft, ShieldCheck, 
  Lock, CheckCheck, Paperclip, Camera, Phone, Mic, MoreVertical, X,
  Search, CheckSquare, Heart, Ban, MinusCircle, Copy, Pin
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useSettings } from '../context/SettingsContext';
import { MediaAttachment } from '../types';

export const ChatWindow: React.FC = () => {
  const { 
    activeContactId, setActiveContactId, setActiveTab, contacts, messages, 
    sendMessage, user, deleteMessage, settings, togglePinContact, clearChatHistory, blockContact 
  } = useVault();
  const { settings: globalSettings } = useSettings();

  const isDark = globalSettings.darkMode && settings.theme !== 'material-light' && settings.theme !== 'light';
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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contact = contacts.find(c => c.id === activeContactId);
  const curMessages = (activeContactId && messages[activeContactId]) || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [curMessages.length, activeContactId]);

  if (!contact || !activeContactId) {
    return (
      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-500 text-xs select-none">
        <ShieldCheck className="w-12 h-12 text-emerald-500/40 mb-2 animate-pulse" />
        <p className="font-mono text-slate-400">SELECT A CLASSIFIED CHANNEL</p>
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(activeContactId, inputText.trim());
    setInputText('');
    setShowEmojiPicker(false);
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
        name: `Classified_SQLite_Dump_${Math.floor(Math.random() * 900 + 100)}.sql`,
        url: '#',
        size: '14.8 KB',
      };
      sendMessage(activeContactId, 'Uploaded SQLite database dump', media);
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
      const type = isImg ? 'image' : isVid ? 'video' : 'file';

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
    <div className={`flex-1 flex flex-col overflow-hidden relative font-sans select-none h-full min-h-0 transition-colors ${
      isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-white text-gray-900'
    }`}>
      
      {/* Top Chat Header */}
      <div className={`px-3 py-2.5 flex items-center justify-between shrink-0 z-20 border-b transition-colors ${
        isDark ? 'bg-[#0b141a] border-[#1f2c34]/60 text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <button
            id="vault_nav_back_trigger"
            onClick={() => setActiveContactId(null)}
            className={`p-1 rounded-full transition-colors mr-0.5 ${
              isDark ? 'hover:bg-[#202c33] text-[#e9edef]' : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div 
            onClick={() => setShowFullAvatar(true)} 
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
            onClick={() => setShowFullAvatar(true)} 
            className="min-w-0 ml-1 cursor-pointer"
          >
            <h2 className={`font-semibold text-base flex items-center gap-1.5 truncate ${
              isDark ? 'text-[#e9edef]' : 'text-gray-900'
            }`}>
              {contact.name}
              {contact.isLocked && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            </h2>
            <p className={`text-xs truncate ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>
              {contact.isOnline ? 'Online' : contact.lastSeen || 'last seen recently'}
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-3 relative ${isDark ? 'text-[#e9edef]' : 'text-gray-700'}`}>
          <button 
            type="button"
            onClick={() => alert("Video Calling Secure Tunnel...")} 
            className="hover:opacity-80 p-1.5 rounded-full transition-colors"
            title="Video call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button 
            type="button"
            onClick={() => alert("Voice Calling Secure Tunnel...")} 
            className="hover:opacity-80 p-1.5 rounded-full transition-colors"
            title="Voice call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button 
            type="button"
            onClick={() => setShowHeaderMenu(!showHeaderMenu)} 
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
                
                {/* 1. Search */}
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
                  <span>Search</span>
                </button>

                {/* 2. Select messages */}
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

                {/* 3. Add to favourites */}
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    showToast("Added to favourites");
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                  }`}
                >
                  <Heart className="w-4.5 h-4.5 opacity-80" />
                  <span>Add to favourites</span>
                </button>

                {/* 4. Block */}
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    blockContact(contact.id);
                    showToast(`${contact.name} blocked`);
                    setActiveContactId(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                  }`}
                >
                  <Ban className="w-4.5 h-4.5 opacity-80 text-amber-500" />
                  <span>Block</span>
                </button>

                {/* 5. Clear chat */}
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    clearChatHistory(contact.id);
                    showToast("Clear chat history");
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                  }`}
                >
                  <MinusCircle className="w-4.5 h-4.5 opacity-80" />
                  <span>Clear chat</span>
                </button>

                {/* 6. Delete chat */}
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    clearChatHistory(contact.id);
                    setActiveContactId(null);
                    showToast("Delete chat");
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors text-rose-500 ${
                    isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                  }`}
                >
                  <Trash2 className="w-4.5 h-4.5" />
                  <span>Delete chat</span>
                </button>

                {/* 7. Copy chat */}
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    const allText = curMessages.map(m => `[${m.timestamp}] ${m.senderId === 'user' ? 'Me' : contact.name}: ${m.text}`).join('\n');
                    navigator.clipboard.writeText(allText || 'No messages');
                    showToast("Copy chat to clipboard");
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                  }`}
                >
                  <Copy className="w-4.5 h-4.5 opacity-80" />
                  <span>Copy chat</span>
                </button>

                {/* 8. Pin chat */}
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

                <div className={`my-1 border-t ${isDark ? 'border-[#2a3942]' : 'border-gray-200'}`} />

                {/* 9. Close chat */}
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setActiveContactId(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    isDark ? 'hover:bg-[#182229]' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-4.5 h-4.5 opacity-80" />
                  <span>Close chat</span>
                </button>

              </div>
            </>
          )}
        </div>
      </div>

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
          isDark ? 'bg-[#1f2c34] text-white border-[#2a3942]' : 'bg-emerald-600 text-white border-emerald-700'
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
        className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 no-scrollbar min-h-0 transition-all ${
          isDark ? 'bg-[#0b141a]' : 'bg-[#efeae2]'
        }`}
        style={
          settings?.chatWallpaper
            ? settings.chatWallpaper.startsWith('data:') || settings.chatWallpaper.startsWith('http')
              ? { backgroundImage: `url(${settings.chatWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { backgroundColor: settings.chatWallpaper }
            : {}
        }
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
            <p className={`font-semibold text-sm ${isDark ? 'text-[#e9edef]' : 'text-gray-900'}`}>Messages are end-to-end encrypted</p>
            <p className={`max-w-xs mt-1 text-xs ${isDark ? 'text-[#8596a0]' : 'text-gray-500'}`}>No one outside of this secret chat, not even WhatsApp, can read or listen to them.</p>
          </div>
        ) : (
          (inChatSearchQuery.trim() 
            ? curMessages.filter(m => m.text.toLowerCase().includes(inChatSearchQuery.toLowerCase())) 
            : curMessages
          ).map(msg => {
            const isMe = msg.senderId === user.id;
            const isSelected = selectedMsgIds.includes(msg.id);

            return (
              <div
                key={msg.id}
                className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
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

                      {msg.media.type === 'file' && (
                        <div className="p-3 flex items-center gap-3">
                          <div className="p-2 bg-[#25d366]/20 text-[#25d366] rounded-lg shrink-0 font-mono text-xs font-bold">
                            FILE
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate text-sm text-[#e9edef]">{msg.media.name}</p>
                            <p className="text-xs text-[#8596a0] font-mono">{msg.media.size || 'Attachment'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Text */}
                  <p className="leading-normal whitespace-pre-wrap break-words text-[15px]">{msg.text}</p>

                  {/* Footer Timestamp & Status */}
                  <div className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] ${isMe ? 'text-[#8596a0]' : 'text-[#8596a0]'}`}>
                    <span>{msg.timestamp}</span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] inline ml-0.5" />}
                  </div>

                  {/* Hover Delete Action */}
                  <button
                    onClick={() => deleteMessage(activeContactId, msg.id)}
                    className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    title="Delete Message"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Bar Tray */}
      {showEmojiPicker && (
        <div className="bg-[#1f2c34] border-t border-[#2a3942] p-2.5 flex items-center justify-around text-xl shrink-0 animate-fade-in z-20">
          {['😀', '🔥', '👍', '❤️', '🤫', '🛡️', '⚠️', '🚀', '🎯', '💯'].map(em => (
            <button
              key={em}
              type="button"
              onClick={() => insertEmoji(em)}
              className="p-1.5 hover:scale-125 transition-transform"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Media Attach Tray Modal */}
      {showAttachModal && (
        <div className="absolute inset-x-3 bottom-20 z-30 bg-[#233138] border border-[#2a3942] rounded-3xl p-5 shadow-2xl animate-fade-in text-sm">
          <div className="flex items-center justify-between font-bold text-[#25d366] mb-4 text-base px-1">
            <span>📎 Attachments</span>
            <button onClick={() => setShowAttachModal(false)} className="text-[#8596a0] hover:text-white px-2">✕</button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => handleAttachMedia('image')}
              className="flex flex-col items-center justify-center gap-2 bg-[#0b141a] hover:bg-[#182229] p-4 rounded-2xl border border-[#2a3942] transition-colors"
            >
              <Image className="w-7 h-7 text-purple-400" />
              <span className="text-xs">Gallery</span>
            </button>

            <button
              onClick={() => handleAttachMedia('video')}
              className="flex flex-col items-center justify-center gap-2 bg-[#0b141a] hover:bg-[#182229] p-4 rounded-2xl border border-[#2a3942] transition-colors"
            >
              <Video className="w-7 h-7 text-rose-400" />
              <span className="text-xs">Video</span>
            </button>

            <button
              onClick={() => handleAttachMedia('file')}
              className="flex flex-col items-center justify-center gap-2 bg-[#0b141a] hover:bg-[#182229] p-4 rounded-2xl border border-[#2a3942] transition-colors"
            >
              <FileText className="w-7 h-7 text-indigo-400" />
              <span className="text-xs">Document</span>
            </button>
          </div>

          <div className="border-t border-[#2a3942] pt-3">
            <label className="flex items-center justify-center gap-2 w-full bg-[#25d366] hover:bg-[#20ba5a] text-[#0b141a] font-bold py-3 rounded-xl cursor-pointer transition-colors">
              <Plus className="w-5 h-5" /> Upload File from Computer
              <input
                type="file"
                className="hidden"
                onChange={handleCustomFileUpload}
              />
            </label>
          </div>
        </div>
      )}

      {/* Bottom Message Input Bar */}
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

        <button
          type="submit"
          className="bg-[#00a884] hover:bg-[#008f6f] active:scale-95 text-[#0b141a] w-11 h-11 rounded-full font-bold transition-all shadow-md flex items-center justify-center shrink-0"
          title="Send"
        >
          {inputText.trim() ? <Send className="w-5 h-5 ml-0.5" /> : <Mic className="w-5 h-5" />}
        </button>
      </form>

      {/* Lightbox Modal for Full Image Preview */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          className="absolute inset-0 z-50 bg-black/95 backdrop-blur flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
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
          {/* Top Bar */}
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

          {/* Center Image */}
          <div className="flex-1 flex items-center justify-center p-2 max-w-2xl mx-auto w-full" onClick={e => e.stopPropagation()}>
            <img 
              src={contact.avatar} 
              alt={contact.name} 
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain shadow-2xl rounded-lg border border-white/10"
            />
          </div>

          {/* Bottom Bar / Action */}
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
