import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, UserCheck, UserX, GraduationCap } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

import StatsCard from '../components/dashboard/StatsCard';
import PerformanceIndicator from '../components/dashboard/PerformanceIndicator';
import WeeklyChart from '../components/dashboard/WeeklyChart';
import AnnouncementCard from '../components/dashboard/AnnouncementCard';
import UpcomingEvents from '../components/dashboard/UpcomingEvents';
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const { data: todayAttendance = [] } = useQuery({
    queryKey: ['attendance-today', today],
    queryFn: () => base44.entities.Attendance.filter({ date: today }),
  });

  const { data: weekAttendance = [] } = useQuery({
    queryKey: ['attendance-week'],
    queryFn: async () => {
      const all = await base44.entities.Attendance.list();
      return all.filter(a => a.date >= weekStart && a.date <= weekEnd);
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const all = await base44.entities.CalendarEvent.list();
      return all.filter(e => e.date >= today).sort((a, b) => new Date(a.date) - new Date(b.date));
    },
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const all = await base44.entities.Announcement.list('-created_date');
      return all.filter(a => a.is_active);
    },
  });

  const activeStudents = students.filter(s => s.status === 'Ativo');
  const activeClasses = classes.filter(c => c.status === 'Ativa');
  const presentToday = todayAttendance.filter(a => a.status === 'Presente').length;
  const absentToday = todayAttendance.filter(a => a.status === 'Ausente').length;

  if (loadingStudents) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Visão geral da sua escola</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Alunos"
          value={activeStudents.length}
          subtitle="Alunos ativos"
          icon={Users}
          color="indigo"
        />
        <StatsCard
          title="Presentes Hoje"
          value={presentToday}
          subtitle={`de ${activeStudents.length} alunos`}
          icon={UserCheck}
          color="emerald"
        />
        <StatsCard
          title="Ausentes Hoje"
          value={absentToday}
          subtitle="Precisam de atenção"
          icon={UserX}
          color="rose"
        />
        <StatsCard
          title="Turmas Ativas"
          value={activeClasses.length}
          subtitle="Em funcionamento"
          icon={GraduationCap}
          color="purple"
        />
      </div>

      {/* Charts and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyChart attendanceData={weekAttendance} />
        </div>
        <div>
          <PerformanceIndicator students={activeStudents} />
        </div>
      </div>

      {/* Events and Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEvents events={events} />
        <AnnouncementCard announcements={announcements} />
      </div>
    </div>
  );
}