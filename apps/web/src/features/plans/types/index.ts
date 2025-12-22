import { z } from 'zod'

// Plan Schema
export const planSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  features: z.string(),
  maxProperties: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Plan = z.infer<typeof planSchema>

// Plan with Product
export const planWithProductSchema = planSchema.extend({
  product: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
})

export type PlanWithProduct = z.infer<typeof planWithProductSchema>

// Create Plan Request
export const createPlanSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  name: z.string().min(1, 'Plan name is required'),
  slug: z.string().min(1, 'Slug is required'),
  price: z.number().min(0, 'Price must be positive'),
  features: z.string().optional().default(''),
  maxProperties: z.number().min(0, 'Max properties must be positive').optional().default(10),
  isActive: z.boolean().optional().default(true),
})

export type CreatePlanRequest = z.infer<typeof createPlanSchema>

// Update Plan Request
export const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  features: z.string().optional(),
  maxProperties: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

export type UpdatePlanRequest = z.infer<typeof updatePlanSchema>
