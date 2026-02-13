'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import PageTitle from '@/components/page-title';
import { EventsService, CalendarEvent } from '@/services/events.service';

const eventTypes = [
  'Aula Especial',
  'Reunião',
  'Prova',
  'Evento',
  'Feriado',
  'Outro',
] as const;

const eventColors: Record<string, string> = {
  'Aula Especial': '#6366f1',
  Reunião: '#f59e0b',
  Prova: '#ef4444',
  Evento: '#10b981',
  Feriado: '#8b5cf6',
  Outro: '#64748b',
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // substitui Base44 por estado local
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  useEffect(() => {
    const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    EventsService.list({ from, to })
      .then((data) =>
        setEvents(
          (data || []).map((e) => ({
            ...e,
            color: e.color || eventColors[e.event_type] || '#6366f1',
          })),
        ),
      )
      .catch(() => toast.error('Não foi possível carregar eventos'));
  }, [currentMonth]);

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<CalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: '',
    date: '',
    start_time: '',
    end_time: '',
    color: '#6366f1',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: '',
      date: '',
      start_time: '',
      end_time: '',
      color: '#6366f1',
    });
    setEditingEvent(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setFormData((prev) => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
    setShowModal(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      date: event.date,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      color: event.color || '#6366f1',
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.event_type || !formData.date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const color = eventColors[formData.event_type] || formData.color;

    if (editingEvent) {
      EventsService.update(editingEvent.id, {
        title: formData.title,
        description: formData.description || '',
        event_type: formData.event_type,
        date: formData.date,
        start_time: formData.start_time || '',
        end_time: formData.end_time || '',
        color,
      })
        .then((updated) => {
          setEvents((prev) =>
            prev.map((e) => (e.id === editingEvent.id ? updated : e)),
          );
          setShowModal(false);
          resetForm();
          toast.success('Evento atualizado!');
        })
        .catch(() => toast.error('Não foi possível atualizar'));
      return;
    }

    EventsService.create({
      title: formData.title,
      description: formData.description || '',
      event_type: formData.event_type,
      date: formData.date,
      start_time: formData.start_time || '',
      end_time: formData.end_time || '',
      color,
    })
      .then((created) => {
        setEvents((prev) => [created, ...prev]);
        setShowModal(false);
        resetForm();
        toast.success('Evento criado!');
      })
      .catch(() => toast.error('Não foi possível criar'));
  };

  const handleConfirmDelete = async () => {
    if (!deleteEvent || isDeleting) return;
    setIsDeleting(true);
    try {
      await EventsService.delete(deleteEvent.id);
      setEvents((prev) => prev.filter((e) => e.id !== deleteEvent.id));
      toast.success('Evento excluído!');
      setDeleteEvent(null);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível excluir o evento');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calendar grid (igual ao original)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days (igual ao original)
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter((e) => e.date === dateStr);
  };

  const selectedDateEvents = useMemo(() => {
    return selectedDate ? getEventsForDay(selectedDate) : [];
  }, [selectedDate, events]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <PageTitle
            title="Calendário"
            className="text-2xl lg:text-3xl font-bold text-slate-800"
          />
          <p className="text-slate-500 mt-1">Gerencie eventos e atividades</p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] hover:from-[var(--brand-gradient-from-hover)] hover:to-[var(--brand-gradient-to-hover)] text-white h-11 px-5 rounded-xl shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              type="button"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>

            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              type="button"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {[
              { short: 'D', long: 'Dom' },
              { short: 'S', long: 'Seg' },
              { short: 'T', long: 'Ter' },
              { short: 'Q', long: 'Qua' },
              { short: 'Q', long: 'Qui' },
              { short: 'S', long: 'Sex' },
              { short: 'S', long: 'Sab' },
            ].map((day, idx) => (
              <div
                key={`${day.long}-${idx}`}
                className="text-center text-xs sm:text-sm font-medium text-slate-500 py-1"
              >
                <span className="sm:hidden">{day.short}</span>
                <span className="hidden sm:inline">{day.long}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => (
              <div
                key={`pad-${i}`}
                className="h-10 sm:h-12 md:h-14 lg:h-18 xl:h-20"
              />
            ))}

            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'h-10 sm:h-12 md:h-14 lg:h-18 xl:h-20 w-full rounded-xl transition-all relative flex flex-col items-center justify-center',
                    isToday && 'ring-2 ring-indigo-500',
                    isSelected && 'bg-indigo-100',
                    !isSelected && 'hover:bg-slate-100',
                  )}
                  type="button"
                >
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isToday && 'text-indigo-600',
                      !isSameMonth(day, currentMonth) && 'text-slate-300',
                    )}
                  >
                    {format(day, 'd')}
                  </span>

                  {dayEvents.length > 0 && (
                    <div className="mt-1 flex gap-0.5">
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
              );
            })}
          </div>
        </div>

        {/* Events Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5">
          <h3 className="font-semibold text-slate-800 mb-3">
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
                            <span className="font-medium text-slate-800">
                              {event.title}
                            </span>
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
          setShowModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Editar Evento' : 'Novo Evento'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-700 font-medium">Tí­tulo *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Nome do evento"
                className="mt-2 h-12 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 font-medium">Tipo *</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, event_type: value })
                  }
                >
                  <SelectTrigger className="mt-2 w-full !h-12 !rounded-xl">
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
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="mt-2 h-12 rounded-xl w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 font-medium">InÃ­cio</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  className="mt-2 h-12 rounded-xl w-full"
                />
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Término</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  className="mt-2 h-12 rounded-xl w-full"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-700 font-medium">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Detalhes do evento..."
                className="mt-2 rounded-xl w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>

            <Button
              onClick={handleSubmit}
              className="bg-linear-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
            >
              {editingEvent ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteEvent}
        onOpenChange={() => setDeleteEvent(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o evento{' '}
              <strong>{deleteEvent?.title}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
