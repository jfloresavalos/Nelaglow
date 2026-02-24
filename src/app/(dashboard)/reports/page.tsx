import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { BarChart3, Calendar, Clock, ShoppingBag, Package } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getDailyClose, getPendingPayments, getTopProducts, getRestockList } from '@/actions/reports'
import { PeriodSelector } from '@/components/finances/period-selector'
import type { FinancePeriod } from '@/types'

// Lazy-load each tab's client component — only the active tab is downloaded (bundle-conditional)
const DailyClose = dynamic(() =>
  import('@/components/reports/daily-close').then((m) => ({ default: m.DailyClose }))
)
const PendingPayments = dynamic(() =>
  import('@/components/reports/pending-payments').then((m) => ({ default: m.PendingPayments }))
)
const TopProducts = dynamic(() =>
  import('@/components/reports/top-products').then((m) => ({ default: m.TopProducts }))
)
const RestockList = dynamic(() =>
  import('@/components/reports/restock-list').then((m) => ({ default: m.RestockList }))
)

// ── Tab definition ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'daily',   label: 'Cierre del Día',     icon: Calendar },
  { id: 'pending', label: 'Cobros Pendientes',   icon: Clock },
  { id: 'top',     label: 'Top Ventas',          icon: ShoppingBag },
  { id: 'restock', label: 'Restock',             icon: Package },
] as const

type TabId = typeof TABS[number]['id']
const VALID_TABS: TabId[] = ['daily', 'pending', 'top', 'restock']
const VALID_PERIODS: FinancePeriod[] = ['week', 'month', 'year']

// ── Async section components ─────────────────────────────────────────────────

async function DailyCloseSection({ date }: { date?: string }) {
  const data = await getDailyClose(date)
  return <DailyClose data={data} />
}

async function PendingPaymentsSection() {
  const rows = await getPendingPayments()
  return <PendingPayments rows={rows} />
}

async function TopProductsSection({ period }: { period: FinancePeriod }) {
  const rows = await getTopProducts(period)
  return <TopProducts rows={rows} />
}

async function RestockSection() {
  const rows = await getRestockList()
  return <RestockList rows={rows} />
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="glass-card border-white/20">
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
      <Card className="glass-card border-white/20">
        <CardHeader><Skeleton className="h-5 w-52" /></CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function TopSkeleton() {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ tab?: string; period?: string; date?: string }>
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tab: TabId = VALID_TABS.includes(params.tab as TabId) ? (params.tab as TabId) : 'daily'
  const period: FinancePeriod = VALID_PERIODS.includes(params.period as FinancePeriod)
    ? (params.period as FinancePeriod)
    : 'month'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">Resumen operativo del negocio</p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const isActive = tab === t.id
          const href = tab === t.id ? '#' : `/reports?tab=${t.id}${t.id === 'top' ? `&period=${period}` : ''}`
          return (
            <Link
              key={t.id}
              href={isActive ? '#' : href}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'glass-card border border-white/20 text-muted-foreground hover:text-primary hover:bg-white/10'
              )}
            >
              <t.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'daily' && (
        <Suspense fallback={<SectionSkeleton />}>
          <DailyCloseSection date={params.date} />
        </Suspense>
      )}

      {tab === 'pending' && (
        <Suspense fallback={<SectionSkeleton />}>
          <PendingPaymentsSection />
        </Suspense>
      )}

      {tab === 'top' && (
        <>
          <div className="flex justify-end">
            <PeriodSelector currentPeriod={period} extraParam="tab=top" />
          </div>
          <Suspense key={period} fallback={<TopSkeleton />}>
            <TopProductsSection period={period} />
          </Suspense>
        </>
      )}

      {tab === 'restock' && (
        <Suspense fallback={<SectionSkeleton />}>
          <RestockSection />
        </Suspense>
      )}
    </div>
  )
}
