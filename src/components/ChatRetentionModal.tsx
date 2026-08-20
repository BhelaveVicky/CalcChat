import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { DeleteChatsSection } from './DeleteChatsSection';
import { ChatRetentionMode } from '../types';

interface ChatRetentionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName?: string;
  currentMode: ChatRetentionMode;
  onSaveMode: (mode: ChatRetentionMode) => Promise<void> | void;
  isDark?: boolean;
}

export const ChatRetentionModal: React.FC<ChatRetentionModalProps> = ({
  isOpen,
  onClose,
  contactName = 'this chat',
  currentMode = 'never',
  onSaveMode,
  isDark = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border relative flex flex-col gap-4 animate-in zoom-in-95 duration-200 ${
        isDark
          ? 'bg-[#111b21] border-[#263238] text-[#e9edef]'
          : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer ${
            isDark ? 'hover:bg-[#202c33] text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col gap-1 pr-8">
          <h3 className={`text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <span>Disappearing Messages</span>
            <ShieldCheck className="w-5 h-5 text-[#ff2e93]" />
          </h3>
          <p className={`text-xs font-medium ${isDark ? 'text-[#8696a0]' : 'text-gray-600'}`}>
            Set automatic message deletion policy for <strong className={isDark ? 'text-white font-bold' : 'text-gray-900 font-bold'}>{contactName}</strong>.
          </p>
        </div>

        {/* Delete Chats Reference Card Section */}
        <DeleteChatsSection
          selectedMode={currentMode}
          onSelectMode={async (mode) => {
            await onSaveMode(mode);
            onClose();
          }}
          isDark={isDark}
        />

        {/* Footer Note */}
        <p className={`text-[11px] text-center leading-relaxed px-2 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
          New messages sent in this chat will follow the selected retention rule. Unseen messages are preserved until viewed.
        </p>
      </div>
    </div>
  );
};

export default ChatRetentionModal;
