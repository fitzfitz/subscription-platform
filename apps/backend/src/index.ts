import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { apiKeyAuth } from './middleware/api-key-auth'
import { adminAuth } from './middleware/admin-auth'
import { rateLimit } from './middleware/rate-limit'
import { errorHandler } from './middleware/error-handler'
import type { Bindings, Variables } from './types/bindings'
// Feature Routers
import { registerPlans } from './features/plans'
import { registerSubscriptions } from './features/subscriptions'
import { registerAdmin } from './features/admin'
import { registerAdminManagement } from './features/admin-management'

const app = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>()

// Register Security Schemes
app.openAPIRegistry.registerComponent('securitySchemes', 'ApiKeyAuth', {
  type: 'apiKey',
  in: 'header',
  name: 'X-API-Key',
})

app.openAPIRegistry.registerComponent('securitySchemes', 'AdminAuth', {
  type: 'http',
  scheme: 'basic',
  description: 'Admin authentication using email:password',
})

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
    description: `
## Authentication

This API uses two authentication methods:

### 1. Product API Key (for product integration)
- Header: \`X-API-Key: {product-api-key}\`
- Used for: /plans, /subscriptions, /admin endpoints
- Generate via admin management API

### 2. Admin Basic Auth (for platform management)
- Header: \`Authorization: Basic base64(email:password)\`
- Used for: /manage/* endpoints
- Create admins via seed or super admin
    `,
  },
})

app.get('/ui', swaggerUI({ url: '/doc' }))

// Authenticated Routes - Product API Key Auth
app.use('/plans/*', apiKeyAuth)
app.use('/subscriptions/*', apiKeyAuth)
app.use('/admin/*', apiKeyAuth)

// Authenticated Routes - Admin Basic Auth
app.use('/manage/*', adminAuth)

// Feature Routes (protected by auth middleware above)
registerPlans(app)
registerSubscriptions(app)
registerAdmin(app)
registerAdminManagement(app)

const _routes = app

export type AppType = typeof _routes
export default app
