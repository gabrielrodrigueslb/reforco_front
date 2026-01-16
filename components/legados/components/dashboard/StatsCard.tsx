import React from 'react';
import { cn } from "@/lib/utils";

export default function StatsCard({ title, value, subtitle, icon: Icon, color = "indigo", trend }) {
  const colorClasses = {
    indigo: "from-indigo-500 to-indigo-600 shadow-indigo-200",
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-200",
    amber: "from-amber-500 to-amber-600 shadow-amber-200",
    rose: "from-rose-500 to-rose-600 shadow-rose-200",
    purple: "from-purple-500 to-purple-600 shadow-purple-200",
    blue: "from-blue-500 to-blue-600 shadow-blue-200",
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className={cn(
          "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform",
          colorClasses[color]
        )}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  );
}