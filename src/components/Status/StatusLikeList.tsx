import React from 'react';
import { Heart, User } from 'lucide-react';
import { StatusLikeRecord } from '../../types';

interface StatusLikeListProps {
  likeRecords: StatusLikeRecord[];
  isDark?: boolean;
}

export const StatusLikeList: React.FC<StatusLikeListProps> = ({
  likeRecords,
  isDark = true,
}) => {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
        <h4 className="font-bold text-sm flex items-center gap-2 text-rose-500">
          <Heart className="w-4 h-4 fill-current" />
          <span>Liked by ({likeRecords.length})</span>
        </h4>
      </div>

      {likeRecords.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-400">
          No likes yet. Tap the ❤️ button on status to express appreciation.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar pr-1">
          {likeRecords.map((record) => (
            <div
              key={record.id || record.userId}
              className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                isDark ? 'bg-rose-500/10 hover:bg-rose-500/20' : 'bg-rose-50 hover:bg-rose-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {record.userAvatar ? (
                  <img
                    src={record.userAvatar}
                    alt={record.userName}
                    className="w-9 h-9 rounded-full object-cover border border-rose-400/40 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-xs truncate text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    <span>{record.userName}</span>
                    <Heart className="w-3 h-3 text-rose-500 fill-current shrink-0 inline" />
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                    {record.likeTime || 'Today • 1:30 PM'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
