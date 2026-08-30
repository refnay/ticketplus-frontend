import React, { useRef } from 'react';
import { clsx } from 'clsx';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ pointerId: -1, startX: 0, scrollLeft: 0, moved: false });
  const suppressClickRef = useRef(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !containerRef.current) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: containerRef.current.scrollLeft,
      moved: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || dragRef.current.pointerId !== event.pointerId) return;
    const distance = event.clientX - dragRef.current.startX;
    if (Math.abs(distance) > 4 && !dragRef.current.moved) {
      dragRef.current.moved = true;
      container.setPointerCapture(event.pointerId);
    }
    if (dragRef.current.moved) {
      event.preventDefault();
      container.scrollLeft = dragRef.current.scrollLeft - distance;
    }
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || dragRef.current.pointerId !== event.pointerId) return;
    suppressClickRef.current = dragRef.current.moved;
    if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId);
    dragRef.current.pointerId = -1;
    window.setTimeout(() => { suppressClickRef.current = false; }, 0);
  };

  return (
    <div
      ref={containerRef}
      className={clsx('border-b border-slate-200 flex flex-nowrap gap-x-6 overflow-x-auto no-scrollbar cursor-grab select-none active:cursor-grabbing', className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => {
              if (!suppressClickRef.current) onChange(tab.id);
            }}
            className={clsx(
              'shrink-0 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors outline-none',
              isActive
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={clsx(
                  'px-2 py-0.5 text-xs font-bold rounded-full',
                  isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
