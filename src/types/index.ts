import type {
  User,
  Category,
  Product,
  ProductImage,
  Client,
  Order,
  OrderItem,
  Payment,
  Shipping,
  OrderStatusHistory,
  StockMovement,
  StockMovementType,
  OrderStatus,
  ShippingType,
} from '@/generated/prisma'

export type { User, Category, Product, ProductImage, Client, Order, OrderItem, Payment, Shipping, OrderStatusHistory, StockMovement, StockMovementType, OrderStatus, ShippingType }

// Product with relations
export type ProductWithImages = Product & {
  images: ProductImage[]
  category: Category | null
  variants?: ProductVariant[]  // present when fetched with includeVariants: true
}

// Product variant (leaf node with color)
export type ProductVariant = Product & {
  images?: ProductImage[]
}

// Product as parent with its color variants (for product detail + wizard)
export type ProductForWizard = Product & {
  images: ProductImage[]
  category: Category | null
  variants: ProductVariant[]
}

// Stock movement with all relations (for Kardex table)
export type StockMovementWithRelations = StockMovement & {
  product: Product & { images: ProductImage[] }
  user: User
  order: Order | null
}

// Wizard item state (client-side only, not sent to server)
export interface WizardItemState {
  productId: string        // ID de la variante (o producto standalone)
  quantity: number
  unitPrice: number        // precio final (editado o por defecto)
  originalUnitPrice: number
  productName: string      // "Termo 500ml — Rojo" o "Termo 500ml"
}

// Order for list view — solo los campos que muestra la tabla/cards
export type OrderForList = {
  id: string
  orderNumber: string
  createdAt: Date
  status: OrderStatus
  shippingType: ShippingType
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  client: { name: string; phone: string | null }
  _count: { items: number }
}

// Order with all relations (for detail view)
export type OrderWithRelations = Order & {
  client: Client
  user: User
  items: (OrderItem & { product: Product & { images?: ProductImage[] } })[]
  payments: Payment[]
  shipping: Shipping | null
  statusHistory: (OrderStatusHistory & { user: User })[]
}

// Client with orders count
export type ClientWithOrdersCount = Client & {
  _count: { orders: number }
}

// Dashboard stats
export interface DashboardStats {
  todaySales: number
  weekSales: number
  monthSales: number
  pendingOrders: number
  lowStockProducts: number
}

// Sales chart data
export interface SalesChartData {
  date: string
  amount: number
}

// Order status labels
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  STOCK_RESERVED: 'Stock Reservado',
  PARTIAL_PAYMENT: 'Pago Parcial',
  PAID: 'Pagado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

// Shipping type labels
export const SHIPPING_TYPE_LABELS: Record<string, string> = {
  PROVINCIA: 'Envio a Provincia',
  DELIVERY_LIMA: 'Delivery Lima',
  RECOJO_TIENDA: 'Recojo en Tienda',
}

// Payment method labels
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  YAPE: 'Yape',
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
  CONTRAENTREGA: 'Contraentrega',
}

// Delivery status labels
export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_TRANSIT: 'En Transito',
  DELIVERED: 'Entregado',
  FAILED: 'Fallido',
}

// ─── Finance types ────────────────────────────────────────────────────────────

export type FinancePeriod = 'week' | 'month' | 'year'

export interface FinanceStats {
  totalIngresos: number
  totalEgresos: number
  gananciaNeta: number
  pendienteCobro: number
  inventarioValorizado: number
  ingresosPorMetodo: {
    YAPE: number
    TRANSFERENCIA: number
    EFECTIVO: number
    CONTRAENTREGA: number
  }
}

export interface FinanceChartPoint {
  date: string    // 'yyyy-MM-dd'
  ingresos: number
  egresos: number
}

export interface TransactionRow {
  id: string
  date: string    // ISO string serializado
  type: 'INGRESO' | 'EGRESO'
  description: string
  amount: number
  method?: string
}

// ─── Reports types ─────────────────────────────────────────────────────────────

export interface DailyCloseOrder {
  orderId: string
  orderNumber: string
  clientName: string
  totalAmount: number
  paidAmount: number
  status: string
  shippingType: string
}

export interface DailyCloseData {
  date: string
  totalCobrado: number
  cobradoPorMetodo: Record<string, number>
  pedidosCount: number
  pedidosList: DailyCloseOrder[]
}

export interface PendingPaymentRow {
  orderId: string
  orderNumber: string
  clientName: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  daysPending: number
  shippingType: string
  status: string
  createdAt: string
}

export interface TopProductRow {
  productId: string
  productName: string
  color: string | null
  totalQty: number
  totalRevenue: number
  imageUrl: string | null
}

export interface RestockRow {
  productId: string
  productName: string
  color: string | null
  stock: number
  lowStockThreshold: number
  unitsNeeded: number
  costPrice: number | null
  restockCost: number | null
  categoryName: string | null
  imageUrl: string | null
}
