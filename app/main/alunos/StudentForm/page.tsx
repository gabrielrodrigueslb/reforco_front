'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { ArrowLeft, BookOpen, Heart, Loader2, Pencil, Save, User } from 'lucide-react'

import { StudentsService, StudentResponse } from '@/services/students.service'
import PageTitle from '@/components/page-title'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type StudentFormData = {
  full_name: string
  birth_date: string
  grade: string
  shift: string
  status: 'Ativo' | 'Inativo'
  origin_school: string
  cpf: string
  address: string
  allergies: string
  blood_type: string
  medical_reports: string
  medications: string
  behavior_notes: string
  difficulty_subjects: string[]
  difficulty_reaction: string
  previous_tutoring: null | boolean
  performance_indicator: string
}

const grades = [
  '1º Ano','2º Ano','3º Ano','4º Ano','5º Ano','6º Ano','7º Ano','8º Ano','9º Ano','1º EM','2º EM','3º EM',
]
const shifts = ['Manhã', 'Tarde']
const bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Não informado']
const performanceOptions = ['Melhorando','Atenção','Decaindo','Não avaliado']

function toDateOnly(value?: string) {
  if (!value) return ''
  return value.slice(0, 10)
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function formatCPF(value: string) {
  const v = onlyDigits(value).slice(0, 11)
  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '')
}

function mapGradeValue(value: string) {
  if (!value) return ''
  const mapped = grades.find((g) => normalizeText(g) === normalizeText(value))
  return mapped || value
}

function mapBloodTypeValue(value: string) {
  if (!value) return ''
  const mapped = bloodTypes.find((b) => normalizeText(b) === normalizeText(value))
  return mapped || value
}

function parseSubjects(value: string) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
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

export default function StudentFormPage() {
  const router = useRouter()
  const search = useSearchParams()
  const id = search.get('id') || ''

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string>('/astronautaconfuso.png')
  const [initialForm, setInitialForm] = useState<StudentFormData | null>(null)

  const [form, setForm] = useState<StudentFormData>({
    full_name: '',
    birth_date: '',
    grade: '',
    shift: '',
    status: 'Ativo',
    origin_school: '',
    cpf: '',
    address: '',
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

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    StudentsService.getById(id)
      .then((data: StudentResponse) => {
        const loadedForm: StudentFormData = {
          full_name: data.full_name || '',
          birth_date: toDateOnly(data.birth_date),
          grade: mapGradeValue(data.grade || ''),
          shift: data.shift || '',
          status: data.status || 'Ativo',
          origin_school: data.origin_school || '',
          cpf: data.cpf || '',
          address: data.address || '',
          allergies: data.allergies || '',
          blood_type: mapBloodTypeValue(data.blood_type || 'Não informado'),
          medical_reports: data.medical_reports || '',
          medications: data.medications || '',
          behavior_notes: data.behavior_notes || '',
          difficulty_subjects: data.difficulty_subjects || [],
          difficulty_reaction: data.difficulty_reaction || '',
          previous_tutoring: data.previous_tutoring ?? null,
          performance_indicator: data.performance_indicator || 'Não avaliado',
        }
        setForm(loadedForm)
        setInitialForm(loadedForm)
        setPhotoUrl(data.foto_aluno || '/astronautaconfuso.png')
      })
      .catch(() => {
        toast.error('Não foi possível carregar o aluno')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  const photoPreview = useMemo(() => {
    if (photoFile) return URL.createObjectURL(photoFile)
    return photoUrl || ''
  }, [photoFile, photoUrl])
  const age = useMemo(() => calculateAge(form.birth_date), [form.birth_date])
  const gradeOptions = useMemo(() => {
    if (!form.grade) return grades
    return grades.includes(form.grade) ? grades : [form.grade, ...grades]
  }, [form.grade])
  const bloodTypeOptions = useMemo(() => {
    if (!form.blood_type) return bloodTypes
    return bloodTypes.includes(form.blood_type)
      ? bloodTypes
      : [form.blood_type, ...bloodTypes]
  }, [form.blood_type])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setPhotoFile(file)
  }

  const hasChanges = useMemo(() => {
    if (!initialForm) return false
    if (photoFile) return true
    return (Object.keys(form) as Array<keyof StudentFormData>).some(
      (key) => form[key] !== initialForm[key]
    )
  }, [form, initialForm, photoFile])

  const handleSave = async () => {
    if (!id) return
    if (!form.full_name || !form.birth_date || !form.grade || !form.shift) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      const changes: Partial<StudentFormData> = {}
      if (initialForm) {
        (Object.keys(form) as Array<keyof StudentFormData>).forEach((key) => {
          if (form[key] !== initialForm[key]) changes[key] = form[key]
        })
      } else {
        Object.assign(changes, form)
      }

      if (Object.keys(changes).length > 0) {
        await StudentsService.update(id, {
          full_name: changes.full_name,
          birth_date: changes.birth_date,
          grade: changes.grade,
          shift: changes.shift,
          status: changes.status,
          origin_school: changes.origin_school,
          cpf: changes.cpf,
          address: changes.address,
          allergies: changes.allergies,
          blood_type: changes.blood_type,
          medical_reports: changes.medical_reports,
          medications: changes.medications,
          behavior_notes: changes.behavior_notes,
          difficulty_subjects: changes.difficulty_subjects,
          difficulty_reaction: changes.difficulty_reaction,
          previous_tutoring: changes.previous_tutoring,
          performance_indicator: changes.performance_indicator,
        })
        setInitialForm(form)
      }

      if (photoFile) {
        setUploading(true)
        const updated = await StudentsService.uploadPhoto(id, photoFile)
        setPhotoUrl(updated.foto_aluno || '/astronautaconfuso.png')
        setPhotoFile(null)
        setUploading(false)
      }

      toast.success('Aluno atualizado com sucesso')
      router.push(`/main/alunos/${id}`)
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível salvar')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 rounded bg-slate-100" />
        <div className="h-64 rounded-2xl bg-slate-100" />
      </div>
    )
  }

  if (!id) {
    return (
      <div className="space-y-4">
        <PageTitle title="Editar Aluno" className="text-2xl font-bold text-slate-800" />
        <p className="text-slate-600">Aluno não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="relative group">
          <Button onClick={handleSave} disabled={!hasChanges || saving || uploading}>
            {saving || uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
          {!hasChanges && (
            <div className="pointer-events-none absolute -bottom-10 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="rounded-md bg-slate-900 text-white text-xs px-2 py-1 shadow-lg">
                Nenhuma alteração
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header card (estilo ficha) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-to) p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <label className="group relative w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-bold overflow-hidden cursor-pointer">
              <Image src={photoPreview} alt="Foto do aluno" width={80} height={80} unoptimized />
              <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-[10px] font-medium">
                <span className="h-8 w-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Pencil className="w-3.5 h-3.5 text-white" />
                </span>
                <span>Mudar foto</span>
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
            <div className="text-white">
              <PageTitle
                title={form.full_name || 'Editar Aluno'}
                className="text-2xl lg:text-3xl font-bold text-white"
              />
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                  {form.grade || 'Série'}
                </Badge>
                <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                  {form.shift || 'Turno'}
                </Badge>
                {age !== null && (
                  <span className="text-white/80 text-sm font-medium">
                    {age} anos
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-lg">
          <User className="w-5 h-5 text-indigo-500" />
          Dados Pessoais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Nome completo *</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-2 h-11"
            />
          </div>

          <div>
            <Label>Data de nascimento *</Label>
            <Input
              type="date"
              value={form.birth_date}
              onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
              className="mt-2 h-11 rounded-xl"
            />
          </div>

          <div>
            <Label>Série *</Label>
            <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
              <SelectTrigger className="mt-2 h-11 w-full rounded-xl">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Turno *</Label>
            <Select value={form.shift} onValueChange={(v) => setForm({ ...form, shift: v })}>
              <SelectTrigger className="mt-2 h-11 w-full rounded-xl">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {shifts.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v: 'Ativo' | 'Inativo') => setForm({ ...form, status: v })}>
              <SelectTrigger className="mt-2 h-11 w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className=''>
            <Label>CPF *</Label>
            <Input
              value={formatCPF(form.cpf)}
              onChange={(e) => setForm({ ...form, cpf: onlyDigits(e.target.value) })}
              className="mt-2 h-11"
            />
          </div>

          <div className="">
            <Label>Endereço *</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-2 h-11"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Escola de origem</Label>
            <Input
              value={form.origin_school}
              onChange={(e) => setForm({ ...form, origin_school: e.target.value })}
              className="mt-2 h-11"
            />
          </div>
        </div>
      </div>

      {/* Saúde */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-lg">
          <Heart className="w-5 h-5 text-rose-500" />
          Saúde
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Tipo sanguíneo</Label>
            <Select value={form.blood_type} onValueChange={(v) => setForm({ ...form, blood_type: v })}>
              <SelectTrigger className="mt-2 h-11 w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {bloodTypeOptions.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Desempenho</Label>
            <Select value={form.performance_indicator} onValueChange={(v) => setForm({ ...form, performance_indicator: v })}>
              <SelectTrigger className="mt-2 h-11 w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {performanceOptions.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Alergias</Label>
            <Textarea
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              className="mt-2"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Medicamentos</Label>
            <Textarea
              value={form.medications}
              onChange={(e) => setForm({ ...form, medications: e.target.value })}
              className="mt-2"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Laudos médicos</Label>
            <Textarea
              value={form.medical_reports}
              onChange={(e) => setForm({ ...form, medical_reports: e.target.value })}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Pedagógico */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-lg">
          <BookOpen className="w-5 h-5 text-blue-500" />
          Informações Pedagógicas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Matérias com dificuldade</Label>
            <Input
              value={form.difficulty_subjects.join(', ')}
              onChange={(e) =>
                setForm({ ...form, difficulty_subjects: parseSubjects(e.target.value) })
              }
              className="mt-2 h-11 rounded-xl"
              placeholder="Ex.: Matemática, Português, Ciências"
            />
            <p className="text-xs text-slate-500 mt-2">
              Separe as matérias por vírgula.
            </p>
          </div>

          <div className="md:col-span-2">
            <Label>Reação às dificuldades</Label>
            <Textarea
              value={form.difficulty_reaction}
              onChange={(e) => setForm({ ...form, difficulty_reaction: e.target.value })}
              className="mt-2"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Observações de comportamento</Label>
            <Textarea
              value={form.behavior_notes}
              onChange={(e) => setForm({ ...form, behavior_notes: e.target.value })}
              className="mt-2"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
