'use client'

import React, { useCallback, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Check, FileSpreadsheet, Loader2, Upload, User, Users, Heart, BookOpen, Save, ArrowLeft } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  GuardianPayload,
  StudentPayload,
  StudentResponse,
  StudentsService,
} from '@/services/students.service'

const IGNORE_VALUE = '__ignore__'

// --- TIPAGEM (Mantida) ---
type FieldKey =
  | 'full_name' | 'birth_date' | 'grade' | 'shift' | 'origin_school' | 'cpf' | 'address'
  | 'guardian1_full_name' | 'guardian1_cpf' | 'guardian1_relationship' | 'guardian1_phone' | 'guardian1_email' | 'guardian1_address'
  | 'guardian2_full_name' | 'guardian2_cpf' | 'guardian2_relationship' | 'guardian2_phone' | 'guardian2_email' | 'guardian2_address'
  | 'allergies' | 'blood_type' | 'medical_reports' | 'medications' | 'behavior_notes'
  | 'difficulty_subjects' | 'difficulty_reaction' | 'previous_tutoring'

type FieldConfig = {
  key: FieldKey
  label: string
  required?: boolean
}

type FieldSection = {
  id: string // Identificador para agrupar nas abas
  title: string
  description?: string
  fields: FieldConfig[]
}

type ImportErrorDetail = {
  index: number
  label: string
  reason: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: (students: StudentResponse[]) => void
  templateHref?: string
}

// --- CONFIGURAÇÃO DOS CAMPOS (Adicionado ID para filtro) ---
const fieldSections: FieldSection[] = [
  {
    id: 'data',
    title: 'Dados do Aluno',
    description: 'Campos obrigatórios para criação do aluno.',
    fields: [
      { key: 'full_name', label: 'Nome completo', required: true },
      { key: 'birth_date', label: 'Data de nascimento', required: true },
      { key: 'grade', label: 'Série/Ano escolar', required: true },
      { key: 'shift', label: 'Turno', required: true },
      { key: 'cpf', label: 'CPF do aluno', required: true },
      { key: 'address', label: 'Endereço do aluno', required: true },
      { key: 'origin_school', label: 'Escola de origem' },
    ],
  },
  {
    id: 'guardians',
    title: 'Responsável 1',
    description: 'Contato principal do aluno.',
    fields: [
      { key: 'guardian1_full_name', label: 'Nome completo' },
      { key: 'guardian1_cpf', label: 'CPF' },
      { key: 'guardian1_relationship', label: 'Parentesco' },
      { key: 'guardian1_phone', label: 'Telefone (WhatsApp)' },
      { key: 'guardian1_email', label: 'E-mail' },
      { key: 'guardian1_address', label: 'Endereço' },
    ],
  },
  {
    id: 'guardians',
    title: 'Responsável 2',
    description: 'Contato secundário (opcional).',
    fields: [
      { key: 'guardian2_full_name', label: 'Nome completo' },
      { key: 'guardian2_cpf', label: 'CPF' },
      { key: 'guardian2_relationship', label: 'Parentesco' },
      { key: 'guardian2_phone', label: 'Telefone (WhatsApp)' },
      { key: 'guardian2_email', label: 'E-mail' },
      { key: 'guardian2_address', label: 'Endereço' },
    ],
  },
  {
    id: 'health',
    title: 'Saúde e Comportamento',
    fields: [
      { key: 'allergies', label: 'Alergias' },
      { key: 'blood_type', label: 'Tipo sanguíneo' },
      { key: 'medical_reports', label: 'Laudos médicos' },
      { key: 'medications', label: 'Medicamentos' },
      { key: 'behavior_notes', label: 'Observações de comportamento' },
    ],
  },
  {
    id: 'pedagogical',
    title: 'Pedagógico',
    fields: [
      { key: 'difficulty_subjects', label: 'Disciplinas com dificuldade' },
      { key: 'difficulty_reaction', label: 'Reação à dificuldade' },
      { key: 'previous_tutoring', label: 'Reforço anterior' },
    ],
  },
]

const requiredFieldKeys = fieldSections
  .flatMap((section) => section.fields)
  .filter((field) => field.required)
  .map((field) => field.key)

// --- FUNÇÕES UTILITÁRIAS (Mantidas) ---
function normalizeHeader(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}
function normalizeText(value: any) { return String(value ?? '').trim() }
function toTitleCaseName(value: string) {
  if (!value) return ''
  const lowerWords = new Set(['de', 'da', 'do', 'dos', 'das', 'e'])
  return value.split(/\s+/g).map((word, index) => {
    const lower = word.toLowerCase()
    return (index > 0 && lowerWords.has(lower)) ? lower : lower.charAt(0).toUpperCase() + lower.slice(1)
  }).join(' ')
}
function onlyDigits(value: string) { return value.replace(/\D/g, '') }
function normalizeDateString(value: any) {
  if (!value) return ''
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  const text = normalizeText(value)
  if (!text) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/)
  if (match) {
    const day = match[1].padStart(2, '0'); const month = match[2].padStart(2, '0'); const year = match[3].length === 2 ? `20${match[3]}` : match[3]
    return `${year}-${month}-${day}`
  }
  const parsed = new Date(text)
  return !Number.isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : ''
}
function parseBoolean(value: any) {
  const text = normalizeText(value)
  if (!text) return null
  const normalized = normalizeHeader(text)
  if (['sim', 's', 'true', '1', 'yes', 'y'].includes(normalized)) return true
  if (['nao', 'n', 'false', '0', 'no'].includes(normalized)) return false
  return null
}
function parseList(value: any) {
  const text = normalizeText(value)
  if (!text) return []
  return text.split(/[,;|]/g).map((item) => item.trim()).filter(Boolean)
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white/70 shadow-sm shadow-black/5 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {description ? <p className="text-xs text-slate-500 mt-1">{description}</p> : null}
          </div>
        </div>
      </div>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </div>
  )
}

export default function ImportStudentsModal({
  open,
  onOpenChange,
  onImported,
  templateHref = '/templates/Modelo_Importacao_Alunos.xlsx',
}: Props) {
  const [importStep, setImportStep] = useState(1)
  const [activeTab, setActiveTab] = useState('data')
  const [uploading, setUploading] = useState(false)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<Partial<Record<FieldKey, string>>>({})
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{ success: number; error: number } | null>(null)
  const [importErrors, setImportErrors] = useState<ImportErrorDetail[]>([])

  const fieldLabelMap = useMemo(() => {
    const map = {} as Record<FieldKey, string>
    fieldSections.forEach((section) => {
      section.fields.forEach((field) => { map[field.key] = field.label })
    })
    return map
  }, [])

  const missingRequiredFields = useMemo(() => {
    return requiredFieldKeys.filter((key) => {
      const mapped = fieldMapping[key]
      return !mapped || mapped === IGNORE_VALUE
    })
  }, [fieldMapping])

  const resetImport = useCallback(() => {
    setImportStep(1)
    setActiveTab('data')
    setParsedData([])
    setHeaders([])
    setFieldMapping({})
    setImportResults(null)
    setImportErrors([])
    setUploading(false)
    setImporting(false)
  }, [])

  const close = useCallback((v: boolean) => {
    onOpenChange(v)
    if (!v) resetImport()
  }, [onOpenChange, resetImport])

  // --- LÓGICA DE EXTRAÇÃO DE VALORES ---
  const getFieldValue = useCallback((row: any, field: FieldKey) => {
    const header = fieldMapping[field]
    if (!header || header === IGNORE_VALUE) return ''
    return row?.[header]
  }, [fieldMapping])

  const getPreviewValue = useCallback((row: any, field: FieldKey) => {
    const value = getFieldValue(row, field)
    if (!value) return '-'
    if (field === 'birth_date') return normalizeDateString(value) || '-'
    return normalizeText(value) || '-'
  }, [getFieldValue])

  const getSampleValue = useCallback((field: FieldKey) => {
    if (!parsedData.length) return ''
    const header = fieldMapping[field]
    if (!header || header === IGNORE_VALUE) return ''
    const value = parsedData[0]?.[header]
    return normalizeText(value) || ''
  }, [fieldMapping, parsedData])

  const getMissingRequiredValues = useCallback((row: any) => {
    return requiredFieldKeys.filter((key) => {
      const rawValue = getFieldValue(row, key)
      if (key === 'birth_date') return !normalizeDateString(rawValue)
      if (key === 'cpf') return !onlyDigits(normalizeText(rawValue))
      return !normalizeText(rawValue)
    })
  }, [getFieldValue])

  const getRowLabel = useCallback((row: any, index: number) => {
    const name = normalizeText(getFieldValue(row, 'full_name'))
    if (name) return name
    const cpf = onlyDigits(normalizeText(getFieldValue(row, 'cpf')))
    if (cpf) return `CPF ${cpf}`
    return `Linha ${index + 2}`
  }, [getFieldValue])

  const normalizeCellValue = useCallback((value: any) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
    return value ?? ''
  }, [])

  // --- AUTO MAPPING ---
  const buildAutoMapping = useCallback((detectedHeaders: string[]) => {
    const normalizedHeaders = detectedHeaders.map((header) => ({
      raw: header,
      norm: normalizeHeader(header),
    }))
    const findBy = (aliases: string[]) => normalizedHeaders.find((h) => aliases.includes(h.norm))?.raw || ''
    const findByContains = (needle: string, excludes: string[] = []) => {
      const normalizedNeedle = normalizeHeader(needle)
      const normalizedExcludes = excludes.map(normalizeHeader)
      return normalizedHeaders.find((h) => {
        if (!h.norm.includes(normalizedNeedle)) return false
        return normalizedExcludes.every((ex) => !h.norm.includes(ex))
      })?.raw || ''
    }

    return {
      full_name: findBy(['nome_completo']) || findByContains('nome', ['responsavel']),
      birth_date: findBy(['data_nascimento', 'nascimento']),
      grade: findBy(['serie', 'serie_ano', 'ano']),
      shift: findBy(['turno']),
      origin_school: findBy(['escola_origem', 'escola_de_origem']) || findBy(['escola']),
      cpf: findBy(['cpf_aluno', 'cpf']),
      address: findBy(['endereco_responsavel_1']) || findBy(['endereco_aluno', 'endereco']),
      guardian1_full_name: findBy(['nome_responsavel_1']),
      guardian1_cpf: findBy(['cpf_responsavel_1']),
      guardian1_relationship: findBy(['parentesco_responsavel_1']),
      guardian1_phone: findBy(['telefone_responsavel_1']),
      guardian1_email: findBy(['email_responsavel_1']),
      guardian1_address: findBy(['endereco_responsavel_1']),
      guardian2_full_name: findBy(['nome_responsavel_2']),
      guardian2_cpf: findBy(['cpf_responsavel_2']),
      guardian2_relationship: findBy(['parentesco_responsavel_2']),
      guardian2_phone: findBy(['telefone_responsavel_2']),
      guardian2_email: findBy(['email_responsavel_2']),
      guardian2_address: findBy(['endereco_responsavel_2']),
      allergies: findBy(['alergias']),
      blood_type: findBy(['tipo_sanguineo']),
      medical_reports: findBy(['laudos_medicos']),
      medications: findBy(['medicamentos']),
      behavior_notes: findBy(['observacoes_comportamento']),
      difficulty_subjects: findBy(['disciplinas_dificuldade']),
      difficulty_reaction: findBy(['reacao_dificuldade']),
      previous_tutoring: findBy(['reforco_anterior']),
    } satisfies Record<FieldKey, string>
  }, [])

  // --- PARSER ---
  const parseSpreadsheet = useCallback(async (file: File) => {
    const data = new Uint8Array(await file.arrayBuffer())
    const workbook = XLSX.read(data, { type: 'array', cellDates: true })
    const firstSheet = workbook.SheetNames[0]
    if (!firstSheet) throw new Error('Planilha vazia')
    const sheet = workbook.Sheets[firstSheet]
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })
    if (!rows.length) throw new Error('Planilha vazia')
    const [headerRow, ...bodyRows] = rows
    const detectedHeaders = headerRow.map((cell: any, index: number) => {
      const header = String(cell ?? '').trim()
      return header || `Coluna ${index + 1}`
    })
    const dataRows = bodyRows
      .filter((row: any[]) => row?.some((cell) => String(cell ?? '').trim() !== ''))
      .map((row: any[]) => {
        const entry: Record<string, any> = {}
        detectedHeaders.forEach((header, index) => entry[header] = normalizeCellValue(row?.[index]))
        return entry
      })
    if (!dataRows.length) throw new Error('Nenhum registro encontrado após o cabeçalho')
    return { detectedHeaders, dataRows }
  }, [normalizeCellValue])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return
    const validExtensions = ['csv', 'xlsx', 'xls']
    const extension = uploadedFile.name.split('.').pop()?.toLowerCase() || ''
    if (!validExtensions.includes(extension)) {
      toast.error('Formato inválido. Use CSV ou XLSX.')
      return
    }
    setUploading(true)
    try {
      const { detectedHeaders, dataRows } = await parseSpreadsheet(uploadedFile)
      setHeaders(detectedHeaders)
      setParsedData(dataRows)
      setFieldMapping(buildAutoMapping(detectedHeaders))
      setImportStep(2)
      toast.success(`${dataRows.length} registros encontrados!`)
    } catch {
      toast.error('Erro ao processar arquivo')
    } finally {
      setUploading(false)
    }
  }, [buildAutoMapping, parseSpreadsheet])

  // --- BUILD PAYLOAD ---
  const buildPayloadFromRow = useCallback((row: any): StudentPayload => {
    const full_name = toTitleCaseName(normalizeText(getFieldValue(row, 'full_name')))
    const birth_date = normalizeDateString(getFieldValue(row, 'birth_date'))
    const grade = normalizeText(getFieldValue(row, 'grade'))
    const shift = normalizeText(getFieldValue(row, 'shift'))
    const cpf = onlyDigits(normalizeText(getFieldValue(row, 'cpf')))
    const addressFromStudent = normalizeText(getFieldValue(row, 'address'))
    const addressFromGuardian = normalizeText(getFieldValue(row, 'guardian1_address'))
    const address = addressFromStudent || addressFromGuardian
    const origin_school = normalizeText(getFieldValue(row, 'origin_school'))
    const allergies = normalizeText(getFieldValue(row, 'allergies'))
    const blood_type = normalizeText(getFieldValue(row, 'blood_type'))
    const medical_reports = normalizeText(getFieldValue(row, 'medical_reports'))
    const medications = normalizeText(getFieldValue(row, 'medications'))
    const behavior_notes = normalizeText(getFieldValue(row, 'behavior_notes'))
    const difficulty_subjects = parseList(getFieldValue(row, 'difficulty_subjects'))
    const difficulty_reaction = normalizeText(getFieldValue(row, 'difficulty_reaction'))
    const previous_tutoring = parseBoolean(getFieldValue(row, 'previous_tutoring'))

    const buildGuardian = (prefix: 'guardian1' | 'guardian2', isPrimary: boolean): GuardianPayload | null => {
      const full = normalizeText(getFieldValue(row, `${prefix}_full_name` as FieldKey))
      const cpfValue = onlyDigits(normalizeText(getFieldValue(row, `${prefix}_cpf` as FieldKey)))
      const phoneValue = onlyDigits(normalizeText(getFieldValue(row, `${prefix}_phone` as FieldKey)))
      if (!full || !cpfValue || !phoneValue) return null
      const relationship = normalizeText(getFieldValue(row, `${prefix}_relationship` as FieldKey)) || 'Responsável'
      const email = normalizeText(getFieldValue(row, `${prefix}_email` as FieldKey))
      const addressValue = normalizeText(getFieldValue(row, `${prefix}_address` as FieldKey))
      return { is_primary: isPrimary, full_name: full, cpf: cpfValue, relationship, phone: phoneValue, email: email || undefined, address: addressValue || undefined }
    }
    const guardians = [buildGuardian('guardian1', true), buildGuardian('guardian2', false)].filter(Boolean) as GuardianPayload[]

    const payload: StudentPayload = {
      full_name, birth_date, grade, shift, cpf, address,
      status: 'Ativo', performance_indicator: 'Não avaliado',
      difficulty_subjects, difficulty_reaction: difficulty_reaction || undefined, previous_tutoring,
    }
    if (origin_school) payload.origin_school = origin_school
    if (allergies) payload.allergies = allergies
    if (blood_type) payload.blood_type = blood_type
    if (medical_reports) payload.medical_reports = medical_reports
    if (medications) payload.medications = medications
    if (behavior_notes) payload.behavior_notes = behavior_notes
    if (guardians.length) payload.guardians = guardians
    return payload
  }, [getFieldValue])

  const handleImport = useCallback(async () => {
    if (missingRequiredFields.length > 0) {
      toast.error('Mapeie todos os campos obrigatórios antes de importar.')
      return
    }
    setImporting(true)
    let successCount = 0
    let errorCount = 0
    const createdStudents: StudentResponse[] = []
    const errorDetails: ImportErrorDetail[] = []

    try {
      for (const [index, row] of parsedData.entries()) {
        const missingValues = getMissingRequiredValues(row)
        if (missingValues.length > 0) {
          errorCount++
          const label = getRowLabel(row, index)
          const missingLabels = missingValues.map((key) => fieldLabelMap[key]).join(', ')
          errorDetails.push({ index, label, reason: `Campos obrigatórios ausentes: ${missingLabels}` })
          continue
        }
        const payload = buildPayloadFromRow(row)
        try {
          const created = await StudentsService.create(payload)
          createdStudents.push(created)
          successCount++
        } catch (error: any) {
          errorCount++
          const label = getRowLabel(row, index)
          const reason = error?.response?.data?.message || error?.message || 'Erro ao criar aluno'
          errorDetails.push({ index, label, reason })
        }
      }
      setImportResults({ success: successCount, error: errorCount })
      setImportErrors(errorDetails)
      setImportStep(3)
      if (createdStudents.length) onImported(createdStudents)
    } finally {
      setImporting(false)
    }
  }, [buildPayloadFromRow, fieldLabelMap, getMissingRequiredValues, getRowLabel, missingRequiredFields.length, onImported, parsedData])

  // --- RENDERIZADORES ---
  const renderMappingField = useCallback((field: FieldConfig) => {
    const sample = getSampleValue(field.key)
    return (
      <div key={field.key} className="space-y-2">
        <Label className="text-sm font-medium">
          {field.label}
          {field.required ? <span className="text-destructive"> *</span> : null}
        </Label>
        <Select
          value={fieldMapping[field.key] || ''}
          onValueChange={(value) => setFieldMapping((prev) => ({ ...prev, [field.key]: value }))}
        >
          <SelectTrigger className="h-11 w-full bg-white">
            <SelectValue placeholder="Selecione a coluna..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={IGNORE_VALUE}>Ignorar campo</SelectItem>
            {headers.map((header) => (
              <SelectItem key={header} value={header}>{header}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 truncate h-4">
          {sample ? `Ex.: ${sample}` : 'Sem dados de exemplo'}
        </p>
      </div>
    )
  }, [fieldMapping, getSampleValue, headers])

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className={cn(
        "p-0 overflow-hidden flex flex-col",
        // Mesmas classes de largura da modal NewStudentModal
        "max-w-[96vw] sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl",
        importStep === 2 ? "h-[90vh]" : "max-h-[90vh]" // Altura fixa no passo 2 para scroll
      )}>
        <DialogHeader className="p-0 shrink-0">
          <div className="relative">
            <div className="w-full bg-linear-to-r from-indigo-500/15 via-purple-500/10 to-indigo-500/15 " />
            <div className="absolute inset-0 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50" />
            <div className="relative px-6 py-5 flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg sm:text-xl text-slate-900 font-bold">Importar Alunos</DialogTitle>
                <p className="text-xs text-slate-500 mt-1">
                  {importStep === 1 && "Envie sua planilha para começar."}
                  {importStep === 2 && "Verifique o mapeamento das colunas."}
                  {importStep === 3 && "Resultado da importação."}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* STEP 1: UPLOAD (Layout simples centralizado) */}
        {importStep === 1 && (
          <div className="p-8 flex flex-col items-center justify-center space-y-8">
             <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-slate-800">Passo 1: Enviar Arquivo</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                   Baixe o modelo padrão, preencha com os dados dos alunos e envie abaixo.
                   O sistema tentará identificar as colunas automaticamente.
                </p>
             </div>

            <Button asChild variant="outline" className="rounded-xl border-dashed">
              <a href={templateHref} download>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Baixar Planilha Modelo
              </a>
            </Button>

            <label className={cn(
              'flex flex-col items-center justify-center w-full max-w-xl h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all bg-slate-50',
              uploading ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'
            )}>
              {uploading ? (
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              ) : (
                <>
                  <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                     <Upload className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="font-medium text-slate-900">Clique para enviar CSV ou XLSX</span>
                  <span className="text-xs text-slate-500 mt-1">(.csv, .xlsx, .xls)</span>
                </>
              )}
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
        )}

        {/* STEP 2: MAPEAMENTO (Layout Grid Sidebar + Content) */}
        {importStep === 2 && (
           <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] flex-1 min-h-0">
              
              {/* Sidebar de Navegação */}
              <aside className="border-b lg:border-b-0 lg:border-r bg-slate-50/70 min-h-0 overflow-y-auto">
                <div className="p-4 lg:p-5">
                  <TabsList className="w-full bg-transparent p-0 h-auto grid grid-cols-4 gap-2 lg:grid-cols-1">
                    <TabsTrigger value="data" className="w-full justify-start gap-2 rounded-xl h-11 lg:h-12 px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200">
                      <User className="w-4 h-4" /> <span className="hidden sm:inline">Dados</span>
                    </TabsTrigger>
                    <TabsTrigger value="guardians" className="w-full justify-start gap-2 rounded-xl h-11 lg:h-12 px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200">
                      <Users className="w-4 h-4" /> <span className="hidden sm:inline">Pais</span>
                    </TabsTrigger>
                    <TabsTrigger value="health" className="w-full justify-start gap-2 rounded-xl h-11 lg:h-12 px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200">
                      <Heart className="w-4 h-4" /> <span className="hidden sm:inline">Saúde</span>
                    </TabsTrigger>
                    <TabsTrigger value="pedagogical" className="w-full justify-start gap-2 rounded-xl h-11 lg:h-12 px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200">
                      <BookOpen className="w-4 h-4" /> <span className="hidden sm:inline">Escola</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {missingRequiredFields.length > 0 && (
                     <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Atenção!</p>
                        <p className="text-[11px] text-amber-700 leading-tight">
                           Faltam mapear campos obrigatórios (marcados com *). Verifique a aba "Dados".
                        </p>
                     </div>
                  )}
                </div>
              </aside>

              {/* Área de Conteúdo Scrollável */}
              <section className="relative min-h-0 flex flex-col bg-slate-50/30">
                <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5">
                  
                  {/* Aba DADOS */}
                  <TabsContent value="data" className="mt-0 space-y-6">
                    {fieldSections.filter(s => s.id === 'data').map((section) => (
                      <SectionCard key={section.title} title={section.title} description={section.description}>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {section.fields.map(renderMappingField)}
                        </div>
                      </SectionCard>
                    ))}
                    
                    {/* Preview Table dentro da primeira aba */}
                    <div className="pt-4">
                       <h4 className="text-sm font-semibold text-slate-800 mb-3 px-1">Prévia dos dados ({parsedData.length} linhas)</h4>
                       <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                        <Table>
                           <TableHeader>
                              <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>CPF</TableHead>
                              <TableHead>Série</TableHead>
                              <TableHead>Mãe/Pai</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {parsedData.slice(0, 3).map((row, i) => (
                              <TableRow key={i}>
                                 <TableCell>{getPreviewValue(row, 'full_name')}</TableCell>
                                 <TableCell>{getPreviewValue(row, 'cpf')}</TableCell>
                                 <TableCell>{getPreviewValue(row, 'grade')}</TableCell>
                                 <TableCell>{getPreviewValue(row, 'guardian1_full_name')}</TableCell>
                              </TableRow>
                              ))}
                           </TableBody>
                        </Table>
                       </div>
                    </div>
                  </TabsContent>

                  {/* Aba RESPONSÁVEIS */}
                  <TabsContent value="guardians" className="mt-0 space-y-6">
                    {fieldSections.filter(s => s.id === 'guardians').map((section) => (
                      <SectionCard key={section.title} title={section.title} description={section.description}>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {section.fields.map(renderMappingField)}
                        </div>
                      </SectionCard>
                    ))}
                  </TabsContent>

                  {/* Aba SAÚDE */}
                  <TabsContent value="health" className="mt-0 space-y-6">
                     {fieldSections.filter(s => s.id === 'health').map((section) => (
                      <SectionCard key={section.title} title={section.title} description={section.description}>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {section.fields.map(renderMappingField)}
                        </div>
                      </SectionCard>
                    ))}
                  </TabsContent>

                  {/* Aba PEDAGÓGICO */}
                  <TabsContent value="pedagogical" className="mt-0 space-y-6">
                     {fieldSections.filter(s => s.id === 'pedagogical').map((section) => (
                      <SectionCard key={section.title} title={section.title} description={section.description}>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {section.fields.map(renderMappingField)}
                        </div>
                      </SectionCard>
                    ))}
                  </TabsContent>

                </div>

                {/* Footer Fixo */}
                <DialogFooter className="shrink-0 border-t bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 px-6 py-4">
                  <Button variant="outline" onClick={() => setImportStep(1)} className="rounded-xl mr-auto">
                    <ArrowLeft className="w-4 h-4 mr-2"/> Voltar
                  </Button>
                  
                  <div className="flex gap-2">
                     <Button variant="ghost" onClick={() => close(false)} className="rounded-xl">
                        Cancelar
                     </Button>
                     <Button
                        onClick={handleImport}
                        disabled={importing || missingRequiredFields.length > 0}
                        className="rounded-xl bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] text-white shadow-md shadow-indigo-200"
                     >
                        {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Importar {parsedData.length} Alunos
                     </Button>
                  </div>
                </DialogFooter>
              </section>
            </div>
           </Tabs>
        )}

        {/* STEP 3: RESULTS (Layout Centralizado) */}
        {importStep === 3 && importResults && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
               <Check className="w-10 h-10" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Importação Concluída!</h3>
            <p className="text-slate-500 mb-8">O processamento do arquivo foi finalizado.</p>

            <div className="flex justify-center gap-6 w-full max-w-lg mb-8">
              <div className="flex-1 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-3xl font-bold text-emerald-600">{importResults.success}</p>
                <p className="text-sm font-medium text-emerald-800">Alunos criados</p>
              </div>

              {importResults.error > 0 && (
                <div className="flex-1 p-4 rounded-2xl bg-rose-50 border border-rose-100">
                  <p className="text-3xl font-bold text-rose-600">{importResults.error}</p>
                  <p className="text-sm font-medium text-rose-800">Erros</p>
                </div>
              )}
            </div>

            {importResults.error > 0 && importErrors.length > 0 && (
              <div className="w-full max-w-2xl mt-4 text-left flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="rounded-t-xl border bg-rose-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-rose-900">Detalhes dos erros</p>
                </div>
                <div className="border border-t-0 rounded-b-xl bg-white overflow-y-auto max-h-48 p-2 space-y-2">
                  {importErrors.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-sm">
                      <span className="font-semibold text-slate-700 block">{item.label}</span>
                      <span className="text-slate-500">{item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => close(false)} className="mt-8 rounded-xl px-8 w-full max-w-xs">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}