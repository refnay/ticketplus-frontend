'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Calendar, ChevronDown, Search, X, MapPin, ExternalLink, Check } from 'lucide-react';
import { eventService } from '@/lib/api/services';
import { EventDetail, EventStatusLabels } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/formatting';

export interface EventContextFilterProps {
  value?: string;
  onChange?: (eventId: string) => void;
  isWorkspaceContext?: boolean;
  workspaceEvent?: EventDetail | null;
  className?: string;
}

export const EventContextFilter: React.FC<EventContextFilterProps> = ({
  value,
  onChange,
  isWorkspaceContext = false,
  workspaceEvent,
  className = '',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentEventId = value !== undefined ? value : (searchParams.get('event') || '');

  const [events, setEvents] = useState<EventDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedEvent = isWorkspaceContext
    ? workspaceEvent
    : events.find((e) => e.id === currentEventId);

  useEffect(() => {
    if (!isWorkspaceContext) {
      loadEvents();
    }
  }, [isWorkspaceContext]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await eventService.search({ limit: 50 });
      setEvents(res.items);
    } catch (e) {
      console.error('Failed to load events for filter:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (eventId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (eventId) {
      params.set('event', eventId);
    } else {
      params.delete('event');
    }
    // Automatically reset day if event changes
    params.delete('day');
    params.set('page', '1');

    router.push(`${pathname}?${params.toString()}`);
    if (onChange) onChange(eventId);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSelect('');
  };

  // If inside Event Workspace context, render fixed non-editable context block
  if (isWorkspaceContext && workspaceEvent) {
    return (
      <div className={`p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center overflow-hidden shrink-0 border border-indigo-700">
            {workspaceEvent.coverImage ? (
              <img src={workspaceEvent.coverImage} alt={workspaceEvent.name} className="w-full h-full object-cover" />
            ) : (
              <Calendar className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">{workspaceEvent.name}</span>
              <Badge variant="brand" size="sm">
                Evento Seleccionado
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400" /> {workspaceEvent.venueName || workspaceEvent.location}
            </p>
          </div>
        </div>

        <Link
          href="/app/events"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shrink-0"
        >
          <span>Ver todos los eventos</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Global Context: Searchable Dropdown with "Todos los eventos"
  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.venueName && e.venueName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
        Filtro de Evento
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-w-[240px] px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs flex items-center justify-between gap-3 hover:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-2xs transition-all text-left"
      >
        <div className="flex items-center gap-2.5 truncate">
          <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
          <div className="truncate">
            {selectedEvent ? (
              <span className="font-bold text-slate-900 truncate block">{selectedEvent.name}</span>
            ) : (
              <span className="font-medium text-slate-600">Todos los eventos</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedEvent && (
            <span
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              title="Limpiar selección de evento"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-80 bg-white rounded-2xl shadow-elevated border border-slate-200 p-2 z-50 animate-in fade-in duration-150">
          <div className="p-2 border-b border-slate-100 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar evento por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoFocus
            />
          </div>

          <div className="py-1 max-h-64 overflow-y-auto space-y-1">
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                !currentEventId ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Todos los eventos</span>
              {!currentEventId && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
            </button>

            {filteredEvents.map((evt) => {
              const isSelected = evt.id === currentEventId;
              return (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => handleSelect(evt.id)}
                  className={`w-full p-2.5 rounded-xl text-xs flex items-center justify-between gap-3 text-left transition-colors ${
                    isSelected ? 'bg-indigo-50 border border-indigo-200 text-indigo-900' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border overflow-hidden shrink-0">
                      <img src={evt.coverImage || ''} alt={evt.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-900 truncate">{evt.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {evt.venueName} • {evt.days?.[0]?.date ? formatDate(evt.days[0].date) : '-'}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
