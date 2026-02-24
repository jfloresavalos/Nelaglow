'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useCallback, useTransition } from 'react'
import { useDebounce } from '@/lib/hooks'
import Image from 'next/image'
import Link from 'next/link'
import { Package, Search, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { StockMovementWithRelations, StockMovementType } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const MOVEMENT_TYPE_CONFIG: Record<
  StockMovementType,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; isIn: boolean }
> = {
  PURCHASE_IN:    { label: 'Ingreso',     variant: 'default',     isIn: true },
  RETURN_IN:      { label: 'Devolución',  variant: 'outline',     isIn: true },
  ADJUSTMENT_IN:  { label: 'Ajuste +',    variant: 'secondary',   isIn: true },
  SALE_OUT:       { label: 'Venta',       variant: 'destructive', isIn: false },
  ADJUSTMENT_OUT: { label: 'Ajuste −',    variant: 'secondary',   isIn: false },
}

interface KardexTableProps {
  movements: StockMovementWithRelations[]
  total: number
  pages: number
  currentPage: number
  currentSearch: string
  currentType: string
}

export function KardexTable({
  movements,
  total,
  pages,
  currentPage,
  currentSearch,
  currentType,
}: KardexTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(currentSearch)
  const debouncedSearch = useDebounce(searchValue)

  // Navegar solo cuando el valor debounced cambia respecto al servidor
  useEffect(() => {
    if (debouncedSearch === currentSearch) return
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (currentType) params.set('type', currentType)
    params.set('page', '1')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [debouncedSearch, currentSearch, currentType, pathname, router])

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next: Record<string, string> = {
        search: key === 'search' ? value : searchValue,
        type: currentType,
        page: key !== 'page' ? '1' : value,
        [key]: value,
      }
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(next)) {
        if (v) params.set(k, v)
      }
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [router, pathname, searchValue, currentType]
  )

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto, referencia..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={currentType || 'ALL'}
          onValueChange={(v) => updateParam('type', v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tipo de movimiento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            <SelectItem value="PURCHASE_IN">Ingreso</SelectItem>
            <SelectItem value="SALE_OUT">Venta</SelectItem>
            <SelectItem value="RETURN_IN">Devolución</SelectItem>
            <SelectItem value="ADJUSTMENT_IN">Ajuste +</SelectItem>
            <SelectItem value="ADJUSTMENT_OUT">Ajuste −</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {total} movimiento{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
      </p>

      {/* Desktop Table */}
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead>Fecha</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-center">Cantidad</TableHead>
              <TableHead className="text-right">Costo Unit.</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Usuario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No hay movimientos registrados
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m) => {
                const config = MOVEMENT_TYPE_CONFIG[m.type]
                const image = m.product.images[0]
                return (
                  <TableRow key={m.id} className="border-white/10">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(m.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="relative h-8 w-8 rounded-lg overflow-hidden bg-white/10 shrink-0">
                          {image ? (
                            <Image
                              src={image.thumbnailUrl || image.imageUrl}
                              alt={m.product.name}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{m.product.name}</p>
                          {m.product.color && (
                            <p className="text-xs text-muted-foreground">{m.product.color}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {config.isIn ? (
                          <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <ArrowDownCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        )}
                        <Badge variant={config.variant} className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          config.isIn
                            ? 'font-semibold text-emerald-500'
                            : 'font-semibold text-red-400'
                        }
                      >
                        {config.isIn ? '+' : '−'}
                        {m.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {m.unitCost ? formatCurrency(Number(m.unitCost)) : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {m.reference ? (
                        m.orderId ? (
                          <Link
                            href={`/orders/${m.orderId}`}
                            className="text-primary hover:underline font-mono"
                          >
                            {m.reference}
                          </Link>
                        ) : (
                          <span className="font-mono text-muted-foreground">{m.reference}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.user.name}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {movements.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
            No hay movimientos registrados
          </div>
        ) : (
          movements.map((m) => {
            const config = MOVEMENT_TYPE_CONFIG[m.type]
            const image = m.product.images[0]
            return (
              <div key={m.id} className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-white/10 shrink-0">
                      {image ? (
                        <Image
                          src={image.thumbnailUrl || image.imageUrl}
                          alt={m.product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{m.product.name}</p>
                      {m.product.color && (
                        <p className="text-xs text-muted-foreground">{m.product.color}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-lg font-bold ${config.isIn ? 'text-emerald-500' : 'text-red-400'}`}
                  >
                    {config.isIn ? '+' : '−'}{m.quantity}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    {config.isIn ? (
                      <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <ArrowDownCircle className="h-3.5 w-3.5 text-red-400" />
                    )}
                    <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
                  </div>
                  {m.reference && m.orderId && (
                    <Link href={`/orders/${m.orderId}`} className="text-primary text-xs font-mono hover:underline">
                      {m.reference}
                    </Link>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{m.user.name}</span>
                  <span>{formatDateTime(m.createdAt)}</span>
                </div>
                {m.notes && (
                  <p className="text-xs text-muted-foreground italic">{m.notes}</p>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() => updateParam('page', String(currentPage - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pages || isPending}
              onClick={() => updateParam('page', String(currentPage + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
