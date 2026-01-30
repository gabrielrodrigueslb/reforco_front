'use client';

import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebarToggle } from '@/components/sidebar-toggle';

export default function PageTitle({
  title,
  className,
  wrapperClassName,
}: {
  title: string;
  className?: string;
  wrapperClassName?: string;
}) {
  const { toggle } = useSidebarToggle();

  return (
    <div className={cn('flex items-center gap-2', wrapperClassName)}>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggle}
        aria-label="Abrir menu"
      >
        <PanelLeft className="w-5 h-5" />
      </Button>
      <h1 className={cn('text-2xl lg:text-3xl font-bold opacity-80', className)}>
        {title}
      </h1>
    </div>
  );
}
