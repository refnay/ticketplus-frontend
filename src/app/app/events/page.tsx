'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Filter, Calendar, MapPin, Play, Pause, XCircle, FolderPlus, Trash2, Pencil, X } from 'lucide-react';
import { eventService, eventListingService, categoryAdminService } from '@/lib/api/services';
import { EventDetail, EventStatus, EventStatusLabels, Category, CategoryReferenceLabels } from '@/types';
import { formatDate } from '@/lib/formatting';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [events, setEvents] = useState<EventDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const initialValueQuery = searchParams.get('value') || searchParams.get('name') || '';
  const [valueQuery, setValueQuery] = useState(initialValueQuery);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [appliedFilters, setAppliedFilters] = useState({
    value: initialValueQuery,
    status: '',
    category: '',
    date: '',
  });
  const [categoryOptions, setCategoryOptions] = useState<Array<{ code: string; label: string }>>([]);
  const [categoryOptionsLoading, setCategoryOptionsLoading] = useState(true);

  // Category Manager Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatRef, setNewCatRef] = useState(0);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Action Confirmation Modal
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'publish' | 'pause' | 'resume' | 'cancel' | 'complete' | null;
    eventId: string | null;
    eventName: string;
    reason: string;
  }>({
    isOpen: false,
    type: null,
    eventId: null,
    eventName: '',
    reason: '',
  });

  useEffect(() => {
    loadEvents();
  }, [page, appliedFilters]);

  useEffect(() => {
    loadCategoryOptions();
  }, []);

  const loadCategoryOptions = async () => {
    setCategoryOptionsLoading(true);
    try {
      setCategoryOptions(await eventListingService.getCategoryOptions());
    } catch (error) {
      console.error('Failed to load category options:', error);
      setCategoryOptions([]);
    } finally {
      setCategoryOptionsLoading(false);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await eventListingService.search({
        page,
        limit: 10,
        value: appliedFilters.value || undefined,
        status: appliedFilters.status !== '' ? Number(appliedFilters.status) : undefined,
        category: appliedFilters.category || undefined,
        date: appliedFilters.date || undefined,
      });
      setEvents(res.items);
      setTotal(res.total);
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedFilters({
      value: valueQuery.trim(),
      status: statusFilter,
      category: categoryFilter,
      date: dateFilter,
    });
  };

  const clearFilters = () => {
    setValueQuery('');
    setStatusFilter('');
    setCategoryFilter('');
    setDateFilter('');
    setPage(1);
    setAppliedFilters({ value: '', status: '', category: '', date: '' });
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await categoryAdminService.search({ limit: 100, orderBy: 'createdAt', order: 'DESC' });
      setCategories(res.items);
    } catch (e) {
      console.error('Failed to load categories:', e);
      showToast('error', 'No se pudieron cargar las categorías', 'Inténtalo nuevamente en unos segundos.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const openCategoryManager = async () => {
    resetCategoryForm();
    await loadCategories();
    setCategoryModalOpen(true);
  };

  const resetCategoryForm = () => {
    setNewCatName('');
    setNewCatRef(0);
    setEditingCategoryId(null);
  };

  const handleSaveCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingCategory(true);
    try {
      const payload = { name: newCatName.trim(), reference: Number(newCatRef) };
      if (editingCategoryId) {
        await categoryAdminService.update(editingCategoryId, payload);
        showToast('success', 'Categoría actualizada', `${payload.name} se actualizó correctamente.`);
      } else {
        await categoryAdminService.create(payload);
        showToast('success', 'Categoría creada', `${payload.name} se creó correctamente.`);
      }
      resetCategoryForm();
      await Promise.all([loadCategories(), loadCategoryOptions()]);
    } catch (e: any) {
      showToast('error', 'No se pudo guardar la categoría', e?.error?.message || 'Revisa los datos e inténtalo nuevamente.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setNewCatName(category.name);
    setNewCatRef(category.reference);
    setDeleteConfirmId(null);
  };

  const handleRemoveCategory = async (id: string) => {
    setDeletingCategoryId(id);
    try {
      await categoryAdminService.remove(id);
      showToast('success', 'Categoría eliminada', 'La categoría fue eliminada.');
      if (editingCategoryId === id) resetCategoryForm();
      setDeleteConfirmId(null);
      await Promise.all([loadCategories(), loadCategoryOptions()]);
    } catch (e: any) {
      showToast('error', 'No se pudo eliminar la categoría', e?.error?.message || 'Puede estar asociada a uno o más eventos.');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionModal.eventId || !actionModal.type) return;
    try {
      if (actionModal.type === 'publish') {
        await eventService.publish(actionModal.eventId, actionModal.reason);
        showToast('success', 'Evento publicado', `${actionModal.eventName} ahora está visible para la venta.`);
      } else if (actionModal.type === 'pause') {
        await eventService.pause(actionModal.eventId, actionModal.reason);
        showToast('warning', 'Evento pausado', `Las ventas de ${actionModal.eventName} han sido pausadas.`);
      } else if (actionModal.type === 'resume') {
        await eventService.resume(actionModal.eventId);
        showToast('success', 'Evento reanudado', `Ventas reactivadas para ${actionModal.eventName}.`);
      } else if (actionModal.type === 'cancel') {
        await eventService.cancel(actionModal.eventId, actionModal.reason);
        showToast('error', 'Evento cancelado', `${actionModal.eventName} ha sido cancelado.`);
      } else if (actionModal.type === 'complete') {
        await eventService.complete(actionModal.eventId);
        showToast('info', 'Evento finalizado', `${actionModal.eventName} fue marcado como completado.`);
      }
      setActionModal({ isOpen: false, type: null, eventId: null, eventName: '', reason: '' });
      await loadEvents();
    } catch (e) {
      showToast('error', 'Error', 'No se pudo realizar la acción en el evento');
    }
  };

  const statusBadgeVariant = (st: EventStatus) => {
    switch (st) {
      case EventStatus.DRAFT: return 'neutral';
      case EventStatus.PUBLISHED: return 'success';
      case EventStatus.SOLD_OUT: return 'danger';
      case EventStatus.PAUSED: return 'warning';
      case EventStatus.CANCELLED: return 'danger';
      case EventStatus.COMPLETED: return 'info';
      default: return 'neutral';
    }
  };

  const columns: Column<EventDetail>[] = [
    {
      key: 'name',
      header: 'Evento',
      render: (evt) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 border overflow-hidden shrink-0">
          {evt.coverImage ? (
            <img src={evt.coverImage} alt={evt.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <Calendar className="h-4 w-4" />
            </div>
          )}
          </div>
          <div>
            <Link href={`/app/events/${evt.id}`} className="font-bold text-slate-900 hover:text-brand-600">
              {evt.name}
            </Link>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" /> {evt.venueName || evt.location}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (evt) => {
        const label = typeof evt.category === 'object' ? evt.category.label : evt.category;
        return <Badge variant="neutral">{label || 'Conciertos'}</Badge>;
      },
    },
    {
      key: 'date',
      header: 'Fecha',
      render: (evt) => (
        <div className="text-xs text-slate-700 font-medium">
          {evt.days?.[0]?.date ? formatDate(evt.days[0].date) : evt.date || '-'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (evt) => (
        <Badge variant={statusBadgeVariant(evt.status)} dot>
          {EventStatusLabels[evt.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (evt) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link href={`/app/events/${evt.id}`}>
            <Button variant="outline" size="sm">
              Abrir evento
            </Button>
          </Link>

          {evt.status === EventStatus.DRAFT && (
            <Button
              variant="success"
              size="sm"
              leftIcon={<Play className="w-3.5 h-3.5" />}
              onClick={() => setActionModal({ isOpen: true, type: 'publish', eventId: evt.id, eventName: evt.name, reason: '' })}
            >
              Publicar
            </Button>
          )}

          {evt.status === EventStatus.PUBLISHED && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Pause className="w-3.5 h-3.5" />}
              onClick={() => setActionModal({ isOpen: true, type: 'pause', eventId: evt.id, eventName: evt.name, reason: '' })}
            >
              Pausar
            </Button>
          )}

          {evt.status === EventStatus.PAUSED && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play className="w-3.5 h-3.5" />}
              onClick={() => setActionModal({ isOpen: true, type: 'resume', eventId: evt.id, eventName: evt.name, reason: '' })}
            >
              Reanudar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between lg:p-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Gestión de eventos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Consulta y administra el catálogo de eventos de la compañía.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Button variant="outline" size="md" leftIcon={<FolderPlus className="h-4 w-4" />} className="whitespace-nowrap" onClick={openCategoryManager}>
            Gestionar categorías
          </Button>
          <Link href="/app/events/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />} className="w-full whitespace-nowrap sm:w-auto">
              Crear evento
            </Button>
          </Link>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Filter className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Filtros de búsqueda</h2>
              <p className="text-[11px] text-slate-500">Combina uno o varios campos para refinar el listado.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" leftIcon={<XCircle className="h-3.5 w-3.5" />} className="w-fit" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid w-full gap-4 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1.4fr)_180px_minmax(220px,1fr)_175px_auto] xl:items-end xl:p-5">
          <Input
            label="Nombre o recinto"
            placeholder="Ej. Ado WORLD TOUR o Arena 1"
            value={valueQuery}
            onChange={(e) => setValueQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Select
            label="Estado"
            options={[
              { value: '', label: 'Todos los estados' },
              { value: EventStatus.DRAFT, label: 'Borrador' },
              { value: EventStatus.PUBLISHED, label: 'Publicado' },
              { value: EventStatus.SOLD_OUT, label: 'Agotado' },
              { value: EventStatus.PAUSED, label: 'Pausado' },
              { value: EventStatus.CANCELLED, label: 'Cancelado' },
              { value: EventStatus.COMPLETED, label: 'Finalizado' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />

          <Select
            label="Categoría"
            options={[
              { value: '', label: categoryOptionsLoading ? 'Cargando categorías...' : 'Todas las categorías' },
              ...categoryOptions.map((category) => ({ value: category.code, label: category.label })),
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={categoryOptionsLoading}
          />

          <Input
            label="Fecha"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          <Button type="submit" variant="primary" size="md" leftIcon={<Search className="h-4 w-4" />} className="h-10 whitespace-nowrap sm:col-span-2 xl:col-span-1">
            Aplicar filtros
          </Button>
        </form>
      </section>

      {/* Events Table */}
      <DataTable
        columns={columns}
        data={events}
        total={total}
        page={page}
        limit={10}
        onPageChange={setPage}
        isLoading={loading}
        rowKey={(evt) => evt.id}
        onRowClick={(evt) => router.push(`/app/events/${evt.id}`)}
      />

      {/* Category Manager Modal */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          resetCategoryForm();
          setDeleteConfirmId(null);
        }}
        title="Gestión de categorías"
        subtitle="Crea, edita y organiza las categorías disponibles para tus eventos."
        maxWidth="4xl"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
          <section className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Categorías registradas</h4>
                <p className="text-[11px] text-slate-500">Ordenadas desde la creación más reciente.</p>
              </div>
              {!categoriesLoading && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
                </span>
              )}
            </div>

            <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
              {categoriesLoading ? (
                Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 w-full rounded-xl" />)
              ) : categories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center">
                  <FolderPlus className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold text-slate-600">Todavía no hay categorías.</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Crea la primera usando el formulario.</p>
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className={`rounded-xl border p-3.5 transition-colors ${
                      editingCategoryId === category.id ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{category.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Referencia: {CategoryReferenceLabels[category.reference] || `Código ${category.reference}`}
                        </p>
                      </div>

                      {deleteConfirmId === category.id ? (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="hidden text-[10px] font-semibold text-rose-600 sm:inline">¿Eliminar?</span>
                          <Button variant="danger" size="sm" isLoading={deletingCategoryId === category.id} onClick={() => handleRemoveCategory(category.id)}>
                            Sí
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>No</Button>
                        </div>
                      ) : (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditCategory(category)}
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
                            aria-label={`Editar ${category.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(category.id)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Eliminar ${category.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveCategory();
            }}
            className="h-fit rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:sticky lg:top-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{editingCategoryId ? 'Editar categoría' : 'Nueva categoría'}</h4>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                  {editingCategoryId ? 'Actualiza el nombre o la referencia seleccionada.' : 'Define cómo se identificará el nuevo tipo de evento.'}
                </p>
              </div>
              {editingCategoryId && (
                <button type="button" onClick={resetCategoryForm} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600" aria-label="Cancelar edición">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <Input
                label="Nombre"
                placeholder="Ej. J-Pop Conciertos"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                maxLength={100}
                required
              />
              <Select
                label="Referencia"
                options={Object.entries(CategoryReferenceLabels).map(([value, label]) => ({ value, label }))}
                value={newCatRef}
                onChange={(e) => setNewCatRef(Number(e.target.value))}
              />

              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <Button type="submit" variant="primary" size="md" className="flex-1 whitespace-nowrap" isLoading={savingCategory} disabled={!newCatName.trim()}>
                  {editingCategoryId ? 'Guardar cambios' : 'Crear categoría'}
                </Button>
                {editingCategoryId && (
                  <Button type="button" variant="outline" size="md" onClick={resetCategoryForm}>Cancelar</Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* Action State Confirmation Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, type: null, eventId: null, eventName: '', reason: '' })}
        title={`Confirmar cambio de estado: ${actionModal.type?.toUpperCase()}`}
        subtitle={`Evento: ${actionModal.eventName}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setActionModal({ isOpen: false, type: null, eventId: null, eventName: '', reason: '' })}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleExecuteAction}>
              Confirmar cambio
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            ¿Estás seguro de que deseas cambiar el estado de <span className="font-bold text-slate-900">{actionModal.eventName}</span>?
          </p>
          {(actionModal.type === 'pause' || actionModal.type === 'cancel') && (
            <Input
              label="Motivo del cambio (opcional u obligatorio)"
              placeholder="Ej. Mantenimiento del escenario / decisión organizador..."
              value={actionModal.reason}
              onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando módulo de eventos...</div>}>
      <EventsContent />
    </Suspense>
  );
}
