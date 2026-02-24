'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ColorSwatch } from '@/components/products/color-swatch'
import { formatCurrency } from '@/lib/utils'
import { Package, Plus } from 'lucide-react'
import type { RestockRow } from '@/types'

export function RestockList({ rows }: { rows: RestockRow[] }) {
  const totalRestockCost = rows.reduce((acc, r) => acc + (r.restockCost ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <Card className="glass-card border-red-200/40 bg-red-500/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Productos bajo stock mínimo</p>
              <p className="text-3xl font-bold text-red-500">{rows.length}</p>
            </div>
            {totalRestockCost > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Costo estimado de reposición</p>
                <p className="text-xl font-bold">{formatCurrency(totalRestockCost)}</p>
              </div>
            )}
            <Button asChild size="sm" className="shrink-0">
              <Link href="/inventory/new-entry">
                <Plus className="h-4 w-4 mr-1.5" />
                Registrar ingreso
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-base">Productos a reabastecer</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">
              Todo el stock está en niveles adecuados.
            </p>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground text-xs">
                      <th className="text-left px-4 py-3 font-medium">Producto</th>
                      <th className="text-left px-4 py-3 font-medium">Categoría</th>
                      <th className="text-center px-4 py-3 font-medium">Stock</th>
                      <th className="text-center px-4 py-3 font-medium">Mínimo</th>
                      <th className="text-center px-4 py-3 font-medium">A pedir</th>
                      <th className="text-right px-4 py-3 font-medium">Costo unit.</th>
                      <th className="text-right px-4 py-3 font-medium">Costo total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {rows.map((r) => (
                      <tr key={r.productId} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-white/10 shrink-0">
                              {r.imageUrl ? (
                                <Image src={r.imageUrl} alt={r.productName} fill sizes="36px" className="object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{r.productName}</p>
                              {r.color && <ColorSwatch color={r.color} size="sm" showLabel />}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{r.categoryName ?? '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {r.stock === 0 ? (
                            <Badge variant="destructive" className="text-xs">Agotado</Badge>
                          ) : (
                            <span className="font-bold text-red-500">{r.stock}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{r.lowStockThreshold}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{r.unitsNeeded}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {r.costPrice !== null ? formatCurrency(r.costPrice) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {r.restockCost !== null ? formatCurrency(r.restockCost) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2 p-4">
                {rows.map((r) => (
                  <div key={r.productId} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-white/10 shrink-0">
                      {r.imageUrl ? (
                        <Image src={r.imageUrl} alt={r.productName} fill sizes="40px" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{r.productName}</p>
                      {r.color && <ColorSwatch color={r.color} size="sm" showLabel />}
                    </div>
                    <div className="text-right shrink-0">
                      {r.stock === 0 ? (
                        <Badge variant="destructive" className="text-xs">Agotado</Badge>
                      ) : (
                        <p className="text-sm font-bold text-red-500">Stock: {r.stock}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Pedir: {r.unitsNeeded}</p>
                      {r.restockCost !== null && (
                        <p className="text-xs font-semibold">{formatCurrency(r.restockCost)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
