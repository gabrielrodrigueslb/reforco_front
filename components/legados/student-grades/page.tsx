import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { 
  ArrowLeft, Plus, Upload, Save, Loader2, 
  BookOpen, TrendingUp, TrendingDown, AlertCircle, Camera
} from 'lucide-react';
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const subjects = ['Português', 'Matemática', 'Ciências', 'História', 'Geografia', 'Inglês', 'Artes', 'Ed. Física', 'Outra'];
const bimesters = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

export default function StudentGrades() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get('id');

  const [showModal, setShowModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    bimester: '',
    year: new Date().getFullYear(),
    grade_value: '',
    report_card_url: '',
    notes: ''
  });

  const { data: students = [] } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => base44.entities.Student.filter({ id: studentId }),
  });

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['student-grades', studentId],
    queryFn: () => base44.entities.Grade.filter({ student_id: studentId }),
  });

  const student = students[0];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Grade.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-grades'] });
      setShowModal(false);
      resetForm();
      toast.success('Nota registrada!');
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student'] });
    },
  });

  const resetForm = () => {
    setFormData({
      subject: '',
      bimester: '',
      year: new Date().getFullYear(),
      grade_value: '',
      report_card_url: '',
      notes: ''
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, report_card_url: result.file_url });
      toast.success('Imagem enviada!');
    } catch (error) {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.subject || !formData.bimester || formData.grade_value === '') {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    createMutation.mutate({
      ...formData,
      student_id: studentId,
      grade_value: parseFloat(formData.grade_value)
    });
  };

  const updatePerformance = (indicator) => {
    updateStudentMutation.mutate({
      id: studentId,
      data: { performance_indicator: indicator }
    });
    toast.success('Indicador atualizado!');
  };

  // Group grades by subject and bimester
  const gradesBySubject = subjects.reduce((acc, subject) => {
    const subjectGrades = grades.filter(g => g.subject === subject);
    if (subjectGrades.length > 0) {
      acc[subject] = subjectGrades;
    }
    return acc;
  }, {});

  // Calculate average
  const average = grades.length > 0
    ? (grades.reduce((sum, g) => sum + g.grade_value, 0) / grades.length).toFixed(1)
    : null;

  const performanceOptions = [
    { value: 'Melhorando', icon: TrendingUp, color: 'emerald' },
    { value: 'Atenção', icon: AlertCircle, color: 'amber' },
    { value: 'Decaindo', icon: TrendingDown, color: 'rose' },
  ];

  if (!student && !isLoading) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Aluno não encontrado</p>
        <Button onClick={() => navigate(createPageUrl('Grades'))} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Grades'))}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Boletim</h1>
            {student && (
              <p className="text-slate-500 mt-1">{student.full_name} - {student.grade}</p>
            )}
          </div>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white h-12 px-6 rounded-xl shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Lançar Nota
        </Button>
      </div>

      {/* Performance Indicator */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">Indicador de Desempenho</h3>
        <div className="flex flex-wrap gap-3">
          {performanceOptions.map(option => {
            const Icon = option.icon;
            const isSelected = student?.performance_indicator === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => updatePerformance(option.value)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-xl transition-all",
                  isSelected
                    ? `bg-${option.color}-500 text-white shadow-lg shadow-${option.color}-200`
                    : `bg-${option.color}-50 text-${option.color}-600 hover:bg-${option.color}-100`
                )}
              >
                <Icon className="w-5 h-5" />
                {option.value}
              </button>
            );
          })}
        </div>
      </div>

      {/* Average Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80">Média Geral</p>
            <p className="text-4xl font-bold mt-1">{average || '-'}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Grades Table */}
      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : grades.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhuma nota registrada</h3>
          <p className="text-slate-500 mb-6">Comece lançando a primeira nota</p>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600">
            <Plus className="w-5 h-5 mr-2" />
            Lançar Nota
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-4 font-semibold text-slate-700">Matéria</th>
                  {bimesters.map(b => (
                    <th key={b} className="text-center px-4 py-4 font-semibold text-slate-700">{b.split(' ')[0]}</th>
                  ))}
                  <th className="text-center px-4 py-4 font-semibold text-slate-700">Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(gradesBySubject).map(([subject, subjectGrades]) => {
                  const bimesterGrades = bimesters.reduce((acc, b) => {
                    const grade = subjectGrades.find(g => g.bimester === b);
                    acc[b] = grade?.grade_value;
                    return acc;
                  }, {});
                  
                  const validGrades = Object.values(bimesterGrades).filter(g => g !== undefined);
                  const subjectAvg = validGrades.length > 0
                    ? (validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length).toFixed(1)
                    : null;

                  return (
                    <tr key={subject} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">{subject}</td>
                      {bimesters.map(b => (
                        <td key={b} className="text-center px-4 py-4">
                          {bimesterGrades[b] !== undefined ? (
                            <span className={cn(
                              "inline-flex items-center justify-center w-10 h-10 rounded-lg font-semibold",
                              bimesterGrades[b] >= 7 ? "bg-emerald-100 text-emerald-700" :
                              bimesterGrades[b] >= 5 ? "bg-amber-100 text-amber-700" :
                              "bg-rose-100 text-rose-700"
                            )}>
                              {bimesterGrades[b]}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      ))}
                      <td className="text-center px-4 py-4">
                        {subjectAvg ? (
                          <span className={cn(
                            "font-bold",
                            subjectAvg >= 7 ? "text-emerald-600" :
                            subjectAvg >= 5 ? "text-amber-600" :
                            "text-rose-600"
                          )}>
                            {subjectAvg}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Grade Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lançar Nota</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 font-medium">Matéria *</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData({ ...formData, subject: value })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Bimestre *</Label>
                <Select
                  value={formData.bimester}
                  onValueChange={(value) => setFormData({ ...formData, bimester: value })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {bimesters.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 font-medium">Nota (0-10) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.grade_value}
                  onChange={(e) => setFormData({ ...formData, grade_value: e.target.value })}
                  className="mt-2 h-12 rounded-xl"
                  placeholder="Ex: 7.5"
                />
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Ano</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-700 font-medium">Foto do Boletim</Label>
              <div className="mt-2">
                {formData.report_card_url ? (
                  <div className="relative">
                    <img 
                      src={formData.report_card_url} 
                      alt="Boletim" 
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, report_card_url: '' })}
                      className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    {uploadingImage ? (
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500">Clique para enviar foto</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label className="text-slate-700 font-medium">Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre a nota..."
                className="mt-2 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}