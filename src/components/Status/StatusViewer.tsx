import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Eye, ChevronLeft, ChevronRight, MoreVertical, Trash2, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { StatusUpdate, StatusSeenRecord, StatusLikeRecord } from '../../types';
import { StatusProgressBar } from './StatusProgressBar';
import { StatusReply } from './StatusReply';
import { StatusDetails } from './StatusDetails';
import { formatStatusTime } from '../../lib/dateUtils';

interface StatusUserGroup {
  userId: string;
  userName: string;
  userAvatar: string;
  statuses: StatusUpdate[];
}

interface StatusViewerProps {
  statusGroups: StatusUserGroup[];
  initialGroupIndex?: number;
  initialStatusIndex?: number;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  onClose: () => void;
  onLikeStatus: (statusId: string) => Promise<void>;
  onMarkSeen: (statusId: string) => Promise<void>;
  onSendReply: (status: StatusUpdate, replyText: string) => Promise<void>;
  onSendReaction: (status: StatusUpdate, emoji: string) => Promise<void>;
  onDeleteStatus: (statusId: string) => Promise<void>;
  getSeenRecords?: (statusId: string) => StatusSeenRecord[];
  getLikeRecords?: (statusId: string) => StatusLikeRecord[];
  isDark?: boolean;
}

const DEFAULT_IMAGE_DURATION_MS = 5000; // 5 seconds for image slides

export const StatusViewer: React.FC<StatusViewerProps> = ({
  statusGroups,
  initialGroupIndex = 0,
  initialStatusIndex = 0,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onClose,
  onLikeStatus,
  onMarkSeen,
  onSendReply,
  onSendReaction,
  onDeleteStatus,
  getSeenRecords = () => [],
  getLikeRecords = () => [],
  isDark = true,
}) => {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [statusIndex, setStatusIndex] = useState(initialStatusIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartYRef = useRef<number>(0);

  const currentGroup = statusGroups[groupIndex];
  const currentStatus = currentGroup?.statuses[statusIndex];
  const isOwner = currentStatus?.userId === currentUserId;
  const isLiked = currentStatus?.likes?.includes(currentUserId);

  // Mark status as seen when slide changes
  useEffect(() => {
    if (currentStatus && !isOwner) {
      onMarkSeen(currentStatus.id);
    }
  }, [currentStatus?.id, isOwner]);

  // Handle slide progress timer
  useEffect(() => {
    if (!currentStatus || isPaused || showDetailsModal) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setProgress(0);
    const intervalMs = 50;

    // If status is a video, timer advances based on video element playback
    if (currentStatus.mediaType === 'video') {
      const updateVideoProgress = () => {
        if (videoRef.current && videoRef.current.duration) {
          const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
          setProgress(currentProgress);
        }
      };

      timerRef.current = setInterval(updateVideoProgress, intervalMs);
    } else {
      // Image or text status: 5 seconds timer
      const totalSteps = DEFAULT_IMAGE_DURATION_MS / intervalMs;
      let stepCount = 0;

      timerRef.current = setInterval(() => {
        stepCount++;
        const currentProgress = (stepCount / totalSteps) * 100;
        setProgress(currentProgress);

        if (stepCount >= totalSteps) {
          clearInterval(timerRef.current!);
          handleNextSlide();
        }
      }, intervalMs);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [groupIndex, statusIndex, isPaused, showDetailsModal, currentStatus?.id]);

  const handleNextSlide = () => {
    if (!currentGroup) return;

    if (statusIndex < currentGroup.statuses.length - 1) {
      setStatusIndex(statusIndex + 1);
      setProgress(0);
    } else if (groupIndex < statusGroups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStatusIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevSlide = () => {
    if (statusIndex > 0) {
      setStatusIndex(statusIndex - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      const prevGroup = statusGroups[groupIndex - 1];
      setGroupIndex(groupIndex - 1);
      setStatusIndex(prevGroup.statuses.length - 1);
      setProgress(0);
    }
  };

  const handleLikeToggle = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentStatus) return;
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 600);
    await onLikeStatus(currentStatus.id);
  };

  // Touch gesture for swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    setIsPaused(true);
    if (videoRef.current) videoRef.current.pause();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchEndY - touchStartYRef.current;

    setIsPaused(false);
    if (videoRef.current && isVideoPlaying) videoRef.current.play();

    if (diffY > 120) {
      // Swipe down gesture detected
      onClose();
    }
  };

  if (!currentGroup || !currentStatus) return null;

  const seenRecords = getSeenRecords(currentStatus.id);
  const likeRecords = getLikeRecords(currentStatus.id);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none animate-fade-in">
      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 z-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-2 pb-6 px-3">
        {/* Segmented Progress Bar */}
        <StatusProgressBar
          count={currentGroup.statuses.length}
          currentIndex={statusIndex}
          progress={progress}
          isPaused={isPaused}
        />

        {/* User Info Bar */}
        <div className="flex items-center justify-between px-3 mt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full border-2 border-pink-500 overflow-hidden shrink-0 bg-slate-800 shadow">
              {currentGroup.userAvatar ? (
                <img
                  src={currentGroup.userAvatar}
                  alt={currentGroup.userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-pink-500/20 text-pink-500 flex items-center justify-center font-bold text-sm">
                  {currentGroup.userName?.charAt(0) || 'U'}
                </div>
              )}
            </div>

            <div className="min-w-0 text-white">
              <h4 className="font-bold text-sm truncate flex items-center gap-1.5 drop-shadow-md">
                <span>{currentGroup.userName}</span>
              </h4>
              <p className="text-[11px] text-white/80 font-mono drop-shadow">
                {formatStatusTime(currentStatus.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white">
            {currentStatus.mediaType === 'video' && (
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Status Media Stage */}
      <div
        className="relative flex-1 w-full h-full flex items-center justify-center bg-black"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => {
          setIsPaused(true);
          if (videoRef.current) videoRef.current.pause();
        }}
        onMouseUp={() => {
          setIsPaused(false);
          if (videoRef.current && isVideoPlaying) videoRef.current.play();
        }}
      >
        {/* Left Tap Zone for Previous Slide */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            handlePrevSlide();
          }}
          className="absolute left-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer"
        />

        {/* Right Tap Zone for Next Slide */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleNextSlide();
          }}
          className="absolute right-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer"
        />

        {/* Media Render */}
        {currentStatus.mediaType === 'video' ? (
          <div className="w-full h-full flex items-center justify-center relative">
            <video
              ref={videoRef}
              src={currentStatus.mediaUrl}
              autoPlay
              playsInline
              muted={isMuted}
              onEnded={handleNextSlide}
              onError={(e) => {
                console.warn('Video playback error in StatusViewer:', e);
              }}
              className="max-h-full max-w-full object-contain mx-auto"
            />
          </div>
        ) : currentStatus.mediaUrl ? (
          <img
            src={currentStatus.mediaUrl}
            alt="Status Media"
            onError={(e) => {
              console.warn('Image load error in StatusViewer:', e);
            }}
            className="max-h-full max-w-full object-contain mx-auto"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
            style={{ backgroundColor: currentStatus.bgColor || '#ff2e93' }}
          >
            <p className="text-white text-2xl sm:text-3xl font-extrabold max-w-md leading-relaxed drop-shadow-lg">
              {currentStatus.text}
            </p>
          </div>
        )}

        {/* Caption Overlay */}
        {currentStatus.caption && currentStatus.mediaUrl && (
          <div className="absolute bottom-20 inset-x-0 z-30 px-6 py-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-center">
            <p className="text-white text-sm sm:text-base font-semibold drop-shadow-md">
              {currentStatus.caption}
            </p>
          </div>
        )}

        {/* Big Heart Animation on Double Tap or Like */}
        {likeAnim && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-ping">
            <Heart className="w-24 h-24 text-rose-500 fill-current drop-shadow-2xl" />
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="absolute bottom-0 inset-x-0 z-40 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6">
        {isOwner ? (
          /* Owner View Details Button */
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setShowDetailsModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs border border-white/20 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>{seenRecords.length} Views</span>
              <span className="w-1 h-1 rounded-full bg-white/50" />
              <Heart className="w-4 h-4 text-rose-500 fill-current" />
              <span>{likeRecords.length} Likes</span>
            </button>
          </div>
        ) : (
          /* Viewer Reply & Like Controls */
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            <div className="flex-1">
              <StatusReply
                status={currentStatus}
                onSendReply={(text) => onSendReply(currentStatus, text)}
                onSendReaction={(emoji) => onSendReaction(currentStatus, emoji)}
                isDark={isDark}
              />
            </div>

            <button
              type="button"
              onClick={handleLikeToggle}
              className={`p-3 rounded-full backdrop-blur-md transition-transform active:scale-90 cursor-pointer shadow-lg shrink-0 ${
                isLiked
                  ? 'bg-rose-500 text-white scale-110'
                  : 'bg-black/40 hover:bg-black/60 text-white border border-white/20'
              }`}
              title={isLiked ? 'Unlike Status' : 'Like Status'}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Owner Details Sheet Modal */}
      {showDetailsModal && isOwner && (
        <StatusDetails
          status={currentStatus}
          seenRecords={seenRecords}
          likeRecords={likeRecords}
          onDeleteStatus={onDeleteStatus}
          onClose={() => setShowDetailsModal(false)}
          isDark={isDark}
        />
      )}
    </div>
  );
};
