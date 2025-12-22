import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Mail01Icon,
  LockPasswordIcon,
  ViewIcon,
  ViewOffSlashIcon,
  Loading03Icon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '../api/use-auth-store'
import { useLogin } from '../api/use-login'

export function LoginForm() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const loginMutation = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: ({ user }) => {
          login(email, password, user)
          navigate('/admin')
        },
        onError: (err) => {
          if (err instanceof Error) {
            if (err.message.includes('401') || err.message.includes('Network')) {
              setError('Invalid email or password')
            } else {
              setError(err.message)
            }
          } else {
            setError('An unexpected error occurred')
          }
        },
      },
    )
  }

  const isLoading = loginMutation.isPending

  return (
    <Card className='border-0 shadow-2xl shadow-primary/5'>
      <CardHeader className='space-y-1 pb-6'>
        <CardTitle className='text-3xl font-bold text-center'>Welcome back</CardTitle>
        <CardDescription className='text-center text-base'>
          Sign in to your admin account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-5'>
          {error && (
            <div className='p-4 rounded-lg bg-destructive/10 border border-destructive/20'>
              <p className='text-sm text-destructive font-medium'>{error}</p>
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='email' required>
              Email
            </Label>
            <div className='relative'>
              <HugeiconsIcon
                icon={Mail01Icon}
                className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground'
              />
              <Input
                id='email'
                type='email'
                placeholder='admin@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='pl-10'
                required
                autoComplete='email'
                disabled={isLoading}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password' required>
              Password
            </Label>
            <div className='relative'>
              <HugeiconsIcon
                icon={LockPasswordIcon}
                className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground'
              />
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='pl-10 pr-10'
                required
                autoComplete='current-password'
                disabled={isLoading}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                tabIndex={-1}
              >
                <HugeiconsIcon
                  icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                  className='size-4'
                />
              </button>
            </div>
          </div>

          <Button
            type='submit'
            className='w-full h-12 text-base font-semibold'
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className='mr-2 size-4 animate-spin' />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        {/* Demo credentials hint */}
        <div className='mt-6 p-4 rounded-lg bg-muted/50 border border-border'>
          <p className='text-xs text-muted-foreground text-center'>
            <span className='font-medium'>Demo credentials:</span>
            <br />
            Email: <code className='text-foreground'>admin@example.com</code>
            <br />
            Password: <code className='text-foreground'>admin123</code>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
