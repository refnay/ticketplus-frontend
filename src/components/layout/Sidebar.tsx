'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  Users,
  Tag,
  MessageSquare,
  QrCode,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  User,
  Building2,
} from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith('/app/settings'));

  useEffect(() => {
    if (pathname.startsWith('/app/settings')) setSettingsOpen(true);
  }, [pathname]);

  const navItems = [
    { href: '/app', label: 'Inicio', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/app/events', label: 'Eventos', icon: <Calendar className="w-5 h-5" /> },
    { href: '/app/sales', label: 'Ventas', icon: <CreditCard className="w-5 h-5" /> },
    { href: '/app/customers', label: 'Clientes', icon: <Users className="w-5 h-5" /> },
    { href: '/app/discounts', label: 'Descuentos', icon: <Tag className="w-5 h-5" /> },
    { href: '/app/reviews', label: 'Opiniones', icon: <MessageSquare className="w-5 h-5" /> },
    { href: '/app/access', label: 'Control de acceso', icon: <QrCode className="w-5 h-5" /> },
    { href: '/app/team', label: 'Equipo', icon: <UserCheck className="w-5 h-5" /> },
  ];

  const isActive = (path: string) => {
    if (path === '/app') return pathname === '/app';
    return pathname.startsWith(path);
  };

  return (
    <aside
      className={clsx(
        'bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 shrink-0 sticky top-0 h-screen z-30 select-none',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <Link href="/app" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
            T+
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base text-white tracking-tight leading-tight">
                Ticketplus
              </span>
              <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest">
                ERP Admin
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1.5 grow overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors group',
                active
                  ? 'bg-brand-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className={clsx(active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')}>
                {item.icon}
              </div>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        <div>
          <button
            type="button"
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                setSettingsOpen(true);
              } else {
                setSettingsOpen((current) => !current);
              }
            }}
            className={clsx(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors group',
              pathname.startsWith('/app/settings')
                ? 'bg-brand-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
            )}
            title={collapsed ? 'Configuración' : undefined}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="grow text-left">Configuración</span>
                <ChevronDown className={clsx('h-4 w-4 transition-transform', settingsOpen && 'rotate-180')} />
              </>
            )}
          </button>
          {!collapsed && settingsOpen && (
            <div className="ml-5 mt-1.5 space-y-1 border-l border-slate-700 pl-3">
              <Link
                href="/app/settings/profile"
                className={clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  pathname.startsWith('/app/settings/profile')
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                )}
              >
                <User className="h-4 w-4" /> Perfil
              </Link>
              <Link
                href="/app/settings/company"
                className={clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  pathname.startsWith('/app/settings/company')
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                )}
              >
                <Building2 className="h-4 w-4" /> Compañía
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Footer / Badge */}
      {!collapsed && (
        <div className="p-4 m-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Ticketplus v2.4</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Plataforma SaaS ERP para la gestión inteligente de eventos.
          </p>
        </div>
      )}
    </aside>
  );
};
