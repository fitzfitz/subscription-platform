import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon, FilterIcon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useUsers, type SubscriptionWithDetails } from '@/features/users'
import { useProducts } from '@/features/products'

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState<string>('')

  const {
    data: users,
    isLoading,
    error,
  } = useUsers({
    search: search || undefined,
    productId: productFilter || undefined,
  })
  const { data: products } = useProducts()

  const getSubscriptionStatus = (subscriptions: SubscriptionWithDetails[] | undefined) => {
    if (!subscriptions || subscriptions.length === 0) return { count: 0, active: 0 }
    return {
      count: subscriptions.length,
      active: subscriptions.filter((s) => s.status === 'active').length,
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Users</h1>
        <p className='text-muted-foreground mt-1'>Manage users and their subscriptions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col md:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1 relative'>
              <HugeiconsIcon
                icon={Search01Icon}
                className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground'
              />
              <Input
                placeholder='Search by email or name...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9'
              />
            </div>

            {/* Product Filter */}
            <div className='md:w-64 relative'>
              <HugeiconsIcon
                icon={FilterIcon}
                className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground'
              />
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className='w-full h-10 px-9 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring'
              >
                <option value=''>All Products</option>
                {products?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(search || productFilter) && (
              <Button
                variant='ghost'
                onClick={() => {
                  setSearch('')
                  setProductFilter('')
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {isLoading ? (
        <div className='grid gap-4'>
          {[...Array(5)].map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardContent className='p-6'>
                <div className='h-6 w-48 bg-muted rounded mb-2' />
                <div className='h-4 w-32 bg-muted rounded' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className='border-destructive/20 bg-destructive/5'>
          <CardContent className='p-6'>
            <p className='text-destructive'>Failed to load users</p>
          </CardContent>
        </Card>
      ) : users && users.length > 0 ? (
        <div className='grid gap-4'>
          {users.map((user) => {
            const subStatus = getSubscriptionStatus(user.subscriptions)

            return (
              <Link key={user.id} to={`/admin/users/${user.id}`}>
                <Card className='transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer group'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <CardTitle className='text-lg flex items-center gap-2'>
                          {user.email}
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            className='size-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all'
                          />
                        </CardTitle>
                      </div>
                      <div className='flex flex-col gap-2 items-end'>
                        {subStatus.active > 0 ? (
                          <span className='px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 rounded-full'>
                            {subStatus.active} Active
                          </span>
                        ) : (
                          <span className='px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full'>
                            No Active Subs
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        {subStatus.count} total subscription{subStatus.count !== 1 ? 's' : ''}
                      </span>
                      <span className='text-muted-foreground'>
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Subscriptions Preview */}
                    {user.subscriptions && user.subscriptions.length > 0 && (
                      <div className='mt-3 flex flex-wrap gap-2'>
                        {user.subscriptions.slice(0, 3).map((sub) => (
                          <span
                            key={sub.id}
                            className={`px-2 py-1 text-xs rounded-lg ${
                              sub.status === 'active'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {sub.product?.name || 'Product'} · {sub.plan?.name || 'Plan'}
                          </span>
                        ))}
                        {user.subscriptions.length > 3 && (
                          <span className='px-2 py-1 text-xs text-muted-foreground'>
                            +{user.subscriptions.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className='border-dashed'>
          <CardContent className='p-12 text-center'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center'>
              <HugeiconsIcon icon={Search01Icon} className='size-8 text-muted-foreground' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>No users found</h3>
            <p className='text-muted-foreground'>
              {search || productFilter
                ? 'Try adjusting your filters'
                : 'No users have registered yet'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
