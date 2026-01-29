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

// --- DADOS MOCKADOS ---
const MOCK_CLASSES = [
  { id: 'c1', name: 'Turma A - 4º Ano', shift: 'Manhã' },
  { id: 'c2', name: 'Turma B - 5º Ano', shift: 'Tarde' },
];

const MOCK_STUDENTS = [
  { id: '1', full_name: 'Ana Júlia Souza', status: 'Ativo', shift: 'Manhã', class_id: 'c1', grade: '4º Ano' },
  { id: '2', full_name: 'Bruno Lima', status: 'Ativo', shift: 'Manhã', class_id: 'c1', grade: '4º Ano' },
  { id: '3', full_name: 'Carlos Eduardo', status: 'Ativo', shift: 'Tarde', class_id: 'c2', grade: '5º Ano' },
  { id: '4', full_name: 'Daniela Alves', status: 'Ativo', shift: 'Tarde', class_id: 'c2', grade: '5º Ano' },
];

// Dados iniciais para popular o histórico
const INITIAL_HISTORY = [
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

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para segunda-feira ser o inicio
  return new Date(d.setDate(diff));
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
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
  const [selectedCallDetails, setSelectedCallDetails] = useState<any>(null);

  // Estado Histórico e Dados
  const [historyPeriod, setHistoryPeriod] = useState('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  
  // Banco de dados local simulado
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>(INITIAL_HISTORY);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
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
      // Mês atual (simples)
      const now = new Date();
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    }
  });

  const toggleAttendance = (studentId: string, status: string) => {
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

      const newRecords = [];
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
    } catch (error) {
      toast.error('Erro ao salvar chamada');
    } finally {
      setIsSaving(false);
    }
  };

  const markedCount = Object.values(attendanceMap).filter(Boolean).length;
  // @ts-ignore
  const presentCount = Object.values(attendanceMap).filter(s => s === 'Presente').length;
  // @ts-ignore
  const absentCount = Object.values(attendanceMap).filter(s => s === 'Ausente').length;

  // Agrupar histórico por Data + Turno
  const groupedAttendance = filteredHistory.reduce((acc: any, record: any) => {
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

  const attendanceCalls = Object.values(groupedAttendance).sort((a: any, b: any) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const navigateWeek = (direction: number) => {
    setCurrentWeekStart(prev => addDays(prev, direction * 7));
  };

  const openCallDetails = (call: any) => {
    setSelectedCallDetails(call);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Frequência</h1>
          <p className="text-slate-500 mt-1">Registre e acompanhe a chamada</p>
        </div>
        {activeTab === 'today' && (
          <Button
            onClick={handleSave}
            disabled={isSaving || markedCount === 0}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white h-12 px-8 rounded-xl shadow-lg shadow-indigo-200"
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
        <TabsList className="bg-white border border-slate-100 p-1">
          <TabsTrigger value="today" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
            <Calendar className="w-4 h-4 mr-2" />
            Chamada de Hoje
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
            <History className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Today Tab */}
        <TabsContent value="today" className="space-y-6 mt-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" /> Data
                </Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              
              <div>
                <Label className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" /> Turno
                </Label>
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger className="h-12 rounded-xl w-full">
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
                  <SelectTrigger className="h-12 rounded-xl">
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
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Label className="text-slate-700 font-medium">Período:</Label>
                <div className="flex gap-2">
                  <Button
                    variant={historyPeriod === 'today' ? 'default' : 'outline'}
                    onClick={() => setHistoryPeriod('today')}
                    className={historyPeriod === 'today' ? 'bg-indigo-500' : ''}
                  >
                    Hoje
                  </Button>
                  <Button
                    variant={historyPeriod === 'week' ? 'default' : 'outline'}
                    onClick={() => setHistoryPeriod('week')}
                    className={historyPeriod === 'week' ? 'bg-indigo-500' : ''}
                  >
                    Semana
                  </Button>
                  <Button
                    variant={historyPeriod === 'month' ? 'default' : 'outline'}
                    onClick={() => setHistoryPeriod('month')}
                    className={historyPeriod === 'month' ? 'bg-indigo-500' : ''}
                  >
                    Mês
                  </Button>
                </div>
              </div>

              {historyPeriod === 'week' && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium px-4">
                    {formatShortDate(currentWeekStart)} - {formatShortDate(addDays(currentWeekStart, 6))}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manhã">Manhã</SelectItem>
                  <SelectItem value="Tarde">Tarde</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* History List */}
          <div className="space-y-4">
            {/* @ts-ignore */}
            {attendanceCalls.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <History className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">Nenhuma chamada registrada neste período</p>
              </div>
            ) : (
                // @ts-ignore
              attendanceCalls.map((call: any, idx: number) => {
                const present = call.records.filter((r: any) => r.status === 'Presente').length;
                const absent = call.records.filter((r: any) => r.status === 'Ausente').length;
                const justified = call.records.filter((r: any) => r.status === 'Justificado').length;

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
                    {/* @ts-ignore */}
                    {selectedCallDetails.records.filter(r => r.status === 'Presente').length}
                  </p>
                  <p className="text-sm text-emerald-600 mt-1">Presentes</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-rose-600">
                    {/* @ts-ignore */}
                    {selectedCallDetails.records.filter(r => r.status === 'Ausente').length}
                  </p>
                  <p className="text-sm text-rose-600 mt-1">Ausentes</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-amber-600">
                    {/* @ts-ignore */}
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
                    // @ts-ignore
                    .sort((a, b) => {
                      const studentA = students.find(s => s.id === a.student_id);
                      const studentB = students.find(s => s.id === b.student_id);
                      return (studentA?.full_name || '').localeCompare(studentB?.full_name || '');
                    })
                    // @ts-ignore
                    .map((record) => {
                      const student = students.find(s => s.id === record.student_id);
                      if (!student) return null;

                      return (
                        <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
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
              {/* @ts-ignore */}
              {selectedCallDetails.records.some(r => r.status === 'Justificado' && r.justification) && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Justificativas</h4>
                  <div className="space-y-3">
                    {selectedCallDetails.records
                      // @ts-ignore
                      .filter(r => r.status === 'Justificado' && r.justification)
                      // @ts-ignore
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
    </div>
  );
}