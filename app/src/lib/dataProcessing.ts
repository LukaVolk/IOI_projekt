import { Measurement, Station, StationWithData, DailyAggregate, DateRange, MetricType } from '@/types/pollution';
import { startOfDay, format } from 'date-fns';

export function joinMeasurementsWithStations(
  measurements: Measurement[],
  stations: Station[]
): { stationsWithData: StationWithData[]; unmatchedStations: string[] } {
  const stationMap = new Map<string, Station>();
  stations.forEach(s => stationMap.set(s.city, s));
  
  const measurementsByStation = new Map<string, Measurement[]>();
  const allMestoNames = new Set<string>();
  
  measurements.forEach(m => {
    allMestoNames.add(m.mesto);
    const existing = measurementsByStation.get(m.mesto) || [];
    existing.push(m);
    measurementsByStation.set(m.mesto, existing);
  });
  
  const stationsWithData: StationWithData[] = [];
  const unmatchedStations: string[] = [];
  
  allMestoNames.forEach(mesto => {
    const station = stationMap.get(mesto);
    const stationMeasurements = measurementsByStation.get(mesto) || [];
    
    if (station) {
      const pm10Values = stationMeasurements
        .map(m => m.pm10)
        .filter((v): v is number => v !== null);
      
      stationsWithData.push({
        ...station,
        measurements: stationMeasurements,
        latestPM10: pm10Values.length > 0 ? pm10Values[pm10Values.length - 1] : null,
        averagePM10: pm10Values.length > 0 
          ? pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length 
          : null,
      });
    } else {
      unmatchedStations.push(mesto);
    }
  });
  
  return { stationsWithData, unmatchedStations };
}

export function filterMeasurementsByDateRange(
  measurements: Measurement[],
  dateRange: DateRange
): Measurement[] {
  if (!dateRange.from && !dateRange.to) return measurements;
  
  return measurements.filter(m => {
    if (dateRange.from && m.datum_zajema < dateRange.from) return false;
    if (dateRange.to && m.datum_zajema > dateRange.to) return false;
    return true;
  });
}

export function filterMeasurementsByStations(
  measurements: Measurement[],
  stationNames: string[]
): Measurement[] {
  if (stationNames.length === 0) return measurements;
  return measurements.filter(m => stationNames.includes(m.mesto));
}

export function aggregateToDailyAverages(measurements: Measurement[]): DailyAggregate[] {
  const dailyMap = new Map<string, { 
    date: Date; 
    mesto: string;
    pm10Sum: number; pm10Count: number;
    padavineSum: number; padavineCount: number;
    temperaturaSum: number; temperaturaCount: number;
    veterSum: number; veterCount: number;
  }>();
  
  measurements.forEach(m => {
    const dayKey = `${m.mesto}-${format(m.datum_zajema, 'yyyy-MM-dd')}`;
    const existing = dailyMap.get(dayKey);
    
    if (existing) {
      if (m.pm10 !== null) { existing.pm10Sum += m.pm10; existing.pm10Count++; }
      if (m.padavine !== null) { existing.padavineSum += m.padavine; existing.padavineCount++; }
      if (m.temperatura !== null) { existing.temperaturaSum += m.temperatura; existing.temperaturaCount++; }
      if (m.veter !== null) { existing.veterSum += m.veter; existing.veterCount++; }
    } else {
      dailyMap.set(dayKey, {
        date: startOfDay(m.datum_zajema),
        mesto: m.mesto,
        pm10Sum: m.pm10 ?? 0,
        pm10Count: m.pm10 !== null ? 1 : 0,
        padavineSum: m.padavine ?? 0,
        padavineCount: m.padavine !== null ? 1 : 0,
        temperaturaSum: m.temperatura ?? 0,
        temperaturaCount: m.temperatura !== null ? 1 : 0,
        veterSum: m.veter ?? 0,
        veterCount: m.veter !== null ? 1 : 0,
      });
    }
  });
  
  const dailyAggregates: DailyAggregate[] = [];
  
  dailyMap.forEach((value) => {
    dailyAggregates.push({
      date: value.date,
      mesto: value.mesto,
      pm10: value.pm10Count > 0 ? value.pm10Sum / value.pm10Count : null,
      padavine: value.padavineCount > 0 ? value.padavineSum / value.padavineCount : null,
      temperatura: value.temperaturaCount > 0 ? value.temperaturaSum / value.temperaturaCount : null,
      veter: value.veterCount > 0 ? value.veterSum / value.veterCount : null,
      count: Math.max(value.pm10Count, value.padavineCount, value.temperaturaCount, value.veterCount),
    });
  });
  
  return dailyAggregates.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function calculateStatistics(
  measurements: Measurement[],
  dailyMode: boolean
): {
  exceedanceCount: number;
  maxPM10: number | null;
  meanPM10: number | null;
  totalMeasurements: number;
} {
  if (dailyMode) {
    const dailyAggregates = aggregateToDailyAverages(measurements);
    const pm10Values = dailyAggregates
      .map(d => d.pm10)
      .filter((v): v is number => v !== null);
    
    return {
      exceedanceCount: pm10Values.filter(v => v > 50).length,
      maxPM10: pm10Values.length > 0 
        ? pm10Values.reduce((max, v) => v > max ? v : max, pm10Values[0]) 
        : null,
      meanPM10: pm10Values.length > 0 
        ? pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length 
        : null,
      totalMeasurements: dailyAggregates.length,
    };
  }
  
  const pm10Values = measurements
    .map(m => m.pm10)
    .filter((v): v is number => v !== null);
  
  return {
    exceedanceCount: pm10Values.filter(v => v > 50).length,
    maxPM10: pm10Values.length > 0 
      ? pm10Values.reduce((max, v) => v > max ? v : max, pm10Values[0]) 
      : null,
    meanPM10: pm10Values.length > 0 
      ? pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length 
      : null,
    totalMeasurements: measurements.length,
  };
}

export function getPM10Color(pm10: number | null): string {
  if (pm10 === null) return 'hsl(var(--muted))';
  if (pm10 <= 25) return 'hsl(var(--pollution-good))';
  if (pm10 <= 50) return 'hsl(var(--pollution-moderate))';
  return 'hsl(var(--pollution-bad))';
}

export function getPM10ColorClass(pm10: number | null): string {
  if (pm10 === null) return 'bg-muted';
  if (pm10 <= 25) return 'bg-pollution-good';
  if (pm10 <= 50) return 'bg-pollution-moderate';
  return 'bg-pollution-bad';
}

export function getMetricLabel(metric: MetricType): string {
  switch (metric) {
    case 'pm10': return 'PM10 (µg/m³)';
    case 'temperatura': return 'Temperature (°C)';
    case 'padavine': return 'Precipitation (mm)';
    case 'veter': return 'Wind (m/s)';
  }
}

export function getMetricUnit(metric: MetricType): string {
  switch (metric) {
    case 'pm10': return 'µg/m³';
    case 'temperatura': return '°C';
    case 'padavine': return 'mm';
    case 'veter': return 'm/s';
  }
}
