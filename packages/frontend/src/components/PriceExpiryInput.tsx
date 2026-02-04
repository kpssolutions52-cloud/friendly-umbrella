'use client';

import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ExpiryDurationUnit = 'minutes' | 'hours' | 'days' | 'months';

export interface ExpiryDuration {
  value: number;
  unit: ExpiryDurationUnit;
}

export interface PriceExpiryInput {
  expiryDuration?: ExpiryDuration;
  expiryFrom?: Date;
  expiryUntil?: Date;
}

interface PriceExpiryInputProps {
  value?: PriceExpiryInput;
  onChange: (expiry: PriceExpiryInput | undefined) => void;
  effectiveFrom?: Date;
}

export function PriceExpiryInput({ value, onChange, effectiveFrom }: PriceExpiryInputProps) {
  const [expiryType, setExpiryType] = useState<'duration' | 'custom' | 'none'>(
    value?.expiryDuration ? 'duration' : value?.expiryUntil ? 'custom' : 'none'
  );
  const [durationValue, setDurationValue] = useState<number>(
    value?.expiryDuration?.value || 365
  );
  const [durationUnit, setDurationUnit] = useState<ExpiryDurationUnit>(
    value?.expiryDuration?.unit || 'days'
  );
  const [customFrom, setCustomFrom] = useState<string>(
    value?.expiryFrom ? new Date(value.expiryFrom).toISOString().slice(0, 16) : ''
  );
  const [customUntil, setCustomUntil] = useState<string>(
    value?.expiryUntil ? new Date(value.expiryUntil).toISOString().slice(0, 16) : ''
  );

  const handleExpiryTypeChange = (type: 'duration' | 'custom' | 'none') => {
    setExpiryType(type);
    if (type === 'none') {
      onChange(undefined);
    } else if (type === 'duration') {
      onChange({
        expiryDuration: { value: durationValue, unit: durationUnit },
      });
    } else if (type === 'custom') {
      onChange({
        expiryFrom: customFrom ? new Date(customFrom) : undefined,
        expiryUntil: customUntil ? new Date(customUntil) : undefined,
      });
    }
  };

  const handleDurationChange = (newValue: number, newUnit?: ExpiryDurationUnit) => {
    const updatedValue = newValue || durationValue;
    const updatedUnit = newUnit || durationUnit;
    setDurationValue(updatedValue);
    if (newUnit) setDurationUnit(updatedUnit);
    if (expiryType === 'duration') {
      onChange({
        expiryDuration: { value: updatedValue, unit: updatedUnit },
      });
    }
  };

  const handleCustomDateChange = (from?: string, until?: string) => {
    if (from !== undefined) setCustomFrom(from);
    if (until !== undefined) setCustomUntil(until);
    if (expiryType === 'custom') {
      onChange({
        expiryFrom: from ? new Date(from) : undefined,
        expiryUntil: until ? new Date(until) : undefined,
      });
    }
  };

  // Calculate default expiry (1 year from effectiveFrom or now)
  const defaultExpiryDate = effectiveFrom || new Date();
  defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 1);
  const defaultExpiryString = defaultExpiryDate.toISOString().slice(0, 16);

  return (
    <div className="space-y-4">
      <Label>Price Expiry</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={expiryType === 'duration' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleExpiryTypeChange('duration')}
        >
          <Clock className="h-4 w-4 mr-1" />
          Duration
        </Button>
        <Button
          type="button"
          variant={expiryType === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleExpiryTypeChange('custom')}
        >
          <Calendar className="h-4 w-4 mr-1" />
          Custom Range
        </Button>
        <Button
          type="button"
          variant={expiryType === 'none' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleExpiryTypeChange('none')}
        >
          Default (1 year)
        </Button>
      </div>

      {expiryType === 'duration' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="duration-value">Duration</Label>
            <Input
              id="duration-value"
              type="number"
              min="1"
              value={durationValue}
              onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <Label htmlFor="duration-unit">Unit</Label>
            <select
              id="duration-unit"
              value={durationUnit}
              onChange={(e) => handleDurationChange(durationValue, e.target.value as ExpiryDurationUnit)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="months">Months</option>
            </select>
          </div>
        </div>
      )}

      {expiryType === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="expiry-from">From</Label>
            <Input
              id="expiry-from"
              type="datetime-local"
              value={customFrom || defaultExpiryString}
              onChange={(e) => handleCustomDateChange(e.target.value, customUntil)}
            />
          </div>
          <div>
            <Label htmlFor="expiry-until">Until</Label>
            <Input
              id="expiry-until"
              type="datetime-local"
              value={customUntil || defaultExpiryString}
              onChange={(e) => handleCustomDateChange(customFrom, e.target.value)}
            />
          </div>
        </div>
      )}

      {expiryType === 'none' && (
        <p className="text-sm text-gray-500">
          Price will expire 1 year from the effective date (default)
        </p>
      )}
    </div>
  );
}

/**
 * Format expiry date for display
 */
export function formatExpiryDate(expiryUntil: Date | null | undefined): string {
  if (!expiryUntil) return 'No expiry';
  
  const now = new Date();
  const expiry = new Date(expiryUntil);
  const diffMs = expiry.getTime() - now.getTime();
  
  if (diffMs < 0) return 'Expired';
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? 's' : ''} remaining`;
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} remaining`;
  } else {
    return 'Expiring soon';
  }
}
