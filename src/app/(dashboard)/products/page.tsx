import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getProducts, getCategories } from '@/actions/products'
import { ProductsList } from '@/components/products/products-list'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>
}) {
  const params = await searchParams;
  const page = Number(params?.page) || 1
  const search = params?.search || ''
  const categoryId = params?.category === 'all' ? undefined : params?.category

  const [{ products, total, pages }, categories] = await Promise.all([
    getProducts({
      search,
      categoryId,
      page,
      pageSize: 12,
      parentOnly: true,
      includeVariants: true,
    }),
    getCategories(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Gestiona tu catalogo de productos ({total} referencias)
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Link>
        </Button>
      </div>

      <ProductsList
        products={products}
        categories={categories}
        totalPages={pages}
        currentPage={page}
        currentSearch={search}
        currentCategory={categoryId || ''}
      />
    </div>
  )
}
