import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProduct, getCategories } from '@/actions/products'
import { ProductForm } from '@/components/products/product-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProduct(id),
    getCategories(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Volver al producto">
          <Link href={`/products/${product.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Producto</h1>
          <p className="text-muted-foreground">{product.name}</p>
        </div>
      </div>

      <ProductForm product={product} categories={categories} />
    </div>
  )
}
