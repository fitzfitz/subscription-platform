import { PlansTable } from '@/features/plans'

export function PlansPage() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Plans</h1>
        <p className='text-muted-foreground mt-1'>Manage pricing plans for your products</p>
      </div>

      {/* Plans Widget */}
      <PlansTable />
    </div>
  )
}
