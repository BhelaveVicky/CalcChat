import React from 'react';
import { Pin, X, ChevronRight } from 'lucide-react';
import { Message } from '../types';

interface PinnedMessageBannerProps {
  pinnedMessage: Message;
  isDark: boolean;
  onScrollToMessage: (msgId: string) => void;
  onUnpin: (msgId: string) => void;
}

export const PinnedMessageBanner: React.FC<PinnedMessageBannerProps> = ({
  pinnedMessage,
  isDark,
  onScrollToMessage,
  onUnpin,
}) => {
  const getDisplayContent = () => {
    if (pinnedMessage.text) return pinnedMessage.text;
    if (pinnedMessage.media) return `[${pinnedMessage.media.type || 'Attachment'}] ${pinnedMessage.media.name || ''}`;
    if (pinnedMessage.callInfo) return `[${pinnedMessage.callInfo.type === 'video' ? 'Video' : 'Voice'} Call]`;
    return 'Pinned Message';
  };
  return (
    <div className={`px-3 py-2 flex items-center justify-between border-b z-20 text-xs shadow-sm transition-all animate-slide-down ${
      isDark 
        ? 'bg-[#182229]/95 border-blue-500/30 text-[#e9edef]' 
        : 'bg-blue-50/90 border-blue-200 text-blue-950'
    }`}>
      <div 
        onClick={() => onScrollToMessage(pinnedMessage.id)}
        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group"
      >
        <div className="p-1.5 rounded-full bg-blue-500/20 text-blue-500 shrink-0 group-hover:scale-110 transition-transform">
          <Pin className="w-3.5 h-3.5 fill-blue-500" />
        </div>

        <div className="min-w-0 flex-1 border-l-2 border-blue-500 pl-2">
          <div className="font-bold text-blue-500 text-[11px] flex items-center gap-1 uppercase tracking-wider">
            Pinned Message
          </div>
          <p className="truncate font-medium text-xs opacity-90 mt-0.5">
            {getDisplayContent()}
          </p>
        </div>

        <ChevronRight className="w-4 h-4 text-blue-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUnpin(pinnedMessage.id);
        }}
        className="p-1 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors ml-2 shrink-0 cursor-pointer"
        title="Unpin message"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
