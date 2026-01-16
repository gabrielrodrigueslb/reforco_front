import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookOpen, Brain, History } from 'lucide-react';
import { cn } from "@/lib/utils";

const subjects = [
  'Português',
  'Matemática',
  'Ciências',
  'História',
  'Geografia',
  'Inglês',
  'Artes',
  'Ed. Física'
];

export default function PedagogicalTab({ data, setData }) {
  const toggleSubject = (subject) => {
    const current = data.difficulty_subjects || [];
    const updated = current.includes(subject)
      ? current.filter(s => s !== subject)
      : [...current, subject];
    setData({ ...data, difficulty_subjects: updated });
  };

  return (
    <div className="space-y-8">
      {/* Difficulty Subjects */}
      <div>
        <Label className="text-slate-700 font-medium flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-indigo-500" /> Matérias com Dificuldade
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {subjects.map(subject => {
            const isSelected = (data.difficulty_subjects || []).includes(subject);
            return (
              <button
                key={subject}
                type="button"
                onClick={() => toggleSubject(subject)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-left",
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={isSelected} />
                  <span className="font-medium">{subject}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty Reaction */}
      <div>
        <Label className="text-slate-700 font-medium flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-purple-500" /> Como reage às dificuldades?
        </Label>
        <Textarea
          value={data.difficulty_reaction || ''}
          onChange={(e) => setData({ ...data, difficulty_reaction: e.target.value })}
          placeholder="Descreva como o aluno reage quando encontra dificuldades (fica frustrado, pede ajuda, desiste fácil, etc.)"
          className="rounded-xl min-h-32"
        />
      </div>

      {/* Previous Tutoring */}
      <div>
        <Label className="text-slate-700 font-medium flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-emerald-500" /> Já fez reforço escolar antes?
        </Label>
        <RadioGroup
          value={data.previous_tutoring ? 'yes' : 'no'}
          onValueChange={(value) => setData({ ...data, previous_tutoring: value === 'yes' })}
          className="flex gap-4"
        >
          <div className={cn(
            "flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer transition-all",
            data.previous_tutoring 
              ? "border-emerald-500 bg-emerald-50" 
              : "border-slate-200 hover:border-slate-300"
          )}>
            <RadioGroupItem value="yes" id="yes" />
            <Label htmlFor="yes" className="cursor-pointer font-medium">Sim</Label>
          </div>
          <div className={cn(
            "flex items-center gap-3 px-6 py-4 rounded-xl border-2 cursor-pointer transition-all",
            !data.previous_tutoring 
              ? "border-slate-500 bg-slate-50" 
              : "border-slate-200 hover:border-slate-300"
          )}>
            <RadioGroupItem value="no" id="no" />
            <Label htmlFor="no" className="cursor-pointer font-medium">Não</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}