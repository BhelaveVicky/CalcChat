import React from 'react';
import { StatusUpdate } from '../../types';
import { Eye, Heart, Play } from 'lucide-react';
import { formatStatusTime } from '../../lib/dateUtils';

interface StatusThumbnailProps {
  status: StatusUpdate;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  isUnviewed?: boolean;
  showDetailsBadge?: boolean;
}

export const StatusThumbnail: React.FC<StatusThumbnailProps> = ({
  status,
  size = 'md',
  onClick,
  isUnviewed = false,
  showDetailsBadge = false,
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-20 h-20 text-base',
  }[size];

  const ringStyle = isUnviewed
    ? 'p-[2px] bg-gradient-to-tr from-pink-500 via-rose-400 to-cyan-400 rounded-full'
    : 'p-[2px] bg-gray-300 dark:bg-gray-600 rounded-full';

  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center cursor-pointer group select-none shrink-0"
    >
      <div className={`${ringStyle} transition-transform group-hover:scale-105 active:scale-95 shadow-md`}>
        <div className={`${sizeClasses} rounded-full overflow-hidden relative bg-slate-900 border-2 border-white dark:border-[#111b21] flex items-center justify-center`}>
          {status.mediaType === 'video' && status.mediaUrl ? (
            <div className="w-full h-full relative">
              <video
                src={status.mediaUrl}
                className="w-full h-full object-cover"
                muted
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-current" />
              </div>
            </div>
          ) : status.mediaUrl ? (
            <img
              src={status.mediaUrl}
              alt={status.userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-1 text-center font-semibold text-white text-[10px] line-clamp-2"
              style={{ backgroundColor: status.bgColor || '#ff2e93' }}
            >
              {status.text || 'Status'}
            </div>
          )}
        </div>
      </div>

      {showDetailsBadge && (
        <div className="absolute -bottom-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[10px] text-white border border-white/20 shadow">
          {(status.likesCount || 0) > 0 && (
            <span className="flex items-center gap-0.5 text-rose-400 font-bold">
              <Heart className="w-2.5 h-2.5 fill-current" /> {status.likesCount}
            </span>
          )}
          <span className="flex items-center gap-0.5 font-medium text-slate-200">
            <Eye className="w-2.5 h-2.5 text-cyan-400" /> {status.seenCount || 0}
          </span>
        </div>
      )}
    </div>
  );
};
