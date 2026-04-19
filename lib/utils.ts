import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function FormatRole(role: string) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin'
    case 'ADMIN':
      return 'Admin'
    case 'USER':
      return 'Professor'
    default:
      return 'Usuario'
  }
}
