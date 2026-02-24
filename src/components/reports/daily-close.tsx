'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { ORDER_STATUS_LABELS, SHIPPING_TYPE_LABELS } from '@/types'
import { Banknote, ShoppingBag, TrendingUp } from 'lucide-react'
import type { DailyCloseData } from '@/types'

const METHOD_COLORS: Record<string, string> = {
  YAPE:          'bg-violet-500/10 text-violet-600 border-violet-200',
  TRANSFERENCIA: 'bg-blue-500/10 text-blue-600 border-blue-200',
  EFECTIVO:      'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  CONTRAENTREGA: 'bg-amber-500/10 text-amber-600 border-amber-200',
}
const METHOD_LABELS: Record<string, string> = {
  YAPE: 'Yape', TRANSFERENCIA: 'Transferencia', EFECTIVO: 'Efectivo', CONTRAENTREGA: 'Contraentrega',
}

export function DailyClose({ data }: { data: DailyCloseData }) {
  const date = new Date(data.date)
  const dateLabel = date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  const metodosConSaldo = Object.entries(data.cobradoPorMetodo).filter(([, v]) => v > 0)

  return (
    <div className="space-y-6">
      {/* Resumen total */}
      <Card className="glass-card border-white/20 bg-emerald-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="p-3 rounded-2xl bg-emerald-500/10 shrink-0">
              <TrendingUp className="h-7 w-7 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
              <p className="text-4xl font-bold text-emerald-500">{formatCurrency(data.totalCobrado)}</p>
              <p className="text-sm text-muted-foreground mt-1">cobrados hoy</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold">{data.pedidosCount}</p>
              <p className="text-sm text-muted-foreground">pedido{data.pedidosCount !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Desglose por método */}
          {metodosConSaldo.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {metodosConSaldo.map(([method, amount]) => (
                <span
                  key={method}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${METHOD_COLORS[method] ?? 'bg-gray-500/10 text-gray-600'}`}
                >
                  <Banknote className="h-3 w-3" />
                  {METHOD_LABELS[method] ?? method}: {formatCurrency(amount)}
                </span>
              ))}
            </div>
          )}

          {data.totalCobrado === 0 && (
            <p className="mt-3 text-sm text-muted-foreground text-center py-4">
              No se registraron cobros hoy.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista de pedidos del día */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4" />
            Pedidos del día ({data.pedidosCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.pedidosList.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">
              No hay pedidos registrados hoy.
            </p>
          ) : (
            <div className="divide-y divide-white/10">
              {data.pedidosList.map((order) => {
                const isPending = order.paidAmount < order.totalAmount
                return (
                  <div key={order.orderId} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{order.clientName}</p>
                      <p className="text-xs text-muted-foreground">{order.orderNumber} · {SHIPPING_TYPE_LABELS[order.shippingType] ?? order.shippingType}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="font-semibold text-sm">{formatCurrency(order.totalAmount)}</p>
                      {isPending ? (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-500/10">
                          Pendiente {formatCurrency(order.totalAmount - order.paidAmount)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-500/10">
                          Pagado
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
