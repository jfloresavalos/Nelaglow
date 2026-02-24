'use server'

import { prisma } from '@/lib/prisma'
import { startOfDay, startOfWeek, startOfMonth, subDays, format } from 'date-fns'
import { serializeData } from '@/lib/utils'
import type { DashboardStats, SalesChartData } from '@/types'

import { unstable_cache } from 'next/cache'

// ... imports

export const getDashboardStats = unstable_cache(
  async (): Promise<DashboardStats> => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const monthStart = startOfMonth(now)

    const [todayOrders, weekOrders, monthOrders, pendingOrders, lowStockProducts] = await Promise.all([
      // Today's sales
      prisma.order.aggregate({
        where: {
          createdAt: { gte: todayStart },
          status: { notIn: ['CANCELLED'] },
        },
        _sum: { totalAmount: true },
      }),
      // Week's sales
      prisma.order.aggregate({
        where: {
          createdAt: { gte: weekStart },
          status: { notIn: ['CANCELLED'] },
        },
        _sum: { totalAmount: true },
      }),
      // Month's sales
      prisma.order.aggregate({
        where: {
          createdAt: { gte: monthStart },
          status: { notIn: ['CANCELLED'] },
        },
        _sum: { totalAmount: true },
      }),
      // Pending orders count
      prisma.order.count({
        where: {
          status: { in: ['PENDING', 'STOCK_RESERVED', 'PARTIAL_PAYMENT', 'PAID'] },
        },
      }),
      // Low stock products count (using raw SQL for field comparison)
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM products
        WHERE "isActive" = true
        AND stock <= "lowStockThreshold"
      `.then((result) => Number(result[0].count)),
    ])

    return {
      todaySales: Number(todayOrders._sum.totalAmount || 0),
      weekSales: Number(weekOrders._sum.totalAmount || 0),
      monthSales: Number(monthOrders._sum.totalAmount || 0),
      pendingOrders,
      lowStockProducts,
    }
  },
  ['dashboard-stats'],
  { revalidate: 60, tags: ['dashboard'] }
)

export const getSalesChartData = unstable_cache(
  async (): Promise<SalesChartData[]> => {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: ['CANCELLED'] },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    })

    // Group by date
    const salesByDate: Record<string, number> = {}

    // Initialize all dates
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(now, i), 'yyyy-MM-dd')
      salesByDate[date] = 0
    }

    // Sum orders by date
    orders.forEach((order) => {
      const date = format(order.createdAt, 'yyyy-MM-dd')
      if (salesByDate[date] !== undefined) {
        salesByDate[date] += Number(order.totalAmount)
      }
    })

    // Convert to array and sort
    return Object.entries(salesByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },
  ['sales-chart'],
  { revalidate: 3600, tags: ['dashboard', 'sales'] }
)

export const getRecentOrders = unstable_cache(
  async () => {
    const orders = await prisma.order.findMany({
      where: {
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        client: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    return serializeData(orders)
  },
  ['recent-orders'],
  { revalidate: 60, tags: ['dashboard', 'orders'] }
)


export const getLowStockProducts = unstable_cache(
  async () => {
    // Single query with lateral join to fetch product + category + first image
    type RawRow = {
      id: string
      name: string
      stock: number
      categoryName: string | null
      imageUrl: string | null
      thumbnailUrl: string | null
    }

    const rows = await prisma.$queryRaw<RawRow[]>`
      SELECT
        p.id,
        p.name,
        p.stock,
        c.name AS "categoryName",
        pi."imageUrl",
        pi."thumbnailUrl"
      FROM products p
      LEFT JOIN categories c ON c.id = p."categoryId"
      LEFT JOIN LATERAL (
        SELECT "imageUrl", "thumbnailUrl"
        FROM product_images
        WHERE "productId" = p.id
        ORDER BY "sortOrder" ASC
        LIMIT 1
      ) pi ON true
      WHERE p."isActive" = true
        AND (p.stock = 0 OR p.stock <= p."lowStockThreshold")
      ORDER BY p.stock ASC
      LIMIT 10
    `

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      stock: row.stock,
      category: row.categoryName ? { name: row.categoryName } : null,
      images: row.imageUrl
        ? [{ imageUrl: row.imageUrl, thumbnailUrl: row.thumbnailUrl }]
        : [],
    }))
  },
  ['low-stock-products'],
  { revalidate: 300, tags: ['dashboard', 'products'] }
)
