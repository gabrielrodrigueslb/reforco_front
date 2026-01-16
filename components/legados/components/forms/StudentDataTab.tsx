import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const grades = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º EM', '2º EM', '3º EM'];
const shifts = ['Manhã', 'Tarde'];

export default function StudentDataTab({ data, setData }) {
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="full_name" className="text-slate-700 font-medium">Nome Completo *</Label>
          <Input
            id="full_name"
            value={data.full_name || ''}
            onChange={(e) => setData({ ...data, full_name: e.target.value })}
            placeholder="Digite o nome completo"
            className="mt-2 h-12 rounded-xl"
          />
        </div>

        <div>
          <Label htmlFor="birth_date" className="text-slate-700 font-medium">Data de Nascimento *</Label>
          <Input
            id="birth_date"
            type="date"
            value={data.birth_date || ''}
            onChange={(e) => setData({ ...data, birth_date: e.target.value })}
            className="mt-2 h-12 rounded-xl"
          />
        </div>

        <div>
          <Label className="text-slate-700 font-medium">Idade</Label>
          <div className="mt-2 h-12 px-4 rounded-xl bg-slate-100 flex items-center text-slate-600">
            {calculateAge(data.birth_date) || 'Calcular automaticamente'}
          </div>
        </div>

        <div>
          <Label className="text-slate-700 font-medium">Série/Ano Escolar *</Label>
          <Select
            value={data.grade || ''}
            onValueChange={(value) => setData({ ...data, grade: value })}
          >
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Selecione a série" />
            </SelectTrigger>
            <SelectContent>
              {grades.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-slate-700 font-medium">Turno *</Label>
          <Select
            value={data.shift || ''}
            onValueChange={(value) => setData({ ...data, shift: value })}
          >
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Selecione o turno" />
            </SelectTrigger>
            <SelectContent>
              {shifts.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="origin_school" className="text-slate-700 font-medium">Escola de Origem</Label>
          <Input
            id="origin_school"
            value={data.origin_school || ''}
            onChange={(e) => setData({ ...data, origin_school: e.target.value })}
            placeholder="Nome da escola onde estuda"
            className="mt-2 h-12 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}