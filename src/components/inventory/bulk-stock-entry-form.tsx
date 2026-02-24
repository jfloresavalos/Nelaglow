'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Search, Package, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBulkStockEntry } from '@/actions/inventory'
import { getProducts } from '@/actions/products'
import type { ProductWithImages } from '@/types'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

interface EntryRow {
  id: string
  product: ProductWithImages | null
  quantity: string
  unitCost: string
  notes: string
  searchQuery: string
  searchResults: ProductWithImages[]
  isSearching: boolean
}

function newRow(): EntryRow {
  return {
    id: crypto.randomUUID(),
    product: null,
    quantity: '',
    unitCost: '',
    notes: '',
    searchQuery: '',
    searchResults: [],
    isSearching: false,
  }
}

export function BulkStockEntryForm() {
  const router = useRouter()
  const [rows, setRows] = useState<EntryRow[]>([newRow()])
  const [isPending, startTransition] = useTransition()
  const [searchTimers, setSearchTimers] = useState<Record<string, ReturnType<typeof setTimeout>>>({})

  const updateRow = useCallback((id: string, patch: Partial<EntryRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const handleSearch = useCallback(
    (rowId: string, query: string) => {
      updateRow(rowId, { searchQuery: query, product: query ? null : null })
      if (searchTimers[rowId]) clearTimeout(searchTimers[rowId])
      if (query.length < 2) {
        updateRow(rowId, { searchResults: [], isSearching: false })
        return
      }
      updateRow(rowId, { isSearching: true })
      const timer = setTimeout(async () => {
        const { products } = await getProducts({ search: query, isActive: true, pageSize: 8, sellableOnly: true })
        updateRow(rowId, { searchResults: products as ProductWithImages[], isSearching: false })
      }, 400)
      setSearchTimers((prev) => ({ ...prev, [rowId]: timer }))
    },
    [searchTimers, updateRow]
  )

  const selectProduct = useCallback(
    (rowId: string, product: ProductWithImages) => {
      updateRow(rowId, {
        product,
        searchQuery: product.name + (product.color ? ` — ${product.color}` : ''),
        searchResults: [],
        unitCost: product.costPrice ? String(product.costPrice) : '',
      })
    },
    [updateRow]
  )

  const addRow = () => setRows((prev) => [...prev, newRow()])
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id))

  // Duplicate product check
  const productIds = rows.map((r) => r.product?.id).filter(Boolean)
  const hasDuplicates = productIds.length !== new Set(productIds).size

  const handleSubmit = () => {
    const validRows = rows.filter((r) => r.product && Number(r.quantity) > 0)
    if (validRows.length === 0) {
      toast.error('Agrega al menos un producto con cantidad válida')
      return
    }

    startTransition(async () => {
      try {
        await createBulkStockEntry(
          validRows.map((r) => ({
            productId: r.product!.id,
            quantity: Number(r.quantity),
            unitCost: r.unitCost ? Number(r.unitCost) : null,
            notes: r.notes || null,
          }))
        )
        toast.success(`${validRows.length} ingreso(s) registrados correctamente`)
        router.push('/inventory')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar los ingresos')
      }
    })
  }

  return (
    <div className="space-y-6">
      {hasDuplicates && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Hay productos repetidos. Se crearán movimientos separados para cada fila.
        </div>
      )}

      {/* Row headers — desktop */}
      <div className="hidden md:grid grid-cols-[1fr_100px_120px_1fr_40px] gap-3 text-xs font-medium text-muted-foreground px-1">
        <span>Producto</span>
        <span>Cantidad *</span>
        <span>Costo Unitario</span>
        <span>Notas</span>
        <span />
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="glass-card rounded-xl p-4 space-y-3 md:space-y-0">
            {/* Mobile label */}
            <p className="md:hidden text-xs font-medium text-muted-foreground">
              Producto {index + 1}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_120px_1fr_40px] gap-3 items-start">
              {/* Product search */}
              <div className="relative">
                <Label className="md:hidden text-xs mb-1 block">Producto *</Label>
                <div className="relative">
                  {row.product ? (
                    <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    placeholder="Buscar producto..."
                    value={row.searchQuery}
                    onChange={(e) => handleSearch(row.id, e.target.value)}
                    className="pl-9"
                  />
                </div>
                {/* Search results dropdown */}
                {row.searchResults.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 left-0 right-0 glass-card rounded-xl border border-white/20 shadow-xl overflow-hidden">
                    {row.searchResults.map((p) => {
                      const img = p.images[0]
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectProduct(row.id, p)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors text-left"
                        >
                          <div className="relative h-8 w-8 rounded-md overflow-hidden bg-white/10 shrink-0">
                            {img ? (
                              <Image
                                src={img.thumbnailUrl || img.imageUrl}
                                alt={p.name}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {p.name}
                              {p.color && (
                                <span className="ml-1.5 text-primary font-semibold">— {p.color}</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Stock actual: {p.stock}
                              {p.costPrice && ` · Costo: ${formatCurrency(Number(p.costPrice))}`}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
                {row.isSearching && (
                  <p className="absolute top-full mt-1 left-0 text-xs text-muted-foreground px-1">
                    Buscando...
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <Label className="md:hidden text-xs mb-1 block">Cantidad *</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={row.quantity}
                  onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                />
              </div>

              {/* Unit cost */}
              <div>
                <Label className="md:hidden text-xs mb-1 block">Costo Unitario</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={row.unitCost}
                  onChange={(e) => updateRow(row.id, { unitCost: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div>
                <Label className="md:hidden text-xs mb-1 block">Notas</Label>
                <Input
                  placeholder="Opcional..."
                  value={row.notes}
                  onChange={(e) => updateRow(row.id, { notes: e.target.value })}
                />
              </div>

              {/* Remove */}
              <div className="flex items-center justify-end md:justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar fila"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  className="h-9 w-9 text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add row */}
      <Button
        type="button"
        variant="outline"
        onClick={addRow}
        className="w-full border-dashed border-white/30 hover:border-primary/50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar producto
      </Button>

      {/* Summary */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          {rows.filter((r) => r.product && Number(r.quantity) > 0).length} producto(s) listos para registrar
        </p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || rows.every((r) => !r.product || !Number(r.quantity))}
          >
            {isPending ? 'Guardando...' : 'Registrar Ingresos'}
          </Button>
        </div>
      </div>
    </div>
  )
}
