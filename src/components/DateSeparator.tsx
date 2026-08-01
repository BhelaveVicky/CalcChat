import React from 'react';

interface DateSeparatorProps {
  dateLabel: string;
  isDark?: boolean;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ dateLabel, isDark = true }) => {
  return (
    <div className="flex items-center justify-center my-3.5 sticky top-2 z-10 pointer-events-none select-none">
      <div
        className={`px-3 py-1 rounded-lg text-xs font-semibold shadow-xs tracking-wide uppercase transition-colors ${
          isDark
            ? 'bg-[#182229] text-[#8696a0] border border-[#222d34]/60'
            : 'bg-white/90 text-gray-600 border border-gray-200/80'
        } backdrop-blur-xs`}
      >
        {dateLabel}
      </div>
    </div>
  );
};
