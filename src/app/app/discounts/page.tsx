'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tag, Plus, Search, Percent, DollarSign, Calendar, Sparkles } from 'lucide-react';
import { discountService, eventService } from '@/lib/api/services';
import { Discount, DiscountType, DiscountTypeLabels, ComputedDiscountStatus, EventDetail } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatting';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { EventContextFilter } from '@/components/filters/EventContextFilter';
import { ActiveFilterChips } from '@/components/filters/ActiveFilterChips';

function DiscountsContent() {
  const searchParams = useSearchParams();
  const selectedEventId = searchParams.get('event') || '';
  const { showToast } = useToast();

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [eventsList, setEventsList] = useState<EventDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    eventId: selectedEventId || 'evt-lima-sound-2026',
    code: 'PROMO20',
    type: DiscountType.PERCENTAGE,
    value: 20,
    usageLimit: 500,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    active: true,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadDiscounts();
  }, [page, selectedEventId, typeFilter]);

  const loadEvents = async () => {
    try {
      const res = await eventService.search({ limit: 50 });
      setEventsList(res.items);
    } catch (e) {
      console.error(e);
    }
  };

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const res = await discountService.getDiscounts({
        page,
        limit: 10,
        eventId: selectedEventId || undefined,
        code: searchCode || undefined,
        type: typeFilter !== '' ? Number(typeFilter) : undefined,
      });
      setDiscounts(res.items);
      setTotal(res.total);
    } catch (e) {
      console.error('Failed to load discounts:', e);
    } finally {
      setLoading(false);
    }
  };

  const getComputedStatus = (d: Discount): ComputedDiscountStatus => {
    if (!d.active) return 'Inactivo';
    const now = new Date();
    const start = new Date(d.startDate);
    const end = new Date(d.endDate);
    const count = d.usageCount || d.usage?.count || 0;
    const limit = d.usageLimit || d.usage?.limit || 0;

    if (now < start) return 'Programado';
    if (now > end) return 'Vencido';
    if (limit > 0 && count >= limit) return 'Agotado';
    return 'Activo';
  };

  const statusVariant = (st: ComputedDiscountStatus) => {
    switch (st) {
      case 'Activo': return 'success';
      case 'Programado': return 'info';
      case 'Vencido': return 'danger';
      case 'Agotado': return 'warning';
      case 'Inactivo': return 'neutral';
    }
  };

  const openCreateModal = () => {
    setForm((prev) => ({
      ...prev,
      eventId: selectedEventId || eventsList[0]?.id || 'evt-lima-sound-2026',
    }));
    setModalOpen(true);
  };

  const handleCreateDiscount = async () => {
    if (!form.eventId) {
      showToast('error', 'Error', 'Debes seleccionar un evento para el descuento.');
      return;
    }
    try {
      await discountService.create({
        eventId: form.eventId,
        code: form.code,
        type: Number(form.type),
        value: Number(form.value),
        usageLimit: Number(form.usageLimit),
        startDate: form.startDate,
        endDate: form.endDate,
        active: form.active,
      });
      showToast('success', 'Descuento creado', `Código ${form.code} registrado.`);
      setModalOpen(false);
      await loadDiscounts();
    } catch (e) {
      showToast('error', 'Error', 'No se pudo crear el descuento');
    }
  };

  const columns: Column<Discount>[] = [
    {
      key: 'event',
      header: 'Evento Aplicable',
      render: (d) => (
        <div>
          <p className="font-bold text-slate-900">{d.event?.name || 'Festival Lima Sound 2026'}</p>
          <span className="text-[10px] text-slate-400">ID: {d.eventId}</span>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Código Promocional',
      render: (d) => (
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-brand-600" />
          <span className="font-mono font-bold text-slate-900">{d.code}</span>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Beneficio',
      render: (d) => (
        <span className="font-bold text-emerald-600">
          {d.type === DiscountType.PERCENTAGE ? `${d.value}% desc.` : formatCurrency(d.value)}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'Uso / Límite',
      render: (d) => {
        const count = d.usageCount || d.usage?.count || 0;
        const limit = d.usageLimit || d.usage?.limit || 0;
        const pct = Math.min(100, Math.round((count / (limit || 1)) * 100));

        return (
          <div className="w-32 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-600">
              <span>{count} usados</span>
              <span>{limit} lím.</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'validity',
      header: 'Vigencia',
      render: (d) => (
        <span className="text-xs text-slate-600">
          {formatDate(d.startDate)} al {formatDate(d.endDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado Calculado',
      render: (d) => {
        const st = getComputedStatus(d);
        return <Badge variant={statusVariant(st)} dot>{st}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Módulo de Descuentos</h1>
          <p className="text-xs text-slate-500 mt-1">Crea cupones, promociones y códigos con límites de uso y filtrado obligatorio por evento.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
          Crear cupón
        </Button>
      </div>

      {/* Mandatory Top Bar Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <EventContextFilter />
          <Input
            label="Buscar por Código"
            placeholder="Ej. VIP20..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Select
            label="Tipo de Descuento"
            options={[
              { value: '', label: 'Todos los tipos' },
              { value: DiscountType.PERCENTAGE, label: 'Porcentaje (%)' },
              { value: DiscountType.FIXED_AMOUNT, label: 'Monto Fijo (S/)' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>

        <ActiveFilterChips />
      </div>

      <DataTable
        columns={columns}
        data={discounts}
        total={total}
        page={page}
        limit={10}
        onPageChange={setPage}
        isLoading={loading}
        rowKey={(d) => d.id}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Crear Código de Descuento"
        subtitle="Asocia la promoción obligatoriamente a un evento de la compañía"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleCreateDiscount}>Guardar descuento</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Evento Obligatorio"
            options={eventsList.map((e) => ({ value: e.id, label: e.name }))}
            value={form.eventId}
            onChange={(e) => setForm({ ...form, eventId: e.target.value })}
            disabled={!!selectedEventId}
          />

          <Input label="Código del Cupón" placeholder="VIP20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Descuento"
              options={[
                { value: DiscountType.PERCENTAGE, label: 'Porcentaje (%)' },
                { value: DiscountType.FIXED_AMOUNT, label: 'Monto Fijo (S/)' },
              ]}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: Number(e.target.value) })}
            />
            <Input label="Valor del Descuento" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          </div>

          <Input label="Límite máximo de usos" type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha Inicio" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="Fecha Fin" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function DiscountsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando módulo de descuentos...</div>}>
      <DiscountsContent />
    </Suspense>
  );
}
