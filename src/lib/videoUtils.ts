export interface VideoMetadata {
  thumbnailUrl: string;
  duration: number; // in seconds
  durationStr: string; // formatted e.g. "0:15"
  width: number;
  height: number;
  aspectRatio: number;
  error?: boolean;
}

// Global in-memory cache to prevent re-extracting video frames repeatedly
const videoMetadataCache = new Map<string, VideoMetadata>();

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
export function formatVideoDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const sStr = s < 10 ? `0${s}` : `${s}`;
  if (h > 0) {
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${h}:${mStr}:${sStr}`;
  }
  return `${m}:${sStr}`;
}
/**
 * Generates video thumbnail, duration, dimensions & aspect ratio from any video URL or Blob
 */
export function extractVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
  if (!videoUrl) {
    return Promise.resolve({
      thumbnailUrl: '',
      duration: 0,
      durationStr: '0:00',
      width: 320,
      height: 180,
      aspectRatio: 16 / 9,
      error: true,
    });
  }

  // Check cache first
  if (videoMetadataCache.has(videoUrl)) {
    return Promise.resolve(videoMetadataCache.get(videoUrl)!);
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let resolved = false;

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        const fallback: VideoMetadata = {
          thumbnailUrl: '',
          duration: 0,
          durationStr: '0:00',
          width: 320,
          height: 180,
          aspectRatio: 16 / 9,
          error: false,
        };
        videoMetadataCache.set(videoUrl, fallback);
        cleanup();
        resolve(fallback);
      }
    }, 7000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      video.removeAttribute('src');
      try {
        video.load();
      } catch (e) {}
    };

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      const durationStr = formatVideoDuration(duration);
      const width = video.videoWidth || 320;
      const height = video.videoHeight || 180;
      const aspectRatio = height > 0 ? width / height : 16 / 9;

      // Seek to 0.5s or 10% of duration to get a valid non-black frame
      const seekTime = duration > 0 ? Math.min(0.5, duration / 2) : 0.1;
      video.currentTime = seekTime;

      video.onseeked = () => {
        if (resolved) return;
        resolved = true;

        let thumbnailUrl = '';
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 480;
          let canvasWidth = width;
          let canvasHeight = height;

          if (canvasWidth > maxDim || canvasHeight > maxDim) {
            if (canvasWidth > canvasHeight) {
              canvasHeight = Math.round((canvasHeight * maxDim) / canvasWidth);
              canvasWidth = maxDim;
            } else {
              canvasWidth = Math.round((canvasWidth * maxDim) / canvasHeight);
              canvasHeight = maxDim;
            }
          }

          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);
            thumbnailUrl = canvas.toDataURL('image/jpeg', 0.75);
          }
        } catch (e) {
          console.warn('Canvas video frame extraction failed (CORS or browser restrictions):', e);
        }

        const meta: VideoMetadata = {
          thumbnailUrl,
          duration,
          durationStr,
          width,
          height,
          aspectRatio,
          error: false,
        };

        videoMetadataCache.set(videoUrl, meta);
        cleanup();
        resolve(meta);
      };
    };

    video.onerror = () => {
      if (!resolved) {
        resolved = true;
        const errMeta: VideoMetadata = {
          thumbnailUrl: '',
          duration: 0,
          durationStr: '0:00',
          width: 320,
          height: 180,
          aspectRatio: 16 / 9,
          error: true,
        };
        videoMetadataCache.set(videoUrl, errMeta);
        cleanup();
        resolve(errMeta);
      }
    };

    video.src = videoUrl;
  });
}
