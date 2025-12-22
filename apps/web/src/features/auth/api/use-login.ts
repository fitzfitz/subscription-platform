import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import type { AdminUser, DashboardStats, LoginRequest } from '../types'

interface LoginResponse {
  user: AdminUser
  dashboard: DashboardStats
}

async function loginFn(data: LoginRequest): Promise<LoginResponse> {
  const credentials = btoa(`${data.email}:${data.password}`)
  const headers = { Authorization: `Basic ${credentials}` }

  // Verify credentials by fetching dashboard
  const dashboardResponse = await api.get<DashboardStats>('/manage/dashboard', { headers })

  // Fetch admin list to get current user info
  const adminsResponse = await api.get<AdminUser[]>('/manage/admins', { headers })

  const currentUser = adminsResponse.data.find(
    (admin) => admin.email.toLowerCase() === data.email.toLowerCase(),
  )

  if (!currentUser) {
    throw new Error('User not found')
  }

  return {
    user: currentUser,
    dashboard: dashboardResponse.data,
  }
}

export function useLogin() {
  return useMutation({
    mutationFn: loginFn,
  })
}
