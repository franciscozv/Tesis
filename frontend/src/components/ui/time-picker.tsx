'use client';

import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string; // HH:MM
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export function TimePicker({
  value,
  onChange,
  placeholder = 'Seleccionar hora',
  disabled,
}: TimePickerProps) {
  const [hh, mm] = value ? value.split(':') : ['', ''];

  const handleHour = (h: string) => {
    onChange(`${h}:${mm || '00'}`);
  };

  const handleMinute = (m: string) => {
    onChange(`${hh || '00'}:${m}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <Clock className="mr-2 size-4 shrink-0" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium">Hora</span>
            <Select value={hh} onValueChange={handleHour}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {hours.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="mt-5 text-lg font-semibold">:</span>

          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium">Min</span>
            <Select value={mm} onValueChange={handleMinute}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {minutes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
