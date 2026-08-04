import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, CornerUpLeft, Forward, Trash2, MoreVertical, Copy, Pin, Check } from 'lucide-react';
import { Message } from '../types';

interface MessageSelectionToolbarProps {
  selectedMessages: Message[];
  onClearSelection: () => void;
  onReply: (msg: Message) => void;
  onForward: (msg: Message) => void;
  onDelete: (messages: Message[]) => void;
  onCopy: (messages: Message[]) => void;
  onPin: (msg: Message) => void;
}
export const MessageSelectionToolbar: React.FC<MessageSelectionToolbarProps> = ({
  selectedMessages,
  onClearSelection,
  onReply,
  onForward,
  onDelete,
  onCopy,
  onPin,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSingle = selectedMessages.length === 1;
  const singleMsg = isSingle ? selectedMessages[0] : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full h-[56px] px-4 bg-[#ec4899] text-white flex items-center justify-between shrink-0 z-30 shadow-md animate-slide-down font-sans select-none transition-all duration-200">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
          title="Cancel selection"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-wide text-white">
            {selectedMessages.length}
          </span>
          <span className="text-sm font-semibold text-pink-100">
            Selected
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 relative">
        {/* Reply (when 1 selected) */}
        {isSingle && singleMsg && (
          <button
            type="button"
            onClick={() => onReply(singleMsg)}
            className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
            title="Reply"
          >
            <CornerUpLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}

        {/* Forward (when 1 selected) */}
        {isSingle && singleMsg && (
          <button
            type="button"
            onClick={() => onForward(singleMsg)}
            className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
            title="Forward"
          >
            <Forward className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}

        {/* Copy (single or multi) */}
        <button
          type="button"
          onClick={() => onCopy(selectedMessages)}
          className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
          title="Copy"
        >
          <Copy className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(selectedMessages)}
          className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer hover:text-pink-100"
          title="Delete"
        >
          <Trash2 className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* More Menu (when 1 selected) */}
        {isSingle && singleMsg && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-5 h-5 stroke-[2.2]" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-11 w-48 rounded-2xl bg-[#1f2c34] text-[#e9edef] border border-pink-500/30 shadow-2xl py-2 z-50 animate-scale-in text-sm font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onCopy(selectedMessages);
                  }}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-pink-500/20 hover:text-pink-300 transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-pink-400" />
                  <span>Copy</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onPin(singleMsg);
                  }}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-pink-500/20 hover:text-pink-300 transition-colors cursor-pointer border-t border-gray-700/50"
                >
                  <Pin className="w-4 h-4 text-pink-400" />
                  <span>{singleMsg.isPinned ? 'Unpin Message' : 'Pin Message'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
