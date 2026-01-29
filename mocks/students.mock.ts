import { StudentWithClass } from '@/types/students';

export const studentsMock: StudentWithClass[] = [
  {
    id: '1',
    full_name: 'Ana Júlia Souza',
    status: 'Ativo',
    grade: '5º Ano',
    shift: 'Manhã',
    class_id: '1',
  },
  {
    id: '2',
    full_name: 'Carlos Eduardo',
    status: 'Ativo',
    grade: '5º Ano',
    shift: 'Manhã',
    class_id: '1',
  },
  {
    id: '3',
    full_name: 'Mariana Lima',
    status: 'Inativo',
    grade: '6º Ano',
    shift: 'Tarde',
    class_id: '2',
  },
];
