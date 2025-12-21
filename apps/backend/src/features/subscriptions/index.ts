import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { createDb } from '../../db'
import { Bindings, Variables } from '../../types/bindings'
import { SubscriptionsService } from './service'

const getSubscriptionRoute = createRoute({
  method: 'get',
  path: '/subscriptions/{userId}',
  summary: 'Get Subscription',
  description: 'Get active subscription for a user.',
  request: {
    params: z.object({
      userId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Active Subscription',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            status: z.string(),
            planId: z.string(),
            plan: z
              .object({
                name: z.string(),
                features: z.string(),
              })
              .optional(),
          }),
        },
      },
    },
    404: {
      description: 'Not Found',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
    },
    500: {
      description: 'Server Error',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
    },
  },
})

const upgradeSchema = z.object({
  productId: z.string(),
  planId: z.string(),
  paymentProofUrl: z.string().optional(),
  paymentNote: z.string().optional(),
})

const upgradeRoute = createRoute({
  method: 'post',
  path: '/{userId}/upgrade',
  summary: 'Request Upgrade',
  description: 'Submit an upgrade request',
  request: {
    params: z.object({
      userId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: upgradeSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Upgrade Requested',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            status: z.string(),
          }),
        },
      },
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
    },
    500: {
      description: 'Server Error',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
    },
  },
})

export const registerSubscriptions = (
  app: OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>,
) => {
  app.openapi(getSubscriptionRoute, async (c) => {
    const db = createDb(c.env)
    const { userId } = c.req.valid('param')
    const productId = c.get('productId')

    if (!productId) return c.json({ error: 'Product context missing' }, 500)

    const service = new SubscriptionsService(db)
    const subscription = await service.getByUserId(userId, productId)

    if (!subscription) {
      return c.json({ error: 'No active subscription found' }, 404)
    }

    return c.json(
      subscription as unknown as {
        id: string
        status: string
        planId: string
        plan?: { name: string; features: string }
      },
      200,
    )
  })

  app.openapi(upgradeRoute, async (c) => {
    const db = createDb(c.env)
    const { userId } = c.req.valid('param')
    const { productId, planId, paymentProofUrl, paymentNote } = await c.req.json()

    const service = new SubscriptionsService(db)
    const result = await service.createUpgradeRequest({
      userId,
      productId,
      planId,
      paymentProofUrl,
      paymentNote,
    })

    return c.json(result as unknown as { id: string; status: string }, 201)
  })
}
