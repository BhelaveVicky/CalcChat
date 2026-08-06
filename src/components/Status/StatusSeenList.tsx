import React from 'react';
import { Eye, User } from 'lucide-react';
import { StatusSeenRecord } from '../../types';
import { useVault } from '../../context/VaultContext';

interface StatusSeenListProps {
  seenRecords: StatusSeenRecord[];
  isDark?: boolean;
}

export const StatusSeenList: React.FC<StatusSeenListProps> = ({
  seenRecords,
  isDark = true,
}) => {
  const { contacts, allRegisteredUsers, customNicknames, getContactDisplayName } = useVault();

  const resolveUserInfo = (record: StatusSeenRecord) => {
    const contact = contacts.find(c => c.id === record.userId);
    const regUser = allRegisteredUsers.find(u => u.uid === record.userId || u.id === record.userId);
    
    const name = customNicknames[record.userId] || 
                 (contact ? getContactDisplayName(contact) : null) || 
                 regUser?.displayName || 
                 regUser?.username || 
                 (record.userName && record.userName !== 'User' ? record.userName : '') || 
                 record.userName || 
                 'User';
                 
    const avatar = contact?.avatar || regUser?.photoURL || regUser?.avatar || record.userAvatar;
    return { name, avatar };
  };

  return (
    <div className="w-full space-y-3">
      <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <h4 className="font-bold text-sm flex items-center gap-2 text-cyan-400">
          <Eye className="w-4 h-4" />
          <span>Viewed by ({seenRecords.length})</span>
        </h4>
      </div>

      {seenRecords.length === 0 ? (
        <div className={`py-8 text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          No views yet. When friends watch this status, they will appear here.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar pr-1">
          {seenRecords.map((record) => {
            const info = resolveUserInfo(record);
            return (
              <div
                key={record.id || record.userId}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                  isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {info.avatar ? (
                    <img
                      src={info.avatar}
                      alt={info.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {info.name}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'} font-mono mt-0.5`}>
                      {record.seenTime || 'Recently'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
