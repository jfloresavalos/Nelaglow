'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { OrderWithRelations } from '@/types'

// Solo para pedidos PROVINCIA: genera el mensaje con el código de seguimiento de la agencia
function buildMessage(order: OrderWithRelations): string {
  const name = order.shipping?.recipientName || order.client.name
  const agency = order.shipping?.agencyName
  const tracking = order.shipping?.trackingCode

  const lines: string[] = [
    `Hola ${name} 😊 Tu pedido ${order.orderNumber} ya fue enviado${agency ? ` por ${agency}` : ''}.`,
    '',
  ]

  if (tracking) {
    lines.push(`📦 Código de seguimiento: ${tracking}`, '')
  }

  lines.push(
    'Preséntate en la agencia con tu DNI y este código para recoger tu pedido.',
    'Cualquier consulta escríbeme. ¡Gracias por tu compra! 💖',
  )

  return lines.join('\n')
}

function buildWhatsAppUrl(order: OrderWithRelations, message: string): string | null {
  const rawPhone = order.shipping?.recipientPhone || order.client.phone
  if (!rawPhone) return null
  // Normalize to Peruvian format: strip non-digits, ensure starts with 51
  const digits = rawPhone.replace(/\D/g, '')
  const normalized = digits.startsWith('51') ? digits : `51${digits}`
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

interface NotifyClientButtonProps {
  order: OrderWithRelations
}

export function NotifyClientButton({ order }: NotifyClientButtonProps) {
  const [copied, setCopied] = useState(false)
  const message = buildMessage(order)
  const waUrl = buildWhatsAppUrl(order, message)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      toast.success('Mensaje copiado')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  return (
    <div className="rounded-xl border border-emerald-200/40 bg-emerald-500/5 p-4 space-y-3">
      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
        Mensaje para la cliente
      </p>
      <pre className="text-xs rounded-lg p-3 whitespace-pre-wrap font-sans text-foreground/80 border border-white/10 bg-white/5 leading-relaxed">
        {message}
      </pre>
      <div className="flex gap-2 flex-wrap">
        {waUrl ? (
          <Button
            asChild
            size="sm"
            className="bg-[#25D366] hover:bg-[#1db954] text-white border-0 shadow-sm"
          >
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-1.5" />
              Abrir en WhatsApp
            </a>
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground self-center">
            Sin número registrado — usa el botón Copiar
          </p>
        )}
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied
            ? <Check className="h-4 w-4 mr-1.5 text-emerald-500" />
            : <Copy className="h-4 w-4 mr-1.5" />
          }
          {copied ? 'Copiado' : 'Copiar mensaje'}
        </Button>
      </div>
    </div>
  )
}
