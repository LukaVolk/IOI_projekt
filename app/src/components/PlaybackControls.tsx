import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

interface PlaybackControlsProps {
  timestamps: Date[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  timestamps,
  currentIndex,
  onIndexChange,
  isPlaying,
  onPlayPause,
  playbackSpeed,
  onSpeedChange,
}) => {
  const currentTimestamp = timestamps[currentIndex];
  const hasTimestamps = timestamps.length > 0;

  const handleStepBackward = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleStepForward = () => {
    if (currentIndex < timestamps.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  if (!hasTimestamps) {
    return (
      <div className="p-4 bg-card border border-border rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          No data available for playback
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
      {/* Current timestamp display */}
      <div className="text-center">
        <div className="text-lg font-semibold text-foreground">
          {currentTimestamp ? format(currentTimestamp, 'MMM d, yyyy HH:mm') : '--'}
        </div>
        <div className="text-xs text-muted-foreground">
          Frame {currentIndex + 1} of {timestamps.length}
        </div>
      </div>

      {/* Timeline slider */}
      <div className="px-2">
        <Slider
          value={[currentIndex]}
          onValueChange={(value) => onIndexChange(value[0])}
          max={timestamps.length - 1}
          min={0}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{timestamps[0] ? format(timestamps[0], 'MMM d, HH:mm') : '--'}</span>
          <span>{timestamps[timestamps.length - 1] ? format(timestamps[timestamps.length - 1], 'MMM d, HH:mm') : '--'}</span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleStepBackward}
          disabled={currentIndex === 0}
          className="h-9 w-9"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={onPlayPause}
          className="h-10 w-10"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleStepForward}
          disabled={currentIndex === timestamps.length - 1}
          className="h-9 w-9"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <div className="ml-4">
          <Select
            value={playbackSpeed.toString()}
            onValueChange={(v) => onSpeedChange(parseFloat(v))}
          >
            <SelectTrigger className="w-20 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="1">1×</SelectItem>
              <SelectItem value="2">2×</SelectItem>
              <SelectItem value="4">4×</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;
