import React, { useState } from 'react';
import { Plus, X, Smile } from 'lucide-react';

interface EmojiReactionBarProps {
  isDark: boolean;
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  currentReaction?: string;
}

const QUICK_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '😀', '🔥'];

const MORE_EMOJIS = [
  '🥰', '😍', '🥳', '😎', '🎉', '👏', '💯', '✨', 
  '🤔', '🤡', '💀', '💩', '🤯', '😴', '👀', '🤝',
  '🙌', '🤩', '💩', '💥', '💔', '⚡', '😇', '🚀'
];


export const EmojiReactionBar: React.FC<EmojiReactionBarProps> = ({
  isDark,
  onSelectEmoji,
  onClose,
  currentReaction,
}) => {
  const [showMorePicker, setShowMorePicker] = useState(false);

  return (
    <div className="relative z-30 animate-scale-in">
      {!showMorePicker ? (
        <div className={`flex items-center gap-1.5 p-1.5 rounded-full shadow-2xl border backdrop-blur-md transition-all ${
          isDark 
            ? 'bg-[#202c33]/95 border-pink-500/40 text-white shadow-pink-900/20' 
            : 'bg-white/95 border-pink-300 text-gray-900 shadow-pink-500/10'
        }`}>
          {QUICK_EMOJIS.map((emoji) => {
            const isSelected = currentReaction === emoji;
            return (
              <button
                key={emoji}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEmoji(emoji);
                }}
                className={`text-2xl p-1.5 rounded-full hover:scale-125 active:scale-95 transition-transform flex items-center justify-center cursor-pointer relative ${
                  isSelected ? 'bg-pink-500/20 ring-2 ring-pink-500' : 'hover:bg-black/10 dark:hover:bg-white/10'
                }`}
                title={`React ${emoji}`}
              >
                <span>{emoji}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMorePicker(true);
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer border ${
              isDark 
                ? 'bg-[#2a3942] border-pink-500/30 text-pink-400 hover:bg-pink-500/20' 
                : 'bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100'
            }`}
            title="More Reactions"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      ) : (
        <div className={`p-3 rounded-2xl shadow-2xl border backdrop-blur-md w-72 max-w-[90vw] animate-slide-up ${
          isDark ? 'bg-[#202c33] border-pink-500/40 text-white' : 'bg-white border-pink-300 text-gray-900'
        }`}>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-pink-500/20">
            <span className="text-xs font-bold flex items-center gap-1.5 text-pink-500">
              <Smile className="w-4 h-4" /> Pick Reaction
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMorePicker(false);
              }}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-black/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto no-scrollbar p-1">
            {MORE_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEmoji(emoji);
                }}
                className="text-2xl p-1.5 rounded-xl hover:bg-pink-500/20 hover:scale-125 active:scale-90 transition-all flex items-center justify-center cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
