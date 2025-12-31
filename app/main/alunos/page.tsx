import { DataTable } from '@/components/dataTable'
import { Columns, AlunosData } from '@/lib/dataTable'
import React from 'react'

export default function Alunos() {
  return (
    <>
      <header className='text-3xl font-bold pb-4 mb-4 border-b-2'>Alunos</header>

      <DataTable columns={Columns} data={AlunosData}/>
    </>
  )
}
