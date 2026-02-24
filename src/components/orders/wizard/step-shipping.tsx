'use client'

import { useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { PERU_DEPARTMENTS, SHIPPING_AGENCIES } from '@/lib/constants'
import { Truck, Store, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Client } from '@/generated/prisma'
import type { ShippingInput } from '@/lib/validations/order'

interface StepShippingProps {
  client: Client | null
  shippingType: 'PROVINCIA' | 'DELIVERY_LIMA' | 'RECOJO_TIENDA'
  onShippingTypeChange: (type: 'PROVINCIA' | 'DELIVERY_LIMA' | 'RECOJO_TIENDA') => void
  shipping: ShippingInput | null
  onShippingChange: (shipping: ShippingInput | null) => void
}

const shippingOptions = [
  {
    value: 'RECOJO_TIENDA',
    label: 'Recojo en Tienda',
    description: 'El cliente recoge el pedido',
    icon: Store,
  },
  {
    value: 'DELIVERY_LIMA',
    label: 'Delivery Lima',
    description: 'Envio dentro de Lima',
    icon: Truck,
  },
  {
    value: 'PROVINCIA',
    label: 'Envio a Provincia',
    description: 'Envio por agencia',
    icon: MapPin,
  },
] as const

export function StepShipping({
  client,
  shippingType,
  onShippingTypeChange,
  shipping,
  onShippingChange,
}: StepShippingProps) {
  // Initialize shipping data from client
  useEffect(() => {
    if (shippingType !== 'RECOJO_TIENDA' && !shipping && client) {
      onShippingChange({
        recipientName: client.name,
        recipientPhone: client.phone || '',
        recipientAddress: client.address,
        department: client.department,
        province: client.province,
        district: client.district,
        agencyName: null,
        agencyAddress: null,
        deliveryFee: null,
        isContraentrega: false,
      })
    }
  }, [shippingType, client, shipping, onShippingChange])

  const updateField = (field: keyof ShippingInput, value: string | number | boolean | null) => {
    if (!shipping) return
    onShippingChange({ ...shipping, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Shipping Type Selection */}
      <div className="grid gap-4 sm:grid-cols-3">
        {shippingOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onShippingTypeChange(option.value)
              if (option.value === 'RECOJO_TIENDA') {
                onShippingChange(null)
              }
            }}
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50',
              shippingType === option.value && 'border-primary bg-primary/5'
            )}
          >
            <option.icon className={cn(
              'h-8 w-8',
              shippingType === option.value ? 'text-primary' : 'text-muted-foreground'
            )} />
            <span className="font-medium">{option.label}</span>
            <span className="text-xs text-muted-foreground text-center">
              {option.description}
            </span>
          </button>
        ))}
      </div>

      {/* Shipping Details */}
      {shippingType !== 'RECOJO_TIENDA' && shipping && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Nombre del destinatario *</Label>
                <Input
                  id="recipientName"
                  value={shipping.recipientName}
                  onChange={(e) => updateField('recipientName', e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">Telefono *</Label>
                <Input
                  id="recipientPhone"
                  value={shipping.recipientPhone}
                  onChange={(e) => updateField('recipientPhone', e.target.value)}
                  placeholder="999 999 999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientAddress">Direccion</Label>
              <Input
                id="recipientAddress"
                value={shipping.recipientAddress || ''}
                onChange={(e) => updateField('recipientAddress', e.target.value)}
                placeholder="Direccion completa"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={shipping.department || ''}
                  onValueChange={(value) => updateField('department', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERU_DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <Input
                  id="province"
                  value={shipping.province || ''}
                  onChange={(e) => updateField('province', e.target.value)}
                  placeholder="Provincia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">Distrito</Label>
                <Input
                  id="district"
                  value={shipping.district || ''}
                  onChange={(e) => updateField('district', e.target.value)}
                  placeholder="Distrito"
                />
              </div>
            </div>

            {/* Agency info for Provincia */}
            {shippingType === 'PROVINCIA' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Agencia de envio</Label>
                    <Select
                      value={shipping.agencyName || ''}
                      onValueChange={(value) => updateField('agencyName', value || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar agencia" />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIPPING_AGENCIES.map((agency) => (
                          <SelectItem key={agency} value={agency}>
                            {agency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agencyAddress">Direccion de agencia destino</Label>
                    <Input
                      id="agencyAddress"
                      value={shipping.agencyAddress || ''}
                      onChange={(e) => updateField('agencyAddress', e.target.value)}
                      placeholder="Terminal, direccion..."
                    />
                  </div>
                </div>
              </>
            )}

            {/* Delivery fee */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Costo de envio (S/)</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  step="0.50"
                  value={shipping.deliveryFee || ''}
                  onChange={(e) => updateField('deliveryFee', e.target.value ? Number(e.target.value) : null)}
                  placeholder="0.00"
                />
              </div>

              {/* Contraentrega only for Lima */}
              {shippingType === 'DELIVERY_LIMA' && (
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="contraentrega"
                    checked={shipping.isContraentrega}
                    onCheckedChange={(checked) => updateField('isContraentrega', checked)}
                  />
                  <Label htmlFor="contraentrega">Pago contraentrega</Label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {shippingType === 'RECOJO_TIENDA' && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            El cliente recogera el pedido en tienda. No se requiere informacion de envio.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
