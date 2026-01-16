import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Users, Check, X, Clock, Save, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Attendance() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedShift, setSelectedShift] = useState('Manhã');
  const [selectedClass, setSelectedClass] = useState('all');
  const [attendanceMap, setAttendanceMap] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const { data: existingAttendance = [] } = useQuery({
    queryKey: ['attendance', selectedDate, selectedShift],
    queryFn: () => base44.entities.Attendance.filter({ 
      date: selectedDate,
      shift: selectedShift 
    }),
  });

  useEffect(() => {
    const map = {};
    existingAttendance.forEach(a => {
      map[a.student_id] = a.status;
    });
    setAttendanceMap(map);
  }, [existingAttendance]);

  const filteredStudents = students
    .filter(s => s.status === 'Ativo')
    .filter(s => s.shift === selectedShift)
    .filter(s => selectedClass === 'all' || s.class_id === selectedClass)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Attendance.create(data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Attendance.update(id, data),
  });

  const toggleAttendance = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      for (const studentId of Object.keys(attendanceMap)) {
        const status = attendanceMap[studentId];
        if (!status) continue;

        const existing = existingAttendance.find(a => a.student_id === studentId);

        if (existing) {
          await updateMutation.mutateAsync({
            id: existing.id,
            data: { status }
          });
        } else {
          await createMutation.mutateAsync({
            student_id: studentId,
            date: selectedDate,
            shift: selectedShift,
            status,
            class_id: selectedClass !== 'all' ? selectedClass : undefined
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Chamada salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar chamada');
    } finally {
      setIsSaving(false);
    }
  };

  const markedCount = Object.values(attendanceMap).filter(Boolean).length;
  const presentCount = Object.values(attendanceMap).filter(s => s === 'Presente').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'Ausente').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Frequência</h1>
          <p className="text-slate-500 mt-1">Registre a chamada diária</p>
        </div>
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
      </div>

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
              <SelectTrigger className="h-12 rounded-xl">
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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">
              Lista de Alunos - {format(new Date(selectedDate), "dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500"></div>
                <span className="text-slate-600">Presente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-rose-500"></div>
                <span className="text-slate-600">Ausente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500"></div>
                <span className="text-slate-600">Justificado</span>
              </div>
            </div>
          </div>
        </div>

        {loadingStudents ? (
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
              
              return (
                <div 
                  key={student.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}