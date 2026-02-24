'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Check, Plus, Loader2, UserRound } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { searchClients } from '@/actions/clients'
import { NewClientDialog } from '@/components/orders/wizard/new-client-dialog'
import type { Client } from '@/generated/prisma'

interface StepClientProps {
  selectedClient: Client | null
  onSelect: (client: Client) => void
}

export function StepClient({ selectedClient, onSelect }: StepClientProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Client[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (search.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    timerRef.current = setTimeout(async () => {
      const clients = await searchClients(search)
      setResults(clients)
      setIsSearching(false)
    }, 350)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [search])

  const handleSelect = (client: Client) => {
    onSelect(client)
    setSearch(client.name)
    setResults([])
  }

  const handleNewClient = (client: Client) => {
    onSelect(client)
    setSearch(client.name)
    setResults([])
    setShowNewDialog(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            placeholder="Buscar por nombre, teléfono o DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowNewDialog(true)}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Selected client highlight */}
      {selectedClient && search === selectedClient.name && results.length === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/50 bg-primary/5">
          <Check className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-primary">{selectedClient.name}</p>
            <p className="text-sm text-muted-foreground">
              {selectedClient.phone && `Tel: ${selectedClient.phone}`}
              {selectedClient.dni && ` · DNI: ${selectedClient.dni}`}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {search.length < 2 && !selectedClient && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <UserRound className="h-10 w-10 opacity-30" />
          <p className="text-sm text-center">
            Escribe al menos 2 caracteres para buscar un cliente,<br />
            o crea uno nuevo con el botón de arriba.
          </p>
        </div>
      )}

      {/* Search results */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => handleSelect(client)}
              className={cn(
                'w-full rounded-xl border p-4 text-left transition-all hover:bg-white/10',
                selectedClient?.id === client.id
                  ? 'border-primary bg-primary/5'
                  : 'border-white/20 glass-card'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {client.phone && `Tel: ${client.phone}`}
                    {client.dni && ` · DNI: ${client.dni}`}
                  </p>
                  {client.department && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[client.district, client.province, client.department]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
                {selectedClient?.id === client.id && (
                  <Check className="h-5 w-5 text-primary shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {search.length >= 2 && !isSearching && results.length === 0 && !selectedClient && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
          <p className="text-sm">No se encontraron clientes para &quot;{search}&quot;</p>
          <Button
            type="button"
            size="sm"
            onClick={() => setShowNewDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Crear cliente &quot;{search}&quot;
          </Button>
        </div>
      )}

      <NewClientDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreated={handleNewClient}
      />
    </div>
  )
}
