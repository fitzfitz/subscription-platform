import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/features/auth'
import type {
  PaymentMethod,
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
} from '../types'

function getAuthHeaders() {
  const credentials = useAuthStore.getState().credentials
  return { Authorization: `Basic ${credentials}` }
}

// List all payment methods
export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async (): Promise<PaymentMethod[]> => {
      const response = await api.get<PaymentMethod[]>('/manage/payment-methods', {
        headers: getAuthHeaders(),
      })
      return response.data
    },
  })
}

// Create payment method
export function useCreatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePaymentMethodRequest): Promise<PaymentMethod> => {
      const response = await api.post<PaymentMethod>('/manage/payment-methods', data, {
        headers: getAuthHeaders(),
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })
}

// Update payment method
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdatePaymentMethodRequest
    }): Promise<PaymentMethod> => {
      const response = await api.patch<PaymentMethod>(`/manage/payment-methods/${id}`, data, {
        headers: getAuthHeaders(),
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })
}

// Delete payment method
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/manage/payment-methods/${id}`, {
        headers: getAuthHeaders(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })
}
