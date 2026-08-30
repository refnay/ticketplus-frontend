'use client';

import React, { useEffect, useState } from 'react';
import { UserCheck, ShieldCheck, Mail, Plus } from 'lucide-react';
import { companyService } from '@/lib/api/services';
import { Membership, MemberRoleLabels, MemberStatusLabels } from '@/types';
import { formatDate } from '@/lib/formatting';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/ui/DataTable';

export default function TeamPage() {
  const [members, setMembers] = useState<Membership[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeam();
  }, [page]);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await companyService.getTeamMembers({ page, limit: 10 });
      setMembers(res.items);
      setTotal(res.total);
    } catch (e) {
      console.error('Failed to load team members:', e);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Membership>[] = [
    {
      key: 'user',
      header: 'Miembro',
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs overflow-hidden border">
            {m.user?.profileImage ? (
              <img src={m.user.profileImage} alt={m.userName} className="w-full h-full object-cover" />
            ) : (
              <span>{m.userName?.[0]}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-slate-900">{m.userName}</p>
            <p className="text-[11px] text-slate-500">{m.user?.email || 'admin@ticketplus.pe'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol en la Compañía',
      render: (m) => <Badge variant="brand">{MemberRoleLabels[m.role]}</Badge>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (m) => <Badge variant={m.status === 0 ? 'success' : 'neutral'} dot>{MemberStatusLabels[m.status]}</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Fecha de ingreso',
      render: (m) => <span className="text-xs text-slate-600">{formatDate(m.createdAt || '2026-01-15')}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Miembros del Equipo</h1>
          <p className="text-xs text-slate-500 mt-1">Lista de usuarios asociados con acceso a la compañía organizadora.</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={members}
        total={total}
        page={page}
        limit={10}
        onPageChange={setPage}
        isLoading={loading}
        rowKey={(m) => m.id}
      />
    </div>
  );
}
