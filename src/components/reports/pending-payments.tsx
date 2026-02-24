'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { ORDER_STATUS_LABELS, SHIPPING_TYPE_LABELS } from '@/types'
import { Clock } from 'lucide-react'
import type { PendingPaymentRow } from '@/types'

function DaysBadge({ days }: { days: number }) {
  const color =
    days < 3  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
    days < 7  ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                'bg-red-500/10 text-red-600 border-red-200'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
      <Clock className="h-3 w-3" />
      {days}d
    </span>
  )
}

export function PendingPayments({ rows }: { rows: PendingPaymentRow[] }) {
  const totalPendiente = rows.reduce((acc, r) => acc + r.remainingAmount, 0)

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <Card className="glass-card border-amber-200/40 bg-amber-500/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total pendiente de cobro</p>
              <p className="text-3xl font-bold text-amber-500">{formatCurrency(totalPendiente)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{rows.length}</p>
              <p className="text-sm text-muted-foreground">pedido{rows.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla desktop */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-base">Pedidos con saldo pendiente</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">
              No hay cobros pendientes. ¡Todo al día!
            </p>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground text-xs">
                      <th className="text-left px-4 py-3 font-medium">Pedido</th>
                      <th className="text-left px-4 py-3 font-medium">Cliente</th>
                      <th className="text-left px-4 py-3 font-medium">Envío</th>
                      <th className="text-right px-4 py-3 font-medium">Total</th>
                      <th className="text-right px-4 py-3 font-medium">Pagado</th>
                      <th className="text-right px-4 py-3 font-medium">Pendiente</th>
                      <th className="text-center px-4 py-3 font-medium">Días</th>
                      <th className="text-left px-4 py-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {rows.map((r) => (
                      <tr key={r.orderId} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/orders/${r.orderId}`} className="font-medium text-primary hover:underline">
                            {r.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.clientName}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {SHIPPING_TYPE_LABELS[r.shippingType] ?? r.shippingType}
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(r.totalAmount)}</td>
                        <td className="px-4 py-3 text-right text-emerald-500">{formatCurrency(r.paidAmount)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-amber-500">
                          {formatCurrency(r.remainingAmount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <DaysBadge days={r.daysPending} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {ORDER_STATUS_LABELS[r.status] ?? r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2 p-4">
                {rows.map((r) => (
                  <Link key={r.orderId} href={`/orders/${r.orderId}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm text-primary">{r.orderNumber}</p>
                          <DaysBadge days={r.daysPending} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{r.clientName}</p>
                        <p className="text-xs text-muted-foreground">{SHIPPING_TYPE_LABELS[r.shippingType] ?? r.shippingType}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-amber-500 text-sm">{formatCurrency(r.remainingAmount)}</p>
                        <p className="text-xs text-muted-foreground">pendiente</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
