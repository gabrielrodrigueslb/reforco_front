import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { DEFAULT_SUBJECTS } from '@/lib/subjects'

type Filters = {
  search: string
  grade: string
  shift: string
  status: string
  difficulty: string[]
}

type StudentFiltersProps = {
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
  subjects?: string[]
}

const grades = [
  '1º Ano',
  '2º Ano',
  '3º Ano',
  '4º Ano',
  '5º Ano',
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano',
  '1º EM',
  '2º EM',
  '3º EM',
]
const shifts = ['Manhã', 'Tarde']
const statuses = ['Ativo', 'Inativo']
export default function StudentFilters({ filters, setFilters, subjects }: StudentFiltersProps) {
  const subjectOptions = subjects?.length ? subjects : DEFAULT_SUBJECTS
  const hasFilters =
    filters.grade || filters.shift || filters.status || filters.difficulty.length > 0

  const clearFilters = () => {
    setFilters({
      search: filters.search,
      grade: '',
      shift: '',
      status: '',
      difficulty: [],
    })
  }

  const toggleDifficulty = (subject: string) => {
    setFilters((prev) => {
      const current = prev.difficulty || []
      const updated = current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject]
      return { ...prev, difficulty: updated }
    })
  }

  const allSelected =
    subjectOptions.length > 0 && filters.difficulty.length === subjectOptions.length
  const handleToggleAll = () => {
    setFilters((prev) => ({
      ...prev,
      difficulty: allSelected ? [] : [...subjectOptions],
    }))
  }

  const difficultyLabel = (() => {
    if (filters.difficulty.length === 0) return 'Todas'
    if (filters.difficulty.length === 1) return filters.difficulty[0]
    if (allSelected) return 'Todas'
    return `${filters.difficulty.length} selecionadas`
  })()

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Buscar aluno por nome..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="pl-12 h-12 rounded-xl border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        <Select
          value={filters.grade}
          onValueChange={(value) => setFilters({ ...filters, grade: value })}
        >
          <SelectTrigger
            className={cn(
              'w-32 h-10 rounded-xl',
              filters.grade && 'border-indigo-300 bg-indigo-50',
            )}
          >
            <SelectValue placeholder="Série" />
          </SelectTrigger>
          <SelectContent>
            {grades.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.shift}
          onValueChange={(value) => setFilters({ ...filters, shift: value })}
        >
          <SelectTrigger
            className={cn(
              'w-28 h-10 rounded-xl',
              filters.shift && 'border-indigo-300 bg-indigo-50',
            )}
          >
            <SelectValue placeholder="Turno" />
          </SelectTrigger>
          <SelectContent>
            {shifts.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <SelectTrigger
            className={cn(
              'w-28 h-10 rounded-xl',
              filters.status && 'border-indigo-300 bg-indigo-50',
            )}
          >
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-44 h-10 rounded-xl justify-between',
                filters.difficulty.length > 0 && 'border-indigo-300 bg-indigo-50',
              )}
            >
              {difficultyLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuCheckboxItem checked={allSelected} onCheckedChange={handleToggleAll}>
              Selecionar todas
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {subjectOptions.map((s) => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={filters.difficulty.includes(s)}
                onCheckedChange={() => toggleDifficulty(s)}
              >
                {s}
              </DropdownMenuCheckboxItem>
            ))}
            {subjectOptions.length === 0 && (
              <DropdownMenuItem disabled>Sem matérias cadastradas</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        ) : null}
      </div>
    </div>
  )
}
