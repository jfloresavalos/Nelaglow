'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { FinancePeriod } from '@/types'

const OPTIONS: { label: string; value: FinancePeriod }[] = [
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
  { label: 'Año', value: 'year' },
]

interface PeriodSelectorProps {
  currentPeriod: FinancePeriod
  /** Extra query params to preserve, e.g. "tab=top". Will be prepended before period=. */
  extraParam?: string
}

export function PeriodSelector({ currentPeriod, extraParam }: PeriodSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()

  function buildUrl(period: FinancePeriod) {
    const qs = extraParam ? `${extraParam}&period=${period}` : `period=${period}`
    return `${pathname}?${qs}`
  }

  return (
    <div className="flex gap-1 glass-card rounded-xl p-1">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={currentPeriod === opt.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => router.push(buildUrl(opt.value))}
          className="text-xs sm:text-sm"
        >
          {opt.label}
        </Button>
      ))}
    </div>
  )
}
