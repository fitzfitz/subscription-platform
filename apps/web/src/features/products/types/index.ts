import { z } from 'zod'

// Product Schema
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Product = z.infer<typeof productSchema>

// Product with Plans
export const productWithPlansSchema = productSchema.extend({
  plans: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        price: z.number(),
        features: z.string(),
        limits: z.record(z.union([z.number(), z.boolean(), z.string()])),
        isActive: z.boolean(),
      }),
    )
    .optional(),
})

export type ProductWithPlans = z.infer<typeof productWithPlansSchema>

// Create Product Request
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
})

export type CreateProductRequest = z.infer<typeof createProductSchema>

// Update Product Request
export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  isActive: z.boolean().optional(),
})

export type UpdateProductRequest = z.infer<typeof updateProductSchema>

// Create Product Response (includes API key)
export const createProductResponseSchema = productSchema.extend({
  apiKey: z.string(),
  apiKeyHash: z.string(),
})

export type CreateProductResponse = z.infer<typeof createProductResponseSchema>
