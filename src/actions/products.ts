'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { productSchema, type ProductFormValues } from '@/lib/validations/product'
import { deleteImage } from '@/lib/upload'
import { serializeData } from '@/lib/utils'
import { Prisma } from '@/generated/prisma'
import { unstable_cache } from 'next/cache'

export async function getProducts(params?: {
  search?: string
  categoryId?: string
  isActive?: boolean
  page?: number
  pageSize?: number
  orderBy?: Prisma.ProductOrderByWithRelationInput
  parentOnly?: boolean      // solo productos raíz (sin parentProductId)
  includeVariants?: boolean // incluir variantes de color anidadas
  sellableOnly?: boolean    // excluye padres con variantes — solo variantes + standalone
}) {
  const {
    search,
    categoryId,
    isActive,
    page = 1,
    pageSize = 20,
    orderBy,
    parentOnly,
    includeVariants,
    sellableOnly,
  } = params || {}

  const where: Prisma.ProductWhereInput = {}

  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }

  if (categoryId) {
    where.categoryId = categoryId
  }

  if (isActive !== undefined) {
    where.isActive = isActive
  }

  if (parentOnly) {
    where.parentProductId = null
  }

  // sellableOnly: muestra solo variantes (tienen padre) + standalone (sin padre y sin hijos)
  // excluye padres que tienen variantes (su stock no es gestionable directamente)
  if (sellableOnly) {
    where.OR = [
      { parentProductId: { not: null } },            // es variante de color
      { parentProductId: null, variants: { none: {} } }, // es producto standalone
    ]
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        ...(includeVariants && {
          variants: {
            where: { isActive: true },
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
            orderBy: { color: 'asc' },
          },
        }),
      },
      orderBy: orderBy || { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ])

  return { products: serializeData(products), total, pages: Math.ceil(total / pageSize) }
}

// Búsqueda lazy para el wizard de pedidos (padres con sus variantes de color)
export async function getProductsForWizard(search: string) {
  if (!search || search.trim().length < 2) return []

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      parentProductId: null,
      name: { contains: search.trim(), mode: 'insensitive' },
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      variants: {
        where: { isActive: true },
        include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
        orderBy: { color: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
    take: 20,
  })

  return serializeData(products)
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      // Include color variants (children)
      variants: {
        include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
        orderBy: { color: 'asc' },
      },
      // Include parent product (if this is a variant)
      parent: {
        include: {
          variants: {
            include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
            orderBy: { color: 'asc' },
          },
        },
      },
    },
  })
  return product ? serializeData(product) : null
}

export async function createProduct(
  data: ProductFormValues,
  imageUrls: { imageUrl: string; thumbnailUrl?: string }[]
) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const validated = productSchema.parse(data)

  const product = await prisma.product.create({
    data: {
      ...validated,
      images: {
        create: imageUrls.map((img, index) => ({
          imageUrl: img.imageUrl,
          thumbnailUrl: img.thumbnailUrl,
          isPrimary: index === 0,
          sortOrder: index,
        })),
      },
    },
    include: {
      images: true,
      category: true,
    },
  })

  revalidatePath('/products')
  revalidatePath('/dashboard')

  return serializeData(product)
}

export async function updateProduct(
  id: string,
  data: ProductFormValues,
  imageUrls?: { imageUrl: string; thumbnailUrl?: string }[],
  deletedImageIds?: string[]
) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const validated = productSchema.parse(data)

  // Delete removed images from storage
  if (deletedImageIds && deletedImageIds.length > 0) {
    const imagesToDelete = await prisma.productImage.findMany({
      where: { id: { in: deletedImageIds } },
    })

    for (const img of imagesToDelete) {
      await deleteImage(img.imageUrl)
      if (img.thumbnailUrl) await deleteImage(img.thumbnailUrl)
    }

    await prisma.productImage.deleteMany({
      where: { id: { in: deletedImageIds } },
    })
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...validated,
      ...(imageUrls && {
        images: {
          create: imageUrls.map((img, index) => ({
            imageUrl: img.imageUrl,
            thumbnailUrl: img.thumbnailUrl,
            isPrimary: false,
            sortOrder: 100 + index,
          })),
        },
      }),
    },
    include: {
      images: true,
      category: true,
    },
  })

  revalidatePath('/products')
  revalidatePath(`/products/${id}`)
  revalidatePath('/dashboard')

  return serializeData(product)
}

export async function deleteProduct(id: string) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  })

  if (!product) throw new Error('Producto no encontrado')

  // Guard: cannot delete a parent that has variants
  const variantCount = await prisma.product.count({ where: { parentProductId: id } })
  if (variantCount > 0) {
    throw new Error(
      `No se puede eliminar: este producto tiene ${variantCount} variante(s) de color. Elimínalas primero.`
    )
  }

  // Delete images from storage
  for (const img of product.images) {
    await deleteImage(img.imageUrl)
    if (img.thumbnailUrl) await deleteImage(img.thumbnailUrl)
  }

  await prisma.product.delete({ where: { id } })

  revalidatePath('/products')
  revalidatePath('/dashboard')
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: { isActive } })
    // Cascade: deactivating a parent deactivates all its variants
    if (!isActive) {
      await tx.product.updateMany({
        where: { parentProductId: id },
        data: { isActive: false },
      })
    }
  })

  revalidatePath('/products')
  revalidatePath(`/products/${id}`)
}

// Create a color variant linked to a parent product
export async function createProductVariant(
  parentId: string,
  data: ProductFormValues,
  imageUrls: { imageUrl: string; thumbnailUrl?: string }[]
) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const parent = await prisma.product.findUnique({ where: { id: parentId } })
  if (!parent) throw new Error('Producto padre no encontrado')
  if (parent.parentProductId) {
    throw new Error('No se puede crear una variante de una variante')
  }

  const validated = productSchema.parse(data)

  const variant = await prisma.product.create({
    data: {
      ...validated,
      parentProductId: parentId,
      // Inherit category from parent if not specified
      categoryId: validated.categoryId ?? parent.categoryId,
      images: {
        create: imageUrls.map((img, index) => ({
          imageUrl: img.imageUrl,
          thumbnailUrl: img.thumbnailUrl,
          isPrimary: index === 0,
          sortOrder: index,
        })),
      },
    },
    include: { images: true, category: true },
  })

  revalidatePath('/products')
  revalidatePath(`/products/${parentId}`)

  return serializeData(variant)
}

export async function updateProductImages(
  productId: string,
  imageIds: string[],
  primaryImageId?: string
) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  // Update sort orders
  for (let i = 0; i < imageIds.length; i++) {
    await prisma.productImage.update({
      where: { id: imageIds[i] },
      data: {
        sortOrder: i,
        isPrimary: imageIds[i] === primaryImageId,
      },
    })
  }

  // Make sure only one is primary
  if (primaryImageId) {
    await prisma.productImage.updateMany({
      where: {
        productId,
        id: { not: primaryImageId },
      },
      data: { isPrimary: false },
    })
  }

  revalidatePath(`/products/${productId}`)
}


// Search standalone products that can be linked as color variants (excludes the parent itself)
export async function searchProductsForLink(query: string, excludeId: string) {
  if (!query || query.trim().length < 2) return []

  const products = await prisma.product.findMany({
    where: {
      parentProductId: null,
      id: { not: excludeId },
      name: { contains: query.trim(), mode: 'insensitive' },
    },
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      category: true,
    },
    orderBy: { name: 'asc' },
    take: 10,
  })

  return serializeData(products)
}

// Link an existing standalone product as a color variant of a parent
export async function linkProductAsVariant(productId: string, parentId: string, color?: string) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const [parent, product] = await Promise.all([
    prisma.product.findUnique({ where: { id: parentId } }),
    prisma.product.findUnique({ where: { id: productId } }),
  ])

  if (!parent) throw new Error('Producto padre no encontrado')
  if (parent.parentProductId) throw new Error('El padre seleccionado ya es una variante')
  if (!product) throw new Error('Producto no encontrado')
  if (product.parentProductId) throw new Error('Este producto ya es variante de otro producto')
  if (productId === parentId) throw new Error('Un producto no puede ser variante de sí mismo')

  await prisma.product.update({
    where: { id: productId },
    data: {
      parentProductId: parentId,
      ...(color ? { color } : {}),
    },
  })

  revalidatePath('/products')
  revalidatePath(`/products/${parentId}`)
  revalidatePath(`/products/${productId}`)
}

// Remove the parent relationship from a variant (make it standalone again)
export async function unlinkProductVariant(productId: string) {
  const session = await auth()
  if (!session) throw new Error('No autorizado')

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new Error('Producto no encontrado')
  if (!product.parentProductId) throw new Error('Este producto no es una variante')

  const parentId = product.parentProductId

  await prisma.product.update({
    where: { id: productId },
    data: { parentProductId: null },
  })

  revalidatePath('/products')
  revalidatePath(`/products/${parentId}`)
  revalidatePath(`/products/${productId}`)
}

export const getCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
  },
  ['categories-list'],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ['categories']
  }
)
