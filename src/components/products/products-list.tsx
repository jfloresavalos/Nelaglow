'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useDebounce } from '@/lib/hooks'
import { toast } from 'sonner'
import { Search, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ProductCard } from './product-card'
import { ProductsTable } from './products-table'
import { deleteProduct } from '@/actions/products'
import type { ProductWithImages } from '@/types'
import type { Category } from '@/generated/prisma'

interface ProductsListProps {
  products: ProductWithImages[]
  categories: Category[]
  totalPages: number
  currentPage: number
  currentSearch: string
  currentCategory: string
}

export function ProductsList({ products, categories, totalPages, currentPage, currentSearch, currentCategory }: ProductsListProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [searchValue, setSearchValue] = useState(currentSearch)
  const debouncedSearch = useDebounce(searchValue)

  useEffect(() => {
    if (debouncedSearch === currentSearch) return
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (currentCategory && currentCategory !== 'all') params.set('category', currentCategory)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }, [debouncedSearch, currentSearch, currentCategory, router, pathname])

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams()
    if (searchValue) params.set('search', searchValue)
    if (value && value !== 'all') params.set('category', value)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams()
    if (searchValue) params.set('search', searchValue)
    if (currentCategory && currentCategory !== 'all') params.set('category', currentCategory)
    params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      await deleteProduct(deleteId)
      toast.success('Producto eliminado correctamente')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar producto')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={currentCategory || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="flex-1 sm:w-48 sm:flex-none min-w-0">
              <SelectValue placeholder="Todas las categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1 shrink-0">
            <Button
              variant={view === 'grid' ? 'default' : 'outline'}
              size="icon"
              aria-label="Vista cuadrícula"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'table' ? 'default' : 'outline'}
              size="icon"
              aria-label="Vista tabla"
              onClick={() => setView('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
          {searchValue || currentCategory
            ? 'No se encontraron productos con los filtros aplicados'
            : 'No hay productos registrados'}
        </div>
      ) : (
        <>
          {view === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={setDeleteId}
                  priority={i < 4}
                />
              ))}
            </div>
          ) : (
            <ProductsTable products={products} onDelete={setDeleteId} />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="text-sm text-muted-foreground">
                Pagina {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Producto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El producto sera eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
