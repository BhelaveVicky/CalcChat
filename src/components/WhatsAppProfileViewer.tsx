import React, { useState } from 'react';
import { ArrowLeft, X, Edit2, RotateCw, MessageSquare, Phone, Video } from 'lucide-react';

interface WhatsAppProfileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  avatarUrl: string;
  subText?: string;
  isSelf?: boolean;
  onEditPhoto?: () => void;
  onSendMessage?: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
}

export const WhatsAppProfileViewer: React.FC<WhatsAppProfileViewerProps> = ({
  isOpen,
  onClose,
  name,
  avatarUrl,
  subText,
  isSelf,
  onEditPhoto,
  onSendMessage,
  onVoiceCall,
  onVideoCall
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  if (!isOpen) return null;

  // Upgrade image quality for Unsplash URLs so full photo is crystal clear (no low-res blur)
  const getHighResUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('images.unsplash.com')) {
      return url
        .replace(/w=\d+/, 'w=1600')
        .replace(/h=\d+/, 'h=1600')
        .replace(/q=\d+/, 'q=98')
        .replace(/&fit=crop/, '')
        .replace(/\?fit=crop&?/, '?');
    }
    return url;
  };

  const highResAvatar = getHighResUrl(avatarUrl);

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => prev === 1 ? 2 : 1);
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(r => (r + 90) % 360);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black text-white flex flex-col justify-between animate-fade-in select-none"
      onClick={onClose}
    >
      {/* WhatsApp Header Bar */}
      <div 
        className="w-full bg-black/90 px-3 sm:px-4 py-3 flex items-center justify-between z-20 border-b border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="min-w-0 flex flex-col">
            <h2 className="font-bold text-lg sm:text-xl text-white truncate leading-snug">
              {name || 'Profile Photo'}
            </h2>
            {subText && (
              <p className="text-xs text-gray-400 truncate">
                {subText}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {isSelf && onEditPhoto && (
            <button
              type="button"
              onClick={onEditPhoto}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
              title="Edit Profile Photo"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleRotate}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
            title="Rotate"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Full-Width WhatsApp Photo Container */}
      <div 
        className="flex-1 flex items-center justify-center w-full h-full overflow-hidden bg-black p-0 relative"
        onClick={onClose}
      >
        {highResAvatar ? (
          <div 
            className="w-full h-full flex items-center justify-center p-0 cursor-zoom-in"
            onClick={toggleZoom}
          >
            <img 
              src={highResAvatar} 
              alt={name} 
              className="w-full h-full max-h-[88vh] object-contain transition-transform duration-300 ease-out shadow-2xl"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
              }}
            />
          </div>
        ) : (
          <div className="w-full aspect-square bg-[#1f2c34] flex items-center justify-center text-7xl font-bold text-gray-300">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
      </div>

      {/* Bottom WhatsApp Actions Bar */}
      <div 
        className="w-full bg-black/90 px-4 py-3 border-t border-white/10 flex items-center justify-around text-gray-300 z-20"
        onClick={e => e.stopPropagation()}
      >
        {onSendMessage ? (
          <div className="flex items-center justify-around w-full max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => {
                onSendMessage();
                onClose();
              }}
              className="flex flex-col items-center gap-1 hover:text-[#00a8ff] transition-colors p-2 cursor-pointer"
              title="Message"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[11px] font-medium">Message</span>
            </button>

            {onVoiceCall && (
              <button
                type="button"
                onClick={() => {
                  onVoiceCall();
                  onClose();
                }}
                className="flex flex-col items-center gap-1 hover:text-[#00a8ff] transition-colors p-2 cursor-pointer"
                title="Voice Call"
              >
                <Phone className="w-5 h-5" />
                <span className="text-[11px] font-medium">Call</span>
              </button>
            )}

            {onVideoCall && (
              <button
                type="button"
                onClick={() => {
                  onVideoCall();
                  onClose();
                }}
                className="flex flex-col items-center gap-1 hover:text-[#00a8ff] transition-colors p-2 cursor-pointer"
                title="Video Call"
              >
                <Video className="w-5 h-5" />
                <span className="text-[11px] font-medium">Video</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-full text-center text-xs text-gray-400 font-medium">
            Profile photo • Tap image to zoom
          </div>
        )}
      </div>
    </div>
  );
};
