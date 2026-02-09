'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, Plus, Search, Trash2, Pencil } from 'lucide-react'

import PageTitle from '@/components/page-title'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

import { AnnouncementsService } from '@/services/announcements.service'
import type { Announcement } from '@/types/dashboard'

const priorityLabels: Record<Announcement['priority'], string> = {
  high: 'Alta',
  normal: 'Normal',
  low: 'Baixa',
}

const priorityBadge: Record<Announcement['priority'], string> = {
  high: 'bg-rose-100 text-rose-700',
  normal: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
}

const todayIso = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function AnnouncementsPage() {
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [search, setSearch] = useState('')

  const [openModal, setOpenModal] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)

  const [form, setForm] = useState({
    title: '',
    content: '',
    date: '',
    priority: 'normal' as Announcement['priority'],
    is_active: true,
  })

  const loadAnnouncements = async () => {
    setLoading(true)
    try {
      const data = await AnnouncementsService.list({ includeInactive: true })
      setAnnouncements(data)
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível carregar os avisos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return announcements
    return announcements.filter((item) =>
      `${item.title} ${item.content}`.toLowerCase().includes(q),
    )
  }, [announcements, search])

  const resetForm = (data?: Announcement) => {
    if (data) {
      setForm({
        title: data.title || '',
        content: data.content || '',
        date: data.date || todayIso(),
        priority: data.priority || 'normal',
        is_active: data.is_active ?? true,
      })
      return
    }
    setForm({
      title: '',
      content: '',
      date: todayIso(),
      priority: 'normal',
      is_active: true,
    })
  }

  const handleOpenNew = () => {
    setEditing(null)
    resetForm()
    setOpenModal(true)
  }

  const handleEdit = (item: Announcement) => {
    setEditing(item)
    resetForm(item)
    setOpenModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Preencha título e conteúdo')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        date: form.date || todayIso(),
        priority: form.priority,
        is_active: form.is_active,
      }
      if (editing) {
        await AnnouncementsService.update(editing.id, payload)
        toast.success('Aviso atualizado')
      } else {
        await AnnouncementsService.create(payload)
        toast.success('Aviso criado')
      }
      setOpenModal(false)
      await loadAnnouncements()
    } catch (error) {
      console.error(error)
      const message =
        (error as any)?.response?.data?.error || 'Não foi possível salvar o aviso'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await AnnouncementsService.delete(deleteTarget.id)
      setAnnouncements((prev) => prev.filter((item) => item.id !== deleteTarget.id))
      toast.success('Aviso removido')
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível excluir o aviso')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <PageTitle
            title="Avisos"
            className="text-2xl lg:text-3xl font-bold text-slate-800"
          />
          <p className="text-slate-500 mt-1">
            {loading ? 'Carregando...' : `${announcements.length} avisos ativos`}
          </p>
        </div>

        <Button
          onClick={handleOpenNew}
          className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] text-white h-11 px-6 rounded-xl shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo aviso
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar aviso..."
            className="h-11 pl-10 rounded-xl"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Bell className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            Nenhum aviso encontrado
          </h3>
          <p className="text-slate-500">Crie um novo aviso para comunicar a equipe.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-2xl bg-linear-to-br from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] flex items-center justify-center text-white font-semibold shadow-md shadow-indigo-200">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.date
                        ? format(new Date(`${item.date}T12:00:00`), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })
                        : '-'}
                    </p>
                  </div>
                </div>
                <Badge className={priorityBadge[item.priority]}>
                  {priorityLabels[item.priority]}
                </Badge>
              </div>

              <p className="text-sm text-slate-600 line-clamp-3">{item.content}</p>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="h-9"
                  onClick={() => handleEdit(item)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  className="h-9 text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={() => setDeleteTarget(item)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar aviso' : 'Novo aviso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex.: Reunião de pais"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                className="min-h-28"
                placeholder="Descreva o aviso..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="h-11 w-full rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value: Announcement['priority']) =>
                    setForm((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
              <div>
                <p className="text-sm font-medium text-slate-800">Aviso ativo</p>
                <p className="text-xs text-slate-500">
                  Desative para esconder temporariamente.
                </p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] text-white"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o aviso <strong>{deleteTarget?.title}</strong>?
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
