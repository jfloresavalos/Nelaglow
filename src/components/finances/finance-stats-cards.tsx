'use client'

import { TrendingUp, TrendingDown, Wallet, Clock, Archive } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { FinanceStats } from '@/types'

const METHOD_LABELS: Record<string, string> = {
  YAPE: 'Yape',
  TRANSFERENCIA: 'Transfer.',
  EFECTIVO: 'Efectivo',
  CONTRAENTREGA: 'Contraentrega',
}

interface CardProps {
  title: string
  value: number
  icon: React.ElementType
  colorClass: string
  iconBgClass: string
  children?: React.ReactNode
}

function StatCard({ title, value, icon: Icon, colorClass, iconBgClass, children }: CardProps) {
  return (
    <Card className="glass-card border-white/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-xl ${iconBgClass}`}>
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className={`text-2xl font-bold ${colorClass}`}>
          {formatCurrency(value)}
        </p>
        {children}
      </CardContent>
    </Card>
  )
}

export function FinanceStatsCards({ stats }: { stats: FinanceStats }) {
  const isPositive = stats.gananciaNeta >= 0

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {/* Ingresos */}
      <StatCard
        title="Ingresos"
        value={stats.totalIngresos}
        icon={TrendingUp}
        colorClass="text-emerald-500"
        iconBgClass="bg-emerald-500/10"
      >
        <div className="flex flex-wrap gap-1">
          {Object.entries(stats.ingresosPorMetodo).map(([method, amount]) =>
            amount > 0 ? (
              <Badge key={method} variant="secondary" className="text-xs px-1.5 py-0">
                {METHOD_LABELS[method]}: {formatCurrency(amount)}
              </Badge>
            ) : null
          )}
        </div>
      </StatCard>

      {/* Egresos */}
      <StatCard
        title="Egresos"
        value={stats.totalEgresos}
        icon={TrendingDown}
        colorClass="text-red-400"
        iconBgClass="bg-red-500/10"
      />

      {/* Ganancia Neta */}
      <StatCard
        title="Ganancia Neta"
        value={stats.gananciaNeta}
        icon={Wallet}
        colorClass={isPositive ? 'text-emerald-500' : 'text-red-400'}
        iconBgClass={isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}
      >
        {stats.totalIngresos > 0 && (
          <p className="text-xs text-muted-foreground">
            Margen: {((stats.gananciaNeta / stats.totalIngresos) * 100).toFixed(1)}%
          </p>
        )}
      </StatCard>

      {/* Pendiente de cobro */}
      <StatCard
        title="Pendiente Cobro"
        value={stats.pendienteCobro}
        icon={Clock}
        colorClass="text-amber-500"
        iconBgClass="bg-amber-500/10"
      />

      {/* Inventario valorizado */}
      <StatCard
        title="Inventario"
        value={stats.inventarioValorizado}
        icon={Archive}
        colorClass="text-blue-400"
        iconBgClass="bg-blue-500/10"
      >
        <p className="text-xs text-muted-foreground">Valor a precio costo</p>
      </StatCard>
    </div>
  )
}
