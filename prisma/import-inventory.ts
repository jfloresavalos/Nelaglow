import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'
import * as XLSX from 'xlsx'
import * as path from 'path'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Mapeo de tipos del Excel a categorías del sistema
const categoryMapping: Record<string, string> = {
  'botella': 'botellas',
  'botella doble pico': 'botellas',
  'termo stanley': 'termos-stanley',
  'termo': 'termos',
  'termo ': 'termos', // con espacio
  'termo doble pico': 'termos',
  'taza': 'tazas',
  'taza ': 'tazas', // con espacio
  'taza doble pico': 'tazas',
  'morral': 'morrales',
  'taper': 'tapers',
}

interface ExcelRow {
  modelo: string
  color: string
  capacidad: string | null
  tipo: string
  cantidad: number
  'Precio Compra': number
  'Precio Venta': number
  'Precio Live': number
}

async function importInventory() {
  console.log('Importing inventory from Excel...')

  // Leer el archivo Excel
  const excelPath = path.join(__dirname, '..', 'inventario nelaglow.xlsx')
  const workbook = XLSX.readFile(excelPath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet)

  console.log(`Found ${data.length} products in Excel`)

  // Obtener categorías existentes
  const categories = await prisma.category.findMany()
  const categoryMap: Record<string, string> = {}
  for (const cat of categories) {
    categoryMap[cat.slug] = cat.id
  }

  let created = 0
  let updated = 0
  let skipped = 0

  for (const row of data) {
    // Construir nombre del producto
    const capacidad = row.capacidad ? ` ${row.capacidad}` : ''
    const productName = `${row.modelo} ${row.color}${capacidad}`.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    // Obtener categoría
    const tipoNormalizado = row.tipo.toLowerCase().trim()
    const categorySlug = categoryMapping[tipoNormalizado]

    if (!categorySlug) {
      console.warn(`Unknown category: ${row.tipo} for product: ${productName}`)
      skipped++
      continue
    }

    const categoryId = categoryMap[categorySlug]
    if (!categoryId) {
      console.warn(`Category not found: ${categorySlug} for product: ${productName}`)
      skipped++
      continue
    }

    // Buscar si ya existe
    const existing = await prisma.product.findFirst({
      where: {
        name: {
          equals: productName,
          mode: 'insensitive',
        },
      },
    })

    if (existing) {
      // Actualizar stock y precios
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          stock: row.cantidad,
          price: row['Precio Venta'],
          costPrice: row['Precio Compra'],
        },
      })
      updated++
    } else {
      // Crear nuevo producto
      await prisma.product.create({
        data: {
          name: productName,
          price: row['Precio Venta'],
          costPrice: row['Precio Compra'],
          stock: row.cantidad,
          lowStockThreshold: 2,
          categoryId,
          isActive: true,
        },
      })
      created++
    }
  }

  console.log(`Import completed:`)
  console.log(`  - Created: ${created}`)
  console.log(`  - Updated: ${updated}`)
  console.log(`  - Skipped: ${skipped}`)
}

importInventory()
  .catch((e) => {
    console.error('Import failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    pool.end()
  })
