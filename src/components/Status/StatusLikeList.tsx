import React from 'react';
import { Heart, User } from 'lucide-react';
import { StatusLikeRecord } from '../../types';
import { useVault } from '../../context/VaultContext';

interface StatusLikeListProps {
  likeRecords: StatusLikeRecord[];
  isDark?: boolean;
}

export const StatusLikeList: React.FC<StatusLikeListProps> = ({
  likeRecords,
  isDark = true,
}) => {
  const { contacts, allRegisteredUsers, customNicknames, getContactDisplayName } = useVault();

  const resolveUserInfo = (record: StatusLikeRecord) => {
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
        <h4 className="font-bold text-sm flex items-center gap-2 text-rose-500">
          <Heart className="w-4 h-4 fill-current" />
          <span>Liked by ({likeRecords.length})</span>
        </h4>
      </div>

      {likeRecords.length === 0 ? (
        <div className={`py-6 text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          No likes yet. Tap the ❤️ button on status to express appreciation.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar pr-1">
          {likeRecords.map((record) => {
            const info = resolveUserInfo(record);
            return (
              <div
                key={record.id || record.userId}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                  isDark ? 'bg-rose-500/15 hover:bg-rose-500/25' : 'bg-rose-50 hover:bg-rose-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {info.avatar ? (
                    <img
                      src={info.avatar}
                      alt={info.name}
                      className="w-10 h-10 rounded-full object-cover border border-rose-400/40 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <span>{info.name}</span>
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-current shrink-0 inline" />
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'} font-mono mt-0.5`}>
                      {record.likeTime || 'Recently'}
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
