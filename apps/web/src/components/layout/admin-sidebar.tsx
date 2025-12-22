import { NavLink, useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DashboardSquare01Icon,
  Package01Icon,
  UserGroupIcon,
  Settings01Icon,
  Logout01Icon,
  Menu01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: typeof DashboardSquare01Icon
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: DashboardSquare01Icon },
  { label: 'Products', href: '/admin/products', icon: Package01Icon },
  { label: 'Users', href: '/admin/users', icon: UserGroupIcon },
  { label: 'Settings', href: '/admin/settings', icon: Settings01Icon },
]

export function AdminSidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className='p-6 border-b border-sidebar-border'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-lg'>
            <svg
              viewBox='0 0 24 24'
              fill='none'
              className='w-5 h-5 text-sidebar-primary-foreground'
            >
              <path
                d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
          <div>
            <h1 className='font-bold text-sidebar-foreground'>Sub Platform</h1>
            <p className='text-xs text-sidebar-foreground/60'>Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className='flex-1 p-4 space-y-1'>
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/admin'}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )
            }
          >
            <HugeiconsIcon icon={item.icon} className='size-5' />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className='p-4 border-t border-sidebar-border'>
        <div className='flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50 mb-3'>
          <div className='w-10 h-10 rounded-full bg-sidebar-primary/20 flex items-center justify-center'>
            <span className='text-sm font-semibold text-sidebar-primary'>
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-sidebar-foreground truncate'>
              {user?.name || 'Admin'}
            </p>
            <p className='text-xs text-sidebar-foreground/60 truncate'>
              {user?.email || 'admin@example.com'}
            </p>
          </div>
        </div>

        <Button
          variant='ghost'
          className='w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10'
          onClick={handleLogout}
        >
          <HugeiconsIcon icon={Logout01Icon} className='size-5' />
          Sign out
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className='hidden lg:flex lg:flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0'>
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className='lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border'>
        <div className='flex items-center justify-between p-4'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center'>
              <svg
                viewBox='0 0 24 24'
                fill='none'
                className='w-4 h-4 text-sidebar-primary-foreground'
              >
                <path
                  d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </div>
            <span className='font-bold text-sidebar-foreground'>Sub Platform</span>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <HugeiconsIcon icon={isMobileMenuOpen ? Cancel01Icon : Menu01Icon} className='size-5' />
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className='lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm'
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 w-72 h-full bg-sidebar flex flex-col transition-transform duration-300',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
