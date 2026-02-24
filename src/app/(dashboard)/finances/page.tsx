import { Suspense } from 'react'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getFinanceStats, getFinanceChartData, getFinanceTransactions } from '@/actions/finances'
import { FinanceStatsCards } from '@/components/finances/finance-stats-cards'
import { FinanceChart } from '@/components/finances/finance-chart'
import { TransactionsTable } from '@/components/finances/transactions-table'
import { PeriodSelector } from '@/components/finances/period-selector'
import type { FinancePeriod } from '@/types'

// ── Async section components ─────────────────────────────────────────────────

async function StatsSection({ period }: { period: FinancePeriod }) {
  const stats = await getFinanceStats(period)
  return <FinanceStatsCards stats={stats} />
}

async function ChartSection({ period }: { period: FinancePeriod }) {
  const data = await getFinanceChartData(period)
  return <FinanceChart data={data} />
}

async function TransactionsSection({ period }: { period: FinancePeriod }) {
  const rows = await getFinanceTransactions(period)
  return <TransactionsTable rows={rows} />
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="glass-card border-white/20">
          <CardHeader><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent><Skeleton className="h-8 w-2/3" /></CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card className="glass-card border-white/20">
      <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
      <CardContent><Skeleton className="h-[280px] w-full" /></CardContent>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <Card className="glass-card border-white/20">
      <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

const VALID_PERIODS: FinancePeriod[] = ['week', 'month', 'year']

export default async function FinancesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const period: FinancePeriod = VALID_PERIODS.includes(params.period as FinancePeriod)
    ? (params.period as FinancePeriod)
    : 'month'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Finanzas</h1>
            <p className="text-sm text-muted-foreground">Ingresos, egresos y flujo de caja</p>
          </div>
        </div>
        <PeriodSelector currentPeriod={period} />
      </div>

      {/* Stats cards */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection period={period} />
      </Suspense>

      {/* Chart */}
      <Suspense fallback={<ChartSkeleton />}>
        <ChartSection period={period} />
      </Suspense>

      {/* Transactions */}
      <Suspense fallback={<TableSkeleton />}>
        <TransactionsSection period={period} />
      </Suspense>
    </div>
  )
}
