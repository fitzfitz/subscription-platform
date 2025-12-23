import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PencilEdit02Icon, Delete02Icon } from '@hugeicons/core-free-icons'
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
import { usePaymentMethods, useDeletePaymentMethod } from '../api/use-payment-methods'
import type { PaymentMethod } from '../types'
import { PaymentMethodDialog } from './payment-method-dialog'

export function PaymentMethodsTable() {
  const { data: methods, isLoading } = usePaymentMethods()
  const deleteMutation = useDeletePaymentMethod()
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingMethod(null)
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
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {methods && methods.length > 0 ? (
              methods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className='font-medium'>{method.name}</TableCell>
                  <TableCell>
                    <code className='rounded bg-muted px-2 py-1 text-xs'>{method.slug}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={method.type === 'automated' ? 'default' : 'secondary'}>
                      {method.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {method.provider ? (
                      <Badge variant='outline'>{method.provider}</Badge>
                    ) : (
                      <span className='text-muted-foreground text-sm'>-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={method.isActive ? 'default' : 'destructive'}>
                      {method.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleEdit(method)}
                        title='Edit'
                      >
                        <HugeiconsIcon icon={PencilEdit02Icon} className='size-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleDelete(method.id)}
                        title='Delete'
                        className='text-destructive hover:text-destructive'
                      >
                        <HugeiconsIcon icon={Delete02Icon} className='size-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                  No payment methods configured
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentMethodDialog method={editingMethod} open={isDialogOpen} onClose={handleCloseDialog} />
    </>
  )
}
