'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ImageUpload } from '@/components/shared/image-upload'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Smartphone, Building2, Banknote, Truck } from 'lucide-react'
import type { PaymentInput } from '@/lib/validations/order'

interface StepPaymentProps {
  total: number
  shippingType: 'PROVINCIA' | 'DELIVERY_LIMA' | 'RECOJO_TIENDA'
  isContraentrega: boolean
  payment: PaymentInput | null
  onPaymentChange: (payment: PaymentInput | null) => void
}

const paymentMethods = [
  { value: 'YAPE', label: 'Yape', icon: Smartphone },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: Building2 },
  { value: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
  { value: 'CONTRAENTREGA', label: 'Contraentrega', icon: Truck },
] as const

export function StepPayment({
  total,
  shippingType,
  isContraentrega,
  payment,
  onPaymentChange,
}: StepPaymentProps) {
  const requiresFullPayment = shippingType === 'PROVINCIA'

  const handleMethodChange = (method: 'YAPE' | 'TRANSFERENCIA' | 'EFECTIVO' | 'CONTRAENTREGA') => {
    if (method === 'CONTRAENTREGA') {
      // Contraentrega means no upfront payment
      onPaymentChange(null)
    } else {
      onPaymentChange({
        method,
        amount: payment?.amount || (requiresFullPayment ? total : 0),
        proofImageUrl: null,
        notes: null,
      })
    }
  }

  const updateField = (field: keyof PaymentInput, value: string | number | null) => {
    if (!payment) return
    onPaymentChange({ ...payment, [field]: value })
  }

  // Filter methods based on shipping type
  const availableMethods = paymentMethods.filter((m) => {
    if (m.value === 'CONTRAENTREGA') {
      return shippingType === 'DELIVERY_LIMA' && isContraentrega
    }
    return true
  })

  const selectedMethod = payment?.method || (isContraentrega ? 'CONTRAENTREGA' : null)

  return (
    <div className="space-y-6">
      {/* Payment info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Total a pagar</span>
            <span className="text-2xl font-bold">{formatCurrency(total)}</span>
          </div>
          {requiresFullPayment && (
            <p className="text-sm text-amber-600 mt-2">
              * Envio a provincia requiere pago completo
            </p>
          )}
          {isContraentrega && (
            <p className="text-sm text-blue-600 mt-2">
              * Contraentrega: el cliente pagara al recibir el pedido
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <div>
        <Label className="mb-3 block">Metodo de pago</Label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {availableMethods.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => handleMethodChange(method.value)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50',
                selectedMethod === method.value && 'border-primary bg-primary/5'
              )}
            >
              <method.icon className={cn(
                'h-6 w-6',
                selectedMethod === method.value ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className="font-medium text-sm">{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Details */}
      {payment && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto pagado (S/) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={payment.amount || ''}
                  onChange={(e) => updateField('amount', e.target.value ? Number(e.target.value) : 0)}
                  placeholder="0.00"
                />
                {requiresFullPayment && payment.amount < total && (
                  <p className="text-sm text-red-500">
                    El monto debe ser igual al total
                  </p>
                )}
                {payment.amount > 0 && payment.amount < total && !requiresFullPayment && (
                  <p className="text-sm text-amber-600">
                    Pago parcial. Pendiente: {formatCurrency(total - payment.amount)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas del pago</Label>
                <Input
                  id="notes"
                  value={payment.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value || null)}
                  placeholder="Numero de operacion, etc."
                />
              </div>
            </div>

            {/* Proof image for Yape/Transferencia */}
            {(payment.method === 'YAPE' || payment.method === 'TRANSFERENCIA') && (
              <div className="space-y-2">
                <Label>Comprobante de pago</Label>
                <ImageUpload
                  value={payment.proofImageUrl ? [{ imageUrl: payment.proofImageUrl }] : []}
                  onChange={(images) => updateField('proofImageUrl', images[0]?.imageUrl || null)}
                  maxImages={1}
                  uploadType="payments"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Skip payment option for non-provincia */}
      {!requiresFullPayment && !isContraentrega && (
        <button
          type="button"
          onClick={() => onPaymentChange(null)}
          className={cn(
            'w-full rounded-lg border p-4 text-center transition-colors hover:bg-muted/50',
            !payment && 'border-primary bg-primary/5'
          )}
        >
          <span className="font-medium">Sin pago inicial</span>
          <p className="text-sm text-muted-foreground">
            El cliente pagara despues
          </p>
        </button>
      )}
    </div>
  )
}
