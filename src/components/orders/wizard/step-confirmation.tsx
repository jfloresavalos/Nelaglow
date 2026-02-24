'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { SHIPPING_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/types'
import { User, Package, Truck, CreditCard } from 'lucide-react'
import type { Client } from '@/generated/prisma'
import type { ShippingInput, PaymentInput } from '@/lib/validations/order'
import type { WizardItemState } from '@/types'

interface StepConfirmationProps {
  client: Client | null
  items: WizardItemState[]
  shippingType: 'PROVINCIA' | 'DELIVERY_LIMA' | 'RECOJO_TIENDA'
  shipping: ShippingInput | null
  payment: PaymentInput | null
  subtotal: number
  shippingAmount: number
  total: number
  notes: string
  onNotesChange: (notes: string) => void
}

export function StepConfirmation({
  client,
  items,
  shippingType,
  shipping,
  payment,
  subtotal,
  shippingAmount,
  total,
  notes,
  onNotesChange,
}: StepConfirmationProps) {

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Client */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{client?.name}</p>
            {client?.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
            {client?.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
          </CardContent>
        </Card>

        {/* Shipping */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4" />
              Envio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="mb-2">
              {SHIPPING_TYPE_LABELS[shippingType]}
            </Badge>
            {shipping && (
              <div className="text-sm space-y-1">
                <p>{shipping.recipientName}</p>
                <p className="text-muted-foreground">{shipping.recipientPhone}</p>
                {shipping.recipientAddress && (
                  <p className="text-muted-foreground">{shipping.recipientAddress}</p>
                )}
                {shipping.department && (
                  <p className="text-muted-foreground">
                    {shipping.district && `${shipping.district}, `}
                    {shipping.province && `${shipping.province}, `}
                    {shipping.department}
                  </p>
                )}
                {shipping.agencyName && (
                  <p className="text-muted-foreground">
                    Agencia: {shipping.agencyName}
                  </p>
                )}
                {shipping.isContraentrega && (
                  <Badge className="mt-1">Contraentrega</Badge>
                )}
              </div>
            )}
            {shippingType === 'RECOJO_TIENDA' && (
              <p className="text-sm text-muted-foreground">
                El cliente recogera en tienda
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Productos ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(item.unitPrice)} x {item.quantity}
                    {item.unitPrice !== item.originalUnitPrice && (
                      <span className="ml-2 line-through text-muted-foreground/60">
                        {formatCurrency(item.originalUnitPrice)}
                      </span>
                    )}
                  </p>
                </div>
                <p className="font-medium">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {shippingAmount > 0 && (
                <div className="flex justify-between">
                  <span>Envio</span>
                  <span>{formatCurrency(shippingAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payment ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Metodo</span>
                <Badge variant="outline">{PAYMENT_METHOD_LABELS[payment.method]}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Monto pagado</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
              {payment.amount < total && (
                <div className="flex justify-between text-amber-600">
                  <span>Pendiente</span>
                  <span>{formatCurrency(total - payment.amount)}</span>
                </div>
              )}
              {payment.notes && (
                <p className="text-sm text-muted-foreground">
                  Nota: {payment.notes}
                </p>
              )}
            </div>
          ) : shipping?.isContraentrega ? (
            <div className="text-center py-2">
              <Badge>Contraentrega</Badge>
              <p className="text-sm text-muted-foreground mt-1">
                El cliente pagara {formatCurrency(total)} al recibir
              </p>
            </div>
          ) : (
            <div className="text-center py-2 text-muted-foreground">
              Sin pago inicial - Pendiente: {formatCurrency(total)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas del pedido (opcional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Instrucciones especiales, comentarios..."
          rows={3}
        />
      </div>
    </div>
  )
}
