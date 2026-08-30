'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { X, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface ActiveFilterChipsProps {
  onClearAll?: () => void;
  className?: string;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({ onClearAll, className = '' }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeParams: Array<{ key: string; label: string; value: string }> = [];

  searchParams.forEach((value, key) => {
    if (key === 'tab' || !value) return;
    let label = key;
    if (key === 'event') label = 'Evento';
    if (key === 'day') label = 'Función';
    if (key === 'status') label = 'Estado';
    if (key === 'method') label = 'Método';
    if (key === 'search' || key === 'code') label = 'Búsqueda';
    if (key === 'zone') label = 'Zona';

    activeParams.push({ key, label, value });
  });

  if (activeParams.length === 0) return null;

  const removeParam = (keyToRemove: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(keyToRemove);
    if (keyToRemove === 'event') params.delete('day');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearAll = () => {
    const params = new URLSearchParams();
    const currentTab = searchParams.get('tab');
    if (currentTab) params.set('tab', currentTab);
    router.push(`${pathname}?${params.toString()}`);
    if (onClearAll) onClearAll();
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 pt-2 ${className}`}>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        <Filter className="w-3 h-3" /> Filtros Activos:
      </span>

      {activeParams.map((item) => (
        <span
          key={item.key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold"
        >
          <span>{item.label}: <strong className="text-brand-900">{item.value}</strong></span>
          <button
            type="button"
            onClick={() => removeParam(item.key)}
            className="p-0.5 hover:bg-brand-100 rounded-full text-brand-600"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={handleClearAll}
        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1"
      >
        Limpiar todos
      </button>
    </div>
  );
};
