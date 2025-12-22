import { useQuery } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Package01Icon,
  CreditCardIcon,
  UserGroupIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardStats } from '@/features/auth'

function useDashboardStats() {
  const credentials = useAuthStore((state) => state.credentials)

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await api.get<DashboardStats>('/manage/dashboard', {
        headers: { Authorization: `Basic ${credentials}` },
      })
      return response.data
    },
    enabled: !!credentials,
  })
}

interface StatCardProps {
  title: string
  value: number
  icon: typeof Package01Icon
  description?: string
  color?: 'default' | 'success' | 'warning'
}

function StatCard({ title, value, icon, description, color = 'default' }: StatCardProps) {
  const colorClasses = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }

  return (
    <Card className='relative overflow-hidden'>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <HugeiconsIcon icon={icon} className='size-5' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-3xl font-bold'>{value}</div>
        {description && <p className='text-xs text-muted-foreground mt-1'>{description}</p>}
      </CardContent>
      {/* Decorative gradient */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
          color === 'success'
            ? 'from-green-500 to-emerald-500'
            : color === 'warning'
              ? 'from-amber-500 to-orange-500'
              : 'from-primary to-primary/50'
        }`}
      />
    </Card>
  )
}

export function DashboardPage() {
  const { user } = useAuthStore()
  const { data: stats, isLoading, error } = useDashboardStats()

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground mt-1'>
          Welcome back, <span className='font-medium text-foreground'>{user?.name || 'Admin'}</span>
        </p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
          {[...Array(5)].map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardHeader className='pb-2'>
                <div className='h-4 w-24 bg-muted rounded' />
              </CardHeader>
              <CardContent>
                <div className='h-8 w-16 bg-muted rounded' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className='border-destructive/20 bg-destructive/5'>
          <CardContent className='p-6'>
            <p className='text-destructive'>Failed to load dashboard stats</p>
          </CardContent>
        </Card>
      ) : stats ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
          <StatCard
            title='Products'
            value={stats.products}
            icon={Package01Icon}
            description='Active products'
          />
          <StatCard
            title='Plans'
            value={stats.plans}
            icon={CreditCardIcon}
            description='Total pricing plans'
          />
          <StatCard
            title='Users'
            value={stats.users}
            icon={UserGroupIcon}
            description='Registered users'
          />
          <StatCard
            title='Active Subscriptions'
            value={stats.activeSubscriptions}
            icon={CheckmarkCircle01Icon}
            description='Currently active'
            color='success'
          />
          <StatCard
            title='Pending Verification'
            value={stats.pendingSubscriptions}
            icon={Clock01Icon}
            description='Awaiting approval'
            color='warning'
          />
        </div>
      ) : null}

      {/* Quick Actions */}
      <div>
        <h2 className='text-xl font-semibold mb-4'>Quick Actions</h2>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <Card className='hover:shadow-md transition-shadow cursor-pointer group'>
            <CardContent className='p-6 flex items-center gap-4'>
              <div className='p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors'>
                <HugeiconsIcon icon={Package01Icon} className='size-6' />
              </div>
              <div>
                <h3 className='font-semibold'>Create Product</h3>
                <p className='text-sm text-muted-foreground'>Add a new product to the platform</p>
              </div>
            </CardContent>
          </Card>

          <Card className='hover:shadow-md transition-shadow cursor-pointer group'>
            <CardContent className='p-6 flex items-center gap-4'>
              <div className='p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors'>
                <HugeiconsIcon icon={CreditCardIcon} className='size-6' />
              </div>
              <div>
                <h3 className='font-semibold'>Create Plan</h3>
                <p className='text-sm text-muted-foreground'>Set up a new pricing plan</p>
              </div>
            </CardContent>
          </Card>

          <Card className='hover:shadow-md transition-shadow cursor-pointer group'>
            <CardContent className='p-6 flex items-center gap-4'>
              <div className='p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors'>
                <HugeiconsIcon icon={Clock01Icon} className='size-6' />
              </div>
              <div>
                <h3 className='font-semibold'>Review Pending</h3>
                <p className='text-sm text-muted-foreground'>
                  {stats?.pendingSubscriptions || 0} subscriptions need review
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
