import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { createDb } from '../../db'
import type { Bindings, Variables } from '../../types/bindings'
import { AdminManagementService } from './service'

// ==================== HELPER FUNCTIONS ====================

/**
 * Serializes Date objects to ISO strings recursively
 */
function serializeDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Date) return obj.toISOString() as unknown as T
  if (Array.isArray(obj)) return obj.map(serializeDates) as unknown as T
  if (typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeDates(value)
    }
    return result
  }
  return obj
}

// ==================== SHARED SCHEMAS ====================

const errorSchema = z.object({ error: z.string() })

const adminUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
})

const planSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  features: z.string(),
  maxProperties: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
})

const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const subscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  planId: z.string(),
  productId: z.string(),
  status: z.string(),
  provider: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// ==================== ADMIN USER ROUTES ====================

const createAdminRoute = createRoute({
  method: 'post',
  path: '/manage/admins',
  summary: 'Create Admin User',
  description: 'Create a new admin user (Super Admin only)',
  security: [{ AdminAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email(),
            password: z.string().min(8),
            name: z.string().min(1),
            role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Admin created',
      content: { 'application/json': { schema: adminUserSchema } },
    },
    400: { description: 'Bad Request', content: { 'application/json': { schema: errorSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorSchema } } },
  },
})

const listAdminsRoute = createRoute({
  method: 'get',
  path: '/manage/admins',
  summary: 'List Admin Users',
  description: 'List all admin users',
  security: [{ AdminAuth: [] }],
  responses: {
    200: {
      description: 'List of admins',
      content: { 'application/json': { schema: z.array(adminUserSchema) } },
    },
  },
})

const updateAdminRoute = createRoute({
  method: 'patch',
  path: '/manage/admins/{id}',
  summary: 'Update Admin User',
  description: 'Update an admin user (Super Admin only)',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().optional(),
            email: z.string().email().optional(),
            role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
            isActive: z.boolean().optional(),
            password: z.string().min(8).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Admin updated',
      content: { 'application/json': { schema: adminUserSchema } },
    },
    404: { description: 'Not Found', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deleteAdminRoute = createRoute({
  method: 'delete',
  path: '/manage/admins/{id}',
  summary: 'Delete Admin User',
  description: 'Delete an admin user (Super Admin only)',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Admin deleted',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
    },
    404: { description: 'Not Found', content: { 'application/json': { schema: errorSchema } } },
  },
})

// ==================== PRODUCT ROUTES ====================

const createProductRoute = createRoute({
  method: 'post',
  path: '/manage/products',
  summary: 'Create Product',
  description: 'Create a new product with auto-generated API key',
  security: [{ AdminAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1),
            isActive: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Product created (includes API key - save it!)',
      content: {
        'application/json': {
          schema: productSchema.extend({ apiKey: z.string() }),
        },
      },
    },
    400: { description: 'Bad Request', content: { 'application/json': { schema: errorSchema } } },
  },
})

const listProductsRoute = createRoute({
  method: 'get',
  path: '/manage/products',
  summary: 'List Products',
  description: 'List all products with their plans',
  security: [{ AdminAuth: [] }],
  responses: {
    200: {
      description: 'List of products',
      content: {
        'application/json': {
          schema: z.array(productSchema.extend({ plans: z.array(planSchema).optional() })),
        },
      },
    },
  },
})

const getProductRoute = createRoute({
  method: 'get',
  path: '/manage/products/{id}',
  summary: 'Get Product',
  description: 'Get a single product with details',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Product details',
      content: { 'application/json': { schema: productSchema } },
    },
    404: { description: 'Not Found', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updateProductRoute = createRoute({
  method: 'patch',
  path: '/manage/products/{id}',
  summary: 'Update Product',
  description: 'Update product details',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().optional(),
            isActive: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Product updated',
      content: { 'application/json': { schema: productSchema } },
    },
    404: { description: 'Not Found', content: { 'application/json': { schema: errorSchema } } },
  },
})

const regenerateApiKeyRoute = createRoute({
  method: 'post',
  path: '/manage/products/{id}/regenerate-key',
  summary: 'Regenerate API Key',
  description: 'Generate a new API key for the product (invalidates old key)',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'New API key (save it!)',
      content: { 'application/json': { schema: z.object({ apiKey: z.string() }) } },
    },
    404: { description: 'Not Found', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deleteProductRoute = createRoute({
  method: 'delete',
  path: '/manage/products/{id}',
  summary: 'Delete Product',
  description: 'Delete a product (fails if has plans/subscriptions)',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Product deleted',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
    },
    400: { description: 'Bad Request', content: { 'application/json': { schema: errorSchema } } },
  },
})

// ==================== PLAN ROUTES ====================

const createPlanRoute = createRoute({
  method: 'post',
  path: '/manage/plans',
  summary: 'Create Plan',
  description: 'Create a new plan for a product',
  security: [{ AdminAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            productId: z.string(),
            name: z.string().min(1),
            slug: z.string().min(1),
            price: z.number().min(0),
            features: z.string(),
            maxProperties: z.number().min(0),
            isActive: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Plan created',
      content: { 'application/json': { schema: planSchema } },
    },
    400: { description: 'Bad Request', content: { 'application/json': { schema: errorSchema } } },
  },
})

const listPlansRoute = createRoute({
  method: 'get',
  path: '/manage/plans',
  summary: 'List Plans',
  description: 'List all plans, optionally filtered by product',
  security: [{ AdminAuth: [] }],
  request: {
    query: z.object({
      productId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of plans',
      content: { 'application/json': { schema: z.array(planSchema) } },
    },
  },
})

const getPlanRoute = createRoute({
  method: 'get',
  path: '/manage/plans/{id}',
  summary: 'Get Plan',
  description: 'Get a single plan with details',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Plan details',
      content: { 'application/json': { schema: planSchema } },
    },
    404: { description: 'Not Found', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updatePlanRoute = createRoute({
  method: 'patch',
  path: '/manage/plans/{id}',
  summary: 'Update Plan',
  description: 'Update plan details',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().optional(),
            slug: z.string().optional(),
            price: z.number().optional(),
            features: z.string().optional(),
            maxProperties: z.number().optional(),
            isActive: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Plan updated',
      content: { 'application/json': { schema: planSchema } },
    },
    404: { description: 'Not Found', content: { 'application/json': { schema: errorSchema } } },
  },
})

const deletePlanRoute = createRoute({
  method: 'delete',
  path: '/manage/plans/{id}',
  summary: 'Delete Plan',
  description: 'Delete a plan (fails if has subscriptions)',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Plan deleted',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
    },
    400: { description: 'Bad Request', content: { 'application/json': { schema: errorSchema } } },
  },
})

// ==================== USER ROUTES ====================

const listUsersRoute = createRoute({
  method: 'get',
  path: '/manage/users',
  summary: 'List Users',
  description: 'List all users with their subscriptions',
  security: [{ AdminAuth: [] }],
  request: {
    query: z.object({
      search: z.string().optional(),
      productId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of users',
      content: { 'application/json': { schema: z.array(userSchema) } },
    },
  },
})

const getUserRoute = createRoute({
  method: 'get',
  path: '/manage/users/{id}',
  summary: 'Get User',
  description: 'Get a single user with subscriptions',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'User details',
      content: { 'application/json': { schema: userSchema } },
    },
    404: { description: 'Not Found', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updateUserRoute = createRoute({
  method: 'patch',
  path: '/manage/users/{id}',
  summary: 'Update User',
  description: 'Update user details',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().optional(),
            email: z.string().email().optional(),
            role: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User updated',
      content: { 'application/json': { schema: userSchema } },
    },
    404: { description: 'Not Found', content: { 'application/json': { schema: errorSchema } } },
  },
})

// ==================== SUBSCRIPTION ROUTES ====================

const listSubscriptionsRoute = createRoute({
  method: 'get',
  path: '/manage/subscriptions',
  summary: 'List Subscriptions',
  description: 'List all subscriptions with filters',
  security: [{ AdminAuth: [] }],
  request: {
    query: z.object({
      status: z.string().optional(),
      productId: z.string().optional(),
      planId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of subscriptions',
      content: { 'application/json': { schema: z.array(subscriptionSchema) } },
    },
  },
})

const getSubscriptionRoute = createRoute({
  method: 'get',
  path: '/manage/subscriptions/{id}',
  summary: 'Get Subscription',
  description: 'Get a single subscription with details',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Subscription details',
      content: { 'application/json': { schema: subscriptionSchema } },
    },
    404: { description: 'Not Found', content: { 'application/json': { schema: errorSchema } } },
  },
})

const createSubscriptionRoute = createRoute({
  method: 'post',
  path: '/manage/subscriptions',
  summary: 'Create Subscription',
  description: 'Manually create a subscription for a user',
  security: [{ AdminAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            userId: z.string(),
            planId: z.string(),
            productId: z.string(),
            status: z.enum(['active', 'pending_verification', 'past_due', 'canceled']).optional(),
            provider: z.string().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Subscription created',
      content: { 'application/json': { schema: subscriptionSchema } },
    },
    400: { description: 'Bad Request', content: { 'application/json': { schema: errorSchema } } },
  },
})

const updateSubscriptionRoute = createRoute({
  method: 'patch',
  path: '/manage/subscriptions/{id}',
  summary: 'Update Subscription',
  description: 'Update subscription details',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.enum(['active', 'pending_verification', 'past_due', 'canceled']).optional(),
            planId: z.string().optional(),
            startDate: z.string().optional(),
            endDate: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Subscription updated',
      content: { 'application/json': { schema: subscriptionSchema } },
    },
    404: { description: 'Not Found', content: { 'application/json': { schema: errorSchema } } },
  },
})

const cancelSubscriptionRoute = createRoute({
  method: 'post',
  path: '/manage/subscriptions/{id}/cancel',
  summary: 'Cancel Subscription',
  description: 'Cancel an active subscription',
  security: [{ AdminAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: 'Subscription canceled',
      content: { 'application/json': { schema: subscriptionSchema } },
    },
    404: { description: 'Not Found', content: { 'application/json': { schema: errorSchema } } },
  },
})

// ==================== DASHBOARD ROUTE ====================

const dashboardRoute = createRoute({
  method: 'get',
  path: '/manage/dashboard',
  summary: 'Dashboard Stats',
  description: 'Get platform statistics',
  security: [{ AdminAuth: [] }],
  responses: {
    200: {
      description: 'Dashboard statistics',
      content: {
        'application/json': {
          schema: z.object({
            products: z.number(),
            plans: z.number(),
            users: z.number(),
            activeSubscriptions: z.number(),
            pendingSubscriptions: z.number(),
          }),
        },
      },
    },
  },
})

// ==================== REGISTER ALL ROUTES ====================

export const registerAdminManagement = (
  app: OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>,
) => {
  // Dashboard
  app.openapi(dashboardRoute, async (c) => {
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const stats = await service.getDashboardStats()
    return c.json(stats, 200)
  })

  // Admin Users
  app.openapi(createAdminRoute, async (c) => {
    const role = c.get('adminRole')
    if (role !== 'SUPER_ADMIN') {
      return c.json({ error: 'Super admin access required' }, 403)
    }

    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const data = await c.req.json()

    try {
      const admin = await service.createAdmin(data)
      return c.json(serializeDates(admin), 201)
    } catch (_error) {
      return c.json({ error: 'Failed to create admin' }, 400)
    }
  })

  app.openapi(listAdminsRoute, async (c) => {
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const admins = await service.listAdmins()
    return c.json(serializeDates(admins), 200)
  })

  // @ts-expect-error - OpenAPI type strictness: error responses (403/404) don't perfectly match schema, but runtime is correct
  app.openapi(updateAdminRoute, async (c) => {
    const role = c.get('adminRole')
    if (role !== 'SUPER_ADMIN') {
      return c.json({ error: 'Super admin access required' }, 403)
    }

    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const data = await c.req.json()

    const admin = await service.updateAdmin(id, data)
    if (!admin) return c.json({ error: 'Admin not found' }, 404)

    return c.json(serializeDates(admin), 200)
  })

  // @ts-expect-error - OpenAPI type strictness: error responses (403/404/400) don't perfectly match schema, but runtime is correct
  app.openapi(deleteAdminRoute, async (c) => {
    const role = c.get('adminRole')
    const adminId = c.get('adminId')
    const { id } = c.req.valid('param')

    if (role !== 'SUPER_ADMIN') {
      return c.json({ error: 'Super admin access required' }, 403)
    }

    if (id === adminId) {
      return c.json({ error: 'Cannot delete yourself' }, 400)
    }

    const db = createDb(c.env)
    const service = new AdminManagementService(db)

    const success = await service.deleteAdmin(id)
    if (!success) return c.json({ error: 'Admin not found' }, 404)

    return c.json({ success: true }, 200)
  })

  // Products
  app.openapi(createProductRoute, async (c) => {
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const data = await c.req.json()

    try {
      const product = await service.createProduct(data)
      return c.json(serializeDates(product), 201)
    } catch (_error) {
      return c.json({ error: 'Failed to create product' }, 400)
    }
  })

  app.openapi(listProductsRoute, async (c) => {
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const products = await service.listProducts()
    return c.json(serializeDates(products), 200)
  })

  app.openapi(getProductRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)

    const product = await service.getProductById(id)
    if (!product) return c.json({ error: 'Product not found' }, 404)

    return c.json(serializeDates(product), 200)
  })

  app.openapi(updateProductRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const data = await c.req.json()

    const product = await service.updateProduct(id, data)
    if (!product) return c.json({ error: 'Product not found' }, 404)

    return c.json(serializeDates(product), 200)
  })

  app.openapi(regenerateApiKeyRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)

    const result = await service.regenerateProductApiKey(id)
    if (!result) return c.json({ error: 'Product not found' }, 404)

    return c.json(result, 200)
  })

  app.openapi(deleteProductRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)

    try {
      const success = await service.deleteProduct(id)
      if (!success) return c.json({ error: 'Product not found' }, 400)
      return c.json({ success: true }, 200)
    } catch (_error) {
      return c.json({ error: 'Cannot delete product with existing plans or subscriptions' }, 400)
    }
  })

  // Plans
  app.openapi(createPlanRoute, async (c) => {
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const data = await c.req.json()

    try {
      const plan = await service.createPlan(data)
      return c.json(serializeDates(plan), 201)
    } catch (_error) {
      return c.json({ error: 'Failed to create plan' }, 400)
    }
  })

  app.openapi(listPlansRoute, async (c) => {
    const { productId } = c.req.valid('query')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const plans = await service.listPlans(productId)
    return c.json(serializeDates(plans), 200)
  })

  app.openapi(getPlanRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)

    const plan = await service.getPlanById(id)
    if (!plan) return c.json({ error: 'Plan not found' }, 404)

    return c.json(serializeDates(plan), 200)
  })

  app.openapi(updatePlanRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const data = await c.req.json()

    const plan = await service.updatePlan(id, data)
    if (!plan) return c.json({ error: 'Plan not found' }, 404)

    return c.json(serializeDates(plan), 200)
  })

  app.openapi(deletePlanRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)

    try {
      const success = await service.deletePlan(id)
      if (!success) return c.json({ error: 'Plan not found' }, 400)
      return c.json({ success: true }, 200)
    } catch (_error) {
      return c.json({ error: 'Cannot delete plan with existing subscriptions' }, 400)
    }
  })

  // Users
  app.openapi(listUsersRoute, async (c) => {
    const { search, productId } = c.req.valid('query')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const users = await service.listUsers({ search, productId })
    return c.json(serializeDates(users), 200)
  })

  app.openapi(getUserRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)

    const user = await service.getUserById(id)
    if (!user) return c.json({ error: 'User not found' }, 404)

    return c.json(serializeDates(user), 200)
  })

  app.openapi(updateUserRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const data = await c.req.json()

    const user = await service.updateUser(id, data)
    if (!user) return c.json({ error: 'User not found' }, 404)

    return c.json(serializeDates(user), 200)
  })

  // Subscriptions
  app.openapi(listSubscriptionsRoute, async (c) => {
    const { status, productId, planId } = c.req.valid('query')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const subscriptions = await service.listSubscriptions({ status, productId, planId })
    return c.json(serializeDates(subscriptions), 200)
  })

  app.openapi(getSubscriptionRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)

    const subscription = await service.getSubscriptionById(id)
    if (!subscription) return c.json({ error: 'Subscription not found' }, 404)

    return c.json(serializeDates(subscription), 200)
  })

  // @ts-expect-error - OpenAPI type strictness: 409 conflict response not in schema, but runtime is correct
  app.openapi(createSubscriptionRoute, async (c) => {
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const data = await c.req.json()

    try {
      const subscription = await service.createSubscription({
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      })
      return c.json(serializeDates(subscription), 201)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Handle duplicate subscription constraint violation
      if (errorMessage.includes('already exists')) {
        return c.json(
          {
            error: errorMessage,
            hint: 'Use PATCH /manage/subscriptions/{id} to update instead',
          },
          409,
        ) // 409 Conflict
      }

      return c.json({ error: 'Failed to create subscription' }, 400)
    }
  })

  app.openapi(updateSubscriptionRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)
    const data = await c.req.json()

    const subscription = await service.updateSubscription(id, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate === null ? null : data.endDate ? new Date(data.endDate) : undefined,
    })
    if (!subscription) return c.json({ error: 'Subscription not found' }, 404)

    return c.json(serializeDates(subscription), 200)
  })

  app.openapi(cancelSubscriptionRoute, async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env)
    const service = new AdminManagementService(db)

    const subscription = await service.cancelSubscription(id)
    if (!subscription) return c.json({ error: 'Subscription not found' }, 404)

    return c.json(serializeDates(subscription), 200)
  })
}
