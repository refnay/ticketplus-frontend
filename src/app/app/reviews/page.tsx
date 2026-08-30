'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Star, MessageSquare, Search } from 'lucide-react';
import { reviewService } from '@/lib/api/services';
import { Review, ReviewSummary } from '@/types';
import { formatDate } from '@/lib/formatting';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EventContextFilter } from '@/components/filters/EventContextFilter';
import { ActiveFilterChips } from '@/components/filters/ActiveFilterChips';

function ReviewsContent() {
  const searchParams = useSearchParams();
  const selectedEventId = searchParams.get('event') || '';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [page, selectedEventId, ratingFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [revRes, sumRes] = await Promise.all([
        reviewService.getReviews({
          page,
          limit: 10,
          eventId: selectedEventId || undefined,
          rating: ratingFilter !== '' ? Number(ratingFilter) : undefined,
        }),
        reviewService.getReviewSummary(selectedEventId || undefined),
      ]);
      setReviews(revRes.items);
      setTotal(revRes.total);
      setSummary(sumRes);
    } catch (e) {
      console.error('Failed to load reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Review>[] = [
    {
      key: 'event',
      header: 'Evento',
      render: (r) => (
        <div>
          <p className="font-bold text-slate-900">{r.event.name}</p>
          <span className="text-[10px] text-slate-400">ID: {r.event.id}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Usuario Comprador',
      render: (r) => <span className="font-bold text-slate-800">{r.customer.name}</span>,
    },
    {
      key: 'rating',
      header: 'Calificación',
      render: (r) => (
        <div className="flex items-center gap-1 text-amber-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
          ))}
        </div>
      ),
    },
    {
      key: 'comment',
      header: 'Comentario u Opinión',
      render: (r) => <p className="text-xs text-slate-700 italic max-w-md">"{r.comment}"</p>,
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: (r) => <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Opiniones de Asistentes</h1>
        <p className="text-xs text-slate-500 mt-1">Retroalimentación y valoraciones dejadas por los compradores con filtro obligatorio por evento.</p>
      </div>

      {/* Mandatory Top Bar Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <EventContextFilter />
          <Select
            label="Filtrar por Estrellas"
            options={[
              { value: '', label: 'Todas las estrellas' },
              { value: '5', label: '5 Estrellas' },
              { value: '4', label: '4 Estrellas' },
              { value: '3', label: '3 Estrellas' },
              { value: '2', label: '2 Estrellas' },
              { value: '1', label: '1 Estrella' },
            ]}
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          />
        </div>

        <ActiveFilterChips />
      </div>

      {/* Rating Breakdown Dashboard Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 border-r pr-8">
            <span className="text-5xl font-black text-slate-900">{summary?.average || 4.6}</span>
            <div>
              <div className="flex items-center text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {selectedEventId ? 'Promedio para el evento seleccionado' : 'Promedio global de la compañía'} ({summary?.total || 126} opiniones)
              </p>
            </div>
          </div>

          <div className="grow space-y-1.5 max-w-md">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary?.distribution?.[stars] || 0;
              const pct = Math.round((count / (summary?.total || 1)) * 100);

              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-bold text-slate-700 flex items-center gap-1">
                    {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="grow h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-slate-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={reviews}
        total={total}
        page={page}
        limit={10}
        onPageChange={setPage}
        isLoading={loading}
        rowKey={(r) => r.id}
      />
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando opiniones...</div>}>
      <ReviewsContent />
    </Suspense>
  );
}
