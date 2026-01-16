import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, Search, TrendingUp, TrendingDown, AlertCircle, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const grades = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º EM', '2º EM', '3º EM'];

export default function Grades() {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: allGrades = [] } = useQuery({
    queryKey: ['all-grades'],
    queryFn: () => base44.entities.Grade.list(),
  });

  const getStudentGrades = (studentId) => {
    return allGrades.filter(g => g.student_id === studentId);
  };

  const getAverageGrade = (studentId) => {
    const studentGrades = getStudentGrades(studentId);
    if (studentGrades.length === 0) return null;
    const sum = studentGrades.reduce((acc, g) => acc + g.grade_value, 0);
    return (sum / studentGrades.length).toFixed(1);
  };

  const filteredStudents = students
    .filter(s => s.status === 'Ativo')
    .filter(s => !search || s.full_name.toLowerCase().includes(search.toLowerCase()))
    .filter(s => gradeFilter === 'all' || s.grade === gradeFilter)
    .filter(s => performanceFilter === 'all' || s.performance_indicator === performanceFilter);

  const performanceConfig = {
    'Melhorando': { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    'Atenção': { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
    'Decaindo': { icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-100' },
    'Não avaliado': { icon: AlertCircle, color: 'text-slate-500', bg: 'bg-slate-100' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Boletins e Notas</h1>
        <p className="text-slate-500 mt-1">Acompanhe o desempenho dos alunos</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-32 h-10 rounded-xl">
              <SelectValue placeholder="Série" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {grades.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
            <SelectTrigger className="w-40 h-10 rounded-xl">
              <SelectValue placeholder="Desempenho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Melhorando">Melhorando</SelectItem>
              <SelectItem value="Atenção">Atenção</SelectItem>
              <SelectItem value="Decaindo">Decaindo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-3 gap-4">
        {['Melhorando', 'Atenção', 'Decaindo'].map(status => {
          const config = performanceConfig[status];
          const Icon = config.icon;
          const count = students.filter(s => s.performance_indicator === status).length;
          
          return (
            <div key={status} className={cn("rounded-2xl p-4 text-center", config.bg)}>
              <Icon className={cn("w-8 h-8 mx-auto mb-2", config.color)} />
              <p className={cn("text-2xl font-bold", config.color)}>{count}</p>
              <p className="text-sm text-slate-600">{status}</p>
            </div>
          );
        })}
      </div>

      {/* Students List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Nenhum aluno encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
          {filteredStudents.map(student => {
            const avg = getAverageGrade(student.id);
            const perf = performanceConfig[student.performance_indicator] || performanceConfig['Não avaliado'];
            const PerfIcon = perf.icon;
            
            return (
              <Link 
                key={student.id}
                to={createPageUrl(`StudentGrades?id=${student.id}`)}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {student.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{student.full_name}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>{student.grade}</span>
                      <span>•</span>
                      <span>{student.shift}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-slate-500">Média Geral</p>
                    <p className={cn(
                      "text-xl font-bold",
                      avg >= 7 ? "text-emerald-600" : avg >= 5 ? "text-amber-600" : avg ? "text-rose-600" : "text-slate-400"
                    )}>
                      {avg || '-'}
                    </p>
                  </div>

                  <Badge className={cn("hidden sm:flex items-center gap-1", perf.bg, perf.color)}>
                    <PerfIcon className="w-3 h-3" />
                    {student.performance_indicator || 'Não avaliado'}
                  </Badge>

                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}