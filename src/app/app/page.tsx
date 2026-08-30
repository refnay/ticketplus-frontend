'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  TrendingUp,
  ShoppingBag,
  Ticket as TicketIcon,
  AlertTriangle,
  Calendar,
  Percent,
  Clock,
  SlidersHorizontal,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { dashboardService, dashboardSummaryService } from '@/lib/api/services';
import type { DashboardSummary, ZoneOccupancySummary } from '@/lib/api/httpServices';
import { DashboardData, EventStatusLabels } from '@/types';
import { formatCurrency, formatDate, formatNumber, formatPercentage } from '@/lib/formatting';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

const toLocalISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftDays = (date: Date, days: number): Date => {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
};

const formatDashboardDate = (date: string): string => formatDate(`${date}T12:00:00`);

const formatVariation = (variation: number | null | undefined): string => {
  if (variation === null || variation === undefined) return 'Sin período comparable';
  const sign = variation > 0 ? '+' : '';
  return `${sign}${formatPercentage(variation)} vs. período anterior`;
};

const getPeriodDates = (
  period: string,
  customFrom: string,
  customTo: string
): { from: string; to: string } => {
  const today = new Date();
  const to = toLocalISODate(today);

  switch (period) {
    case 'today':
      return { from: to, to };
    case '7d':
      return { from: toLocalISODate(shiftDays(today, -6)), to };
    case 'month':
      return { from: toLocalISODate(new Date(today.getFullYear(), today.getMonth(), 1)), to };
    case 'ytd':
      return { from: `${today.getFullYear()}-01-01`, to };
    case 'custom':
      return { from: customFrom, to: customTo };
    case '30d':
    default:
      return { from: toLocalISODate(shiftDays(today, -29)), to };
  }
};

function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Period State from URL parameters
  const activePeriod = searchParams.get('period') || '30d';
  const defaultDates = getPeriodDates('30d', '', '');
  const customDateFrom = searchParams.get('dateFrom') || defaultDates.from;
  const customDateTo = searchParams.get('dateTo') || defaultDates.to;
  const activeCurrency = searchParams.get('currency') || 'PEN';
  const activeDates = getPeriodDates(activePeriod, customDateFrom, customDateTo);

  const [data, setData] = useState<DashboardData | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [occupancy, setOccupancy] = useState<ZoneOccupancySummary | null>(null);
  const [occupancyLoading, setOccupancyLoading] = useState(true);
  const [occupancyError, setOccupancyError] = useState(false);
  const [salesInterval, setSalesInterval] = useState<string | null>(null);
  const [hasPartialData, setHasPartialData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCustomRange, setShowCustomRange] = useState(activePeriod === 'custom');

  useEffect(() => {
    loadDashboard();
  }, [activePeriod, customDateFrom, customDateTo, activeCurrency]);

  useEffect(() => {
    loadOccupancy();
  }, []);

  const loadOccupancy = async () => {
    setOccupancyLoading(true);
    setOccupancyError(false);
    try {
      setOccupancy(await dashboardSummaryService.getOccupancy());
    } catch (error) {
      console.error('Failed to load zone occupancy:', error);
      setOccupancyError(true);
    } finally {
      setOccupancyLoading(false);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    setHasPartialData(false);
    try {
      const filters = {
        dateFrom: activeDates.from,
        dateTo: activeDates.to,
        currency: activeCurrency,
      };
      const [baseResult, summaryResult, evolutionResult, salesByEventResult, upcomingEventsResult] = await Promise.allSettled([
        dashboardService.getDashboardData(filters),
        dashboardSummaryService.getSummary(filters),
        dashboardSummaryService.getSalesEvolution(filters),
        dashboardSummaryService.getSalesByEvent(filters, 5),
        dashboardSummaryService.getUpcomingEvents(toLocalISODate(new Date()), 5),
      ]);

      if (baseResult.status === 'rejected') throw baseResult.reason;

      const baseData = baseResult.value;
      let nextData = baseData;
      setHasPartialData(
        summaryResult.status === 'rejected' ||
        evolutionResult.status === 'rejected' ||
        salesByEventResult.status === 'rejected' ||
        upcomingEventsResult.status === 'rejected'
      );

      if (summaryResult.status === 'rejected') {
        console.error('Failed to load dashboard summaries:', summaryResult.reason);
        setSummary(null);
      } else {
        const summary = summaryResult.value;
        setSummary(summary);
        nextData = {
          ...nextData,
          filters: { ...nextData.filters, currency: activeCurrency },
          kpis: {
            ...nextData.kpis,
            approvedSales: summary.approvedSales,
            paidOrders: summary.paidOrders,
            soldTickets: summary.soldTickets,
            averageOrderValue: summary.averageOrderValue,
          },
        };
      }

      if (evolutionResult.status === 'rejected') {
        console.error('Failed to load approved sales evolution:', evolutionResult.reason);
        setSalesInterval(null);
      } else {
        setSalesInterval(evolutionResult.value.interval);
        nextData = {
          ...nextData,
          salesTimeline: evolutionResult.value.sales.map((point) => ({
            date: point.date,
            sales: point.amount,
            orders: 0,
            tickets: 0,
          })),
        };
      }

      if (salesByEventResult.status === 'rejected') {
        console.error('Failed to load approved sales by event:', salesByEventResult.reason);
      } else {
        nextData = {
          ...nextData,
          salesByEvent: salesByEventResult.value.events.map((event) => ({
            eventId: event.id,
            eventName: event.name,
            sales: event.amount,
            tickets: 0,
          })),
        };
      }

      if (upcomingEventsResult.status === 'rejected') {
        console.error('Failed to load upcoming events:', upcomingEventsResult.reason);
      } else {
        nextData = {
          ...nextData,
          upcomingEvents: upcomingEventsResult.value,
        };
      }

      setData(nextData);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
      setHasPartialData(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', newPeriod);

    if (newPeriod === 'custom') {
      setShowCustomRange(true);
      params.set('dateFrom', customDateFrom);
      params.set('dateTo', customDateTo);
    } else {
      setShowCustomRange(false);
      params.delete('dateFrom');
      params.delete('dateTo');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCurrencyChange = (currency: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('currency', currency);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', 'custom');
    params.set('dateFrom', customDateFrom);
    params.set('dateTo', customDateTo);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Human Readable Active Period Label
  const getPeriodLabel = () => {
    const dates = `${formatDashboardDate(activeDates.from)} – ${formatDashboardDate(activeDates.to)}`;

    switch (activePeriod) {
      case 'today':
        return {
          title: 'Hoy',
          dates,
          badge: 'Tiempo Real',
        };
      case '7d':
        return {
          title: 'Últimos 7 días',
          dates,
          badge: 'Semanal',
        };
      case 'month':
        return {
          title: 'Este mes',
          dates,
          badge: 'Mensual',
        };
      case 'ytd':
        return {
          title: 'Año a la fecha',
          dates,
          badge: 'Anual (YTD)',
        };
      case 'custom':
        return {
          title: 'Rango Personalizado',
          dates,
          badge: 'Personalizado',
        };
      case '30d':
      default:
        return {
          title: 'Últimos 30 días',
          dates,
          badge: 'Mensual estándar',
        };
    }
  };

  const periodInfo = getPeriodLabel();
  const COLORS = ['#4F46E5', '#16A34A', '#D97706', '#DC2626', '#0284C7'];
  const salesTimelineLength = data?.salesTimeline.length || 0;
  const salesTickInterval = salesTimelineLength <= 7 ? 0 : Math.max(1, Math.ceil(salesTimelineLength / 7) - 1);
  const evolutionIntervalLabel: Record<string, string> = {
    day: 'diarias',
    week: 'semanales',
    month: 'mensuales',
    year: 'anuales',
  };
  const evolutionTitle = salesInterval && evolutionIntervalLabel[salesInterval]
    ? `Evolución de ventas ${evolutionIntervalLabel[salesInterval]}`
    : 'Evolución de ventas';

  return (
    <div className="space-y-6">
      {/* Dashboard header and filters */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Dashboard General</h1>
              <Badge variant="brand">{periodInfo.badge}</Badge>
            </div>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Ventas, tickets e inventario comercial de la compañía en un solo lugar.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[240px_190px_auto] lg:items-end">
            <Select
              label="Período"
              options={[
                { value: '30d', label: 'Últimos 30 días' },
                { value: '7d', label: 'Últimos 7 días' },
                { value: 'today', label: 'Hoy' },
                { value: 'month', label: 'Este mes' },
                { value: 'ytd', label: 'Año a la fecha' },
                { value: 'custom', label: 'Rango personalizado...' },
              ]}
              value={activePeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="h-10 font-semibold text-xs"
            />

            <Select
              label="Moneda"
              options={[
                { value: 'PEN', label: 'PEN — Sol peruano' },
                { value: 'USD', label: 'USD — Dólar' },
              ]}
              value={activeCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="h-10 font-semibold text-xs"
            />

            <Link href="/app/events/new" className="sm:col-span-2 lg:col-span-1">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="h-4 w-4" />}
                className="h-10 w-full whitespace-nowrap px-4 lg:w-auto"
              >
                Crear evento
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <Clock className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Período activo</span>
              <p className="truncate text-sm font-bold text-slate-800">
                {periodInfo.title} <span className="font-medium text-slate-500">· {periodInfo.dates}</span>
              </p>
            </div>
          </div>
          {loading ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" /> Actualizando reportes
            </span>
          ) : hasPartialData ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Datos parciales
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Reportes actualizados
            </span>
          )}
        </div>
      </section>

      {/* Custom Range Selector Form (if activePeriod === 'custom') */}
      {showCustomRange && (
        <form onSubmit={handleCustomDateSubmit} className="grid gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 sm:grid-cols-[auto_1fr_auto_1fr] sm:items-center">
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-indigo-900">
            <SlidersHorizontal className="h-4 w-4 text-indigo-600" /> Rango personalizado
          </span>
          <Input type="date" value={customDateFrom} onChange={(e) => router.push(`${pathname}?period=custom&dateFrom=${e.target.value}&dateTo=${customDateTo}&currency=${activeCurrency}`)} />
          <span className="text-xs font-bold text-slate-400">hasta</span>
          <Input type="date" value={customDateTo} onChange={(e) => router.push(`${pathname}?period=custom&dateFrom=${customDateFrom}&dateTo=${e.target.value}&currency=${activeCurrency}`)} />
        </form>
      )}

      {/* KPI Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Card className="h-full border-l-4 border-l-brand-600 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex min-h-10 items-start justify-between gap-3">
              <span className="max-w-[75%] text-[11px] font-bold uppercase leading-4 tracking-wider text-slate-500">Importe de ventas aprobadas</span>
              <div className="shrink-0 rounded-xl bg-brand-50 p-2 text-brand-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {formatCurrency(data?.kpis.approvedSales || 0, activeCurrency)}
              </span>
              <p className={`text-[11px] font-semibold mt-1 ${
                summary?.approvedSalesVariation === null || summary?.approvedSalesVariation === undefined
                  ? 'text-slate-500'
                  : summary.approvedSalesVariation >= 0
                    ? 'text-emerald-600'
                    : 'text-rose-600'
              }`}>
                {formatVariation(summary?.approvedSalesVariation)}
              </p>
            </div>
          </Card>

          <Card className="h-full border-l-4 border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex min-h-10 items-start justify-between gap-3">
              <span className="max-w-[75%] text-[11px] font-bold uppercase leading-4 tracking-wider text-slate-500">Órdenes con pago confirmado</span>
              <div className="shrink-0 rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {formatNumber(data?.kpis.paidOrders || 0)}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Ticket promedio: <span className="font-bold text-slate-800">{formatCurrency(data?.kpis.averageOrderValue || 0, activeCurrency)}</span>
              </p>
            </div>
          </Card>

          <Card className="h-full border-l-4 border-l-sky-500 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex min-h-10 items-start justify-between gap-3">
              <span className="max-w-[75%] text-[11px] font-bold uppercase leading-4 tracking-wider text-slate-500">Tickets vendidos</span>
              <div className="shrink-0 rounded-xl bg-sky-50 p-2 text-sky-600">
                <TicketIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {formatNumber(data?.kpis.soldTickets || 0)}
              </span>
              <p className={`text-[11px] font-semibold mt-1 ${
                summary?.soldTicketsVariation === null || summary?.soldTicketsVariation === undefined
                  ? 'text-slate-500'
                  : summary.soldTicketsVariation >= 0
                    ? 'text-emerald-600'
                    : 'text-rose-600'
              }`}>
                {formatVariation(summary?.soldTicketsVariation)}
              </p>
            </div>
          </Card>

        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Sales Timeline Chart */}
        <Card
          header={
            <div>
              <h3 className="text-sm font-bold text-slate-900">{evolutionTitle}</h3>
              <p className="text-xs text-slate-500">Recaudación en {activeCurrency} para el período: {periodInfo.dates}</p>
            </div>
          }
          className="xl:col-span-3"
        >
          {loading ? (
            <div className="flex h-64 w-full items-end gap-3 px-2 pb-3 sm:h-72">
              <div className="flex h-full w-10 flex-col justify-between py-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-2 w-8 rounded" />
                ))}
              </div>
              <Skeleton className="h-full flex-1 rounded-xl" />
            </div>
          ) : (
          <div className="h-64 w-full pt-2 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.salesTimeline || []} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={false}
                  interval={salesTickInterval}
                  minTickGap={8}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val), activeCurrency), 'Ventas']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          )}
        </Card>

        {/* Sales by Event Breakdown */}
        <Card
          header={
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ventas por Evento</h3>
              <p className="text-xs text-slate-500">Distribución de ingresos por espectáculo</p>
            </div>
          }
          className="xl:col-span-2"
        >
          {loading ? (
            <div className="flex h-64 w-full flex-col justify-center gap-5 px-4 sm:h-72">
              {[78, 62, 48, 36, 24].map((width) => (
                <div key={width} className="flex items-center gap-3">
                  <Skeleton className="h-3 w-24 shrink-0 rounded" />
                  <div style={{ width: `${width}%` }}>
                    <Skeleton className="h-7 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="h-64 w-full pt-2 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.salesByEvent || []} layout="vertical" margin={{ top: 12, right: 16, left: 8, bottom: 0 }} barCategoryGap="28%">
                <XAxis type="number" hide />
                <YAxis dataKey="eventName" type="category" width={132} tick={{ fontSize: 10, fill: '#374151' }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} formatter={(val: any) => [formatCurrency(Number(val), activeCurrency), 'Ingresos']} />
                <Bar dataKey="sales" radius={[0, 6, 6, 0]} maxBarSize={30}>
                  {data?.salesByEvent.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}
        </Card>
      </div>

      {/* Operational information: independent from dashboard filters */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <Card
          header={
            <div className="flex w-full items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Próximos eventos</h3>
                <p className="mt-0.5 text-xs text-slate-500">Los siguientes eventos programados</p>
              </div>
              <Link href="/app/events" className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-600 transition-colors hover:bg-brand-50">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          }
          className="xl:col-span-2"
        >
          <div className="divide-y divide-slate-100">
            {data?.upcomingEvents.map((evt) => (
              <div key={evt.id} className="group flex flex-col gap-3 rounded-xl px-2 py-3.5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {evt.coverImage ? (
                      <img src={evt.coverImage} alt={evt.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Calendar className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/app/events/${evt.id}`} className="block truncate text-sm font-bold text-slate-900 transition-colors hover:text-brand-600">
                      {evt.name}
                    </Link>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {evt.venueName || evt.location} • {evt.date || evt.days?.[0]?.date || 'Por definir'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-2.5 pl-[62px] sm:pl-0">
                  <Badge variant={evt.status === 1 ? 'success' : evt.status === 0 ? 'neutral' : 'warning'}>
                    {EventStatusLabels[evt.status]}
                  </Badge>
                  <Link href={`/app/events/${evt.id}`}>
                    <Button variant="outline" size="sm" className="whitespace-nowrap">
                      Ver evento
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            {!data?.upcomingEvents.length && (
              <div className="py-10 text-center">
                <Calendar className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-xs font-medium text-slate-500">No hay próximos eventos programados.</p>
              </div>
            )}
          </div>
        </Card>

        <aside className="space-y-6 xl:col-span-1">
          <Card
            header={
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Percent className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Estado del inventario</h3>
                </div>
              </div>
            }
          >
            {occupancyLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-14 rounded-lg" />
                  <Skeleton className="h-14 rounded-lg" />
                </div>
              </div>
            ) : occupancyError || !occupancy ? (
              <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/60 px-4 py-5 text-center">
                <p className="text-xs font-medium text-rose-700">No se pudo cargar el inventario de zonas.</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={loadOccupancy}>Reintentar</Button>
              </div>
            ) : (
              <div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ocupación global</p>
                    <p className="mt-1 text-3xl font-black text-slate-900">{formatPercentage(occupancy.occupancyPercentage)}</p>
                  </div>
                  <p className="pb-1 text-xs font-medium text-slate-500">{formatNumber(occupancy.totalCapacity)} espacios</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, occupancy.occupancyPercentage))}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 px-2 py-2.5">
                    <strong className="block text-sm text-slate-800">{formatNumber(occupancy.soldCapacity)}</strong>
                    <span className="text-[10px] text-slate-500">Vendidos</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2 py-2.5">
                    <strong className="block text-sm text-slate-800">{formatNumber(occupancy.reservedCapacity)}</strong>
                    <span className="text-[10px] text-slate-500">Reservados</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2 py-2.5">
                    <strong className="block text-sm text-slate-800">{formatNumber(occupancy.availableCapacity)}</strong>
                    <span className="text-[10px] text-slate-500">Disponibles</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card
            header={
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Alertas operativas</h3>
                </div>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">Demo</span>
              </div>
            }
          >
            <div className="space-y-3">
              {data?.alerts.map((alert) => (
                <div key={alert.id} className="space-y-1.5 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold leading-5 text-amber-950">{alert.title}</span>
                    <Badge variant="warning" size="sm">
                      {alert.type === 'WARNING' ? 'Atención' : alert.type === 'INFO' ? 'Info' : 'Error'}
                    </Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-amber-800">{alert.description}</p>
                </div>
              ))}
              {!data?.alerts.length && (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-500">
                  No hay alertas operativas pendientes.
                </div>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
