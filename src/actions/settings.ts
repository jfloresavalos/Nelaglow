'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { hash, compare } from 'bcryptjs'
import { slugify } from '@/lib/utils'

// User Management (Admin only)
export async function getUsers() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado')
  }

  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createUser(data: {
  username: string
  name: string
  password: string
  role: 'ADMIN' | 'OPERATOR'
}) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado')
  }

  const existing = await prisma.user.findUnique({
    where: { username: data.username },
  })

  if (existing) {
    throw new Error('Ya existe un usuario con ese nombre de usuario')
  }

  const passwordHash = await hash(data.password, 12)

  await prisma.user.create({
    data: {
      username: data.username,
      name: data.name,
      passwordHash,
      role: data.role,
      isActive: true,
    },
  })

  revalidatePath('/settings')
}

export async function updateUser(
  userId: string,
  data: {
    name?: string
    role?: 'ADMIN' | 'OPERATOR'
    isActive?: boolean
  }
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado')
  }

  await prisma.user.update({
    where: { id: userId },
    data,
  })

  revalidatePath('/settings')
}

export async function deleteUser(userId: string) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado')
  }

  // Prevent self-deletion
  if (userId === session.user.id) {
    throw new Error('No puede eliminar su propia cuenta')
  }

  await prisma.user.delete({
    where: { id: userId },
  })

  revalidatePath('/settings')
}

// Change password
export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}) {
  const session = await auth()
  if (!session) {
    throw new Error('No autorizado')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    throw new Error('Usuario no encontrado')
  }

  const valid = await compare(data.currentPassword, user.passwordHash)
  if (!valid) {
    throw new Error('Contraseña actual incorrecta')
  }

  const newHash = await hash(data.newPassword, 12)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  })
}

// Category Management
export async function getCategories() {
  return prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function createCategory(data: { name: string }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado')
  }

  const slug = slugify(data.name)

  const existing = await prisma.category.findUnique({
    where: { slug },
  })

  if (existing) {
    throw new Error('Ya existe una categoria con ese nombre')
  }

  await prisma.category.create({
    data: {
      name: data.name,
      slug,
    },
  })

  revalidatePath('/settings')
  revalidatePath('/products')
}

export async function updateCategory(categoryId: string, data: { name: string }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado')
  }

  const slug = slugify(data.name)

  const existing = await prisma.category.findFirst({
    where: {
      slug,
      id: { not: categoryId },
    },
  })

  if (existing) {
    throw new Error('Ya existe otra categoria con ese nombre')
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: data.name,
      slug,
    },
  })

  revalidatePath('/settings')
  revalidatePath('/products')
}

export async function deleteCategory(categoryId: string) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado')
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { products: true } } },
  })

  if (!category) {
    throw new Error('Categoria no encontrada')
  }

  if (category._count.products > 0) {
    throw new Error('No se puede eliminar una categoria con productos asociados')
  }

  await prisma.category.delete({
    where: { id: categoryId },
  })

  revalidatePath('/settings')
  revalidatePath('/products')
}
