import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-arrowheads';
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
      const windValue = useDailyAverage ? station.averageWind : station.latestWind;
      const isSelected = selectedStations.includes(station.city);

      const pm10Marker = L.circleMarker([station.latitude, station.longitude], {
        radius: isSelected ? 12 : 8,
        fillColor: getPM10Color(pm10Value),
        color: isSelected ? 'hsl(var(--foreground))' : 'hsl(var(--background))',
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.9,
      });

      const pm10Display = pm10Value !== null ? pm10Value.toFixed(1) : 'N/A';
      const modeLabel = useDailyAverage ? 'Avg' : 'Latest';

      pm10Marker.bindPopup(`
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

      pm10Marker.on('click', () => {
        onStationSelect(station.city);
      });


      // calculate arrow destination based on windValue and angle
      // field is added later, replace the angle calculation below.
      const angle = 0; // degrees, 0 = north

      let destination: [number, number] | null = null;
      if (windValue !== null && !Number.isNaN(windValue)) {
        // arrow scale
        const SCALE = 20000;  // 1 m/s ... 20 kilometrov
        const distanceMeters = windValue * SCALE;

        const R = 6371000; // earth radius in meters
        const bearing = (angle * Math.PI) / 180; // to radians
        const lat1 = (station.latitude * Math.PI) / 180;
        const lon1 = (station.longitude * Math.PI) / 180;
        const delta = distanceMeters / R;

        const lat2 = Math.asin(
          Math.sin(lat1) * Math.cos(delta) + Math.cos(lat1) * Math.sin(delta) * Math.cos(bearing)
        );

        const lon2 = lon1 + Math.atan2(
          Math.sin(bearing) * Math.sin(delta) * Math.cos(lat1),
          Math.cos(delta) - Math.sin(lat1) * Math.sin(lat2)
        );

        destination = [(lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI];
      }

      const windVector = destination
        ? L.polyline([[station.latitude, station.longitude], destination]).arrowheads({})
        : L.polyline([[station.latitude, station.longitude], [station.latitude, station.longitude]]).arrowheads({});

      pm10Marker.addTo(mapRef.current!);
      windVector.addTo(mapRef.current!);
      markersRef.current.push(pm10Marker);
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
