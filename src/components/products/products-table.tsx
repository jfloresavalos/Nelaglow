'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Edit, Trash2, Eye, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ProductWithImages } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface ProductsTableProps {
  products: ProductWithImages[]
  onDelete?: (id: string) => void
}

export function ProductsTable({ products, onDelete }: ProductsTableProps) {
  return (
    <div className="rounded-lg border bg-white overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Imagen</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Costo</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-right">Margen</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="w-32">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0]
            const hasVariants = product.variants && product.variants.length > 0
            const effectiveStock = hasVariants
              ? product.variants!.reduce((s, v) => s + v.stock, 0)
              : product.stock
            const isLowStock = effectiveStock <= product.lowStockThreshold
            const isOutOfStock = effectiveStock === 0

            return (
              <TableRow key={product.id}>
                {/* ... (previous Image cell) ... */}
                <TableCell>
                  <div className="relative h-12 w-12 overflow-hidden rounded bg-gray-100">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.thumbnailUrl || primaryImage.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {product.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{product.category?.name || '-'}</TableCell>
                <TableCell className="text-right font-medium text-muted-foreground">
                  {product.costPrice ? formatCurrency(Number(product.costPrice)) : '-'}
                </TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {formatCurrency(Number(product.price))}
                </TableCell>
                <TableCell className="text-right">
                  {(() => {
                    const price = Number(product.price)
                    const cost = Number(product.costPrice ?? 0)
                    if (!cost || !price) return <span className="text-muted-foreground">—</span>
                    const margin = ((price - cost) / price) * 100
                    const color = margin >= 30 ? 'text-emerald-500' : margin >= 10 ? 'text-amber-500' : 'text-red-400'
                    return <span className={`text-sm font-medium ${color}`}>{margin.toFixed(0)}%</span>
                  })()}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className={
                        isOutOfStock
                          ? 'text-red-600 font-medium'
                          : isLowStock
                            ? 'text-yellow-600 font-medium'
                            : ''
                      }
                    >
                      {effectiveStock}
                    </span>
                    {hasVariants && (
                      <span className="text-xs text-muted-foreground">
                        {product.variants!.length} colores
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {product.isActive ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/products/${product.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar producto"
                        onClick={() => onDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
