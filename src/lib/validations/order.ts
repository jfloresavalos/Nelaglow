import { z } from 'zod'

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Producto requerido'),
  quantity: z.coerce.number().int().positive('Cantidad debe ser mayor a 0'),
  unitPrice: z.coerce.number().positive(),
})

export const shippingSchema = z.object({
  recipientName: z.string().min(1, 'Nombre del destinatario requerido'),
  recipientPhone: z.string().min(1, 'Telefono del destinatario requerido'),
  recipientAddress: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  agencyName: z.string().optional().nullable(),
  agencyAddress: z.string().optional().nullable(),
  deliveryFee: z.coerce.number().min(0).optional().nullable(),
  isContraentrega: z.boolean().default(false),
})

export const paymentSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  method: z.enum(['YAPE', 'TRANSFERENCIA', 'EFECTIVO', 'CONTRAENTREGA']),
  proofImageUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const createOrderSchema = z.object({
  clientId: z.string().min(1, 'Cliente requerido'),
  shippingType: z.enum(['PROVINCIA', 'DELIVERY_LIMA', 'RECOJO_TIENDA']),
  items: z.array(orderItemSchema).min(1, 'Debe agregar al menos un producto'),
  shipping: shippingSchema.optional().nullable(),
  payment: paymentSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type OrderItemInput = z.infer<typeof orderItemSchema>
export type ShippingInput = z.infer<typeof shippingSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
