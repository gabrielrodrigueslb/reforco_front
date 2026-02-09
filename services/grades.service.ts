import { api } from '@/lib/api';

export type GradeRecord = {
  id: string;
  student_id: string;
  subject: string;
  bimester: 1 | 2 | 3 | 4;
  grade: number;
  notes?: string;
  created_at?: string;
};

export type GradePayload = {
  subject: string;
  bimester: number;
  grade: number;
  notes?: string;
};

export const GradesService = {
  listByAluno: async (alunoId: string): Promise<GradeRecord[]> => {
    const { data } = await api.get<GradeRecord[]>(`/alunos/${alunoId}/notas`);
    return data;
  },

  create: async (alunoId: string, payload: GradePayload): Promise<GradeRecord> => {
    const { data } = await api.post<GradeRecord>(`/alunos/${alunoId}/notas`, payload);
    return data;
  },
};
