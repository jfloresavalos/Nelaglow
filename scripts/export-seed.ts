/**
 * Script de exportación de datos locales → seed SQL para el VPS.
 * Exporta: categorías, productos (con variantes), imágenes.
 * Uso: npx tsx scripts/export-seed.ts
 */
import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

function esc(val: string | null | undefined): string {
  if (val === null || val === undefined) return 'NULL'
  return `'${val.replace(/'/g, "''")}'`
}

function escNum(val: number | null | undefined): string {
  if (val === null || val === undefined) return 'NULL'
  return String(val)
}

async function main() {
  const lines: string[] = [
    '-- Seed generado automáticamente desde BD local',
    '-- Ejecutar en el VPS: psql -h 127.0.0.1 -U nelaglow_user -d nelaglow_db -f seed.sql',
    '',
    'BEGIN;',
    '',
  ]

  // ── Categorías ────────────────────────────────────────────────────────────
  const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  if (cats.length > 0) {
    lines.push('-- Categorías')
    lines.push('INSERT INTO categories (id, name, description, "createdAt", "updatedAt") VALUES')
    const rows = cats.map(c =>
      `  (${esc(c.id)}, ${esc(c.name)}, ${esc(c.description)}, NOW(), NOW())`
    )
    lines.push(rows.join(',\n') + ' ON CONFLICT (id) DO NOTHING;')
    lines.push('')
  }

  // ── Productos (padres primero, luego variantes) ───────────────────────────
  const products = await prisma.product.findMany({
    include: { images: true },
    orderBy: [{ parentProductId: 'asc' }, { createdAt: 'asc' }],
  })

  if (products.length > 0) {
    lines.push('-- Productos')
    lines.push(
      'INSERT INTO products (id, name, description, price, "costPrice", stock, "lowStockThreshold", ' +
      '"isActive", "categoryId", "parentProductId", color, "createdAt", "updatedAt") VALUES'
    )
    const rows = products.map(p =>
      `  (${esc(p.id)}, ${esc(p.name)}, ${esc(p.description)}, ` +
      `${escNum(Number(p.price))}, ${escNum(p.costPrice ? Number(p.costPrice) : null)}, ` +
      `${escNum(p.stock)}, ${escNum(p.lowStockThreshold)}, ` +
      `${p.isActive}, ${esc(p.categoryId)}, ${esc(p.parentProductId)}, ${esc(p.color)}, ` +
      `NOW(), NOW())`
    )
    lines.push(rows.join(',\n') + ' ON CONFLICT (id) DO NOTHING;')
    lines.push('')

    // ── Imágenes ──────────────────────────────────────────────────────────
    const allImages = products.flatMap(p => p.images)
    if (allImages.length > 0) {
      lines.push('-- Imágenes de productos')
      lines.push(
        'INSERT INTO product_images (id, "productId", "imageUrl", "thumbnailUrl", "isPrimary", "sortOrder", "createdAt") VALUES'
      )
      const imgRows = allImages.map(img =>
        `  (${esc(img.id)}, ${esc(img.productId)}, ${esc(img.imageUrl)}, ` +
        `${esc(img.thumbnailUrl)}, ${img.isPrimary}, ${escNum(img.sortOrder)}, NOW())`
      )
      lines.push(imgRows.join(',\n') + ' ON CONFLICT (id) DO NOTHING;')
      lines.push('')
    }
  }

  lines.push('COMMIT;')
  lines.push('')

  const outPath = path.join(process.cwd(), 'scripts', 'seed.sql')
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8')

  console.log(`✅ Exportados: ${cats.length} categorías, ${products.length} productos`)
  console.log(`📄 Archivo: scripts/seed.sql`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
