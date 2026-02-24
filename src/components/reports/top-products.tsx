'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ColorSwatch } from '@/components/products/color-swatch'
import { formatCurrency } from '@/lib/utils'
import { Package } from 'lucide-react'
import type { TopProductRow } from '@/types'

const MEDAL_COLORS = [
  'bg-yellow-400/20 text-yellow-600 border-yellow-300',
  'bg-gray-300/20 text-gray-500 border-gray-300',
  'bg-amber-600/20 text-amber-700 border-amber-400',
]

export function TopProducts({ rows }: { rows: TopProductRow[] }) {
  if (rows.length === 0) {
    return (
      <Card className="glass-card border-white/20">
        <CardContent className="py-16 text-center text-muted-foreground">
          No hay ventas registradas en este período.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((product, idx) => (
        <Card key={product.productId} className="glass-card border-white/20 hover:bg-white/10 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Imagen */}
              <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-white/10 shrink-0">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.productName}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{product.productName}</p>
                    {product.color && (
                      <div className="mt-0.5">
                        <ColorSwatch color={product.color} size="sm" showLabel />
                      </div>
                    )}
                  </div>
                  {idx < 3 && (
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 font-bold ${MEDAL_COLORS[idx]}`}
                    >
                      #{idx + 1}
                    </Badge>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Vendidos</p>
                    <p className="text-lg font-bold text-primary">{product.totalQty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-sm font-semibold text-emerald-500">
                      {formatCurrency(product.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
