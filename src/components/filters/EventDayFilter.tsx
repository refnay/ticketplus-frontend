'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Clock, ChevronDown } from 'lucide-react';
import { sessionService } from '@/lib/api/services';
import { SessionDay } from '@/types';
import { formatDate } from '@/lib/formatting';

export interface EventDayFilterProps {
  eventId?: string;
  value?: string;
  onChange?: (dayId: string) => void;
  className?: string;
}

export const EventDayFilter: React.FC<EventDayFilterProps> = ({
  eventId,
  value,
  onChange,
  className = '',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeEventId = eventId !== undefined ? eventId : (searchParams.get('event') || '');
  const currentDayId = value !== undefined ? value : (searchParams.get('day') || '');

  const [days, setDays] = useState<SessionDay[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeEventId) {
      loadDays(activeEventId);
    } else {
      setDays([]);
    }
  }, [activeEventId]);

  const loadDays = async (evtId: string) => {
    setLoading(true);
    try {
      const list = await sessionService.listDays(evtId);
      setDays(list);
    } catch (e) {
      console.error('Failed to load session days for event:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDay = (dayId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (dayId) {
      params.set('day', dayId);
    } else {
      params.delete('day');
    }
    params.set('page', '1');

    router.push(`${pathname}?${params.toString()}`);
    if (onChange) onChange(dayId);
  };

  const isDisabled = !activeEventId;

  return (
    <div className={`relative ${className}`}>
      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
        Filtro de Función
      </label>
      <div className="relative">
        <select
          disabled={isDisabled || loading}
          value={currentDayId}
          onChange={(e) => handleSelectDay(e.target.value)}
          className={`w-full min-w-[200px] px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-2xs appearance-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
            currentDayId ? 'border-brand-500 text-brand-700 bg-brand-50/20' : ''
          }`}
        >
          <option value="">
            {isDisabled ? 'Selecciona un evento primero' : 'Todas las funciones'}
          </option>
          {days.map((d) => (
            <option key={d.id} value={d.id}>
              {d.description || 'Función'} - {formatDate(d.date)} ({d.startTime})
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
};
