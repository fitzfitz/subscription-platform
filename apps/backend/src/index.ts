import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { apiKeyAuth } from './middleware/api-key-auth'
import { rateLimit } from './middleware/rate-limit'
import { errorHandler } from './middleware/error-handler'
import { Bindings, Variables } from './types/bindings'
// Feature Routers
import { registerPlans } from './features/plans'
import { registerSubscriptions } from './features/subscriptions'
import { registerAdmin } from './features/admin'

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>()

// Global Middleware
app.use('/*', cors())
app.use('/*', rateLimit)

// Error Handler
app.onError(errorHandler)

// Public Routes
app.get('/', (c) => {
  return c.text('Subscription Platform API')
})

// Health check endpoint for deployment verification
app.get('/health', async (c) => {
  try {
    const { createDb } = await import('./db')
    const db = createDb(c.env)

    // Check database connectivity
    await db.query.products.findFirst()

    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'subscription-platform-backend',
    })
  } catch (error) {
    return c.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      503,
    )
  }
})


// OpenAPI Documentation (public)
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Subscription Platform API',
  },
})

app.get('/ui', swaggerUI({ url: '/doc' }))

// Authenticated Routes - apply auth middleware BEFORE registering routes
app.use('/plans/*', apiKeyAuth)
app.use('/subscriptions/*', apiKeyAuth)
app.use('/admin/*', apiKeyAuth)

// Feature Routes (now protected by auth middleware above)
registerPlans(app)
registerSubscriptions(app)
registerAdmin(app)

const _routes = app

export type AppType = typeof _routes
export default app
