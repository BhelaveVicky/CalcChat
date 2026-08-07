import React from 'react';
import { Video, Camera, FileText, Play } from 'lucide-react';
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

  // WhatsApp uses green (#25D366) for outgoing status replies, teal (#128C7E) for incoming
  const borderColor = isMe ? '#d1d5db' : '#25D366';

  return (
    <div
      onClick={handleClick}
      className={`group relative rounded-lg mb-1.5 text-xs flex items-stretch cursor-pointer select-none transition-all duration-150 overflow-hidden ${
        isMe
          ? 'bg-[#025144]/60 hover:bg-[#025144]/80 active:scale-[0.995]'
          : isDark
          ? 'bg-[#1a2930] hover:bg-[#1e3038] active:scale-[0.995]'
          : 'bg-[#e7f8e9] hover:bg-[#d6f0d8] active:scale-[0.995]'
      }`}
      style={{ borderLeft: `4px solid ${borderColor}` }}
      title="Tap to view full status"
    >
      {/* Content Section */}
      <div className="flex-1 min-w-0 py-2 px-2.5 flex flex-col justify-center">
        {/* Header Row: Owner Name · Status */}
        <div className="flex items-center gap-1 min-w-0 leading-tight">
          <span
            className={`font-bold text-[12.5px] truncate ${
              isMe
                ? 'text-[#a3d9cc]'
                : isDark
                ? 'text-[#25D366]'
                : 'text-[#075e54]'
            }`}
          >
            {ownerName}
          </span>
          <span
            className={`text-[11px] font-normal shrink-0 ${
              isMe ? 'text-white/50' : isDark ? 'text-[#8696a0]' : 'text-gray-500'
            }`}
          >
            · Status
          </span>
        </div>

        {/* Media Type / Details Row */}
        <div
          className={`flex items-center gap-1.5 text-[11px] mt-0.5 truncate ${
            isMe ? 'text-white/75' : isDark ? 'text-[#8696a0]' : 'text-gray-600'
          }`}
        >
          {reactionEmoji && (
            <span className="shrink-0 text-sm leading-none">{reactionEmoji}</span>
          )}

          {type === 'video' ? (
            <>
              <Video
                className={`w-3.5 h-3.5 shrink-0 ${
                  isMe ? 'text-[#a3d9cc]' : isDark ? 'text-[#25D366]' : 'text-[#075e54]'
                }`}
              />
              <span className="truncate font-medium">{statusText || 'Video'}</span>
            </>
          ) : type === 'image' || thumbnail ? (
            <>
              <Camera
                className={`w-3.5 h-3.5 shrink-0 ${
                  isMe ? 'text-[#a3d9cc]' : isDark ? 'text-[#25D366]' : 'text-[#075e54]'
                }`}
              />
              <span className="truncate font-medium">{statusText || 'Photo'}</span>
            </>
          ) : (
            <>
              <FileText
                className={`w-3.5 h-3.5 shrink-0 ${
                  isMe ? 'text-[#a3d9cc]' : isDark ? 'text-[#25D366]' : 'text-[#075e54]'
                }`}
              />
              <span className="truncate font-medium">{statusText || 'Status update'}</span>
            </>
          )}
        </div>
      </div>

      {/* Right Side Thumbnail */}
      {thumbnail ? (
        <div className="relative w-[52px] shrink-0 overflow-hidden">
          <img
            src={thumbnail}
            alt="Status preview"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 pointer-events-none"
          />
          {/* Video play indicator overlay */}
          {type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
              <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center shadow">
                <Play className="w-3 h-3 text-gray-800 ml-0.5" fill="currentColor" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`w-[52px] shrink-0 flex items-center justify-center text-[10px] font-bold ${
            isDark
              ? 'bg-gradient-to-br from-[#25D366]/40 to-[#128C7E]/40 text-[#25D366]'
              : 'bg-gradient-to-br from-[#25D366]/20 to-[#128C7E]/20 text-[#075e54]'
          }`}
        >
          Status
        </div>
      )}
    </div>
  );
};
