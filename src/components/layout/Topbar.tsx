'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ChevronDown,
  Plus,
  QrCode,
  Search,
  Bell,
  HelpCircle,
  User,
  LogOut,
  Check,
} from 'lucide-react';
import { companyService, authService } from '../../lib/api/services';
import { Company, Membership, UserProfile } from '../../types';
import { Button } from '../ui/Button';

export const Topbar: React.FC = () => {
  const router = useRouter();
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [comp, mems, usr] = await Promise.all([
        companyService.getCompanyDetails(),
        companyService.getUserCompanies(),
        authService.getCurrentUser(),
      ]);
      setActiveCompany(comp);
      setMemberships(mems.items);
      setUser(usr);
    } catch (e) {
      console.error('Error loading topbar state:', e);
    }
  };

  const handleSwitchCompany = async (companyId: string) => {
    try {
      await companyService.switchCompany(companyId);
      setCompanyDropdownOpen(false);
      await loadData();
      router.refresh();
    } catch (e) {
      console.error('Failed to switch company:', e);
    }
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalQuery.trim()) {
      router.push(`/app/events?name=${encodeURIComponent(globalQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left: Company Switcher & Global Search */}
      <div className="flex items-center gap-4 grow max-w-2xl">
        {/* Company Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left focus:outline-none"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
              {activeCompany?.logo ? (
                <img src={activeCompany.logo} alt={activeCompany.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-4 h-4" />
              )}
            </div>
            <div className="hidden sm:flex flex-col max-w-[160px]">
              <span className="text-xs font-bold text-slate-800 truncate">
                {activeCompany?.name || 'Cargando...'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                RUC: {activeCompany?.document?.number || '---'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {companyDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-elevated border border-slate-100 p-2 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Mis Compañías
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {memberships.map((mem) => {
                  const isCurrent = mem.companyId === activeCompany?.id;
                  return (
                    <button
                      key={mem.id}
                      onClick={() => handleSwitchCompany(mem.companyId)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isCurrent ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{mem.companyName}</span>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-slate-100 mt-1">
                <Link
                  href="/companies/new"
                  onClick={() => setCompanyDropdownOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear nueva compañía</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleGlobalSearch} className="grow hidden md:flex relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar eventos, órdenes, folios o clientes..."
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
        </form>
      </div>

      {/* Right: Quick Action Buttons & Profile */}
      <div className="flex items-center gap-3">
        <Link href="/app/events/new">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            <span className="hidden sm:inline">Crear evento</span>
          </Button>
        </Link>

        <Link href="/app/access">
          <Button variant="outline" size="sm" leftIcon={<QrCode className="w-4 h-4 text-emerald-600" />}>
            <span className="hidden sm:inline">Escanear entrada</span>
          </Button>
        </Link>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

        <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors hidden sm:block">
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs overflow-hidden border border-brand-200">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.[0] || 'A'}</span>
              )}
            </div>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-elevated border border-slate-100 p-1.5 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name} {user?.lastName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/app/settings/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Mi Perfil</span>
                </Link>
                <Link
                  href="/app/settings/company"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Configurar compañía</span>
                </Link>
              </div>
              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    localStorage.removeItem('ticketplus_jwt_token');
                    router.push('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
