'use client'

import React, { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { User, Users, Heart, BookOpen, Loader2, Save } from 'lucide-react'

type StudentData = {
  full_name: string
  birth_date: string
  grade: string
  shift: string
  origin_school: string
  cpf: string
  address: string
  status: 'Ativo' | 'Inativo'

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

function calcAge(isoDate?: string) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return ''
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age < 0 ? '' : String(age)
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

function formatPhone(value: string) {
  const v = onlyDigits(value).slice(0, 11)
  if (v.length <= 10) {
    return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void

  activeTab: string
  setActiveTab: (v: string) => void

  studentData: StudentData
  setStudentData: React.Dispatch<React.SetStateAction<StudentData>>

  guardian1: Guardian
  setGuardian1: React.Dispatch<React.SetStateAction<Guardian>>

  guardian2: Guardian
  setGuardian2: React.Dispatch<React.SetStateAction<Guardian>>

  hasGuardian2: boolean
  setHasGuardian2: (v: boolean) => void

  grades: string[]
  shifts: string[]
  relationships: string[]
  bloodTypes: string[]
  subjects: string[]

  toggleSubject: (subject: string) => void

  onSave: () => void
  isSaving: boolean
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-white/70 shadow-sm shadow-black/5 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {description ? (
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </div>
  )
}

export default function NewStudentModal({
  open,
  onOpenChange,
  activeTab,
  setActiveTab,
  studentData,
  setStudentData,
  guardian1,
  setGuardian1,
  guardian2,
  setGuardian2,
  hasGuardian2,
  setHasGuardian2,
  grades,
  shifts,
  relationships,
  bloodTypes,
  subjects,
  toggleSubject,
  onSave,
  isSaving,
}: Props) {
  const age = useMemo(() => calcAge(studentData.birth_date), [studentData.birth_date])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'p-0 overflow-hidden',
          'max-w-[96vw] sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl',
          'max-h-[90vh]',
          'flex flex-col' // ✅ essencial: modal como flex-col
        )}
      >
        {/* Header Premium */}
        <DialogHeader className="p-0">
          <div className="relative">
            <div className=" w-full bg-linear-to-r from-indigo-500/15 via-purple-500/10 to-indigo-500/15" />
            <div className="absolute inset-0 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50" />
            <div className="relative px-6 py-5 flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg sm:text-xl text-slate-900 font-bold">
                  Novo Aluno
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Preencha os dados e avance pelas seções.
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Corpo: precisa ser flex-1 e min-h-0 para o scroll funcionar */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] flex-1 min-h-0">
            {/* Sidebar */}
            <aside className="border-b lg:border-b-0 lg:border-r bg-slate-50/70 min-h-0 overflow-y-auto">
              <div className="p-4 lg:p-5">
                <TabsList
                  className={cn(
                    'w-full bg-transparent p-0 h-auto items-stretch',
                    'grid grid-cols-4 gap-2 lg:grid-cols-1'
                  )}
                >
                  <TabsTrigger
                    value="data"
                    className={cn(
                      'w-full justify-start gap-2 rounded-xl',
                      'h-11 lg:h-12 px-3 lg:px-4',
                      'data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-200',
                      'border border-transparent'
                    )}
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Dados</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="guardians"
                    className={cn(
                      'w-full justify-start gap-2 rounded-xl',
                      'h-11 lg:h-12 px-3 lg:px-4',
                      'data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-200',
                      'border border-transparent'
                    )}
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Responsáveis</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="health"
                    className={cn(
                      'w-full justify-start gap-2 rounded-xl',
                      'h-11 lg:h-12 px-3 lg:px-4',
                      'data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-200',
                      'border border-transparent'
                    )}
                  >
                    <Heart className="w-4 h-4" />
                    <span className="hidden sm:inline">Saúde</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="pedagogical"
                    className={cn(
                      'w-full justify-start gap-2 rounded-xl',
                      'h-11 lg:h-12 px-3 lg:px-4',
                      'data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-200',
                      'border border-transparent'
                    )}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Pedagógico</span>
                  </TabsTrigger>
                </TabsList>

                <div className="hidden lg:block mt-5 rounded-2xl border bg-white/60 p-4">
                  <p className="text-xs text-slate-500">
                    Dica: no desktop, o layout é mais “retangular” para reduzir rolagem.
                    Complete uma seção por vez.
                  </p>
                </div>
              </div>
            </aside>

            {/* Conteúdo da direita */}
            <section className="relative min-h-0 flex flex-col">
              {/* ✅ Scroll fica aqui (não no section inteiro) */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5">
                {/* DADOS */}
                <TabsContent value="data" className="mt-0 space-y-4">
                  <SectionCard title="Dados do Aluno" description="Informações básicas do aluno.">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div className="md:col-span-2 xl:col-span-3 space-y-2">
                        <Label className="text-sm font-medium">
                          Nome completo <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={studentData.full_name}
                          onChange={(e) =>
                            setStudentData({ ...studentData, full_name: e.target.value })
                          }
                          placeholder="Ex.: João Pedro Silva"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Data de nascimento <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={studentData.birth_date}
                          onChange={(e) =>
                            setStudentData({ ...studentData, birth_date: e.target.value })
                          }
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Idade</Label>
                        <Input value={age} readOnly className="h-11 bg-muted/40" placeholder="Auto" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Série/Ano escolar <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={studentData.grade}
                          onValueChange={(v) => setStudentData({ ...studentData, grade: v })}
                        >
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="Selecione..." />
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

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Turno <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={studentData.shift}
                          onValueChange={(v) => setStudentData({ ...studentData, shift: v })}
                        >
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="Selecione..." />
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

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          CPF do aluno <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={formatCPF(studentData.cpf)}
                          onChange={(e) =>
                            setStudentData({ ...studentData, cpf: onlyDigits(e.target.value) })
                          }
                          placeholder="000.000.000-00"
                          className="h-11"
                          inputMode="numeric"
                        />
                      </div>

                      <div className="md:col-span-2 xl:col-span-3 space-y-2">
                        <Label className="text-sm font-medium">
                          EndereÃ§o do aluno <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={studentData.address}
                          onChange={(e) =>
                            setStudentData({ ...studentData, address: e.target.value })
                          }
                          placeholder="Rua, nÃºmero, bairro, cidade"
                          className="h-11"
                        />
                      </div>

                      <div className="md:col-span-2 xl:col-span-3 space-y-2">
                        <Label className="text-sm font-medium">Escola de origem</Label>
                        <Input
                          value={studentData.origin_school}
                          onChange={(e) =>
                            setStudentData({ ...studentData, origin_school: e.target.value })
                          }
                          placeholder="Ex.: Escola Municipal..."
                          className="h-11"
                        />
                      </div>
                    </div>
                  </SectionCard>
                </TabsContent>

                {/* RESPONSÁVEIS */}
                <TabsContent value="guardians" className="mt-0 space-y-4">
                  <SectionCard title="Responsável 1" description="Contato principal para comunicações.">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div className="md:col-span-2 xl:col-span-3 space-y-2">
                        <Label className="text-sm font-medium">
                          Nome completo <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={guardian1.full_name}
                          onChange={(e) => setGuardian1({ ...guardian1, full_name: e.target.value })}
                          className="h-11"
                          placeholder="Ex.: Maria Silva"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">CPF</Label>
                        <Input
                          value={formatCPF(guardian1.cpf)}
                          onChange={(e) => setGuardian1({ ...guardian1, cpf: onlyDigits(e.target.value) })}
                          className="h-11"
                          placeholder="000.000.000-00"
                          inputMode="numeric"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Parentesco <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={guardian1.relationship}
                          onValueChange={(v) => setGuardian1({ ...guardian1, relationship: v })}
                        >
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {relationships.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Telefone (WhatsApp) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={formatPhone(guardian1.phone)}
                          onChange={(e) => setGuardian1({ ...guardian1, phone: onlyDigits(e.target.value) })}
                          className="h-11"
                          placeholder="(31) 9xxxx-xxxx"
                          inputMode="tel"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2 xl:col-span-1">
                        <Label className="text-sm font-medium">E-mail</Label>
                        <Input
                          value={guardian1.email}
                          onChange={(e) => setGuardian1({ ...guardian1, email: e.target.value })}
                          className="h-11"
                          placeholder="email@exemplo.com"
                          type="email"
                        />
                      </div>

                      <div className="md:col-span-2 xl:col-span-3 space-y-2">
                        <Label className="text-sm font-medium">Endereço</Label>
                        <Input
                          value={guardian1.address || ''}
                          onChange={(e) => setGuardian1({ ...guardian1, address: e.target.value })}
                          className="h-11"
                          placeholder="Rua, número, bairro, cidade"
                        />
                      </div>
                    </div>
                  </SectionCard>

                  <div className="rounded-2xl border bg-slate-50/70 px-5 py-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-900">Responsável 2 (opcional)</p>
                      <p className="text-xs text-slate-500">Ative apenas se houver um segundo contato.</p>
                    </div>
                    <Switch checked={hasGuardian2} onCheckedChange={setHasGuardian2} />
                  </div>

                  {hasGuardian2 && (
                    <SectionCard title="Responsável 2" description="Contato secundário para emergências ou recados.">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <div className="md:col-span-2 xl:col-span-3 space-y-2">
                          <Label className="text-sm font-medium">Nome completo</Label>
                          <Input
                            value={guardian2.full_name}
                            onChange={(e) => setGuardian2({ ...guardian2, full_name: e.target.value })}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">CPF</Label>
                          <Input
                            value={formatCPF(guardian2.cpf)}
                            onChange={(e) => setGuardian2({ ...guardian2, cpf: onlyDigits(e.target.value) })}
                            className="h-11"
                            placeholder="000.000.000-00"
                            inputMode="numeric"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Parentesco</Label>
                          <Select
                            value={guardian2.relationship}
                            onValueChange={(v) => setGuardian2({ ...guardian2, relationship: v })}
                          >
                            <SelectTrigger className="h-11 w-full">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {relationships.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Telefone (WhatsApp)</Label>
                          <Input
                            value={formatPhone(guardian2.phone)}
                            onChange={(e) => setGuardian2({ ...guardian2, phone: onlyDigits(e.target.value) })}
                            className="h-11"
                            placeholder="(31) 9xxxx-xxxx"
                            inputMode="tel"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2 xl:col-span-1">
                          <Label className="text-sm font-medium">E-mail</Label>
                          <Input
                            value={guardian2.email}
                            onChange={(e) => setGuardian2({ ...guardian2, email: e.target.value })}
                            className="h-11"
                            placeholder="email@exemplo.com"
                            type="email"
                          />
                        </div>

                        <div className="md:col-span-2 xl:col-span-3 space-y-2">
                          <Label className="text-sm font-medium">Observações dos Pais</Label>
                          <Textarea
                            value={guardian2.notes || ''}
                            onChange={(e) => setGuardian2({ ...guardian2, notes: e.target.value })}
                            className="min-h-24"
                            placeholder="Alguma observação adicional..."
                          />
                        </div>
                      </div>
                    </SectionCard>
                  )}
                </TabsContent>

                {/* SAÚDE */}
                <TabsContent value="health" className="mt-0 space-y-4">
                  <SectionCard title="Saúde e Comportamento" description="Informações importantes para acompanhamento.">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Alergias</Label>
                        <Textarea
                          value={studentData.allergies}
                          onChange={(e) => setStudentData({ ...studentData, allergies: e.target.value })}
                          className="min-h-28"
                          placeholder="Ex.: lactose, poeira, amendoim..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tipo sanguíneo</Label>
                        <Select
                          value={studentData.blood_type}
                          onValueChange={(v) => setStudentData({ ...studentData, blood_type: v })}
                        >
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {bloodTypes.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="mt-4 space-y-2">
                          <Label className="text-sm font-medium">Laudos médicos importantes</Label>
                          <Textarea
                            value={studentData.medical_reports}
                            onChange={(e) => setStudentData({ ...studentData, medical_reports: e.target.value })}
                            className="min-h-28"
                            placeholder="Ex.: TDAH, dislexia, relatórios..."
                          />
                        </div>
                      </div>

                      <div className="space-y-2 xl:col-span-2">
                        <Label className="text-sm font-medium">Medicamentos em uso / controlados</Label>
                        <Textarea
                          value={studentData.medications}
                          onChange={(e) => setStudentData({ ...studentData, medications: e.target.value })}
                          className="min-h-24"
                          placeholder="Informe nome e horário, se necessário."
                        />
                      </div>

                      <div className="space-y-2 xl:col-span-2">
                        <Label className="text-sm font-medium">
                          Outras informações relevantes (saúde ou comportamento)
                        </Label>
                        <Textarea
                          value={studentData.behavior_notes}
                          onChange={(e) => setStudentData({ ...studentData, behavior_notes: e.target.value })}
                          className="min-h-24"
                          placeholder="Ex.: sensibilidade a barulho, rotina, gatilhos..."
                        />
                      </div>
                    </div>
                  </SectionCard>
                </TabsContent>

                {/* PEDAGÓGICO */}
                <TabsContent value="pedagogical" className="mt-0 space-y-4">
                  <SectionCard title="Informações Escolares" description="Dificuldades e histórico de reforço.">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Matérias com maior dificuldade</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {subjects.map((subject) => {
                            const active = (studentData.difficulty_subjects || []).includes(subject)
                            return (
                              <button
                                key={subject}
                                type="button"
                                onClick={() => toggleSubject(subject)}
                                className={cn(
                                  'h-11 rounded-xl border px-3 text-left text-sm transition-colors',
                                  active
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                )}
                              >
                                {subject}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Reação às dificuldades</Label>
                        <Textarea
                          value={studentData.difficulty_reaction}
                          onChange={(e) => setStudentData({ ...studentData, difficulty_reaction: e.target.value })}
                          className="min-h-28"
                          placeholder="Ex.: fica ansiosa, desmotiva, perde o foco..."
                        />

                        <div className="mt-4 rounded-2xl border bg-slate-50/70 p-4 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-slate-900">Já fez reforço antes?</p>
                            <p className="text-xs text-slate-500">Selecione Sim ou Não.</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setStudentData({ ...studentData, previous_tutoring: true })}
                              className={cn(
                                'h-10 px-4 rounded-xl border text-sm transition-colors',
                                studentData.previous_tutoring === true
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              )}
                            >
                              Sim
                            </button>

                            <button
                              type="button"
                              onClick={() => setStudentData({ ...studentData, previous_tutoring: false })}
                              className={cn(
                                'h-10 px-4 rounded-xl border text-sm transition-colors',
                                studentData.previous_tutoring === false
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              )}
                            >
                              Não
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </TabsContent>
              </div>

              {/* Footer fixo (sem cortar, sem depender de sticky) */}
              <DialogFooter className="shrink-0 border-t bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 px-6 py-4">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                  Cancelar
                </Button>

                <Button
                  onClick={onSave}
                  disabled={isSaving}
                  className="rounded-xl bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] text-white shadow-md shadow-indigo-200"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </section>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
