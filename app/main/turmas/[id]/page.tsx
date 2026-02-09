'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  GraduationCap,
  Sparkles,
  Pencil,
  Plus,
  Search,
  UserPlus,
  UserMinus,
  Loader2,
} from 'lucide-react'

import { ClassesService } from '@/services/classes.service'
import { StudentsService } from '@/services/students.service'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import PageTitle from '@/components/page-title'

type ClassesServiceAPI = {
  list: () => Promise<ClassItem[]>
  update: (id: string, data: Partial<ClassItem>) => Promise<void>
};

type StudentsServiceAPI = {
  list: () => Promise<Student[]>
  update?: (id: string, data: Partial<Student>) => Promise<void>
  setClass?: (id: string, classId: string) => Promise<void>
};


type ClassItem = {
  id: string
  name: string
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
  name?: string
  full_name?: string
  class_id: string
  grade?: string
}

const shifts = ['Manhã', 'Tarde']
const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']

export default function TurmaDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params?.id ?? '')

  const [loading, setLoading] = useState(true)
  const [turma, setTurma] = useState<ClassItem | null>(null)
  const [students, setStudents] = useState<Student[]>([])

  // UI / Edição
  const [openEdit, setOpenEdit] = useState(false)
  const [saving, setSaving] = useState(false)

  // Alunos
  const [studentSearch, setStudentSearch] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    shift: '',
    days_of_week: [] as string[],
    start_time: '',
    end_time: '',
    status: 'Ativa' as 'Ativa' | 'Inativa',
    max_students: 15,
  })

  async function load() {
    setLoading(true)
    try {
      const classesService = ClassesService as ClassesServiceAPI
      const studentsService = StudentsService as StudentsServiceAPI

      const [cls, sts] = await Promise.all([
        classesService.list(),
        studentsService.list(),
      ])

      const found = cls.find((c) => c.id === id) ?? null
      setTurma(found)
      setStudents(sts)

      if (found) {
        setFormData({
          name: found.name ?? '',
          shift: found.shift ?? '',
          days_of_week: found.days_of_week ?? [],
          start_time: found.start_time ?? '',
          end_time: found.end_time ?? '',
          status: found.status ?? 'Ativa',
          max_students: found.max_students ?? 15,
        })
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar detalhes da turma')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const getStudentName = (s: Student) => s.name || s.full_name || `Aluno ${s.id}`

  const alunosDaTurma = useMemo(
    () => students.filter((s) => s.class_id === id),
    [students, id]
  )

  const alunosForaDaTurma = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    const list = students.filter((s) => s.class_id !== id)

    if (!q) return list
    return list.filter((s) =>
      getStudentName(s).toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    )
  }, [students, id, studentSearch])

  const capacity = useMemo(() => {
    if (!turma) return { count: 0, max: 0, full: false }
    const count = alunosDaTurma.length
    const max = turma.max_students
    return { count, max, full: max > 0 && count >= max }
  }, [turma, alunosDaTurma])

  const progressPct = useMemo(() => {
    if (!turma || turma.max_students <= 0) return 0
    const pct = (alunosDaTurma.length / turma.max_students) * 100
    return Math.max(0, Math.min(100, Math.round(pct)))
  }, [turma, alunosDaTurma])

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day],
    }))
  }

  async function saveTurma() {
    if (!turma) return
    if (!formData.name || !formData.shift) {
      toast.error('Preencha Nome e Turno.')
      return
    }

    setSaving(true)
    try {
      const classesService = ClassesService as ClassesServiceAPI
      await classesService.update(turma.id, {
        ...formData,
      })

      toast.success('Turma atualizada!')
      setOpenEdit(false)
      await load()
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível salvar a turma')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Vincular aluno na turma:
   * Como estamos em mock, fazemos update no StudentsService.
   * ✅ Se seu StudentsService ainda não tem update(), adicione (recomendado).
   * (abaixo também deixei fallback pra updateMany caso você prefira implementar assim)
   */
  async function addStudentToClass(studentId: string) {
    if (!turma) return
    if (capacity.full) {
      toast.error('Turma cheia. Aumente o limite ou remova um aluno.')
      return
    }

    setAdding(studentId)
    try {
      // Preferencial: update por aluno
      const studentsService = StudentsService as StudentsServiceAPI

      if (studentsService.update) {
        await studentsService.update(studentId, { class_id: turma.id })
      } else if (studentsService.setClass) {
        await studentsService.setClass(studentId, turma.id)
      } else {
        // fallback local (não persiste no service) — mas mantém na tela:
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, class_id: turma.id } : s))
        )
      }

      toast.success('Aluno adicionado à turma')
      await load()
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível adicionar aluno')
    } finally {
      setAdding(null)
    }
  }

  async function removeStudentFromClass(studentId: string) {
    if (!turma) return

    setRemoving(studentId)
    try {
      const studentsService = StudentsService as StudentsServiceAPI

      if (studentsService.update) {
        await studentsService.update(studentId, { class_id: '' })
      } else if (studentsService.setClass) {
        await studentsService.setClass(studentId, '')
      } else {
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, class_id: '' } : s))
        )
      }

      toast.success('Aluno removido da turma')
      await load()
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível remover aluno')
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    )
  }

  if (!turma) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <p className="text-slate-600">Turma não encontrada.</p>
        <Link href="/main/turmas" className="text-indigo-600 hover:underline">
          Ir para turmas
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setOpenEdit(true)}
              className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] hover:from-[var(--brand-gradient-from-hover)] hover:to-[var(--brand-gradient-to-hover)] text-white shadow-lg shadow-indigo-200"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar turma
            </Button>
          </div>
        </div>

        {/* Premium header card */}
        <div className="relative overflow-hidden rounded-3xl border bg-white">
          <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-2xl" />
          <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-purple-500/10 blur-2xl" />

          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] flex items-center justify-center shadow-lg shadow-indigo-200">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>

              <div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium">Detalhes da turma</span>
                </div>

                <PageTitle
                  title={turma.name}
                  className="text-2xl md:text-3xl font-bold text-slate-900 mt-1"
                />

                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary">{turma.shift}</Badge>
                  <Badge className={turma.status === 'Ativa' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                    {turma.status}
                  </Badge>
                  <Badge variant="outline" className="text-slate-600">
                    ID: {turma.id}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Capacity meter */}
            <div className="w-full md:w-[320px] rounded-2xl border bg-white/60 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Ocupação</span>
                <span className={cn('font-semibold', capacity.full ? 'text-rose-600' : 'text-slate-800')}>
                  {capacity.count}/{capacity.max}
                </span>
              </div>

              <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {capacity.full ? 'Turma cheia — remova um aluno ou aumente o limite.' : 'Você pode adicionar alunos abaixo.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Users className="w-4 h-4 text-slate-500" />
            Alunos
          </div>
          <p className="mt-2 text-slate-600">
            {alunosDaTurma.length} / {turma.max_students}
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Calendar className="w-4 h-4 text-slate-500" />
            Dias
          </div>
          <p className="mt-2 text-slate-600">
            {turma.days_of_week?.length ? turma.days_of_week.join(', ') : '—'}
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Clock className="w-4 h-4 text-slate-500" />
            Horário
          </div>
          <p className="mt-2 text-slate-600">
            {turma.start_time && turma.end_time ? `${turma.start_time} - ${turma.end_time}` : '—'}
          </p>
        </div>
      </div>

      {/* Two columns: enrolled + add */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: enrolled */}
        <div className="lg:col-span-2 bg-white border rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Alunos da turma</h2>

            <Badge variant="secondary">
              {alunosDaTurma.length} aluno(s)
            </Badge>
          </div>

          {alunosDaTurma.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="text-slate-600 font-medium">Nenhum aluno vinculado</p>
              <p className="text-slate-500 text-sm mt-1">
                Use o painel ao lado para adicionar alunos na turma.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {alunosDaTurma.map((aluno) => {
                const displayName = getStudentName(aluno)
                return (
                  <li key={aluno.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
                        {displayName
                          .split(' ')
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-900 font-medium truncate">{displayName}</p>
                        <p className="text-slate-500 text-sm">
                          {aluno.grade || '—'}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="border-rose-200 text-rose-600 hover:bg-rose-50"
                      onClick={() => removeStudentFromClass(aluno.id)}
                      disabled={removing === aluno.id}
                    >
                      {removing === aluno.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Removendo...
                        </>
                      ) : (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Remover
                        </>
                      )}
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Right: add students */}
        <div className="bg-white border rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">Adicionar aluno</h3>
            <Badge className={capacity.full ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}>
              {capacity.full ? 'Cheia' : 'Disponível'}
            </Badge>
          </div>

          <div className="mt-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Buscar por nome ou ID..."
                className="pl-9 h-11 rounded-xl"
              />
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Mostrando alunos que não estão nesta turma.
            </p>
          </div>

          <div className="mt-4 space-y-2 max-h-105 overflow-auto pr-1">
            {alunosForaDaTurma.length === 0 ? (
              <div className="rounded-xl border border-dashed p-5 text-center">
                <p className="text-slate-600 font-medium">Nenhum aluno encontrado</p>
                <p className="text-slate-500 text-sm mt-1">
                  Ajuste sua busca ou cadastre novos alunos.
                </p>
              </div>
            ) : (
              alunosForaDaTurma.map((s) => {
                const displayName = getStudentName(s)
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold">
                        {displayName
                          .split(' ')
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-900 font-medium truncate">{displayName}</p>
                        <p className="text-slate-500 text-xs">
                          {s.grade || '—'}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => addStudentToClass(s.id)}
                      disabled={capacity.full || adding === s.id}
                      className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] hover:from-[var(--brand-gradient-from-hover)] hover:to-[var(--brand-gradient-to-hover)] text-white"
                    >
                      {adding === s.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adicionando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Adicionar
                        </>
                      )}
                    </Button>
                  </div>
                )
              })
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <Link href="/main/turmas">
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Ver todas as turmas
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar turma</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2">
              <Label className="text-slate-700 font-medium">Nome da Turma *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Turma A - Reforço"
                className="mt-2 h-12 rounded-xl"
              />
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

            <div className="md:col-span-2">
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
                onValueChange={(value: 'Ativa' | 'Inativa') => setFormData({ ...formData, status: value })}
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={saveTurma}
              disabled={saving}
              className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] hover:from-[var(--brand-gradient-from-hover)] hover:to-[var(--brand-gradient-to-hover)] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Salvar alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
