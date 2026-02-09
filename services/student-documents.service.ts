import { api } from '@/lib/api';

export type StudentDocument = {
  id: string;
  name: string;
  type: string;
  url: string;
  year?: number | null;
  notes?: string;
  created_at?: string;
};

export type StudentDocumentPayload = {
  file: File;
  name?: string;
  type?: string;
  year?: string | number;
  notes?: string;
};

function normalizeUrl(url?: string) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = process.env.NEXT_PUBLIC_URLBASE_UPLOAD || '';
  return `${base}${url}`;
}

function normalizeDocument(doc: StudentDocument): StudentDocument {
  return {
    ...doc,
    url: normalizeUrl(doc.url),
  };
}

export const StudentDocumentsService = {
  listByAluno: async (alunoId: string): Promise<StudentDocument[]> => {
    const { data } = await api.get<StudentDocument[]>(`/alunos/${alunoId}/documentos`);
    return data.map(normalizeDocument);
  },

  upload: async (alunoId: string, payload: StudentDocumentPayload): Promise<StudentDocument> => {
    const form = new FormData();
    form.append('file', payload.file);
    if (payload.name) form.append('name', payload.name);
    if (payload.type) form.append('type', payload.type);
    if (payload.year) form.append('year', String(payload.year));
    if (payload.notes) form.append('notes', payload.notes);

    const { data } = await api.post<StudentDocument>(`/alunos/${alunoId}/documentos`, form);

    return normalizeDocument(data);
  },

  remove: async (alunoId: string, documentoId: string): Promise<void> => {
    await api.delete(`/alunos/${alunoId}/documentos/${documentoId}`);
  },
};
