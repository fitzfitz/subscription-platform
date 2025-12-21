import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { Button } from '@/components/ui/button'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className='flex h-screen w-full items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold mb-4'>Subscription Platform</h1>
          <Button>Click me (Shadcn)</Button>
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App
