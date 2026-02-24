'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { clientSchema, type ClientFormValues } from '@/lib/validations/client'
import { Prisma } from '@/generated/prisma'

export async function getClients(params?: {
  search?: string
  page?: number
  pageSize?: number
}) {
  const { search, page = 1, pageSize = 20 } = params || {}

  const where: Prisma.ClientWhereInput = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { dni: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.client.count({ where }),
  ])

  return { clients, total, pages: Math.ceil(total / pageSize) }
}

export async function getClient(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      orders: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: { orders: true },
      },
    },
  })
}

export async function lookupDni(dni: string): Promise<{ name: string } | null> {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  if (!/^\d{8}$/.test(dni)) throw new Error('El DNI debe tener 8 dígitos')

  const token = process.env.RENIEC_API_TOKEN
  if (!token) throw new Error('RENIEC_API_TOKEN no configurado en .env')

  const res = await fetch(`https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`, {
    headers: { Authorization: `Bearer ${token}` },
    // No cache — datos en tiempo real
    cache: 'no-store',
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error('Error al consultar RENIEC. Intenta de nuevo.')

  const data = await res.json()
  const fullName = [data.nombres, data.apellidoPaterno, data.apellidoMaterno]
    .filter(Boolean)
    .join(' ')
    .trim()

  return fullName ? { name: fullName } : null
}

export async function searchClients(query: string) {
  if (!query || query.length < 2) return []

  return prisma.client.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { dni: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 10,
  })
}

export async function createClient(data: ClientFormValues) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const validated = clientSchema.parse(data)

  // Check if DNI already exists
  if (validated.dni) {
    const existing = await prisma.client.findUnique({
      where: { dni: validated.dni },
    })
    if (existing) {
      throw new Error('Ya existe un cliente con ese DNI')
    }
  }

  const client = await prisma.client.create({
    data: {
      ...validated,
      email: validated.email || null,
    },
  })

  revalidatePath('/clients')

  return client
}

export async function updateClient(id: string, data: ClientFormValues) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const validated = clientSchema.parse(data)

  // Check if DNI already exists (excluding current client)
  if (validated.dni) {
    const existing = await prisma.client.findFirst({
      where: {
        dni: validated.dni,
        id: { not: id },
      },
    })
    if (existing) {
      throw new Error('Ya existe otro cliente con ese DNI')
    }
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...validated,
      email: validated.email || null,
    },
  })

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)

  return client
}

export async function deleteClient(id: string) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  // Check if client has orders
  const client = await prisma.client.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  })

  if (!client) {
    throw new Error('Cliente no encontrado')
  }

  if (client._count.orders > 0) {
    throw new Error('No se puede eliminar un cliente con pedidos asociados')
  }

  await prisma.client.delete({ where: { id } })

  revalidatePath('/clients')
}
