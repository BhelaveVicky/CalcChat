import React, { useState } from 'react';
import { X, Search, Users, ChevronRight } from 'lucide-react';

export interface FollowerUser {
  uid: string;
  name: string;
  username: string;
  photoURL?: string;
  avatar?: string;
  bio?: string;
  status?: string;
}

interface FollowersListProps {
  isOpen: boolean;
  onClose: () => void;
  followers: FollowerUser[];
  title?: string;
  onSelectUser?: (userId: string) => void;
  isDark?: boolean;
}
export const FollowersList: React.FC<FollowersListProps> = ({
  isOpen,
  onClose,
  followers,
  title = 'Followers',
  onSelectUser,
  isDark = true,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredFollowers = followers.filter((f) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      (f.name && f.name.toLowerCase().includes(query)) ||
      (f.username && f.username.toLowerCase().includes(query))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans">
      <div className={`w-full max-w-md rounded-3xl p-5 shadow-2xl border max-h-[85vh] flex flex-col ${
        isDark ? 'bg-[#111b21] border-[#202c33] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#202c33] shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00a8ff]" />
            <h3 className="font-bold text-lg">{title} ({followers.length})</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-500/20 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="my-3 shrink-0">
          <div className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-2 border transition-colors ${
            isDark ? 'bg-[#0b141a] border-[#202c33] text-white' : 'bg-gray-100 border-gray-200 text-gray-900'
          }`}>
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search followers..."
              className="w-full bg-transparent text-xs sm:text-sm focus:outline-none placeholder-gray-500"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')}>
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Followers List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
          {filteredFollowers.length > 0 ? (
            filteredFollowers.map((follower) => {
              const avatar = follower.photoURL || follower.avatar;
              const username = follower.username ? `@${follower.username.replace(/^@/, '')}` : '@user';

              return (
                <div
                  key={follower.uid}
                  onClick={() => {
                    if (onSelectUser) onSelectUser(follower.uid);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                    isDark
                      ? 'bg-[#1f2c34]/50 hover:bg-[#1f2c34] border border-[#202c33]/40'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={follower.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#00a8ff]/30 shadow-xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#1e293b] text-[#00a8ff] font-bold flex items-center justify-center shrink-0 border border-[#00a8ff]/30">
                        {follower.name ? follower.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 text-left">
                      <p className={`font-bold text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {follower.name || 'CalChat User'}
                      </p>
                      <p className="text-[11px] text-[#00a8ff] font-medium truncate">
                        {username}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
              <Users className="w-10 h-10 text-gray-500 mb-2 opacity-50" />
              <p className="text-xs font-semibold">No followers found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
