'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import type {
  DailyCloseData,
  PendingPaymentRow,
  TopProductRow,
  RestockRow,
  FinancePeriod,
} from '@/types'

// ── Cierre del Día ───────────────────────────────────────────────────────────

export async function getDailyClose(dateStr?: string): Promise<DailyCloseData> {
  const session = await auth()
  if (!session) throw new Error('No autorizado')
  const date = dateStr ? new Date(dateStr) : new Date()
  const start = startOfDay(date)
  const end = endOfDay(date)

  const [payments, orders] = await Promise.all([
    prisma.payment.findMany({
      where: { receivedAt: { gte: start, lte: end } },
      include: {
        order: {
          select: {
            orderNumber: true,
            client: { select: { name: true } },
          },
        },
      },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: 'CANCELLED' },
      },
      include: {
        client: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const totalCobrado = payments.reduce((acc, p) => acc + Number(p.amount), 0)

  const cobradoPorMetodo: Record<string, number> = {}
  for (const p of payments) {
    cobradoPorMetodo[p.method] = (cobradoPorMetodo[p.method] || 0) + Number(p.amount)
  }

  return {
    date: date.toISOString(),
    totalCobrado,
    cobradoPorMetodo,
    pedidosCount: orders.length,
    pedidosList: orders.map((o) => ({
      orderId: o.id,
      orderNumber: o.orderNumber,
      clientName: o.client.name,
      totalAmount: Number(o.totalAmount),
      paidAmount: Number(o.paidAmount),
      status: o.status,
      shippingType: o.shippingType,
    })),
  }
}

// ── Cobros Pendientes ────────────────────────────────────────────────────────

export async function getPendingPayments(): Promise<PendingPaymentRow[]> {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const orders = await prisma.order.findMany({
    where: {
      remainingAmount: { gt: 0 },
      status: { notIn: ['CANCELLED', 'DELIVERED'] },
    },
    include: {
      client: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' }, // más antiguo primero (más urgente)
  })

  const now = Date.now()

  return orders.map((o) => ({
    orderId: o.id,
    orderNumber: o.orderNumber,
    clientName: o.client.name,
    totalAmount: Number(o.totalAmount),
    paidAmount: Number(o.paidAmount),
    remainingAmount: Number(o.remainingAmount),
    daysPending: Math.floor((now - o.createdAt.getTime()) / 86_400_000),
    shippingType: o.shippingType,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }))
}

// ── Top Productos vendidos ───────────────────────────────────────────────────

function getPeriodDates(period: FinancePeriod) {
  const now = new Date()
  const lte = endOfDay(now)
  const gte =
    period === 'week'  ? startOfWeek(now, { weekStartsOn: 1 }) :
    period === 'month' ? startOfMonth(now) :
                         startOfYear(now)
  return { gte, lte }
}

type TopProductRaw = {
  product_id: string
  product_name: string
  color: string | null
  total_qty: number
  total_revenue: string
  image_url: string | null
}

export async function getTopProducts(
  period: FinancePeriod = 'month',
  limit = 10
): Promise<TopProductRow[]> {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const { gte, lte } = getPeriodDates(period)

  const rows = await prisma.$queryRaw<TopProductRaw[]>`
    SELECT
      p.id              AS product_id,
      p.name            AS product_name,
      p.color,
      SUM(oi.quantity)::int           AS total_qty,
      COALESCE(SUM(oi.subtotal), 0)::text  AS total_revenue,
      pi."thumbnailUrl" AS image_url
    FROM order_items oi
    JOIN products p  ON p.id = oi."productId"
    JOIN orders   o  ON o.id = oi."orderId"
    LEFT JOIN LATERAL (
      SELECT "thumbnailUrl"
      FROM product_images
      WHERE "productId" = p.id
      ORDER BY "sortOrder" ASC
      LIMIT 1
    ) pi ON true
    WHERE o.status != 'CANCELLED'
      AND o."createdAt" >= ${gte}
      AND o."createdAt" <= ${lte}
    GROUP BY p.id, p.name, p.color, pi."thumbnailUrl"
    ORDER BY total_qty DESC
    LIMIT ${limit}
  `

  return rows.map((r) => ({
    productId: r.product_id,
    productName: r.product_name,
    color: r.color,
    totalQty: Number(r.total_qty),
    totalRevenue: Number(r.total_revenue),
    imageUrl: r.image_url,
  }))
}

// ── Lista de Restock ─────────────────────────────────────────────────────────

type RestockRaw = {
  product_id: string
  product_name: string
  color: string | null
  stock: number
  low_stock_threshold: number
  units_needed: number
  cost_price: string | null
  category_name: string | null
  image_url: string | null
}

export async function getRestockList(): Promise<RestockRow[]> {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const rows = await prisma.$queryRaw<RestockRaw[]>`
    SELECT
      p.id                     AS product_id,
      p.name                   AS product_name,
      p.color,
      p.stock,
      p."lowStockThreshold"    AS low_stock_threshold,
      (p."lowStockThreshold" - p.stock) AS units_needed,
      p."costPrice"::text      AS cost_price,
      c.name                   AS category_name,
      pi."thumbnailUrl"        AS image_url
    FROM products p
    LEFT JOIN categories c ON c.id = p."categoryId"
    LEFT JOIN LATERAL (
      SELECT "thumbnailUrl"
      FROM product_images
      WHERE "productId" = p.id
      ORDER BY "sortOrder" ASC
      LIMIT 1
    ) pi ON true
    WHERE p."isActive" = true
      AND p.stock <= p."lowStockThreshold"
      AND (
        p."parentProductId" IS NOT NULL
        OR NOT EXISTS (
          SELECT 1 FROM products v WHERE v."parentProductId" = p.id
        )
      )
    ORDER BY p.stock ASC, p.name ASC
  `

  return rows.map((r) => {
    const costPrice = r.cost_price ? Number(r.cost_price) : null
    const unitsNeeded = Number(r.units_needed)
    return {
      productId: r.product_id,
      productName: r.product_name,
      color: r.color,
      stock: Number(r.stock),
      lowStockThreshold: Number(r.low_stock_threshold),
      unitsNeeded,
      costPrice,
      restockCost: costPrice !== null ? costPrice * unitsNeeded : null,
      categoryName: r.category_name,
      imageUrl: r.image_url,
    }
  })
}
