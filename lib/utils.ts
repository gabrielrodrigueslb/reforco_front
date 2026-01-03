import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function FormatRole(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'Admin'
    case 'User':
      return 'Professor'
    default:
      return 'Usuário'
  }
}