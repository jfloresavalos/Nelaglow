/**
 * Exporta categorías + productos + imágenes de la BD local → seed.sql
 * Uso: node scripts/export-seed.js
 */
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Leer DATABASE_URL del .env local
const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const match = envContent.match(/DATABASE_URL="([^"]+)"/)
if (!match) { console.error('No se encontró DATABASE_URL en .env'); process.exit(1) }

// Decodificar URL (el password tiene %24 = $)
const dbUrl = match[1]
console.log('Conectando a:', dbUrl.replace(/:([^@]+)@/, ':****@'))

const pool = new Pool({ connectionString: dbUrl })

function esc(val) {
  if (val === null || val === undefined) return 'NULL'
  return `'${String(val).replace(/'/g, "''")}'`
}

async function main() {
  const client = await pool.connect()
  const lines = [
    '-- Seed exportado desde BD local de NelaGlow',
    '-- Ejecutar: PGPASSWORD=NelaGlow2025 psql -h 127.0.0.1 -U nelaglow_user -d nelaglow_db -f seed.sql',
    '',
    'BEGIN;',
    '',
  ]

  // ── Categorías ─────────────────────────────────────────────────────────
  const { rows: cats } = await client.query('SELECT * FROM categories ORDER BY name')
  console.log(`Categorías: ${cats.length}`)

  if (cats.length > 0) {
    lines.push('-- Categorías')
    lines.push('INSERT INTO categories (id, name, slug, "isActive", "createdAt", "updatedAt") VALUES')
    lines.push(cats.map(c =>
      `  (${esc(c.id)}, ${esc(c.name)}, ${esc(c.slug)}, ${c.isActive}, NOW(), NOW())`
    ).join(',\n') + ' ON CONFLICT (id) DO NOTHING;')
    lines.push('')
  }

  // ── Productos (padres primero, luego variantes) ─────────────────────────
  const { rows: prods } = await client.query(
    'SELECT * FROM products ORDER BY "parentProductId" ASC NULLS FIRST, "createdAt" ASC'
  )
  console.log(`Productos: ${prods.length}`)

  if (prods.length > 0) {
    lines.push('-- Productos')
    lines.push(
      'INSERT INTO products (id, name, description, price, "costPrice", stock, "lowStockThreshold", ' +
      '"isActive", "categoryId", "parentProductId", color, "createdAt", "updatedAt") VALUES'
    )
    lines.push(prods.map(p =>
      `  (${esc(p.id)}, ${esc(p.name)}, ${esc(p.description)}, ` +
      `${p.price}, ${p.costPrice ?? 'NULL'}, ${p.stock}, ${p.lowStockThreshold}, ` +
      `${p.isActive}, ${esc(p.categoryId)}, ${esc(p.parentProductId)}, ${esc(p.color)}, ` +
      `NOW(), NOW())`
    ).join(',\n') + ' ON CONFLICT (id) DO NOTHING;')
    lines.push('')
  }

  // ── Imágenes ────────────────────────────────────────────────────────────
  const { rows: imgs } = await client.query(
    'SELECT * FROM product_images ORDER BY "productId", "sortOrder" ASC'
  )
  console.log(`Imágenes: ${imgs.length}`)

  if (imgs.length > 0) {
    lines.push('-- Imágenes de productos')
    lines.push(
      'INSERT INTO product_images (id, "productId", "imageUrl", "thumbnailUrl", "isPrimary", "sortOrder", "createdAt") VALUES'
    )
    lines.push(imgs.map(img =>
      `  (${esc(img.id)}, ${esc(img.productId)}, ${esc(img.imageUrl)}, ` +
      `${esc(img.thumbnailUrl)}, ${img.isPrimary}, ${img.sortOrder}, NOW())`
    ).join(',\n') + ' ON CONFLICT (id) DO NOTHING;')
    lines.push('')
  }

  lines.push('COMMIT;')

  const outPath = path.join(__dirname, 'seed.sql')
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8')
  console.log(`\n✅ seed.sql generado con ${prods.length} productos, ${cats.length} categorías, ${imgs.length} imágenes`)
  console.log(`📄 ${outPath}`)

  client.release()
  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
