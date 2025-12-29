import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePlaybackOptions {
  timestamps: Date[];
  intervalMs?: number;
}

export function usePlayback({ timestamps, intervalMs = 1000 }: UsePlaybackOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset index when timestamps change
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [timestamps]);

  // Playback interval
  useEffect(() => {
    if (isPlaying && timestamps.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= timestamps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs / playbackSpeed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, timestamps.length, intervalMs, playbackSpeed]);

  const play = useCallback(() => {
    if (currentIndex >= timestamps.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  }, [currentIndex, timestamps.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, timestamps.length - 1)));
  }, [timestamps.length]);

  const currentTimestamp = timestamps[currentIndex] || null;

  return {
    currentIndex,
    currentTimestamp,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    play,
    pause,
    togglePlayPause,
    goToIndex,
  };
}
