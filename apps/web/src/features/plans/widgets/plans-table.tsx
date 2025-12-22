import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
  MoneyBag01Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlans, useCreatePlan, useDeletePlan, useUpdatePlan } from '../api/use-plans'
import { useProducts } from '@/features/products'
import type { Plan, CreatePlanRequest } from '../types'

interface PlanRowProps {
  plan: Plan
  productName?: string
}

function PlanRow({ plan, productName }: PlanRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: plan.name,
    price: plan.price,
    maxProperties: plan.maxProperties,
    features: plan.features,
  })

  const updateMutation = useUpdatePlan()
  const deleteMutation = useDeletePlan()

  const handleUpdate = async () => {
    await updateMutation.mutateAsync({
      id: plan.id,
      data: editData,
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${plan.name}"?`)) return
    await deleteMutation.mutateAsync(plan.id)
  }

  const handleToggleActive = async () => {
    await updateMutation.mutateAsync({
      id: plan.id,
      data: { isActive: !plan.isActive },
    })
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  if (isEditing) {
    return (
      <tr className='border-b border-border bg-muted/30'>
        <td colSpan={6} className='p-4'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div>
              <Label className='text-xs'>Name</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className='mt-1'
              />
            </div>
            <div>
              <Label className='text-xs'>Price (cents)</Label>
              <Input
                type='number'
                value={editData.price}
                onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
                className='mt-1'
              />
            </div>
            <div>
              <Label className='text-xs'>Max Properties</Label>
              <Input
                type='number'
                value={editData.maxProperties}
                onChange={(e) =>
                  setEditData({ ...editData, maxProperties: Number(e.target.value) })
                }
                className='mt-1'
              />
            </div>
            <div>
              <Label className='text-xs'>Features</Label>
              <Input
                value={editData.features}
                onChange={(e) => setEditData({ ...editData, features: e.target.value })}
                className='mt-1'
                placeholder='Comma separated'
              />
            </div>
          </div>
          <div className='flex justify-end gap-2 mt-4'>
            <Button size='sm' variant='ghost' onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size='sm' onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr
      className={`border-b border-border hover:bg-muted/30 transition-colors ${!plan.isActive ? 'opacity-50' : ''}`}
    >
      <td className='p-4 font-medium'>{plan.name}</td>
      <td className='p-4 text-muted-foreground'>{productName || '-'}</td>
      <td className='p-4'>
        <code className='text-xs bg-muted px-2 py-1 rounded'>{plan.slug}</code>
      </td>
      <td className='p-4 font-semibold'>{formatPrice(plan.price)}/mo</td>
      <td className='p-4'>
        <button
          onClick={handleToggleActive}
          className={`px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${
            plan.isActive
              ? 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {plan.isActive ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className='p-4'>
        <div className='flex items-center gap-1 justify-end'>
          <Button size='icon-xs' variant='ghost' onClick={() => setIsEditing(true)}>
            <HugeiconsIcon icon={Edit02Icon} className='size-4' />
          </Button>
          <Button
            size='icon-xs'
            variant='ghost'
            className='text-destructive hover:bg-destructive/10'
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <HugeiconsIcon icon={Delete02Icon} className='size-4' />
          </Button>
        </div>
      </td>
    </tr>
  )
}

interface CreatePlanFormProps {
  onCancel: () => void
  onSuccess: () => void
}

function CreatePlanForm({ onCancel, onSuccess }: CreatePlanFormProps) {
  const { data: products } = useProducts()
  const createMutation = useCreatePlan()

  const [formData, setFormData] = useState<CreatePlanRequest>({
    productId: '',
    name: '',
    slug: '',
    price: 0,
    features: '',
    maxProperties: 10,
    isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createMutation.mutateAsync(formData)
    onSuccess()
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  return (
    <Card>
      <CardHeader className='pb-4'>
        <CardTitle className='text-lg'>Create New Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label required>Product</Label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className='mt-1 w-full h-11 px-4 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring'
                required
              >
                <option value=''>Select a product...</option>
                {products?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label required>Plan Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value
                  setFormData({
                    ...formData,
                    name,
                    slug: formData.slug || generateSlug(name),
                  })
                }}
                placeholder='e.g. Pro Plan'
                className='mt-1'
                required
              />
            </div>
            <div>
              <Label required>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder='e.g. pro-plan'
                className='mt-1'
                required
              />
            </div>
            <div>
              <Label required>Price (cents)</Label>
              <Input
                type='number'
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className='mt-1'
                required
                min={0}
              />
              <p className='text-xs text-muted-foreground mt-1'>
                {formData.price > 0 ? `$${(formData.price / 100).toFixed(2)}/month` : 'Free'}
              </p>
            </div>
            <div>
              <Label>Max Properties</Label>
              <Input
                type='number'
                value={formData.maxProperties}
                onChange={(e) =>
                  setFormData({ ...formData, maxProperties: Number(e.target.value) })
                }
                className='mt-1'
                min={0}
              />
            </div>
            <div>
              <Label>Features</Label>
              <Input
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder='Feature 1, Feature 2, Feature 3'
                className='mt-1'
              />
            </div>
          </div>

          <div className='flex justify-end gap-2 pt-4 border-t border-border'>
            <Button type='button' variant='ghost' onClick={onCancel}>
              Cancel
            </Button>
            <Button type='submit' disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function PlansTable() {
  const { data: plans, isLoading, error } = usePlans()
  const { data: products } = useProducts()
  const [isCreating, setIsCreating] = useState(false)

  const getProductName = (productId: string) => {
    return products?.find((p) => p.id === productId)?.name
  }

  if (isLoading) {
    return (
      <Card className='animate-pulse'>
        <CardContent className='p-6'>
          <div className='h-8 w-48 bg-muted rounded mb-4' />
          <div className='space-y-3'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-12 bg-muted rounded' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className='border-destructive/20 bg-destructive/5'>
        <CardContent className='p-6'>
          <p className='text-destructive'>Failed to load plans</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Create Form or Button */}
      {isCreating ? (
        <CreatePlanForm
          onCancel={() => setIsCreating(false)}
          onSuccess={() => setIsCreating(false)}
        />
      ) : (
        <Button onClick={() => setIsCreating(true)}>
          <HugeiconsIcon icon={Add01Icon} className='size-4 mr-2' />
          Create Plan
        </Button>
      )}

      {/* Plans Table */}
      {plans && plans.length > 0 ? (
        <Card>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-border bg-muted/50'>
                  <th className='text-left p-4 text-sm font-medium text-muted-foreground'>Name</th>
                  <th className='text-left p-4 text-sm font-medium text-muted-foreground'>
                    Product
                  </th>
                  <th className='text-left p-4 text-sm font-medium text-muted-foreground'>Slug</th>
                  <th className='text-left p-4 text-sm font-medium text-muted-foreground'>Price</th>
                  <th className='text-left p-4 text-sm font-medium text-muted-foreground'>
                    Status
                  </th>
                  <th className='text-right p-4 text-sm font-medium text-muted-foreground'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <PlanRow key={plan.id} plan={plan} productName={getProductName(plan.productId)} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className='border-dashed'>
          <CardContent className='p-12 text-center'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center'>
              <HugeiconsIcon icon={MoneyBag01Icon} className='size-8 text-muted-foreground' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>No plans yet</h3>
            <p className='text-muted-foreground mb-4'>Create your first pricing plan</p>
            <Button onClick={() => setIsCreating(true)}>
              <HugeiconsIcon icon={Add01Icon} className='size-4 mr-2' />
              Create Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
