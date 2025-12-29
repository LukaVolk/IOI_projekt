import { Measurement, Station, Prediction, StationMeasurementAtTime, StationPredictionAtTime } from '@/types/pollution';

const TOLERANCE_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Get unique timestamps from measurements, sorted chronologically
 */
export function getUniqueTimestamps(measurements: Measurement[]): Date[] {
  const seen = new Set<number>();
  const timestamps: Date[] = [];

  for (const m of measurements) {
    const time = m.datum_zajema.getTime();
    if (!seen.has(time)) {
      seen.add(time);
      timestamps.push(m.datum_zajema);
    }
  }

  return timestamps.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Get unique prediction timestamps, sorted chronologically
 */
export function getUniquePredictionTimestamps(predictions: Prediction[]): Date[] {
  const seen = new Set<number>();
  const timestamps: Date[] = [];

  for (const p of predictions) {
    const time = p.datetime.getTime();
    if (!seen.has(time)) {
      seen.add(time);
      timestamps.push(p.datetime);
    }
  }

  return timestamps.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Find the measurement closest to target time within tolerance
 */
function findClosestMeasurement(
  measurements: Measurement[],
  targetTime: number
): Measurement | null {
  let closest: Measurement | null = null;
  let closestDiff = Infinity;

  for (const m of measurements) {
    const diff = Math.abs(m.datum_zajema.getTime() - targetTime);
    if (diff <= TOLERANCE_MS && diff < closestDiff) {
      closest = m;
      closestDiff = diff;
    }
  }

  return closest;
}

/**
 * Get station data at a specific timestamp
 */
export function getStationsAtTime(
  measurements: Measurement[],
  stations: Station[],
  targetTime: Date
): StationMeasurementAtTime[] {
  const stationMap = new Map<string, Station>();
  stations.forEach((s) => stationMap.set(s.city, s));

  const measurementsByStation = new Map<string, Measurement[]>();
  for (const m of measurements) {
    const existing = measurementsByStation.get(m.mesto) || [];
    existing.push(m);
    measurementsByStation.set(m.mesto, existing);
  }

  const result: StationMeasurementAtTime[] = [];
  const targetTimeMs = targetTime.getTime();

  measurementsByStation.forEach((stationMeasurements, mesto) => {
    const station = stationMap.get(mesto);
    if (!station) return;

    const closest = findClosestMeasurement(stationMeasurements, targetTimeMs);

    result.push({
      city: station.city,
      latitude: station.latitude,
      longitude: station.longitude,
      pm10: closest?.pm10 ?? null,
      temperatura: closest?.temperatura ?? null,
      padavine: closest?.padavine ?? null,
      veter: closest?.veter ?? null,
      wind_direction: closest?.wind_direction ?? null,
      timestamp: closest?.datum_zajema ?? targetTime,
    });
  });

  return result;
}

/**
 * Get station predictions at a specific timestamp
 */
export function getStationPredictionsAtTime(
  predictions: Prediction[],
  stations: Station[],
  targetTime: Date
): StationPredictionAtTime[] {
  const stationMap = new Map<string, Station>();
  stations.forEach((s) => stationMap.set(s.city, s));

  const result: StationPredictionAtTime[] = [];
  const targetTimeMs = targetTime.getTime();

  // Group predictions by city
  const predictionsByCity = new Map<string, Prediction[]>();
  for (const p of predictions) {
    const existing = predictionsByCity.get(p.city) || [];
    existing.push(p);
    predictionsByCity.set(p.city, existing);
  }

  // For each station, find exact match or closest within tolerance
  stations.forEach((station) => {
    const cityPredictions = predictionsByCity.get(station.city) || [];
    
    // Find exact match first
    let matchedPrediction: Prediction | null = null;
    for (const p of cityPredictions) {
      if (p.datetime.getTime() === targetTimeMs) {
        matchedPrediction = p;
        break;
      }
    }

    result.push({
      city: station.city,
      latitude: station.latitude,
      longitude: station.longitude,
      pm10_pred: matchedPrediction?.pm10_pred ?? null,
      datetime: matchedPrediction?.datetime ?? targetTime,
    });
  });

  return result;
}
