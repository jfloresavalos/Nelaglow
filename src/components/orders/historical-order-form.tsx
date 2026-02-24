'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, Search, X, Minus, PackageSearch } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ColorSwatch } from '@/components/products/color-swatch'
import { DniLookupField } from '@/components/clients/dni-lookup-field'
import { PERU_DEPARTMENTS, PERU_PROVINCES, SHIPPING_AGENCIES } from '@/lib/constants'
import { getProductsForWizard } from '@/actions/products'
import { createHistoricalOrder } from '@/actions/orders'
import type { ProductForWizard } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type ItemRow = {
  id: string
  productId: string
  productName: string
  color: string | null
  quantity: number
  unitPrice: number
}

// ── Product picker ────────────────────────────────────────────────────────────

function ProductPicker({ onAdd }: { onAdd: (item: Omit<ItemRow, 'id'>) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductForWizard[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  // Step 2: color + qty + price for the chosen product
  const [selected, setSelected] = useState<ProductForWizard | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounced search inside dialog
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
    const v = selected?.variants.find(x => x.id === variantId)
    if (v) setPrice(String(Number(v.price)))
  }, [selected])

  const handleAdd = () => {
    if (!selected || !selectedVariantId || !price || qty < 1) {
      toast.error('Completa producto, color y precio')
      return
    }
    const variant = selected.variants.find(x => x.id === selectedVariantId)
    onAdd({
      productId: selectedVariantId,
      productName: selected.name,
      color: variant?.color ?? null,
      quantity: qty,
      unitPrice: Number(price),
    })
    // Reset and close
    setSelected(null)
    setSelectedVariantId('')
    setPrice('')
    setQty(1)
    setQuery('')
    setOpen(false)
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
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors text-left"
      >
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <PackageSearch className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Buscar producto</p>
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

          {/* ── Step 1: Search & pick product ── */}
          {!selected ? (
            <div className="flex flex-col flex-1 overflow-hidden px-5 pb-5 gap-3">
              {/* Search input */}
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

              {/* Results list */}
              <div className="flex-1 overflow-y-auto space-y-1 min-h-[200px]">
                {results.length > 0 ? results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => chooseProduct(p)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/10 transition-colors text-left border border-transparent hover:border-white/10"
                  >
                    {/* Image */}
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
                      {thumb(p) ? (
                        <Image src={thumb(p)!} alt={p.name} width={56} height={56} className="object-cover w-full h-full" />
                      ) : (
                        <PackageSearch className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{p.name}</p>
                      {p.category && (
                        <p className="text-xs text-muted-foreground mt-0.5">{p.category.name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {p.variants.length > 0 ? (
                          <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                            {p.variants.length} colores
                          </Badge>
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
            /* ── Step 2: Configure (color + qty + price) ── */
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
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                  onClick={() => { setSelected(null); setSelectedVariantId(''); setPrice('') }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Color swatches */}
              {selected.variants.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Color *</Label>
                  <div className="flex flex-wrap gap-2">
                    {selected.variants.map((v) => (
                      <button key={v.id} type="button" onClick={() => selectVariant(v.id)}
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

              {/* Single variant auto-selected */}
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
                    <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="px-3 h-full hover:bg-white/10 transition-colors text-muted-foreground">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="flex-1 text-center text-sm font-bold tabular-nums">{qty}</span>
                    <button type="button" onClick={() => setQty(q => q + 1)}
                      className="px-3 h-full hover:bg-white/10 transition-colors text-muted-foreground">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Precio unitario (S/) *</Label>
                  <Input type="number" step="0.01" min="0" value={price}
                    onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="h-10" />
                </div>
              </div>

              {/* Subtotal preview */}
              {price && qty > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                  Subtotal: <span className="font-bold text-foreground">S/ {(Number(price) * qty).toFixed(2)}</span>
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <Button type="button" variant="outline" className="flex-1" onClick={resetAndClose}>
                  Cancelar
                </Button>
                <Button type="button" className="flex-1" onClick={handleAdd}
                  disabled={!selectedVariantId || !price}>
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

// ── Main form ─────────────────────────────────────────────────────────────────

export function HistoricalOrderForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Cliente
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientDni, setClientDni] = useState('')

  // Pedido
  const today = new Date().toISOString().split('T')[0]
  const [orderDate, setOrderDate] = useState(today)
  const [finalStatus, setFinalStatus] = useState<'SHIPPED' | 'DELIVERED'>('SHIPPED')
  const [notes, setNotes] = useState('')

  // Productos
  const [items, setItems] = useState<ItemRow[]>([])

  // Envío
  const [department, setDepartment] = useState('')
  const [province, setProvince] = useState('')
  const [agencyName, setAgencyName] = useState('')
  const [trackingCode, setTrackingCode] = useState('')

  // Pago
  const [paidAmount, setPaidAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'YAPE' | 'TRANSFERENCIA' | 'EFECTIVO' | 'CONTRAENTREGA'>('EFECTIVO')

  const addItem = useCallback((item: Omit<ItemRow, 'id'>) => {
    setItems(prev => [...prev, { ...item, id: crypto.randomUUID() }])
  }, [])

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientName.trim()) { toast.error('Nombre de la cliente requerido'); return }
    if (items.length === 0) { toast.error('Agrega al menos un producto'); return }
    if (!department) { toast.error('Departamento requerido'); return }
    if (!province.trim()) { toast.error('Provincia requerida'); return }
    if (!agencyName) { toast.error('Agencia Shalom requerida'); return }

    setIsLoading(true)
    try {
      const result = await createHistoricalOrder({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientDni: clientDni.trim() || undefined,
        orderDate,
        finalStatus,
        notes: notes.trim() || undefined,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        shipping: {
          recipientName: clientName.trim(),
          recipientPhone: clientPhone.trim(),
          department,
          province: province.trim(),
          agencyName,
          trackingCode: trackingCode.trim() || undefined,
        },
        paidAmount: Number(paidAmount) || 0,
        paymentMethod: paidAmount ? paymentMethod : null,
      })

      toast.success(`Pedido ${result.orderNumber} registrado`)
      router.push(`/orders/${result.orderId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar pedido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Fecha y Estado ─────────────────────────────────────────────────── */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-base">Fecha y estado del pedido</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="orderDate">Fecha original del pedido *</Label>
            <Input
              id="orderDate"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              max={today}
            />
          </div>
          <div className="space-y-2">
            <Label>Estado final *</Label>
            <div className="flex gap-2 pt-1">
              {(['SHIPPED', 'DELIVERED'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFinalStatus(s)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    finalStatus === s
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-white/20 text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  {s === 'SHIPPED' ? 'Enviado' : 'Entregado'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Cliente ────────────────────────────────────────────────────────── */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-base">Datos de la cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="clientName">Nombre *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientPhone">Teléfono</Label>
            <Input
              id="clientPhone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="999 999 999"
            />
          </div>
          <div className="space-y-2">
            <Label>DNI</Label>
            <DniLookupField
              value={clientDni}
              onChange={setClientDni}
              onNameFound={setClientName}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Productos ─────────────────────────────────────────────────────── */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-base">Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length > 0 && (
            <div className="divide-y divide-white/10">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    {item.color && <ColorSwatch color={item.color} size="sm" showLabel />}
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0">
                    {item.quantity} × S/ {item.unitPrice.toFixed(2)}
                  </span>
                  <span className="text-sm font-semibold shrink-0 w-20 text-right">
                    S/ {(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-sm font-bold">
                <span>Total productos</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
            </div>
          )}
          <ProductPicker onAdd={addItem} />
        </CardContent>
      </Card>

      {/* ── Envío Shalom ──────────────────────────────────────────────────── */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-base">Envío por agencia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Departamento destino *</Label>
            <Select
              value={department}
              onValueChange={(d) => { setDepartment(d); setProvince('') }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar departamento" />
              </SelectTrigger>
              <SelectContent>
                {PERU_DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Provincia *</Label>
            {department && PERU_PROVINCES[department] ? (
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar provincia" />
                </SelectTrigger>
                <SelectContent>
                  {PERU_PROVINCES[department].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Selecciona un departamento primero"
                disabled={!department}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>Agencia *</Label>
            <Select value={agencyName} onValueChange={setAgencyName}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar agencia" />
              </SelectTrigger>
              <SelectContent>
                {SHIPPING_AGENCIES.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="trackingCode">Código de guía Shalom</Label>
            <Input
              id="trackingCode"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Código de seguimiento (opcional)"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Pago ──────────────────────────────────────────────────────────── */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-base">Pago del pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Solo el pago de los productos (el costo de Shalom lo paga la cliente en la agencia).
          </p>
          {subtotal > 0 && (
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-white/10"
                onClick={() => setPaidAmount(subtotal.toFixed(2))}
              >
                Pagado completo: S/ {subtotal.toFixed(2)}
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-white/10"
                onClick={() => setPaidAmount('0')}
              >
                Sin pago / pendiente
              </Badge>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Monto pagado (S/)</Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
              />
              {subtotal > 0 && Number(paidAmount) < subtotal && (
                <p className="text-xs text-amber-500">
                  Pendiente: S/ {(subtotal - Number(paidAmount || 0)).toFixed(2)}
                </p>
              )}
            </div>
            {Number(paidAmount) > 0 && (
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YAPE">Yape</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                    <SelectItem value="CONTRAENTREGA">Contraentrega</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Notas ─────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas adicionales</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones del pedido..."
        />
      </div>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/orders')}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || items.length === 0}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Registrar pedido histórico
        </Button>
      </div>
    </form>
  )
}
