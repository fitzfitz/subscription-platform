import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser } from '../types'

interface AuthState {
  isAuthenticated: boolean
  user: AdminUser | null
  credentials: string | null // Base64 encoded email:password

  // Actions
  login: (email: string, password: string, user: AdminUser) => void
  logout: () => void
  getAuthHeader: () => string | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      credentials: null,

      login: (email: string, password: string, user: AdminUser) => {
        const credentials = btoa(`${email}:${password}`)
        set({
          isAuthenticated: true,
          user,
          credentials,
        })
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          credentials: null,
        })
      },

      getAuthHeader: () => {
        const { credentials } = get()
        return credentials ? `Basic ${credentials}` : null
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        credentials: state.credentials,
      }),
    },
  ),
)
