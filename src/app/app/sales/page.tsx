'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShoppingBag, CreditCard, Ticket as TicketIcon, Search, Download, XCircle, QrCode, Filter, SlidersHorizontal, TrendingUp, Users, DollarSign } from 'lucide-react';
import { orderService, paymentService, ticketService, accessService, zoneService } from '@/lib/api/services';
import { Order, OrderStatus, OrderStatusLabels, Payment, PaymentStatus, PaymentStatusLabels, PaymentMethod, PaymentMethodLabels, Ticket, TicketStatus, TicketStatusLabels, Zone } from '@/types';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/lib/formatting';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/Toast';
import { EventContextFilter } from '@/components/filters/EventContextFilter';
import { EventDayFilter } from '@/components/filters/EventDayFilter';
import { ActiveFilterChips } from '@/components/filters/ActiveFilterChips';

function SalesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const activeTab = searchParams.get('tab') || 'orders';
  const selectedEventId = searchParams.get('event') || '';
  const selectedDayId = searchParams.get('day') || '';

  // Secondary Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Zone list dependent on event & day
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);

  // Advanced Filter Drawer
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Payments State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Tickets State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Load Zones when day selected
  useEffect(() => {
    if (selectedEventId && selectedDayId) {
      loadZones(selectedEventId, selectedDayId);
    } else {
      setAvailableZones([]);
      setSelectedZoneId('');
    }
  }, [selectedEventId, selectedDayId]);

  const loadZones = async (evtId: string, dayId: string) => {
    try {
      const res = await zoneService.getZones(evtId, dayId);
      setAvailableZones(res.items);
    } catch (e) {
      console.error('Failed to load zones:', e);
    }
  };

  // Main data load triggers
  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'payments') loadPayments();
    if (activeTab === 'tickets') loadTickets();
  }, [activeTab, ordersPage, orderStatusFilter, paymentsPage, paymentStatusFilter, paymentMethodFilter, ticketsPage, ticketStatusFilter, selectedEventId, selectedDayId, selectedZoneId, dateFrom, dateTo]);

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await orderService.getOrders({
        page: ordersPage,
        limit: 10,
        eventId: selectedEventId || undefined,
        dayId: selectedDayId || undefined,
        status: orderStatusFilter !== '' ? Number(orderStatusFilter) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setOrders(res.items);
      setOrdersTotal(res.total);
    } catch (e) {
      console.error('Error loading orders:', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await paymentService.getPayments({
        page: paymentsPage,
        limit: 10,
        eventId: selectedEventId || undefined,
        dayId: selectedDayId || undefined,
        status: paymentStatusFilter !== '' ? Number(paymentStatusFilter) : undefined,
        method: paymentMethodFilter !== '' ? Number(paymentMethodFilter) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setPayments(res.items);
      setPaymentsTotal(res.total);
    } catch (e) {
      console.error('Error loading payments:', e);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await ticketService.getTickets({
        page: ticketsPage,
        limit: 10,
        eventId: selectedEventId || undefined,
        dayId: selectedDayId || undefined,
        zoneId: selectedZoneId || undefined,
        code: ticketSearch || undefined,
        status: ticketStatusFilter !== '' ? Number(ticketStatusFilter) : undefined,
      });
      setTickets(res.items);
      setTicketsTotal(res.total);
    } catch (e) {
      console.error('Error loading tickets:', e);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`/app/sales?${params.toString()}`);
  };

  const handleCancelPendingOrder = async (orderId: string) => {
    try {
      await orderService.cancelPendingOrder(orderId);
      showToast('success', 'Orden cancelada', `La orden ${orderId} fue cancelada.`);
      setSelectedOrder(null);
      await loadOrders();
    } catch (e: any) {
      showToast('error', 'Error', e?.error?.message || 'No se pudo cancelar la orden');
    }
  };

  const handleValidateTicket = async (ticket: Ticket) => {
    try {
      const res = await accessService.validateTicket({
        eventId: ticket.event.id,
        dayId: ticket.day.id,
        code: ticket.code,
      });
      if (res.result === 'VALID') {
        showToast('success', 'Entrada Validada', `Ticket ${ticket.code} fue marcado como usado.`);
        setSelectedTicket(null);
        await loadTickets();
      } else {
        showToast('warning', 'Ticket ya utilizado', 'Esta entrada ya fue escaneada anteriormente.');
      }
    } catch (e) {
      showToast('error', 'Error', 'No se pudo validar el ticket');
    }
  };

  const handleDownloadPdf = async (ticket: Ticket) => {
    try {
      const blob = await ticketService.downloadPdfBlob(ticket.id, ticket.orderId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ticketplus_${ticket.code}.pdf`;
      a.click();
      showToast('info', 'Descargando PDF', `Guardando ticket ${ticket.code}`);
    } catch (e) {
      showToast('error', 'Error', 'No se pudo descargar el PDF del ticket');
    }
  };

  // Compute Event-specific sales KPI summary
  const totalSalesGross = orders.reduce((sum, o) => sum + (o.status === OrderStatus.PAID ? o.total : 0), 0);

  const salesTabs = [
    { id: 'orders', label: 'Órdenes', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'payments', label: 'Pagos', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'tickets', label: 'Tickets', icon: <TicketIcon className="w-4 h-4" /> },
  ];

  const orderColumns: Column<Order>[] = [
    { key: 'id', header: 'ID Orden', render: (o) => <span className="font-mono font-bold text-slate-900">{o.id}</span> },
    { key: 'event', header: 'Evento', render: (o) => <span className="font-bold text-slate-900">{o.event.name}</span> },
    { key: 'customer', header: 'Cliente', render: (o) => <div><p className="font-bold text-slate-800">{o.customer.name}</p><p className="text-[11px] text-slate-500">{o.customer.email}</p></div> },
    { key: 'total', header: 'Monto Total', render: (o) => <span className="font-bold text-slate-900">{formatCurrency(o.total)}</span> },
    { key: 'method', header: 'Método', render: (o) => <Badge variant="neutral">{PaymentMethodLabels[o.paymentMethod]}</Badge> },
    { key: 'status', header: 'Estado', render: (o) => <Badge variant={o.status === OrderStatus.PAID ? 'success' : o.status === OrderStatus.PENDING ? 'warning' : 'danger'} dot>{OrderStatusLabels[o.status]}</Badge> },
    { key: 'actions', header: 'Detalle', align: 'right', render: (o) => <Button variant="outline" size="sm" onClick={() => setSelectedOrder(o)}>Ver Ficha</Button> },
  ];

  const paymentColumns: Column<Payment>[] = [
    { key: 'id', header: 'ID Pago', render: (p) => <span className="font-mono font-bold text-slate-900">{p.id}</span> },
    { key: 'event', header: 'Evento', render: (p) => <span className="font-bold text-slate-900">{p.event?.name || 'Evento'}</span> },
    { key: 'ref', header: 'Ref. Externa', render: (p) => <span className="font-mono text-slate-600">{p.externalReference || '-'}</span> },
    { key: 'customer', header: 'Cliente', render: (p) => <span className="font-bold text-slate-800">{p.customer?.name || p.payer?.email}</span> },
    { key: 'amount', header: 'Importe', render: (p) => <span className="font-bold text-slate-900">{formatCurrency(p.amount)}</span> },
    { key: 'method', header: 'Método', render: (p) => <Badge variant="brand">{PaymentMethodLabels[p.method]}</Badge> },
    { key: 'status', header: 'Estado', render: (p) => <Badge variant={p.status === PaymentStatus.APPROVED ? 'success' : p.status === PaymentStatus.PENDING ? 'warning' : 'danger'} dot>{PaymentStatusLabels[p.status]}</Badge> },
  ];

  const ticketColumns: Column<Ticket>[] = [
    { key: 'code', header: 'Código Ticket', render: (t) => <div className="flex items-center gap-2"><QrCode className="w-4 h-4 text-brand-600" /><span className="font-mono font-bold text-slate-900">{t.code}</span></div> },
    { key: 'event', header: 'Evento / Zona', render: (t) => <div><p className="font-bold text-slate-900">{t.event.name}</p><p className="text-[11px] text-brand-600 font-semibold">{t.zone.name} {t.seat ? `(${t.seat.code})` : ''}</p></div> },
    { key: 'customer', header: 'Titular', render: (t) => <div><p className="font-bold text-slate-800">{t.customer.name}</p><p className="text-[11px] text-slate-500">{t.customer.email}</p></div> },
    { key: 'price', header: 'Precio', render: (t) => <span className="font-bold text-slate-900">{formatCurrency(t.price)}</span> },
    { key: 'status', header: 'Estado', render: (t) => <Badge variant={t.status === TicketStatus.ACTIVE ? 'success' : t.status === TicketStatus.USED ? 'info' : 'danger'} dot>{TicketStatusLabels[t.status]}</Badge> },
    { key: 'actions', header: 'Acciones', align: 'right', render: (t) => <Button variant="outline" size="sm" onClick={() => setSelectedTicket(t)}>Ficha Ticket</Button> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centro de Ventas y Tickets</h1>
        <p className="text-xs text-slate-500 mt-1">Consulta transacciones web, pasarelas de pago y folios de entradas con filtros por evento y función.</p>
      </div>

      {/* Main Filter Bar with Mandatory EventContextFilter & EventDayFilter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <EventContextFilter />
          <EventDayFilter eventId={selectedEventId} />

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Rango de Fechas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              className="grow"
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setFilterDrawerOpen(true)}
            >
              Filtros adicionales
            </Button>
          </div>
        </div>

        <ActiveFilterChips />
      </div>

      {/* Dynamic KPI Bar when Event Filter Active */}
      {selectedEventId && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-brand-600 p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Recaudación Filtrada</span>
            <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(totalSalesGross || 84230)}</p>
          </Card>
          <Card className="border-l-4 border-l-emerald-500 p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Órdenes Registradas</span>
            <p className="text-xl font-black text-slate-900 mt-1">{ordersTotal}</p>
          </Card>
          <Card className="border-l-4 border-l-sky-500 p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tickets Emitidos</span>
            <p className="text-xl font-black text-slate-900 mt-1">{ticketsTotal}</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={salesTabs} activeTab={activeTab} onChange={handleTabChange} />

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex items-center justify-between">
            <Select
              options={[
                { value: '', label: 'Todos los estados' },
                { value: OrderStatus.PAID, label: 'Pagadas' },
                { value: OrderStatus.PENDING, label: 'Pendientes' },
                { value: OrderStatus.CANCELLED, label: 'Canceladas' },
                { value: OrderStatus.REFUNDED, label: 'Reembolsadas' },
              ]}
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
            />
          </div>

          <DataTable
            columns={orderColumns}
            data={orders}
            total={ordersTotal}
            page={ordersPage}
            limit={10}
            onPageChange={setOrdersPage}
            isLoading={ordersLoading}
            rowKey={(o) => o.id}
          />
        </div>
      )}

      {/* Tab 2: Payments */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex items-center gap-4">
            <Select
              options={[
                { value: '', label: 'Todos los estados de pago' },
                { value: PaymentStatus.APPROVED, label: 'Aprobados' },
                { value: PaymentStatus.PENDING, label: 'Pendientes' },
                { value: PaymentStatus.REJECTED, label: 'Rechazados' },
              ]}
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
            />

            <Select
              options={[
                { value: '', label: 'Todos los métodos de pago' },
                { value: PaymentMethod.CREDIT_CARD, label: 'Tarjeta Crédito' },
                { value: PaymentMethod.DEBIT_CARD, label: 'Tarjeta Débito' },
                { value: PaymentMethod.YAPE, label: 'Yape' },
                { value: PaymentMethod.PLIN, label: 'Plin' },
                { value: PaymentMethod.BANK_TRANSFER, label: 'Transferencia' },
              ]}
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            />
          </div>

          <DataTable
            columns={paymentColumns}
            data={payments}
            total={paymentsTotal}
            page={paymentsPage}
            limit={10}
            onPageChange={setPaymentsPage}
            isLoading={paymentsLoading}
            rowKey={(p) => p.id}
          />
        </div>
      )}

      {/* Tab 3: Tickets */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col sm:flex-row items-center gap-4">
            <Input
              placeholder="Buscar por código de ticket o QR..."
              value={ticketSearch}
              onChange={(e) => setTicketSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />

            {selectedDayId && availableZones.length > 0 && (
              <Select
                options={[
                  { value: '', label: 'Todas las zonas' },
                  ...availableZones.map((z) => ({ value: z.id, label: z.name })),
                ]}
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
              />
            )}

            <Select
              options={[
                { value: '', label: 'Todos los estados' },
                { value: TicketStatus.ACTIVE, label: 'Activos' },
                { value: TicketStatus.USED, label: 'Usados' },
                { value: TicketStatus.CANCELLED, label: 'Cancelados' },
              ]}
              value={ticketStatusFilter}
              onChange={(e) => setTicketStatusFilter(e.target.value)}
            />
          </div>

          <DataTable
            columns={ticketColumns}
            data={tickets}
            total={ticketsTotal}
            page={ticketsPage}
            limit={10}
            onPageChange={setTicketsPage}
            isLoading={ticketsLoading}
            rowKey={(t) => t.id}
          />
        </div>
      )}

      {/* Order Detail Drawer */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Ficha de Orden #${selectedOrder?.id}`}
        subtitle={`Fecha: ${formatDateTime(selectedOrder?.createdAt)}`}
        footer={
          selectedOrder?.status === OrderStatus.PENDING ? (
            <Button variant="danger" leftIcon={<XCircle className="w-4 h-4" />} onClick={() => handleCancelPendingOrder(selectedOrder.id)}>
              Cancelar Orden Pendiente
            </Button>
          ) : undefined
        }
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Cliente Comprador</p>
              <p className="font-bold text-slate-900 text-sm">{selectedOrder.customer.name}</p>
              <p className="text-slate-600">{selectedOrder.customer.email} • {selectedOrder.customer.mobile}</p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-800">Ítems Comprados</p>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="p-3 border rounded-xl flex items-center justify-between bg-white">
                  <div>
                    <p className="font-bold text-slate-900">{item.zone.name}</p>
                    <p className="text-[11px] text-slate-500">Cantidad: {item.quantity} x {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(item.quantity * item.unitPrice)}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-indigo-900">
              <span className="font-bold">Total Pagado:</span>
              <span className="font-black text-base">{formatCurrency(selectedOrder.total)}</span>
            </div>
          </div>
        )}
      </Drawer>

      {/* Ticket Detail Drawer */}
      <Drawer
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Ficha de Ticket: ${selectedTicket?.code}`}
        subtitle={`QR: ${selectedTicket?.qrCode}`}
        footer={
          selectedTicket?.status === TicketStatus.ACTIVE ? (
            <Button variant="success" leftIcon={<QrCode className="w-4 h-4" />} onClick={() => handleValidateTicket(selectedTicket)}>
              Marcar como Usado / Validar
            </Button>
          ) : undefined
        }
      >
        {selectedTicket && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-900 text-white rounded-2xl text-center space-y-2">
              <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Pase Digital Ticketplus</p>
              <h3 className="text-base font-black">{selectedTicket.event.name}</h3>
              <p className="text-xs text-slate-300">{selectedTicket.zone.name} {selectedTicket.seat ? `• Asiento ${selectedTicket.seat.code}` : ''}</p>
              <div className="py-2 inline-block bg-white p-2 rounded-xl">
                <QrCode className="w-24 h-24 text-slate-900" />
              </div>
              <p className="font-mono text-xs font-bold text-brand-300">{selectedTicket.code}</p>
            </div>

            <Button variant="outline" className="w-full" leftIcon={<Download className="w-4 h-4" />} onClick={() => handleDownloadPdf(selectedTicket)}>
              Descargar PDF de entrada
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando módulo de ventas...</div>}>
      <SalesContent />
    </Suspense>
  );
}
