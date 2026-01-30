import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, Edit, Phone, Mail, MapPin, Heart, BookOpen, 
  Calendar, TrendingUp, TrendingDown, AlertCircle, User,
  FileText, Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function StudentProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get('id');

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => base44.entities.Student.filter({ id: studentId }),
  });

  const { data: guardians = [] } = useQuery({
    queryKey: ['guardians', studentId],
    queryFn: () => base44.entities.Guardian.filter({ student_id: studentId }),
  });

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['student-attendance', studentId],
    queryFn: () => base44.entities.Attendance.filter({ student_id: studentId }),
  });

  const student = students[0];

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const attendanceStats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(a => a.status === 'Presente').length,
    absent: attendanceRecords.filter(a => a.status === 'Ausente').length,
    justified: attendanceRecords.filter(a => a.status === 'Justificado').length,
  };

  const attendanceRate = attendanceStats.total > 0 
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100) 
    : 0;

  const performanceConfig = {
    'Melhorando': { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    'Atenção': { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
    'Decaindo': { icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-100' },
    'Não avaliado': { icon: AlertCircle, color: 'text-slate-600', bg: 'bg-slate-100' },
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Aluno não encontrado</p>
        <Button onClick={() => navigate(createPageUrl('Students'))} className="mt-4">
          Voltar para lista
        </Button>
      </div>
    );
  }

  const age = calculateAge(student.birth_date);
  const perf = performanceConfig[student.performance_indicator] || performanceConfig['Não avaliado'];
  const PerfIcon = perf.icon;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Students'))}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Ficha do Aluno</h1>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl(`StudentGrades?id=${student.id}`)}>
            <Button variant="outline" className="rounded-xl">
              <FileText className="w-4 h-4 mr-2" />
              Boletim
            </Button>
          </Link>
          <Link to={createPageUrl(`StudentForm?id=${student.id}`)}>
            <Button className="bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] rounded-xl">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] p-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-bold">
              {student.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{student.full_name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Badge className="bg-white/20 text-white border-0">{student.grade}</Badge>
                <Badge className="bg-white/20 text-white border-0">{student.shift}</Badge>
                {age && <span className="text-white/80">{age} anos</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Performance */}
          <div className={cn("p-4 rounded-xl flex items-center gap-4", perf.bg)}>
            <PerfIcon className={cn("w-8 h-8", perf.color)} />
            <div>
              <p className="text-sm text-slate-500">Desempenho</p>
              <p className={cn("font-semibold", perf.color)}>{student.performance_indicator || 'Não avaliado'}</p>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="p-4 rounded-xl bg-blue-50 flex items-center gap-4">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-slate-500">Frequência</p>
              <p className="font-semibold text-blue-600">{attendanceRate}%</p>
            </div>
          </div>

          {/* Status */}
          <div className={cn(
            "p-4 rounded-xl flex items-center gap-4",
            student.status === 'Ativo' ? 'bg-emerald-50' : 'bg-slate-100'
          )}>
            <User className={cn(
              "w-8 h-8",
              student.status === 'Ativo' ? 'text-emerald-600' : 'text-slate-500'
            )} />
            <div>
              <p className="text-sm text-slate-500">Situação</p>
              <p className={cn(
                "font-semibold",
                student.status === 'Ativo' ? 'text-emerald-600' : 'text-slate-500'
              )}>{student.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            Dados Pessoais
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Data de Nascimento</p>
              <p className="font-medium text-slate-800">
                {student.birth_date 
                  ? format(new Date(student.birth_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Escola de Origem</p>
              <p className="font-medium text-slate-800">{student.origin_school || '-'}</p>
            </div>
          </div>
        </div>

        {/* Health Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            Saúde
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Tipo Sanguíneo</p>
              <p className="font-medium text-slate-800">{student.blood_type || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Alergias</p>
              <p className="font-medium text-slate-800">{student.allergies || 'Nenhuma registrada'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Medicamentos</p>
              <p className="font-medium text-slate-800">{student.medications || 'Nenhum'}</p>
            </div>
          </div>
        </div>

        {/* Guardians */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-500" />
            Responsáveis
          </h3>
          <div className="space-y-4">
            {guardians.map((guardian) => (
              <div key={guardian.id} className="p-4 rounded-xl bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-slate-800">{guardian.full_name}</p>
                  <Badge variant="outline">{guardian.relationship}</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4" />
                    {guardian.phone}
                  </p>
                  {guardian.email && (
                    <p className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4" />
                      {guardian.email}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {guardians.length === 0 && (
              <p className="text-slate-500 text-sm">Nenhum responsável cadastrado</p>
            )}
          </div>
        </div>

        {/* Pedagogical */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Informações Pedagógicas
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-2">Matérias com Dificuldade</p>
              <div className="flex flex-wrap gap-2">
                {(student.difficulty_subjects || []).map((subject, i) => (
                  <Badge key={i} className="bg-rose-100 text-rose-700">{subject}</Badge>
                ))}
                {(!student.difficulty_subjects || student.difficulty_subjects.length === 0) && (
                  <span className="text-slate-500 text-sm">Nenhuma registrada</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Reação às dificuldades</p>
              <p className="font-medium text-slate-800">{student.difficulty_reaction || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Fez reforço antes?</p>
              <p className="font-medium text-slate-800">{student.previous_tutoring ? 'Sim' : 'Não'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Resumo de Frequência
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 text-center">
            <p className="text-2xl font-bold text-slate-800">{attendanceStats.total}</p>
            <p className="text-sm text-slate-500">Total de aulas</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 text-center">
            <p className="text-2xl font-bold text-emerald-600">{attendanceStats.present}</p>
            <p className="text-sm text-slate-500">Presenças</p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50 text-center">
            <p className="text-2xl font-bold text-rose-600">{attendanceStats.absent}</p>
            <p className="text-sm text-slate-500">Faltas</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 text-center">
            <p className="text-2xl font-bold text-amber-600">{attendanceStats.justified}</p>
            <p className="text-sm text-slate-500">Justificadas</p>
          </div>
        </div>
      </div>
    </div>
  );
}