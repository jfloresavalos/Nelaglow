'use client'

import { Input } from '@/components/ui/input'
import { X, ShoppingBag } from 'lucide-react'
import { ProductPickerDialog } from '@/components/shared/product-picker-dialog'
import { formatCurrency } from '@/lib/utils'
import type { PickedItem } from '@/components/shared/product-picker-dialog'
import type { WizardItemState } from '@/types'

interface StepProductsProps {
  items: WizardItemState[]
  onChange: (items: WizardItemState[]) => void
}

export function StepProducts({ items, onChange }: StepProductsProps) {
  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)

  const handleAdd = (picked: PickedItem) => {
    const productName = picked.color
      ? `${picked.productName} — ${picked.color}`
      : picked.productName

    // Si ya está en el carrito, sumar cantidad
    const existingIdx = items.findIndex((i) => i.productId === picked.productId)
    if (existingIdx >= 0) {
      const newItems = [...items]
      newItems[existingIdx] = {
        ...newItems[existingIdx],
        quantity: newItems[existingIdx].quantity + picked.quantity,
      }
      onChange(newItems)
    } else {
      onChange([
        ...items,
        {
          productId: picked.productId,
          quantity: picked.quantity,
          unitPrice: picked.unitPrice,
          originalUnitPrice: picked.unitPrice,
          productName,
        },
      ])
    }
  }

  const updateItemPrice = (productId: string, newPrice: number) => {
    onChange(items.map((i) => (i.productId === productId ? { ...i, unitPrice: newPrice } : i)))
  }

  const removeItem = (productId: string) =>
    onChange(items.filter((i) => i.productId !== productId))

  return (
    <div className="space-y-4">
      {/* Trigger catálogo */}
      <ProductPickerDialog onAdd={handleAdd} />

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-3">
          <ShoppingBag className="h-10 w-10 opacity-30" />
          <p className="text-sm text-center">
            Aún no hay productos. Usa el botón de arriba para buscar y agregar.
          </p>
        </div>
      )}

      {/* Carrito */}
      {items.length > 0 && (
        <div className="glass-card p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
          <h4 className="font-bold text-primary">
            Carrito ({items.length} producto{items.length !== 1 ? 's' : ''})
          </h4>
          {items.map((item) => (
            <div key={item.productId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-muted-foreground hover:text-red-500 transition-colors bg-white/30 rounded-full p-1 shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="truncate">
                    {item.productName}{' '}
                    <span className="text-muted-foreground">x{item.quantity}</span>
                  </span>
                </div>
                <span className="font-semibold shrink-0 ml-2">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
              {/* Ajuste de precio */}
              <div className="flex items-center gap-2 pl-7">
                <span className="text-xs text-muted-foreground">Precio unit.:</span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItemPrice(item.productId, Number(e.target.value))}
                    className="h-6 w-24 text-xs px-2 py-0"
                  />
                  {item.unitPrice !== item.originalUnitPrice && (
                    <span className="text-xs line-through text-muted-foreground/60">
                      {formatCurrency(item.originalUnitPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="border-t border-primary/20 pt-2 flex justify-between font-bold text-base">
            <span>Subtotal</span>
            <span className="text-primary">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      )}

      {/* Agregar otro producto si ya hay items */}
      {items.length > 0 && (
        <ProductPickerDialog onAdd={handleAdd} triggerLabel="Agregar otro producto" />
      )}
    </div>
  )
}
