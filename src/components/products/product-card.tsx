'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Edit, Trash2, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ProductWithImages, ProductVariant } from '@/types'
import { ColorSwatch } from '@/components/products/color-swatch'
import { formatCurrency } from '@/lib/utils'

type ProductCardProduct = ProductWithImages & {
  variants?: ProductVariant[]
}

interface ProductCardProps {
  product: ProductCardProduct
  onDelete?: (id: string) => void
  priority?: boolean
}

export function ProductCard({ product, onDelete, priority = false }: ProductCardProps) {
  const { primaryImage, hasVariants, effectiveStock, isLowStock, isOutOfStock } = useMemo(() => {
    const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0]
    const hasVariants = !!(product.variants && product.variants.length > 0)
    const effectiveStock = hasVariants
      ? product.variants!.reduce((s, v) => s + v.stock, 0)
      : product.stock
    return {
      primaryImage,
      hasVariants,
      effectiveStock,
      isLowStock: effectiveStock <= product.lowStockThreshold,
      isOutOfStock: effectiveStock === 0,
    }
  }, [product])

  return (
    <Card className="overflow-hidden glass-card group hover:shadow-lg transition-all duration-300 border-0 flex flex-col">
      {/* Área clickable → detalle */}
      <Link href={`/products/${product.id}`} className="block flex-1">
        <div className="relative aspect-square bg-muted/30 overflow-hidden">
          {primaryImage ? (
            <Image
              src={primaryImage.thumbnailUrl || primaryImage.imageUrl}
              alt={product.name}
              fill
              priority={priority}
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-primary/5">
              <Package className="h-12 w-12 text-primary/20" />
            </div>
          )}
          {!product.isActive && (
            <Badge className="absolute left-2 top-2 backdrop-blur-md" variant="secondary">
              Inactivo
            </Badge>
          )}
          {isOutOfStock && product.isActive && (
            <Badge className="absolute left-2 top-2 backdrop-blur-md" variant="destructive">
              Agotado
            </Badge>
          )}
          {isLowStock && !isOutOfStock && (
            <Badge className="absolute left-2 top-2 bg-yellow-500/90 backdrop-blur-md text-white border-0">
              Stock bajo
            </Badge>
          )}
        </div>

        <CardContent className="p-4 pb-3">
          <div className="space-y-1">
            <h3 className="font-bold truncate text-foreground group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {product.category?.name || 'Sin categoria'}
            </p>
            {/* Color swatch solo (variante standalone) */}
            {product.color && !hasVariants && (
              <ColorSwatch color={product.color} size="sm" showLabel />
            )}
            {/* Swatches de colores (padre con variantes) */}
            {hasVariants && (
              <div className="flex items-center gap-1 flex-wrap">
                {product.variants!.map((v) =>
                  v.color ? <ColorSwatch key={v.id} color={v.color} size="sm" /> : null
                )}
                <span className="text-xs text-muted-foreground ml-1">
                  {product.variants!.length} color{product.variants!.length !== 1 ? 'es' : ''}
                </span>
              </div>
            )}
            <p className="text-lg font-bold text-primary">
              {formatCurrency(Number(product.price))}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasVariants
                ? `Stock total: ${effectiveStock}`
                : `Stock: ${effectiveStock}`}
            </p>
          </div>
        </CardContent>
      </Link>

      {/* Barra de acciones — fuera del link para no propagarse */}
      <div className="flex items-center justify-between px-4 pb-3 pt-0 border-t border-white/10 mt-auto">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <Link href={`/products/${product.id}/edit`}>
            <Edit className="h-3.5 w-3.5" />
            Editar
          </Link>
        </Button>

        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onDelete(product.id)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </Button>
        )}
      </div>
    </Card>
  )
}
