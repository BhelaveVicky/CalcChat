import React from 'react';

interface StatusReactionBarProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
  isDark?: boolean;
}

const STATUS_REACTION_EMOJIS = ['❤️', '😂', '😍', '😮', '😢', '🔥', '👍'];

export const StatusReactionBar: React.FC<StatusReactionBarProps> = ({
  onSelectEmoji,
  onClose,
  isDark = true,
}) => {
  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 p-2 px-3 rounded-full shadow-2xl backdrop-blur-xl border animate-scale-up z-40 ${
        isDark
          ? 'bg-black/80 border-white/20 text-white'
          : 'bg-white/90 border-gray-200 text-gray-900'
      }`}
    >
      {STATUS_REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectEmoji(emoji);
            if (onClose) onClose();
          }}
          className="text-2xl hover:scale-130 active:scale-95 transition-transform p-1 cursor-pointer"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
