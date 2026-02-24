import { ClientForm } from '@/components/clients/client-form'

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Cliente</h1>
        <p className="text-muted-foreground">
          Registra un nuevo cliente
        </p>
      </div>

      <ClientForm />
    </div>
  )
}
