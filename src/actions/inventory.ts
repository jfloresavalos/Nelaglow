'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils'
import { Prisma, StockMovementType } from '@/generated/prisma'
import { bulkStockEntrySchema, stockMovementSchema } from '@/lib/validations/inventory'

export async function getStockMovements(params?: {
  productId?: string
  type?: StockMovementType
  dateFrom?: Date
  dateTo?: Date
  search?: string
  page?: number
  pageSize?: number
}) {
  const { productId, type, dateFrom, dateTo, search, page = 1, pageSize = 25 } = params || {}

  const where: Prisma.StockMovementWhereInput = {}

  if (productId) {
    where.productId = productId
  }

  if (type) {
    where.type = type
  }

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    }
  }

  if (search) {
    where.OR = [
      { product: { name: { contains: search, mode: 'insensitive' } } },
      { reference: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
        user: true,
        order: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stockMovement.count({ where }),
  ])

  return {
    movements: serializeData(movements),
    total,
    pages: Math.ceil(total / pageSize),
  }
}

export async function createStockMovement(data: {
  productId: string
  type: 'PURCHASE_IN' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT'
  quantity: number
  unitCost?: number | null
  notes?: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  const validated = stockMovementSchema.parse(data)

  const product = await prisma.product.findUnique({ where: { id: validated.productId } })
  if (!product) throw new Error('Producto no encontrado')

  const stockDelta =
    validated.type === 'ADJUSTMENT_OUT'
      ? -validated.quantity
      : validated.quantity

  await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        productId: validated.productId,
        type: validated.type,
        quantity: validated.quantity,
        unitCost: validated.unitCost,
        notes: validated.notes,
        userId: session.user.id,
      },
    }),
    prisma.product.update({
      where: { id: validated.productId },
      data: { stock: { increment: stockDelta } },
    }),
  ])

  revalidatePath('/inventory')
  revalidatePath('/products')
}

export async function createBulkStockEntry(
  rows: {
    productId: string
    type?: 'PURCHASE_IN' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT'
    quantity: number
    unitCost?: number | null
    notes?: string | null
  }[]
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  // Normalize: default type is PURCHASE_IN for bulk entry
  const normalizedRows = rows.map((r) => ({
    ...r,
    type: r.type ?? ('PURCHASE_IN' as const),
  }))

  const validated = bulkStockEntrySchema.parse({ rows: normalizedRows })

  // Verify all products exist
  const productIds = [...new Set(validated.rows.map((r) => r.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  })

  if (products.length !== productIds.length) {
    const found = new Set(products.map((p) => p.id))
    const missing = productIds.filter((id) => !found.has(id))
    throw new Error(`Productos no encontrados: ${missing.join(', ')}`)
  }

  await prisma.$transaction(
    validated.rows.flatMap((row) => {
      const stockDelta =
        row.type === 'ADJUSTMENT_OUT' ? -row.quantity : row.quantity
      return [
        prisma.stockMovement.create({
          data: {
            productId: row.productId,
            type: row.type,
            quantity: row.quantity,
            unitCost: row.unitCost,
            notes: row.notes,
            userId: session.user.id,
          },
        }),
        prisma.product.update({
          where: { id: row.productId },
          data: { stock: { increment: stockDelta } },
        }),
      ]
    })
  )

  revalidatePath('/inventory')
  revalidatePath('/products')
  revalidatePath('/dashboard')
}
