import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './admin-sidebar'

export function AdminLayout() {
  return (
    <div className='flex min-h-screen bg-background'>
      <AdminSidebar />

      {/* Main Content */}
      <main className='flex-1 lg:ml-0'>
        {/* Mobile header spacer */}
        <div className='lg:hidden h-16' />

        <div className='p-6 lg:p-8'>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
