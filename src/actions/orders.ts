'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { createOrderSchema, paymentSchema, type CreateOrderInput, type PaymentInput } from '@/lib/validations/order'
import { serializeData } from '@/lib/utils'
import { Prisma, OrderStatus, ShippingType } from '@/generated/prisma'
import type { OrderForList } from '@/types'

// Generate atomic order number
async function generateOrderNumber(): Promise<string> {
  const counter = await prisma.orderCounter.update({
    where: { id: 'default' },
    data: { lastNum: { increment: 1 } },
  })
  return `NGL-${String(counter.lastNum).padStart(4, '0')}`
}

export async function getOrders(params?: {
  search?: string
  status?: OrderStatus
  shippingType?: ShippingType
  page?: number
  pageSize?: number
}) {
  const { search, status, shippingType, page = 1, pageSize = 20 } = params || {}

  const where: Prisma.OrderWhereInput = {}

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
      { client: { phone: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (status) {
    where.status = status
  }

  if (shippingType) {
    where.shippingType = shippingType
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        status: true,
        shippingType: true,
        totalAmount: true,
        paidAmount: true,
        remainingAmount: true,
        client: { select: { name: true, phone: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ])

  // serializeData convierte Decimal → number en runtime; el cast refleja eso
  return { orders: serializeData(orders) as unknown as OrderForList[], total, pages: Math.ceil(total / pageSize) }
}

export async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      user: true,
      items: {
        include: { product: { include: { images: true } } },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
      },
      shipping: true,
      statusHistory: {
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  return order ? serializeData(order) : null
}

export async function createOrder(data: CreateOrderInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  const validated = createOrderSchema.parse(data)

  // Calculate totals
  let subtotal = 0
  for (const item of validated.items) {
    subtotal += item.unitPrice * item.quantity
  }

  const shippingAmount = validated.shipping?.deliveryFee || 0
  const totalAmount = subtotal + shippingAmount

  // Validate business rules
  if (validated.shippingType === 'PROVINCIA') {
    // Provincia requires full payment upfront
    if (!validated.payment || validated.payment.amount < totalAmount) {
      throw new Error('Envio a provincia requiere pago completo')
    }
  }

  if (validated.shipping?.isContraentrega && validated.shippingType !== 'DELIVERY_LIMA') {
    throw new Error('Contraentrega solo disponible para delivery Lima')
  }

  // Execute transaction
  const order = await prisma.$transaction(async (tx) => {
    // Verify stock availability
    for (const item of validated.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      })
      if (!product) {
        throw new Error(`Producto no encontrado: ${item.productId}`)
      }
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`)
      }
    }

    // Generate order number
    const orderNumber = await generateOrderNumber()

    // Calculate payment amounts
    const paidAmount = validated.payment?.amount || 0
    const remainingAmount = totalAmount - paidAmount

    // Determine initial status
    let status: OrderStatus = 'PENDING'
    if (paidAmount >= totalAmount) {
      status = 'PAID'
    } else if (paidAmount > 0) {
      status = 'PARTIAL_PAYMENT'
    }

    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        clientId: validated.clientId,
        userId: session.user.id,
        status,
        shippingType: validated.shippingType,
        subtotalAmount: subtotal,
        shippingAmount,
        totalAmount,
        paidAmount,
        remainingAmount,
        notes: validated.notes,
        items: {
          create: validated.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.unitPrice * item.quantity,
          })),
        },
        ...(validated.shipping && {
          shipping: {
            create: {
              recipientName: validated.shipping.recipientName,
              recipientPhone: validated.shipping.recipientPhone,
              recipientAddress: validated.shipping.recipientAddress,
              department: validated.shipping.department,
              province: validated.shipping.province,
              district: validated.shipping.district,
              agencyName: validated.shipping.agencyName,
              agencyAddress: validated.shipping.agencyAddress,
              deliveryFee: validated.shipping.deliveryFee,
              isContraentrega: validated.shipping.isContraentrega,
            },
          },
        }),
        ...(validated.payment && {
          payments: {
            create: {
              amount: validated.payment.amount,
              method: validated.payment.method,
              proofImageUrl: validated.payment.proofImageUrl,
              notes: validated.payment.notes,
            },
          },
        }),
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: status,
            changedBy: session.user.id,
            notes: 'Pedido creado',
          },
        },
      },
      include: {
        client: true,
        items: { include: { product: true } },
        payments: true,
        shipping: true,
      },
    })

    // Decrement stock + create SALE_OUT movements
    for (const item of validated.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'SALE_OUT',
          quantity: item.quantity,
          reference: orderNumber,
          orderId: newOrder.id,
          userId: session.user.id,
        },
      })
    }

    return newOrder
  })

  revalidatePath('/orders')
  revalidatePath('/dashboard')
  revalidatePath('/products')
  revalidatePath('/inventory')

  return serializeData(order)
}

export async function addPayment(orderId: string, data: PaymentInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  const validated = paymentSchema.parse(data)

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order) throw new Error('Pedido no encontrado')

  if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
    throw new Error('No se puede agregar pago a un pedido entregado o cancelado')
  }

  const newPaidAmount = Number(order.paidAmount) + validated.amount
  const newRemainingAmount = Number(order.totalAmount) - newPaidAmount

  // Determine new status
  let newStatus = order.status
  if (newPaidAmount >= Number(order.totalAmount)) {
    newStatus = 'PAID'
  } else if (newPaidAmount > 0 && order.status === 'PENDING') {
    newStatus = 'PARTIAL_PAYMENT'
  }

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        orderId,
        amount: validated.amount,
        method: validated.method,
        proofImageUrl: validated.proofImageUrl,
        notes: validated.notes,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
      },
    }),
    ...(newStatus !== order.status
      ? [
          prisma.orderStatusHistory.create({
            data: {
              orderId,
              fromStatus: order.status,
              toStatus: newStatus,
              changedBy: session.user.id,
              notes: `Pago registrado: S/ ${validated.amount}`,
            },
          }),
        ]
      : []),
  ])

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  revalidatePath('/dashboard')
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) throw new Error('Pedido no encontrado')

  // Validate status transitions
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['STOCK_RESERVED', 'PARTIAL_PAYMENT', 'PAID', 'CANCELLED'],
    STOCK_RESERVED: ['PARTIAL_PAYMENT', 'PAID', 'CANCELLED'],
    PARTIAL_PAYMENT: ['PAID', 'CANCELLED'],
    PAID: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
  }

  if (!validTransitions[order.status].includes(newStatus)) {
    throw new Error(`No se puede cambiar de ${order.status} a ${newStatus}`)
  }

  // If cancelling, restore stock + create RETURN_IN movements
  if (newStatus === 'CANCELLED') {
    await prisma.$transaction([
      ...order.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      ),
      ...order.items.map((item) =>
        prisma.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'RETURN_IN',
            quantity: item.quantity,
            reference: order.orderNumber,
            orderId,
            userId: session.user.id,
            notes: notes || 'Pedido cancelado',
          },
        })
      ),
      prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: newStatus,
          changedBy: session.user.id,
          notes: notes || 'Pedido cancelado',
        },
      }),
    ])
  } else {
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: newStatus,
          changedBy: session.user.id,
          notes,
        },
      }),
      ...(newStatus === 'SHIPPED'
        ? [
            prisma.shipping.update({
              where: { orderId },
              data: { shippedAt: new Date(), deliveryStatus: 'IN_TRANSIT' },
            }),
          ]
        : []),
      ...(newStatus === 'DELIVERED'
        ? [
            prisma.shipping.update({
              where: { orderId },
              data: { deliveredAt: new Date(), deliveryStatus: 'DELIVERED' },
            }),
          ]
        : []),
    ])
  }

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  revalidatePath('/dashboard')
  revalidatePath('/products')
  revalidatePath('/inventory')
}

export async function updateShipping(
  orderId: string,
  data: {
    trackingCode?: string
    agencyVoucherUrl?: string
    internalCode?: string
  }
) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  await prisma.shipping.update({
    where: { orderId },
    data,
  })

  revalidatePath(`/orders/${orderId}`)
}

// ── Agregar ítem a pedido existente ──────────────────────────────────────────

export async function addItemToOrder(
  orderId: string,
  item: { productId: string; quantity: number; unitPrice: number }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order) throw new Error('Pedido no encontrado')

  if (['CANCELLED', 'DELIVERED', 'SHIPPED'].includes(order.status)) {
    throw new Error('No se pueden agregar productos a un pedido cancelado, entregado o enviado')
  }

  const subtotal = item.unitPrice * item.quantity

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: item.productId } })
    if (!product) throw new Error('Producto no encontrado')
    if (product.stock < item.quantity) {
      throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`)
    }

    await tx.orderItem.create({
      data: {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal,
      },
    })

    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })

    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        type: 'SALE_OUT',
        quantity: item.quantity,
        reference: order.orderNumber,
        orderId,
        userId: session.user.id,
      },
    })

    const newTotal = Number(order.totalAmount) + subtotal
    const newRemaining = Number(order.remainingAmount) + subtotal

    await tx.order.update({
      where: { id: orderId },
      data: {
        subtotalAmount: { increment: subtotal },
        totalAmount: newTotal,
        remainingAmount: newRemaining,
      },
    })
  })

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  revalidatePath('/dashboard')
  revalidatePath('/products')
  revalidatePath('/inventory')
}

// ── Pedido Histórico ─────────────────────────────────────────────────────────
// Registra pedidos ya despachados (físicos) sin descontar stock ni crear movimientos kardex.

export type HistoricalOrderInput = {
  // Cliente
  clientName: string
  clientPhone: string
  clientDni?: string
  // Pedido
  orderDate: string         // ISO date string (YYYY-MM-DD)
  finalStatus: 'SHIPPED' | 'DELIVERED'
  notes?: string
  // Productos
  items: { productId: string; quantity: number; unitPrice: number }[]
  // Envío Shalom
  shipping: {
    recipientName: string
    recipientPhone: string
    department: string
    province: string
    agencyName: string
    trackingCode?: string
  }
  // Pago
  paidAmount: number
  paymentMethod: 'YAPE' | 'TRANSFERENCIA' | 'EFECTIVO' | 'CONTRAENTREGA' | null
}

export async function createHistoricalOrder(data: HistoricalOrderInput) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autorizado')

  // ── Find or create client ──────────────────────────────────────────────────
  let client = data.clientDni
    ? await prisma.client.findUnique({ where: { dni: data.clientDni } })
    : null

  if (!client && data.clientPhone) {
    client = await prisma.client.findFirst({
      where: { phone: data.clientPhone },
    })
  }

  if (!client) {
    client = await prisma.client.create({
      data: {
        name: data.clientName,
        phone: data.clientPhone || null,
        dni: data.clientDni || null,
      },
    })
  }

  // ── Calculate totals ──────────────────────────────────────────────────────
  const subtotal = data.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)
  const totalAmount = subtotal   // Shalom delivery is NOT included in total (paid by client at pickup)
  const paidAmount = Math.min(data.paidAmount, totalAmount)
  const remainingAmount = totalAmount - paidAmount

  const status: OrderStatus =
    data.finalStatus === 'DELIVERED' ? 'DELIVERED' :
    paidAmount >= totalAmount       ? 'SHIPPED' :
                                      'SHIPPED'

  // ── Create order (historical = set createdAt to orderDate) ────────────────
  const orderDate = new Date(data.orderDate)
  const orderNumber = await generateOrderNumber()

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        clientId: client!.id,
        userId: session.user.id,
        status,
        shippingType: 'PROVINCIA',
        subtotalAmount: subtotal,
        shippingAmount: 0,
        totalAmount,
        paidAmount,
        remainingAmount,
        notes: data.notes || null,
        createdAt: orderDate,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.unitPrice * item.quantity,
          })),
        },
        shipping: {
          create: {
            recipientName: data.shipping.recipientName,
            recipientPhone: data.shipping.recipientPhone,
            department: data.shipping.department,
            province: data.shipping.province,
            agencyName: data.shipping.agencyName,
            trackingCode: data.shipping.trackingCode || null,
          },
        },
        ...(paidAmount > 0 && data.paymentMethod && {
          payments: {
            create: {
              amount: paidAmount,
              method: data.paymentMethod,
              receivedAt: orderDate,
            },
          },
        }),
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: status,
            changedBy: session.user.id,
            notes: 'Pedido histórico ingresado manualmente',
          },
        },
      },
    })

    return newOrder
  })

  revalidatePath('/orders')
  revalidatePath('/dashboard')

  return { orderId: order.id, orderNumber: order.orderNumber }
}
