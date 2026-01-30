import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { 
  FileText, Plus, Upload, Download, Trash2, 
  FolderOpen, File, Image, Loader2, Eye
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const categories = ['Modelo de Boletim', 'Ficha de Aluno', 'Declaração', 'Contrato', 'Outro'];

const categoryColors = {
  'Modelo de Boletim': 'bg-indigo-100 text-indigo-700',
  'Ficha de Aluno': 'bg-purple-100 text-purple-700',
  'Declaração': 'bg-emerald-100 text-emerald-700',
  'Contrato': 'bg-amber-100 text-amber-700',
  'Outro': 'bg-slate-100 text-slate-700',
};

export default function Documents() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    file_url: '',
    file_type: '',
    description: ''
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowModal(false);
      resetForm();
      toast.success('Documento adicionado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDeleteDoc(null);
      toast.success('Documento excluído!');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      file_url: '',
      file_type: '',
      description: ''
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const fileType = file.name.split('.').pop().toLowerCase();
      setFormData({ 
        ...formData, 
        file_url: result.file_url,
        file_type: fileType,
        name: formData.name || file.name.replace(`.${fileType}`, '')
      });
      toast.success('Arquivo enviado!');
    } catch (error) {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.file_url) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createMutation.mutate(formData);
  };

  const getFileIcon = (fileType) => {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return Image;
    }
    return File;
  };

  const filteredDocs = selectedCategory === 'all' 
    ? documents 
    : documents.filter(d => d.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Documentos</h1>
          <p className="text-slate-500 mt-1">{documents.length} documentos</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] hover:from-[var(--brand-gradient-from-hover)] hover:to-[var(--brand-gradient-to-hover)] text-white h-12 px-6 rounded-xl shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Documento
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            "px-4 py-2 rounded-xl font-medium transition-all",
            selectedCategory === 'all'
              ? "bg-indigo-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-all",
              selectedCategory === cat
                ? "bg-indigo-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <FolderOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhum documento</h3>
          <p className="text-slate-500 mb-6">
            {selectedCategory !== 'all' 
              ? `Nenhum documento na categoria "${selectedCategory}"`
              : 'Comece adicionando seu primeiro documento'}
          </p>
          <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]">
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Documento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map(doc => {
            const FileIcon = getFileIcon(doc.file_type);
            
            return (
              <div 
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
              >
                {/* Preview Area */}
                <div className="h-32 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative">
                  {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(doc.file_type) ? (
                    <img 
                      src={doc.file_url} 
                      alt={doc.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileIcon className="w-12 h-12 text-slate-400" />
                  )}
                  
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-lg hover:bg-slate-100"
                    >
                      <Eye className="w-5 h-5 text-slate-700" />
                    </a>
                    <a
                      href={doc.file_url}
                      download
                      className="p-2 bg-white rounded-lg hover:bg-slate-100"
                    >
                      <Download className="w-5 h-5 text-slate-700" />
                    </a>
                    <button
                      onClick={() => setDeleteDoc(doc)}
                      className="p-2 bg-white rounded-lg hover:bg-rose-100"
                    >
                      <Trash2 className="w-5 h-5 text-rose-500" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-medium text-slate-800 truncate mb-2">{doc.name}</h3>
                  <Badge className={categoryColors[doc.category] || categoryColors.Outro}>
                    {doc.category}
                  </Badge>
                  {doc.description && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">{doc.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {format(new Date(doc.created_date), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload */}
            <div>
              <Label className="text-slate-700 font-medium">Arquivo *</Label>
              <div className="mt-2">
                {formData.file_url ? (
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <File className="w-8 h-8 text-emerald-600" />
                    <div className="flex-1">
                      <p className="font-medium text-emerald-700">Arquivo enviado</p>
                      <p className="text-sm text-emerald-600">{formData.file_type?.toUpperCase()}</p>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, file_url: '', file_type: '' })}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500">Clique para enviar</span>
                        <span className="text-xs text-slate-400 mt-1">PDF, DOCX, imagens...</span>
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
              <Label className="text-slate-700 font-medium">Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do documento"
                className="mt-2 h-12 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-slate-700 font-medium">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="mt-2 h-12 rounded-xl">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-700 font-medium">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do documento..."
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
              disabled={!formData.file_url || createMutation.isPending}
              className="bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
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
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600"
              onClick={() => deleteMutation.mutate(deleteDoc.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}