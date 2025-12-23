import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Key01Icon,
  Copy01Icon,
  Edit02Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Add01Icon,
  Delete02Icon,
  Loading03Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProduct, useUpdateProduct, useRegenerateApiKey } from '@/features/products'
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '@/features/plans'
import type { Plan, CreatePlanRequest } from '@/features/plans'

// Plan Row Component
function PlanRow({ plan, onEdit }: { plan: Plan; onEdit: () => void }) {
  const deleteMutation = useDeletePlan()
  const updateMutation = useUpdatePlan()

  const handleToggleActive = async () => {
    await updateMutation.mutateAsync({
      id: plan.id,
      data: { isActive: !plan.isActive },
    })
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return
    await deleteMutation.mutateAsync(plan.id)
  }

  return (
    <div
      className={`flex items-center justify-between p-4 border border-border rounded-xl transition-all ${!plan.isActive ? 'opacity-50 bg-muted/30' : 'bg-card hover:shadow-sm'}`}
    >
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-3'>
          <h4 className='font-semibold truncate'>{plan.name}</h4>
          <code className='text-xs bg-muted px-2 py-0.5 rounded'>{plan.slug}</code>
          <button
            onClick={handleToggleActive}
            disabled={updateMutation.isPending}
            className={`px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${
              plan.isActive
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {plan.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
        <div className='flex items-center gap-4 mt-1 text-sm text-muted-foreground'>
          <span className='font-medium text-foreground'>${(plan.price / 100).toFixed(2)}/mo</span>
          <code className='text-xs bg-muted px-2 py-0.5 rounded font-mono'>
            {JSON.stringify(plan.limits)}
          </code>
          {plan.features && <span className='truncate max-w-[200px]'>{plan.features}</span>}
        </div>
      </div>
      <div className='flex items-center gap-1 ml-4'>
        <Button size='icon-sm' variant='ghost' onClick={onEdit}>
          <HugeiconsIcon icon={Edit02Icon} className='size-4' />
        </Button>
        <Button
          size='icon-sm'
          variant='ghost'
          className='text-destructive hover:bg-destructive/10'
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          <HugeiconsIcon icon={Delete02Icon} className='size-4' />
        </Button>
      </div>
    </div>
  )
}

// Plan Form Component
function PlanForm({
  productId,
  plan,
  onCancel,
  onSuccess,
}: {
  productId: string
  plan?: Plan
  onCancel: () => void
  onSuccess: () => void
}) {
  const createMutation = useCreatePlan()
  const updateMutation = useUpdatePlan()

  const [formData, setFormData] = useState({
    name: plan?.name || '',
    slug: plan?.slug || '',
    price: plan?.price || 0,
    features: plan?.features || '',
    limits: JSON.stringify(plan?.limits || { properties: 10 }, null, 2),
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const parsedLimits = JSON.parse(formData.limits)
      const dataToSubmit = {
        name: formData.name,
        slug: formData.slug,
        price: formData.price,
        features: formData.features,
        limits: parsedLimits,
      }

      if (plan) {
        await updateMutation.mutateAsync({ id: plan.id, data: dataToSubmit })
      } else {
        await createMutation.mutateAsync({
          ...dataToSubmit,
          productId,
          isActive: true,
        } as CreatePlanRequest)
      }
      onSuccess()
    } catch (e) {
      alert('Invalid JSON format for limits')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className='p-4 border border-primary/20 rounded-xl bg-primary/5'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div>
            <Label className='text-xs'>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value
                setFormData({
                  ...formData,
                  name,
                  slug: plan ? formData.slug : generateSlug(name),
                })
              }}
              placeholder='Pro Plan'
              className='mt-1'
              required
            />
          </div>
          <div>
            <Label className='text-xs'>Slug *</Label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder='pro-plan'
              className='mt-1'
              required
            />
          </div>
          <div>
            <Label className='text-xs'>Price (cents) *</Label>
            <Input
              type='number'
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className='mt-1'
              required
              min={0}
            />
            <p className='text-xs text-muted-foreground mt-0.5'>
              {formData.price > 0 ? `$${(formData.price / 100).toFixed(2)}/mo` : 'Free'}
            </p>
          </div>
          <div className='col-span-2'>
            <Label className='text-xs'>Limits (JSON) *</Label>
            <textarea
              value={formData.limits}
              onChange={(e) => setFormData({ ...formData, limits: e.target.value })}
              placeholder='{"properties": 10, "users": 5}'
              className='mt-1 w-full min-h-[70px] px-3 py-2 border border-input rounded-lg bg-background font-mono text-xs'
              required
            />
            <p className='text-xs text-muted-foreground mt-0.5'>
              Define limits as JSON, e.g., {'{"properties": 50, "users": 10}'}
            </p>
          </div>
        </div>
        <div>
          <Label className='text-xs'>Features (comma separated)</Label>
          <Input
            value={formData.features}
            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
            placeholder='Feature 1, Feature 2, Feature 3'
            className='mt-1'
          />
        </div>
        <div className='flex justify-end gap-2'>
          <Button type='button' variant='ghost' size='sm' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' size='sm' disabled={isPending}>
            {isPending ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Main Product Detail Page
export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: product, isLoading, error } = useProduct(id!)
  const { data: plans, isLoading: plansLoading } = usePlans(id)
  const updateMutation = useUpdateProduct()
  const regenerateKeyMutation = useRegenerateApiKey()

  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  const handleUpdateName = async () => {
    if (!editName.trim() || !id) return
    await updateMutation.mutateAsync({ id, data: { name: editName } })
    setIsEditingName(false)
  }

  const handleToggleActive = async () => {
    if (!product || !id) return
    await updateMutation.mutateAsync({
      id,
      data: { isActive: !product.isActive },
    })
  }

  const handleRegenerateKey = async () => {
    if (!id) return
    const result = await regenerateKeyMutation.mutateAsync(id)
    setShowApiKey(result.apiKey)
    setShowRegenerateConfirm(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <HugeiconsIcon icon={Loading03Icon} className='size-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className='space-y-4'>
        <Link
          to='/admin/products'
          className='inline-flex items-center gap-2 text-muted-foreground hover:text-foreground'
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className='size-4' />
          Back to Products
        </Link>
        <Card className='border-destructive/20 bg-destructive/5'>
          <CardContent className='p-6'>
            <p className='text-destructive'>Product not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Link to='/admin/products' className='p-2 rounded-lg hover:bg-muted transition-colors'>
          <HugeiconsIcon icon={ArrowLeft01Icon} className='size-5' />
        </Link>
        <div className='flex-1'>
          {isEditingName ? (
            <div className='flex items-center gap-2'>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className='text-2xl font-bold h-12 max-w-md'
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateName()
                  if (e.key === 'Escape') setIsEditingName(false)
                }}
              />
              <Button size='icon' onClick={handleUpdateName}>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className='size-5' />
              </Button>
              <Button size='icon' variant='ghost' onClick={() => setIsEditingName(false)}>
                <HugeiconsIcon icon={Cancel01Icon} className='size-5' />
              </Button>
            </div>
          ) : (
            <div className='flex items-center gap-3'>
              <h1 className='text-3xl font-bold tracking-tight'>{product.name}</h1>
              <Button
                size='icon-sm'
                variant='ghost'
                onClick={() => {
                  setEditName(product.name)
                  setIsEditingName(true)
                }}
              >
                <HugeiconsIcon icon={Edit02Icon} className='size-4' />
              </Button>
              <button
                onClick={handleToggleActive}
                className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                  product.isActive
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {product.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          )}
          <p className='text-muted-foreground mt-1'>
            Created {new Date(product.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* API Key Section */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base flex items-center gap-2'>
            <HugeiconsIcon icon={Key01Icon} className='size-5' />
            API Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showApiKey ? (
            <div className='p-3 bg-green-500/10 border border-green-500/20 rounded-lg'>
              <p className='text-xs text-green-600 dark:text-green-400 font-medium mb-2'>
                New API Key (copy it now, it won't be shown again):
              </p>
              <div className='flex items-center gap-2'>
                <code className='flex-1 text-sm font-mono bg-background px-3 py-2 rounded border border-border overflow-x-auto'>
                  {showApiKey}
                </code>
                <Button size='sm' variant='outline' onClick={() => copyToClipboard(showApiKey)}>
                  <HugeiconsIcon icon={Copy01Icon} className='size-4 mr-1' />
                  Copy
                </Button>
                <Button size='sm' variant='ghost' onClick={() => setShowApiKey(null)}>
                  <HugeiconsIcon icon={Cancel01Icon} className='size-4' />
                </Button>
              </div>
            </div>
          ) : (
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <p className='text-sm text-muted-foreground'>
                  API key is hidden for security. You can regenerate it if needed.
                </p>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => setShowRegenerateConfirm(true)}
                >
                  Regenerate API Key
                </Button>
              </div>

              {/* Confirmation Dialog */}
              {showRegenerateConfirm && (
                <div className='p-3 bg-destructive/10 border border-destructive/20 rounded-lg'>
                  <p className='text-sm text-destructive font-medium mb-3'>
                    ⚠️ Regenerate API key? The old key will stop working immediately.
                  </p>
                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      size='sm'
                      variant='destructive'
                      onClick={handleRegenerateKey}
                      disabled={regenerateKeyMutation.isPending}
                    >
                      {regenerateKeyMutation.isPending ? 'Generating...' : 'Yes, Regenerate'}
                    </Button>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      onClick={() => setShowRegenerateConfirm(false)}
                      disabled={regenerateKeyMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans Section */}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-base'>Plans ({plans?.length || 0})</CardTitle>
            {!showPlanForm && !editingPlan && (
              <Button size='sm' onClick={() => setShowPlanForm(true)}>
                <HugeiconsIcon icon={Add01Icon} className='size-4 mr-1' />
                Add Plan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className='space-y-3'>
          {/* Create/Edit Form */}
          {(showPlanForm || editingPlan) && (
            <PlanForm
              productId={id!}
              plan={editingPlan || undefined}
              onCancel={() => {
                setShowPlanForm(false)
                setEditingPlan(null)
              }}
              onSuccess={() => {
                setShowPlanForm(false)
                setEditingPlan(null)
              }}
            />
          )}

          {/* Plans List */}
          {plansLoading ? (
            <div className='animate-pulse space-y-3'>
              {[...Array(2)].map((_, i) => (
                <div key={i} className='h-20 bg-muted rounded-xl' />
              ))}
            </div>
          ) : plans && plans.length > 0 ? (
            <div className='space-y-3'>
              {plans.map((plan) => (
                <PlanRow key={plan.id} plan={plan} onEdit={() => setEditingPlan(plan)} />
              ))}
            </div>
          ) : !showPlanForm ? (
            <div className='text-center py-8 text-muted-foreground'>
              <p>No plans yet. Create your first plan to get started.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
