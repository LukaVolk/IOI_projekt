export interface Measurement {
  datum_zajema: Date;
  mesto: string;
  pm10: number | null;
  padavine: number | null;
  temperatura: number | null;
  veter: number | null;
  wind_direction: number | null;
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

export interface Prediction {
  city: string;
  datetime: Date;
  pm10_pred: number | null;
}

export interface StationMeasurementAtTime {
  city: string;
  latitude: number;
  longitude: number;
  pm10: number | null;
  temperatura: number | null;
  padavine: number | null;
  veter: number | null;
  wind_direction: number | null;
  timestamp: Date;
}

export interface StationPredictionAtTime {
  city: string;
  latitude: number;
  longitude: number;
  pm10_pred: number | null;
  datetime: Date;
}

export type MetricType = 'pm10' | 'temperatura' | 'padavine' | 'veter';

export type ViewMode = 'historical' | 'prediction';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface OverlaySettings {
  showWind: boolean;
  showTemperature: boolean;
  showPrecipitation: boolean;
}
