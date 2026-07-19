import React, { useState } from 'react';
import { Plus, Camera, Eye, Download, Shield, Upload, FileText, Video, Image as ImageIcon, X, Send, Lock } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { MediaAttachment } from '../types';

interface StatusItem {
  id: string;
  name: string;
  time: string;
  avatar: string;
  storyImage: string;
  isHighlighted?: boolean;
}

export const MediaGallery: React.FC = () => {
  const { messages, sendMessage, contacts, user } = useVault();
  const [activeStory, setActiveStory] = useState<StatusItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showVaultMedia, setShowVaultMedia] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Exact statuses matching user screenshot
  const statuses: StatusItem[] = [
    {
      id: 's1',
      name: 'Unkaun Number',
      time: 'Today at 9:20 am',
      avatar: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&auto=format&fit=crop&q=80',
      storyImage: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
      isHighlighted: true
    },
    {
      id: 's2',
      name: 'Ishant Pandhre',
      time: 'Today at 9:13 am',
      avatar: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300&auto=format&fit=crop&q=80',
      storyImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 's3',
      name: 'Ashwani Yadav Sir',
      time: 'Today at 9:10 am',
      avatar: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&auto=format&fit=crop&q=80',
      storyImage: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 's4',
      name: 'निरूता डोंगरवार',
      time: 'Today at 9:09 am',
      avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=300&auto=format&fit=crop&q=80',
      storyImage: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 's5',
      name: 'Pandhare',
      time: 'Today at 5:45 am',
      avatar: 'https://images.unsplash.com/photo-1604608672516-f6c0db7f9e80?w=300&auto=format&fit=crop&q=80',
      storyImage: 'https://images.unsplash.com/photo-1604608672516-f6c0db7f9e80?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 's6',
      name: 'harsh meshram',
      time: 'Yesterday at 6:01 pm',
      avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
      storyImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80'
    }
  ];

  const myStatusItem: StatusItem = {
    id: 'my',
    name: 'My status',
    time: 'Yesterday at 11:54 am',
    avatar: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80',
    storyImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80'
  };

  // Collect all media across all messages for the secret vault toggle
  const allMedia: { attachment: MediaAttachment; chatName: string; timestamp: string }[] = [];
  Object.keys(messages).forEach(contactId => {
    const msgs = messages[contactId] || [];
    const contactName = contacts.find(c => c.id === contactId)?.name || 'Private Channel';
    msgs.forEach(m => {
      if (m.media) {
        allMedia.push({
          attachment: m.media,
          chatName: contactName,
          timestamp: m.timestamp,
        });
      }
    });
  });

  const handleUploadStatus = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const type = isImg ? 'image' : isVid ? 'video' : 'file';

      const attachment: MediaAttachment = {
        id: 'gal_' + Date.now(),
        type,
        name: file.name,
        url: reader.result as string,
        size: (file.size / 1024).toFixed(1) + ' KB',
      };

      const targetChannel = contacts[0]?.id || 'contact_novak';
      sendMessage(targetChannel, `Status Upload: ${file.name}`, attachment);
      alert(`✅ Status "${file.name}" uploaded and saved to secret vault.`);
    };
    reader.readAsDataURL(file);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStory) return;
    const targetChannel = contacts[0]?.id || 'contact_novak';
    sendMessage(targetChannel, `Replied to ${activeStory.name}'s status: "${replyText}"`);
    setReplyText('');
    setActiveStory(null);
    alert(`Encrypted reply sent to ${activeStory.name}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] text-[#e9edef] overflow-y-auto no-scrollbar font-sans select-none relative pb-12 h-full min-h-0">
      
      {/* My Status Row */}
      <div className="pt-2 px-4 pb-3">
        <div 
          onClick={() => setActiveStory(myStatusItem)}
          className="flex items-center justify-between cursor-pointer group py-1.5"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-13 h-13 rounded-full p-[2px] border-2 border-[#8596a0]/30 shrink-0">
                <img 
                  src={myStatusItem.avatar} 
                  alt="My status" 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <label 
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-0 right-0 bg-[#00a884] text-[#0b141a] rounded-full p-1 border-2 border-[#0b141a] cursor-pointer hover:scale-110 transition-transform shadow"
                title="Add status"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <input type="file" className="hidden" onChange={handleUploadStatus} />
              </label>
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-base text-[#e9edef] truncate">
                My status
              </h3>
              <p className="text-xs sm:text-sm text-[#8596a0] truncate mt-0.5">
                Yesterday at 11:54 am
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label 
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-[#8596a0] hover:text-[#e9edef] hover:bg-[#202c33] rounded-full cursor-pointer transition-colors"
              title="Camera"
            >
              <Camera className="w-5 h-5" />
              <input type="file" className="hidden" onChange={handleUploadStatus} />
            </label>
          </div>
        </div>
      </div>

      {/* Section Header: Recent */}
      <div className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#8596a0] tracking-wide select-none">
        Recent
      </div>

      {/* Statuses List */}
      <div className="space-y-1">
        {statuses.map((status) => (
          <div
            key={status.id}
            onClick={() => setActiveStory(status)}
            className={`transition-all cursor-pointer ${
              status.isHighlighted 
                ? 'bg-[#182229] rounded-2xl mx-2.5 px-3 py-3 my-1 border border-[#202c33]/60' 
                : 'px-4 py-3 hover:bg-[#202c33]/40 active:bg-[#202c33]'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Green Ring Avatar */}
              <div className="relative shrink-0">
                <div className="w-13 h-13 rounded-full p-[2.5px] border-[2.5px] border-[#00a884] shrink-0 flex items-center justify-center">
                  <img
                    src={status.avatar}
                    alt={status.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-base text-[#e9edef] truncate">
                  {status.name}
                </h4>
                <p className="text-xs sm:text-sm text-[#8596a0] truncate mt-0.5">
                  {status.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secret Vault Media Toggle Section */}
      <div className="mt-8 mx-4 pt-4 border-t border-[#1f2c34]/80">
        <button
          onClick={() => setShowVaultMedia(!showVaultMedia)}
          className="w-full bg-[#182229] hover:bg-[#202c33] border border-[#2a3942] rounded-2xl p-3.5 flex items-center justify-between text-sm transition-colors shadow"
        >
          <div className="flex items-center gap-2.5 text-[#25d366] font-semibold">
            <Lock className="w-4 h-4" />
            <span>Classified Vault Media</span>
          </div>
          <span className="text-xs font-mono bg-[#0b141a] text-[#8596a0] px-2.5 py-1 rounded-full border border-[#2a3942]">
            {allMedia.length} files {showVaultMedia ? '▲' : '▼'}
          </span>
        </button>

        {showVaultMedia && (
          <div className="mt-4 grid grid-cols-3 gap-2 animate-fade-in">
            {allMedia.length === 0 ? (
              <div className="col-span-3 text-center py-6 text-xs text-[#8596a0] bg-[#111b21] rounded-2xl">
                No secret media files uploaded yet in chats.
              </div>
            ) : (
              allMedia.map((item, i) => (
                <div 
                  key={i}
                  onClick={() => item.attachment.type === 'image' ? setPreviewUrl(item.attachment.url) : window.open(item.attachment.url)}
                  className="aspect-square bg-[#111b21] rounded-xl overflow-hidden relative cursor-pointer border border-[#2a3942] hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  {item.attachment.type === 'image' ? (
                    <img src={item.attachment.url} alt={item.attachment.name} className="w-full h-full object-cover" />
                  ) : item.attachment.type === 'video' ? (
                    <Video className="w-6 h-6 text-rose-400" />
                  ) : (
                    <FileText className="w-6 h-6 text-indigo-400" />
                  )}
                  <span className="absolute bottom-1 left-1 right-1 text-[9px] bg-black/70 text-white truncate px-1 rounded">
                    {item.attachment.name}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Story Viewer Overlay Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between animate-fade-in text-white">
          {/* Story Top Bar */}
          <div className="p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10 space-y-2">
            {/* Story Progress Indicator */}
            <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white w-full animate-story-progress"></div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <img src={activeStory.avatar} alt={activeStory.name} className="w-9 h-9 rounded-full object-cover border border-white/20" />
                <div>
                  <h4 className="font-semibold text-sm leading-tight">{activeStory.name}</h4>
                  <p className="text-[11px] text-white/70">{activeStory.time}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveStory(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Story Image / Content */}
          <div 
            onClick={() => setActiveStory(null)}
            className="flex-1 flex items-center justify-center relative px-2 overflow-hidden cursor-pointer"
          >
            <img 
              src={activeStory.storyImage} 
              alt="Story Content" 
              className="max-w-full max-h-[80vh] object-contain select-none"
            />
          </div>

          {/* Story Reply Footer */}
          <form onSubmit={handleSendReply} className="p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center gap-2 z-10">
            <input
              type="text"
              placeholder="Reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-[#202c33]/90 border border-white/20 rounded-full px-4 py-2.5 text-sm text-white placeholder-white/60 focus:outline-none focus:border-[#00a884] backdrop-blur"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="bg-[#00a884] disabled:opacity-40 hover:bg-[#008f6f] text-[#0b141a] p-2.5 rounded-full font-bold transition-all shadow"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
        </div>
      )}

    </div>
  );
};
