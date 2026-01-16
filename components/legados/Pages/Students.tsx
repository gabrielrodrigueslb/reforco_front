import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserPlus, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import StudentCard from '../components/students/StudentCard';
import StudentFilters from '../components/students/StudentFilters';

export default function Students() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    grade: '',
    shift: '',
    status: '',
    difficulty: ''
  });
  const [deleteStudent, setDeleteStudent] = useState(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Student.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteStudent(null);
    },
  });

  const filteredStudents = students.filter(student => {
    if (filters.search && !student.full_name?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.grade && student.grade !== filters.grade) return false;
    if (filters.shift && student.shift !== filters.shift) return false;
    if (filters.status && student.status !== filters.status) return false;
    if (filters.difficulty && !student.difficulty_subjects?.includes(filters.difficulty)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Alunos</h1>
          <p className="text-slate-500 mt-1">{students.length} alunos cadastrados</p>
        </div>
        <Link to={createPageUrl('StudentForm')}>
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white h-12 px-6 rounded-xl shadow-lg shadow-indigo-200">
            <UserPlus className="w-5 h-5 mr-2" />
            Novo Aluno
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <StudentFilters filters={filters} setFilters={setFilters} />

      {/* Students Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhum aluno encontrado</h3>
          <p className="text-slate-500 mb-6">
            {filters.search || filters.grade || filters.shift || filters.status || filters.difficulty
              ? 'Tente ajustar os filtros de busca'
              : 'Comece cadastrando seu primeiro aluno'}
          </p>
          {!filters.search && !filters.grade && !filters.shift && !filters.status && !filters.difficulty && (
            <Link to={createPageUrl('StudentForm')}>
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600">
                <UserPlus className="w-5 h-5 mr-2" />
                Cadastrar Aluno
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => (
            <StudentCard 
              key={student.id} 
              student={student} 
              onDelete={setDeleteStudent}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteStudent} onOpenChange={() => setDeleteStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o aluno <strong>{deleteStudent?.full_name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600"
              onClick={() => deleteMutation.mutate(deleteStudent.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}