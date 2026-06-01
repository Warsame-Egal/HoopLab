import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function currentSeason(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  if (month >= 10) {
    return `${year}-${String((year + 1) % 100).padStart(2, '0')}`
  }
  return `${year - 1}-${String(year % 100).padStart(2, '0')}`
}
