import { z } from 'zod'

export const stockMovementSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto'),
  type: z.enum(['PURCHASE_IN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT']),
  quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  unitCost: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const bulkStockEntrySchema = z.object({
  rows: z.array(stockMovementSchema).min(1, 'Agrega al menos un producto'),
})

export type StockMovementFormValues = z.infer<typeof stockMovementSchema>
export type BulkStockEntryValues = z.infer<typeof bulkStockEntrySchema>
