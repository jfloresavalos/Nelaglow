'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ORDER_STATUS_LABELS } from '@/types'
import { ORDER_STATUS_COLORS } from '@/lib/constants'
import type { Order, Client, OrderItem } from '@/generated/prisma'

type OrderWithClientAndItems = Order & {
  client: Client
  items: OrderItem[]
}

interface RecentOrdersProps {
  orders: OrderWithClientAndItems[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos Recientes</CardTitle>
        <CardDescription>Ultimos pedidos registrados</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No hay pedidos recientes
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold shrink-0">{order.orderNumber}</span>
                      <Badge className={ORDER_STATUS_COLORS[order.status]} variant="secondary">
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {order.client.name} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{formatCurrency(Number(order.totalAmount))}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} ítem(s)
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
