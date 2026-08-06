import React from 'react';
import { Video, Camera, FileText } from 'lucide-react';
import { StatusReplyData, StatusReactionData } from '../types';

interface StatusReplyCardProps {
  statusReply?: StatusReplyData;
  statusReaction?: StatusReactionData;
  isMe: boolean;
  isDark: boolean;
  onOpenStatus: (statusId: string, statusOwnerId?: string) => void;
}

export const StatusReplyCard: React.FC<StatusReplyCardProps> = ({
  statusReply,
  statusReaction,
  isMe,
  isDark,
  onOpenStatus,
}) => {
  const data = statusReply || statusReaction;
  if (!data) return null;

  const statusId = data.statusId;
  const statusOwnerId = data.statusOwnerId;
  const ownerName = data.statusOwnerName || 'User';
  const type = data.statusType || data.statusMediaType || 'image';
  const thumbnail = data.statusThumbnail || data.statusMediaUrl;
  const statusText = data.statusText;
  const reactionEmoji = statusReaction?.emoji;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (statusId) {
      onOpenStatus(statusId, statusOwnerId);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative p-2.5 rounded-xl border-l-[4px] mb-2 text-xs flex items-center justify-between gap-3 cursor-pointer select-none transition-all duration-150 overflow-hidden ${
        isMe
          ? 'bg-black/25 border-white text-white hover:bg-black/35 active:scale-[0.99]'
          : isDark
          ? 'bg-[#111b21] border-[#ff2e93] text-[#e9edef] hover:bg-[#182229] active:scale-[0.99]'
          : 'bg-[#f0f2f5] border-[#ff2e93] text-gray-900 hover:bg-gray-200/80 active:scale-[0.99]'
      }`}
      title="Click to view full status"
    >
      {/* Content Section */}
      <div className="flex-1 min-w-0 pr-1">
        {/* Header: Owner Name & Status badge */}
        <div
          className={`font-semibold text-[12px] truncate flex items-center gap-1.5 ${
            isMe ? 'text-white' : 'text-[#ff2e93] dark:text-[#ff7b61]'
          }`}
        >
          <span className="font-bold truncate">{ownerName}</span>
          <span className="opacity-75 font-normal text-[11px] shrink-0">· Status</span>
        </div>

        {/* Subtitle / Details */}
        <div
          className={`flex items-center gap-1.5 text-[11px] mt-0.5 truncate ${
            isMe ? 'text-white/85' : 'text-gray-600 dark:text-[#8696a0]'
          }`}
        >
          {reactionEmoji && (
            <span className="shrink-0 text-sm leading-none mr-0.5">{reactionEmoji}</span>
          )}

          {type === 'video' ? (
            <>
              <Video
                className={`w-3.5 h-3.5 shrink-0 inline ${
                  isMe ? 'text-white' : 'text-[#ff2e93] dark:text-[#ff7b61]'
                }`}
              />
              <span className="truncate font-medium">{statusText || 'Video'}</span>
            </>
          ) : type === 'image' || thumbnail ? (
            <>
              <Camera
                className={`w-3.5 h-3.5 shrink-0 inline ${
                  isMe ? 'text-white' : 'text-[#ff2e93] dark:text-[#ff7b61]'
                }`}
              />
              <span className="truncate font-medium">{statusText || 'Photo'}</span>
            </>
          ) : (
            <>
              <FileText
                className={`w-3.5 h-3.5 shrink-0 inline ${
                  isMe ? 'text-white' : 'text-[#ff2e93] dark:text-[#ff7b61]'
                }`}
              />
              <span className="truncate font-medium">{statusText || 'Status'}</span>
            </>
          )}
        </div>
      </div>

      {/* Right Side Thumbnail */}
      {thumbnail ? (
        <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-black/10 dark:border-white/20 shadow-xs">
          <img
            src={thumbnail}
            alt="Status preview"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 pointer-events-none"
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#ff2e93] to-pink-600 flex items-center justify-center shrink-0 text-white font-bold text-[10px] p-1 text-center truncate shadow-xs">
          Status
        </div>
      )}
    </div>
  );
};
