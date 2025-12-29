import React, { useState, useMemo, useCallback } from 'react';
import { AlertCircle, RefreshCw, Loader2, Expand } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Measurement, Station, DateRange, MetricType, ViewMode, OverlaySettings } from '@/types/pollution';
import { parseMeasurementsCSV } from '@/lib/csvParser';
import { 
  joinMeasurementsWithStations, 
  filterMeasurementsByDateRange, 
  filterMeasurementsByStations,
  calculateStatistics 
} from '@/lib/dataProcessing';
import { getUniqueTimestamps, getUniquePredictionTimestamps, getStationsAtTime, getStationPredictionsAtTime } from '@/lib/timeMatching';
import { usePlayback } from '@/hooks/usePlayback';
import { usePredictionsFetch } from '@/hooks/usePredictionsFetch';
import { useStationsFetch } from '@/hooks/useStationsFetch';
import SloveniaMap from '@/components/SloveniaMap';
import AnimatedMap from '@/components/AnimatedMap';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import StatisticsCards from '@/components/StatisticsCards';
import FileUpload from '@/components/FileUpload';
import StationSelector from '@/components/StationSelector';
import DateRangePicker from '@/components/DateRangePicker';
import DashboardControls from '@/components/DashboardControls';
import PlaybackControls from '@/components/PlaybackControls';
import OverlayControls from '@/components/OverlayControls';
import ModeToggle from '@/components/ModeToggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Index = () => {
  // Data state
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const { 
    stations,
    isLoading: stationsLoading,
    error: stationsError,
    retry: retryStations,
    refresh: refreshStations,
    lastFetched: stationsLastFetched,
  } = useStationsFetch();
  const [measurementsFileName, setMeasurementsFileName] = useState<string>();
  
  // Fetch predictions from remote URL
  const { 
    predictions, 
    isLoading: predictionsLoading, 
    error: predictionsError, 
    retry: retryPredictions,
    refresh: refreshPredictions,
    lastFetched: predictionsLastFetched 
  } = usePredictionsFetch();
  
  // Filter state
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  
  // UI state
  const [compareMode, setCompareMode] = useState(false);
  const [dailyAverageMode, setDailyAverageMode] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('pm10');
  const [viewMode, setViewMode] = useState<ViewMode>('historical');
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
    showWind: true,
    showTemperature: false,
    showPrecipitation: false,
  });
  const [isFullscreenMapOpen, setIsFullscreenMapOpen] = useState(false);

  // Derived data for static map (original behavior)
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

  // Playback timestamps for historical mode
  const historicalTimestamps = useMemo(() => {
    const filtered = filterMeasurementsByDateRange(measurements, dateRange);
    return getUniqueTimestamps(filtered);
  }, [measurements, dateRange]);

  // Playback timestamps for prediction mode
  const predictionTimestamps = useMemo(() => {
    return getUniquePredictionTimestamps(predictions);
  }, [predictions]);

  // Historical playback hook
  const historicalPlayback = usePlayback({
    timestamps: historicalTimestamps,
    intervalMs: 500,
  });

  // Prediction playback hook
  const predictionPlayback = usePlayback({
    timestamps: predictionTimestamps,
    intervalMs: 1000,
  });

  // Current playback based on mode
  const currentPlayback = viewMode === 'historical' ? historicalPlayback : predictionPlayback;
  const currentTimestamps = viewMode === 'historical' ? historicalTimestamps : predictionTimestamps;

  // Get station data at current playback time
  const stationsAtCurrentTime = useMemo(() => {
    if (!currentPlayback.currentTimestamp || viewMode !== 'historical') {
      return [];
    }
    const filtered = filterMeasurementsByDateRange(measurements, dateRange);
    return getStationsAtTime(filtered, stations, currentPlayback.currentTimestamp);
  }, [measurements, stations, dateRange, currentPlayback.currentTimestamp, viewMode]);

  // Get predictions at current playback time
  const predictionsAtCurrentTime = useMemo(() => {
    if (!currentPlayback.currentTimestamp || viewMode !== 'prediction') {
      return [];
    }
    return getStationPredictionsAtTime(predictions, stations, currentPlayback.currentTimestamp);
  }, [predictions, stations, currentPlayback.currentTimestamp, viewMode]);

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

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'prediction') {
      setSelectedStations([]);
    }
  }, []);

  const handleCompareModeChange = useCallback((value: boolean) => {
    setCompareMode(value);
    if (!value && selectedStations.length > 1) {
      setSelectedStations([selectedStations[0]]);
    }
  }, [selectedStations]);

  const hasData = measurements.length > 0 && stations.length > 0;
  const hasPredictions = predictions.length > 0 && !predictionsLoading && !predictionsError;
  const showAnimatedMap = hasData && currentTimestamps.length > 0;

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
              
              {/* Stations Status (fetched from remote CSV) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Stations</label>
                <div className="p-3 border rounded-lg border-border bg-muted/30">
                  {stationsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading stations...</span>
                    </div>
                  ) : stationsError ? (
                    <div className="space-y-2">
                      <p className="text-sm text-destructive">{stationsError}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={retryStations}
                        className="w-full"
                      >
                        <RefreshCw className="w-3 h-3 mr-2" />
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2 text-sm text-pollution-good">
                          <div className="w-2 h-2 rounded-full bg-pollution-good" />
                          <span>Stations loaded</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshStations}
                        className="h-7 px-2"
                        title="Refresh stations"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Predictions Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Predictions</label>
                <div className="p-3 border rounded-lg border-border bg-muted/30">
                  {predictionsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading predictions...</span>
                    </div>
                  ) : predictionsError ? (
                    <div className="space-y-2">
                      <p className="text-sm text-destructive">{predictionsError}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={retryPredictions}
                        className="w-full"
                      >
                        <RefreshCw className="w-3 h-3 mr-2" />
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-pollution-good">
                        <div className="w-2 h-2 rounded-full bg-pollution-good" />
                        <span>Predictions loaded</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshPredictions}
                        className="h-7 px-2"
                        title="Refresh predictions"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {hasData && (
              <>
                {/* Filters - only show for historical mode */}
                {viewMode === 'historical' && (
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
                )}

                {/* Overlay Controls - only show for historical mode */}
                {viewMode === 'historical' && (
                  <div className="dashboard-section p-4">
                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                      Map Overlays
                    </h2>
                    <OverlayControls
                      settings={overlaySettings}
                      onSettingsChange={setOverlaySettings}
                    />
                  </div>
                )}

                {viewMode !== 'prediction' && (
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
                )}
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
                  Upload the measurements CSV using the controls on the left. Station locations and prediction data
                  are loaded automatically.
                </p>
              </div>
            ) : (
              <>
                {/* Statistics Cards */}
                {selectedStations.length > 0 && viewMode === 'historical' && (
                  <StatisticsCards
                    exceedanceCount={statistics.exceedanceCount}
                    maxPM10={statistics.maxPM10}
                    meanPM10={statistics.meanPM10}
                    totalMeasurements={statistics.totalMeasurements}
                    dailyMode={dailyAverageMode}
                  />
                )}

                {/* View Mode - moved above map */}
                <div className="dashboard-section p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                        View Mode
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Switch between historical measurements and prediction view.
                      </p>
                    </div>
                    <ModeToggle
                      mode={viewMode}
                      onModeChange={handleViewModeChange}
                      hasPredictions={hasPredictions}
                    />
                  </div>
                </div>

                {/* Animated Map with Playback */}
                <div className="dashboard-section overflow-hidden">
                  <div className="flex items-start justify-between p-4 border-b border-border gap-2">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">
                        {viewMode === 'historical' ? 'Historical Map Playback' : 'Prediction Map'}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {viewMode === 'historical' 
                          ? `${currentTimestamps.length} time frames • Click stations to select`
                          : `${predictionTimestamps.length} prediction frames • Next-day PM10 forecast`
                        }
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsFullscreenMapOpen(true)}
                      title="Open full-screen map"
                      aria-label="Open full-screen map"
                    >
                      <Expand className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="h-[450px]">
                    {/* Hide inline map while fullscreen map is open to avoid overlapping visuals */}
                    {showAnimatedMap && !isFullscreenMapOpen ? (
                      <AnimatedMap
                        mode={viewMode}
                        historicalData={stationsAtCurrentTime}
                        predictionData={predictionsAtCurrentTime}
                        selectedStations={selectedStations}
                        onStationSelect={handleStationSelect}
                        overlaySettings={overlaySettings}
                        currentTimestamp={currentPlayback.currentTimestamp}
                      />
                    ) : (
                      !isFullscreenMapOpen && (
                        <SloveniaMap
                          stations={stationsWithData}
                          selectedStations={selectedStations}
                          onStationSelect={handleStationSelect}
                          useDailyAverage={dailyAverageMode}
                        />
                      )
                    )}
                  </div>

                  {/* Playback Controls (moved below map) */}
                  <div className="p-4 border-b border-border">
                    <PlaybackControls
                      timestamps={currentTimestamps}
                      currentIndex={currentPlayback.currentIndex}
                      onIndexChange={currentPlayback.goToIndex}
                      isPlaying={currentPlayback.isPlaying}
                      onPlayPause={currentPlayback.togglePlayPause}
                      playbackSpeed={currentPlayback.playbackSpeed}
                      onSpeedChange={currentPlayback.setPlaybackSpeed}
                    />
                  </div>
                </div>

                {/* Time Series Chart - only show for historical mode */}
                {viewMode === 'historical' && (
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
                      {selectedMetric === 'pm10' && (
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                          <span
                            className="inline-block w-6 border-t-2 border-dashed"
                            style={{ borderColor: 'hsl(var(--destructive))' }}
                            aria-hidden="true"
                          />
                          <span>EU daily PM10 limit (50 µg/m³).</span>
                        </p>
                      )}
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
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Full-screen Map Dialog */}
      <Dialog open={isFullscreenMapOpen} onOpenChange={setIsFullscreenMapOpen}>
        <DialogContent className="w-[100vw] max-w-none h-[100vh] p-0 sm:rounded-none">
          <div className="flex flex-col h-full">
            <DialogHeader className="px-4 py-3 border-b border-border">
              <DialogTitle className="text-sm font-semibold text-foreground">
                {viewMode === 'historical' ? 'Historical Map Playback' : 'Prediction Map'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {viewMode === 'historical'
                  ? `${currentTimestamps.length} time frames • Click stations to select`
                  : `${predictionTimestamps.length} prediction frames • Next-day PM10 forecast`}
              </p>
            </DialogHeader>

            <div className="flex-1 flex flex-col">
              <div className="flex-1">
                {showAnimatedMap && (
                  <AnimatedMap
                    mode={viewMode}
                    historicalData={stationsAtCurrentTime}
                    predictionData={predictionsAtCurrentTime}
                    selectedStations={selectedStations}
                    onStationSelect={handleStationSelect}
                    overlaySettings={overlaySettings}
                    currentTimestamp={currentPlayback.currentTimestamp}
                  />
                )}
              </div>

              <div className="border-t border-border bg-card/95 px-4 py-3">
                <PlaybackControls
                  timestamps={currentTimestamps}
                  currentIndex={currentPlayback.currentIndex}
                  onIndexChange={currentPlayback.goToIndex}
                  isPlaying={currentPlayback.isPlaying}
                  onPlayPause={currentPlayback.togglePlayPause}
                  playbackSpeed={currentPlayback.playbackSpeed}
                  onSpeedChange={currentPlayback.setPlaybackSpeed}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8">
        <div className="container py-4">
          <p className="text-xs text-muted-foreground text-center">
            Data visualization for research purposes only. &copy; 2025 IOI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
