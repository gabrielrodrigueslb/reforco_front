import { api } from '@/lib/api';

export type AttendanceStatus = 'Presente' | 'Ausente' | 'Justificado';

export type AttendanceRecord = {
  id: string;
  student_id: string;
  date: string;
  shift: string;
  status: AttendanceStatus;
  justification?: string;
  class_id?: string;
  created_date?: string;
};

export type AttendanceCallPayload = {
  date: string;
  turno: string;
  turmaId?: string | null;
  records: Array<{
    student_id: string;
    status: AttendanceStatus;
    justification?: string;
  }>;
};

export const AttendanceService = {
  listByDateTurno: async (params: { date: string; turno: string; turmaId?: string | null }) => {
    const { data } = await api.get<AttendanceRecord[]>('/presencas', {
      params,
    });
    return data;
  },

  history: async (params: { from: string; to: string; turno: string; turmaId?: string | null }) => {
    const { data } = await api.get<AttendanceRecord[]>('/presencas/history', {
      params,
    });
    return data;
  },

  listByAluno: async (alunoId: string, params?: { from?: string; to?: string }) => {
    const { data } = await api.get<AttendanceRecord[]>(
      `/presencas/aluno/${alunoId}`,
      { params }
    );
    return data;
  },

  saveCall: async (payload: AttendanceCallPayload) => {
    const { data } = await api.post<AttendanceRecord[]>('/presencas/chamada', payload);
    return data;
  },
};
