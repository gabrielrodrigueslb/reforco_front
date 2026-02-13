'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, GraduationCap } from 'lucide-react';
import {
  Student,
  Class,
  Attendance,
  EventItem,
  Announcement,
  DashboardData,
} from '@/types/dashboard';
import StatsCard from '@/components/dashboard/StatsCard';
import PerformanceIndicator from '@/components/dashboard/PerformanceIndicator';
import WeeklyChart from '@/components/dashboard/WeeklyChart';
import AnnouncementCard from '@/components/dashboard/AnnouncementCard';
import UpcomingEvents from '@/components/dashboard/UpcomingEvents';
import { Skeleton } from '@/components/ui/skeleton';
import PageTitle from '@/components/page-title';
import { StudentsService, StudentResponse } from '@/services/students.service';
import { ClassesService } from '@/services/classes.service';
import {
  AttendanceService,
  AttendanceRecord,
} from '@/services/attendance.service';
import { AnnouncementsService } from '@/services/announcements.service';
import { EventsService } from '@/services/events.service';
import type { ClassItem } from '@/types/classes';

// --- UTILITÃRIOS DE DATA (NATIVOS) ---
const toLocalISO = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getTodayISO = () => toLocalISO(new Date());

const getWeekRange = () => {
  const curr = new Date();
  const day = curr.getDay();
  // Ajusta para segunda-feira (1) ser o primeiro dia. Se for domingo (0), volta 6 dias.
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(curr.setDate(diff));
  const sunday = new Date(curr.setDate(monday.getDate() + 6));

  return {
    start: toLocalISO(monday),
    end: toLocalISO(sunday),
  };
};

const normalizePerformanceIndicator = (
  value?: string,
): Student['performance_indicator'] => {
  if (!value) return 'Não avaliado' as Student['performance_indicator'];
  return value as Student['performance_indicator'];
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export default function Dashboard() {
  // Estado local
  const [data, setData] = useState<DashboardData>({
    students: [],
    classes: [],
    todayAttendance: [],
    weekAttendance: [],
    events: [],
    announcements: [],
  });

  const [loading, setLoading] = useState(true);

  const today = getTodayISO();
  const { start: weekStart, end: weekEnd } = getWeekRange();
  const upcomingEnd = toLocalISO(addDays(new Date(), 30));

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [
          studentsRaw,
          classesRaw,
          weekMorning,
          weekAfternoon,
          weekMorningPlain,
          announcements,
          eventsRaw,
        ] = await Promise.all([
          StudentsService.list(),
          ClassesService.list(),
          AttendanceService.history({
            from: weekStart,
            to: weekEnd,
            turno: 'Manhã',
            turmaId: null,
          }),
          AttendanceService.history({
            from: weekStart,
            to: weekEnd,
            turno: 'Tarde',
            turmaId: null,
          }),
          AttendanceService.history({
            from: weekStart,
            to: weekEnd,
            turno: 'Manha',
            turmaId: null,
          }),
          AnnouncementsService.list(),
          EventsService.list({ from: today, to: upcomingEnd }),
        ]);

        const students: Student[] = (studentsRaw || []).map(
          (s: StudentResponse) => ({
            id: s.id,
            status: s.status,
            performance_indicator: normalizePerformanceIndicator(
              s.performance_indicator,
            ),
          }),
        );

        const classes: Class[] = (classesRaw || []).map((c: ClassItem) => ({
          id: String(c.id),
          status: c.status || 'Ativa',
        }));

        const toAttendance = (items: AttendanceRecord[]): Attendance[] =>
          (items || []).map((a) => ({
            date: a.date,
            status:
              a.status === 'Presente'
                ? 'Presente'
                : a.status === 'Justificado'
                  ? 'Presente'
                  : 'Ausente',
          }));

        const weekAttendance = [
          ...toAttendance(weekMorning as AttendanceRecord[]),
          ...toAttendance(weekAfternoon as AttendanceRecord[]),
          ...toAttendance(weekMorningPlain as AttendanceRecord[]),
        ];
        const todayAttendance = weekAttendance.filter((a) => a.date === today);

        if (!mounted) return;
        setData({
          students,
          classes,
          todayAttendance,
          weekAttendance,
          announcements,
          events: (eventsRaw || []).map(EventsService.toDashboard),
        });
      } catch (error) {
        console.error(error);
        if (mounted) {
          setData({
            students: [],
            classes: [],
            todayAttendance: [],
            weekAttendance: [],
            events: [],
            announcements: [],
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [today, weekStart, weekEnd, upcomingEnd]);

  // Cálculos derivados
  const activeStudents = data.students.filter((s) => s.status === 'Ativo');
  const activeClasses = data.classes.filter((c) => c.status === 'Ativa');
  const presentToday = data.todayAttendance.filter(
    (a) => a.status === 'Presente',
  ).length;
  const absentToday = data.todayAttendance.filter(
    (a) => a.status === 'Ausente',
  ).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <PageTitle
          title="Dashboard"
          className="text-2xl lg:text-3xl font-bold text-slate-800"
        />
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
          <WeeklyChart attendanceData={data.weekAttendance} />
        </div>
        <div>
          <PerformanceIndicator students={activeStudents} />
        </div>
      </div>

      {/* Events and Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEvents events={data.events} />
        <AnnouncementCard announcements={data.announcements} />
      </div>
    </div>
  );
}
