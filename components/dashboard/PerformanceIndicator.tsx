import { Student } from '@/types/dashboard';
import { TrendingUp, AlertCircle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type PerformanceStatus = 'Melhorando' | 'Atenção' | 'Decaindo';

interface PerformanceIndicatorProps {
  students: Student[];
}

export default function PerformanceIndicator({
  students,
}: PerformanceIndicatorProps) {
  const indicators: {
    status: PerformanceStatus;
    icon: LucideIcon;
    bgClass: string;
    textClass: string;
    iconBg: string;
    count: number;
  }[] = [
    {
      status: 'Melhorando',
      icon: TrendingUp,
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      count: students.filter((s) => s.performance_indicator === 'Melhorando')
        .length,
    },
    {
      status: 'Atenção',
      icon: AlertCircle,
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-600',
      iconBg: 'bg-amber-100',
      count: students.filter((s) => s.performance_indicator === 'Atenção')
        .length,
    },
    {
      status: 'Decaindo',
      icon: TrendingDown,
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-600',
      iconBg: 'bg-rose-100',
      count: students.filter((s) => s.performance_indicator === 'Decaindo')
        .length,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <h3 className="font-semibold text-slate-800 mb-4">
        Indicadores de Desempenho
      </h3>

      <div className="space-y-3">
        {indicators.map((ind) => {
          const Icon = ind.icon;

          return (
            <div
              key={ind.status}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02]',
                ind.bgClass,
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', ind.iconBg)}>
                  <Icon className={cn('w-5 h-5', ind.textClass)} />
                </div>
                <span className={cn('font-medium', ind.textClass)}>
                  {ind.status}
                </span>
              </div>

              <span className={cn('text-2xl font-bold', ind.textClass)}>
                {ind.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
