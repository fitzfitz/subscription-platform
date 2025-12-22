import { z } from 'zod'

// Admin User Schema
export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']),
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type AdminUser = z.infer<typeof adminUserSchema>

// Login Request Schema
export const loginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginRequest = z.infer<typeof loginRequestSchema>

// Dashboard Stats Schema
export const dashboardStatsSchema = z.object({
  products: z.number(),
  plans: z.number(),
  users: z.number(),
  activeSubscriptions: z.number(),
  pendingSubscriptions: z.number(),
})

export type DashboardStats = z.infer<typeof dashboardStatsSchema>
