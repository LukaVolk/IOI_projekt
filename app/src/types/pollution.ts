export interface Measurement {
  datum_zajema: Date;
  mesto: string;
  pm10: number | null;
  padavine: number | null;
  temperatura: number | null;
  veter: number | null;
}

export interface Station {
  city: string;
  longitude: number;
  latitude: number;
}

export interface StationWithData extends Station {
  measurements: Measurement[];
  latestPM10: number | null;
  averagePM10: number | null;
  latestWind: number | null;
  averageWind: number | null;
}

export interface DailyAggregate {
  date: Date;
  mesto: string;
  pm10: number | null;
  padavine: number | null;
  temperatura: number | null;
  veter: number | null;
  count: number;
}

export type MetricType = 'pm10' | 'temperatura' | 'padavine' | 'veter';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
