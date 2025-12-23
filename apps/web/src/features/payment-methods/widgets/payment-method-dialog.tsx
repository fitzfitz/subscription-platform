import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreatePaymentMethod, useUpdatePaymentMethod } from '../api/use-payment-methods'
import type { PaymentMethod, CreatePaymentMethodRequest } from '../types'

interface PaymentMethodDialogProps {
  method?: PaymentMethod | null
  open: boolean
  onClose: () => void
}

export function PaymentMethodDialog({ method, open, onClose }: PaymentMethodDialogProps) {
  const createMutation = useCreatePaymentMethod()
  const updateMutation = useUpdatePaymentMethod()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePaymentMethodRequest>({
    defaultValues: {
      slug: '',
      name: '',
      type: 'manual',
      provider: '',
      config: '',
      isActive: true,
    },
  })

  const type = watch('type')
  const isActive = watch('isActive')

  useEffect(() => {
    if (method) {
      reset({
        slug: method.slug,
        name: method.name,
        type: method.type,
        provider: method.provider || '',
        config: method.config || '',
        isActive: method.isActive,
      })
    } else {
      reset({
        slug: '',
        name: '',
        type: 'manual',
        provider: '',
        config: '',
        isActive: true,
      })
    }
  }, [method, reset])

  const onSubmit = async (data: CreatePaymentMethodRequest) => {
    try {
      if (method) {
        await updateMutation.mutateAsync({
          id: method.id,
          data: {
            name: data.name,
            type: data.type,
            provider: data.provider || null,
            config: data.config || null,
            isActive: data.isActive,
          },
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      onClose()
    } catch (error) {
      console.error('Failed to save payment method:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{method ? 'Edit Payment Method' : 'Create Payment Method'}</DialogTitle>
            <DialogDescription>
              {method
                ? 'Update payment method configuration'
                : 'Add a new payment method to the platform'}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            {/* Slug */}
            <div className='grid gap-2'>
              <Label htmlFor='slug'>Slug *</Label>
              <Input
                id='slug'
                {...register('slug', { required: 'Slug is required' })}
                placeholder='manual_bank'
                disabled={!!method}
              />
              {errors.slug && <p className='text-xs text-destructive'>{errors.slug.message}</p>}
            </div>

            {/* Name */}
            <div className='grid gap-2'>
              <Label htmlFor='name'>Name *</Label>
              <Input
                id='name'
                {...register('name', { required: 'Name is required' })}
                placeholder='Bank Transfer'
              />
              {errors.name && <p className='text-xs text-destructive'>{errors.name.message}</p>}
            </div>

            {/* Type */}
            <div className='grid gap-2'>
              <Label htmlFor='type'>Type *</Label>
              <Select
                value={type}
                onValueChange={(value) => setValue('type', value as 'manual' | 'automated')}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='manual'>Manual</SelectItem>
                  <SelectItem value='automated'>Automated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Provider */}
            {type === 'automated' && (
              <div className='grid gap-2'>
                <Label htmlFor='provider'>Provider</Label>
                <Input id='provider' {...register('provider')} placeholder='stripe' />
              </div>
            )}

            {/* Config */}
            <div className='grid gap-2'>
              <Label htmlFor='config'>Configuration (JSON)</Label>
              <textarea
                id='config'
                {...register('config')}
                placeholder='{"accountNumber": "123456"}'
                className='min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
              />
              <p className='text-xs text-muted-foreground'>
                JSON configuration for this payment method
              </p>
            </div>

            {/* Is Active */}
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label>Active</Label>
                <p className='text-xs text-muted-foreground'>Enable this payment method globally</p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
