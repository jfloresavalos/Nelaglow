'use server'

// Nota: xlsx 0.18.x se usa únicamente en Server Actions de admin.
// Los archivos los sube el propio administrador autenticado, no usuarios externos.

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'

interface ExcelRow {
  nombre?: unknown
  color?: unknown
  categoria?: unknown
  precio_venta?: unknown
  precio_costo?: unknown
  stock?: unknown
  stock_minimo?: unknown
  descripcion?: unknown
}

function toStr(v: unknown): string {
  return v != null ? String(v).trim() : ''
}

function toNum(v: unknown, fallback = 0): number {
  const n = Number(v)
  return isNaN(n) || n < 0 ? fallback : n
}

export interface ImportResult {
  created: number
  updated: number
  errors: string[]
}

export async function importProductsFromExcel(
  formData: FormData
): Promise<ImportResult> {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const file = formData.get('file') as File | null
  if (!file) throw new Error('No se recibió archivo')
  if (!file.name.match(/\.(xlsx|xls)$/i)) throw new Error('Solo se aceptan archivos .xlsx o .xls')

  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawRows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

  if (rawRows.length === 0) {
    return { created: 0, updated: 0, errors: ['El archivo está vacío o no tiene filas de datos'] }
  }

  // Cargar categorías existentes + cache para auto-crear nuevas
  const dbCategories = await prisma.category.findMany({ select: { id: true, name: true } })
  const catByName = new Map(dbCategories.map((c) => [c.name.toLowerCase(), c.id]))

  // Busca la categoría por nombre; si no existe, la crea automáticamente
  async function findOrCreateCategory(name: string): Promise<string | null> {
    if (!name) return null
    const key = name.toLowerCase()
    if (catByName.has(key)) return catByName.get(key)!
    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const created = await prisma.category.create({ data: { name, slug } })
    catByName.set(key, created.id) // cachear para el resto del import
    errors.push(`Categoría "${name}" creada automáticamente`)
    return created.id
  }

  let created = 0
  let updated = 0
  const errors: string[] = []

  // Agrupar filas por nombre (case-insensitive)
  const groups = new Map<string, { displayName: string; rows: ExcelRow[] }>()

  for (const row of rawRows) {
    const nombre = toStr(row.nombre)
    if (!nombre) {
      errors.push(`Fila ignorada: columna "nombre" vacía`)
      continue
    }
    const key = nombre.toLowerCase()
    if (!groups.has(key)) {
      groups.set(key, { displayName: nombre, rows: [] })
    }
    groups.get(key)!.rows.push(row)
  }

  for (const { displayName, rows } of groups.values()) {
    const hasVariants = rows.some((r) => toStr(r.color) !== '')

    if (hasVariants) {
      // ── Modo variantes: padre + hijos por color ───────────────────────────
      const firstRow = rows[0]
      const categoryId = await findOrCreateCategory(toStr(firstRow.categoria))

      // Buscar o crear el padre
      let parent = await prisma.product.findFirst({
        where: { name: { equals: displayName, mode: 'insensitive' }, parentProductId: null },
      })

      if (!parent) {
        parent = await prisma.product.create({
          data: {
            name: displayName,
            price: toNum(firstRow.precio_venta),
            costPrice: toNum(firstRow.precio_costo) || null,
            stock: 0,
            lowStockThreshold: toNum(firstRow.stock_minimo, 5),
            description: toStr(firstRow.descripcion) || null,
            categoryId,
            isActive: true,
          },
        })
        created++
      }

      // Upsert variantes de color
      for (const row of rows) {
        const color = toStr(row.color)
        if (!color) continue

        const rowCategoryId = (await findOrCreateCategory(toStr(row.categoria))) ?? parent.categoryId

        const existing = await prisma.product.findFirst({
          where: {
            parentProductId: parent.id,
            color: { equals: color, mode: 'insensitive' },
          },
        })

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              price: toNum(row.precio_venta) || Number(existing.price),
              costPrice: toNum(row.precio_costo) || null,
              stock: toNum(row.stock, existing.stock),
              lowStockThreshold: toNum(row.stock_minimo, existing.lowStockThreshold),
            },
          })
          updated++
        } else {
          await prisma.product.create({
            data: {
              name: displayName,
              color,
              parentProductId: parent.id,
              price: toNum(row.precio_venta),
              costPrice: toNum(row.precio_costo) || null,
              stock: toNum(row.stock, 0),
              lowStockThreshold: toNum(row.stock_minimo, 5),
              description: toStr(row.descripcion) || null,
              categoryId: rowCategoryId,
              isActive: true,
            },
          })
          created++
        }
      }
    } else {
      // ── Modo standalone: productos sin variantes ──────────────────────────
      for (const row of rows) {
        const nombre = toStr(row.nombre)
        if (!nombre) continue

        const categoryId = await findOrCreateCategory(toStr(row.categoria))

        const existing = await prisma.product.findFirst({
          where: { name: { equals: nombre, mode: 'insensitive' }, parentProductId: null },
        })

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              price: toNum(row.precio_venta) || Number(existing.price),
              costPrice: toNum(row.precio_costo) || null,
              stock: toNum(row.stock, existing.stock),
              lowStockThreshold: toNum(row.stock_minimo, existing.lowStockThreshold),
              description: toStr(row.descripcion) || existing.description,
              categoryId: categoryId ?? existing.categoryId,
            },
          })
          updated++
        } else {
          await prisma.product.create({
            data: {
              name: nombre,
              price: toNum(row.precio_venta),
              costPrice: toNum(row.precio_costo) || null,
              stock: toNum(row.stock, 0),
              lowStockThreshold: toNum(row.stock_minimo, 5),
              description: toStr(row.descripcion) || null,
              categoryId,
              isActive: true,
            },
          })
          created++
        }
      }
    }
  }

  revalidatePath('/products')
  revalidatePath('/dashboard')

  return { created, updated, errors }
}
