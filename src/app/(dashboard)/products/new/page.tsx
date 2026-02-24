import { getCategories } from '@/actions/products'
import { ProductForm } from '@/components/products/product-form'

export default async function NewProductPage() {
  const categories = await getCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Producto</h1>
        <p className="text-muted-foreground">
          Agrega un nuevo producto al catalogo
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  )
}
