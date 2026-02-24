import { cn } from '@/lib/utils'

const COLOR_MAP: Record<string, string> = {
  rojo:      '#ef4444',
  roja:      '#ef4444',
  azul:      '#3b82f6',
  verde:     '#22c55e',
  amarillo:  '#eab308',
  amarilla:  '#eab308',
  negro:     '#1f2937',
  negra:     '#1f2937',
  blanco:    '#f9fafb',
  blanca:    '#f9fafb',
  rosa:      '#ec4899',
  morado:    '#a855f7',
  morada:    '#a855f7',
  naranja:   '#f97316',
  gris:      '#9ca3af',
  celeste:   '#7dd3fc',
  plateado:  '#cbd5e1',
  plateada:  '#cbd5e1',
  dorado:    '#fbbf24',
  dorada:    '#fbbf24',
  cafe:      '#92400e',
  marrón:    '#92400e',
  turquesa:  '#2dd4bf',
  lila:      '#c4b5fd',
  beige:     '#d9c5a0',
  coral:     '#fb7185',
  fucsia:    '#e879f9',
  oliva:     '#84cc16',
  salmon:    '#fca5a5',
  cian:      '#22d3ee',
  lima:      '#a3e635',
  lavanda:   '#c4b5fd',
}

interface ColorSwatchProps {
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabel?: boolean
}

export function ColorSwatch({ color, size = 'sm', className, showLabel }: ColorSwatchProps) {
  const normalized = color.toLowerCase().trim()
  const cssColor = COLOR_MAP[normalized] ?? null

  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size]

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'rounded-full border border-white/30 shrink-0',
          sizeClass,
          !cssColor && 'bg-gradient-to-br from-primary/40 to-purple-400/40'
        )}
        style={cssColor ? { backgroundColor: cssColor } : undefined}
        title={color}
      />
      {showLabel && (
        <span className="text-sm capitalize">{color}</span>
      )}
    </span>
  )
}
