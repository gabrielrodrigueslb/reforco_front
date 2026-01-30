'use client';

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import { SidebarToggleProvider } from '@/components/sidebar-toggle';

export default function MainShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarToggleProvider open={sidebarOpen} setOpen={setSidebarOpen}>
      <main className="flex flex-col-reverse sm:flex-row w-full min-h-dvh">
        <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <section className="min-h-dvh w-full overflow-x-hidden p-4 animate-in fade-in fade-out duration-100 max-h-screen">
          {children}
        </section>
      </main>
    </SidebarToggleProvider>
  );
}
