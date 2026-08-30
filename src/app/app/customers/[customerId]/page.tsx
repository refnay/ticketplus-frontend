'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { User, Mail, Phone, CreditCard, ShoppingBag, Ticket as TicketIcon, Star, ArrowLeft } from 'lucide-react';
import { customerService } from '@/lib/api/services';
import { Customer } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatting';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    setLoading(true);
    try {
      const res = await customerService.getCustomerDetails(customerId);
      setCustomer(res);
    } catch (e) {
      console.error('Failed to load customer details:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !customer) {
    return <div className="p-8 text-center text-slate-500">Cargando ficha del cliente...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/customers" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2">
          <ArrowLeft className="w-4 h-4" /> Volver a clientes
        </Link>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ficha del Cliente: {customer.fullName}</h1>
        <p className="text-xs text-slate-500 mt-1">Historial completo de compras, entradas y opiniones.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-brand-600">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Gasto Total Acumulado</span>
          <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(customer.totalSpent)}</p>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Órdenes Realizadas</span>
          <p className="text-xl font-black text-slate-900 mt-1">{customer.ordersCount}</p>
        </Card>

        <Card className="border-l-4 border-l-sky-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Entradas Adquiridas</span>
          <p className="text-xl font-black text-slate-900 mt-1">{customer.ticketsCount}</p>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Espectáculos Distintos</span>
          <p className="text-xl font-black text-slate-900 mt-1">{customer.eventsCount}</p>
        </Card>
      </div>

      {/* Customer Info Card */}
      <Card header={<h3 className="text-sm font-bold text-slate-900">Información Personal</h3>}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold">Correo electrónico</span>
            <span className="font-bold text-slate-900">{customer.email}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold">Documento de identidad</span>
            <span className="font-mono font-bold text-slate-900">{customer.document.number}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold">Celular</span>
            <span className="font-bold text-slate-900">{customer.mobile}</span>
          </div>
        </div>
      </Card>

      {/* History Tabs / Lists */}
      <Card header={<h3 className="text-sm font-bold text-slate-900">Historial de Órdenes</h3>}>
        <div className="divide-y divide-slate-100">
          {customer.orders?.map((ord) => (
            <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono font-bold text-slate-900">{ord.id}</span>
                <p className="text-slate-500">{ord.event.name} • {formatDate(ord.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">{formatCurrency(ord.total)}</span>
                <Badge variant={ord.status === 1 ? 'success' : 'neutral'}>
                  {ord.status === 1 ? 'Pagada' : 'Pendiente'}
                </Badge>
              </div>
            </div>
          )) || <p className="text-xs text-slate-400 py-4 text-center">No hay órdenes registradas.</p>}
        </div>
      </Card>
    </div>
  );
}
