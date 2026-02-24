'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Search, CheckCircle2, AlertCircle } from 'lucide-react'
import { lookupDni } from '@/actions/clients'
import { toast } from 'sonner'

interface DniLookupFieldProps {
  value: string
  onChange: (dni: string) => void
  onNameFound: (name: string) => void
  disabled?: boolean
}

export function DniLookupField({ value, onChange, onNameFound, disabled }: DniLookupFieldProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'found' | 'notfound'>('idle')

  const canSearch = /^\d{8}$/.test(value)

  const handleLookup = async () => {
    if (!canSearch) return
    setLoading(true)
    setStatus('idle')
    try {
      const result = await lookupDni(value)
      if (result) {
        onNameFound(result.name)
        setStatus('found')
        toast.success(`Encontrado: ${result.name}`)
      } else {
        setStatus('notfound')
        toast.warning('DNI no encontrado en RENIEC')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al consultar')
      setStatus('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo dígitos, máx 8
    const val = e.target.value.replace(/\D/g, '').slice(0, 8)
    onChange(val)
    setStatus('idle')
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          value={value}
          onChange={handleChange}
          placeholder="12345678"
          maxLength={8}
          inputMode="numeric"
          disabled={disabled}
          className={
            status === 'found'
              ? 'border-emerald-500 pr-8'
              : status === 'notfound'
              ? 'border-amber-500 pr-8'
              : ''
          }
        />
        {status === 'found' && (
          <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
        )}
        {status === 'notfound' && (
          <AlertCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={!canSearch || loading || disabled}
        onClick={handleLookup}
        title="Buscar en RENIEC"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      </Button>
    </div>
  )
}
