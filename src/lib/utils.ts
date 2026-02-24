import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Serialize Prisma objects to plain objects for Client Components
 * Converts Decimal objects to numbers and handles nested objects
 */
export function serializeData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeData(item)) as T
  }

  if (typeof data === 'object') {
    // Check if it's a Decimal (has toNumber method)
    if ('toNumber' in data && typeof (data as { toNumber: () => number }).toNumber === 'function') {
      return (data as { toNumber: () => number }).toNumber() as T
    }

    // Check if it's a Date
    if (data instanceof Date) {
      return data as T
    }

    // Recursively serialize object properties
    const serialized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeData(value)
    }
    return serialized as T
  }

  return data
}
