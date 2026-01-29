export interface DashboardData {
  students: Student[];
  classes: Class[];
  todayAttendance: Attendance[];
  weekAttendance: Attendance[];
  events: EventItem[];
  announcements: Announcement[];
}


export type StudentStatus = 'Ativo' | 'Inativo';

export type PerformanceStatus =
  | 'Melhorando'
  | 'Atenção'
  | 'Decaindo'
  | 'Não avaliado';

export interface Student {
  id: string;
  status: StudentStatus;
  performance_indicator: PerformanceStatus;
}

export interface Class {
  id: string;
  status: 'Ativa' | 'Inativa';
}

export interface Attendance {
  date: string; // YYYY-MM-DD
  status: 'Presente' | 'Ausente';
}


export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  is_active: boolean;
  priority: 'high' | 'normal' | 'low';
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  event_type: 
    | 'Aula Especial'
    | 'Reunião'
    | 'Prova'
    | 'Evento'
    | 'Feriado'
    | 'Outro';
  start_time?: string;
  color?: string;
}

