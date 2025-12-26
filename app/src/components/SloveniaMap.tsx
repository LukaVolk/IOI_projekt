import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { StationWithData } from '@/types/pollution';
import { getPM10Color } from '@/lib/dataProcessing';

interface SloveniaMapProps {
  stations: StationWithData[];
  selectedStations: string[];
  onStationSelect: (stationName: string) => void;
  useDailyAverage: boolean;
}

const SloveniaMap: React.FC<SloveniaMapProps> = ({
  stations,
  selectedStations,
  onStationSelect,
  useDailyAverage,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Initialize map centered on Slovenia
    mapRef.current = L.map(mapContainer.current, {
      center: [46.15, 14.995],
      zoom: 8,
      minZoom: 7,
      maxZoom: 12,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    stations.forEach(station => {
      const pm10Value = useDailyAverage ? station.averagePM10 : station.latestPM10;
      const isSelected = selectedStations.includes(station.city);
      
      const marker = L.circleMarker([station.latitude, station.longitude], {
        radius: isSelected ? 12 : 8,
        fillColor: getPM10Color(pm10Value),
        color: isSelected ? 'hsl(var(--foreground))' : 'hsl(var(--background))',
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.9,
      });

      const pm10Display = pm10Value !== null ? pm10Value.toFixed(1) : 'N/A';
      const modeLabel = useDailyAverage ? 'Avg' : 'Latest';
      
      marker.bindPopup(`
        <div class="text-sm">
          <div class="font-semibold text-foreground">${station.city}</div>
          <div class="text-muted-foreground mt-1">
            PM10 (${modeLabel}): <span class="font-medium text-foreground">${pm10Display} µg/m³</span>
          </div>
          <div class="text-xs text-muted-foreground mt-1">
            ${station.measurements.length} measurements
          </div>
        </div>
      `);

      marker.on('click', () => {
        onStationSelect(station.city);
      });

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, [stations, selectedStations, onStationSelect, useDailyAverage]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-sm z-[1000]">
        <div className="text-xs font-medium text-foreground mb-2">PM10 Levels (µg/m³)</div>
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
        </div>
      </div>
    </div>
  );
};

export default SloveniaMap;
