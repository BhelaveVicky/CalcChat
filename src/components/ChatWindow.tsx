import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Smile, Image, Video, FileText, Trash2, ArrowLeft, ShieldCheck, Lock, CheckCheck, Paperclip, Camera, Phone, Mic, MoreVertical } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { MediaAttachment } from '../types';

export const ChatWindow: React.FC = () => {
  const { activeContactId, setActiveContactId, setActiveTab, contacts, messages, sendMessage, user, deleteMessage } = useVault();
  const [inputText, setInputText] = useState('');
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);
  
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
    <div className="flex-1 flex flex-col bg-[#0b141a] text-[#e9edef] overflow-hidden relative font-sans select-none h-full min-h-0">
      
      {/* Top Chat Header */}
      <div className="px-3 py-2.5 bg-[#0b141a] border-b border-[#1f2c34]/60 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <button
            id="vault_nav_back_trigger"
            onClick={() => setActiveContactId(null)}
            className="p-1 hover:bg-[#202c33] rounded-full transition-colors text-[#e9edef] mr-0.5"
            title="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="relative shrink-0">
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-10 h-10 rounded-full object-cover bg-[#202c33]"
            />
            {contact.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] rounded-full border-2 border-[#0b141a]"></span>
            )}
          </div>

          <div className="min-w-0 ml-1">
            <h2 className="font-semibold text-base text-[#e9edef] flex items-center gap-1.5 truncate">
              {contact.name}
              {contact.isLocked && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            </h2>
            <p className="text-xs text-[#8596a0] truncate">
              {contact.isOnline ? 'Online' : contact.lastSeen || 'last seen recently'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[#e9edef] mr-1">
          <button onClick={() => alert("Video Calling Secure Tunnel...")} className="hover:opacity-80 p-1">
            <Video className="w-5 h-5" />
          </button>
          <button onClick={() => alert("Voice Calling Secure Tunnel...")} className="hover:opacity-80 p-1">
            <Phone className="w-5 h-5" />
          </button>
          <button onClick={() => alert("Channel Settings")} className="hover:opacity-80 p-1">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages View Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-[#0b141a] no-scrollbar min-h-0">
        {curMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#8596a0] text-xs px-6">
            <div className="bg-[#182229] p-3.5 rounded-2xl mb-3 border border-[#202c33]">
              <Lock className="w-6 h-6 text-[#25d366]" />
            </div>
            <p className="font-semibold text-sm text-[#e9edef]">Messages are end-to-end encrypted</p>
            <p className="max-w-xs mt-1 text-xs text-[#8596a0]">No one outside of this secret chat, not even WhatsApp, can read or listen to them.</p>
          </div>
        ) : (
          curMessages.map(msg => {
            const isMe = msg.senderId === user.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-sm relative shadow transition-all ${
                    isMe
                      ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-xs'
                      : 'bg-[#202c33] text-[#e9edef] rounded-tl-xs'
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
      <form onSubmit={handleSend} className="p-2 bg-[#0b141a] flex items-center gap-2 shrink-0 z-20">
        <div className="flex-1 bg-[#202c33] rounded-full flex items-center px-3 py-1.5 gap-2">
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachModal(false);
            }}
            className="text-[#8596a0] hover:text-[#e9edef] p-1.5 transition-colors"
            title="Emojis"
          >
            <Smile className="w-6 h-6" />
          </button>

          <input
            type="text"
            placeholder="Message"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="flex-1 bg-transparent text-[#e9edef] placeholder-[#8596a0] focus:outline-none text-base py-1"
          />

          <button
            type="button"
            onClick={() => {
              setShowAttachModal(!showAttachModal);
              setShowEmojiPicker(false);
            }}
            className="text-[#8596a0] hover:text-[#e9edef] p-1.5 transition-colors -rotate-45"
            title="Attach"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className="text-[#8596a0] hover:text-[#e9edef] p-1.5 transition-colors hidden sm:block"
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

    </div>
  );
};
