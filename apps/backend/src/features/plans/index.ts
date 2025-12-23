import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { createDb } from '../../db'
import type { Bindings, Variables } from '../../types/bindings'
import { PlansService } from './service'

const getPlansRoute = createRoute({
  method: 'get',
  path: '/plans',
  summary: 'List Active Plans',
  description: 'Retrieve all active plans for the authenticated product.',
  security: [{ ApiKeyAuth: [] }],
  responses: {
    200: {
      description: 'List of plans',
      content: {
        'application/json': {
          schema: z.array(
            z.object({
              id: z.string(),
              productId: z.string(),
              name: z.string(),
              slug: z.string(),
              price: z.number(),
              features: z.string(),
              limits: z.record(z.union([z.number(), z.boolean(), z.string()])),
              isActive: z.boolean(),
              createdAt: z.string(),
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

export const registerPlans = (app: OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>) => {
  app.openapi(getPlansRoute, async (c) => {
    const db = createDb(c.env)
    const productId = c.get('productId')

    if (!productId) {
      return c.json({ error: 'Product context missing' }, 500)
    }

    const service = new PlansService(db)
    const plans = await service.getActivePlans(productId)

    return c.json(plans, 200)
  })
}
