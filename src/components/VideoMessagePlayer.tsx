import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Film, AlertCircle, RefreshCw, Maximize2, 
  Volume2, VolumeX, Download, Loader2 
} from 'lucide-react';
import { extractVideoMetadata, VideoMetadata, formatVideoDuration } from '../lib/videoUtils';
import { getMediaBlob } from '../lib/mediaStorage';

interface VideoMessagePlayerProps {
  src: string;
  mediaId?: string;
  thumbnailUrl?: string;
  duration?: string;
  name?: string;
  isMe?: boolean;
  className?: string;
  onOpenLightbox?: (url: string) => void;
}

export const VideoMessagePlayer: React.FC<VideoMessagePlayerProps> = ({
  src,
  mediaId,
  thumbnailUrl: initialThumbnailUrl,
  duration: initialDuration,
  name,
  isMe = false,
  className = '',
  onOpenLightbox,
}) => {
  const [videoSrc, setVideoSrc] = useState<string>(src || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialThumbnailUrl);
  const [isError, setIsError] = useState(false);
  const [thumbnail, setThumbnail] = useState<string>(initialThumbnailUrl || '');
  const [durationStr, setDurationStr] = useState<string>(initialDuration || '');
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const [retryCount, setRetryCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Synchronize and resolve video source (from prop or IndexedDB cache)
  useEffect(() => {
    let isMounted = true;

    async function resolveSource() {
      let currentSrc = src || '';

      // If initial src is empty but mediaId exists, fetch from IndexedDB
      if (!currentSrc && mediaId) {
        setIsLoading(true);
        const storedBlob = await getMediaBlob(mediaId);
        if (storedBlob && isMounted) {
          currentSrc = storedBlob;
          setVideoSrc(storedBlob);
        }
      } else {
        setVideoSrc(src || '');
      }

      if (!currentSrc) {
        if (isMounted) {
          setIsError(true);
          setIsLoading(false);
        }
        return;
      }

      setIsError(false);

      try {
        const meta = await extractVideoMetadata(currentSrc);
        if (!isMounted) return;

        if (meta.error) {
          // If metadata extraction fails (e.g., CORS on Firebase Storage), don't block playback.
          // The native <video> element can often still render and play it.
          if (!initialThumbnailUrl && !currentSrc.startsWith('data:') && !currentSrc.startsWith('blob:') && !currentSrc.includes('firebasestorage')) {
            setIsError(true);
          }
        } else {
          if (!initialThumbnailUrl && meta.thumbnailUrl) {
            setThumbnail(meta.thumbnailUrl);
          }
          if (!initialDuration && meta.durationStr) {
            setDurationStr(meta.durationStr);
          }
          if (meta.aspectRatio) {
            setAspectRatio(meta.aspectRatio);
          }
        }
      } catch (err) {
        console.warn('Error extracting video metadata:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    resolveSource();

    return () => {
      isMounted = false;
    };
  }, [src, mediaId, initialThumbnailUrl, initialDuration, retryCount]);

  // Handle Play / Pause Toggle
  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isError) return;

    if (!isPlaying) {
      setIsPlaying(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch((err) => {
            console.warn('Inline play prevented or failed:', err);
          });
        }
      }, 50);
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsPlaying(false);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsError(false);
    setIsLoading(true);
    setRetryCount((prev) => prev + 1);
  };

  // Determine clamped aspect ratio (min 0.6 for portrait, max 2.2 for landscape)
  const clampedAspectRatio = Math.max(0.6, Math.min(2.2, aspectRatio || 1.77));
  const isPortrait = clampedAspectRatio < 1;

  if (isError) {
    return (
      <div className={`p-4 rounded-2xl bg-slate-900/90 border border-slate-700/60 text-slate-300 flex flex-col items-center justify-center gap-2 max-w-[280px] sm:max-w-[320px] text-center ${className}`}>
        <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-200">Unable to load video</p>
          <p className="text-[11px] text-slate-400 truncate max-w-[220px] mt-0.5">{name || 'Video message'}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={handleRetry}
            className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
          {videoSrc && (
            <a
              href={videoSrc}
              download={name || 'video.mp4'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full max-w-[280px] sm:max-w-[320px] rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-lg group select-none ${className}`}
      style={{
        aspectRatio: `${clampedAspectRatio}`,
        maxHeight: isPortrait ? '360px' : '260px',
      }}
    >
      {/* 1. Playing Mode: Render standard video player */}
      {isPlaying ? (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            autoPlay
            playsInline
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              setIsError(true);
              setIsPlaying(false);
            }}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        /* 2. Thumbnail / Poster Mode with Play Overlay */
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenLightbox) {
              onOpenLightbox(videoSrc || src);
            } else {
              togglePlay(e);
            }
          }}
          className="relative w-full h-full cursor-pointer overflow-hidden flex items-center justify-center bg-slate-900 group/thumb"
        >
          {/* Thumbnail Image or Video First-Frame Fallback */}
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={name || 'Video preview'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
            />
          ) : (
            <video
              src={videoSrc ? `${videoSrc}#t=0.1` : undefined}
              preload="metadata"
              muted
              playsInline
              className="w-full h-full object-cover pointer-events-none"
            />
          )}

          {/* Dark Gradient Overlay for Crisp Text & Play Button */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 transition-opacity group-hover/thumb:opacity-90" />

          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 text-[#00a8ff] animate-spin" />
            </div>
          )}

          {/* Center WhatsApp / Telegram Play Button */}
          {!isLoading && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-2xl transition-all duration-200 group-hover/thumb:scale-110 group-hover/thumb:bg-[#00a8ff] group-hover/thumb:text-[#0b141a] group-hover/thumb:border-[#00a8ff] group-active/thumb:scale-95">
                <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
              </div>
            </div>
          )}

          {/* Bottom Left: Video Label */}
          <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white text-[11px] font-medium max-w-[140px]">
            <Film className="w-3.5 h-3.5 text-[#00a8ff] shrink-0" />
            <span className="truncate">{name || 'Video'}</span>
          </div>

          {/* Bottom Right: Video Duration Badge */}
          {durationStr && (
            <div className="absolute bottom-2.5 right-2.5 z-20 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-white text-[11px] font-mono font-semibold flex items-center gap-1 shadow">
              <span>{durationStr}</span>
            </div>
          )}

          {/* Top Right: Lightbox / Expand Button */}
          {onOpenLightbox && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLightbox(videoSrc || src);
              }}
              className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/90 hover:text-white transition-all opacity-0 group-hover/thumb:opacity-100 border border-white/10"
              title="Expand video"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
