import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from 'recharts';
import { format } from 'date-fns';
import { Measurement, DailyAggregate, MetricType } from '@/types/pollution';
import { aggregateToDailyAverages, getMetricLabel, getMetricUnit } from '@/lib/dataProcessing';

interface TimeSeriesChartProps {
  measurements: Measurement[];
  selectedStations: string[];
  useDailyAverage: boolean;
  metric: MetricType;
}

const CHART_COLORS = [
  'hsl(215, 25%, 27%)',
  'hsl(199, 89%, 48%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 67%, 52%)',
  'hsl(330, 81%, 60%)',
];

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  measurements,
  selectedStations,
  useDailyAverage,
  metric,
}) => {
  const chartData = useMemo(() => {
    if (selectedStations.length === 0) return [];

    const filteredMeasurements = measurements.filter(m => 
      selectedStations.includes(m.mesto)
    );

    if (useDailyAverage) {
      const dailyData = aggregateToDailyAverages(filteredMeasurements);
      
      // Group by date
      const dateMap = new Map<string, Record<string, unknown>>();
      
      dailyData.forEach(d => {
        const dateKey = format(d.date, 'yyyy-MM-dd');
        const existing = dateMap.get(dateKey) || { date: dateKey, timestamp: d.date.getTime() };
        existing[d.mesto] = d[metric];
        dateMap.set(dateKey, existing);
      });
      
      return Array.from(dateMap.values()).sort((a, b) => 
        (a.timestamp as number) - (b.timestamp as number)
      );
    }

    // Raw measurements - group by timestamp
    const timeMap = new Map<number, Record<string, unknown>>();
    
    filteredMeasurements.forEach(m => {
      const timestamp = m.datum_zajema.getTime();
      const existing = timeMap.get(timestamp) || { 
        date: format(m.datum_zajema, 'yyyy-MM-dd HH:mm'),
        timestamp 
      };
      existing[m.mesto] = m[metric];
      timeMap.set(timestamp, existing);
    });
    
    return Array.from(timeMap.values()).sort((a, b) => 
      (a.timestamp as number) - (b.timestamp as number)
    );
  }, [measurements, selectedStations, useDailyAverage, metric]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a station to view time series data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(value) => {
            if (useDailyAverage) {
              return format(new Date(value), 'MMM dd');
            }
            return format(new Date(value), 'MMM dd HH:mm');
          }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          label={{ 
            value: getMetricLabel(metric), 
            angle: -90, 
            position: 'insideLeft',
            style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
          }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
          formatter={(value: number | null) => {
            if (value === null) return ['N/A', ''];
            return [`${value.toFixed(1)} ${getMetricUnit(metric)}`, ''];
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
        />
        
        {/* Reference line at 50 µg/m³ for PM10 */}
        {metric === 'pm10' && (
          <ReferenceLine 
            y={50} 
            stroke="hsl(var(--destructive))" 
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: 'EU Daily Limit (50 µg/m³)',
              position: 'right',
              fill: 'hsl(var(--destructive))',
              fontSize: 10,
            }}
          />
        )}
        
        {selectedStations.map((station, index) => (
          <Line
            key={station}
            type="monotone"
            dataKey={station}
            name={station}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
        
        {chartData.length > 50 && (
          <Brush 
            dataKey="date" 
            height={30} 
            stroke="hsl(var(--border))"
            fill="hsl(var(--muted))"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TimeSeriesChart;
