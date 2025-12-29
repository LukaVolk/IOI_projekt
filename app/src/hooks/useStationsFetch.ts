import { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { Station } from '@/types/pollution';

const STATIONS_URL =
  'https://raw.githubusercontent.com/LukaVolk/IOI_projekt/refs/heads/main/data/stations_data.csv';

interface UseStationsFetchResult {
  stations: Station[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  refresh: () => void;
  lastFetched: Date | null;
}

export function useStationsFetch(): UseStationsFetchResult {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const cacheRef = useRef<Station[] | null>(null);

  const fetchStations = useCallback(async (useCache = true) => {
    if (useCache && cacheRef.current) {
      setStations(cacheRef.current);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(STATIONS_URL);

      if (!response.ok) {
        throw new Error(`Failed to fetch stations: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();

      const results = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      if (results.errors.length > 0) {
        console.warn('Stations CSV parsing warnings:', results.errors);
      }

      const parsedStations: Station[] = [];

      for (const row of results.data as Record<string, string>[]) {
        const city = row.city?.trim();
        const longitude = parseFloat(row.longitude);
        const latitude = parseFloat(row.latitude);

        if (!city || isNaN(longitude) || isNaN(latitude)) continue;

        parsedStations.push({
          city,
          longitude,
          latitude,
        });
      }

      if (parsedStations.length === 0) {
        throw new Error('No valid station data found in CSV');
      }

      cacheRef.current = parsedStations;
      setStations(parsedStations);
      setLastFetched(new Date());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stations';
      setError(errorMessage);
      setStations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations(true);
  }, [fetchStations]);

  const retry = useCallback(() => {
    fetchStations(false);
  }, [fetchStations]);

  const refresh = useCallback(() => {
    cacheRef.current = null;
    fetchStations(false);
  }, [fetchStations]);

  return {
    stations,
    isLoading,
    error,
    retry,
    refresh,
    lastFetched,
  };
}


