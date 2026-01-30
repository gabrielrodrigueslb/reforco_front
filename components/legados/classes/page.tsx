import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GraduationCap, Plus, Edit, Trash2, Users, Clock, Calendar } from 'lucide-react';
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const grades = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º EM', '2º EM', '3º EM'];
const shifts = ['Manhã', 'Tarde'];
const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

export default function Classes() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deleteClass, setDeleteClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    shift: '',
    days_of_week: [],
    start_time: '',
    end_time: '',
    status: 'Ativa',
    max_students: 15
  });

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list('-created_date'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Class.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setShowModal(false);
      resetForm();
      toast.success('Turma criada com sucesso!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Class.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setShowModal(false);
      resetForm();
      toast.success('Turma atualizada!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Class.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setDeleteClass(null);
      toast.success('Turma excluída!');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      grade: '',
      shift: '',
      days_of_week: [],
      start_time: '',
      end_time: '',
      status: 'Ativa',
      max_students: 15
    });
    setEditingClass(null);
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      grade: classItem.grade,
      shift: classItem.shift,
      days_of_week: classItem.days_of_week || [],
      start_time: classItem.start_time || '',
      end_time: classItem.end_time || '',
      status: classItem.status,
      max_students: classItem.max_students || 15
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.grade || !formData.shift) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleDay = (day) => {
    const current = formData.days_of_week || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    setFormData({ ...formData, days_of_week: updated });
  };

  const getStudentCount = (classId) => {
    return students.filter(s => s.class_id === classId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Turmas</h1>
          <p className="text-slate-500 mt-1">{classes.length} turmas cadastradas</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] hover:from-[var(--brand-gradient-from-hover)] hover:to-[var(--brand-gradient-to-hover)] text-white h-12 px-6 rounded-xl shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Turma
        </Button>
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <GraduationCap className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhuma turma cadastrada</h3>
          <p className="text-slate-500 mb-6">Comece criando sua primeira turma</p>
          <Button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Turma
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(classItem => {
            const studentCount = getStudentCount(classItem.id);
            
            return (
              <div 
                key={classItem.id}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] flex items-center justify-center shadow-lg shadow-indigo-200">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(classItem)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-slate-500" />
                    </button>
                    <button 
                      onClick={() => setDeleteClass(classItem)}
                      className="p-2 hover:bg-rose-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-slate-800 text-lg mb-2">{classItem.name}</h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">{classItem.grade}</Badge>
                  <Badge className={cn(
                    classItem.shift === 'Manhã' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-blue-100 text-blue-700'
                  )}>
                    {classItem.shift}
                  </Badge>
                  <Badge className={cn(
                    classItem.status === 'Ativa'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  )}>
                    {classItem.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  {classItem.start_time && classItem.end_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{classItem.start_time} - {classItem.end_time}</span>
                    </div>
                  )}
                  {classItem.days_of_week?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{classItem.days_of_week.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{studentCount} / {classItem.max_students} alunos</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-700 font-medium">Nome da Turma *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Turma A - Reforço"
                className="mt-2 h-12 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 font-medium">Série *</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) => setFormData({ ...formData, grade: value })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Turno *</Label>
                <Select
                  value={formData.shift}
                  onValueChange={(value) => setFormData({ ...formData, shift: value })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-slate-700 font-medium mb-3 block">Dias da Semana</Label>
              <div className="flex flex-wrap gap-2">
                {weekDays.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      formData.days_of_week?.includes(day)
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 font-medium">Início</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-slate-700 font-medium">Término</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-700 font-medium">Máximo de Alunos</Label>
              <Input
                type="number"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                className="mt-2 h-12 rounded-xl"
                min="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
            >
              {editingClass ? 'Salvar' : 'Criar Turma'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClass} onOpenChange={() => setDeleteClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a turma <strong>{deleteClass?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600"
              onClick={() => deleteMutation.mutate(deleteClass.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}