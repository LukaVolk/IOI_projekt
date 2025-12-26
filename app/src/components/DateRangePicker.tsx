import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DateRange } from '@/types/pollution';

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange,
  minDate,
  maxDate,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Date Range</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM d, yy")} - {format(dateRange.to, "MMM d, yy")}
                  </>
                ) : (
                  format(dateRange.from, "MMM d, yy")
                )
              ) : (
                "Pick a date range"
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover z-[1000]" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from || minDate}
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              onDateRangeChange({
                from: range?.from,
                to: range?.to,
              });
            }}
            numberOfMonths={1}
            fromDate={minDate}
            toDate={maxDate}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      
      {(dateRange.from || dateRange.to) && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
        >
          Clear date range
        </Button>
      )}
    </div>
  );
};

export default DateRangePicker;
