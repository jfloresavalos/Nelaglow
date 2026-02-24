'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { createOrder } from '@/actions/orders'
import { StepClient } from './wizard/step-client'
import { StepProducts } from './wizard/step-products'
import { StepShipping } from './wizard/step-shipping'
import { StepPayment } from './wizard/step-payment'
import { StepConfirmation } from './wizard/step-confirmation'
import type { Client } from '@/generated/prisma'
import type { CreateOrderInput, ShippingInput, PaymentInput } from '@/lib/validations/order'
import type { WizardItemState } from '@/types'

const steps = [
  { id: 1, name: 'Cliente', description: 'Selecciona el cliente' },
  { id: 2, name: 'Productos', description: 'Agrega productos al pedido' },
  { id: 3, name: 'Envio', description: 'Configura el envio' },
  { id: 4, name: 'Pago', description: 'Registra el pago' },
  { id: 5, name: 'Confirmar', description: 'Revisa y confirma' },
]

export function OrderWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Wizard state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [wizardItems, setWizardItems] = useState<WizardItemState[]>([])
  const [shippingType, setShippingType] = useState<'PROVINCIA' | 'DELIVERY_LIMA' | 'RECOJO_TIENDA'>('RECOJO_TIENDA')
  const [shipping, setShipping] = useState<ShippingInput | null>(null)
  const [payment, setPayment] = useState<PaymentInput | null>(null)
  const [notes, setNotes] = useState('')

  // Calculate totals
  const subtotal = wizardItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
  const shippingAmount = shipping?.deliveryFee || 0
  const total = subtotal + shippingAmount

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!selectedClient
      case 2:
        return wizardItems.length > 0
      case 3:
        if (shippingType === 'RECOJO_TIENDA') return true
        return shipping && shipping.recipientName && shipping.recipientPhone
      case 4:
        if (shippingType === 'PROVINCIA') {
          return payment && payment.amount >= total
        }
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (canProceed() && currentStep < 5) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!selectedClient) return

    setIsSubmitting(true)

    try {
      const orderData: CreateOrderInput = {
        clientId: selectedClient.id,
        shippingType,
        // Map WizardItemState → OrderItemInput (drop client-only fields)
        items: wizardItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        shipping: shippingType !== 'RECOJO_TIENDA' ? shipping : null,
        payment: payment && payment.amount > 0 ? payment : null,
        notes: notes || null,
      }

      const order = await createOrder(orderData)
      toast.success(`Pedido ${order.orderNumber} creado exitosamente`)
      router.push(`/orders/${order.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li
              key={step.id}
              className={cn(
                'relative',
                stepIdx !== steps.length - 1 ? 'flex-1 pr-8 sm:pr-20' : ''
              )}
            >
              <div className="flex items-center">
                <div
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full',
                    step.id < currentStep
                      ? 'bg-primary'
                      : step.id === currentStep
                        ? 'border-2 border-primary bg-white'
                        : 'border-2 border-gray-300 bg-white'
                  )}
                >
                  {step.id < currentStep ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-medium',
                        step.id === currentStep ? 'text-primary' : 'text-gray-500'
                      )}
                    >
                      {step.id}
                    </span>
                  )}
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-8 top-4 -ml-px h-0.5 w-full',
                      step.id < currentStep ? 'bg-primary' : 'bg-gray-300'
                    )}
                  />
                )}
              </div>
              <div className="mt-2 hidden sm:block">
                <span className="text-sm font-medium">{step.name}</span>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* Step Content */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].name}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <StepClient
              selectedClient={selectedClient}
              onSelect={setSelectedClient}
            />
          )}
          {currentStep === 2 && (
            <StepProducts
              items={wizardItems}
              onChange={setWizardItems}
            />
          )}
          {currentStep === 3 && (
            <StepShipping
              client={selectedClient}
              shippingType={shippingType}
              onShippingTypeChange={setShippingType}
              shipping={shipping}
              onShippingChange={setShipping}
            />
          )}
          {currentStep === 4 && (
            <StepPayment
              total={total}
              shippingType={shippingType}
              isContraentrega={shipping?.isContraentrega || false}
              payment={payment}
              onPaymentChange={setPayment}
            />
          )}
          {currentStep === 5 && (
            <StepConfirmation
              client={selectedClient}
              items={wizardItems}
              shippingType={shippingType}
              shipping={shipping}
              payment={payment}
              subtotal={subtotal}
              shippingAmount={shippingAmount}
              total={total}
              notes={notes}
              onNotesChange={setNotes}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
        >
          Anterior
        </Button>

        {currentStep < 5 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Siguiente
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Pedido
          </Button>
        )}
      </div>
    </div>
  )
}
