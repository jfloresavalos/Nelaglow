import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().optional(),
  color: z.string().optional().nullable(),
  price: z.coerce.number().positive('El precio debe ser mayor a 0'),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo'),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export type ProductFormValues = z.infer<typeof productSchema>

export const productImageSchema = z.object({
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
})
