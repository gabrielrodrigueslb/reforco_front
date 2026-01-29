'use client'

import React, { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  UserPlus,
  Users,
  Upload,
  Grid3x3,
  List,
  MoreVertical,
  Eye,
  Trash2,
  FileText,
  CalendarCheck,
  Search,
  Filter,
  X,
} from 'lucide-react'

import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import ImportStudentsModal from '@/components/alunos/ImportStudentsModal'
import NewStudentModal from '@/components/alunos/NewStudentModal'

type Guardian = {
  is_primary: boolean
  full_name: string
  cpf: string
  relationship: string
  phone: string
  email: string
  address?: string
  notes?: string
}

type Student = {
  id: string
  full_name: string
  foto_aluno?: string
  birth_date: string
  grade: string
  shift: string
  status: 'Ativo' | 'Inativo'
  performance_indicator: string
  difficulty_subjects: string[]

  origin_school?: string

  allergies?: string
  blood_type?: string
  medical_reports?: string
  medications?: string
  behavior_notes?: string

  difficulty_reaction?: string
  previous_tutoring?: null | boolean

  guardians?: Guardian[]
  created_at?: string
}

type Filters = {
  search: string
  grade: string
  shift: string
  status: string
  difficulty: string
}

const createPageUrl = (path: string) => `/main/alunos/${path}`

// Valor sentinela para opção "Todas/Todos" (evita value="")
const ALL = '__all__'

const MOCK_STUDENTS_DATA: Student[] = [
  {
    id: '1',
    full_name: 'Ana Júlia Souza',
    foto_aluno: '/aluna.jpg',
    birth_date: '2015-05-10',
    grade: '4º Ano',
    shift: 'Manhã',
    status: 'Ativo',
    performance_indicator: 'Melhorando',
    difficulty_subjects: ['Matemática'],
  },
  {
    id: '2',
    full_name: 'Carlos Eduardo Lima',
    foto_aluno: '/aluno.jpg',
    birth_date: '2014-08-20',
    grade: '5º Ano',
    shift: 'Tarde',
    status: 'Ativo',
    performance_indicator: 'Atenção',
    difficulty_subjects: ['Português', 'História'],
  },
  {
    id: '3',
    full_name: 'Pedro Henrique',
    foto_aluno: '/aluno2.jpg',
    birth_date: '2016-02-15',
    grade: '3º Ano',
    shift: 'Manhã',
    status: 'Inativo',
    performance_indicator: 'Não avaliado',
    difficulty_subjects: [],
  },
]

const grades = [
  '1º Ano','2º Ano','3º Ano','4º Ano','5º Ano','6º Ano','7º Ano','8º Ano','9º Ano','1º EM','2º EM','3º EM',
]
const shifts = ['Manhã', 'Tarde']
const relationships = ['Pai','Mãe','Avô','Avó','Tio(a)','Irmão(ã)','Responsável Legal','Outro']
const bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Não informado']
const subjects = ['Português','Matemática','Ciências','História','Geografia','Inglês','Artes','Ed. Física']

const performanceColors: Record<string, string> = {
  Melhorando: 'bg-emerald-100 text-emerald-700',
  Atenção: 'bg-amber-100 text-amber-700',
  Decaindo: 'bg-rose-100 text-rose-700',
  'Não avaliado': 'bg-slate-100 text-slate-600',
}

function safeId() {
  // @ts-ignore
  return (globalThis?.crypto?.randomUUID?.() as string) ?? Math.random().toString(36).slice(2, 11)
}

function calculateAge(birthDate: string) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS_DATA)
  const [isLoading] = useState(false)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showNewModal, setShowNewModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null)

  const [filters, setFilters] = useState<Filters>({
    search: '',
    grade: '',
    shift: '',
    status: '',
    difficulty: '',
  })

  // ===== NEW STUDENT STATES =====
  const [activeTab, setActiveTab] = useState('data')
  const [hasGuardian2, setHasGuardian2] = useState(false)

  const [studentData, setStudentData] = useState({
    full_name: '',
    birth_date: '',
    grade: '',
    shift: '',
    origin_school: '',
    status: 'Ativo' as const,

    allergies: '',
    blood_type: 'Não informado',
    medical_reports: '',
    medications: '',
    behavior_notes: '',

    difficulty_subjects: [] as string[],
    difficulty_reaction: '',
    previous_tutoring: null as null | boolean,

    performance_indicator: 'Não avaliado',
  })

  const [guardian1, setGuardian1] = useState<Guardian>({
    is_primary: true,
    full_name: '',
    cpf: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
  })

  const [guardian2, setGuardian2] = useState<Guardian>({
    is_primary: false,
    full_name: '',
    cpf: '',
    relationship: '',
    phone: '',
    email: '',
    notes: '',
  })

  const [isSaving, setIsSaving] = useState(false)

  const resetNewForm = useCallback(() => {
    setStudentData({
      full_name: '',
      birth_date: '',
      grade: '',
      shift: '',
      origin_school: '',
      status: 'Ativo',

      allergies: '',
      blood_type: 'Não informado',
      medical_reports: '',
      medications: '',
      behavior_notes: '',

      difficulty_subjects: [],
      difficulty_reaction: '',
      previous_tutoring: null,

      performance_indicator: 'Não avaliado',
    })

    setGuardian1({
      is_primary: true,
      full_name: '',
      cpf: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
    })

    setGuardian2({
      is_primary: false,
      full_name: '',
      cpf: '',
      relationship: '',
      phone: '',
      email: '',
      notes: '',
    })

    setHasGuardian2(false)
    setActiveTab('data')
  }, [])

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (filters.search && !student.full_name?.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.grade && student.grade !== filters.grade) return false
      if (filters.shift && student.shift !== filters.shift) return false
      if (filters.status && student.status !== filters.status) return false
      if (filters.difficulty && !student.difficulty_subjects?.includes(filters.difficulty)) return false
      return true
    })
  }, [students, filters])

  const handleDeleteStudent = useCallback(async () => {
    if (!deleteStudent) return
    const id = deleteStudent.id
    setStudents((prev) => prev.filter((s) => s.id !== id))
    toast.success('Aluno excluído com sucesso')
    setDeleteStudent(null)
  }, [deleteStudent])

  const toggleSubject = useCallback((subject: string) => {
    setStudentData((prev) => {
      const current = prev.difficulty_subjects || []
      const updated = current.includes(subject)
        ? current.filter((s) => s !== subject)
        : [...current, subject]
      return { ...prev, difficulty_subjects: updated }
    })
  }, [])

  const handleSaveStudent = useCallback(async () => {
    if (!studentData.full_name || !studentData.birth_date || !studentData.grade || !studentData.shift) {
      toast.error('Preencha todos os campos obrigatórios na aba "Dados"')
      setActiveTab('data')
      return
    }

    if (!guardian1.full_name || !guardian1.phone || !guardian1.relationship) {
      toast.error('Preencha os dados do responsável principal')
      setActiveTab('guardians')
      return
    }

    if (hasGuardian2 && (!guardian2.full_name || !guardian2.phone || !guardian2.relationship)) {
      toast.error('Preencha os dados do responsável 2 ou desative a opção')
      setActiveTab('guardians')
      return
    }

    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))

      const newStudent: Student = {
        id: safeId(),
        ...studentData,
        created_at: new Date().toISOString(),
        guardians: hasGuardian2 ? [guardian1, guardian2] : [guardian1],
      }

      setStudents((prev) => [newStudent, ...prev])
      toast.success('Aluno cadastrado com sucesso!')
      setShowNewModal(false)
      resetNewForm()
    } catch {
      toast.error('Erro ao salvar aluno')
    } finally {
      setIsSaving(false)
    }
  }, [studentData, guardian1, guardian2, hasGuardian2, resetNewForm])

  const clearFilters = useCallback(() => {
    setFilters({ search: '', grade: '', shift: '', status: '', difficulty: '' })
  }, [])

  const hasAnyFilter = useMemo(() => {
    return Object.values(filters).some(Boolean)
  }, [filters])

  // Helper: quando o Select voltar ALL, vira '' no estado
  const toFilterValue = (v: string) => (v === ALL ? '' : v)

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header (premium + responsivo) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Alunos</h1>
          <p className="text-slate-500">{students.length} alunos cadastrados</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="h-11 px-4 rounded-xl justify-center"
          >
            <Upload className="w-5 h-5 mr-2" />
            Importar
          </Button>

          <Button
            onClick={() => { resetNewForm(); setShowNewModal(true) }}
            className="h-11 px-4 rounded-xl justify-center bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-200"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Novo Aluno
          </Button>
        </div>
      </div>

      {/* Painel de Filtros (corrige quebra do mobile) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-4 sm:p-5 space-y-4">
          {/* Search */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                placeholder="Buscar aluno por nome..."
                className="h-11 pl-10 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between lg:justify-end gap-2">
              {/* View toggle */}
              <div className="flex gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'h-9 w-9 grid place-items-center rounded-lg transition-colors',
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                  aria-label="Visualização em grade"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'h-9 w-9 grid place-items-center rounded-lg transition-colors',
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                  aria-label="Visualização em lista"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {hasAnyFilter && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  className="h-10 rounded-xl"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {/* Selects */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                Série
              </div>
              <Select
                value={filters.grade || ALL}
                onValueChange={(v) => setFilters((p) => ({ ...p, grade: toFilterValue(v) }))}
              >
                <SelectTrigger className="h-11 rounded-xl w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500">Turno</div>
              <Select
                value={filters.shift || ALL}
                onValueChange={(v) => setFilters((p) => ({ ...p, shift: toFilterValue(v) }))}
              >
                <SelectTrigger className="h-11 rounded-xl w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {shifts.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500">Situação</div>
              <Select
                value={filters.status || ALL}
                onValueChange={(v) => setFilters((p) => ({ ...p, status: toFilterValue(v) }))}
              >
                <SelectTrigger className="h-11 rounded-xl w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500">Dificuldade</div>
              <Select
                value={filters.difficulty || ALL}
                onValueChange={(v) => setFilters((p) => ({ ...p, difficulty: toFilterValue(v) }))}
              >
                <SelectTrigger className="h-11 rounded-xl w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Students Display */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-2'}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className={viewMode === 'grid' ? 'h-48 rounded-2xl' : 'h-20 rounded-xl'} />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-slate-100">
          <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhum aluno encontrado</h3>
          <p className="text-slate-500 mb-6">
            {hasAnyFilter ? 'Tente ajustar os filtros' : 'Comece cadastrando seu primeiro aluno'}
          </p>

          {!hasAnyFilter && (
            <Button
              onClick={() => { resetNewForm(); setShowNewModal(true) }}
              className="bg-linear-to-r from-indigo-500 to-purple-600 h-11 rounded-xl"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Cadastrar Aluno
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const age = calculateAge(student.birth_date)

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200 overflow-hidden shrink-0">
                      {student.foto_aluno ? (
                        <Image
                          src={student.foto_aluno}
                          className="object-cover w-full h-full"
                          alt={student.full_name || 'Foto do aluno'}
                          width={56}
                          height={56}
                        />
                      ) : (
                        <span>{student.full_name?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{student.full_name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-500">
                        <span className="truncate">{student.grade}</span>
                        {age !== null && <span className="shrink-0">• {age} anos</span>}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0">
                        <MoreVertical className="w-5 h-5 text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={createPageUrl(`${student.id}`)} className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Ver Ficha
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href={createPageUrl(`StudentGrades?id=${student.id}`)} className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Boletim
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href={createPageUrl(`Attendance?student=${student.id}`)} className="flex items-center gap-2">
                          <CalendarCheck className="w-4 h-4" />
                          Frequência
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={() => setDeleteStudent(student)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Badge variant="outline" className="bg-slate-50 rounded-full">{student.shift}</Badge>
                  <Badge className={cn('font-medium rounded-full', performanceColors[student.performance_indicator] || performanceColors['Não avaliado'])}>
                    {student.performance_indicator || 'Não avaliado'}
                  </Badge>
                  {student.status === 'Inativo' && <Badge className="bg-slate-200 text-slate-600 rounded-full">Inativo</Badge>}
                </div>

                {student.difficulty_subjects?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Dificuldades:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {student.difficulty_subjects.slice(0, 3).map((subject, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-rose-50 text-rose-600 rounded-full">
                          {subject}
                        </span>
                      ))}
                      {student.difficulty_subjects.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-full">
                          +{student.difficulty_subjects.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Aluno</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Desempenho</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredStudents.map((student) => {
                const age = calculateAge(student.birth_date)

                return (
                  <TableRow key={student.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
                          {student.foto_aluno ? (
                            <Image src={student.foto_aluno} className="object-cover w-full h-full" alt={student.full_name || 'Foto do aluno'} width={40} height={40} />
                          ) : (
                            <span>{student.full_name?.charAt(0)?.toUpperCase()}</span>
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-slate-800">{student.full_name}</p>
                          {age !== null && <p className="text-sm text-slate-500">{age} anos</p>}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.shift}</TableCell>

                    <TableCell>
                      <Badge className={cn(performanceColors[student.performance_indicator] || performanceColors['Não avaliado'])}>
                        {student.performance_indicator || 'Não avaliado'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-slate-100 rounded-lg">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={createPageUrl(`${student.id}`)} className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              Ver Ficha
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild>
                            <Link href={createPageUrl(`StudentGrades?id=${student.id}`)} className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Boletim
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem className="text-rose-600" onClick={() => setDeleteStudent(student)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New Student Modal */}
      <NewStudentModal
        open={showNewModal}
        onOpenChange={(open) => {
          setShowNewModal(open)
          if (!open) resetNewForm()
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentData={studentData}
        setStudentData={setStudentData}
        guardian1={guardian1}
        setGuardian1={setGuardian1}
        guardian2={guardian2}
        setGuardian2={setGuardian2}
        hasGuardian2={hasGuardian2}
        setHasGuardian2={setHasGuardian2}
        grades={grades}
        shifts={shifts}
        relationships={relationships}
        bloodTypes={bloodTypes}
        subjects={subjects}
        toggleSubject={toggleSubject}
        onSave={handleSaveStudent}
        isSaving={isSaving}
      />

      {/* Import Modal */}
      <ImportStudentsModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        templateHref="/templates/Modelo_Importacao_Alunos.xlsx"
        onImported={(newStudents) => {
          setStudents((prev) => [...(newStudents as any as Student[]), ...prev])
          toast.success('Alunos importados com sucesso!')
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteStudent} onOpenChange={() => setDeleteStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o aluno <strong>{deleteStudent?.full_name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-500 hover:bg-rose-600" onClick={handleDeleteStudent}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
