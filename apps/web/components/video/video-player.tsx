'use client';
import { useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { ProgressTracker } from '../../lib/progress-tracker';
import { useVideoStreamUrl, useLessonProgress } from '../../hooks/use-api';

interface VideoPlayerProps {
  lessonId: string;
  onComplete?: () => void;
}

export function VideoPlayer({ lessonId, onComplete }: VideoPlayerProps) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const hlsRef     = useRef<Hls | null>(null);
  const trackerRef = useRef<ProgressTracker | null>(null);
  const completedRef = useRef(false);

  const { data: streamData } = useVideoStreamUrl(lessonId);
  const { data: savedProgress } = useLessonProgress(lessonId);

  // Teardown HLS and tracker
  const cleanup = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
    trackerRef.current?.destroy();
    trackerRef.current = null;
  }, []);

  useEffect(() => {
    if (!streamData || !videoRef.current) return;
    const video = videoRef.current;

    cleanup();

    const duration = streamData.durationSeconds;
    trackerRef.current = new ProgressTracker(lessonId, duration);

    const onTimeUpdate = () => {
      trackerRef.current?.track(video.currentTime);

      // Completion: reached 90% of video
      if (!completedRef.current && duration > 0 && video.currentTime / duration >= 0.9) {
        completedRef.current = true;
        trackerRef.current?.track(video.currentTime); // force flush
        onComplete?.();
      }
    };

    const onPause = () => trackerRef.current?.track(video.currentTime);

    if (streamData.isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker:         true,
        lowLatencyMode:       false,
        backBufferLength:     90,
        maxBufferLength:      30,
        maxMaxBufferLength:   60,
        startLevel:           -1, // auto quality
      });
      hls.loadSource(streamData.streamUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Resume from saved position
        if (savedProgress?.lastPositionSeconds && savedProgress.lastPositionSeconds > 10) {
          video.currentTime = savedProgress.lastPositionSeconds;
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = streamData.streamUrl;
      video.addEventListener('loadedmetadata', () => {
        if (savedProgress?.lastPositionSeconds && savedProgress.lastPositionSeconds > 10) {
          video.currentTime = savedProgress.lastPositionSeconds;
        }
      }, { once: true });
    } else {
      // Fallback to direct URL
      video.src = streamData.streamUrl;
    }

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('pause', onPause);
      cleanup();
    };
  }, [streamData, lessonId, savedProgress, onComplete, cleanup]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || e.target instanceof HTMLInputElement) return;
      if (e.key === ' ')          { e.preventDefault(); video.paused ? video.play() : video.pause(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); video.currentTime = Math.min(video.currentTime + 10, video.duration); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); video.currentTime = Math.max(video.currentTime - 10, 0); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); video.volume = Math.min(video.volume + 0.1, 1); }
      if (e.key === 'ArrowDown')  { e.preventDefault(); video.volume = Math.max(video.volume - 0.1, 0); }
      if (e.key === 'f')          { document.fullscreenElement ? document.exitFullscreen() : video.requestFullscreen(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (!streamData) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center animate-pulse">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        preload="metadata"
        playsInline
      />
      {/* Keyboard hints */}
      <div className="absolute bottom-14 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-black/70 text-white text-xs rounded-lg px-3 py-2 space-y-1">
          <div>Space — play/pause</div>
          <div>← / → — seek 10s</div>
          <div>F — fullscreen</div>
        </div>
      </div>
    </div>
  );
}
