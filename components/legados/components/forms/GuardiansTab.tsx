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
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, Mail, MapPin } from 'lucide-react';

const relationships = ['Pai', 'Mãe', 'Avô', 'Avó', 'Tio(a)', 'Irmão(ã)', 'Responsável Legal', 'Outro'];

export default function GuardiansTab({ guardian1, setGuardian1, guardian2, setGuardian2 }) {
  return (
    <div className="space-y-8">
      {/* Guardian 1 */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <User className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Responsável Principal</h3>
            <p className="text-sm text-slate-500">Informações de contato obrigatórias</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label className="text-slate-700 font-medium">Nome Completo *</Label>
            <Input
              value={guardian1.full_name || ''}
              onChange={(e) => setGuardian1({ ...guardian1, full_name: e.target.value })}
              placeholder="Nome do responsável"
              className="mt-2 h-12 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-slate-700 font-medium">CPF</Label>
            <Input
              value={guardian1.cpf || ''}
              onChange={(e) => setGuardian1({ ...guardian1, cpf: e.target.value })}
              placeholder="000.000.000-00"
              className="mt-2 h-12 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-slate-700 font-medium">Parentesco *</Label>
            <Select
              value={guardian1.relationship || ''}
              onValueChange={(value) => setGuardian1({ ...guardian1, relationship: value })}
            >
              <SelectTrigger className="mt-2 h-12 rounded-xl">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {relationships.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-700 font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" /> Telefone (WhatsApp) *
            </Label>
            <Input
              value={guardian1.phone || ''}
              onChange={(e) => setGuardian1({ ...guardian1, phone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="mt-2 h-12 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-slate-700 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" /> E-mail
            </Label>
            <Input
              type="email"
              value={guardian1.email || ''}
              onChange={(e) => setGuardian1({ ...guardian1, email: e.target.value })}
              placeholder="email@exemplo.com"
              className="mt-2 h-12 rounded-xl"
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-slate-700 font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Endereço
            </Label>
            <Textarea
              value={guardian1.address || ''}
              onChange={(e) => setGuardian1({ ...guardian1, address: e.target.value })}
              placeholder="Endereço completo"
              className="mt-2 rounded-xl min-h-20"
            />
          </div>
        </div>
      </div>

      {/* Guardian 2 */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Responsável Secundário</h3>
            <p className="text-sm text-slate-500">Opcional</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label className="text-slate-700 font-medium">Nome Completo</Label>
            <Input
              value={guardian2.full_name || ''}
              onChange={(e) => setGuardian2({ ...guardian2, full_name: e.target.value })}
              placeholder="Nome do responsável"
              className="mt-2 h-12 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-slate-700 font-medium">CPF</Label>
            <Input
              value={guardian2.cpf || ''}
              onChange={(e) => setGuardian2({ ...guardian2, cpf: e.target.value })}
              placeholder="000.000.000-00"
              className="mt-2 h-12 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-slate-700 font-medium">Parentesco</Label>
            <Select
              value={guardian2.relationship || ''}
              onValueChange={(value) => setGuardian2({ ...guardian2, relationship: value })}
            >
              <SelectTrigger className="mt-2 h-12 rounded-xl">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {relationships.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-700 font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" /> Telefone
            </Label>
            <Input
              value={guardian2.phone || ''}
              onChange={(e) => setGuardian2({ ...guardian2, phone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="mt-2 h-12 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-slate-700 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" /> E-mail
            </Label>
            <Input
              type="email"
              value={guardian2.email || ''}
              onChange={(e) => setGuardian2({ ...guardian2, email: e.target.value })}
              placeholder="email@exemplo.com"
              className="mt-2 h-12 rounded-xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}vimport React from 'react';
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
import { Heart, Pill, FileText, AlertTriangle } from 'lucide-react';

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não informado'];

export default function HealthTab({ data, setData }) {
  return (
    <div className="space-y-6">
      <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <p className="text-sm text-rose-700">
            Estas informações são confidenciais e importantes para a segurança do aluno.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label className="text-slate-700 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Alergias
          </Label>
          <Textarea
            value={data.allergies || ''}
            onChange={(e) => setData({ ...data, allergies: e.target.value })}
            placeholder="Liste alergias conhecidas (alimentos, medicamentos, etc.)"
            className="mt-2 rounded-xl min-h-24"
          />
        </div>

        <div>
          <Label className="text-slate-700 font-medium flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" /> Tipo Sanguíneo
          </Label>
          <Select
            value={data.blood_type || 'Não informado'}
            onValueChange={(value) => setData({ ...data, blood_type: value })}
          >
            <SelectTrigger className="mt-2 h-12 rounded-xl">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {bloodTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-slate-700 font-medium flex items-center gap-2">
            <Pill className="w-4 h-4 text-blue-500" /> Medicamentos em Uso
          </Label>
          <Input
            value={data.medications || ''}
            onChange={(e) => setData({ ...data, medications: e.target.value })}
            placeholder="Medicamentos que o aluno toma"
            className="mt-2 h-12 rounded-xl"
          />
        </div>

        <div className="md:col-span-2">
          <Label className="text-slate-700 font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" /> Laudos Médicos
          </Label>
          <Textarea
            value={data.medical_reports || ''}
            onChange={(e) => setData({ ...data, medical_reports: e.target.value })}
            placeholder="Informações sobre laudos (TDAH, autismo, dislexia, etc.)"
            className="mt-2 rounded-xl min-h-24"
          />
        </div>

        <div className="md:col-span-2">
          <Label className="text-slate-700 font-medium">Observações de Comportamento</Label>
          <Textarea
            value={data.behavior_notes || ''}
            onChange={(e) => setData({ ...data, behavior_notes: e.target.value })}
            placeholder="Observações sobre comportamento, preferências, necessidades especiais..."
            className="mt-2 rounded-xl min-h-32"
          />
        </div>
      </div>
    </div>
  );
}