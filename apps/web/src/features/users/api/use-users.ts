import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/features/auth'
import type { User, UserWithSubscriptions, UpdateUserRequest } from '../types'

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  filtered: (search?: string, productId?: string) => ['users', { search, productId }] as const,
  detail: (id: string) => ['users', id] as const,
}

// Get auth headers helper
function useAuthHeaders() {
  const credentials = useAuthStore((state) => state.credentials)
  return { Authorization: `Basic ${credentials}` }
}

// List Users
export function useUsers(filters?: { search?: string; productId?: string }) {
  const headers = useAuthHeaders()

  return useQuery({
    queryKey: userKeys.filtered(filters?.search, filters?.productId),
    queryFn: async (): Promise<UserWithSubscriptions[]> => {
      const params = new URLSearchParams()
      if (filters?.search) params.append('search', filters.search)
      if (filters?.productId) params.append('productId', filters.productId)

      const response = await api.get<UserWithSubscriptions[]>(
        `/manage/users${params.toString() ? `?${params.toString()}` : ''}`,
        { headers },
      )
      return response.data
    },
  })
}

// Get Single User
export function useUser(id: string) {
  const headers = useAuthHeaders()

  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async (): Promise<UserWithSubscriptions> => {
      const response = await api.get<UserWithSubscriptions>(`/manage/users/${id}`, { headers })
      return response.data
    },
    enabled: !!id,
  })
}

// Update User
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const headers = useAuthHeaders()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserRequest }): Promise<User> => {
      const response = await api.patch<User>(`/manage/users/${id}`, data, { headers })
      return response.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
    },
  })
}
