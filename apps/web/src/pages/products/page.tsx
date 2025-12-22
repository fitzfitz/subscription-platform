import { Link } from 'react-router-dom'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowRight01Icon, Copy01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProducts, useCreateProduct } from '@/features/products'

export function ProductsPage() {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Products</h1>
        <p className='text-muted-foreground mt-1'>Manage your products and their pricing plans</p>
      </div>

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
      {isLoading ? (
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
      ) : error ? (
        <Card className='border-destructive/20 bg-destructive/5'>
          <CardContent className='p-6'>
            <p className='text-destructive'>Failed to load products</p>
          </CardContent>
        </Card>
      ) : products && products.length > 0 ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {products.map((product) => (
            <Link key={product.id} to={`/admin/products/${product.id}`}>
              <Card
                className={`transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer group ${!product.isActive ? 'opacity-60' : ''}`}
              >
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg flex items-center justify-between'>
                    <span className='flex items-center gap-2'>
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
                    </span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className='size-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all'
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center justify-between text-sm text-muted-foreground'>
                    <span className='font-medium'>{product.plans?.length || 0} plan(s)</span>
                    <span>Created {new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Plans preview */}
                  {product.plans && product.plans.length > 0 && (
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {product.plans.slice(0, 3).map((plan) => (
                        <span key={plan.id} className='px-2 py-1 text-xs bg-muted rounded-lg'>
                          {plan.name} · ${(plan.price / 100).toFixed(0)}
                        </span>
                      ))}
                      {product.plans.length > 3 && (
                        <span className='px-2 py-1 text-xs text-muted-foreground'>
                          +{product.plans.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
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
