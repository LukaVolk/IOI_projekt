import Papa from 'papaparse';
import { Measurement, Station, Prediction } from '@/types/pollution';

export function parseMeasurementsCSV(file: File): Promise<Measurement[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const measurements: Measurement[] = [];
        
        for (const row of results.data as Record<string, string>[]) {
          const datum = row.datum_zajema;
          if (!datum) continue;
          
          const parsedDate = new Date(datum);
          if (isNaN(parsedDate.getTime())) continue;
          
          measurements.push({
            datum_zajema: parsedDate,
            mesto: row.mesto?.trim() || '',
            pm10: parseNumeric(row.pm10),
            padavine: parseNumeric(row.padavine),
            temperatura: parseNumeric(row.temperatura),
            veter: parseNumeric(row.veter),
            wind_direction: parseNumeric(row.wind_direction),
          });
        }
        
        // Sort by date
        measurements.sort((a, b) => a.datum_zajema.getTime() - b.datum_zajema.getTime());
        
        resolve(measurements);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function parseStationsCSV(file: File): Promise<Station[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const stations: Station[] = [];
        
        for (const row of results.data as Record<string, string>[]) {
          const city = row.city?.trim();
          const longitude = parseFloat(row.longitude);
          const latitude = parseFloat(row.latitude);
          
          if (!city || isNaN(longitude) || isNaN(latitude)) continue;
          
          stations.push({
            city,
            longitude,
            latitude,
          });
        }
        
        resolve(stations);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function parsePredictionsCSV(file: File): Promise<Prediction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const predictions: Prediction[] = [];
        for (const row of results.data as Record<string, string>[]) {
          // Accept both 'city' and 'mesto' for city, and 'datetime' and 'datum_zajema' for date
          const city = row.city?.trim() || row.mesto?.trim();
          const datetime = row.datetime || row.datum_zajema;
          if (!city || !datetime) continue;
          const parsedDate = new Date(datetime);
          if (isNaN(parsedDate.getTime())) continue;
          predictions.push({
            city,
            datetime: parsedDate,
            pm10_pred: parseNumeric(row.pm10_pred),
          });
        }
        // Sort by datetime
        predictions.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
        resolve(predictions);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

function parseNumeric(value: string | undefined): number | null {
  if (value === undefined || value === null || value.trim() === '') {
    return null;
  }
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}
