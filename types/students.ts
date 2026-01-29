type StudentStatus = 'Ativo' | 'Inativo';

type PerformanceStatus =
  | 'Melhorando'
  | 'Atenção'
  | 'Decaindo'
  | 'Não avaliado';

export interface Student {
  id: string;
  full_name: string;
  foto_aluno?: string;
  birth_date?: string;
  grade?: string;
  shift?: string;
  status: StudentStatus;
  origin_school?: string;
  blood_type?: string;
  allergies?: string;
  medications?: string;
  difficulty_subjects?: string[];
  difficulty_reaction?: string;
  previous_tutoring?: boolean;
  performance_indicator?: PerformanceStatus;
}

export interface Guardian {
  id: string;
  student_id: string;
  full_name: string;
  relationship: string;
  phone: string;
  email?: string;
}

type AttendanceStatus = 'Presente' | 'Ausente' | 'Justificado';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  status: AttendanceStatus;
  date: string;
}

/**
 * ✅ Extensão só para a feature de Turmas:
 * (depois você troca por turma_id no banco / API)
 */
export type StudentWithClass = Student & {
  class_id?: string; // opcional pra não quebrar quem não usa turma
};
