import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Edit01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUser, useUpdateUser } from '@/features/users'

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: user, isLoading, error } = useUser(id!)
  const updateMutation = useUpdateUser()

  const [isEditing, setIsEditing] = useState(false)
  const [editEmail, setEditEmail] = useState('')

  const handleEdit = () => {
    setEditEmail(user?.email || '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!id) return

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          email: editEmail || undefined,
        },
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditEmail('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 dark:text-green-400'
      case 'pending_verification':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
      case 'past_due':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
      case 'canceled':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <Card className='animate-pulse'>
          <CardHeader>
            <div className='h-8 w-48 bg-muted rounded' />
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='h-4 w-full bg-muted rounded' />
              <div className='h-4 w-3/4 bg-muted rounded' />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className='space-y-6'>
        <Link
          to='/admin/users'
          className='inline-flex items-center gap-2 text-muted-foreground hover:text-foreground'
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className='size-4' />
          Back to Users
        </Link>
        <Card className='border-destructive/20 bg-destructive/5'>
          <CardContent className='p-6'>
            <p className='text-destructive'>User not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Back Button */}
      <Link
        to='/admin/users'
        className='inline-flex items-center gap-2 text-muted-foreground hover:text-foreground'
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className='size-4' />
        Back to Users
      </Link>

      {/* User Info Card */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle className='text-2xl'>User Details</CardTitle>
            <p className='text-sm text-muted-foreground mt-1'>
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
          {!isEditing && (
            <Button onClick={handleEdit}>
              <HugeiconsIcon icon={Edit01Icon} className='size-4 mr-2' />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className='space-y-4'>
          {isEditing ? (
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium mb-2 block'>Email</label>
                <Input
                  type='email'
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder='user@example.com'
                />
              </div>
              <div className='flex gap-2'>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} className='size-4 mr-2' />
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button variant='ghost' onClick={handleCancel}>
                  <HugeiconsIcon icon={Cancel01Icon} className='size-4 mr-2' />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className='grid md:grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Email</p>
                <p className='font-medium'>{user.email}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>User ID</p>
                <p className='font-mono text-xs'>{user.id}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <p className='text-sm text-muted-foreground'>
            {user.subscriptions?.length || 0} total subscription
            {user.subscriptions?.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent>
          {user.subscriptions && user.subscriptions.length > 0 ? (
            <div className='space-y-3'>
              {user.subscriptions.map((subscription) => (
                <Card key={subscription.id} className='border-muted'>
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <h4 className='font-semibold'>
                            {subscription.product?.name || 'Unknown Product'}
                          </h4>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}
                          >
                            {subscription.status}
                          </span>
                        </div>
                        <div className='text-sm text-muted-foreground space-y-1'>
                          <p>
                            Plan:{' '}
                            <span className='font-medium text-foreground'>
                              {subscription.plan?.name || 'Unknown'}
                            </span>
                          </p>
                          {subscription.plan?.price && (
                            <p>
                              Price:{' '}
                              <span className='font-medium text-foreground'>
                                ${(subscription.plan.price / 100).toFixed(2)}/month
                              </span>
                            </p>
                          )}
                          {subscription.startDate && (
                            <p>Started: {new Date(subscription.startDate).toLocaleDateString()}</p>
                          )}
                          {subscription.endDate && (
                            <p>Expires: {new Date(subscription.endDate).toLocaleDateString()}</p>
                          )}
                          {subscription.provider && (
                            <p>
                              Provider:{' '}
                              <span className='font-medium text-foreground'>
                                {subscription.provider}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <p className='text-muted-foreground'>No subscriptions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
