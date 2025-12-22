import { z } from 'zod'

// User Schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type User = z.infer<typeof userSchema>

// Subscription Schema (simplified for user display)
export const subscriptionSchema = z.object({
  id: z.string(),
  planId: z.string(),
  productId: z.string(),
  status: z.string(), // active | pending_verification | past_due | canceled
  provider: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Subscription = z.infer<typeof subscriptionSchema>

// Subscription with plan and product details
export const subscriptionWithDetailsSchema = subscriptionSchema.extend({
  plan: z
    .object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      features: z.string(),
    })
    .optional(),
  product: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
})

export type SubscriptionWithDetails = z.infer<typeof subscriptionWithDetailsSchema>

// User with Subscriptions
export const userWithSubscriptionsSchema = userSchema.extend({
  subscriptions: z.array(subscriptionWithDetailsSchema).optional(),
})

export type UserWithSubscriptions = z.infer<typeof userWithSubscriptionsSchema>

// Update User Request
export const updateUserSchema = z.object({
  // Note: name and role are product-specific, not stored in subscription platform
  email: z.string().email().optional(),
})

export type UpdateUserRequest = z.infer<typeof updateUserSchema>
