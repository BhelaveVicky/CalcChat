import React from 'react';
import { Plus, Eye, Heart, Camera } from 'lucide-react';
import { StatusUpdate } from '../../types';
import { formatStatusTime } from '../../lib/dateUtils';

interface StatusCardProps {
  statusGroup: {
    userId: string;
    userName: string;
    userAvatar: string;
    statuses: StatusUpdate[];
    hasUnviewed: boolean;
    latestCreatedAt: any;
  };
  isSelf?: boolean;
  onClick: () => void;
  onAddStatus?: () => void;
  isDark?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  statusGroup,
  isSelf = false,
  onClick,
  onAddStatus,
  isDark = true,
}) => {
  const { userName, userAvatar, statuses, hasUnviewed, latestCreatedAt } = statusGroup;
  const latestStatus = statuses[statuses.length - 1];
  const timeFormatted = formatStatusTime(latestCreatedAt || latestStatus?.createdAt);

  // Segmented Ring styling for multiple status items
  const ringColor = isSelf && statuses.length === 0
    ? 'border-2 border-dashed border-gray-400'
    : hasUnviewed
    ? 'p-[2.5px] bg-gradient-to-tr from-[#ff2e93] via-[#ff60b5] to-[#ff758c] rounded-full'
    : 'p-[2px] bg-gray-400 dark:bg-gray-600 rounded-full';

  return (
    <div
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer active:scale-98 select-none ${
        isDark ? 'hover:bg-[#202c33]' : 'hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="relative shrink-0">
          <div className={`${ringColor} transition-transform shadow-sm`}>
            <div className="w-13 h-13 rounded-full overflow-hidden relative bg-slate-800 border-2 border-white dark:border-[#111b21] flex items-center justify-center">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#ff2e93]/20 text-[#ff2e93] flex items-center justify-center font-bold text-base">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          </div>

          {isSelf && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onAddStatus) onAddStatus();
              }}
              className="absolute bottom-0 right-0 p-1 rounded-full bg-gradient-to-r from-[#ff2e93] to-[#ff60b5] text-white shadow-md border-2 border-white dark:border-[#111b21] hover:scale-110 active:scale-95 transition-transform"
              title="Add Status Update"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className={`font-bold text-sm truncate flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <span>{isSelf ? 'My Status' : userName}</span>
          </h4>
          <p className={`text-xs truncate mt-0.5 font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
            {statuses.length === 0
              ? 'Tap to add status update'
              : timeFormatted}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {statuses.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/10 dark:bg-white/5 text-xs text-gray-500 dark:text-gray-400 font-semibold">
            <span>{statuses.length}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff2e93]" />
          </div>
        )}
      </div>
    </div>
  );
};
