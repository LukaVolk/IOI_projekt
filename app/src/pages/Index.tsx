import React, { useState, useMemo, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Measurement, Station, StationWithData, DateRange, MetricType } from '@/types/pollution';
import { parseMeasurementsCSV, parseStationsCSV } from '@/lib/csvParser';
import { 
  joinMeasurementsWithStations, 
  filterMeasurementsByDateRange, 
  filterMeasurementsByStations,
  calculateStatistics 
} from '@/lib/dataProcessing';
import SloveniaMap from '@/components/SloveniaMap';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import StatisticsCards from '@/components/StatisticsCards';
import FileUpload from '@/components/FileUpload';
import StationSelector from '@/components/StationSelector';
import DateRangePicker from '@/components/DateRangePicker';
import DashboardControls from '@/components/DashboardControls';

const Index = () => {
  // Data state
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [measurementsFileName, setMeasurementsFileName] = useState<string>();
  const [stationsFileName, setStationsFileName] = useState<string>();
  
  // Filter state
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  
  // UI state
  const [compareMode, setCompareMode] = useState(false);
  const [dailyAverageMode, setDailyAverageMode] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('pm10');

  // Derived data
  const { stationsWithData, unmatchedStations } = useMemo(() => {
    if (measurements.length === 0 || stations.length === 0) {
      return { stationsWithData: [], unmatchedStations: [] };
    }
    
    const filteredMeasurements = filterMeasurementsByDateRange(measurements, dateRange);
    return joinMeasurementsWithStations(filteredMeasurements, stations);
  }, [measurements, stations, dateRange]);

  const allStationNames = useMemo(() => {
    const names = new Set<string>();
    measurements.forEach(m => names.add(m.mesto));
    return Array.from(names).sort();
  }, [measurements]);

  const filteredMeasurements = useMemo(() => {
    let filtered = filterMeasurementsByDateRange(measurements, dateRange);
    filtered = filterMeasurementsByStations(filtered, selectedStations);
    return filtered;
  }, [measurements, dateRange, selectedStations]);

  const statistics = useMemo(() => {
    return calculateStatistics(filteredMeasurements, dailyAverageMode);
  }, [filteredMeasurements, dailyAverageMode]);

  const dateExtent = useMemo(() => {
    if (measurements.length === 0) return { min: undefined, max: undefined };
    
    let minTime = measurements[0].datum_zajema.getTime();
    let maxTime = measurements[0].datum_zajema.getTime();
    
    for (const m of measurements) {
      const time = m.datum_zajema.getTime();
      if (time < minTime) minTime = time;
      if (time > maxTime) maxTime = time;
    }
    
    return {
      min: new Date(minTime),
      max: new Date(maxTime),
    };
  }, [measurements]);

  // Handlers
  const handleMeasurementsUpload = useCallback(async (file: File) => {
    try {
      const data = await parseMeasurementsCSV(file);
      setMeasurements(data);
      setMeasurementsFileName(file.name);
    } catch (error) {
      console.error('Error parsing measurements CSV:', error);
    }
  }, []);

  const handleStationsUpload = useCallback(async (file: File) => {
    try {
      const data = await parseStationsCSV(file);
      setStations(data);
      setStationsFileName(file.name);
    } catch (error) {
      console.error('Error parsing stations CSV:', error);
    }
  }, []);

  const handleStationSelect = useCallback((stationName: string) => {
    if (compareMode) {
      setSelectedStations(prev => 
        prev.includes(stationName)
          ? prev.filter(s => s !== stationName)
          : [...prev, stationName]
      );
    } else {
      setSelectedStations([stationName]);
    }
  }, [compareMode]);

  const handleCompareModeChange = useCallback((value: boolean) => {
    setCompareMode(value);
    if (!value && selectedStations.length > 1) {
      setSelectedStations([selectedStations[0]]);
    }
  }, [selectedStations]);

  const hasData = measurements.length > 0 && stations.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary">
              <svg 
                className="w-5 h-5 text-primary-foreground" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" 
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                PM10 Air Quality Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Slovenia Monitoring Stations
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Controls */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="dashboard-section p-4 space-y-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Data Upload
              </h2>
              
              <FileUpload
                label="Measurements"
                description="Upload measurements CSV"
                onFileSelect={handleMeasurementsUpload}
                isLoaded={measurements.length > 0}
                fileName={measurementsFileName}
                onClear={() => {
                  setMeasurements([]);
                  setMeasurementsFileName(undefined);
                  setSelectedStations([]);
                }}
              />
              
              <FileUpload
                label="Stations"
                description="Upload stations CSV"
                onFileSelect={handleStationsUpload}
                isLoaded={stations.length > 0}
                fileName={stationsFileName}
                onClear={() => {
                  setStations([]);
                  setStationsFileName(undefined);
                }}
              />
            </div>

            {hasData && (
              <>
                <div className="dashboard-section p-4 space-y-4">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Filters
                  </h2>
                  
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    minDate={dateExtent.min}
                    maxDate={dateExtent.max}
                  />
                  
                  <StationSelector
                    stations={allStationNames}
                    selectedStations={selectedStations}
                    onSelectionChange={setSelectedStations}
                    compareMode={compareMode}
                  />
                </div>

                <div className="dashboard-section p-4">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                    Settings
                  </h2>
                  <DashboardControls
                    compareMode={compareMode}
                    onCompareModeChange={handleCompareModeChange}
                    dailyAverageMode={dailyAverageMode}
                    onDailyAverageModeChange={setDailyAverageMode}
                    selectedMetric={selectedMetric}
                    onMetricChange={setSelectedMetric}
                  />
                </div>
              </>
            )}
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Warnings */}
            {unmatchedStations.length > 0 && (
              <Alert variant="default" className="border-pollution-moderate/50 bg-pollution-moderate/5">
                <AlertCircle className="h-4 w-4 text-pollution-moderate" />
                <AlertDescription className="text-sm">
                  <span className="font-medium">Missing coordinates:</span>{' '}
                  {unmatchedStations.join(', ')} — these stations will appear in charts but not on the map.
                </AlertDescription>
              </Alert>
            )}

            {!hasData ? (
              <div className="dashboard-section p-12 flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <svg 
                    className="w-8 h-8 text-muted-foreground" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Upload Data to Begin
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Upload both the measurements CSV and stations CSV files using the controls on the left to visualize PM10 air quality data across Slovenia.
                </p>
              </div>
            ) : (
              <>
                {/* Statistics Cards */}
                {selectedStations.length > 0 && (
                  <StatisticsCards
                    exceedanceCount={statistics.exceedanceCount}
                    maxPM10={statistics.maxPM10}
                    meanPM10={statistics.meanPM10}
                    totalMeasurements={statistics.totalMeasurements}
                    dailyMode={dailyAverageMode}
                  />
                )}

                {/* Map */}
                <div className="dashboard-section overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h2 className="text-sm font-semibold text-foreground">
                      Slovenia Monitoring Stations
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Click on a station to select it • {stationsWithData.length} stations with coordinates
                    </p>
                  </div>
                  <div className="h-[400px]">
                    <SloveniaMap
                      stations={stationsWithData}
                      selectedStations={selectedStations}
                      onStationSelect={handleStationSelect}
                      useDailyAverage={dailyAverageMode}
                    />
                  </div>
                </div>

                {/* Time Series Chart */}
                <div className="dashboard-section">
                  <div className="p-4 border-b border-border">
                    <h2 className="text-sm font-semibold text-foreground">
                      Time Series
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedStations.length > 0 
                        ? `${selectedStations.join(', ')} • ${dailyAverageMode ? 'Daily averages' : 'Raw measurements'}`
                        : 'Select a station to view time series data'
                      }
                    </p>
                  </div>
                  <div className="h-[350px] p-4">
                    <TimeSeriesChart
                      measurements={filterMeasurementsByDateRange(measurements, dateRange)}
                      selectedStations={selectedStations}
                      useDailyAverage={dailyAverageMode}
                      metric={selectedMetric}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8">
        <div className="container py-4">
          <p className="text-xs text-muted-foreground text-center">
            Data visualization for research purposes only. &copy; 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
