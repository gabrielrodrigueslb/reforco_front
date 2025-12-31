import { ColumnDef } from "@tanstack/react-table"

type Aluno = {
  id: string
  name: string
  status: "ativo" | "pre-matriculado" | "inativo"
  matricula: string
}

export const AlunosData: Aluno[] = [
  {
    id: "1",
    name: "John Doe",
    status: "ativo",
    matricula: "1458123",
  },
  {
    id: "2",
    name: "Jane Smith",
    status: "pre-matriculado",
    matricula: "5451543",
  },
  {
    id: "3",
    name: "Alice Johnson",
    status: "inativo",
    matricula: "4871523",
  },
]

 
export const Columns: ColumnDef<Aluno>[] = [
    {
      accessorKey: "matricula",
      header: "Matrícula",
    },
    {
      accessorKey: "name",
      header: "Nome",
    },
  {
    accessorKey: "status",
    header: "Status",
  },
]