import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MetricType } from '@/types/pollution';
import { getMetricLabel } from '@/lib/dataProcessing';

interface DashboardControlsProps {
  compareMode: boolean;
  onCompareModeChange: (value: boolean) => void;
  dailyAverageMode: boolean;
  onDailyAverageModeChange: (value: boolean) => void;
  selectedMetric: MetricType;
  onMetricChange: (metric: MetricType) => void;
}

const DashboardControls: React.FC<DashboardControlsProps> = ({
  compareMode,
  onCompareModeChange,
  dailyAverageMode,
  onDailyAverageModeChange,
  selectedMetric,
  onMetricChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="compare-mode" className="text-sm font-medium">
            Compare Mode
          </Label>
          <p className="text-xs text-muted-foreground">
            Compare multiple stations
          </p>
        </div>
        <Switch
          id="compare-mode"
          checked={compareMode}
          onCheckedChange={onCompareModeChange}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="daily-mode" className="text-sm font-medium">
            Daily Averages
          </Label>
          <p className="text-xs text-muted-foreground">
            Aggregate by day
          </p>
        </div>
        <Switch
          id="daily-mode"
          checked={dailyAverageMode}
          onCheckedChange={onDailyAverageModeChange}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Chart Metric</Label>
        <Select value={selectedMetric} onValueChange={(v) => onMetricChange(v as MetricType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="pm10">{getMetricLabel('pm10')}</SelectItem>
            <SelectItem value="temperatura">{getMetricLabel('temperatura')}</SelectItem>
            <SelectItem value="padavine">{getMetricLabel('padavine')}</SelectItem>
            <SelectItem value="veter">{getMetricLabel('veter')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default DashboardControls;
