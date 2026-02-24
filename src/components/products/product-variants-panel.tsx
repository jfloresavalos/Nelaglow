'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Package, Edit, Palette, Link2, Unlink,
  Search, Loader2, Check, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ColorSwatch } from '@/components/products/color-swatch'
import { ProductForm } from '@/components/products/product-form'
import {
  linkProductAsVariant,
  searchProductsForLink,
  unlinkProductVariant,
} from '@/actions/products'
import { toast } from 'sonner'
import type { ProductForWizard, ProductVariant } from '@/types'
import type { Category } from '@/generated/prisma'
import { formatCurrency } from '@/lib/utils'

interface ProductVariantsPanelProps {
  product: ProductForWizard
  categories: Category[]
}

type SearchResult = {
  id: string
  name: string
  color: string | null
  stock: number
  price: string | number
  images: { imageUrl: string; thumbnailUrl: string | null }[]
  category: { name: string } | null
}

// ─── Link existing product dialog ────────────────────────────────────────────

function LinkVariantDialog({
  open,
  onOpenChange,
  parentId,
  parentName,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  parentId: string
  parentName: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [color, setColor] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (search.length < 2) { setResults([]); setIsSearching(false); return }
    setIsSearching(true)
    timerRef.current = setTimeout(async () => {
      const products = await searchProductsForLink(search, parentId)
      setResults(products as unknown as SearchResult[])
      setIsSearching(false)
    }, 350)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [search, parentId])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearch(''); setResults([]); setSelected(null); setColor('')
    }
  }, [open])

  const handleSelect = (product: SearchResult) => {
    setSelected(product)
    setColor(product.color || '')
    setSearch(product.name)
    setResults([])
  }

  const handleLink = async () => {
    if (!selected) return
    setIsLinking(true)
    try {
      await linkProductAsVariant(selected.id, parentId, color || undefined)
      toast.success(`"${selected.name}" vinculado como variante de "${parentName}"`)
      onOpenChange(false)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al vincular')
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg glass border-white/20">
        <DialogHeader>
          <DialogTitle>Vincular variante existente — {parentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Busca un producto ya creado para vincularlo como variante de color de este producto.
            El producto buscado dejará de aparecer como producto independiente.
          </p>

          {/* Search input */}
          <div className="space-y-1.5">
            <Label>Buscar producto</Label>
            <div className="relative">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              )}
              <Input
                placeholder="Escribe al menos 2 caracteres..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelected(null) }}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          {/* Results dropdown */}
          {results.length > 0 && (
            <div className="max-h-52 overflow-y-auto rounded-xl border border-white/20 divide-y divide-white/10">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 text-left transition-colors"
                >
                  <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-white/10 shrink-0">
                    {p.images[0] ? (
                      <Image
                        src={p.images[0].thumbnailUrl || p.images[0].imageUrl}
                        alt={p.name}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.category?.name} · Stock: {p.stock}
                    </p>
                  </div>
                  {p.color && <ColorSwatch color={p.color} size="sm" />}
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {search.length >= 2 && !isSearching && results.length === 0 && !selected && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No se encontraron productos independientes para &quot;{search}&quot;
            </p>
          )}

          {/* Selected product confirmation */}
          {selected && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/50 bg-primary/5">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary truncate">{selected.name}</p>
                <p className="text-xs text-muted-foreground">Stock: {selected.stock}</p>
              </div>
              <button
                type="button"
                onClick={() => { setSelected(null); setSearch(''); setColor('') }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Color assignment */}
          {selected && (
            <div className="space-y-1.5">
              <Label htmlFor="link-color">Color de esta variante</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="link-color"
                  placeholder="ej. Rojo, Azul, Verde Menta..."
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1"
                />
                {color && <ColorSwatch color={color} size="md" showLabel />}
              </div>
              <p className="text-xs text-muted-foreground">
                Puedes dejarlo vacío si el color ya está en el nombre del producto.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLinking}>
            Cancelar
          </Button>
          <Button onClick={handleLink} disabled={!selected || isLinking} className="gap-2">
            {isLinking
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Link2 className="h-4 w-4" />
            }
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Variant card ─────────────────────────────────────────────────────────────

function VariantCard({ variant }: { variant: ProductVariant }) {
  const router = useRouter()
  const [isUnlinking, setIsUnlinking] = useState(false)
  const image = variant.images?.[0]
  const isLow = variant.stock > 0 && variant.stock <= variant.lowStockThreshold
  const isOut = variant.stock === 0

  const handleUnlink = async () => {
    if (!confirm(`¿Desvincular "${variant.name}"? Volverá a ser un producto independiente.`)) return
    setIsUnlinking(true)
    try {
      await unlinkProductVariant(variant.id)
      toast.success(`"${variant.name}" desvinculado`)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al desvincular')
      setIsUnlinking(false)
    }
  }

  return (
    <div className="glass-card rounded-xl p-3 flex items-center gap-3">
      {/* Thumbnail */}
      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-white/10 shrink-0">
        {image ? (
          <Image
            src={image.thumbnailUrl || image.imageUrl}
            alt={variant.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Color + info */}
      <div className="flex-1 min-w-0">
        {variant.color ? (
          <ColorSwatch color={variant.color} size="md" showLabel />
        ) : (
          <p className="text-sm font-medium truncate">{variant.name}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatCurrency(Number(variant.price))}
          </span>
          <span
            className={`text-xs font-medium ${
              isOut ? 'text-red-400' : isLow ? 'text-yellow-500' : 'text-emerald-500'
            }`}
          >
            {isOut ? 'Agotado' : `Stock: ${variant.stock}`}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!variant.isActive && (
          <Badge variant="secondary" className="text-xs">Inactivo</Badge>
        )}
        <Button variant="ghost" size="icon" aria-label="Editar variante" className="h-8 w-8" asChild>
          <NextLink href={`/products/${variant.id}/edit`}>
            <Edit className="h-3.5 w-3.5" />
          </NextLink>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-red-500"
          onClick={handleUnlink}
          disabled={isUnlinking}
          aria-label="Desvincular variante"
          title="Desvincular variante"
        >
          {isUnlinking
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Unlink className="h-3.5 w-3.5" />
          }
        </Button>
      </div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function ProductVariantsPanel({ product, categories }: ProductVariantsPanelProps) {
  const router = useRouter()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Variantes de Color</h3>
          {product.variants.length > 0 && (
            <Badge variant="secondary">{product.variants.length}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLinkDialog(true)}
            className="gap-1.5"
          >
            <Link2 className="h-3.5 w-3.5" />
            Vincular existente
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddDialog(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva variante
          </Button>
        </div>
      </div>

      {/* Content */}
      {product.variants.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-white/20 rounded-xl space-y-2">
          <Palette className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Este producto no tiene variantes de color todavía.
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <Button size="sm" variant="ghost" onClick={() => setShowLinkDialog(true)}>
              <Link2 className="h-3.5 w-3.5 mr-1" />
              Vincular existente
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Crear nueva
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {product.variants.map((variant) => (
            <VariantCard key={variant.id} variant={variant} />
          ))}
        </div>
      )}

      {/* Create new variant dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass border-white/20">
          <DialogHeader>
            <DialogTitle>Nueva Variante — {product.name}</DialogTitle>
          </DialogHeader>
          <ProductForm
            categories={categories}
            parentId={product.id}
            onSuccess={() => {
              setShowAddDialog(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Link existing product dialog */}
      <LinkVariantDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        parentId={product.id}
        parentName={product.name}
      />
    </div>
  )
}
