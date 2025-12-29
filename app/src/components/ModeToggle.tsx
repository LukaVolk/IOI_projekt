import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, TrendingUp } from 'lucide-react';
import { ViewMode } from '@/types/pollution';

interface ModeToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  hasPredictions: boolean;
}

const ModeToggle: React.FC<ModeToggleProps> = ({
  mode,
  onModeChange,
  hasPredictions,
}) => {
  return (
    <Tabs value={mode} onValueChange={(v) => onModeChange(v as ViewMode)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="historical" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span>Historical</span>
        </TabsTrigger>
        <TabsTrigger 
          value="prediction" 
          className="flex items-center gap-2"
          disabled={!hasPredictions}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Prediction</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ModeToggle;
