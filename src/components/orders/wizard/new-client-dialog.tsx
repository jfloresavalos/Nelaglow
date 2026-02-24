'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ClientForm } from '@/components/clients/client-form'
import type { Client } from '@/generated/prisma'

interface NewClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (client: Client) => void
}

export function NewClientDialog({ open, onOpenChange, onCreated }: NewClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass border-white/20">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
        </DialogHeader>
        <ClientForm
          onSuccess={(client) => {
            onCreated(client)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
