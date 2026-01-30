'use client'

import React, { useState, useEffect } from 'react';
import { Calendar, Users, Check, X, Clock, Save, Loader2, History, ChevronLeft, ChevronRight, Eye, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import PageTitle from "@/components/page-title";

type Shift = 'Manh?' | 'Tarde';
type AttendanceStatus = 'Presente' | 'Ausente' | 'Justificado';

type ClassItem = {
  id: string;
  name: string;
  shift: Shift;
};

type Student = {
  id: string;
  full_name: string;
  status: 'Ativo' | 'Inativo';
  shift: Shift;
  class_id: string;
  grade: string;
};

type AttendanceRecord = {
  id: string;
  student_id: string;
  date: string;
  shift: Shift;
  status: AttendanceStatus;
  justification?: string;
  class_id?: string;
  created_date?: string;
  created_by?: string;
};

type AttendanceCall = {
  date: string;
  shift: Shift;
  created_by?: string;
  created_date?: string;
  records: AttendanceRecord[];
};


// --- DADOS MOCKADOS ---
const MOCK_CLASSES: ClassItem[] = [
  { id: 'c1', name: 'Turma A - 4º Ano', shift: 'Manhã' },
  { id: 'c2', name: 'Turma B - 5º Ano', shift: 'Tarde' },
];

const MOCK_STUDENTS: Student[] = [
  { id: '1', full_name: 'Ana Júlia Souza', status: 'Ativo', shift: 'Manhã', class_id: 'c1', grade: '4º Ano' },
  { id: '2', full_name: 'Bruno Lima', status: 'Ativo', shift: 'Manhã', class_id: 'c1', grade: '4º Ano' },
  { id: '3', full_name: 'Carlos Eduardo', status: 'Ativo', shift: 'Tarde', class_id: 'c2', grade: '5º Ano' },
  { id: '4', full_name: 'Daniela Alves', status: 'Ativo', shift: 'Tarde', class_id: 'c2', grade: '5º Ano' },
];

// Dados iniciais para popular o histórico
const INITIAL_HISTORY: AttendanceRecord[] = [
  { id: 'h1', student_id: '1', date: '2023-10-25', shift: 'Manhã', status: 'Presente', created_date: '2023-10-25T07:30:00', created_by: 'Prof. Silva' },
  { id: 'h2', student_id: '2', date: '2023-10-25', shift: 'Manhã', status: 'Ausente', created_date: '2023-10-25T07:30:00', created_by: 'Prof. Silva' },
  { id: 'h3', student_id: '3', date: '2023-10-24', shift: 'Tarde', status: 'Presente', created_date: '2023-10-24T13:15:00', created_by: 'Prof. Santos' },
  { id: 'h4', student_id: '4', date: '2023-10-24', shift: 'Tarde', status: 'Justificado', justification: 'Consulta médica', created_date: '2023-10-24T13:15:00', created_by: 'Prof. Santos' },
];

// --- UTILITÁRIOS DE DATA (Substituindo date-fns) ---
const formatDateISO = (date: Date) => date.toISOString().split('T')[0];

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  // Adiciona T12:00 para evitar problemas de timezone ao converter string YYYY-MM-DD
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
};

const formatShortDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const formatMonthLabel = (date: Date) => {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para segunda-feira ser o inicio
  return new Date(d.setDate(diff));
};

const getStartOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return getStartOfMonth(result);
};

const getMonthGrid = (date: Date) => {
  const start = getStartOfMonth(date);
  const year = start.getFullYear();
  const month = start.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
  const padding = Array.from({ length: startDay });
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  return { padding, days };
};

export default function Attendance() {
  const [activeTab, setActiveTab] = useState('today');
  
  // Estado Hoje
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()));
  const [selectedShift, setSelectedShift] = useState('Manhã');
  const [selectedClass, setSelectedClass] = useState('all');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string | null>>({});
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [expandedJustifications, setExpandedJustifications] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCallDetails, setSelectedCallDetails] = useState<AttendanceCall | null>(null);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Estado Histórico e Dados
  const [historyPeriod, setHistoryPeriod] = useState('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [currentMonthStart, setCurrentMonthStart] = useState(getStartOfMonth(new Date()));
  const [monthSelectedDate, setMonthSelectedDate] = useState('');
  
  // Banco de dados local simulado
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>(INITIAL_HISTORY);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    setLoadingData(true);
    setTimeout(() => {
      setStudents(MOCK_STUDENTS);
      setClasses(MOCK_CLASSES);
      setLoadingData(false);
    }, 800);
  }, []);

  // Filtrar chamada existente para o dia selecionado (Aba Hoje)
  useEffect(() => {
    const existing = attendanceHistory.filter(
      a => a.date === selectedDate && a.shift === selectedShift
    );

    const map: Record<string, string> = {};
    const justifMap: Record<string, string> = {};
    const expandMap: Record<string, boolean> = {};

    existing.forEach(a => {
      map[a.student_id] = a.status;
      if (a.justification) {
        justifMap[a.student_id] = a.justification;
        expandMap[a.student_id] = true;
      }
    });

    setAttendanceMap(map);
    setJustifications(justifMap);
    setExpandedJustifications(expandMap);
  }, [selectedDate, selectedShift, attendanceHistory]);

  // Filtragem de Alunos
  const filteredStudents = students
    .filter(s => s.status === 'Ativo')
    .filter(s => s.shift === selectedShift)
    .filter(s => selectedClass === 'all' || s.class_id === selectedClass)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  // Lógica de Histórico
  const filteredHistory = attendanceHistory.filter(a => {
    if (a.shift !== selectedShift) return false;
    
    const recordDate = new Date(a.date + 'T12:00:00');
    const todayStr = formatDateISO(new Date());

    if (historyPeriod === 'today') {
      return a.date === todayStr;
    } else if (historyPeriod === 'week') {
      const start = currentWeekStart;
      const end = addDays(currentWeekStart, 6);
      // Ajustando horas para comparação correta
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      return recordDate >= start && recordDate <= end;
    } else {
      const month = currentMonthStart.getMonth();
      const year = currentMonthStart.getFullYear();
      const sameMonth = recordDate.getMonth() === month && recordDate.getFullYear() === year;
      if (!sameMonth) return false;
      if (!monthSelectedDate) return true;
      return a.date === monthSelectedDate;
    }
  });

  const toggleAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status
    }));
    
    if (status === 'Justificado') {
      setExpandedJustifications(prev => ({
        ...prev,
        [studentId]: true
      }));
    } else {
      setExpandedJustifications(prev => ({
        ...prev,
        [studentId]: false
      }));
      setJustifications(prev => ({
        ...prev,
        [studentId]: ''
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Simula delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Remove registros antigos deste dia/turno para substituir pelos novos
      const otherRecords = attendanceHistory.filter(
        a => !(a.date === selectedDate && a.shift === selectedShift)
      );

      const newRecords: AttendanceRecord[] = [];
      const nowISO = new Date().toISOString();

      for (const studentId of Object.keys(attendanceMap)) {
        const status = attendanceMap[studentId];
        if (!status) continue;

        const justification = status === 'Justificado' ? justifications[studentId] : undefined;

        newRecords.push({
          id: Math.random().toString(36).substr(2, 9),
          student_id: studentId,
          date: selectedDate,
          shift: selectedShift,
          status,
          justification,
          class_id: selectedClass !== 'all' ? selectedClass : undefined,
          created_date: nowISO,
          created_by: 'Você' // Mock user
        });
      }

      setAttendanceHistory([...otherRecords, ...newRecords]);
      toast.success('Chamada salva com sucesso!');
      setShowSaved(true);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar chamada');
    } finally {
      setIsSaving(false);
    }
  };

  const markedCount = Object.values(attendanceMap).filter(Boolean).length;
  const presentCount = Object.values(attendanceMap).filter(s => s === 'Presente').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'Ausente').length;

  // Agrupar histórico por Data + Turno
  const groupedAttendance = filteredHistory.reduce<Record<string, AttendanceCall>>((acc, record) => {
    const key = `${record.date}_${record.shift}`;
    if (!acc[key]) {
      acc[key] = {
        date: record.date,
        shift: record.shift,
        created_by: record.created_by,
        created_date: record.created_date,
        records: []
      };
    }
    acc[key].records.push(record);
    return acc;
  }, {});

  const attendanceCalls = Object.values(groupedAttendance).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const navigateWeek = (direction: number) => {
    setCurrentWeekStart(prev => addDays(prev, direction * 7));
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonthStart(prev => addMonths(prev, direction));
    setMonthSelectedDate('');
  };

  const openCallDetails = (call: AttendanceCall) => {
    setSelectedCallDetails(call);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <PageTitle
            title="Frequência"
            className="text-2xl lg:text-3xl font-bold text-slate-800"
          />
          <p className="text-slate-500 mt-1">Registre e acompanhe a chamada</p>
        </div>
        {activeTab === 'today' && (
          <Button
            onClick={() => setShowConfirmSave(true)}
            disabled={isSaving || markedCount === 0}
            className="bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] hover:from-[var(--brand-gradient-from-hover)] hover:to-[var(--brand-gradient-to-hover)] text-white h-12 px-8 rounded-xl shadow-lg shadow-indigo-200"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Salvar Chamada
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-100 p-1 w-full sm:w-fit justify-start">
          <TabsTrigger
            value="today"
            className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 w-full sm:w-auto flex-1 sm:flex-none justify-center sm:justify-start px-3 sm:px-4"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Chamada de Hoje
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 w-full sm:w-auto flex-1 sm:flex-none justify-center sm:justify-start px-3 sm:px-4"
          >
            <History className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Today Tab */}
        <TabsContent value="today" className="space-y-6 mt-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" /> Data
                </Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="!h-12 rounded-xl w-full"
                />
              </div>
              
              <div>
                <Label className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" /> Turno
                </Label>
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger className="!h-12 rounded-xl w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manhã">Manhã</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" /> Turma
                </Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="!h-12 rounded-xl w-full">
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {classes.filter(c => c.shift === selectedShift).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-slate-800">{filteredStudents.length}</p>
              <p className="text-sm text-slate-500">Alunos</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-center">
              <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
              <p className="text-sm text-emerald-600">Presentes</p>
            </div>
            <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 text-center">
              <p className="text-2xl font-bold text-rose-600">{absentCount}</p>
              <p className="text-sm text-rose-600">Ausentes</p>
            </div>
          </div>

          {/* Student List */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800 capitalize">
                Lista de Alunos - {formatDisplayDate(selectedDate)}
              </h3>
            </div>

            {loadingData ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">Nenhum aluno encontrado para este turno</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredStudents.map((student, index) => {
                  const status = attendanceMap[student.id];
                  const isJustified = status === 'Justificado';
                  const isExpanded = expandedJustifications[student.id];
                  
                  return (
                    <div key={student.id}>
                      <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-slate-800">{student.full_name}</p>
                            <p className="text-sm text-slate-500">{student.grade}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAttendance(student.id, 'Presente')}
                            className={cn(
                              "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all",
                              status === 'Presente'
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                                : "bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-500"
                            )}
                          >
                            <Check className="w-6 h-6" />
                          </button>
                          <button
                            onClick={() => toggleAttendance(student.id, 'Ausente')}
                            className={cn(
                              "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all",
                              status === 'Ausente'
                                ? "bg-rose-500 text-white shadow-lg shadow-rose-200"
                                : "bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-500"
                            )}
                          >
                            <X className="w-6 h-6" />
                          </button>
                          <button
                            onClick={() => toggleAttendance(student.id, 'Justificado')}
                            className={cn(
                              "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all",
                              status === 'Justificado'
                                ? "bg-amber-500 text-white shadow-lg shadow-amber-200"
                                : "bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-500"
                            )}
                          >
                            <Clock className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {isJustified && isExpanded && (
                        <div className="px-4 pb-4 bg-amber-50 border-t border-amber-100">
                          <Label className="text-sm text-amber-700 mb-2 block mt-3">Justificativa da falta:</Label>
                          <Textarea
                            value={justifications[student.id] || ''}
                            onChange={(e) => setJustifications(prev => ({ ...prev, [student.id]: e.target.value }))}
                            placeholder="Ex: Consulta médica, problema familiar..."
                            className="bg-white border-amber-200 focus:border-amber-400"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6 mt-6">
          {/* Period Selector */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <Label className="text-slate-700 font-medium">Período:</Label>
                <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                  <Button
                    variant={historyPeriod === 'today' ? 'default' : 'outline'}
                    onClick={() => setHistoryPeriod('today')}
                    className={cn('w-full sm:w-auto', historyPeriod === 'today' ? 'bg-indigo-500' : '')}
                  >
                    Hoje
                  </Button>
                  <Button
                    variant={historyPeriod === 'week' ? 'default' : 'outline'}
                    onClick={() => setHistoryPeriod('week')}
                    className={cn('w-full sm:w-auto', historyPeriod === 'week' ? 'bg-indigo-500' : '')}
                  >
                    Semana
                  </Button>
                  <Button
                    variant={historyPeriod === 'month' ? 'default' : 'outline'}
                    onClick={() => setHistoryPeriod('month')}
                    className={cn('w-full sm:w-auto', historyPeriod === 'month' ? 'bg-indigo-500' : '')}
                  >
                    Mês
                  </Button>
                </div>
              </div>

              {historyPeriod === 'week' && (
                <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium px-2 sm:px-4 text-center flex-1">
                    {formatShortDate(currentWeekStart)} - {formatShortDate(addDays(currentWeekStart, 6))}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {historyPeriod === 'month' && (
                <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium px-2 sm:px-4 text-center flex-1 capitalize">
                    {formatMonthLabel(currentMonthStart)}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manhã">Manhã</SelectItem>
                  <SelectItem value="Tarde">Tarde</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {historyPeriod === 'month' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
              <div className="grid grid-cols-7 gap-1 text-xs sm:text-sm text-slate-500 mb-2">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((d) => (
                  <div key={d} className="text-center font-medium py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getMonthGrid(currentMonthStart).padding.map((_, i) => (
                  <div key={`pad-${i}`} className="h-9 sm:h-11 md:h-12" />
                ))}

                {getMonthGrid(currentMonthStart).days.map((day) => {
                  const dayStr = formatDateISO(day);
                  const hasRecords = attendanceHistory.some(
                    (a) => a.shift === selectedShift && a.date === dayStr
                  );
                  const isSelected = monthSelectedDate === dayStr;

                  return (
                    <button
                      key={dayStr}
                      type="button"
                      onClick={() => {
                        setMonthSelectedDate(dayStr);
                        setSelectedDate(dayStr);
                      }}
                      className={cn(
                        'h-9 sm:h-11 md:h-12 rounded-lg border border-transparent flex items-center justify-center text-sm transition-all',
                        isSelected ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'hover:bg-slate-50'
                      )}
                    >
                      <span className="relative">
                        {day.getDate()}
                        {hasRecords && (
                          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* History List */}
          <div className="space-y-4">
            {attendanceCalls.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <History className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">Nenhuma chamada registrada neste período</p>
              </div>
            ) : (
              attendanceCalls.map((call, idx) => {
                const present = call.records.filter((r) => r.status === 'Presente').length;
                const absent = call.records.filter((r) => r.status === 'Ausente').length;
                const justified = call.records.filter((r) => r.status === 'Justificado').length;

                return (
                  <div 
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 capitalize">
                            {formatDisplayDate(call.date)}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {call.shift}
                            </span>
                            {call.created_date && (
                              <span>
                                Registrado às {new Date(call.created_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                            {call.created_by && (
                              <span>por {call.created_by}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCallDetails(call)}
                        className="rounded-xl"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold text-slate-800">{call.records.length}</p>
                        <p className="text-xs text-slate-500">Total</p>
                      </div>
                      <div className="text-center p-3 bg-emerald-50 rounded-xl">
                        <p className="text-2xl font-bold text-emerald-600">{present}</p>
                        <p className="text-xs text-emerald-600">Presentes</p>
                      </div>
                      <div className="text-center p-3 bg-rose-50 rounded-xl">
                        <p className="text-2xl font-bold text-rose-600">{absent}</p>
                        <p className="text-xs text-rose-600">Ausentes</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-xl">
                        <p className="text-2xl font-bold text-amber-600">{justified}</p>
                        <p className="text-xs text-amber-600">Justificadas</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Call Details Modal */}
      <Dialog open={!!selectedCallDetails} onOpenChange={() => setSelectedCallDetails(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">
              Detalhes da Chamada - {selectedCallDetails && formatDisplayDate(selectedCallDetails.date)}
            </DialogTitle>
          </DialogHeader>

          {selectedCallDetails && (
            <div className="space-y-6 py-4">
              {/* Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <Clock className="w-5 h-5 text-slate-500" />
                <div className="flex-1">
                  <p className="text-sm text-slate-500">Turno e Horário</p>
                  <p className="font-medium text-slate-800">
                    {selectedCallDetails.shift} - Registrado às {new Date(selectedCallDetails.created_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                {selectedCallDetails.created_by && (
                  <div>
                    <p className="text-sm text-slate-500">Realizado por</p>
                    <p className="font-medium text-slate-800">{selectedCallDetails.created_by}</p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-emerald-600">
                            {selectedCallDetails.records.filter(r => r.status === 'Presente').length}
                  </p>
                  <p className="text-sm text-emerald-600 mt-1">Presentes</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-rose-600">
                            {selectedCallDetails.records.filter(r => r.status === 'Ausente').length}
                  </p>
                  <p className="text-sm text-rose-600 mt-1">Ausentes</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-amber-600">
                            {selectedCallDetails.records.filter(r => r.status === 'Justificado').length}
                  </p>
                  <p className="text-sm text-amber-600 mt-1">Justificadas</p>
                </div>
              </div>

              {/* Students List */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Lista de Alunos</h4>
                <div className="space-y-2">
                  {selectedCallDetails.records
                    .sort((a, b) => {
                      const studentA = students.find(s => s.id === a.student_id);
                      const studentB = students.find(s => s.id === b.student_id);
                      return (studentA?.full_name || '').localeCompare(studentB?.full_name || '');
                    })
                    .map((record) => {
                      const student = students.find(s => s.id === record.student_id);
                      if (!student) return null;

                      return (
                        <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-gradient-from-light)] to-[var(--brand-gradient-to-light)] flex items-center justify-center text-white font-bold">
                              {student.full_name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{student.full_name}</p>
                              <p className="text-sm text-slate-500">{student.grade}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={cn(
                              record.status === 'Presente' && "bg-emerald-100 text-emerald-700",
                              record.status === 'Ausente' && "bg-rose-100 text-rose-700",
                              record.status === 'Justificado' && "bg-amber-100 text-amber-700"
                            )}>
                              {record.status}
                            </Badge>
                            {record.status === 'Justificado' && record.justification && (
                              <button
                                onClick={() => {
                                  toast.info(record.justification, { duration: 5000 });
                                }}
                                className="p-2 hover:bg-slate-200 rounded-lg"
                                title="Ver justificativa"
                              >
                                <MessageSquare className="w-4 h-4 text-amber-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Justifications */}
                {selectedCallDetails.records.some(r => r.status === 'Justificado' && r.justification) && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Justificativas</h4>
                  <div className="space-y-3">
                    {selectedCallDetails.records
                      .filter(r => r.status === 'Justificado' && r.justification)
                      .map((record) => {
                        const student = students.find(s => s.id === record.student_id);
                        if (!student) return null;

                        return (
                          <div key={record.id} className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="font-medium text-slate-800 mb-2">{student.full_name}</p>
                            <p className="text-sm text-slate-600">{record.justification}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Save Modal */}
      <Dialog open={showConfirmSave} onOpenChange={setShowConfirmSave}>
        <DialogContent className="max-w-md ">
          <DialogHeader>
            <DialogTitle>Finalizar chamada?</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-slate-600">
            Ao finalizar, esta chamada não poderá ser alterada.
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowConfirmSave(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                setShowConfirmSave(false);
                await handleSave();
              }}
              className="bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] hover:from-[var(--brand-gradient-from-hover)] hover:to-[var(--brand-gradient-to-hover)] text-white"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Finalizar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Modal */}
      <Dialog open={showSaved} onOpenChange={setShowSaved}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chamada realizada</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-slate-600">
            A chamada foi registrada com sucesso.
          </div>
          <div className="flex items-center justify-end pt-2">
            <Button onClick={() => setShowSaved(false)} className="bg-indigo-500 hover:bg-indigo-600 text-white">
              Ok
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
