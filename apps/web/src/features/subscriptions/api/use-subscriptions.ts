import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/features/auth'
import type { PendingSubscription, VerifySubscriptionRequest } from '../types'

function getAuthHeaders() {
  const credentials = useAuthStore.getState().credentials
  return { Authorization: `Basic ${credentials}` }
}

// Get pending subscriptions
export function usePendingSubscriptions() {
  return useQuery({
    queryKey: ['pending-subscriptions'],
    queryFn: async (): Promise<PendingSubscription[]> => {
      const response = await api.get<PendingSubscription[]>('/admin/pending', {
        headers: getAuthHeaders(),
      })
      return response.data
    },
  })
}

// Verify subscription (approve or reject)
export function useVerifySubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      data: VerifySubscriptionRequest,
    ): Promise<{ id: string; status: string }> => {
      const response = await api.post<{ id: string; status: string }>('/admin/verify', data, {
        headers: getAuthHeaders(),
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
