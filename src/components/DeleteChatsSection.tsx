import React from 'react';
import { Eye, Clock, Calendar, Lock } from 'lucide-react';
import { ChatRetentionMode } from '../types';

interface DeleteChatsSectionProps {
  selectedMode: ChatRetentionMode;
  onSelectMode: (mode: ChatRetentionMode) => void;
  isDark?: boolean;
  disabled?: boolean;
}

export const DeleteChatsSection: React.FC<DeleteChatsSectionProps> = ({
  selectedMode = 'never',
  onSelectMode,
  isDark = true,
  disabled = false,
}) => {
  const options: Array<{
    id: ChatRetentionMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    badgeStyle: string;
  }> = [
    {
      id: 'after_viewing',
      title: 'Chats After Viewing',
      description: 'Messages will be deleted when you leave the chat',
      icon: <Eye className="w-5 h-5" />,
      badgeStyle: isDark ? 'bg-pink-950/50 text-pink-400 border border-pink-500/20' : 'bg-pink-100 text-pink-600',
    },
    {
      id: '24_hours',
      title: '24 Hours After Viewing',
      description: 'Messages will be deleted 24 hours after you view them',
      icon: <Clock className="w-5 h-5" />,
      badgeStyle: isDark ? 'bg-purple-950/50 text-purple-400 border border-purple-500/20' : 'bg-purple-100 text-purple-600',
    },
    {
      id: '1_week',
      title: '1 Week After Viewing',
      description: 'Messages will be deleted 1 week after you view them',
      icon: <Calendar className="w-5 h-5" />,
      badgeStyle: isDark ? 'bg-sky-950/50 text-sky-400 border border-sky-500/20' : 'bg-sky-100 text-sky-600',
    },
    {
      id: 'never',
      title: 'Never',
      description: 'Messages will never be deleted',
      icon: <Lock className="w-5 h-5" />,
      badgeStyle: isDark ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-100 text-emerald-600',
    },
  ];

  return (
    <div className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all ${
      isDark 
        ? 'bg-[#182229] border-[#263238] text-[#e9edef]' 
        : 'bg-white border-gray-200 text-gray-800 shadow-xs'
    }`}>
      {/* Header Label */}
      <h4 className={`text-[11px] font-bold tracking-wider uppercase mb-3.5 select-none ${
        isDark ? 'text-[#8696a0]' : 'text-gray-500'
      }`}>
        DELETE CHATS
      </h4>

      {/* Options List */}
      <div className={`space-y-1 divide-y ${isDark ? 'divide-[#202c33]' : 'divide-gray-100'}`}>
        {options.map((opt) => {
          const isSelected = selectedMode === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => !disabled && onSelectMode(opt.id)}
              className={`pt-3 pb-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3.5 cursor-pointer transition-colors rounded-xl px-2 -mx-2 select-none ${
                isSelected
                  ? isDark
                    ? 'bg-[#202c33]/90 ring-1 ring-[#ff2e93]/40'
                    : 'bg-pink-50/80 ring-1 ring-pink-400/40'
                  : isDark
                  ? 'hover:bg-[#202c33]/50'
                  : 'hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                  e.preventDefault();
                  onSelectMode(opt.id);
                }
              }}
            >
              {/* Left Badge & Text Container */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className={`p-2.5 rounded-2xl shrink-0 flex items-center justify-center ${opt.badgeStyle}`}>
                  {opt.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <h5 className={`font-bold text-xs sm:text-sm leading-tight truncate ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {opt.title}
                  </h5>
                  <p className={`text-[11px] sm:text-xs font-normal leading-normal mt-0.5 truncate sm:whitespace-normal ${
                    isDark ? 'text-[#94a3b8]' : 'text-gray-600'
                  }`}>
                    {opt.description}
                  </p>
                </div>
              </div>

              {/* Right Radio Indicator (CalcChat Pink Accent) */}
              <div className="shrink-0 pl-1">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'border-[#ff2e93] bg-[#ff2e93]'
                    : isDark
                    ? 'border-gray-600 bg-transparent'
                    : 'border-gray-300 bg-white'
                }`}>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-75" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeleteChatsSection;
