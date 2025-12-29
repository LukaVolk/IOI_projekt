import { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { Prediction } from '@/types/pollution';

const PREDICTIONS_URL = 'https://raw.githubusercontent.com/LukaVolk/IOI_projekt/refs/heads/main/data/predictions.csv';

interface UsePredictionsFetchResult {
  predictions: Prediction[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  refresh: () => void;
  lastFetched: Date | null;
}

function parseNumeric(value: string | undefined): number | null {
  if (value === undefined || value === null || value.trim() === '') {
    return null;
  }
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

export function usePredictionsFetch(): UsePredictionsFetchResult {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const cacheRef = useRef<Prediction[] | null>(null);

  const fetchPredictions = useCallback(async (useCache = true) => {
    // Return cached data if available and not forcing refresh
    if (useCache && cacheRef.current) {
      setPredictions(cacheRef.current);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(PREDICTIONS_URL);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch predictions: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();
      
      // Parse CSV using Papa Parse
      const results = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      if (results.errors.length > 0) {
        console.warn('CSV parsing warnings:', results.errors);
      }

      const parsedPredictions: Prediction[] = [];
      
      for (const row of results.data as Record<string, string>[]) {
        // Accept both 'city' and 'mesto' for city, and 'datetime' and 'datum_zajema' for date
        const city = row.city?.trim() || row.mesto?.trim();
        const datetime = row.datetime || row.datum_zajema;
        if (!city || !datetime) continue;
        const parsedDate = new Date(datetime);
        if (isNaN(parsedDate.getTime())) continue;
        parsedPredictions.push({
          city,
          datetime: parsedDate,
          pm10_pred: parseNumeric(row.pm10_pred),
        });
      }

      // Sort by datetime
      parsedPredictions.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

      if (parsedPredictions.length === 0) {
        throw new Error('No valid prediction data found in CSV');
      }

      // Cache the result
      cacheRef.current = parsedPredictions;
      setPredictions(parsedPredictions);
      setLastFetched(new Date());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load predictions';
      setError(errorMessage);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchPredictions(true);
  }, [fetchPredictions]);

  const retry = useCallback(() => {
    fetchPredictions(false);
  }, [fetchPredictions]);

  const refresh = useCallback(() => {
    cacheRef.current = null;
    fetchPredictions(false);
  }, [fetchPredictions]);

  return {
    predictions,
    isLoading,
    error,
    retry,
    refresh,
    lastFetched,
  };
}
