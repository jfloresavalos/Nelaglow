import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClient } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ORDER_STATUS_LABELS, SHIPPING_TYPE_LABELS } from '@/types'
import { ORDER_STATUS_COLORS } from '@/lib/constants'
import { Edit, ArrowLeft, Phone, Mail, MapPin, User } from 'lucide-react'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await getClient(id)

  if (!client) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Volver a clientes" asChild className="shrink-0">
            <Link href="/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{client.name}</h1>
            {client.dni && (
              <p className="text-muted-foreground">DNI: {client.dni}</p>
            )}
          </div>
        </div>
        <Button asChild className="shrink-0 sm:self-auto self-end">
          <Link href={`/clients/${client.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informacion de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
            )}
            {(client.address || client.department) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {client.address && <p>{client.address}</p>}
                  {client.department && (
                    <p className="text-muted-foreground">
                      {client.district && `${client.district}, `}
                      {client.province && `${client.province}, `}
                      {client.department}
                    </p>
                  )}
                </div>
              </div>
            )}
            {client.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Notas:</p>
                <p className="whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Cliente desde: {formatDate(client.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total de pedidos</span>
              <span className="text-2xl font-bold">{client._count.orders}</span>
            </div>
            {client.orders.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ultimo pedido</span>
                <span>{formatDate(client.orders[0].createdAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {client.orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Este cliente no tiene pedidos registrados
            </div>
          ) : (
            <div className="space-y-4">
              {client.orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)} - {SHIPPING_TYPE_LABELS[order.shippingType]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} producto(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={ORDER_STATUS_COLORS[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(Number(order.totalAmount))}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
