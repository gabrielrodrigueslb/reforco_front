'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Heart,
  BookOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  User,
  Clock,
  Plus,
  FileText,
  Download,
  Eye,
  Upload,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import PageTitle from '@/components/page-title';
import { toast } from 'sonner';
import { StudentsService, StudentResponse } from '@/services/students.service';
import { AttendanceService, AttendanceRecord } from '@/services/attendance.service';
import { GradesService, GradeRecord } from '@/services/grades.service';
import { StudentDocumentsService, StudentDocument } from '@/services/student-documents.service';

const createPageUrl = (path: string) => {
  return `/main/alunos/${path}`;
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const formatCPF = (value?: string) => {
  if (!value) return '-';
  const v = onlyDigits(value).slice(0, 11);
  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export default function StudentProfile() {
  const router = useRouter();
  const params = useParams();
  const studentId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [openGradeModal, setOpenGradeModal] = useState(false);
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    subject: '',
    bimester: '1',
    grade: '',
  });
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [openDocumentModal, setOpenDocumentModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<StudentDocument | null>(null);
  const [documentForm, setDocumentForm] = useState({
    name: '',
    type: 'OUTRO',
    year: '',
    notes: '',
    file: null as File | null,
  });
  const [isDownloading, setIsDownloading] = useState(false); // Novo estado para feedback visual
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!studentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all([
      StudentsService.getById(studentId),
      AttendanceService.listByAluno(studentId),
    ])
      .then(async ([data, attendance]) => {
        setStudent(data);
        setGuardians(data.guardians || []);
        setAttendanceRecords(attendance || []);

        const [gradeList, docs] = await Promise.all([
          GradesService.listByAluno(studentId).catch(() => []),
          StudentDocumentsService.listByAluno(studentId).catch(() => []),
        ]);
        setGrades(gradeList || []);
        setDocuments(docs || []);
      })
      .catch(() => {
        toast.error('Não foi possível carregar o aluno');
        setStudent(null);
        setGuardians([]);
        setAttendanceRecords([]);
        setGrades([]);
        setDocuments([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [studentId]);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const attendanceStats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter((a) => a.status === 'Presente').length,
    absent: attendanceRecords.filter((a) => a.status === 'Ausente').length,
    justified: attendanceRecords.filter((a) => a.status === 'Justificado')
      .length,
  };

  const attendanceRate =
    attendanceStats.total > 0
      ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
      : 0;

  const performanceConfig: any = {
    Melhorando: {
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    Atenção: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
    Decaindo: { icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-100' },
    'Não avaliado': {
      icon: AlertCircle,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
  };

  // --- NOVA FUNÇÃO DE DOWNLOAD FORÇADO ---
  const handleDownload = async (url: string, filename: string) => {
    try {
      setIsDownloading(true);
      toast.info('Iniciando download...');

      const response = await fetch(url);
      if (!response.ok) throw new Error('Falha ao baixar arquivo');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename; // Isso força o download com o nome correto
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download concluído!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao baixar. O arquivo será aberto na guia.');
      // Fallback: abre em nova aba se o fetch falhar (ex: CORS)
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-6">
        <Skeleton className="h-12 w-48 mb-6" />
        <Skeleton className="h-48 w-full rounded-2xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Aluno não encontrado</p>
        <Button onClick={() => router.push('/main/alunos')} className="mt-4">
          Voltar para lista
        </Button>
      </div>
    );
  }

  const age = calculateAge(student.birth_date);
  const perf =
    performanceConfig[student.performance_indicator] ||
    performanceConfig['Não avaliado'];
  const PerfIcon = perf.icon;

  const studentGrades = grades.filter((g) => g.student_id === student.id);
  const gradesBySubject = studentGrades.reduce<Record<string, GradeRecord[]>>((acc, grade) => {
    acc[grade.subject] = acc[grade.subject] ? [...acc[grade.subject], grade] : [grade];
    return acc;
  }, {});
  const overallAverage = studentGrades.length
    ? (studentGrades.reduce((sum, g) => sum + g.grade, 0) / studentGrades.length).toFixed(1)
    : '--';

  const handleAddGrade = async () => {
    if (!studentId || isSavingGrade) return;
    const gradeValue = Number(gradeForm.grade);
    if (!gradeForm.subject.trim() || !Number.isFinite(gradeValue)) {
      toast.error('Preencha disciplina e nota.');
      return;
    }

    setIsSavingGrade(true);
    try {
      const newGrade = await GradesService.create(studentId, {
        subject: gradeForm.subject.trim(),
        bimester: Number(gradeForm.bimester),
        grade: gradeValue,
      });
      setGrades((prev) => [newGrade, ...prev]);
      setGradeForm({ subject: '', bimester: '1', grade: '' });
      setOpenGradeModal(false);
      toast.success('Nota adicionada.');
    } catch {
      toast.error('Erro ao salvar nota.');
    } finally {
      setIsSavingGrade(false);
    }
  };

  const documentTypes = [
    { value: 'BOLETIM', label: 'Boletim' },
    { value: 'LAUDO', label: 'Laudo' },
    { value: 'AUTORIZACAO', label: 'Autorização' },
    { value: 'DECLARACAO', label: 'Declaração' },
    { value: 'MATRICULA', label: 'Matrícula' },
    { value: 'HISTORICO_ESCOLAR', label: 'Histórico Escolar' },
    { value: 'OUTRO', label: 'Outro' },
  ];

  const handleDocumentFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDocumentForm((prev) => ({
      ...prev,
      file,
      name: prev.name || file.name,
    }));
  };

  const handleUploadDocument = async () => {
    if (!studentId || isUploadingDocument) return;
    if (!documentForm.file) {
      toast.error('Selecione um arquivo para anexar.');
      return;
    }

    setIsUploadingDocument(true);
    try {
      const uploaded = await StudentDocumentsService.upload(studentId, {
        file: documentForm.file,
        name: documentForm.name || documentForm.file.name,
        type: documentForm.type,
        year: documentForm.year,
        notes: documentForm.notes,
      });
      setDocuments((prev) => [uploaded, ...prev]);
      resetDocumentForm();
      setOpenDocumentModal(false);
      toast.success('Documento anexado.');
    } catch {
      toast.error('Erro ao anexar documento.');
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const resetDocumentForm = () => {
    setDocumentForm({ name: '', type: 'OUTRO', year: '', notes: '', file: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenDocumentModal = () => {
    resetDocumentForm();
    setOpenDocumentModal(true);
  };

  const handleRemoveDocument = async () => {
    if (!studentId || !documentToDelete) return;
    try {
      await StudentDocumentsService.remove(studentId, documentToDelete.id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentToDelete.id));
      toast.success('Documento removido.');
    } catch {
      toast.error('Erro ao remover documento.');
    } finally {
      setDocumentToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6 max-w-4xl mx-auto p-1 sm:p-6 ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/main/alunos')}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <PageTitle
            title="Ficha do Aluno"
            className="text-2xl lg:text-3xl font-bold text-slate-800"
          />
        </div>
        <div className="flex gap-3">
          <Link href={createPageUrl(`StudentForm?id=${student.id}`)}>
            <Button className="bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-to) rounded-xl text-white">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-to) p-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {student.foto_aluno ? (
                <Image
                  src={student.foto_aluno}
                  alt={student.full_name || 'Foto do aluno'}
                  width={80}
                  height={80}
                  unoptimized
                />
              ) : (
                <span>{student.full_name?.charAt(0)?.toUpperCase()}</span>
              )}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{student.full_name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                  {student.grade}
                </Badge>
                <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                  {student.shift}
                </Badge>
                {age && (
                  <span className="text-white/80 text-sm font-medium">
                    {age} anos
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Performance */}
          <div
            className={cn(
              'p-4 rounded-xl flex items-center gap-4 transition-colors',
              perf.bg,
            )}
          >
            <PerfIcon className={cn('w-8 h-8', perf.color)} />
            <div>
              <p className="text-sm text-slate-500 font-medium">Desempenho</p>
              <p className={cn('font-bold text-lg', perf.color)}>
                {student.performance_indicator || 'Não avaliado'}
              </p>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="p-4 rounded-xl bg-blue-50 flex items-center gap-4">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-slate-500 font-medium">Frequência</p>
              <p className="font-bold text-lg text-blue-600">
                {attendanceRate}%
              </p>
            </div>
          </div>

          {/* Status */}
          <div
            className={cn(
              'p-4 rounded-xl flex items-center gap-4',
              student.status === 'Ativo' ? 'bg-emerald-50' : 'bg-slate-100',
            )}
          >
            <User
              className={cn(
                'w-8 h-8',
                student.status === 'Ativo'
                  ? 'text-emerald-600'
                  : 'text-slate-500',
              )}
            />
            <div>
              <p className="text-sm text-slate-500 font-medium">Situação</p>
              <p
                className={cn(
                  'font-bold text-lg',
                  student.status === 'Ativo'
                    ? 'text-emerald-600'
                    : 'text-slate-500',
                )}
              >
                {student.status}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Boletim integrado */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Boletim</h3>
            <p className="text-sm text-slate-500">Notas por disciplina e bimestre</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-slate-100 text-slate-700">
              Média geral: {overallAverage}
            </Badge>
            <Button
              onClick={() => setOpenGradeModal(true)}
              className="bg-linear-to-r from-(--brand-gradient-from) to-[var(--brand-gradient-to)] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar nota
            </Button>
          </div>
        </div>

        {studentGrades.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-slate-500">
            Nenhuma nota cadastrada para este aluno.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 pr-4">Disciplina</th>
                  <th className="py-2 pr-4">1º</th>
                  <th className="py-2 pr-4">2º</th>
                  <th className="py-2 pr-4">3º</th>
                  <th className="py-2 pr-4">4º</th>
                  <th className="py-2">Média</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(gradesBySubject).map(([subject, subjectGrades]) => {
                  const bimMap = subjectGrades.reduce<Record<number, number>>((acc, g) => {
                    acc[g.bimester] = g.grade;
                    return acc;
                  }, {});
                  const avg =
                    subjectGrades.reduce((sum, g) => sum + g.grade, 0) / subjectGrades.length;
                  return (
                    <tr key={subject} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium text-slate-800">{subject}</td>
                      {[1, 2, 3, 4].map((b) => (
                        <td key={b} className="py-2 pr-4 text-slate-600">
                          {bimMap[b] ?? '--'}
                        </td>
                      ))}
                      <td className="py-2 text-slate-700 font-semibold">{avg.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Documentos do aluno (ALTERADO) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Documentos do Aluno</h3>
            <p className="text-sm text-slate-500">
              Mostrando apenas documentos fixados na ficha do aluno.
            </p>
          </div>
          <Button
            onClick={handleOpenDocumentModal}
            className="bg-linear-to-r from-(--brand-gradient-from) to-[var(--brand-gradient-to)] text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Anexar documento
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {documents.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-slate-500">
              Nenhum documento fixado para este aluno.
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border shrink-0">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate" title={doc.name}>
                      {doc.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {doc.type}
                      {doc.year ? ` • ${doc.year}` : ''}
                      {doc.created_at
                        ? ` • ${format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}`
                        : ''}
                    </p>
                  </div>
                </div>

                {/* Dropdown Menu com Download Forçado */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                      <MoreVertical className="w-4 h-4" />
                      <span className="sr-only">Ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a href={doc.url} target="_blank" rel="noreferrer" className="cursor-pointer">
                        <Eye className="w-4 h-4 mr-2 text-slate-500" />
                        Visualizar
                      </a>
                    </DropdownMenuItem>
                    
                    {/* Botão de Download com lógica fetch/blob */}
                    <DropdownMenuItem 
                      onClick={() => handleDownload(doc.url, doc.name)}
                      disabled={isDownloading}
                      className="cursor-pointer"
                    >
                      <Download className="w-4 h-4 mr-2 text-slate-500" />
                      Baixar
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="text-rose-600 focus:text-rose-600 cursor-pointer"
                      onClick={() => setDocumentToDelete(doc)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Details Grid (O restante do código permanece igual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-indigo-500" />
            Dados Pessoais
          </h3>
          <div className="space-y-4 divide-y divide-slate-50">
            <div className="pt-2">
              <p className="text-sm text-slate-500 mb-1">Data de Nascimento</p>
              <p className="font-medium text-slate-800">
                {student.birth_date
                  ? format(
                      new Date(student.birth_date),
                      "dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR },
                    )
                  : '-'}
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-slate-500 mb-1">CPF</p>
              <p className="font-medium text-slate-800">
                {formatCPF(student.cpf)}
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-slate-500 mb-1">Endereço</p>
              <p className="font-medium text-slate-800">
                {student.address || '-'}
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-slate-500 mb-1">Escola de Origem</p>
              <p className="font-medium text-slate-800">
                {student.origin_school || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Health Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-lg">
            <Heart className="w-5 h-5 text-rose-500" />
            Saúde
          </h3>
          <div className="space-y-4 divide-y divide-slate-50">
            <div className="pt-2">
              <p className="text-sm text-slate-500 mb-1">Tipo Sanguíneo</p>
              <p className="font-medium text-slate-800">
                {student.blood_type || '-'}
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-slate-500 mb-1">Alergias</p>
              <p className="font-medium text-slate-800">
                {student.allergies || 'Nenhuma registrada'}
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-slate-500 mb-1">Medicamentos</p>
              <p className="font-medium text-slate-800">
                {student.medications || 'Nenhum'}
              </p>
            </div>
          </div>
        </div>

        {/* Guardians */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-purple-500" />
            Responsáveis
          </h3>
          <div className="space-y-4">
            {guardians.map((guardian) => (
              <div
                key={guardian.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-800">
                    {guardian.full_name}
                  </p>
                  <Badge variant="outline" className="bg-white">
                    {guardian.relationship}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-4 h-4 text-slate-400" />
                    {guardian.cpf ? formatCPF(guardian.cpf) : '-'}
                  </p>
                  <p className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {guardian.phone}
                  </p>
                  {guardian.email && (
                    <p className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {guardian.email}
                    </p>
                  )}
                  <p className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {guardian.address || '-'}
                  </p>
                </div>
              </div>
            ))}
            {guardians.length === 0 && (
              <p className="text-slate-500 text-sm italic">
                Nenhum responsável cadastrado
              </p>
            )}
          </div>
        </div>

        {/* Pedagogical */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Informações Pedagógicas
          </h3>
          <div className="space-y-4 divide-y divide-slate-50">
            <div className="pt-2">
              <p className="text-sm text-slate-500 mb-2">
                Matérias com Dificuldade
              </p>
              <div className="flex flex-wrap gap-2">
                {(student.difficulty_subjects || []).map(
                  (subject: string, i: number) => (
                    <Badge
                      key={i}
                      className="bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100"
                    >
                      {subject}
                    </Badge>
                  ),
                )}
                {(!student.difficulty_subjects ||
                  student.difficulty_subjects.length === 0) && (
                  <span className="text-slate-500 text-sm italic">
                    Nenhuma registrada
                  </span>
                )}
              </div>
            </div>
            <div className="pt-4">
              <p className="text-sm text-slate-500 mb-1">
                Reação às dificuldades
              </p>
              <p className="font-medium text-slate-800">
                {student.difficulty_reaction || '-'}
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-slate-500 mb-1">
                Observações de comportamento
              </p>
              <p className="font-medium text-slate-800">
                {student.behavior_notes || '-'}
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-slate-500 mb-1">Fez reforço antes?</p>
              <p className="font-medium text-slate-800">
                {student.previous_tutoring ? 'Sim' : 'Não'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-indigo-500" />
          Resumo de Frequência
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 text-center border border-slate-100">
            <p className="text-3xl font-bold text-slate-800">
              {attendanceStats.total}
            </p>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Total de aulas
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 text-center border border-emerald-100">
            <p className="text-3xl font-bold text-emerald-600">
              {attendanceStats.present}
            </p>
            <p className="text-sm text-emerald-600/80 font-medium mt-1">
              Presenças
            </p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50 text-center border border-rose-100">
            <p className="text-3xl font-bold text-rose-600">
              {attendanceStats.absent}
            </p>
            <p className="text-sm text-rose-600/80 font-medium mt-1">Faltas</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 text-center border border-amber-100">
            <p className="text-3xl font-bold text-amber-600">
              {attendanceStats.justified}
            </p>
            <p className="text-sm text-amber-600/80 font-medium mt-1">
              Justificadas
            </p>
          </div>
        </div>
      </div>
      </div>
      {/* Modal de nota */}
      <Dialog open={openGradeModal} onOpenChange={setOpenGradeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar nota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Disciplina</Label>
              <Input
                value={gradeForm.subject}
                onChange={(e) => setGradeForm({ ...gradeForm, subject: e.target.value })}
                className="mt-2"
                placeholder="Ex: Matemática"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 ">
              <div>
                <Label>Bimestre</Label>
                <Select
                  value={gradeForm.bimester}
                  onValueChange={(value) => setGradeForm({ ...gradeForm, bimester: value })}
                >
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1°</SelectItem>
                    <SelectItem value="2">2°</SelectItem>
                    <SelectItem value="3">3°</SelectItem>
                    <SelectItem value="4">4°</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nota</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={gradeForm.grade}
                  onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                  className="mt-2"
                  placeholder="Ex: 8.5"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenGradeModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddGrade}
              className="bg-linear-to-r from-(--brand-gradient-from) to-[var(--brand-gradient-to)] text-white"
              disabled={isSavingGrade}
            >
              {isSavingGrade ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de documento */}
      <Dialog open={openDocumentModal} onOpenChange={setOpenDocumentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Anexar documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do documento</Label>
              <Input
                value={documentForm.name}
                onChange={(e) => setDocumentForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex.: Autorização de saída"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={documentForm.type}
                onValueChange={(value) => setDocumentForm((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((doc) => (
                    <SelectItem key={doc.value} value={doc.value}>
                      {doc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano letivo (opcional)</Label>
              <Input
                type="number"
                value={documentForm.year}
                onChange={(e) => setDocumentForm((prev) => ({ ...prev, year: e.target.value }))}
                placeholder="2026"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Arquivo *</Label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleDocumentFileChange}
                className="h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
              {documentForm.file?.name ? (
                <p className="text-xs text-slate-500">Selecionado: {documentForm.file.name}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                value={documentForm.notes}
                onChange={(e) => setDocumentForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="min-h-24"
                placeholder="Ex.: entregue pelos pais, válido até..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDocumentModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUploadDocument}
              disabled={isUploadingDocument}
              className="bg-linear-to-r from-(--brand-gradient-from) to-[var(--brand-gradient-to)] text-white"
            >
              {isUploadingDocument ? 'Enviando...' : 'Anexar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de remoção de documento */}
      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não poderá ser desfeita. O arquivo será excluído do registro do aluno.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-500 hover:bg-rose-600" onClick={handleRemoveDocument}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
