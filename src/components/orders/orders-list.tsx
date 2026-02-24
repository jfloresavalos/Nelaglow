'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useDebounce } from '@/lib/hooks'
import Link from 'next/link'
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ORDER_STATUS_LABELS, SHIPPING_TYPE_LABELS } from '@/types'
import { ORDER_STATUS_COLORS, SHIPPING_TYPE_COLORS } from '@/lib/constants'
import type { OrderForList } from '@/types'

interface OrdersListProps {
  orders: OrderForList[]
  totalPages: number
  currentPage: number
  currentSearch: string
  currentStatus: string
  currentShipping: string
}

export function OrdersList({ orders, totalPages, currentPage, currentSearch, currentStatus, currentShipping }: OrdersListProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [searchValue, setSearchValue] = useState(currentSearch)
  const debouncedSearch = useDebounce(searchValue)

  useEffect(() => {
    if (debouncedSearch === currentSearch) return
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (currentStatus && currentStatus !== 'all') params.set('status', currentStatus)
    if (currentShipping && currentShipping !== 'all') params.set('shipping', currentShipping)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }, [debouncedSearch, currentSearch, currentStatus, currentShipping, router, pathname])

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams()
    if (searchValue) params.set('search', searchValue)
    if (value && value !== 'all') params.set('status', value)
    if (currentShipping && currentShipping !== 'all') params.set('shipping', currentShipping)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleShippingChange = (value: string) => {
    const params = new URLSearchParams()
    if (searchValue) params.set('search', searchValue)
    if (currentStatus && currentStatus !== 'all') params.set('status', currentStatus)
    if (value && value !== 'all') params.set('shipping', value)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const buildPageQuery = (page: number) => {
    const params = new URLSearchParams()
    if (searchValue) params.set('search', searchValue)
    if (currentStatus && currentStatus !== 'all') params.set('status', currentStatus)
    if (currentShipping && currentShipping !== 'all') params.set('shipping', currentShipping)
    params.set('page', String(page))
    return params.toString()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por numero, cliente o telefono..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={currentStatus || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={currentShipping || 'all'}
          onValueChange={handleShippingChange}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Tipo envio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(SHIPPING_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
          {searchValue || currentStatus || currentShipping
            ? 'No se encontraron pedidos con los filtros aplicados'
            : 'No hay pedidos registrados'}
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="grid gap-4 md:hidden">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="glass-card hover:bg-white/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-lg text-primary">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <Badge className={ORDER_STATUS_COLORS[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-base">{order.client.name}</p>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{order._count.items} producto(s)</span>
                        <Badge variant="outline" className={SHIPPING_TYPE_COLORS[order.shippingType]}>
                          {SHIPPING_TYPE_LABELS[order.shippingType]}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                        <span className="text-sm font-medium">Total</span>
                        <span className="font-bold text-lg text-primary">
                          {formatCurrency(Number(order.totalAmount))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden rounded-lg border bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Envio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-bold">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.client.name}</p>
                        {order.client.phone && (
                          <p className="text-xs text-muted-foreground">
                            {order.client.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order._count.items} item(s)
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={SHIPPING_TYPE_COLORS[order.shippingType]}>
                        {SHIPPING_TYPE_LABELS[order.shippingType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={ORDER_STATUS_COLORS[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(order.totalAmount))}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={Number(order.remainingAmount) > 0 ? 'text-amber-600' : 'text-green-600'}>
                        {formatCurrency(Number(order.paidAmount))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`${pathname}?${buildPageQuery(currentPage - 1)}`)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="text-sm text-muted-foreground">
                Pagina {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`${pathname}?${buildPageQuery(currentPage + 1)}`)}
                disabled={currentPage >= totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
