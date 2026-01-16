import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { MoreVertical, Eye, Edit, Trash2, FileText, CalendarCheck } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function StudentCard({ student, onDelete }) {
  const performanceColors = {
    'Melhorando': 'bg-emerald-100 text-emerald-700',
    'Atenção': 'bg-amber-100 text-amber-700',
    'Decaindo': 'bg-rose-100 text-rose-700',
    'Não avaliado': 'bg-slate-100 text-slate-600',
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(student.birth_date);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
            {student.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{student.full_name}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <span>{student.grade}</span>
              {age && <span>• {age} anos</span>}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <MoreVertical className="w-5 h-5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to={createPageUrl(`StudentProfile?id=${student.id}`)} className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Ver Ficha
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={createPageUrl(`StudentForm?id=${student.id}`)} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={createPageUrl(`StudentGrades?id=${student.id}`)} className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Boletim
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={createPageUrl(`Attendance?student=${student.id}`)} className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                Frequência
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-rose-600 focus:text-rose-600"
              onClick={() => onDelete(student)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <Badge variant="outline" className="bg-slate-50">
          {student.shift}
        </Badge>
        <Badge 
          className={cn(
            "font-medium",
            performanceColors[student.performance_indicator] || performanceColors['Não avaliado']
          )}
        >
          {student.performance_indicator || 'Não avaliado'}
        </Badge>
        {student.status === 'Inativo' && (
          <Badge className="bg-slate-200 text-slate-600">Inativo</Badge>
        )}
      </div>

      {student.difficulty_subjects?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2">Dificuldades:</p>
          <div className="flex flex-wrap gap-1">
            {student.difficulty_subjects.slice(0, 3).map((subject, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-rose-50 text-rose-600 rounded-full">
                {subject}
              </span>
            ))}
            {student.difficulty_subjects.length > 3 && (
              <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-full">
                +{student.difficulty_subjects.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}