import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { StationMeasurementAtTime, StationPredictionAtTime, OverlaySettings, ViewMode } from '@/types/pollution';
import { getPM10Color } from '@/lib/dataProcessing';
import { format } from 'date-fns';

interface AnimatedMapProps {
  mode: ViewMode;
  historicalData: StationMeasurementAtTime[];
  predictionData: StationPredictionAtTime[];
  selectedStations: string[];
  onStationSelect: (stationName: string) => void;
  overlaySettings: OverlaySettings;
  currentTimestamp: Date | null;
}

// Get temperature color (blue to red scale)
function getTemperatureColor(temp: number | null): string {
  if (temp === null) return 'hsl(var(--muted))';
  // Scale: -10°C (blue) to 35°C (red)
  const normalized = Math.max(0, Math.min(1, (temp + 10) / 35));
  const hue = 240 - normalized * 240; // 240 (blue) to 0 (red)
  return `hsl(${hue}, 70%, 50%)`;
}

// Get precipitation size (0-10mm scale)
function getPrecipitationSize(precip: number | null): number {
  if (precip === null || precip <= 0) return 0;
  return Math.min(8, 2 + precip * 0.6);
}

// Convert wind direction degrees to arrow rotation
// 0° = North (up), clockwise rotation
function getWindRotation(degrees: number | null): number {
  if (degrees === null) return 0;
  // CSS rotate: 0° is right, so we need to adjust
  // Wind direction 0° (North) should point up, which is -90° in CSS
  return degrees - 90;
}

// Convert degrees to cardinal direction
function getCardinalDirection(degrees: number | null): string {
  if (degrees === null) return 'N/A';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

const AnimatedMap: React.FC<AnimatedMapProps> = ({
  mode,
  historicalData,
  predictionData,
  selectedStations,
  onStationSelect,
  overlaySettings,
  currentTimestamp,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = L.map(mapContainer.current, {
      center: [46.15, 14.995],
      zoom: 8,
      minZoom: 7,
      maxZoom: 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers based on mode and data
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (mode === 'historical') {
      renderHistoricalMarkers();
    } else {
      renderPredictionMarkers();
    }
  }, [mode, historicalData, predictionData, selectedStations, overlaySettings, currentTimestamp]);

  const renderHistoricalMarkers = () => {
    if (!markersLayerRef.current) return;

    // First pass: render overlay elements (temperature, precipitation, wind)
    historicalData.forEach((station) => {
      const isSelected = selectedStations.includes(station.city);

      // Temperature ring overlay - rendered first so it's behind main marker
      if (overlaySettings.showTemperature && station.temperatura !== null) {
        const tempRing = L.circleMarker([station.latitude, station.longitude], {
          radius: isSelected ? 18 : 14,
          fillColor: 'transparent',
          color: getTemperatureColor(station.temperatura),
          weight: 3,
          opacity: 0.8,
          fillOpacity: 0,
          interactive: false,
        });
        markersLayerRef.current!.addLayer(tempRing);
      }

      // Precipitation indicator
      if (overlaySettings.showPrecipitation && station.padavine !== null && station.padavine > 0) {
        const precipSize = getPrecipitationSize(station.padavine);
        const precipMarker = L.circleMarker(
          [station.latitude + 0.03, station.longitude + 0.03],
          {
            radius: precipSize,
            fillColor: 'hsl(210, 90%, 60%)',
            color: 'hsl(210, 90%, 40%)',
            weight: 1,
            opacity: 0.9,
            fillOpacity: 0.7,
            interactive: false,
          }
        );
        markersLayerRef.current!.addLayer(precipMarker);
      }

      // Wind arrow overlay
      if (overlaySettings.showWind && station.wind_direction !== null && station.veter !== null) {
        const rotation = getWindRotation(station.wind_direction);
        const arrowLength = Math.min(30, 15 + station.veter * 2);
        
        const windIcon = L.divIcon({
          className: 'wind-arrow-icon',
          html: `
            <div style="
              transform: rotate(${rotation}deg);
              transform-origin: center;
              width: ${arrowLength}px;
              height: 12px;
              position: relative;
              pointer-events: none;
            ">
              <svg viewBox="0 0 24 12" style="width: 100%; height: 100%;">
                <path d="M0 6 L18 6 M14 2 L18 6 L14 10" 
                      stroke="hsl(var(--foreground))" 
                      stroke-width="2" 
                      fill="none" 
                      stroke-linecap="round" 
                      stroke-linejoin="round"/>
              </svg>
            </div>
          `,
          iconSize: [arrowLength, 12],
          iconAnchor: [arrowLength / 2, 6],
        });

        const windMarker = L.marker([station.latitude, station.longitude], {
          icon: windIcon,
          interactive: false,
        });
        markersLayerRef.current!.addLayer(windMarker);
      }
    });

    // Second pass: render main markers on top so they receive events
    historicalData.forEach((station) => {
      const isSelected = selectedStations.includes(station.city);
      const hasData = station.pm10 !== null;

      // Main PM10 marker
      const marker = L.circleMarker([station.latitude, station.longitude], {
        radius: isSelected ? 14 : 10,
        fillColor: getPM10Color(station.pm10),
        color: isSelected ? 'hsl(var(--foreground))' : 'hsl(var(--background))',
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: hasData ? 0.9 : 0.4,
      });

      // Build tooltip content
      const pm10Display = station.pm10 !== null ? station.pm10.toFixed(1) : 'N/A';
      const tempDisplay = station.temperatura !== null ? station.temperatura.toFixed(1) : 'N/A';
      const precipDisplay = station.padavine !== null ? station.padavine.toFixed(1) : 'N/A';
      const windDisplay = station.veter !== null ? station.veter.toFixed(1) : 'N/A';
      const windDirDisplay = getCardinalDirection(station.wind_direction);
      const timestampDisplay = format(station.timestamp, 'MMM d, yyyy HH:mm');

      const tooltipContent = `
        <div class="station-tooltip" role="tooltip" aria-label="${station.city} station data">
          <div class="station-tooltip-title">${station.city}</div>
          <div class="station-tooltip-time">${timestampDisplay}</div>
          <div class="station-tooltip-data">
            <div class="station-tooltip-row">
              <span>PM10:</span>
              <span class="station-tooltip-value">${pm10Display} µg/m³</span>
            </div>
            <div class="station-tooltip-row">
              <span>Temperature:</span>
              <span class="station-tooltip-value">${tempDisplay} °C</span>
            </div>
            <div class="station-tooltip-row">
              <span>Precipitation:</span>
              <span class="station-tooltip-value">${precipDisplay} mm</span>
            </div>
            <div class="station-tooltip-row">
              <span>Wind:</span>
              <span class="station-tooltip-value">${windDisplay} m/s @ ${windDirDisplay}</span>
            </div>
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        permanent: false,
        direction: 'auto',
        offset: [0, -10],
        className: 'station-marker-tooltip',
        interactive: true,
        pane: 'tooltipPane',
      });

      // Set aria-label on the marker element for accessibility
      marker.getElement?.()?.setAttribute('aria-label', `${station.city} station`);

      marker.on('click', () => onStationSelect(station.city));
      markersLayerRef.current!.addLayer(marker);

    });
  };

  const renderPredictionMarkers = () => {
    if (!markersLayerRef.current) return;

    predictionData.forEach((station) => {
      const hasData = station.pm10_pred !== null;

      const marker = L.circleMarker([station.latitude, station.longitude], {
        radius: 10,
        fillColor: hasData ? getPM10Color(station.pm10_pred) : 'hsl(var(--muted))',
        color: 'hsl(var(--background))',
        weight: 2,
        opacity: hasData ? 1 : 0.5,
        fillOpacity: hasData ? 0.9 : 0.3,
      });

      const pm10Display = station.pm10_pred !== null ? station.pm10_pred.toFixed(1) : 'No prediction';
      const datetimeDisplay = format(station.datetime, 'MMM d, yyyy HH:mm');

      const tooltipContent = `
        <div class="station-tooltip" role="tooltip" aria-label="${station.city} prediction data">
          <div class="station-tooltip-title">${station.city}</div>
          <div class="station-tooltip-time">${datetimeDisplay}</div>
          <div class="station-tooltip-data">
            <div class="station-tooltip-row">
              <span>PM10:</span>
              <span class="station-tooltip-value">${pm10Display}${station.pm10_pred !== null ? ' µg/m³' : ''}</span>
            </div>
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        permanent: false,
        direction: 'auto',
        offset: [0, -10],
        className: 'station-marker-tooltip',
        interactive: true,
        pane: 'tooltipPane',
      });

      // Set aria-label on the marker element for accessibility
      marker.getElement?.()?.setAttribute('aria-label', `${station.city} station prediction`);

      // In prediction mode, clicking markers should not change selection
      markersLayerRef.current!.addLayer(marker);
    });
  };

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />

      {/* Current timestamp display (with tooltip via title attribute) */}
      {currentTimestamp && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-4 py-2 shadow-sm z-[500]"
          title={`${format(currentTimestamp, 'MMMM d, yyyy HH:mm')} ${
            mode === 'historical' ? 'Historical Data' : 'Prediction'
          }`}
        >
          <div className="text-sm font-medium text-foreground">
            {format(currentTimestamp, 'MMMM d, yyyy HH:mm')}
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {mode === 'historical' ? 'Historical Data' : 'Prediction'}
          </div>
        </div>
      )}

      {/* Legend (with tooltip via title attribute) */}
      <div
        className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-sm z-[500]"
        title={`PM10 Levels (µg/m³) ≤ 25 (Good) 26–50 (Moderate) > 50 (Exceeds limit)${
          mode === 'historical' && (overlaySettings.showWind || overlaySettings.showTemperature || overlaySettings.showPrecipitation)
            ? ' → Wind direction arrow / Temp ring / Precipitation size'
            : ''
        }`}
      >
        <div className="text-xs font-medium text-foreground mb-2">
          {mode === 'historical' ? 'PM10 Levels' : 'Predicted PM10'} (µg/m³)
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pollution-good" />
            <span className="text-xs text-muted-foreground">≤ 25 (Good)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pollution-moderate" />
            <span className="text-xs text-muted-foreground">26–50 (Moderate)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pollution-bad" />
            <span className="text-xs text-muted-foreground">&gt; 50 (Exceeds limit)</span>
          </div>
          {/* {mode === 'prediction' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted opacity-50" />
              <span className="text-xs text-muted-foreground">No prediction</span>
            </div>
          )} */}
        </div>

        {/* Overlay legends for historical mode */}
        {mode === 'historical' && (overlaySettings.showTemperature || overlaySettings.showWind || overlaySettings.showPrecipitation) && (
          <div className="mt-3 pt-3 border-t border-border space-y-1.5">
            {overlaySettings.showTemperature && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-blue-500" style={{ borderColor: 'hsl(200, 70%, 50%)' }} />
                <span className="text-xs text-muted-foreground">Temp ring</span>
              </div>
            )}
            {overlaySettings.showWind && (
              <div className="flex items-center gap-2">
                <div className="text-xs">→</div>
                <span className="text-xs text-muted-foreground">Wind direction arrow</span>
              </div>
            )}
            {overlaySettings.showPrecipitation && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs text-muted-foreground">Precipitation</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimatedMap;
