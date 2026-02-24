'use client'

import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { TransactionRow } from '@/types'

const METHOD_LABELS: Record<string, string> = {
  YAPE: 'Yape',
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
  CONTRAENTREGA: 'Contraentrega',
}

export function TransactionsTable({ rows }: { rows: TransactionRow[] }) {
  return (
    <Card className="glass-card border-white/20">
      <CardHeader>
        <CardTitle className="text-base">
          Movimientos del período
          <span className="ml-2 text-sm font-normal text-muted-foreground">({rows.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop */}
        <div className="hidden md:block overflow-hidden rounded-b-2xl">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Sin movimientos en este período
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} className="border-white/10">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(row.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {row.type === 'INGRESO' ? (
                          <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <ArrowDownCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        )}
                        <Badge
                          variant={row.type === 'INGRESO' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {row.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{row.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.method ? METHOD_LABELS[row.method] ?? row.method : '—'}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${row.type === 'INGRESO' ? 'text-emerald-500' : 'text-red-400'}`}>
                      {row.type === 'INGRESO' ? '+' : '−'}{formatCurrency(row.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2 p-4">
          {rows.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              Sin movimientos en este período
            </p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                <div className="shrink-0">
                  {row.type === 'INGRESO' ? (
                    <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{row.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(row.date)}
                    {row.method ? ` · ${METHOD_LABELS[row.method] ?? row.method}` : ''}
                  </p>
                </div>
                <span className={`font-bold text-sm shrink-0 ${row.type === 'INGRESO' ? 'text-emerald-500' : 'text-red-400'}`}>
                  {row.type === 'INGRESO' ? '+' : '−'}{formatCurrency(row.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
