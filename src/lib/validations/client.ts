import { z } from 'zod'

export const clientSchema = z.object({
  dni: z.string().optional().nullable(),
  name: z.string().min(1, 'El nombre es requerido').max(200),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email invalido').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type ClientFormValues = z.infer<typeof clientSchema>
