'use client'

import React, { useMemo, useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Plus, ChevronLeft, ChevronRight, Edit, Trash2, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type CalendarEvent = {
  id: string
  title: string
  description?: string
  event_type: string
  date: string // yyyy-MM-dd
  start_time?: string
  end_time?: string
  color?: string
}

const eventTypes = ['Aula Especial', 'Reunião', 'Prova', 'Evento', 'Feriado', 'Outro'] as const

const eventColors: Record<string, string> = {
  'Aula Especial': '#6366f1',
  Reunião: '#f59e0b',
  Prova: '#ef4444',
  Evento: '#10b981',
  Feriado: '#8b5cf6',
  Outro: '#64748b',
}

function safeId() {
  // @ts-ignore
  return (globalThis?.crypto?.randomUUID?.() as string) ?? Math.random().toString(36).slice(2, 11)
}

// ===== MOCK DATA =====
const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Aula Especial',
    description: 'Revisão geral',
    event_type: 'Aula Especial',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '18:00',
    end_time: '19:30',
    color: eventColors['Aula Especial'],
  },
  {
    id: 'evt-2',
    title: 'Reunião com responsáveis',
    event_type: 'Reunião',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '20:00',
    end_time: '21:00',
    color: eventColors['Reunião'],
  },
]

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // substitui Base44 por estado local
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS)

  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [deleteEvent, setDeleteEvent] = useState<CalendarEvent | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: '',
    date: '',
    start_time: '',
    end_time: '',
    color: '#6366f1',
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: '',
      date: '',
      start_time: '',
      end_time: '',
      color: '#6366f1',
    })
    setEditingEvent(null)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setFormData((prev) => ({ ...prev, date: format(date, 'yyyy-MM-dd') }))
    setShowModal(true)
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      date: event.date,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      color: event.color || '#6366f1',
    })
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!formData.title || !formData.event_type || !formData.date) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    const color = eventColors[formData.event_type] || formData.color

    if (editingEvent) {
      const updated: CalendarEvent = {
        ...editingEvent,
        title: formData.title,
        description: formData.description || '',
        event_type: formData.event_type,
        date: formData.date,
        start_time: formData.start_time || '',
        end_time: formData.end_time || '',
        color,
      }

      setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? updated : e)))
      setShowModal(false)
      resetForm()
      toast.success('Evento atualizado!')
      return
    }

    const created: CalendarEvent = {
      id: safeId(),
      title: formData.title,
      description: formData.description || '',
      event_type: formData.event_type,
      date: formData.date,
      start_time: formData.start_time || '',
      end_time: formData.end_time || '',
      color,
    }

    setEvents((prev) => [created, ...prev])
    setShowModal(false)
    resetForm()
    toast.success('Evento criado!')
  }

  const handleConfirmDelete = () => {
    if (!deleteEvent) return
    setEvents((prev) => prev.filter((e) => e.id !== deleteEvent.id))
    setDeleteEvent(null)
    toast.success('Evento excluído!')
  }

  // Calendar grid (igual ao original)
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Add padding days (igual ao original)
  const startDay = monthStart.getDay()
  const paddingDays = Array(startDay).fill(null)

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return events.filter((e) => e.date === dateStr)
  }

  const selectedDateEvents = useMemo(() => {
    return selectedDate ? getEventsForDay(selectedDate) : []
  }, [selectedDate, events])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Calendário</h1>
          <p className="text-slate-500 mt-1">Gerencie eventos e atividades</p>
        </div>

        <Button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white h-12 px-6 rounded-xl shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              type="button"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>

            <h2 className="text-xl font-semibold text-slate-800 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>

            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              type="button"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}

            {days.map((day) => {
              const dayEvents = getEventsForDay(day)
              const isToday = isSameDay(day, new Date())
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'aspect-square p-1 rounded-xl transition-all relative',
                    isToday && 'ring-2 ring-indigo-500',
                    isSelected && 'bg-indigo-100',
                    !isSelected && 'hover:bg-slate-100'
                  )}
                  type="button"
                >
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isToday && 'text-indigo-600',
                      !isSameMonth(day, currentMonth) && 'text-slate-300'
                    )}
                  >
                    {format(day, 'd')}
                  </span>

                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={`${event.id}-${i}`}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: event.color || '#6366f1' }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Events Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">
            {selectedDate
              ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
              : 'Selecione uma data'}
          </h3>

          {selectedDate && (
            <>
              <Button
                variant="outline"
                className="w-full mb-4 rounded-xl"
                onClick={() => handleDateClick(selectedDate)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Evento
              </Button>

              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Nenhum evento nesta data</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 rounded-xl border border-slate-100 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: event.color }}
                            />
                            <span className="font-medium text-slate-800">{event.title}</span>
                          </div>

                          <Badge
                            className="text-xs"
                            style={{
                              backgroundColor: `${event.color}20`,
                              color: event.color,
                            }}
                          >
                            {event.event_type}
                          </Badge>

                          {event.start_time && (
                            <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.start_time}
                              {event.end_time && ` - ${event.end_time}`}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg"
                            type="button"
                          >
                            <Edit className="w-4 h-4 text-slate-500" />
                          </button>

                          <button
                            onClick={() => setDeleteEvent(event)}
                            className="p-1.5 hover:bg-rose-100 rounded-lg"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Event Modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-700 font-medium">Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nome do evento"
                className="mt-2 h-12 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 font-medium">Tipo *</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                >
                  <SelectTrigger className="mt-2 h-12 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>

                  <SelectContent>
                    {eventTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Data *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div>
              <Label className="text-slate-700 font-medium">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes do evento..."
                className="mt-2 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>

            <Button onClick={handleSubmit} className="bg-linear-to-r from-indigo-500 to-purple-600">
              {editingEvent ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEvent} onOpenChange={() => setDeleteEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o evento <strong>{deleteEvent?.title}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-500 hover:bg-rose-600" onClick={handleConfirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
