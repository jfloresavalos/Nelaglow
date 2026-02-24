import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getClients } from '@/actions/clients'
import { ClientsList } from '@/components/clients/clients-list'

export default async function ClientsPage(
  props: {
    searchParams: Promise<{ search?: string; page?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1
  const search = searchParams?.search || ''

  const { clients, total, pages } = await getClients({
    search,
    page,
    pageSize: 10,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu base de clientes ({total} clientes)
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      <ClientsList clients={clients} totalPages={pages} currentPage={page} currentSearch={search} />
    </div>
  )
}
