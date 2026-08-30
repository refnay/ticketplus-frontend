'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Search, ShoppingBag, Ticket as TicketIcon, Calendar, ArrowRight } from 'lucide-react';
import { customerService } from '@/lib/api/services';
import { Customer } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatting';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCustomers();
  }, [page]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerService.getCustomers({ page, limit: 10, search });
      setCustomers(res.items);
      setTotal(res.total);
    } catch (e) {
      console.error('Failed to load customers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCustomers();
  };

  const columns: Column<Customer>[] = [
    {
      key: 'fullName',
      header: 'Cliente',
      render: (c) => (
        <div>
          <p className="font-bold text-slate-900">{c.fullName}</p>
          <p className="text-[11px] text-slate-500">{c.email} • {c.mobile}</p>
        </div>
      ),
    },
    {
      key: 'document',
      header: 'Documento',
      render: (c) => <span className="font-mono text-xs text-slate-700">{c.document.number}</span>,
    },
    {
      key: 'metrics',
      header: 'Órdenes / Tickets',
      render: (c) => (
        <span className="text-xs font-semibold text-slate-800">
          {c.ordersCount} órdenes ({c.ticketsCount} tickets)
        </span>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Gasto Acumulado',
      render: (c) => <span className="font-bold text-emerald-600">{formatCurrency(c.totalSpent)}</span>,
    },
    {
      key: 'lastPurchaseAt',
      header: 'Última Compra',
      render: (c) => <span className="text-xs text-slate-600">{formatDate(c.lastPurchaseAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Ver Historial',
      align: 'right',
      render: (c) => (
        <Link href={`/app/customers/${c.id}`}>
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Ficha Cliente
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Directorio de Clientes</h1>
        <p className="text-xs text-slate-500 mt-1">
          Base de compradores derivados de transacciones con órdenes registradas.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
          <Input
            placeholder="Buscar por nombre, email o número de documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Button type="submit" variant="secondary">Buscar</Button>
        </form>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        total={total}
        page={page}
        limit={10}
        onPageChange={setPage}
        isLoading={loading}
        rowKey={(c) => c.id}
        onRowClick={(c) => router.push(`/app/customers/${c.id}`)}
      />
    </div>
  );
}
