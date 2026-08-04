import React, { useState } from 'react';
import { Send, Smile } from 'lucide-react';
import { StatusUpdate } from '../../types';
import { StatusReactionBar } from './StatusReactionBar';

interface StatusReplyProps {
  status: StatusUpdate;
  onSendReply: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  isDark?: boolean;
}

export const StatusReply: React.FC<StatusReplyProps> = ({
  status,
  onSendReply,
  onSendReaction,
  isDark = true,
}) => {
  const [replyText, setReplyText] = useState('');
  const [showReactions, setShowReactions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendReply(replyText.trim());
    setReplyText('');
  };

  return (
    <div className="w-full flex flex-col items-center gap-2 z-30 px-3 pb-3">
      {showReactions && (
        <div className="mb-1">
          <StatusReactionBar
            isDark={isDark}
            onSelectEmoji={(emoji) => {
              onSendReaction(emoji);
              setShowReactions(false);
            }}
            onClose={() => setShowReactions(false)}
          />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full flex items-center gap-2 max-w-lg mx-auto"
      >
        <button
          type="button"
          onClick={() => setShowReactions(!showReactions)}
          className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors cursor-pointer shrink-0"
          title="Quick Emoji Reaction"
        >
          <Smile className="w-5 h-5" />
        </button>

        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${status.userName}...`}
            className="w-full bg-black/40 hover:bg-black/50 focus:bg-black/60 text-white placeholder-white/70 border border-white/20 rounded-full px-4 py-2.5 text-sm outline-none backdrop-blur-md transition-all"
          />
          {replyText.trim().length > 0 && (
            <button
              type="submit"
              className="absolute right-1.5 p-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white transition-all cursor-pointer shadow"
            >
              <Send className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
