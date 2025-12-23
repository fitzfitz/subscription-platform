import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { PaymentMethodsTable, PaymentMethodDialog } from '@/features/payment-methods'

export function PaymentMethodsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Payment Methods</h1>
          <p className='text-muted-foreground mt-1'>
            Manage payment providers and methods available on the platform
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} className='mr-2 size-4' />
          Create Payment Method
        </Button>
      </div>

      {/* Table */}
      <PaymentMethodsTable />

      {/* Create Dialog */}
      <PaymentMethodDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  )
}
