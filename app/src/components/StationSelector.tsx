import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StationSelectorProps {
  stations: string[];
  selectedStations: string[];
  onSelectionChange: (stations: string[]) => void;
  compareMode: boolean;
}

const StationSelector: React.FC<StationSelectorProps> = ({
  stations,
  selectedStations,
  onSelectionChange,
  compareMode,
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (station: string) => {
    if (compareMode) {
      if (selectedStations.includes(station)) {
        onSelectionChange(selectedStations.filter(s => s !== station));
      } else {
        onSelectionChange([...selectedStations, station]);
      }
    } else {
      onSelectionChange([station]);
      setOpen(false);
    }
  };

  const handleRemove = (station: string) => {
    onSelectionChange(selectedStations.filter(s => s !== station));
  };

  const displayText = useMemo(() => {
    if (selectedStations.length === 0) return 'Select station(s)...';
    if (selectedStations.length === 1) return selectedStations[0];
    return `${selectedStations.length} stations selected`;
  }, [selectedStations]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Station{compareMode ? 's' : ''}
      </label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal"
          >
            <span className="truncate">{displayText}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-popover" align="start">
          <Command>
            <CommandInput placeholder="Search stations..." />
            <CommandList>
              <CommandEmpty>No station found.</CommandEmpty>
              <CommandGroup>
                {stations.map((station) => (
                  <CommandItem
                    key={station}
                    value={station}
                    onSelect={() => handleSelect(station)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedStations.includes(station) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {station}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {compareMode && selectedStations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedStations.map((station) => (
            <Badge 
              key={station} 
              variant="secondary"
              className="text-xs pr-1"
            >
              {station}
              <button
                onClick={() => handleRemove(station)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default StationSelector;
