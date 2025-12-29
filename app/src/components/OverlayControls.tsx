import React from 'react';
import { Wind, Thermometer, CloudRain } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { OverlaySettings } from '@/types/pollution';

interface OverlayControlsProps {
  settings: OverlaySettings;
  onSettingsChange: (settings: OverlaySettings) => void;
}

const OverlayControls: React.FC<OverlayControlsProps> = ({
  settings,
  onSettingsChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="wind-overlay" className="text-sm">
            Wind Direction
          </Label>
        </div>
        <Switch
          id="wind-overlay"
          checked={settings.showWind}
          onCheckedChange={(checked) =>
            onSettingsChange({ ...settings, showWind: checked })
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="temp-overlay" className="text-sm">
            Temperature
          </Label>
        </div>
        <Switch
          id="temp-overlay"
          checked={settings.showTemperature}
          onCheckedChange={(checked) =>
            onSettingsChange({ ...settings, showTemperature: checked })
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudRain className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="precip-overlay" className="text-sm">
            Precipitation
          </Label>
        </div>
        <Switch
          id="precip-overlay"
          checked={settings.showPrecipitation}
          onCheckedChange={(checked) =>
            onSettingsChange({ ...settings, showPrecipitation: checked })
          }
        />
      </div>
    </div>
  );
};

export default OverlayControls;
