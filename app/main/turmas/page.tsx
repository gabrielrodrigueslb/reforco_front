'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  Calendar,
  Eye,
} from 'lucide-react'

import { ClassesService } from '@/services/classes.service'
import { StudentsService } from '@/services/students.service'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import PageTitle from '@/components/page-title'

const grades = [
  '1º Ano','2º Ano','3º Ano','4º Ano','5º Ano',
  '6º Ano','7º Ano','8º Ano','9º Ano',
  '1º EM','2º EM','3º EM',
]

const shifts = ['Manhã', 'Tarde']
const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']

type ClassItem = {
  id: string
  name: string
  grade: string
  shift: string
  days_of_week: string[]
  start_time?: string
  end_time?: string
  status: 'Ativa' | 'Inativa'
  max_students: number
  created_at: string
}

type Student = {
  id: string
  name: string
  class_id: string
}

export default function TurmasPage() {
  const [loading, setLoading] = useState(true)

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [students, setStudents] = useState<Student[]>([])

  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null)
  const [deleteClass, setDeleteClass] = useState<ClassItem | null>(null)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    shift: '',
    days_of_week: [] as string[],
    start_time: '',
    end_time: '',
    status: 'Ativa' as 'Ativa' | 'Inativa',
    max_students: 15,
  })

  async function loadData() {
    setLoading(true)
    try {
      const [cls, sts] = await Promise.all([
        ClassesService.list(),
        StudentsService.list(),
      ])
      setClasses(cls as any)
      setStudents(sts as any)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const studentCountByClass = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of students) {
      map.set(s.class_id, (map.get(s.class_id) ?? 0) + 1)
    }
    return map
  }, [students])

  const resetForm = () => {
    setFormData({
      name: '',
      grade: '',
      shift: '',
      days_of_week: [],
      start_time: '',
      end_time: '',
      status: 'Ativa',
      max_students: 15,
    })
    setEditingClass(null)
  }

  const handleEdit = (item: ClassItem) => {
    setEditingClass(item)
    setFormData({
      name: item.name ?? '',
      grade: item.grade ?? '',
      shift: item.shift ?? '',
      days_of_week: item.days_of_week ?? [],
      start_time: item.start_time ?? '',
      end_time: item.end_time ?? '',
      status: item.status ?? 'Ativa',
      max_students: item.max_students ?? 15,
    })
    setShowModal(true)
  }

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day],
    }))
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.grade || !formData.shift) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      if (editingClass) {
        await ClassesService.update(editingClass.id, formData as any)
        toast.success('Turma atualizada!')
      } else {
        await ClassesService.create(formData as any)
        toast.success('Turma criada com sucesso!')
      }

      setShowModal(false)
      resetForm()
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível salvar')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteClass) return
    setDeleting(true)
    try {
      await ClassesService.delete(deleteClass.id)
      toast.success('Turma excluída!')
      setDeleteClass(null)
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível excluir')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <PageTitle
            title="Turmas"
            className="text-2xl lg:text-3xl font-bold text-slate-800"
          />
          <p className="text-slate-500 mt-1">
            {loading ? 'Carregando...' : `${classes.length} turmas cadastradas`}
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] hover:from-[var(--brand-gradient-from-hover)] hover:to-[var(--brand-gradient-to-hover)] text-white h-12 px-6 rounded-xl shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Turma
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <GraduationCap className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhuma turma cadastrada</h3>
          <p className="text-slate-500 mb-6">Comece criando sua primeira turma</p>
          <Button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Turma
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classItem) => {
            const studentCount = studentCountByClass.get(classItem.id) ?? 0

            return (
              <div
                key={classItem.id}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] flex items-center justify-center shadow-lg shadow-indigo-200">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex gap-2">
                    {/* Visualizar */}
                    <Link
                      href={`/main/turmas/${classItem.id}`}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                      aria-label="Visualizar turma"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                    </Link>

                    {/* Editar */}
                    <button
                      onClick={() => handleEdit(classItem)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      type="button"
                      aria-label="Editar turma"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4 text-slate-500" />
                    </button>

                    {/* Excluir */}
                    <button
                      onClick={() => setDeleteClass(classItem)}
                      className="p-2 hover:bg-rose-100 rounded-lg transition-colors"
                      type="button"
                      aria-label="Excluir turma"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                </div>

                {/* Título também navega */}
                <Link href={`/main/turmas/${classItem.id}`}>
                  <h3 className="font-semibold text-slate-800 text-lg mb-2 hover:underline">
                    {classItem.name}
                  </h3>
                </Link>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">{classItem.grade}</Badge>
                  <Badge
                    className={cn(
                      classItem.shift === 'Manhã'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    {classItem.shift}
                  </Badge>
                  <Badge
                    className={cn(
                      classItem.status === 'Ativa'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {classItem.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  {classItem.start_time && classItem.end_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>
                        {classItem.start_time} - {classItem.end_time}
                      </span>
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
                    <span>
                      {studentCount} / {classItem.max_students} alunos
                    </span>
                  </div>
                </div>
              </div>
            )
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
                    {grades.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
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
                    {shifts.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-slate-700 font-medium mb-3 block">Dias da Semana</Label>
              <div className="flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      formData.days_of_week.includes(day)
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 font-medium">Máximo de Alunos</Label>
                <Input
                  type="number"
                  value={formData.max_students}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_students: Number.isFinite(Number(e.target.value))
                        ? Number(e.target.value)
                        : 15,
                    })
                  }
                  className="mt-2 h-12 rounded-xl"
                  min={1}
                />
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'Ativa' | 'Inativa') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="mt-2 h-12 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativa">Ativa</SelectItem>
                    <SelectItem value="Inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
            >
              {saving ? 'Salvando...' : editingClass ? 'Salvar' : 'Criar Turma'}
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
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
