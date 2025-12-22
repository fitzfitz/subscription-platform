import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
  MoreVerticalIcon,
  Key01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Copy01Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useProducts,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
  useRegenerateApiKey,
} from '../api/use-products'
import type { ProductWithPlans } from '../types'

function ProductCard({ product }: { product: ProductWithPlans }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(product.name)
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()
  const regenerateKeyMutation = useRegenerateApiKey()

  const handleUpdate = async () => {
    if (!editName.trim()) return
    await updateMutation.mutateAsync({ id: product.id, data: { name: editName } })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return
    await deleteMutation.mutateAsync(product.id)
  }

  const handleToggleActive = async () => {
    await updateMutation.mutateAsync({
      id: product.id,
      data: { isActive: !product.isActive },
    })
    setShowMenu(false)
  }

  const handleRegenerateKey = async () => {
    if (!confirm('Are you sure? The old API key will stop working immediately.')) return
    const result = await regenerateKeyMutation.mutateAsync(product.id)
    setShowApiKey(result.apiKey)
    setShowMenu(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Card
      className={`relative transition-all duration-200 ${!product.isActive ? 'opacity-60' : ''}`}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            {isEditing ? (
              <div className='flex items-center gap-2'>
                <input
                  type='text'
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className='flex-1 px-3 py-1.5 text-lg font-semibold border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring'
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdate()
                    if (e.key === 'Escape') setIsEditing(false)
                  }}
                />
                <Button size='icon-sm' onClick={handleUpdate} disabled={updateMutation.isPending}>
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} className='size-4' />
                </Button>
                <Button size='icon-sm' variant='ghost' onClick={() => setIsEditing(false)}>
                  <HugeiconsIcon icon={Cancel01Icon} className='size-4' />
                </Button>
              </div>
            ) : (
              <CardTitle className='text-lg flex items-center gap-2'>
                {product.name}
                {product.isActive ? (
                  <span className='px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 rounded-full'>
                    Active
                  </span>
                ) : (
                  <span className='px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full'>
                    Inactive
                  </span>
                )}
              </CardTitle>
            )}
          </div>

          {/* Menu Button */}
          <div className='relative'>
            <Button variant='ghost' size='icon-sm' onClick={() => setShowMenu(!showMenu)}>
              <HugeiconsIcon icon={MoreVerticalIcon} className='size-4' />
            </Button>

            {showMenu && (
              <>
                <div className='fixed inset-0 z-10' onClick={() => setShowMenu(false)} />
                <div className='absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg z-20 py-1'>
                  <button
                    className='w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors'
                    onClick={() => {
                      setIsEditing(true)
                      setShowMenu(false)
                    }}
                  >
                    <HugeiconsIcon icon={Edit02Icon} className='size-4' />
                    Edit Name
                  </button>
                  <button
                    className='w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors'
                    onClick={handleToggleActive}
                  >
                    <HugeiconsIcon
                      icon={product.isActive ? Cancel01Icon : CheckmarkCircle01Icon}
                      className='size-4'
                    />
                    {product.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className='w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors'
                    onClick={handleRegenerateKey}
                  >
                    <HugeiconsIcon icon={Key01Icon} className='size-4' />
                    Regenerate API Key
                  </button>
                  <hr className='my-1 border-border' />
                  <button
                    className='w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-destructive/10 text-destructive transition-colors'
                    onClick={handleDelete}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className='size-4' />
                    Delete Product
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* API Key Display */}
        {showApiKey && (
          <div className='mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg'>
            <p className='text-xs text-green-600 dark:text-green-400 font-medium mb-1'>
              New API Key (copy it now, it won't be shown again):
            </p>
            <div className='flex items-center gap-2'>
              <code className='flex-1 text-sm font-mono bg-background px-2 py-1 rounded border border-border overflow-x-auto'>
                {showApiKey}
              </code>
              <Button size='icon-sm' variant='outline' onClick={() => copyToClipboard(showApiKey)}>
                <HugeiconsIcon icon={Copy01Icon} className='size-4' />
              </Button>
            </div>
          </div>
        )}

        {/* Plans count */}
        <div className='flex items-center justify-between text-sm text-muted-foreground'>
          <span>{product.plans?.length || 0} plan(s)</span>
          <span>Created {new Date(product.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Plans preview */}
        {product.plans && product.plans.length > 0 && (
          <div className='mt-3 space-y-2'>
            {product.plans.slice(0, 3).map((plan) => (
              <div
                key={plan.id}
                className='flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm'
              >
                <span className='font-medium'>{plan.name}</span>
                <span className='text-muted-foreground'>${(plan.price / 100).toFixed(2)}/mo</span>
              </div>
            ))}
            {product.plans.length > 3 && (
              <p className='text-xs text-muted-foreground text-center'>
                +{product.plans.length - 3} more plans
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ProductsTable() {
  const { data: products, isLoading, error } = useProducts()
  const createMutation = useCreateProduct()
  const [isCreating, setIsCreating] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newApiKey, setNewApiKey] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newProductName.trim()) return
    const result = await createMutation.mutateAsync({ name: newProductName })
    setNewApiKey(result.apiKey)
    setNewProductName('')
    setIsCreating(false)
  }

  if (isLoading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader className='pb-3'>
              <div className='h-6 w-32 bg-muted rounded' />
            </CardHeader>
            <CardContent>
              <div className='h-4 w-24 bg-muted rounded' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className='border-destructive/20 bg-destructive/5'>
        <CardContent className='p-6'>
          <p className='text-destructive'>Failed to load products</p>
        </CardContent>
      </Card>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className='space-y-6'>
      {/* New API Key Alert */}
      {newApiKey && (
        <Card className='border-green-500/30 bg-green-500/5'>
          <CardContent className='p-4'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-green-600 dark:text-green-400 mb-2'>
                  🎉 Product created! Save your API key:
                </p>
                <div className='flex items-center gap-2'>
                  <code className='flex-1 text-sm font-mono bg-background px-3 py-2 rounded-lg border border-border overflow-x-auto'>
                    {newApiKey}
                  </code>
                  <Button size='sm' variant='outline' onClick={() => copyToClipboard(newApiKey)}>
                    <HugeiconsIcon icon={Copy01Icon} className='size-4 mr-1' />
                    Copy
                  </Button>
                </div>
              </div>
              <Button size='icon-sm' variant='ghost' onClick={() => setNewApiKey(null)}>
                <HugeiconsIcon icon={Cancel01Icon} className='size-4' />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Product */}
      {isCreating ? (
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <input
                type='text'
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder='Enter product name...'
                className='flex-1 px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring'
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') setIsCreating(false)
                }}
              />
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !newProductName.trim()}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
              <Button variant='ghost' onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsCreating(true)}>
          <HugeiconsIcon icon={Add01Icon} className='size-4 mr-2' />
          Create Product
        </Button>
      )}

      {/* Products Grid */}
      {products && products.length > 0 ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <Card className='border-dashed'>
          <CardContent className='p-12 text-center'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center'>
              <HugeiconsIcon icon={Add01Icon} className='size-8 text-muted-foreground' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>No products yet</h3>
            <p className='text-muted-foreground mb-4'>Create your first product to get started</p>
            <Button onClick={() => setIsCreating(true)}>
              <HugeiconsIcon icon={Add01Icon} className='size-4 mr-2' />
              Create Product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
