'use client';

import { createContext, useContext } from 'react';

type SidebarToggleContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const SidebarToggleContext = createContext<SidebarToggleContextValue | null>(null);

export function SidebarToggleProvider({
  open,
  setOpen,
  children,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const toggle = () => setOpen(!open);

  return (
    <SidebarToggleContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </SidebarToggleContext.Provider>
  );
}

export function useSidebarToggle() {
  const ctx = useContext(SidebarToggleContext);
  if (!ctx) {
    throw new Error('useSidebarToggle must be used within SidebarToggleProvider');
  }
  return ctx;
}
