'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, GraduationCap } from 'lucide-react';
import {
  Student,
  Class,
  Attendance,
  EventItem,
  Announcement,
} from '@/types/dashboard';
import StatsCard from '@/components/dashboard/StatsCard';
import PerformanceIndicator from '@/components/dashboard/PerformanceIndicator';
import WeeklyChart from '@/components/dashboard/WeeklyChart';
import AnnouncementCard from '@/components/dashboard/AnnouncementCard';
import UpcomingEvents from '@/components/dashboard/UpcomingEvents';
import { Skeleton } from '@/components/ui/skeleton';
import PageTitle from '@/components/page-title';
export interface DashboardData {
  students: Student[];
  classes: Class[];
  todayAttendance: Attendance[];
  weekAttendance: Attendance[];
  events: EventItem[];
  announcements: Announcement[];
}


// --- UTILITÁRIOS DE DATA (NATIVOS) ---
const getTodayISO = () => new Date().toISOString().split('T')[0];

const getWeekRange = () => {
  const curr = new Date();
  const day = curr.getDay();
  // Ajusta para segunda-feira (1) ser o primeiro dia. Se for domingo (0), volta 6 dias.
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(curr.setDate(diff));
  const sunday = new Date(curr.setDate(monday.getDate() + 6));

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
};

// --- DADOS MOCKADOS ---
const MOCK_STUDENTS: Student[] = [
  { id: '1', status: 'Ativo', performance_indicator: 'Melhorando' },
  { id: '2', status: 'Ativo', performance_indicator: 'Atenção' },
  { id: '3', status: 'Ativo', performance_indicator: 'Melhorando' },
  { id: '4', status: 'Inativo', performance_indicator: 'Não avaliado' },
  { id: '5', status: 'Ativo', performance_indicator: 'Decaindo' },
  { id: '6', status: 'Ativo', performance_indicator: 'Melhorando' },
  { id: '7', status: 'Ativo', performance_indicator: 'Atenção' },
  { id: '8', status: 'Ativo', performance_indicator: 'Melhorando' },
];

const MOCK_CLASSES: Class[] = [
  { id: 'c1', status: 'Ativa' },
  { id: 'c2', status: 'Ativa' },
  { id: 'c3', status: 'Ativa' },
  { id: 'c4', status: 'Inativa' },
];


// Gera chamadas para a semana atual para popular o gráfico
const generateMockAttendance = (): Attendance[] => {
  const { start } = getWeekRange();
  const startDate = new Date(start);
  const records: Attendance[] = [];

  for (let i = 0; i < 5; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    records.push(
      { date: dateStr, status: 'Presente' },
      { date: dateStr, status: 'Presente' },
      { date: dateStr, status: 'Presente' },
      { date: dateStr, status: 'Presente' },
    );

    if (i % 2 === 0) {
      records.push({ date: dateStr, status: 'Ausente' });
    }

    records.push({ date: dateStr, status: 'Presente' });
  }

  return records;
};


const MOCK_ATTENDANCE = generateMockAttendance();

const MOCK_EVENTS: EventItem[] = [
  {
    id: 'e1',
    title: 'Reunião de Pais',
    date: getTodayISO(),
    event_type: 'Reunião',
  },
  {
    id: 'e2',
    title: 'Feira de Ciências',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    event_type: 'Evento',
  },
  {
    id: 'e3',
    title: 'Conselho de Classe',
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    event_type: 'Aula Especial',
  },
];


const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: 'Renovação de Matrícula',
    content: 'O período de renovação começa na próxima semana.',
    date: '2023-10-20',
    is_active: true,
    priority: 'high',
  },
  {
    id: 'a2',
    title: 'Novo horário da biblioteca',
    content: 'A biblioteca funcionará até as 18h.',
    date: '2023-10-22',
    is_active: true,
    priority: 'normal',
  },
];


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

  useEffect(() => {
    // Simulação de Fetch de dados
    setTimeout(() => {
      // Filtragem simula o comportamento do backend
      const todayAtt = MOCK_ATTENDANCE.filter((a) => a.date === today);
      const weekAtt = MOCK_ATTENDANCE.filter(
        (a) => a.date >= weekStart && a.date <= weekEnd,
      );

      setData({
        students: MOCK_STUDENTS,
        classes: MOCK_CLASSES,
        todayAttendance: todayAtt,
        weekAttendance: weekAtt,
        events: MOCK_EVENTS,
        announcements: MOCK_ANNOUNCEMENTS,
      });
      setLoading(false);
    }, 1000); // 1 segundo de delay
  }, [today, weekStart, weekEnd]);

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
