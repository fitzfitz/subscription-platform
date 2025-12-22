import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './_guards/protected-route'
import { GuestRoute } from './_guards/guest-route'

// Lazy load pages
const LoginPage = lazy(() =>
  import('@/pages/auth/login-page').then((m) => ({ default: m.LoginPage })),
)
const AdminLayout = lazy(() =>
  import('@/components/layout/admin-layout').then((m) => ({ default: m.AdminLayout })),
)
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/page').then((m) => ({ default: m.DashboardPage })),
)
const ProductsPage = lazy(() =>
  import('@/pages/products/page').then((m) => ({ default: m.ProductsPage })),
)
const ProductDetailPage = lazy(() =>
  import('@/pages/products/detail-page').then((m) => ({ default: m.ProductDetailPage })),
)
const UsersPage = lazy(() => import('@/pages/users/page').then((m) => ({ default: m.UsersPage })))
const UserDetailPage = lazy(() =>
  import('@/pages/users/detail-page').then((m) => ({ default: m.UserDetailPage })),
)

// Loading fallback
function PageLoader() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background'>
      <div className='flex flex-col items-center gap-4'>
        <div className='w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin' />
        <p className='text-sm text-muted-foreground'>Loading...</p>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to='/admin' replace />,
  },
  {
    path: '/login',
    element: (
      <GuestRoute>
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      </GuestRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AdminLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'products',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProductsPage />
          </Suspense>
        ),
      },
      {
        path: 'products/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProductDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'users',
        element: (
          <Suspense fallback={<PageLoader />}>
            <UsersPage />
          </Suspense>
        ),
      },
      {
        path: 'users/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <UserDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: <div className='text-2xl font-bold'>Settings (Coming Soon)</div>,
      },
    ],
  },
])
