import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { createDb } from '../../db'
import type { Bindings, Variables } from '../../types/bindings'
import { PaymentMethodsService } from './service'

// Shared schemas
const errorSchema = z.object({ error: z.string() })

const paymentMethodSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  type: z.enum(['manual', 'automated']),
  provider: z.string().nullable().optional(),
  config: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
})

const productPaymentMethodSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  type: z.enum(['manual', 'automated']),
  provider: z.string().nullable().optional(),
  config: z.string().nullable().optional(),
  isActive: z.boolean(),
  displayOrder: z.number(),
  isDefault: z.boolean(),
})

// Routes

// GET /manage/payment-methods
const listPaymentMethodsRoute = createRoute({
  method: 'get',
  path: '/manage/payment-methods',
  summary: 'List Payment Methods',
  description: 'List all configured payment methods',
  security: [{ AdminAuth: [] }],
  responses: {
    200: {
      description: 'List of payment methods',
      content: {
        'application/json': {
          schema: z.array(paymentMethodSchema),
        },
      },
    },
  },
})

// POST /manage/payment-methods
const createPaymentMethodRoute = createRoute({
  method: 'post',
  path: '/manage/payment-methods',
  summary: 'Create Payment Method',
  description: 'Create a new payment method',
  security: [{ AdminAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            slug: z.string().min(1),
            name: z.string().min(1),
            type: z.enum(['manual', 'automated']),
            provider: z.string().optional(),
            config: z.string().optional(),
            isActive: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Payment method created',
      content: {
        'application/json': {
          schema: paymentMethodSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

// PATCH /manage/payment-methods/:id
const updatePaymentMethodRoute = createRoute({
  method: 'patch',
  path: '/manage/payment-methods/{id}',
  summary: 'Update Payment Method',
  description: 'Update a payment method',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().optional(),
            type: z.enum(['manual', 'automated']).optional(),
            provider: z.string().nullable().optional(),
            config: z.string().nullable().optional(),
            isActive: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Payment method updated',
      content: {
        'application/json': {
          schema: paymentMethodSchema,
        },
      },
    },
    404: {
      description: 'Not Found',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

// DELETE /manage/payment-methods/:id
const deletePaymentMethodRoute = createRoute({
  method: 'delete',
  path: '/manage/payment-methods/{id}',
  summary: 'Delete Payment Method',
  description: 'Delete a payment method (fails if in use by products)',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Payment method deleted',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: errorSchema } },
    },
    404: {
      description: 'Not Found',
      content: { 'application/json': { schema: errorSchema } },
    },
  },
})

// GET /plans/:productId/payment-methods
const getProductPaymentMethodsRoute = createRoute({
  method: 'get',
  path: '/{productId}/payment-methods',
  summary: 'Get Product Payment Methods',
  description: 'Get available payment methods for a product',
  security: [{ ApiKeyAuth: [] }],
  request: {
    params: z.object({ productId: z.string() }),
  },
  responses: {
    200: {
      description: 'Available payment methods',
      content: {
        'application/json': {
          schema: z.array(productPaymentMethodSchema),
        },
      },
    },
  },
})

// Register routes
export const registerPaymentMethods = (
  app: OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>,
) => {
  // Admin routes
  app.openapi(listPaymentMethodsRoute, async (c) => {
    const db = createDb(c.env)
    const service = new PaymentMethodsService(db)

    const methods = await service.listPaymentMethods()

    return c.json(
      methods.map((m) => ({
        ...m,
        type: m.type as 'manual' | 'automated',
        createdAt: m.createdAt.toISOString(),
      })),
      200,
    )
  })

  app.openapi(createPaymentMethodRoute, async (c) => {
    const db = createDb(c.env)
    const service = new PaymentMethodsService(db)
    const data = await c.req.json()

    try {
      const method = await service.createPaymentMethod(data)
      return c.json(
        {
          ...method,
          type: method.type as 'manual' | 'automated',
          createdAt: method.createdAt.toISOString(),
        },
        201,
      )
    } catch (error) {
      return c.json({ error: 'Failed to create payment method' }, 400)
    }
  })

  app.openapi(updatePaymentMethodRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new PaymentMethodsService(db)
    const data = await c.req.json()

    const updated = await service.updatePaymentMethod(id, data)

    if (!updated) {
      return c.json({ error: 'Payment method not found' }, 404)
    }

    return c.json(
      {
        ...updated,
        type: updated.type as 'manual' | 'automated',
        createdAt: updated.createdAt.toISOString(),
      },
      200,
    )
  })

  app.openapi(deletePaymentMethodRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new PaymentMethodsService(db)

    try {
      const success = await service.deletePaymentMethod(id)
      if (!success) {
        return c.json({ error: 'Payment method not found' }, 404)
      }
      return c.json({ success: true }, 200)
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400)
    }
  })

  // Public route (with API Key)
  app.openapi(getProductPaymentMethodsRoute, async (c) => {
    const { productId } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new PaymentMethodsService(db)

    const methods = await service.getProductPaymentMethods(productId)

    return c.json(
      methods.map((m) => ({
        ...m,
        type: m.type as 'manual' | 'automated',
      })),
      200,
    )
  })
}
