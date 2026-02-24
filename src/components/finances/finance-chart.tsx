'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { FinanceChartPoint } from '@/types'

const FinanceChartInner = dynamic(
  () => import('./finance-chart-inner'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full" />,
  }
)

export function FinanceChart({ data }: { data: FinanceChartPoint[] }) {
  return (
    <Card className="glass-card border-white/20">
      <CardHeader>
        <CardTitle className="text-base">Ingresos vs Egresos</CardTitle>
      </CardHeader>
      <CardContent>
        <FinanceChartInner data={data} />
      </CardContent>
    </Card>
  )
}
