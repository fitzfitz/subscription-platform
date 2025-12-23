import { PendingSubscriptionsTable } from '@/features/subscriptions'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function PendingSubscriptionsPage() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Pending Subscriptions</h1>
        <p className='text-muted-foreground mt-1'>Review and verify manual payment submissions</p>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertDescription>
          These subscriptions are awaiting manual verification. Review the payment proof and approve
          or reject accordingly. Approved subscriptions will become active immediately.
        </AlertDescription>
      </Alert>

      {/* Table */}
      <PendingSubscriptionsTable />
    </div>
  )
}
