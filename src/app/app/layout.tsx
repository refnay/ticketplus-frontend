'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-app-bg text-text-main overflow-x-hidden">
      <Sidebar />
      <div className="flex flex-col grow min-w-0">
        <Topbar />
        <main className="p-6 grow">{children}</main>
      </div>
    </div>
  );
}
