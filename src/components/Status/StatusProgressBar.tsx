import React from 'react';

interface StatusProgressBarProps {
  count: number;
  currentIndex: number;
  progress: number; // 0 to 100 for active bar
  isPaused?: boolean;
}

export const StatusProgressBar: React.FC<StatusProgressBarProps> = ({
  count,
  currentIndex,
  progress,
  isPaused = false,
}) => {
  if (count <= 0) return null;

  return (
    <div className="w-full flex items-center gap-1.5 px-3 py-2 z-30">
      {Array.from({ length: count }).map((_, index) => {
        let barFillPercent = 0;
        if (index < currentIndex) {
          barFillPercent = 100;
        } else if (index === currentIndex) {
          barFillPercent = Math.min(100, Math.max(0, progress));
        } else {
          barFillPercent = 0;
        }

        return (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-xs relative"
          >
            <div
              className={`h-full bg-white rounded-full ${
                isPaused ? 'transition-none' : 'transition-all ease-linear'
              }`}
              style={{
                width: `${barFillPercent}%`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
