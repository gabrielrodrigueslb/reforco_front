export interface Responsavel {
  id: string;
  nome: string;
  parentesco: string;
}

export interface Turma {
  id: number;
  nomeTurma: string;
  turno: string;
}

export interface Presenca {
  id: number;
  data: string; // ISO
  presente: boolean;
  justificativa?: string;
  turmaId: number;
}

export interface Documento {
  id: string;
  nome: string;
  tipo:
    | 'BOLETIM'
    | 'LAUDO'
    | 'AUTORIZACAO'
    | 'DECLARACAO'
    | 'MATRICULA'
    | 'HISTORICO_ESCOLAR'
    | 'OUTRO';
  anoLetivo?: number;
  url: string;
}

export interface Aluno {
  id: string;
  nomeCompleto: string;
  dataNascimento: string;
  serieEscolar: string;
  escola: string;
  cpf: string;
  endereco: string;

  alergias?: string;
  necessidadesEspeciais?: string;
  sangue?: string;
  dificuldade?: string;
  jaParticipouDeReforco: boolean;

  matricula: number;
  status: 'MATRICULADO' | 'ATIVO' | 'INATIVO';

  responsaveis: Responsavel[];
  turmas: Turma[];
  presencas: Presenca[];
  boletins: Documento[];

  createdAt: string;
  updatedAt: string;
}

export interface AlunoListItem {
  id: string;
  nomeCompleto: string;
  matricula: number;
  status: string;
}
