import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, UserRole } from '../src/generated/prisma'
import { hash } from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const passwordHash = await hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Administrador',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  })
  console.log('Admin user created:', admin.username)

  // Create categories based on actual inventory
  const categories = [
    { name: 'Termos Stanley', slug: 'termos-stanley' },
    { name: 'Termos', slug: 'termos' },
    { name: 'Botellas', slug: 'botellas' },
    { name: 'Tazas', slug: 'tazas' },
    { name: 'Morrales', slug: 'morrales' },
    { name: 'Tapers', slug: 'tapers' },
    { name: 'Accesorios', slug: 'accesorios' },
  ]

  const categoryMap: Record<string, string> = {}

  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
    categoryMap[category.slug] = created.id
  }
  console.log('Categories created:', categories.length)

  // Initialize order counter
  await prisma.orderCounter.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      lastNum: 0,
    },
  })
  console.log('Order counter initialized')

  // Seed products from inventory
  const products = [
    // Botellas
    { name: 'Chokolab (Chancos) Negro 500ml', price: 35, costPrice: 17, stock: 1, category: 'botellas' },
    { name: 'Chokolab (Chancos) Lila 500ml', price: 35, costPrice: 17, stock: 1, category: 'botellas' },
    { name: 'Chokolab (Chancos) Blanco 500ml', price: 35, costPrice: 17, stock: 1, category: 'botellas' },

    // Termos Stanley Kawai
    { name: 'Termo Kawai Rojo 1Lt', price: 37, costPrice: 16.5, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Kawai Celeste 1Lt', price: 37, costPrice: 16.5, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Kawai Rosa 1Lt', price: 37, costPrice: 16.5, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Kawai Amarillo 1Lt', price: 37, costPrice: 16.5, stock: 1, category: 'termos-stanley' },

    // Termos con taza
    { name: 'Termo con Taza Crema 480ml', price: 36, costPrice: 16.5, stock: 1, category: 'termos' },
    { name: 'Termo con Taza Rosa 480ml', price: 36, costPrice: 16.5, stock: 1, category: 'termos' },
    { name: 'Termo con Taza Morado 480ml', price: 36, costPrice: 16.5, stock: 1, category: 'termos' },

    // Termo Stanley Antiderrame
    { name: 'Termo Stanley Antiderrame Lila 1Lt', price: 56, costPrice: 28, stock: 2, category: 'termos-stanley' },
    { name: 'Termo Stanley Antiderrame Beige 1Lt', price: 56, costPrice: 28, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Stanley Antiderrame Negro 1Lt', price: 56, costPrice: 28, stock: 1, category: 'termos-stanley' },

    // Termo Cold
    { name: 'Termo Cold Amarillo 750ml', price: 34, costPrice: 16.5, stock: 1, category: 'termos' },

    // Termo Niño
    { name: 'Termo Niño Rojo 600ml', price: 36, costPrice: 16.5, stock: 1, category: 'termos' },
    { name: 'Termo Niño Celeste 600ml', price: 36, costPrice: 16.5, stock: 1, category: 'termos' },
    { name: 'Termo Niño Rosado 600ml', price: 36, costPrice: 16.5, stock: 1, category: 'termos' },
    { name: 'Termo Niño Plateado/Rosa 600ml', price: 36, costPrice: 16.5, stock: 1, category: 'termos' },

    // Termo Stanley Pico
    { name: 'Termo Stanley Pico Verde 1.2Lt', price: 42, costPrice: 19, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Stanley Pico Lila 1.2Lt', price: 42, costPrice: 19, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Stanley Pico Fucsia 1.2Lt', price: 42, costPrice: 19, stock: 1, category: 'termos-stanley' },

    // Termo Stanley Marmoleado
    { name: 'Termo Stanley Marmoleado Blanco 1Lt', price: 46, costPrice: 22, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Stanley Marmoleado Turquesa 1Lt', price: 46, costPrice: 22, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Stanley Marmoleado Lila 1Lt', price: 46, costPrice: 22, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Stanley Marmoleado Negro 1Lt', price: 46, costPrice: 22, stock: 1, category: 'termos-stanley' },

    // Termo Stanley Pico Simple
    { name: 'Termo Stanley Pico Simple Gris 1Lt', price: 40, costPrice: 19, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Stanley Pico Simple Lila 1Lt', price: 40, costPrice: 19, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Stanley Pico Simple Beige 1Lt', price: 40, costPrice: 19, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Stanley Pico Simple Durazno 1Lt', price: 40, costPrice: 19, stock: 1, category: 'termos-stanley' },

    // Termo Infantil Kawai
    { name: 'Termo Infantil Kawai Marron 900ml', price: 32, costPrice: 16, stock: 1, category: 'termos' },
    { name: 'Termo Infantil Kawai Celeste 900ml', price: 32, costPrice: 16, stock: 1, category: 'termos' },

    // Termo Asa Movible
    { name: 'Termo Asa Movible Turquesa 1.2Lt', price: 45, costPrice: 23, stock: 1, category: 'termos' },
    { name: 'Termo Asa Movible Lila 1.2Lt', price: 45, costPrice: 23, stock: 1, category: 'termos' },
    { name: 'Termo Asa Movible Negro 1.2Lt', price: 45, costPrice: 23, stock: 1, category: 'termos' },
    { name: 'Termo Asa Movible Beige 1.2Lt', price: 45, costPrice: 23, stock: 1, category: 'termos' },
    { name: 'Termo Asa Movible Fucsia 1.2Lt', price: 45, costPrice: 23, stock: 1, category: 'termos' },

    // Termo Stanley Caña
    { name: 'Termo Stanley Caña Negro 1.2Lt', price: 43, costPrice: 20, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Stanley Caña Azul 1.2Lt', price: 43, costPrice: 20, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Stanley Caña Gris 1.2Lt', price: 43, costPrice: 20, stock: 1, category: 'termos-stanley' },
    { name: 'Termo Stanley Caña Morado 1.2Lt', price: 43, costPrice: 20, stock: 1, category: 'termos-stanley' },

    // Owala 950ml
    { name: 'Owala Negro 950ml', price: 40, costPrice: 20, stock: 2, category: 'botellas' },
    { name: 'Owala Blanco 950ml', price: 40, costPrice: 20, stock: 4, category: 'botellas' },
    { name: 'Owala Rosado 950ml', price: 40, costPrice: 20, stock: 3, category: 'botellas' },
    { name: 'Owala Morado 950ml', price: 40, costPrice: 20, stock: 2, category: 'botellas' },
    { name: 'Owala Turquesa 950ml', price: 40, costPrice: 20, stock: 1, category: 'botellas' },
    { name: 'Owala Verde Limon 950ml', price: 40, costPrice: 20, stock: 1, category: 'botellas' },
    { name: 'Owala Verde Militar 950ml', price: 40, costPrice: 20, stock: 1, category: 'botellas' },
    { name: 'Owala Fucsia 950ml', price: 40, costPrice: 20, stock: 1, category: 'botellas' },

    // Owala 710ml
    { name: 'Owala Fucsia 710ml', price: 38, costPrice: 16, stock: 1, category: 'botellas' },
    { name: 'Owala Morado 710ml', price: 38, costPrice: 16, stock: 1, category: 'botellas' },
    { name: 'Owala Verde Limon 710ml', price: 38, costPrice: 16, stock: 1, category: 'botellas' },
    { name: 'Owala Verde Militar 710ml', price: 38, costPrice: 16, stock: 1, category: 'botellas' },

    // Termo Stanley Capibara
    { name: 'Termo Stanley Capibara Fucsia 1.2Lt', price: 46, costPrice: 22, stock: 2, category: 'termos-stanley' },
    { name: 'Termo Stanley Capibara Negro 1.2Lt', price: 46, costPrice: 22, stock: 1, category: 'termos-stanley' },

    // Taza Cafetera
    { name: 'Taza Cafetera Negro 510ml', price: 30, costPrice: 13.5, stock: 1, category: 'tazas' },
    { name: 'Taza Cafetera Lila 510ml', price: 30, costPrice: 13.5, stock: 1, category: 'tazas' },
    { name: 'Taza Cafetera Rosado 510ml', price: 30, costPrice: 13.5, stock: 1, category: 'tazas' },
    { name: 'Taza Cafetera Turquesa 510ml', price: 30, costPrice: 13.5, stock: 1, category: 'tazas' },

    // Taza Owala
    { name: 'Taza Owala Turquesa 350ml', price: 35, costPrice: 16, stock: 1, category: 'tazas' },
    { name: 'Taza Owala Rosado 350ml', price: 35, costPrice: 16, stock: 1, category: 'tazas' },
    { name: 'Taza Owala Azul 350ml', price: 35, costPrice: 16, stock: 1, category: 'tazas' },
    { name: 'Taza Owala Negro 350ml', price: 35, costPrice: 16, stock: 1, category: 'tazas' },

    // Taza Kawai Diseño
    { name: 'Taza Kawai Diseño Rosa 500ml', price: 34, costPrice: 16.5, stock: 1, category: 'tazas' },
    { name: 'Taza Kawai Diseño Celeste 500ml', price: 34, costPrice: 16.5, stock: 1, category: 'tazas' },
    { name: 'Taza Kawai Diseño Blanco 500ml', price: 34, costPrice: 16.5, stock: 1, category: 'tazas' },
    { name: 'Taza Kawai Diseño Gris 500ml', price: 34, costPrice: 16.5, stock: 1, category: 'tazas' },

    // Morrales
    { name: 'Morral Stanley Negro', price: 27, costPrice: 13, stock: 2, category: 'morrales' },
    { name: 'Morral Stanley Rosa', price: 27, costPrice: 13, stock: 1, category: 'morrales' },
    { name: 'Morral Stanley Crema', price: 27, costPrice: 13, stock: 2, category: 'morrales' },
    { name: 'Morral Stanley Lila', price: 27, costPrice: 13, stock: 2, category: 'morrales' },

    // Tapers
    { name: 'Lunch Box Marron', price: 30, costPrice: 13.5, stock: 1, category: 'tapers' },
    { name: 'Lunch Box Azul', price: 30, costPrice: 13.5, stock: 1, category: 'tapers' },
    { name: 'Lunch Box Verde Jade', price: 30, costPrice: 13.5, stock: 1, category: 'tapers' },
    { name: 'Lunch Medium Morado', price: 26, costPrice: 8.5, stock: 1, category: 'tapers' },
    { name: 'Lunch Medium Azul', price: 26, costPrice: 8.5, stock: 1, category: 'tapers' },
  ]

  for (const product of products) {
    const categoryId = categoryMap[product.category]
    await prisma.product.upsert({
      where: {
        id: `seed-${product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      },
      update: {
        stock: product.stock,
        price: product.price,
        costPrice: product.costPrice,
      },
      create: {
        name: product.name,
        price: product.price,
        costPrice: product.costPrice,
        stock: product.stock,
        lowStockThreshold: 2,
        categoryId,
        isActive: true,
      },
    })
  }
  console.log('Products seeded:', products.length)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
