'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Check, FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type StudentImported = {
  id: string
  full_name: string
  birth_date?: string
  grade?: string
  shift?: string
  origin_school?: string
  status: 'Ativo' | 'Inativo'
  performance_indicator: string
  difficulty_subjects: string[]
  created_at?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void

  // quando terminar de importar, você recebe a lista pronta
  onImported: (students: StudentImported[]) => void

  // link do modelo (coloque o xlsx em /public/templates)
  templateHref?: string
}

function safeId() {
  // @ts-ignore
  return (globalThis?.crypto?.randomUUID?.() as string) ?? Math.random().toString(36).slice(2, 11)
}

export default function ImportStudentsModal({
  open,
  onOpenChange,
  onImported,
  templateHref = '/templates/Modelo_Importacao_Alunos.xlsx',
}: Props) {
  const [importStep, setImportStep] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{ success: number; error: number } | null>(null)

  const fieldOptions = useMemo(
    () => [
      { value: 'full_name', label: 'Nome Completo' },
      { value: 'birth_date', label: 'Data de Nascimento' },
      { value: 'grade', label: 'Série' },
      { value: 'shift', label: 'Turno' },
      { value: 'origin_school', label: 'Escola de Origem' },

      // você pode expandir depois pra guardians, saúde etc
      { value: 'ignore', label: 'Ignorar Coluna' },
    ],
    []
  )

  const resetImport = useCallback(() => {
    setImportStep(1)
    setParsedData([])
    setHeaders([])
    setColumnMapping({})
    setImportResults(null)
    setUploading(false)
    setImporting(false)
  }, [])

  const close = useCallback(
    (v: boolean) => {
      onOpenChange(v)
      if (!v) resetImport()
    },
    [onOpenChange, resetImport]
  )

  const getMappedValue = useCallback(
    (row: any, field: string) => {
      const header = Object.entries(columnMapping).find(([, f]) => f === field)?.[0]
      return header ? row[header] : '-'
    },
    [columnMapping]
  )

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
      // ✅ aqui você pode trocar depois por parse real (papaparse/xlsx)
      // por enquanto mantém o MOCK:
      await new Promise((resolve) => setTimeout(resolve, 900))

      const mockData = [
        { 'Nome Completo': 'João Silva', 'Data Nascimento': '2015-01-01', 'Série': '4º Ano', 'Turno': 'Manhã', 'Escola': 'Municipal A' },
        { 'Nome Completo': 'Maria Oliveira', 'Data Nascimento': '2014-06-15', 'Série': '5º Ano', 'Turno': 'Tarde', 'Escola': 'Municipal B' },
      ]

      const detectedHeaders = Object.keys(mockData[0])
      setHeaders(detectedHeaders)
      setParsedData(mockData)

      const autoMapping: Record<string, string> = {}
      detectedHeaders.forEach((header) => {
        const lower = header.toLowerCase()
        if (lower.includes('nome') && !lower.includes('respons')) autoMapping[header] = 'full_name'
        else if (lower.includes('nasc')) autoMapping[header] = 'birth_date'
        else if (lower.includes('série') || lower.includes('serie')) autoMapping[header] = 'grade'
        else if (lower.includes('turno')) autoMapping[header] = 'shift'
        else if (lower.includes('escola')) autoMapping[header] = 'origin_school'
      })

      setColumnMapping(autoMapping)
      setImportStep(2)
      toast.success(`${mockData.length} registros encontrados!`)
    } catch {
      toast.error('Erro ao processar arquivo')
    } finally {
      setUploading(false)
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (!Object.values(columnMapping).includes('full_name')) {
      toast.error('Mapeie pelo menos a coluna "Nome Completo"')
      return
    }

    setImporting(true)

    let successCount = 0
    let errorCount = 0
    const newStudentsList: StudentImported[] = []

    try {
      await new Promise((resolve) => setTimeout(resolve, 900))

      for (const row of parsedData) {
        try {
          const student: any = {
            id: safeId(),
            status: 'Ativo',
            performance_indicator: 'Não avaliado',
            difficulty_subjects: [],
            created_at: new Date().toISOString(),
          }

          Object.entries(columnMapping).forEach(([header, field]) => {
            if (field === 'ignore') return
            student[field] = row[header]
          })

          newStudentsList.push(student)
          successCount++
        } catch {
          errorCount++
        }
      }

      setImportResults({ success: successCount, error: errorCount })
      setImportStep(3)

      // ✅ devolve pro pai
      onImported(newStudentsList)
    } finally {
      setImporting(false)
    }
  }, [columnMapping, parsedData, onImported])

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Alunos</DialogTitle>
        </DialogHeader>

        {/* STEP 1 */}
        {importStep === 1 && (
          <div className="py-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-600">
                  Baixe o modelo, preencha e envie o arquivo.
                </p>
              </div>

              <Button asChild variant="outline" className="rounded-xl">
                <a href={templateHref} download>
                  <Upload className="w-4 h-4 mr-2" />
                  Baixar modelo
                </a>
              </Button>
            </div>

            <label
              className={cn(
                'flex flex-col items-center justify-center h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-all',
                uploading ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'
              )}
            >
              {uploading ? (
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              ) : (
                <>
                  <FileSpreadsheet className="w-12 h-12 text-slate-400 mb-3" />
                  <span className="font-medium">Clique para enviar CSV/XLSX</span>
                  <span className="text-xs text-slate-500 mt-1">
                    (.csv, .xlsx, .xls)
                  </span>
                </>
              )}

              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        )}

        {/* STEP 2 */}
        {importStep === 2 && (
          <div className="py-6 space-y-6">
            <div>
              <h4 className="font-medium mb-4">Mapeamento de Colunas</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {headers.map((h) => (
                  <div key={h}>
                    <Label className="text-xs truncate block mb-1">{h}</Label>
                    <Select
                      value={columnMapping[h] || ''}
                      onValueChange={(v) => setColumnMapping({ ...columnMapping, [h]: v })}
                    >
                      <SelectTrigger className="h-10 text-sm rounded-xl">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Prévia ({parsedData.length} registros)</h4>
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Série</TableHead>
                      <TableHead>Turno</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 3).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{getMappedValue(row, 'full_name')}</TableCell>
                        <TableCell>{getMappedValue(row, 'grade')}</TableCell>
                        <TableCell>{getMappedValue(row, 'shift')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setImportStep(1)} className="rounded-xl">
                Voltar
              </Button>

              <Button
                onClick={handleImport}
                disabled={importing}
                className="rounded-xl bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] text-white"
              >
                {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Importar {parsedData.length} Alunos
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {importStep === 3 && importResults && (
          <div className="py-8 text-center">
            <Check className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold mb-4">Importação Concluída!</h3>

            <div className="flex justify-center gap-8">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{importResults.success}</p>
                <p className="text-slate-500">Sucesso</p>
              </div>

              {importResults.error > 0 && (
                <div>
                  <p className="text-3xl font-bold text-rose-600">{importResults.error}</p>
                  <p className="text-slate-500">Erros</p>
                </div>
              )}
            </div>

            <Button onClick={() => close(false)} className="mt-6 rounded-xl">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
