import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getProduct, getCategories } from '@/actions/products'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ColorSwatch } from '@/components/products/color-swatch'
import { ProductVariantsPanel } from '@/components/products/product-variants-panel'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Edit, ArrowLeft, Package } from 'lucide-react'
import type { ProductForWizard } from '@/types'
import { DeleteProductButton } from '@/components/products/delete-product-button'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, categories] = await Promise.all([getProduct(id), getCategories()])

  if (!product) {
    notFound()
  }

  const isParent = !product.parentProductId
  const isVariant = !!product.parentProductId
  const variants = (product as any).variants as Array<{ stock: number; lowStockThreshold: number }> | undefined
  const hasVariants = !!variants && variants.length > 0
  const effectiveStock = hasVariants
    ? variants!.reduce((s, v) => s + v.stock, 0)
    : product.stock
  const isLowStock = effectiveStock <= product.lowStockThreshold
  const isOutOfStock = effectiveStock === 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild className="shrink-0" aria-label="Volver">
            <Link href={isVariant && (product as any).parent ? `/products/${(product as any).parent.id}` : '/products'}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight truncate">{product.name}</h1>
              {product.color && <ColorSwatch color={product.color} size="lg" showLabel />}
            </div>
            <p className="text-muted-foreground text-sm">
              {product.category?.name || 'Sin categoria'}
              {isVariant && product.parent && (
                <span> · Variante de{' '}
                  <Link href={`/products/${product.parent.id}`} className="text-primary hover:underline">
                    {product.parent.name}
                  </Link>
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DeleteProductButton
            productId={product.id}
            productName={product.name}
            redirectTo={isVariant && (product as any).parent ? `/products/${(product as any).parent.id}` : '/products'}
          />
          <Button asChild>
            <Link href={`/products/${product.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imagenes</CardTitle>
          </CardHeader>
          <CardContent>
            {product.images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.images.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative aspect-square overflow-hidden rounded-lg border bg-muted/30"
                  >
                    <Image
                      src={image.imageUrl}
                      alt={`${product.name} - ${index + 1}`}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    {image.isPrimary && (
                      <Badge className="absolute bottom-2 left-2">Principal</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg border bg-gray-50">
                <Package className="h-12 w-12 text-gray-300" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacion General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estado</span>
                {product.isActive ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Activo
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactivo</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Precio de venta</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(Number(product.price))}
                </span>
              </div>
              {product.costPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Precio de costo</span>
                  <span>{formatCurrency(Number(product.costPrice))}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span>{formatDate(product.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {hasVariants ? `Stock total (${variants!.length} colores)` : 'Stock actual'}
                </span>
                <span
                  className={`text-lg font-semibold ${
                    isOutOfStock
                      ? 'text-red-600'
                      : isLowStock
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {effectiveStock} unidades
                </span>
              </div>
              {!hasVariants && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Alerta de stock bajo</span>
                  <span>{product.lowStockThreshold} unidades</span>
                </div>
              )}
              {isOutOfStock && (
                <Badge variant="destructive" className="w-full justify-center">
                  {hasVariants ? 'Todos los colores agotados' : 'Producto agotado'}
                </Badge>
              )}
              {isLowStock && !isOutOfStock && (
                <Badge className="w-full justify-center bg-yellow-500">
                  Stock bajo - Reabastecer pronto
                </Badge>
              )}
            </CardContent>
          </Card>

          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descripcion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Variants panel — only shown for parent products */}
      {isParent && (
        <Card>
          <CardContent className="pt-6">
            <ProductVariantsPanel
              product={product as unknown as ProductForWizard}
              categories={categories}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
