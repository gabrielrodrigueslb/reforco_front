import { api } from '@/lib/api';

export type GuardianPayload = {
  is_primary?: boolean;
  full_name: string;
  cpf: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
};

export type StudentPayload = {
  full_name: string;
  birth_date: string;
  grade: string;
  shift: string;
  status: 'Ativo' | 'Inativo';
  class_id?: string;
  origin_school?: string;
  cpf: string;
  address: string;
  allergies?: string;
  blood_type?: string;
  medical_reports?: string;
  medications?: string;
  behavior_notes?: string;
  difficulty_subjects?: string[];
  difficulty_reaction?: string;
  previous_tutoring?: null | boolean;
  performance_indicator?: string;
  guardians?: GuardianPayload[];
};

export type StudentResponse = StudentPayload & {
  id: string;
  foto_aluno?: string;
  created_at?: string;
};

function normalizeStudent(data: StudentResponse): StudentResponse {
  const baseUpload = process.env.NEXT_PUBLIC_URLBASE_UPLOAD || '';
  const foto =
    data.foto_aluno && data.foto_aluno.startsWith('http')
      ? data.foto_aluno
      : data.foto_aluno
        ? `${baseUpload}${data.foto_aluno}`
        : undefined;

  return {
    ...data,
    foto_aluno: foto,
    class_id: data.class_id ?? '',
    difficulty_subjects: data.difficulty_subjects ?? [],
    performance_indicator: data.performance_indicator ?? 'Não avaliado',
    origin_school: data.origin_school ?? '',
    allergies: data.allergies ?? '',
    blood_type: data.blood_type ?? '',
    medications: data.medications ?? '',
    medical_reports: data.medical_reports ?? '',
    behavior_notes: data.behavior_notes ?? '',
    difficulty_reaction: data.difficulty_reaction ?? '',
  };
}

export const StudentsService = {
  list: async (): Promise<StudentResponse[]> => {
    const { data } = await api.get<StudentResponse[]>('/alunos');
    return data.map(normalizeStudent);
  },

  getById: async (id: string): Promise<StudentResponse> => {
    const { data } = await api.get<StudentResponse>(`/alunos/${id}`);
    return normalizeStudent(data);
  },

  create: async (payload: StudentPayload): Promise<StudentResponse> => {
    const { data } = await api.post<StudentResponse>('/alunos', payload);
    return normalizeStudent(data);
  },

  update: async (
    id: string,
    payload: Partial<StudentPayload>,
  ): Promise<StudentResponse> => {
    const { data } = await api.put<StudentResponse>(`/alunos/${id}`, payload);
    return normalizeStudent(data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/alunos/${id}`);
  },

  uploadPhoto: async (id: string, file: File): Promise<StudentResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.put<StudentResponse>(
      `/alunos/${id}/foto`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return normalizeStudent(data);
  },
};
