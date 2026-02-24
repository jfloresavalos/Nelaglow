import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const headers = [
    'nombre',
    'color',
    'categoria',
    'precio_venta',
    'precio_costo',
    'stock',
    'stock_minimo',
    'descripcion',
  ]

  const examples = [
    // Producto con variantes de color
    ['Termo 500ml', 'Rojo',   'Termos',   25.00, 15.00, 10, 3, ''],
    ['Termo 500ml', 'Azul',   'Termos',   25.00, 15.00,  8, 3, ''],
    ['Termo 500ml', 'Verde',  'Termos',   25.00, 15.00,  5, 3, ''],
    // Producto sin variantes
    ['Morral Escolar', '', 'Morrales', 45.00, 28.00, 20, 5, 'Con mangas laterales'],
    ['Taza Mágica',    '', 'Tazas',    18.00, 10.00, 15, 3, ''],
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples])

  // Ancho de columnas
  ws['!cols'] = [
    { wch: 20 }, { wch: 12 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 8 },
    { wch: 12 }, { wch: 25 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Productos')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-productos-nelaglow.xlsx"',
    },
  })
}
