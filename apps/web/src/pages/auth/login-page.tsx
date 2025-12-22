import { LoginForm } from '@/features/auth'

export function LoginPage() {
  return (
    <div className='min-h-screen w-full flex'>
      {/* Left Side - Branding */}
      <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 relative overflow-hidden'>
        {/* Decorative circles */}
        <div className='absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl' />
        <div className='absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl' />
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl' />

        {/* Floating shapes */}
        <div className='absolute top-20 right-20 w-20 h-20 border border-white/20 rounded-2xl rotate-12 animate-pulse' />
        <div
          className='absolute bottom-32 left-16 w-16 h-16 border border-white/20 rounded-full animate-pulse'
          style={{ animationDelay: '1s' }}
        />
        <div className='absolute top-1/3 left-1/4 w-12 h-12 bg-white/10 rounded-lg rotate-45' />

        <div className='relative z-10 flex flex-col justify-center items-center w-full p-12 text-white'>
          <div className='max-w-md text-center'>
            {/* Logo */}
            <div className='w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl'>
              <svg viewBox='0 0 24 24' fill='none' className='w-10 h-10 text-white'>
                <path
                  d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </div>

            <h1 className='text-4xl font-bold mb-4 tracking-tight'>Subscription Platform</h1>
            <p className='text-lg text-white/80 leading-relaxed'>
              Manage your products, plans, and subscribers all in one powerful admin dashboard.
            </p>

            {/* Features */}
            <div className='mt-12 space-y-4'>
              {[
                'Multi-product management',
                'Flexible pricing plans',
                'User subscription tracking',
                'Real-time analytics',
              ].map((feature, i) => (
                <div key={i} className='flex items-center gap-3 text-white/90'>
                  <div className='w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0'>
                    <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={3}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </div>
                  <span className='text-sm'>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className='flex-1 flex items-center justify-center p-6 lg:p-12 bg-background'>
        <div className='w-full max-w-md'>
          {/* Mobile Logo */}
          <div className='lg:hidden flex justify-center mb-8'>
            <div className='w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg'>
              <svg viewBox='0 0 24 24' fill='none' className='w-8 h-8 text-primary-foreground'>
                <path
                  d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </div>
          </div>

          <LoginForm />

          <p className='mt-6 text-center text-sm text-muted-foreground'>
            © {new Date().getFullYear()} Subscription Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
