import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, History } from 'lucide-react'
import { getOrders } from '@/actions/orders'
import { OrdersList } from '@/components/orders/orders-list'
import { OrderStatus, ShippingType } from '@/generated/prisma'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; shipping?: string; page?: string }>
}) {
  const params = await searchParams;
  const page = Number(params?.page) || 1
  const search = params?.search || ''

  // Validate enums
  const status = Object.values(OrderStatus).includes(params?.status as OrderStatus)
    ? (params?.status as OrderStatus)
    : undefined

  const shippingType = Object.values(ShippingType).includes(params?.shipping as ShippingType)
    ? (params?.shipping as ShippingType)
    : undefined

  const { orders, total, pages } = await getOrders({
    search,
    status,
    shippingType,
    page,
    pageSize: 10,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">
            Gestiona tus pedidos y ventas ({total} pedidos)
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline">
            <Link href="/orders/historical">
              <History className="mr-2 h-4 w-4" />
              Ingresar histórico
            </Link>
          </Button>
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Pedido
            </Link>
          </Button>
        </div>
      </div>

      <OrdersList
        orders={orders}
        totalPages={pages}
        currentPage={page}
        currentSearch={search}
        currentStatus={status || ''}
        currentShipping={shippingType || ''}
      />
    </div>
  )
}
