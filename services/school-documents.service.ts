import { api } from '@/lib/api';

export type SchoolDocument = {
  id: string;
  name: string;
  type: string;
  url: string;
  year?: number | null;
  notes?: string;
  created_at?: string;
};

export type SchoolDocumentPayload = {
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

function normalizeDocument(doc: SchoolDocument): SchoolDocument {
  return {
    ...doc,
    url: normalizeUrl(doc.url),
  };
}

export const SchoolDocumentsService = {
  list: async (): Promise<SchoolDocument[]> => {
    const { data } = await api.get<SchoolDocument[]>('/documentos');
    return data.map(normalizeDocument);
  },

  upload: async (payload: SchoolDocumentPayload): Promise<SchoolDocument> => {
    const form = new FormData();
    form.append('file', payload.file);
    if (payload.name) form.append('name', payload.name);
    if (payload.type) form.append('type', payload.type);
    if (payload.year) form.append('year', String(payload.year));
    if (payload.notes) form.append('notes', payload.notes);

    const { data } = await api.post<SchoolDocument>('/documentos', form);

    return normalizeDocument(data);
  },

  remove: async (documentId: string): Promise<void> => {
    await api.delete(`/documentos/${documentId}`);
  },
};
