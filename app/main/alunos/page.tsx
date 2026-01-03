import { DataTable } from '@/components/dataTable';
import { Columns, AlunosData } from '@/lib/dataTable';
import React from 'react';

export default function Alunos() {
  return (
    <>
      <main className="animate-in fade-in duration-100">
        <DataTable columns={Columns} data={AlunosData} />
      </main>
    </>
  );
}
