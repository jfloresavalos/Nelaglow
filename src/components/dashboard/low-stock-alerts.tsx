'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Package } from 'lucide-react'
// Define a shape that matches the serialized data passed from Server Component
interface SerializedProduct {
  id: string
  name: string
  stock: number
  category: { name: string } | null
  images: { imageUrl: string; thumbnailUrl: string | null }[]
}

interface LowStockAlertsProps {
  products: SerializedProduct[]
}

export function LowStockAlerts({ products }: LowStockAlertsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Alertas de Stock
        </CardTitle>
        <CardDescription>Productos que necesitan reabastecimiento</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No hay alertas de stock
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const isOutOfStock = product.stock === 0
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-12 w-12 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0].thumbnailUrl || product.images[0].imageUrl}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.category?.name || 'Sin categoria'}
                    </p>
                  </div>
                  <Badge
                    variant={isOutOfStock ? 'destructive' : 'outline'}
                    className={isOutOfStock ? '' : 'bg-amber-100 text-amber-800'}
                  >
                    {isOutOfStock ? 'Agotado' : `Stock: ${product.stock}`}
                  </Badge>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
