import { studentsMock } from '@/mocks/students.mock';
import { StudentWithClass } from '@/types/students';

export const StudentsService = {
  list: async (): Promise<StudentWithClass[]> => {
    await new Promise((r) => setTimeout(r, 300));
    return studentsMock;
  },
};
