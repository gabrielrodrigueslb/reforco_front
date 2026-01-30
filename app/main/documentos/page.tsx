'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  FileText,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  FolderOpen,
  File,
  Image as ImageIcon,
  Loader2,
  Eye,
  FileEdit,
  Save,
  Sparkles,
  Search,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import PageTitle from '@/components/page-title'

/**
 * ✅ Mock-only (sem base44, sem react-query)
 * - Templates ficam em state (persistência só enquanto a aba está aberta)
 * - Uploads ficam em state (simula "documentos" que viriam da API)
 * - Upload de arquivo é "fake": cria ObjectURL (não é persistente)
 */

const uploadCategories = [
  'Pre-matricula',
  'Comprovante de matricula',
  'Declaracao',
  'Contrato',
  'Outro',
] as const

const categoryColors: Record<(typeof uploadCategories)[number], string> = {
  'Pre-matricula': 'bg-indigo-100 text-indigo-700',
  'Comprovante de matricula': 'bg-purple-100 text-purple-700',
  Declaracao: 'bg-emerald-100 text-emerald-700',
  Contrato: 'bg-amber-100 text-amber-700',
  Outro: 'bg-slate-100 text-slate-700',
}

// Templates predefinidos (HTML com placeholders)
const defaultTemplates: TemplateItem[] = [
  {
    id: 'template-1',
    name: 'Pre-matricula',
    category: 'Pre-matricula' as const,
    content: `<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <title>Pre-matricula</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Times New Roman", serif; color: #0f172a; background: #f8fafc; margin: 0; padding: 32px; }
      .page { max-width: 820px; margin: 0 auto; background: #fff; padding: 40px; border: 1px solid #e2e8f0; }
      .title { text-align: center; font-size: 22px; letter-spacing: 0.8px; margin-bottom: 20px; }
      .meta { font-size: 12px; color: #475569; display: flex; justify-content: space-between; margin-bottom: 24px; }
      .section { margin: 18px 0; }
      .section h3 { font-size: 14px; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 1px; }
      .row { display: grid; grid-template-columns: 180px 1fr; gap: 8px; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
      .label { font-size: 12px; color: #64748b; }
      .value { font-size: 14px; }
      .signature { margin-top: 40px; display: flex; justify-content: space-between; gap: 40px; }
      .signature div { text-align: center; flex: 1; border-top: 1px solid #94a3b8; padding-top: 8px; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="title">FICHA DE PRE-MATRICULA</div>
      <div class="meta">
        <span>Escola: {{escola}}</span>
        <span>Data de emissao: {{data_emissao}}</span>
      </div>

      <div class="section">
        <h3>Dados do Aluno</h3>
        <div class="row"><div class="label">Nome completo</div><div class="value">{{student_name}}</div></div>
        <div class="row"><div class="label">Data de nascimento</div><div class="value">{{student_birth}}</div></div>
        <div class="row"><div class="label">CPF</div><div class="value">{{student_cpf}}</div></div>
        <div class="row"><div class="label">RG</div><div class="value">{{student_rg}}</div></div>
        <div class="row"><div class="label">Serie/Ano</div><div class="value">{{serie}}</div></div>
        <div class="row"><div class="label">Turno</div><div class="value">{{turno}}</div></div>
        <div class="row"><div class="label">Ano letivo</div><div class="value">{{ano_letivo}}</div></div>
      </div>

      <div class="section">
        <h3>Responsavel</h3>
        <div class="row"><div class="label">Nome</div><div class="value">{{responsavel_nome}}</div></div>
        <div class="row"><div class="label">CPF</div><div class="value">{{responsavel_cpf}}</div></div>
        <div class="row"><div class="label">Telefone</div><div class="value">{{responsavel_tel}}</div></div>
      </div>

      <div class="signature">
        <div>Responsavel</div>
        <div>Secretaria</div>
      </div>
    </div>
  </body>
</html>`,
    isTemplate: true,
    file_url: '',
    file_type: 'html' as const,
  },
  {
    id: 'template-2',
    name: 'Comprovante de matricula',
    category: 'Comprovante de matricula' as const,
    content: `<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <title>Comprovante de Matricula</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Georgia", serif; color: #0f172a; background: #f1f5f9; margin: 0; padding: 32px; }
      .page { max-width: 820px; margin: 0 auto; background: #fff; padding: 36px; border: 1px solid #e2e8f0; }
      .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
      .badge { border: 1px solid #0f172a; padding: 6px 12px; font-size: 12px; letter-spacing: 1px; }
      .title { font-size: 20px; margin: 0; }
      .content { font-size: 14px; line-height: 1.7; }
      .highlight { font-weight: bold; }
      .footer { margin-top: 36px; display: flex; justify-content: space-between; font-size: 12px; }
      .line { border-top: 1px solid #94a3b8; padding-top: 6px; text-align: center; width: 45%; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div>
          <p class="title">Comprovante de Matricula</p>
          <p>{{escola}} - {{cidade}}</p>
        </div>
        <div class="badge">MAT. {{matricula_numero}}</div>
      </div>

      <div class="content">
        Declaramos que o(a) aluno(a) <span class="highlight">{{student_name}}</span>,
        CPF {{student_cpf}}, esta regularmente matriculado(a) no
        <span class="highlight">{{ano_letivo}}</span>, na turma <span class="highlight">{{turma}}</span>,
        serie <span class="highlight">{{serie}}</span>, turno <span class="highlight">{{turno}}</span>.
      </div>

      <div class="content" style="margin-top: 18px;">
        Documento emitido em {{data_emissao}} para fins de comprovacao.
      </div>

      <div class="footer">
        <div class="line">Secretaria</div>
        <div class="line">Direcao</div>
      </div>
    </div>
  </body>
</html>`,
    isTemplate: true,
    file_url: '',
    file_type: 'html' as const,
  },
  {
    id: 'template-3',
    name: 'Declaracao de matricula',
    category: 'Declaracao' as const,
    content: `<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <title>Declaracao de Matricula</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Times New Roman", serif; color: #0f172a; background: #f8fafc; margin: 0; padding: 32px; }
      .page { max-width: 820px; margin: 0 auto; background: #fff; padding: 40px; border: 1px solid #e2e8f0; }
      .title { text-align: center; font-size: 20px; letter-spacing: 0.6px; margin-bottom: 24px; }
      .content { font-size: 14px; line-height: 1.7; }
      .footer { margin-top: 36px; display: flex; justify-content: space-between; font-size: 12px; }
      .line { border-top: 1px solid #94a3b8; padding-top: 6px; text-align: center; width: 45%; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="title">Declaracao de Matricula</div>
      <div class="content">
        Declaramos que o(a) aluno(a) <strong>{{student_name}}</strong>, CPF {{student_cpf}},
        encontra-se regularmente matriculado(a) na escola <strong>{{escola}}</strong>,
        cursando o <strong>{{serie}}</strong> no turno <strong>{{turno}}</strong>,
        no ano letivo de <strong>{{ano_letivo}}</strong>.
      </div>

      <div class="content" style="margin-top: 16px;">
        Declaracao emitida em {{data_emissao}}, para fins de comprovacao.
      </div>

      <div class="footer">
        <div class="line">Secretaria</div>
        <div class="line">Direcao</div>
      </div>
    </div>
  </body>
</html>`,
    isTemplate: true,
    file_url: '',
    file_type: 'html' as const,
  },
]

type UploadCategory = (typeof uploadCategories)[number]

type TemplateItem = {
  id: string
  name: string
  category: UploadCategory | ''
  content: string
  isTemplate: true
  file_url?: string
  file_type: 'text' | 'pdf' | 'image' | 'html'
}

type DocumentItem = {
  id: string
  name: string
  category: UploadCategory
  file_url: string
  file_type: string // 'pdf' | 'jpg' | 'png' etc
  description?: string
  created_date: string // ISO
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function getFileIconByExt(fileType: string) {
  const ft = (fileType || '').toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ft)) return ImageIcon
  if (ft === 'pdf') return File
  return FileText
}

function templateTypeBadge(t: TemplateItem) {
  if (t.file_type === 'pdf') return 'PDF'
  if (t.file_type === 'image') return 'Imagem'
  if (t.file_type === 'html') return 'HTML'
  return 'Texto'
}

function renderTemplateContent(template: TemplateItem, data: Record<string, string>) {
  const base = template.content || ''
  return base.replace(/{{\s*([a-z0-9_]+)\s*}}/gi, (_match, key) => data[key] ?? '')
}

function slugifyFilename(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function Documents() {
  const [activeTab, setActiveTab] = useState<'templates' | 'uploads'>('templates')

  // Loading mocks
  const [loadingDocs, setLoadingDocs] = useState(true)

  // Uploads / Docs
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<'all' | UploadCategory>('all')
  const [searchDocs, setSearchDocs] = useState('')

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [deleteDoc, setDeleteDoc] = useState<DocumentItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [savingUpload, setSavingUpload] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: '' as UploadCategory | '',
    file_url: '',
    file_type: '',
    description: '',
  })

  // Templates
  const [templates, setTemplates] = useState<TemplateItem[]>(defaultTemplates)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null)
  const [uploadingTemplate, setUploadingTemplate] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null)

  const [newTemplate, setNewTemplate] = useState<{
    name: string
    category: UploadCategory | ''
    content: string
    file_url: string
    file_type: 'text' | 'pdf' | 'image' | 'html'
  }>({
    name: '',
    category: '',
    content: '',
    file_url: '',
    file_type: 'html',
  })

  const templateData = useMemo(
    () => ({
      escola: 'Colegio Exemplo',
      endereco_escola: 'Rua Exemplo, 123',
      cidade: 'Sao Paulo - SP',
      student_name: 'Joao da Silva',
      student_cpf: '000.000.000-00',
      student_rg: '00.000.000-0',
      student_birth: '01/01/2010',
      serie: '5o Ano',
      turma: '5A',
      turno: 'Manha',
      ano_letivo: '2026',
      matricula_numero: 'MAT-2026-0001',
      responsavel_nome: 'Maria da Silva',
      responsavel_cpf: '000.000.000-00',
      responsavel_tel: '(11) 90000-0000',
      data_emissao: format(new Date(), 'dd/MM/yyyy'),
    }),
    []
  )

  // Load mock documents (simulate API)
  useEffect(() => {
    ;(async () => {
      setLoadingDocs(true)
      try {
        await sleep(500)

        // mock initial uploads
        const now = new Date()
        const seed: DocumentItem[] = [
          {
            id: 'doc-1',
            name: 'Contrato - Exemplo',
            category: 'Contrato',
            file_url: 'https://example.com/contrato.pdf',
            file_type: 'pdf',
            description: 'Modelo de contrato padrão (mock).',
            created_date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          },
          {
            id: 'doc-2',
            name: 'Declaracao - Modelo',
            category: 'Declaracao',
            file_url: 'https://example.com/declaracao.pdf',
            file_type: 'pdf',
            description: 'Modelo de declaracao (mock).',
            created_date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          },
        ]
        setDocuments(seed)
      } catch (err) {
        console.error(err)
        toast.error('Erro ao carregar documentos')
      } finally {
        setLoadingDocs(false)
      }
    })()
  }, [])

  const resetUploadForm = () => {
    setUploadForm({
      name: '',
      category: '',
      file_url: '',
      file_type: '',
      description: '',
    })
  }

  // Fake upload: gera object URL
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await sleep(650)

      const ext = (file.name.split('.').pop() || '').toLowerCase()
      const url = URL.createObjectURL(file)

      setUploadForm((prev) => ({
        ...prev,
        file_url: url,
        file_type: ext,
        name: prev.name || file.name.replace(new RegExp(`\\.${ext}$`), ''),
      }))

      toast.success('Arquivo pronto (mock).')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao preparar arquivo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleUploadSubmit = async () => {
    if (!uploadForm.name || !uploadForm.category || !uploadForm.file_url) {
      toast.error('Preencha nome, categoria e arquivo')
      return
    }

    setSavingUpload(true)
    try {
      await sleep(450)

      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        name: uploadForm.name.trim(),
        category: uploadForm.category as UploadCategory,
        file_url: uploadForm.file_url,
        file_type: uploadForm.file_type || 'file',
        description: uploadForm.description?.trim() || '',
        created_date: new Date().toISOString(),
      }

      setDocuments((prev) => [newDoc, ...prev])
      toast.success('Documento adicionado!')

      setShowUploadModal(false)
      resetUploadForm()
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível salvar documento')
    } finally {
      setSavingUpload(false)
    }
  }

  const confirmDeleteDoc = async () => {
    if (!deleteDoc) return
    try {
      await sleep(250)
      setDocuments((prev) => prev.filter((d) => d.id !== deleteDoc.id))
      toast.success('Documento excluído!')
      setDeleteDoc(null)
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível excluir')
    }
  }

  // Template: upload fake (só gera objectURL e seta tipo)
  const handleTemplateFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      toast.error('Apenas PDF ou imagens são permitidos')
      return
    }

    setUploadingTemplate(true)
    try {
      await sleep(650)

      const url = URL.createObjectURL(file)
      const fileType = file.type.includes('pdf') ? 'pdf' : 'image'

      setNewTemplate((prev) => ({
        ...prev,
        file_url: url,
        file_type: fileType,
        name: prev.name || file.name.split('.')[0],
        content: '', // se subir arquivo, conteúdo texto pode ficar vazio
      }))

      toast.success('Template pronto (mock).')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao preparar arquivo do template')
    } finally {
      setUploadingTemplate(false)
      e.target.value = ''
    }
  }

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || (!newTemplate.content && !newTemplate.file_url)) {
      toast.error('Preencha nome e conteúdo/arquivo do template')
      return
    }

    setSavingTemplate(true)
    try {
      await sleep(350)

      if (editingTemplate) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === editingTemplate.id
              ? ({
                  ...t,
                  name: newTemplate.name.trim(),
                  category: newTemplate.category,
                  content: newTemplate.content,
                  file_url: newTemplate.file_url,
                  file_type: newTemplate.file_type,
                  isTemplate: true,
                } as TemplateItem)
              : t
          )
        )
        toast.success('Template atualizado!')
      } else {
        const t: TemplateItem = {
          id: `template-${Date.now()}`,
          name: newTemplate.name.trim(),
          category: newTemplate.category,
          content: newTemplate.content,
          file_url: newTemplate.file_url,
          file_type: newTemplate.file_type,
          isTemplate: true,
        }
        setTemplates((prev) => [t, ...prev])
        toast.success('Template criado!')
      }

      setShowTemplateModal(false)
      setEditingTemplate(null)
      setNewTemplate({ name: '', category: '', content: '', file_url: '', file_type: 'html' })
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível salvar template')
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleEditTemplate = (template: TemplateItem) => {
    setEditingTemplate(template)
    setNewTemplate({
      name: template.name,
      category: template.category,
      content: template.content,
      file_url: template.file_url || '',
      file_type: template.file_type || 'text',
    })
    setShowTemplateModal(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await sleep(180)
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))
      toast.success('Template excluído!')
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível excluir template')
    }
  }

  const openTemplatePreview = (template: TemplateItem) => {
    setPreviewTemplate(template)
  }

  const downloadHtmlTemplate = (template: TemplateItem) => {
    const rendered = renderTemplateContent(template, templateData)
    const blob = new Blob([rendered], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${slugifyFilename(template.name) || 'documento'}.html`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  // Download/open template
  const handleDownloadTemplate = (template: TemplateItem) => {
    if (template.file_url) {
      window.open(template.file_url, '_blank', 'noopener,noreferrer')
      return
    }

    if (template.file_type === 'html') {
      downloadHtmlTemplate(template)
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Pop-up bloqueado pelo navegador.')
      return
    }

    const safe = (template.content || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')

    printWindow.document.write(`
      <html>
        <head>
          <title>${template.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #111827; }
            pre { white-space: pre-wrap; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <h2 style="margin:0 0 16px 0;">${template.name}</h2>
          <pre>${safe}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const previewHtml = useMemo(() => {
    if (!previewTemplate || previewTemplate.file_url) return ''
    if (previewTemplate.file_type !== 'html') return ''
    return renderTemplateContent(previewTemplate, templateData)
  }, [previewTemplate, templateData])

  const filteredDocs = useMemo(() => {
    const byCat =
      selectedCategory === 'all'
        ? documents
        : documents.filter((d) => d.category === selectedCategory)

    const q = searchDocs.trim().toLowerCase()
    if (!q) return byCat

    return byCat.filter((d) => {
      return (
        d.name.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      )
    })
  }, [documents, selectedCategory, searchDocs])

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl border bg-white">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-purple-500/10 blur-2xl" />

        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] flex items-center justify-center shadow-lg shadow-indigo-200">
              <FileText className="w-7 h-7 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-700">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium">Central de Documentos</span>
              </div>
              <PageTitle
                title="Documentos"
                className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1"
              />
              <p className="text-slate-500 mt-1">
                Templates e arquivos da escola — tudo organizado em um só lugar.
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <Badge className="bg-indigo-100 text-indigo-700">
                  Templates: {templates.length}
                </Badge>
                <Badge className="bg-slate-100 text-slate-700">
                  Uploads: {documents.length}
                </Badge>
              </div>
            </div>
          </div>

          <div className="w-full md:w-105 rounded-2xl border bg-white/60 p-4">
            <p className="text-sm font-medium text-slate-800">Ações rápidas</p>
            <p className="text-xs text-slate-500 mt-1">
              Crie templates ou faça uploads (mock por enquanto).
            </p>

            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => {
                  setActiveTab('templates')
                  setEditingTemplate(null)
                  setNewTemplate({ name: '', category: '', content: '', file_url: '', file_type: 'html' })
                  setShowTemplateModal(true)
                }}
                className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] h-11 rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Template
              </Button>

              <Button
                onClick={() => {
                  setActiveTab('uploads')
                  resetUploadForm()
                  setShowUploadModal(true)
                }}
                className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] h-11 rounded-xl"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Arquivo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v === 'uploads' ? 'uploads' : 'templates')}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="bg-white border border-slate-100 p-1">
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700"
            >
              <FileEdit className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>

            <TabsTrigger
              value="uploads"
              className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Uploads ({documents.length})
            </TabsTrigger>
          </TabsList>

          {activeTab === 'templates' ? (
            <Button
              onClick={() => {
                setEditingTemplate(null)
                setNewTemplate({ name: '', category: '', content: '', file_url: '', file_type: 'html' })
                setShowTemplateModal(true)
              }}
              className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] h-11 px-6 rounded-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Template
            </Button>
          ) : (
            <Button
              onClick={() => {
                resetUploadForm()
                setShowUploadModal(true)
              }}
              className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] h-11 px-6 rounded-xl"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Arquivo
            </Button>
          )}
        </div>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6 space-y-4">
          {templates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <FileEdit className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhum template</h3>
              <p className="text-slate-500 mb-6">Crie seu primeiro template de documento</p>
              <Button onClick={() => setShowTemplateModal(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Criar Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-50 border flex items-center justify-center">
                      {template.file_type === 'pdf' ? (
                        <File className="w-6 h-6 text-rose-500" />
                      ) : template.file_type === 'image' ? (
                        <ImageIcon className="w-6 h-6 text-blue-500" />
                      ) : (
                        <FileText className="w-6 h-6 text-indigo-500" />
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="p-2 hover:bg-slate-100 rounded-lg"
                          aria-label="Ações do template"
                        >
                          <FileEdit className="w-4 h-4 text-slate-400" />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => openTemplatePreview(template)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleDownloadTemplate(template)}>
                          <Download className="w-4 h-4 mr-2" />
                          {template.file_url
                            ? 'Abrir/baixar'
                            : template.file_type === 'html'
                              ? 'Baixar HTML'
                              : 'Imprimir'}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-rose-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">{template.name}</h3>

                  <div className="flex items-center flex-wrap gap-2 mb-3">
                    {template.category ? (
                      <Badge className={cn(categoryColors[template.category as UploadCategory])}>
                        {template.category}
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-700">Sem categoria</Badge>
                    )}

                    <Badge className="bg-slate-100 text-slate-700">
                      {templateTypeBadge(template)}
                    </Badge>
                  </div>

                  {template.content && !template.file_url && (
                    <p className="text-sm text-slate-500 line-clamp-3">
                      {template.file_type === 'html'
                        ? 'Documento HTML com placeholders.'
                        : `${template.content.substring(0, 120)}...`}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => openTemplatePreview(template)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                    <Button
                      className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
                      onClick={() => handleDownloadTemplate(template)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {template.file_url
                        ? 'Abrir'
                        : template.file_type === 'html'
                          ? 'Baixar HTML'
                          : 'Imprimir'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Uploads Tab */}
        <TabsContent value="uploads" className="mt-6 space-y-4">
          {/* Filters + Search */}
          <div className="bg-white border rounded-2xl p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    'px-4 py-2 rounded-xl font-medium transition-all',
                    selectedCategory === 'all'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  Todos
                </button>

                {uploadCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-4 py-2 rounded-xl font-medium transition-all',
                      selectedCategory === cat
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-90">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchDocs}
                  onChange={(e) => setSearchDocs(e.target.value)}
                  placeholder="Buscar por nome, descrição ou categoria..."
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          {loadingDocs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <FolderOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhum documento</h3>
              <p className="text-slate-500 mb-6">Faça upload do primeiro arquivo</p>
              <Button
                onClick={() => {
                  resetUploadForm()
                  setShowUploadModal(true)
                }}
                className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Arquivo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocs.map((doc) => {
                const FileIcon = getFileIconByExt(doc.file_type)

                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                  >
                    <div className="h-32 bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center relative">
                      {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes((doc.file_type || '').toLowerCase()) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={doc.file_url} alt={doc.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileIcon className="w-12 h-12 text-slate-400" />
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white rounded-lg"
                          aria-label="Visualizar"
                        >
                          <Eye className="w-5 h-5 text-slate-700" />
                        </a>

                        <a
                          href={doc.file_url}
                          download
                          className="p-2 bg-white rounded-lg"
                          aria-label="Baixar"
                        >
                          <Download className="w-5 h-5 text-slate-700" />
                        </a>

                        <button
                          onClick={() => setDeleteDoc(doc)}
                          className="p-2 bg-white rounded-lg"
                          aria-label="Excluir"
                          type="button"
                        >
                          <Trash2 className="w-5 h-5 text-rose-500" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-medium text-slate-900 truncate mb-2">{doc.name}</h3>
                      <Badge className={categoryColors[doc.category]}>{doc.category}</Badge>

                      {doc.description ? (
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">{doc.description}</p>
                      ) : (
                        <p className="text-sm text-slate-400 mt-2 italic">Sem descrição</p>
                      )}

                      <p className="text-xs text-slate-400 mt-2">
                        {format(new Date(doc.created_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload de Documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Arquivo *</Label>
              <div className="mt-2">
                {uploadForm.file_url ? (
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <File className="w-8 h-8 text-emerald-600" />
                    <div className="flex-1">
                      <p className="font-medium text-emerald-700">Arquivo pronto</p>
                      <p className="text-sm text-emerald-600">
                        {uploadForm.file_type?.toUpperCase() || 'ARQUIVO'}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setUploadForm((prev) => ({ ...prev, file_url: '', file_type: '' }))
                      }
                      className="text-emerald-700 hover:text-emerald-900"
                      type="button"
                      aria-label="Remover arquivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500">Clique para selecionar um arquivo</span>
                        <span className="text-xs text-slate-400 mt-1">(mock: cria um link local)</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label>Nome *</Label>
              <Input
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                className="mt-2 h-11"
              />
            </div>

            <div>
              <Label>Categoria *</Label>
              <Select
                value={uploadForm.category}
                onValueChange={(v: UploadCategory) => setUploadForm({ ...uploadForm, category: v })}
              >
                <SelectTrigger className="mt-2 h-11">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {uploadCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)} disabled={savingUpload}>
              Cancelar
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={!uploadForm.file_url || !uploadForm.category || savingUpload}
              className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
            >
              {savingUpload ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome do Template *</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="mt-2 h-11"
                placeholder="Ex: Declaração de Matrícula"
              />
            </div>

            <div>
              <Label>Categoria</Label>
              <Select
                value={newTemplate.category}
                onValueChange={(v: UploadCategory) => setNewTemplate({ ...newTemplate, category: v })}
              >
                <SelectTrigger className="mt-2 h-11">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {uploadCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Template</Label>
              <div className="mt-2 p-4 bg-slate-50 rounded-xl border">
                <p className="text-sm text-slate-600 mb-3">
                  Voce pode escrever um template em HTML ou anexar um PDF/imagem (mock).
                </p>

                {newTemplate.file_url ? (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      {newTemplate.file_type === 'pdf' ? (
                        <File className="w-8 h-8 text-rose-500" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-blue-500" />
                      )}
                      <div>
                        <p className="font-medium text-slate-700">Arquivo pronto</p>
                        <p className="text-sm text-slate-500">
                          {newTemplate.file_type === 'pdf' ? 'PDF' : 'Imagem'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setNewTemplate((prev) => ({ ...prev, file_url: '', file_type: 'html' }))
                      }
                      className="text-slate-400 hover:text-rose-500"
                      type="button"
                      aria-label="Remover arquivo do template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    {uploadingTemplate ? (
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500">Upload PDF ou Imagem</span>
                        <span className="text-xs text-slate-400 mt-1">(Opcional)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={handleTemplateFileUpload}
                      disabled={uploadingTemplate}
                    />
                  </label>
                )}
              </div>
            </div>

            {!newTemplate.file_url && (
              <div>
                <Label>Conteudo HTML do Template *</Label>
                <Textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  className="mt-2 min-h-64 font-mono text-sm"
                  placeholder="Cole o HTML do template..."
                />
                <p className="text-xs text-slate-500 mt-2">
                  Placeholders: {'{{student_name}}'}, {'{{serie}}'}, {'{{turma}}'}, {'{{turno}}'}, {'{{ano_letivo}}'}, {'{{data_emissao}}'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateModal(false)} disabled={savingTemplate}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTemplate}
              className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
              disabled={savingTemplate}
            >
              {savingTemplate ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Visualizar template</DialogTitle>
          </DialogHeader>

          {previewTemplate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{previewTemplate.name}</p>
                  <p className="text-sm text-slate-500">
                    {previewTemplate.category ? previewTemplate.category : 'Sem categoria'} • {templateTypeBadge(previewTemplate)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEditTemplate(previewTemplate)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
                    onClick={() => handleDownloadTemplate(previewTemplate)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {previewTemplate.file_url
                      ? 'Abrir'
                      : previewTemplate.file_type === 'html'
                        ? 'Baixar HTML'
                        : 'Imprimir'}
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border bg-white overflow-hidden">
                {previewTemplate.file_url ? (
                  previewTemplate.file_type === 'pdf' ? (
                    <iframe
                      src={previewTemplate.file_url}
                      className="w-full h-[70vh]"
                      title={previewTemplate.name}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewTemplate.file_url}
                      alt={previewTemplate.name}
                      className="w-full max-h-[70vh] object-contain bg-slate-50"
                    />
                  )
                ) : previewTemplate.file_type === 'html' ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-[70vh]"
                    title={previewTemplate.name}
                  />
                ) : (
                  <div className="p-5">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                      {previewTemplate.content}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento <strong>{deleteDoc?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-500 hover:bg-rose-600" onClick={confirmDeleteDoc}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
