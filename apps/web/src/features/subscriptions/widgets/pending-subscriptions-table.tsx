import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, Cancel02Icon, ViewIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePendingSubscriptions, useVerifySubscription } from '../api/use-subscriptions'
import type { PendingSubscription } from '../types'

export function PendingSubscriptionsTable() {
  const { data: subscriptions, isLoading } = usePendingSubscriptions()
  const verifyMutation = useVerifySubscription()
  const [viewingSubscription, setViewingSubscription] = useState<PendingSubscription | null>(null)

  const handleVerify = (subscriptionId: string, approve: boolean) => {
    const action = approve ? 'approve' : 'reject'
    if (confirm(`Are you sure you want to ${action} this subscription?`)) {
      verifyMutation.mutate({ subscriptionId, approve })
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='size-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
      </div>
    )
  }

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Proof</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions && subscriptions.length > 0 ? (
              subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className='font-medium'>
                    <code className='rounded bg-muted px-2 py-1 text-xs'>{sub.userId}</code>
                  </TableCell>
                  <TableCell>{sub.plan?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant='secondary'>{sub.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {sub.paymentProofUrl ? (
                      <Button variant='ghost' size='sm' onClick={() => setViewingSubscription(sub)}>
                        <HugeiconsIcon icon={ViewIcon} className='mr-2 size-4' />
                        View Proof
                      </Button>
                    ) : (
                      <span className='text-muted-foreground text-sm'>No proof uploaded</span>
                    )}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-2'>
                      <Button
                        size='sm'
                        onClick={() => handleVerify(sub.id, true)}
                        disabled={verifyMutation.isPending}
                      >
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} className='mr-2 size-4' />
                        Approve
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => handleVerify(sub.id, false)}
                        disabled={verifyMutation.isPending}
                      >
                        <HugeiconsIcon icon={Cancel02Icon} className='mr-2 size-4' />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                  No pending subscriptions
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Payment Proof Dialog */}
      <Dialog open={!!viewingSubscription} onOpenChange={() => setViewingSubscription(null)}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>User: {viewingSubscription?.userId}</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            {viewingSubscription?.paymentProofUrl && (
              <div>
                <img
                  src={viewingSubscription.paymentProofUrl}
                  alt='Payment proof'
                  className='w-full rounded-lg border'
                />
              </div>
            )}
            {viewingSubscription?.paymentNote && (
              <div>
                <h4 className='mb-2 text-sm font-medium'>Payment Note:</h4>
                <p className='text-sm text-muted-foreground'>{viewingSubscription.paymentNote}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
