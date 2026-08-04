import React, { useState } from 'react';
import { Eye, Heart, MessageCircle, Trash2, X, ChevronUp } from 'lucide-react';
import { StatusUpdate, StatusSeenRecord, StatusLikeRecord, StatusReactionRecord } from '../../types';
import { StatusSeenList } from './StatusSeenList';
import { StatusLikeList } from './StatusLikeList';
import { formatStatusTime } from '../../lib/dateUtils';

interface StatusDetailsProps {
  status: StatusUpdate;
  seenRecords: StatusSeenRecord[];
  likeRecords: StatusLikeRecord[];
  reactionRecords?: StatusReactionRecord[];
  onDeleteStatus?: (statusId: string) => void;
  onClose: () => void;
  isDark?: boolean;
}

export const StatusDetails: React.FC<StatusDetailsProps> = ({
  status,
  seenRecords,
  likeRecords,
  reactionRecords = [],
  onDeleteStatus,
  onClose,
  isDark = true,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'likes' | 'views'>('all');

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-lg mx-auto rounded-t-3xl p-5 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-slide-up ${
          isDark
            ? 'bg-[#111b21] text-[#e9edef] border-t border-white/10'
            : 'bg-white text-gray-900 border-t border-gray-200'
        }`}
      >
        {/* Top Handle / Drag Bar */}
        <div className="w-12 h-1.5 bg-gray-400/40 rounded-full mx-auto mb-4 shrink-0" />

        {/* Header Summary */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <span>Status Activity</span>
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Uploaded {formatStatusTime(status.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onDeleteStatus && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this status update for everyone?')) {
                    onDeleteStatus(status.id);
                    onClose();
                  }
                }}
                className="p-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                title="Delete Status"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-pink-500/20 border-2 border-pink-500 text-pink-500'
                : 'bg-gray-500/10 border border-transparent text-gray-400 hover:bg-gray-500/20'
            }`}
          >
            <span className="text-lg font-black">{likeRecords.length + seenRecords.length}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider">Total</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('likes')}
            className={`p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'likes'
                ? 'bg-rose-500/20 border-2 border-rose-500 text-rose-500'
                : 'bg-gray-500/10 border border-transparent text-gray-400 hover:bg-gray-500/20'
            }`}
          >
            <span className="text-lg font-black flex items-center gap-1">
              <Heart className="w-4 h-4 fill-current text-rose-500 inline" />
              {likeRecords.length}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider">Likes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('views')}
            className={`p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeTab === 'views'
                ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400'
                : 'bg-gray-500/10 border border-transparent text-gray-400 hover:bg-gray-500/20'
            }`}
          >
            <span className="text-lg font-black flex items-center gap-1">
              <Eye className="w-4 h-4 text-cyan-400 inline" />
              {seenRecords.length}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider">Views</span>
          </button>
        </div>

        {/* Content Lists */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 no-scrollbar">
          {(activeTab === 'all' || activeTab === 'likes') && (
            <StatusLikeList likeRecords={likeRecords} isDark={isDark} />
          )}

          {(activeTab === 'all' || activeTab === 'views') && (
            <StatusSeenList seenRecords={seenRecords} isDark={isDark} />
          )}
        </div>
      </div>
    </div>
  );
};
