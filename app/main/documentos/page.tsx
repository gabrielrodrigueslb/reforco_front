'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Search,
  FolderOpen,
  Loader2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import PageTitle from '@/components/page-title'
import { SchoolDocumentsService, SchoolDocument } from '@/services/school-documents.service'

const documentTypes = [
  { value: 'BOLETIM', label: 'Boletim' },
  { value: 'LAUDO', label: 'Laudo' },
  { value: 'AUTORIZACAO', label: 'Autorização' },
  { value: 'DECLARACAO', label: 'Declaração' },
  { value: 'MATRICULA', label: 'Matrícula' },
  { value: 'HISTORICO_ESCOLAR', label: 'Histórico Escolar' },
  { value: 'OUTRO', label: 'Outro' },
]

const ITEMS_PER_PAGE = 16

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<SchoolDocument[]>([])
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  
  const [deleteDoc, setDeleteDoc] = useState<SchoolDocument | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [form, setForm] = useState({
    name: '',
    type: 'OUTRO',
    year: '',
    notes: '',
    file: null as File | null,
  })

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const data = await SchoolDocumentsService.list()
        setDocuments(data)
      } catch (err) {
        console.error(err)
        toast.error('Erro ao carregar documentos')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Filtra os documentos
  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return documents
    return documents.filter((doc) =>
      [doc.name, doc.type, doc.notes, String(doc.year || '')]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [documents, search])

  // Lógica de Paginação
  const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE)
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return filteredDocs.slice(start, end)
  }, [filteredDocs, currentPage])

  // Reseta a página para 1 se a busca mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const resetForm = () => {
    setForm({ name: '', type: 'OUTRO', year: '', notes: '', file: null })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setForm((prev) => ({
      ...prev,
      file,
      name: prev.name || file.name,
    }))
  }

  // --- DOWNLOAD FORÇADO ---
  const handleDownload = async (url: string, filename: string) => {
    try {
      setIsDownloading(true)
      toast.info('Iniciando download...')
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Falha ao baixar arquivo')
      
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(blobUrl)
      toast.success('Download concluído!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao baixar. Abrindo em nova guia.')
      window.open(url, '_blank')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleUpload = async () => {
    if (!form.file) {
      toast.error('Selecione um arquivo')
      return
    }

    setSaving(true)
    try {
      const created = await SchoolDocumentsService.upload({
        file: form.file,
        name: form.name || form.file.name,
        type: form.type,
        year: form.year,
        notes: form.notes,
      })
      setDocuments((prev) => [created, ...prev])
      setShowUploadModal(false)
      resetForm()
      toast.success('Documento anexado!')
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível anexar o documento')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDoc) return
    try {
      await SchoolDocumentsService.remove(deleteDoc.id)
      setDocuments((prev) => prev.filter((doc) => doc.id !== deleteDoc.id))
      toast.success('Documento excluído')
      setDeleteDoc(null)
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível excluir o documento')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <PageTitle
            title="Documentos"
            className="text-2xl lg:text-3xl font-bold text-slate-800"
          />
          <p className="text-slate-500 mt-1">
            {loading ? 'Carregando...' : `${documents.length} documentos encontrados`}
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm()
            setShowUploadModal(true)
          }}
          className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] text-white h-11 px-6 rounded-xl shadow-lg shadow-indigo-200"
        >
          <Upload className="w-5 h-5 mr-2" />
          Anexar documento
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, tipo ou ano..."
            className="h-11 pl-10 rounded-xl"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <FolderOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhum documento encontrado</h3>
          <p className="text-slate-500">Comece anexando o primeiro arquivo.</p>
        </div>
      ) : (
        <>
          {/* GRID DE CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedDocs.map((doc) => (
              <div
                key={doc.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-200"
              >
                {/* Cabeçalho do Card: Ícone + Menu */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <FileText className="h-5 w-5" />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400 hover:text-slate-600">
                        <MoreVertical className="w-4 h-4" />
                        <span className="sr-only">Ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={doc.url} target="_blank" rel="noreferrer" className="cursor-pointer">
                          <Eye className="w-4 h-4 mr-2 text-slate-500" />
                          Visualizar
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload(doc.url, doc.name)}
                        disabled={isDownloading}
                        className="cursor-pointer"
                      >
                        <Download className="w-4 h-4 mr-2 text-slate-500" />
                        Baixar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-rose-600 focus:text-rose-600 cursor-pointer"
                        onClick={() => setDeleteDoc(doc)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Conteúdo: Título + Data */}
                <div className="mb-3">
                  <h3 
                    className="font-semibold text-slate-800 text-sm truncate" 
                    title={doc.name}
                  >
                    {doc.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                     {doc.created_at ? format(new Date(doc.created_at), 'dd/MM/yyyy') : '-'}
                  </p>
                </div>

                {/* Rodapé do Card: Badges */}
                <div className="flex items-center gap-2 mt-auto">
                    <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-slate-100 text-slate-600 hover:bg-slate-200">
                       {doc.type}
                    </Badge>
                    {doc.year && (
                       <Badge variant="outline" className="text-[10px] h-5 px-2 border-indigo-100 text-indigo-600 bg-indigo-50">
                          {doc.year}
                       </Badge>
                    )}
                </div>
              </div>
            ))}
          </div>

          {/* CONTROLES DE PAGINAÇÃO */}
          {filteredDocs.length > ITEMS_PER_PAGE && (
             <div className="flex items-center justify-between py-4 border-t border-slate-100 mt-4">
                <p className="text-sm text-slate-500">
                   Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                   <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-xl h-9 px-3"
                   >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                   </Button>
                   <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-xl h-9 px-3"
                   >
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-1" />
                   </Button>
                </div>
             </div>
          )}
        </>
      )}

     {/* MODAL UPLOAD CORRIGIDA PARA MOBILE */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="p-0 w-full max-w-[95vw] sm:max-w-lg md:max-w-xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl">
          
          {/* Header (Fixo) */}
          <div className="relative shrink-0">
             <div className="w-full h-20 sm:h-24 bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10" />
             <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
             <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
             
             <div className="absolute inset-0 flex flex-col justify-center px-6">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white rounded-lg shadow-sm border border-indigo-100">
                      <Upload className="w-5 h-5 text-indigo-600" />
                   </div>
                   <div>
                      <DialogTitle className="text-lg sm:text-xl font-bold text-slate-800">Novo Documento</DialogTitle>
                      <p className="text-xs text-slate-500 font-medium">Preencha os dados e anexe o arquivo.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Corpo (Rolagem Automática) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Área de Upload Customizada */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Arquivo <span className="text-rose-500">*</span></Label>
              
              {!form.file ? (
                 <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all group active:scale-95">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                       <div className="p-3 mb-2 rounded-full bg-white shadow-xs border border-slate-100 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6 text-indigo-500" />
                       </div>
                       <p className="mb-1 text-sm text-slate-600 font-medium text-center"><span className="text-indigo-600">Toque para enviar</span></p>
                       <p className="text-[10px] text-slate-400 uppercase">PDF, Imagem ou DOCX</p>
                    </div>
                    <input 
                       ref={fileInputRef}
                       type="file" 
                       className="hidden" 
                       onChange={handleFileChange}
                       accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                 </label>
              ) : (
                 <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-indigo-100 shrink-0">
                          <FileText className="w-5 h-5 text-indigo-600" />
                       </div>
                       <div className="min-w-0">
                          <p className="text-sm font-semibold text-indigo-900 truncate max-w-[150px] sm:max-w-[200px]">{form.file.name}</p>
                          <p className="text-xs text-indigo-600/80">{(form.file.size / 1024 / 1024).toFixed(2)} MB</p>
                       </div>
                    </div>
                    <Button 
                       type="button"
                       variant="ghost" 
                       size="icon" 
                       className="text-indigo-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg shrink-0 h-9 w-9"
                       onClick={() => {
                          setForm(prev => ({ ...prev, file: null }))
                          if(fileInputRef.current) fileInputRef.current.value = ''
                       }}
                    >
                       <Trash2 className="w-5 h-5" />
                    </Button>
                 </div>
              )}
            </div>

            <div className="space-y-4">
               {/* Nome */}
               <div className="space-y-1.5">
                 <Label className="text-sm font-medium text-slate-700">Nome</Label>
                 <Input
                   value={form.name}
                   onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                   placeholder="Ex.: Boletim"
                   className="h-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                 />
               </div>

               {/* Grid Responsivo */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Tipo</Label>
                    <Select
                      value={form.type}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="h-14 rounded-xl border-slate-200 w-full py-5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((doc) => (
                          <SelectItem key={doc.value} value={doc.value}>
                            {doc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Ano<span className="text-slate-400 font-normal">(opcional)</span></Label>
                    <Input
                      type="number"
                      value={form.year}
                      onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                      placeholder={new Date().getFullYear().toString()}
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>
               </div>

               {/* Observação */}
               <div className="space-y-1.5">
                 <Label className="text-sm font-medium text-slate-700">Observação</Label>
                 <Textarea
                   value={form.notes}
                   onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                   className="min-h-[80px] rounded-xl border-slate-200 resize-none"
                   placeholder="Detalhes..."
                 />
               </div>
            </div>
          </div>

          {/* Footer (Fixo) */}
          <DialogFooter className="shrink-0 p-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-3 sm:gap-2">
            <Button 
               variant="outline" 
               onClick={() => setShowUploadModal(false)} 
               disabled={saving}
               className="h-11 rounded-xl border-slate-200 w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={saving || !form.file}
              className="h-11 rounded-xl bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] text-white shadow-md shadow-indigo-200 w-full sm:w-auto"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento <strong>{deleteDoc?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-500 hover:bg-rose-600" onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}