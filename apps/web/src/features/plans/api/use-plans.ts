import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/features/auth'
import type { Plan, CreatePlanRequest, UpdatePlanRequest } from '../types'

// Query Keys
export const planKeys = {
  all: ['plans'] as const,
  byProduct: (productId: string) => ['plans', { productId }] as const,
  detail: (id: string) => ['plans', id] as const,
}

// Get auth headers helper
function useAuthHeaders() {
  const credentials = useAuthStore((state) => state.credentials)
  return { Authorization: `Basic ${credentials}` }
}

// List Plans
export function usePlans(productId?: string) {
  const headers = useAuthHeaders()

  return useQuery({
    queryKey: productId ? planKeys.byProduct(productId) : planKeys.all,
    queryFn: async (): Promise<Plan[]> => {
      const url = productId ? `/manage/plans?productId=${productId}` : '/manage/plans'
      const response = await api.get<Plan[]>(url, { headers })
      return response.data
    },
  })
}

// Get Single Plan
export function usePlan(id: string) {
  const headers = useAuthHeaders()

  return useQuery({
    queryKey: planKeys.detail(id),
    queryFn: async (): Promise<Plan> => {
      const response = await api.get<Plan>(`/manage/plans/${id}`, { headers })
      return response.data
    },
    enabled: !!id,
  })
}

// Create Plan
export function useCreatePlan() {
  const queryClient = useQueryClient()
  const headers = useAuthHeaders()

  return useMutation({
    mutationFn: async (data: CreatePlanRequest): Promise<Plan> => {
      const response = await api.post<Plan>('/manage/plans', data, { headers })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // Refresh products with plans
    },
  })
}

// Update Plan
export function useUpdatePlan() {
  const queryClient = useQueryClient()
  const headers = useAuthHeaders()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePlanRequest }): Promise<Plan> => {
      const response = await api.patch<Plan>(`/manage/plans/${id}`, data, { headers })
      return response.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: planKeys.all })
      queryClient.invalidateQueries({ queryKey: planKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// Delete Plan
export function useDeletePlan() {
  const queryClient = useQueryClient()
  const headers = useAuthHeaders()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/manage/plans/${id}`, { headers })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
