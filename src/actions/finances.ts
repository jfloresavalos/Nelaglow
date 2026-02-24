'use server'

import { prisma } from '@/lib/prisma'
import { startOfWeek, startOfMonth, startOfYear, endOfDay } from 'date-fns'
import type { FinancePeriod, FinanceStats, FinanceChartPoint, TransactionRow } from '@/types'

function getPeriodDates(period: FinancePeriod): { gte: Date; lte: Date } {
  const now = new Date()
  const lte = endOfDay(now)
  const gte =
    period === 'week'  ? startOfWeek(now, { weekStartsOn: 1 }) :
    period === 'month' ? startOfMonth(now) :
                         startOfYear(now)
  return { gte, lte }
}

export async function getFinanceStats(period: FinancePeriod = 'month'): Promise<FinanceStats> {
  const { gte, lte } = getPeriodDates(period)

  const [
    paymentsAgg,
    paymentsByMethod,
    purchaseMovements,
    deliveryFeesAgg,
    pendingCobro,
    inventarioRaw,
  ] = await Promise.all([
    // Total ingresos del período
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { receivedAt: { gte, lte } },
    }),

    // Desglose por método de pago
    prisma.payment.groupBy({
      by: ['method'],
      _sum: { amount: true },
      where: { receivedAt: { gte, lte } },
    }),

    // Egresos: movimientos PURCHASE_IN con costo en el período
    prisma.stockMovement.findMany({
      where: {
        type: 'PURCHASE_IN',
        unitCost: { not: null },
        createdAt: { gte, lte },
      },
      select: { quantity: true, unitCost: true },
    }),

    // Egresos automáticos: delivery fees Lima (lo que pagamos a la agencia de delivery)
    // El cliente nos paga el delivery → nosotros lo pasamos a la agencia → no es ganancia nuestra
    prisma.shipping.aggregate({
      _sum: { deliveryFee: true },
      where: {
        deliveryFee: { not: null },
        order: {
          shippingType: 'DELIVERY_LIMA',
          status: { notIn: ['CANCELLED'] },
          createdAt: { gte, lte },
        },
      },
    }),

    // Pendiente de cobro de clientes activos
    prisma.order.aggregate({
      _sum: { remainingAmount: true },
      where: {
        status: { notIn: ['CANCELLED', 'DELIVERED'] },
        remainingAmount: { gt: 0 },
      },
    }),

    // Inventario valorizado: SUM(stock * costPrice) — necesita $queryRaw (multiplicación de columnas)
    prisma.$queryRaw<[{ total: string }]>`
      SELECT COALESCE(SUM(stock * "costPrice"), 0)::text AS total
      FROM products
      WHERE "isActive" = true AND "costPrice" IS NOT NULL AND "costPrice" > 0
    `,
  ])

  const totalIngresos = Number(paymentsAgg._sum.amount ?? 0)

  const stockEgresos = purchaseMovements.reduce(
    (acc, m) => acc + m.quantity * Number(m.unitCost ?? 0),
    0
  )
  // Los delivery fees de Lima entran como ingreso al cliente pagarnos,
  // pero salen como egreso al pagarle a la agencia → se restan automáticamente
  const deliveryEgresos = Number(deliveryFeesAgg._sum.deliveryFee ?? 0)
  const totalEgresos = stockEgresos + deliveryEgresos

  const ingresosPorMetodo = { YAPE: 0, TRANSFERENCIA: 0, EFECTIVO: 0, CONTRAENTREGA: 0 }
  for (const row of paymentsByMethod) {
    const key = row.method as keyof typeof ingresosPorMetodo
    if (key in ingresosPorMetodo) {
      ingresosPorMetodo[key] = Number(row._sum.amount ?? 0)
    }
  }

  return {
    totalIngresos,
    totalEgresos,
    gananciaNeta: totalIngresos - totalEgresos,
    pendienteCobro: Number(pendingCobro._sum.remainingAmount ?? 0),
    inventarioValorizado: Number(inventarioRaw[0]?.total ?? 0),
    ingresosPorMetodo,
  }
}

export async function getFinanceChartData(
  period: FinancePeriod = 'month'
): Promise<FinanceChartPoint[]> {
  const { gte, lte } = getPeriodDates(period)

  type RawRow = { day: string; total: string }

  const [ingresosRaw, egresosRaw, deliveryEgresosRaw] = await Promise.all([
    // Pagos agrupados por día
    prisma.$queryRaw<RawRow[]>`
      SELECT DATE_TRUNC('day', "receivedAt")::date::text AS day,
             COALESCE(SUM(amount), 0)::text AS total
      FROM payments
      WHERE "receivedAt" >= ${gte} AND "receivedAt" <= ${lte}
      GROUP BY 1
      ORDER BY 1
    `,
    // Compras de stock agrupadas por día
    prisma.$queryRaw<RawRow[]>`
      SELECT DATE_TRUNC('day', "createdAt")::date::text AS day,
             COALESCE(SUM(quantity * "unitCost"), 0)::text AS total
      FROM stock_movements
      WHERE type = 'PURCHASE_IN'
        AND "unitCost" IS NOT NULL
        AND "createdAt" >= ${gte} AND "createdAt" <= ${lte}
      GROUP BY 1
      ORDER BY 1
    `,
    // Delivery fees Lima agrupados por día (egreso automático)
    prisma.$queryRaw<RawRow[]>`
      SELECT DATE_TRUNC('day', o."createdAt")::date::text AS day,
             COALESCE(SUM(s."deliveryFee"), 0)::text AS total
      FROM shippings s
      JOIN orders o ON o.id = s."orderId"
      WHERE o."shippingType" = 'DELIVERY_LIMA'
        AND o.status != 'CANCELLED'
        AND s."deliveryFee" IS NOT NULL
        AND o."createdAt" >= ${gte} AND o."createdAt" <= ${lte}
      GROUP BY 1
      ORDER BY 1
    `,
  ])

  const byDate: Record<string, FinanceChartPoint> = {}

  for (const row of ingresosRaw) {
    byDate[row.day] = { date: row.day, ingresos: Number(row.total), egresos: 0 }
  }
  for (const row of egresosRaw) {
    if (byDate[row.day]) {
      byDate[row.day].egresos += Number(row.total)
    } else {
      byDate[row.day] = { date: row.day, ingresos: 0, egresos: Number(row.total) }
    }
  }
  // Sumar delivery fees al egresos del día correspondiente
  for (const row of deliveryEgresosRaw) {
    if (byDate[row.day]) {
      byDate[row.day].egresos += Number(row.total)
    } else {
      byDate[row.day] = { date: row.day, ingresos: 0, egresos: Number(row.total) }
    }
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
}

export async function getFinanceTransactions(
  period: FinancePeriod = 'month'
): Promise<TransactionRow[]> {
  const { gte, lte } = getPeriodDates(period)

  const [payments, movements, deliveryShippings] = await Promise.all([
    prisma.payment.findMany({
      where: { receivedAt: { gte, lte } },
      include: {
        order: {
          select: {
            orderNumber: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { receivedAt: 'desc' },
      take: 150,
    }),
    prisma.stockMovement.findMany({
      where: {
        type: 'PURCHASE_IN',
        unitCost: { not: null },
        createdAt: { gte, lte },
      },
      include: { product: { select: { name: true, color: true } } },
      orderBy: { createdAt: 'desc' },
      take: 150,
    }),
    // Delivery fees Lima como egresos (pago automático a la agencia)
    prisma.shipping.findMany({
      where: {
        deliveryFee: { not: null },
        order: {
          shippingType: 'DELIVERY_LIMA',
          status: { notIn: ['CANCELLED'] },
          createdAt: { gte, lte },
        },
      },
      select: {
        id: true,
        deliveryFee: true,
        order: {
          select: {
            orderNumber: true,
            createdAt: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { order: { createdAt: 'desc' } },
      take: 150,
    }),
  ])

  const rows: TransactionRow[] = [
    ...payments.map((p) => ({
      id: p.id,
      date: p.receivedAt.toISOString(),
      type: 'INGRESO' as const,
      description: `${p.order.orderNumber} — ${p.order.client.name}`,
      amount: Number(p.amount),
      method: p.method,
    })),
    ...movements.map((m) => {
      const productLabel = m.product.color
        ? `${m.product.name} (${m.product.color})`
        : m.product.name
      return {
        id: m.id,
        date: m.createdAt.toISOString(),
        type: 'EGRESO' as const,
        description: `Compra stock: ${productLabel} × ${m.quantity}`,
        amount: m.quantity * Number(m.unitCost ?? 0),
      }
    }),
    ...deliveryShippings
      .filter((s) => Number(s.deliveryFee ?? 0) > 0)
      .map((s) => ({
        id: `delivery-${s.id}`,
        date: s.order.createdAt.toISOString(),
        type: 'EGRESO' as const,
        description: `Delivery Lima: ${s.order.orderNumber} — ${s.order.client.name}`,
        amount: Number(s.deliveryFee ?? 0),
      })),
  ]

  return rows.sort((a, b) => b.date.localeCompare(a.date))
}
