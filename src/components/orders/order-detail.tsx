'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ImageUpload } from '@/components/shared/image-upload'
import { ProductPickerDialog } from '@/components/shared/product-picker-dialog'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ORDER_STATUS_LABELS, SHIPPING_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/types'
import { ORDER_STATUS_COLORS, SHIPPING_TYPE_COLORS } from '@/lib/constants'
import { addPayment, updateOrderStatus, updateShipping, addItemToOrder } from '@/actions/orders'
import { NotifyClientButton } from '@/components/orders/notify-client-button'
import type { OrderWithRelations } from '@/types'
import type { OrderStatus } from '@/generated/prisma'
import type { PickedItem } from '@/components/shared/product-picker-dialog'

interface OrderDetailProps {
  order: OrderWithRelations
}

export function OrderDetail({ order }: OrderDetailProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showShipDialog, setShowShipDialog] = useState(false)

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'YAPE' | 'TRANSFERENCIA' | 'EFECTIVO' | 'CONTRAENTREGA'>('YAPE')
  const [paymentProof, setPaymentProof] = useState<string | null>(null)
  const [paymentNotes, setPaymentNotes] = useState('')

  // Shipping form state
  const [trackingCode, setTrackingCode] = useState(order.shipping?.trackingCode || '')
  const [voucherUrl, setVoucherUrl] = useState<string | null>(order.shipping?.agencyVoucherUrl || null)

  const handleAddPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Ingrese un monto valido')
      return
    }

    setIsLoading(true)
    try {
      await addPayment(order.id, {
        amount: Number(paymentAmount),
        method: paymentMethod,
        proofImageUrl: paymentProof,
        notes: paymentNotes || null,
      })
      toast.success('Pago registrado correctamente')
      setShowPaymentDialog(false)
      setPaymentAmount('')
      setPaymentProof(null)
      setPaymentNotes('')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar pago')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setIsLoading(true)
    try {
      if (newStatus === 'SHIPPED' && order.shippingType === 'PROVINCIA') {
        // Update shipping info first
        await updateShipping(order.id, {
          trackingCode: trackingCode || undefined,
          agencyVoucherUrl: voucherUrl || undefined,
        })
      }
      await updateOrderStatus(order.id, newStatus)
      toast.success(`Estado actualizado a ${ORDER_STATUS_LABELS[newStatus]}`)
      setShowShipDialog(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar estado')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      await updateOrderStatus(order.id, 'CANCELLED')
      toast.success('Pedido cancelado. Stock restaurado.')
      setShowCancelDialog(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cancelar pedido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = async (picked: PickedItem) => {
    setIsLoading(true)
    try {
      await addItemToOrder(order.id, {
        productId: picked.productId,
        quantity: picked.quantity,
        unitPrice: picked.unitPrice,
      })
      toast.success(`${picked.productName} agregado al pedido`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al agregar producto')
    } finally {
      setIsLoading(false)
    }
  }

  const canAddPayment = !['DELIVERED', 'CANCELLED'].includes(order.status) && Number(order.remainingAmount) > 0
  const canAddProducts = !['CANCELLED', 'DELIVERED', 'SHIPPED'].includes(order.status)
  const canMarkShipped = order.status === 'PAID'
  const canMarkDelivered = order.status === 'SHIPPED'
  const canCancel = !['DELIVERED', 'CANCELLED'].includes(order.status)

  return (
    <div className="space-y-6">
      {/* Header with Status and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Badge className={`${ORDER_STATUS_COLORS[order.status]} text-base px-3 py-1`}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
          <Badge variant="outline" className={SHIPPING_TYPE_COLORS[order.shippingType]}>
            {SHIPPING_TYPE_LABELS[order.shippingType]}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAddProducts && (
            <ProductPickerDialog
              onAdd={handleAddProduct}
              disabled={isLoading}
              triggerLabel="Agregar Producto"
            />
          )}
          {canAddPayment && (
            <Button onClick={() => setShowPaymentDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Pago
            </Button>
          )}
          {canMarkShipped && (
            <Button onClick={() => {
              if (order.shippingType === 'PROVINCIA') {
                setShowShipDialog(true)
              } else {
                handleStatusChange('SHIPPED')
              }
            }}>
              <Truck className="mr-2 h-4 w-4" />
              Marcar Enviado
            </Button>
          )}
          {canMarkDelivered && (
            <Button onClick={() => handleStatusChange('DELIVERED')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar Entregado
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <div className="overflow-x-auto">
          <TabsList className="whitespace-nowrap">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="payments">
              Pagos ({order.payments.length})
            </TabsTrigger>
            <TabsTrigger value="shipping">Envio</TabsTrigger>
            <TabsTrigger value="timeline">Historial</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Client */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.client.name}</p>
                {order.client.phone && <p className="text-sm text-muted-foreground">{order.client.phone}</p>}
                {order.client.email && <p className="text-sm text-muted-foreground">{order.client.email}</p>}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotalAmount))}</span>
                </div>
                {Number(order.shippingAmount) > 0 && (
                  <div className="flex justify-between">
                    <span>Envio</span>
                    <span>{formatCurrency(Number(order.shippingAmount))}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(Number(order.totalAmount))}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Pagado</span>
                  <span>{formatCurrency(Number(order.paidAmount))}</span>
                </div>
                {Number(order.remainingAmount) > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Pendiente</span>
                    <span>{formatCurrency(Number(order.remainingAmount))}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Productos ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-16 w-16 rounded bg-gray-100 overflow-hidden">
                      {item.product.images?.[0] && (
                        <Image
                          src={item.product.images[0].thumbnailUrl || item.product.images[0].imageUrl}
                          alt={item.product.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(Number(item.unitPrice))} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(Number(item.subtotal))}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-6">
              {order.payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay pagos registrados
                </div>
              ) : (
                <div className="space-y-4">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {PAYMENT_METHOD_LABELS[payment.method]}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(payment.createdAt)}
                          </span>
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-green-600">
                        +{formatCurrency(Number(payment.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardContent className="pt-6">
              {order.shipping ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Destinatario</Label>
                      <p className="font-medium">{order.shipping.recipientName}</p>
                      <p>{order.shipping.recipientPhone}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Direccion</Label>
                      <p>{order.shipping.recipientAddress}</p>
                      {order.shipping.department && (
                        <p>
                          {order.shipping.district && `${order.shipping.district}, `}
                          {order.shipping.province && `${order.shipping.province}, `}
                          {order.shipping.department}
                        </p>
                      )}
                    </div>
                  </div>
                  {order.shipping.agencyName && (
                    <div>
                      <Label className="text-muted-foreground">Agencia</Label>
                      <p>{order.shipping.agencyName}</p>
                      {order.shipping.agencyAddress && <p>{order.shipping.agencyAddress}</p>}
                    </div>
                  )}
                  {order.shipping.trackingCode && (
                    <div>
                      <Label className="text-muted-foreground">Codigo de seguimiento</Label>
                      <p className="font-mono font-bold">{order.shipping.trackingCode}</p>
                    </div>
                  )}
                  {order.shipping.isContraentrega && (
                    <Badge>Contraentrega</Badge>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Recojo en tienda - Sin envio
                </div>
              )}

              {/* Notify client — solo para Provincia: la cliente necesita el código para recoger en agencia */}
              {order.status === 'SHIPPED' && order.shippingType === 'PROVINCIA' && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                    <Bell className="h-4 w-4" />
                    <span>Notificación al cliente</span>
                  </div>
                  <NotifyClientButton order={order} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {order.statusHistory.map((history, idx) => (
                  <div key={history.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      {idx < order.statusHistory.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <Badge className={ORDER_STATUS_COLORS[history.toStatus]}>
                          {ORDER_STATUS_LABELS[history.toStatus]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDateTime(history.createdAt)} por {history.user.name}
                      </p>
                      {history.notes && (
                        <p className="text-sm mt-1">{history.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Pendiente: {formatCurrency(Number(order.remainingAmount))}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Metodo</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YAPE">Yape</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                  <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                  <SelectItem value="CONTRAENTREGA">Contraentrega</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monto (S/)</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Numero de operacion..."
              />
            </div>
            {(paymentMethod === 'YAPE' || paymentMethod === 'TRANSFERENCIA') && (
              <div className="space-y-2">
                <Label>Comprobante</Label>
                <ImageUpload
                  value={paymentProof ? [{ imageUrl: paymentProof }] : []}
                  onChange={(images) => setPaymentProof(images[0]?.imageUrl || null)}
                  maxImages={1}
                  uploadType="payments"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPayment} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ship Dialog (for Provincia) */}
      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Enviado</DialogTitle>
            <DialogDescription>
              Ingrese los datos del envio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Codigo de seguimiento</Label>
              <Input
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Codigo de la agencia"
              />
            </div>
            <div className="space-y-2">
              <Label>Voucher de agencia</Label>
              <ImageUpload
                value={voucherUrl ? [{ imageUrl: voucherUrl }] : []}
                onChange={(images) => setVoucherUrl(images[0]?.imageUrl || null)}
                maxImages={1}
                uploadType="vouchers"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShipDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleStatusChange('SHIPPED')} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion cancelara el pedido y restaurara el stock de los productos.
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Cancelando...' : 'Confirmar Cancelacion'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
