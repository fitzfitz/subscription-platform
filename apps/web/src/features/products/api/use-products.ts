import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/features/auth'
import type {
  ProductWithPlans,
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
} from '../types'

// Query Keys
export const productKeys = {
  all: ['products'] as const,
  detail: (id: string) => ['products', id] as const,
}

// Get auth headers helper
function useAuthHeaders() {
  const credentials = useAuthStore((state) => state.credentials)
  return { Authorization: `Basic ${credentials}` }
}

// List Products
export function useProducts() {
  const headers = useAuthHeaders()

  return useQuery({
    queryKey: productKeys.all,
    queryFn: async (): Promise<ProductWithPlans[]> => {
      const response = await api.get<ProductWithPlans[]>('/manage/products', { headers })
      return response.data
    },
  })
}

// Get Single Product
export function useProduct(id: string) {
  const headers = useAuthHeaders()

  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async (): Promise<ProductWithPlans> => {
      const response = await api.get<ProductWithPlans>(`/manage/products/${id}`, { headers })
      return response.data
    },
    enabled: !!id,
  })
}

// Create Product
export function useCreateProduct() {
  const queryClient = useQueryClient()
  const headers = useAuthHeaders()

  return useMutation({
    mutationFn: async (data: CreateProductRequest): Promise<CreateProductResponse> => {
      const response = await api.post<CreateProductResponse>('/manage/products', data, { headers })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

// Update Product
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  const headers = useAuthHeaders()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateProductRequest
    }): Promise<ProductWithPlans> => {
      const response = await api.patch<ProductWithPlans>(`/manage/products/${id}`, data, {
        headers,
      })
      return response.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) })
    },
  })
}

// Delete Product
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const headers = useAuthHeaders()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/manage/products/${id}`, { headers })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

// Regenerate API Key
export function useRegenerateApiKey() {
  const queryClient = useQueryClient()
  const headers = useAuthHeaders()

  return useMutation({
    mutationFn: async (id: string): Promise<{ apiKey: string }> => {
      const response = await api.post<{ apiKey: string }>(
        `/manage/products/${id}/regenerate-key`,
        {},
        { headers },
      )
      return response.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) })
    },
  })
}
