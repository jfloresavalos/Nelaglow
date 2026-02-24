'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useDebounce } from '@/lib/hooks'
import Link from 'next/link'
import { toast } from 'sonner'
import { Search, Edit, Trash2, Eye, Phone, Mail, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteClient } from '@/actions/clients'
import type { ClientWithOrdersCount } from '@/types'

interface ClientsListProps {
  clients: ClientWithOrdersCount[]
  totalPages: number
  currentPage: number
  currentSearch: string
}

export function ClientsList({ clients, totalPages, currentPage, currentSearch }: ClientsListProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [searchValue, setSearchValue] = useState(currentSearch)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const debouncedSearch = useDebounce(searchValue)

  useEffect(() => {
    if (debouncedSearch === currentSearch) return
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }, [debouncedSearch, currentSearch, router, pathname])

  const buildPageQuery = (page: number) => {
    const params = new URLSearchParams()
    if (searchValue) params.set('search', searchValue)
    params.set('page', String(page))
    return params.toString()
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      await deleteClient(deleteId)
      toast.success('Cliente eliminado correctamente')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar cliente')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, telefono o DNI..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
          {searchValue || currentSearch
            ? 'No se encontraron clientes con esa busqueda'
            : 'No hay clientes registrados'}
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="grid gap-4 md:hidden">
            {clients.map((client) => (
              <Card key={client.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium text-lg text-primary">{client.name}</h3>
                      {client.dni && (
                        <p className="text-sm text-muted-foreground">
                          DNI: {client.dni}
                        </p>
                      )}
                      {client.phone && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 text-primary" />
                          {client.phone}
                        </p>
                      )}
                      {client.email && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 text-primary" />
                          {client.email}
                        </p>
                      )}
                      {client.department && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>
                            {client.district && `${client.district}, `}
                            {client.province && `${client.province}, `}
                            {client.department}
                          </span>
                        </p>
                      )}
                      <p className="text-sm font-semibold mt-2">
                        {client._count.orders} pedidos
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="ghost" size="icon" asChild className="touch-target">
                        <Link href={`/clients/${client.id}`}>
                          <Eye className="h-5 w-5 text-primary" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="touch-target">
                        <Link href={`/clients/${client.id}/edit`}>
                          <Edit className="h-5 w-5 text-primary" />
                        </Link>
                      </Button>
                      {client._count.orders === 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(client.id)}
                          className="touch-target text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden rounded-lg border bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Ubicacion</TableHead>
                  <TableHead className="text-center">Pedidos</TableHead>
                  <TableHead className="w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        {client.email && (
                          <p className="text-sm text-muted-foreground">
                            {client.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{client.dni || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>
                      {client.department ? (
                        <span className="text-sm">
                          {client.district && `${client.district}, `}
                          {client.province && `${client.province}, `}
                          {client.department}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {client._count.orders}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/clients/${client.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/clients/${client.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        {client._count.orders === 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(client.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`${pathname}?${buildPageQuery(currentPage - 1)}`)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="text-sm text-muted-foreground">
                Pagina {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`${pathname}?${buildPageQuery(currentPage + 1)}`)}
                disabled={currentPage >= totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El cliente sera eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
