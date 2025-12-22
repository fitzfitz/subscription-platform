import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { createDb } from '../../db'
import type { Bindings, Variables } from '../../types/bindings'
import { AdminService } from './service'

const getPendingRoute = createRoute({
  method: 'get',
  path: '/admin/pending',
  summary: 'List Pending Subscriptions',
  description: 'Retrieve all subscriptions awaiting admin verification.',
  security: [{ ApiKeyAuth: [] }],
  responses: {
    200: {
      description: 'List of pending subscriptions',
      content: {
        'application/json': {
          schema: z.array(
            z.object({
              id: z.string(),
              userId: z.string(),
              status: z.string(),
              paymentProofUrl: z.string().optional().nullable(),
              paymentNote: z.string().optional().nullable(),
              plan: z
                .object({
                  id: z.string(),
                  name: z.string(),
                })
                .optional(),
            }),
          ),
        },
      },
    },
    500: {
      description: 'Server Error',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
})

const verifySchema = z.object({
  subscriptionId: z.string(),
  approve: z.boolean(),
})

const verifyRoute = createRoute({
  method: 'post',
  path: '/admin/verify',
  summary: 'Verify Subscription',
  description: 'Approve or reject a pending subscription.',
  security: [{ ApiKeyAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: verifySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Subscription updated',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            status: z.string(),
          }),
        },
      },
    },
    500: {
      description: 'Server Error',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
})

export const registerAdmin = (app: OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>) => {
  app.openapi(getPendingRoute, async (c) => {
    const db = createDb(c.env)
    const productId = c.get('productId')

    if (!productId) {
      return c.json({ error: 'Product context missing' }, 500)
    }

    const service = new AdminService(db)
    const pending = await service.getPendingSubscriptions(productId)

    return c.json(pending, 200)
  })

  app.openapi(verifyRoute, async (c) => {
    const db = createDb(c.env)
    const { subscriptionId, approve } = await c.req.json()

    const service = new AdminService(db)
    const updated = await service.verifySubscription(subscriptionId, approve)

    return c.json(updated, 200)
  })
}
