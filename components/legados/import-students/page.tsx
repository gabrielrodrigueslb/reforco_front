import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Upload, FileSpreadsheet, ArrowRight, Check, AlertCircle, 
  Loader2, Users, ChevronDown, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const fieldOptions = [
  { value: 'full_name', label: 'Nome Completo' },
  { value: 'birth_date', label: 'Data de Nascimento' },
  { value: 'grade', label: 'Série' },
  { value: 'shift', label: 'Turno' },
  { value: 'origin_school', label: 'Escola de Origem' },
  { value: 'guardian_name', label: 'Nome do Responsável' },
  { value: 'guardian_phone', label: 'Telefone' },
  { value: 'guardian_email', label: 'E-mail' },
  { value: 'ignore', label: 'Ignorar Coluna' },
];

export default function ImportStudents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const createStudentMutation = useMutation({
    mutationFn: (data) => base44.entities.Student.create(data),
  });

  const createGuardianMutation = useMutation({
    mutationFn: (data) => base44.entities.Guardian.create(data),
  });

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const validExtensions = ['csv', 'xlsx', 'xls'];
    const extension = uploadedFile.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      toast.error('Formato inválido. Use CSV ou XLSX.');
      return;
    }

    setFile(uploadedFile);
    setUploading(true);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadedFile });

      // Extract data
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: true
          }
        }
      });

      if (result.status === 'success' && result.output?.length > 0) {
        const data = result.output;
        const detectedHeaders = Object.keys(data[0]);
        
        setHeaders(detectedHeaders);
        setParsedData(data);
        
        // Auto-map columns
        const autoMapping = {};
        detectedHeaders.forEach(header => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('nome') && !lowerHeader.includes('responsável') && !lowerHeader.includes('responsavel')) {
            autoMapping[header] = 'full_name';
          } else if (lowerHeader.includes('nascimento') || lowerHeader.includes('data')) {
            autoMapping[header] = 'birth_date';
          } else if (lowerHeader.includes('série') || lowerHeader.includes('serie') || lowerHeader.includes('ano')) {
            autoMapping[header] = 'grade';
          } else if (lowerHeader.includes('turno')) {
            autoMapping[header] = 'shift';
          } else if (lowerHeader.includes('escola')) {
            autoMapping[header] = 'origin_school';
          } else if (lowerHeader.includes('responsável') || lowerHeader.includes('responsavel')) {
            autoMapping[header] = 'guardian_name';
          } else if (lowerHeader.includes('telefone') || lowerHeader.includes('celular') || lowerHeader.includes('whatsapp')) {
            autoMapping[header] = 'guardian_phone';
          } else if (lowerHeader.includes('email') || lowerHeader.includes('e-mail')) {
            autoMapping[header] = 'guardian_email';
          }
        });
        setColumnMapping(autoMapping);
        
        setStep(2);
        toast.success(`${data.length} registros encontrados!`);
      } else {
        throw new Error('Não foi possível extrair dados do arquivo');
      }
    } catch (error) {
      toast.error('Erro ao processar arquivo');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!columnMapping.full_name) {
      toast.error('Mapeie pelo menos a coluna "Nome Completo"');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const row of parsedData) {
        try {
          // Build student data
          const studentData = {
            status: 'Ativo',
            performance_indicator: 'Não avaliado'
          };

          Object.entries(columnMapping).forEach(([header, field]) => {
            if (field !== 'ignore' && !field.startsWith('guardian_')) {
              studentData[field] = row[header];
            }
          });

          // Create student
          const newStudent = await createStudentMutation.mutateAsync(studentData);

          // Build guardian data if exists
          const guardianData = {
            student_id: newStudent.id,
            is_primary: true,
            relationship: 'Responsável Legal'
          };

          let hasGuardianData = false;
          Object.entries(columnMapping).forEach(([header, field]) => {
            if (field === 'guardian_name') {
              guardianData.full_name = row[header];
              hasGuardianData = true;
            } else if (field === 'guardian_phone') {
              guardianData.phone = row[header];
            } else if (field === 'guardian_email') {
              guardianData.email = row[header];
            }
          });

          if (hasGuardianData && guardianData.full_name) {
            await createGuardianMutation.mutateAsync(guardianData);
          }

          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      setImportResults({ success: successCount, error: errorCount });
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (error) {
      toast.error('Erro durante a importação');
    } finally {
      setImporting(false);
    }
  };

  const getMappedValue = (row, field) => {
    const header = Object.entries(columnMapping).find(([h, f]) => f === field)?.[0];
    return header ? row[header] : '-';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Importar Alunos</h1>
        <p className="text-slate-500 mt-1">Importe alunos a partir de planilhas CSV ou Excel</p>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center gap-4 py-4">
        {[
          { num: 1, label: 'Upload' },
          { num: 2, label: 'Mapeamento' },
          { num: 3, label: 'Resultado' },
        ].map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                step >= s.num 
                  ? "bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)] text-white" 
                  : "bg-slate-100 text-slate-400"
              )}>
                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
              </div>
              <span className={cn(
                "text-sm mt-2 font-medium",
                step >= s.num ? "text-indigo-600" : "text-slate-400"
              )}>
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div className={cn(
                "w-24 h-1 rounded-full transition-all",
                step > s.num ? "bg-indigo-500" : "bg-slate-200"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <div className="text-center mb-8">
            <FileSpreadsheet className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
            <h2 className="text-xl font-semibold text-slate-800">Envie sua planilha</h2>
            <p className="text-slate-500 mt-2">Formatos aceitos: CSV, XLSX, XLS</p>
          </div>

          <label className={cn(
            "flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
            uploading 
              ? "border-indigo-300 bg-indigo-50" 
              : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
          )}>
            {uploading ? (
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-3" />
                <p className="text-indigo-600 font-medium">Processando arquivo...</p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-slate-400 mb-3" />
                <span className="text-lg font-medium text-slate-600">Clique para selecionar</span>
                <span className="text-sm text-slate-400 mt-1">ou arraste o arquivo aqui</span>
              </>
            )}
            <input 
              type="file" 
              accept=".csv,.xlsx,.xls"
              className="hidden" 
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>

          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">Dicas para sua planilha:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>A primeira linha deve conter os nomes das colunas</li>
                  <li>Inclua colunas como: Nome, Série, Turno, Responsável, Telefone</li>
                  <li>Datas devem estar no formato DD/MM/AAAA</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Mapping */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Mapeamento de Colunas</h2>
            <p className="text-slate-500 mb-6">Relacione as colunas do arquivo com os campos do sistema</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {headers.map(header => (
                <div key={header} className="p-4 bg-slate-50 rounded-xl">
                  <Label className="text-sm text-slate-600 mb-2 block truncate" title={header}>
                    {header}
                  </Label>
                  <Select
                    value={columnMapping[header] || ''}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, [header]: value })}
                  >
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Prévia ({parsedData.length} registros)
            </h2>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Telefone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{getMappedValue(row, 'full_name')}</TableCell>
                      <TableCell>{getMappedValue(row, 'grade')}</TableCell>
                      <TableCell>{getMappedValue(row, 'shift')}</TableCell>
                      <TableCell>{getMappedValue(row, 'guardian_name')}</TableCell>
                      <TableCell>{getMappedValue(row, 'guardian_phone')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {parsedData.length > 5 && (
              <p className="text-sm text-slate-500 mt-4 text-center">
                ... e mais {parsedData.length - 5} registros
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button 
              onClick={handleImport}
              disabled={importing || !columnMapping.full_name}
              className="bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
            >
              {importing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  Importar {parsedData.length} Alunos
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && importResults && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className={cn(
            "w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center",
            importResults.error === 0 ? "bg-emerald-100" : "bg-amber-100"
          )}>
            {importResults.error === 0 ? (
              <Check className="w-10 h-10 text-emerald-600" />
            ) : (
              <AlertCircle className="w-10 h-10 text-amber-600" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">Importação Concluída!</h2>
          
          <div className="flex justify-center gap-8 mt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-600">{importResults.success}</p>
              <p className="text-slate-500">Importados com sucesso</p>
            </div>
            {importResults.error > 0 && (
              <div className="text-center">
                <p className="text-4xl font-bold text-rose-600">{importResults.error}</p>
                <p className="text-slate-500">Com erro</p>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <Button 
              variant="outline"
              onClick={() => {
                setStep(1);
                setFile(null);
                setParsedData([]);
                setHeaders([]);
                setColumnMapping({});
                setImportResults(null);
              }}
            >
              Importar Mais
            </Button>
            <Button 
              onClick={() => navigate(createPageUrl('Students'))}
              className="bg-gradient-to-r from-[var(--brand-gradient-from)] to-[var(--brand-gradient-to)]"
            >
              <Users className="w-5 h-5 mr-2" />
              Ver Alunos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}