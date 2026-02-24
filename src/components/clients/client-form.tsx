'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { clientSchema, type ClientFormValues } from '@/lib/validations/client'
import { createClient, updateClient } from '@/actions/clients'
import { DniLookupField } from '@/components/clients/dni-lookup-field'
import { PERU_DEPARTMENTS } from '@/lib/constants'
import type { Client } from '@/generated/prisma'

interface ClientFormProps {
  client?: Client
  onSuccess?: (client: Client) => void  // override redirect (used in dialogs)
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      dni: client?.dni || '',
      name: client?.name || '',
      phone: client?.phone || '',
      email: client?.email || '',
      address: client?.address || '',
      department: client?.department || '',
      province: client?.province || '',
      district: client?.district || '',
      notes: client?.notes || '',
    },
  })

  const department = watch('department')
  const dniValue = watch('dni') || ''

  const onSubmit = async (data: ClientFormValues) => {
    setIsSubmitting(true)

    try {
      if (client) {
        await updateClient(client.id, data)
        toast.success('Cliente actualizado correctamente')
        if (onSuccess) {
          onSuccess({ ...client, ...data } as Client)
        } else {
          router.push('/clients')
          router.refresh()
        }
      } else {
        const newClient = await createClient(data)
        toast.success('Cliente creado correctamente')
        if (onSuccess && newClient) {
          onSuccess(newClient as Client)
        } else {
          router.push('/clients')
          router.refresh()
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar cliente')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos Personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Nombre del cliente"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>DNI</Label>
              <DniLookupField
                value={dniValue}
                onChange={(v) => setValue('dni', v || null)}
                onNameFound={(name) => setValue('name', name)}
              />
              {errors.dni && (
                <p className="text-sm text-red-500">{errors.dni.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="999 999 999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="cliente@email.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Direccion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Direccion</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Av. Principal 123, Dpto 401"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Select
                value={department || ''}
                onValueChange={(value) => setValue('department', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {PERU_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Input
                id="province"
                {...register('province')}
                placeholder="Provincia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">Distrito</Label>
              <Input
                id="district"
                {...register('district')}
                placeholder="Distrito"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('notes')}
            placeholder="Notas adicionales sobre el cliente..."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {client ? 'Actualizar' : 'Crear'} Cliente
        </Button>
      </div>
    </form>
  )
}
