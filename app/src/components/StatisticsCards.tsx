import React from 'react';
import { AlertTriangle, TrendingUp, Activity, BarChart3 } from 'lucide-react';

interface StatisticsCardsProps {
  exceedanceCount: number;
  maxPM10: number | null;
  meanPM10: number | null;
  totalMeasurements: number;
  dailyMode: boolean;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  exceedanceCount,
  maxPM10,
  meanPM10,
  totalMeasurements,
  dailyMode,
}) => {
  const formatValue = (value: number | null): string => {
    if (value === null) return 'N/A';
    return value.toFixed(1);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-md bg-pollution-bad/10">
            <AlertTriangle className="w-4 h-4 text-pollution-bad" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Exceedances
          </span>
        </div>
        <div className="text-2xl font-semibold text-foreground">
          {exceedanceCount}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {dailyMode ? 'Days' : 'Measurements'} &gt; 50 µg/m³
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Maximum
          </span>
        </div>
        <div className="text-2xl font-semibold text-foreground">
          {formatValue(maxPM10)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          µg/m³
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-md bg-chart-2/10">
            <Activity className="w-4 h-4 text-chart-2" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Mean
          </span>
        </div>
        <div className="text-2xl font-semibold text-foreground">
          {formatValue(meanPM10)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          µg/m³
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-md bg-muted">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Data Points
          </span>
        </div>
        <div className="text-2xl font-semibold text-foreground">
          {totalMeasurements}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {dailyMode ? 'Daily averages' : 'Measurements'}
        </div>
      </div>
    </div>
  );
};

export default StatisticsCards;
