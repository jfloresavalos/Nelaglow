'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ColorSwatch } from '@/components/products/color-swatch'
import { cn } from '@/lib/utils'

type VariantForSelector = {
  id: string
  name: string
  color: string | null
  stock: number
  lowStockThreshold: number
  isActive: boolean
  images: { imageUrl: string; thumbnailUrl: string | null }[]
}

interface ProductColorSelectorProps {
  parentImages: { imageUrl: string; thumbnailUrl: string | null; isPrimary: boolean }[]
  variants: VariantForSelector[]
  productName: string
}

export function ProductColorSelector({ parentImages, variants, productName }: ProductColorSelectorProps) {
  const firstActive = variants.find((v) => v.isActive) ?? variants[0] ?? null
  const [selectedVariant, setSelectedVariant] = useState<VariantForSelector | null>(firstActive)

  const displayImage =
    selectedVariant?.images[0] ??
    parentImages.find((img) => img.isPrimary) ??
    parentImages[0] ??
    null

  const displayStock = selectedVariant?.stock ?? 0
  const isLowStock = displayStock > 0 && displayStock <= (selectedVariant?.lowStockThreshold ?? 5)
  const isOutOfStock = displayStock === 0

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Imagen principal — cambia al seleccionar color */}
      <Card>
        <CardHeader>
          <CardTitle>Imagen</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            key={selectedVariant?.id ?? 'default'}
            className="relative aspect-square overflow-hidden rounded-lg border bg-muted/30"
          >
            {displayImage ? (
              <Image
                src={displayImage.thumbnailUrl || displayImage.imageUrl}
                alt={`${productName}${selectedVariant?.color ? ` — ${selectedVariant.color}` : ''}`}
                fill
                priority
                className="object-contain p-3"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-16 w-16 text-primary/20" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selector de color + Stock */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Color</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => variant.isActive && setSelectedVariant(variant)}
                  disabled={!variant.isActive}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
                    selectedVariant?.id === variant.id
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-white/20 hover:bg-white/10 text-muted-foreground',
                    !variant.isActive && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <ColorSwatch color={variant.color ?? ''} size="sm" />
                  <span className="capitalize">{variant.color ?? 'Sin color'}</span>
                  {variant.stock === 0 && variant.isActive && (
                    <span className="text-xs text-red-400">(Agotado)</span>
                  )}
                  {!variant.isActive && (
                    <span className="text-xs text-muted-foreground">(Inactivo)</span>
                  )}
                </button>
              ))}
            </div>
            {selectedVariant && (
              <p className="text-xs text-muted-foreground pt-1">
                Ver detalle:{' '}
                <Link
                  href={`/products/${selectedVariant.id}`}
                  className="text-primary hover:underline"
                >
                  {selectedVariant.name}
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Inventario{selectedVariant?.color ? ` — ${selectedVariant.color}` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Stock actual</span>
              <span
                className={cn(
                  'text-lg font-semibold',
                  isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'
                )}
              >
                {displayStock} unidades
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Alerta de stock bajo</span>
              <span>{selectedVariant?.lowStockThreshold ?? 5} unidades</span>
            </div>
            {isOutOfStock && (
              <Badge variant="destructive" className="w-full justify-center">
                Este color agotado
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge className="w-full justify-center bg-yellow-500">
                Stock bajo — Reabastecer pronto
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
