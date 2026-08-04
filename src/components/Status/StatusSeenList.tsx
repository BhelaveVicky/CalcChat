import React from 'react';
import { Eye, User } from 'lucide-react';
import { StatusSeenRecord } from '../../types';

interface StatusSeenListProps {
  seenRecords: StatusSeenRecord[];
  isDark?: boolean;
}

export const StatusSeenList: React.FC<StatusSeenListProps> = ({
  seenRecords,
  isDark = true,
}) => {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
        <h4 className="font-bold text-sm flex items-center gap-2 text-cyan-500">
          <Eye className="w-4 h-4" />
          <span>Viewed by ({seenRecords.length})</span>
        </h4>
      </div>

      {seenRecords.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400">
          No views yet. When friends watch this status, they will appear here.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar pr-1">
          {seenRecords.map((record) => (
            <div
              key={record.id || record.userId}
              className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {record.userAvatar ? (
                  <img
                    src={record.userAvatar}
                    alt={record.userName}
                    className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-xs truncate text-gray-900 dark:text-gray-100">
                    {record.userName}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                    {record.seenTime || 'Today • 2:15 PM'}
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
