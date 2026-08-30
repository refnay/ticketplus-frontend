'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Plus, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { companyService } from '@/lib/api/services';
import { Membership, MemberRoleLabels } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export default function SelectCompanyPage() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await companyService.getUserCompanies();
      setMemberships(res.items);
    } catch (e) {
      console.error('Error loading companies:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = async (companyId: string) => {
    try {
      await companyService.switchCompany(companyId);
      router.push('/app');
    } catch (e) {
      console.error('Error switching company:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-elevated p-8 border border-slate-100 space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Selecciona tu Compañía</h1>
            <p className="text-xs text-slate-500 mt-1">Elige el espacio de trabajo para administrar tus eventos</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : memberships.length === 0 ? (
          <div className="text-center py-8 space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No perteneces a ninguna compañía</p>
            <p className="text-xs text-slate-500">Crea tu primera empresa organizadora para comenzar.</p>
            <Link href="/companies/new">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Crear mi compañía
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {memberships.map((mem) => (
              <div
                key={mem.id}
                onClick={() => handleSelectCompany(mem.companyId)}
                className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-sm bg-white hover:bg-brand-50/20 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-base shrink-0 border border-indigo-200">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {mem.companyName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="brand" size="sm">
                        {MemberRoleLabels[mem.role]}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400 group-hover:text-brand-600">
                  <span className="text-xs font-semibold hidden sm:inline">Ingresar</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
