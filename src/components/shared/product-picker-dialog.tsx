'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Loader2, Search, X, Plus, Minus, PackageSearch } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ColorSwatch } from '@/components/products/color-swatch'
import { getProductsForWizard } from '@/actions/products'
import type { ProductForWizard } from '@/types'

export type PickedItem = {
  productId: string
  productName: string
  color: string | null
  quantity: number
  unitPrice: number
}

interface ProductPickerDialogProps {
  onAdd: (item: PickedItem) => void
  disabled?: boolean
  /** Texto del trigger. Por defecto: "Buscar producto" */
  triggerLabel?: string
}

export function ProductPickerDialog({
  onAdd,
  disabled = false,
  triggerLabel = 'Buscar producto',
}: ProductPickerDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductForWizard[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  // Step 2: color + qty + price
  const [selected, setSelected] = useState<ProductForWizard | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    if (!open) return
    if (query.trim().length < 2) { setResults([]); setSearched(false); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await getProductsForWizard(query)
        setResults(data)
        setSearched(true)
      } finally { setSearching(false) }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, open])

  // Focus search when dialog opens
  useEffect(() => {
    if (open) setTimeout(() => searchInputRef.current?.focus(), 100)
  }, [open])

  const chooseProduct = useCallback((p: ProductForWizard) => {
    setSelected(p)
    setResults([])
    setQuery('')
    setSearched(false)
    setQty(1)
    if (p.variants.length === 0) {
      setSelectedVariantId(p.id)
      setPrice(String(Number(p.price)))
    } else if (p.variants.length === 1) {
      setSelectedVariantId(p.variants[0].id)
      setPrice(String(Number(p.variants[0].price)))
    } else {
      setSelectedVariantId('')
      setPrice('')
    }
  }, [])

  const selectVariant = useCallback((variantId: string) => {
    setSelectedVariantId(variantId)
    const v = selected?.variants.find((x) => x.id === variantId)
    if (v) setPrice(String(Number(v.price)))
  }, [selected])

  const handleAdd = () => {
    if (!selected || !selectedVariantId || !price || qty < 1) return
    const variant = selected.variants.find((x) => x.id === selectedVariantId)
    onAdd({
      productId: selectedVariantId,
      productName: selected.name,
      color: variant?.color ?? null,
      quantity: qty,
      unitPrice: Number(price),
    })
    resetAndClose()
  }

  const resetAndClose = () => {
    setSelected(null)
    setSelectedVariantId('')
    setPrice('')
    setQty(1)
    setQuery('')
    setResults([])
    setSearched(false)
    setOpen(false)
  }

  const thumb = (p: ProductForWizard) =>
    p.images[0]?.thumbnailUrl || p.images[0]?.imageUrl || null

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <PackageSearch className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{triggerLabel}</p>
          <p className="text-xs text-muted-foreground">Clic para abrir el catálogo</p>
        </div>
        <Search className="h-4 w-4 text-muted-foreground ml-auto" />
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose() }}>
        <DialogContent className="max-w-lg glass border-white/20 max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
            <DialogTitle className="text-base">
              {selected ? 'Configurar producto' : 'Seleccionar producto'}
            </DialogTitle>
          </DialogHeader>

          {/* ── Step 1: Search ── */}
          {!selected ? (
            <div className="flex flex-col flex-1 overflow-hidden px-5 pb-5 gap-3">
              <div className="relative">
                {searching
                  ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                  : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                }
                <Input
                  ref={searchInputRef}
                  className="pl-9 pr-9"
                  placeholder="Buscar por nombre del producto..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(''); setResults([]); setSearched(false) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 min-h-[200px]">
                {results.length > 0 ? results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => chooseProduct(p)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/10 transition-colors text-left border border-transparent hover:border-white/10"
                  >
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
                      {thumb(p) ? (
                        <Image src={thumb(p)!} alt={p.name} width={56} height={56} className="object-cover w-full h-full" />
                      ) : (
                        <PackageSearch className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{p.name}</p>
                      {p.category && (
                        <p className="text-xs text-muted-foreground mt-0.5">{p.category.name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {p.variants.length > 0 ? (
                          <span className="text-xs text-muted-foreground">{p.variants.length} colores disponibles</span>
                        ) : (
                          <span className="text-sm font-bold text-emerald-500">
                            S/ {Number(p.price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    {searched ? (
                      <>
                        <PackageSearch className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">Sin resultados para &quot;{query}&quot;</p>
                      </>
                    ) : (
                      <>
                        <Search className="h-10 w-10 text-muted-foreground/20 mb-3" />
                        <p className="text-sm text-muted-foreground">Escribe para buscar productos</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Mínimo 2 caracteres</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Step 2: Configure ── */
            <div className="flex flex-col flex-1 overflow-y-auto px-5 pb-5 gap-4">
              {/* Product header */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
                  {thumb(selected) ? (
                    <Image src={thumb(selected)!} alt={selected.name} width={48} height={48} className="object-cover w-full h-full" />
                  ) : (
                    <PackageSearch className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{selected.name}</p>
                  {selected.category && <p className="text-xs text-muted-foreground">{selected.category.name}</p>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => { setSelected(null); setSelectedVariantId(''); setPrice('') }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Color swatches (multi-variant) */}
              {selected.variants.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Color *</Label>
                  <div className="flex flex-wrap gap-2">
                    {selected.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => selectVariant(v.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          selectedVariantId === v.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-white/20 hover:bg-white/10 text-muted-foreground'
                        }`}
                      >
                        <ColorSwatch color={v.color ?? ''} size="sm" />
                        <span>{v.color ?? 'Sin color'}</span>
                        <span className="text-muted-foreground/60 ml-1">S/ {Number(v.price).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Single variant */}
              {selected.variants.length === 1 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <ColorSwatch color={selected.variants[0].color ?? ''} size="sm" />
                  <span className="text-xs">{selected.variants[0].color ?? 'Sin variante'}</span>
                </div>
              )}

              {/* Qty + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Cantidad *</Label>
                  <div className="flex items-center border border-input rounded-lg overflow-hidden h-10">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="px-3 h-full hover:bg-white/10 transition-colors text-muted-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="flex-1 text-center text-sm font-bold tabular-nums">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      className="px-3 h-full hover:bg-white/10 transition-colors text-muted-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Precio unitario (S/) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Subtotal preview */}
              {price && qty > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                  Subtotal:{' '}
                  <span className="font-bold text-foreground">
                    S/ {(Number(price) * qty).toFixed(2)}
                  </span>
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <Button type="button" variant="outline" className="flex-1" onClick={resetAndClose}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleAdd}
                  disabled={!selectedVariantId || !price || qty < 1}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Agregar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
