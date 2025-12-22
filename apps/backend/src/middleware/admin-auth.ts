import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { Bindings, Variables } from '../types/bindings'
import bcrypt from 'bcryptjs'
import { createDb } from '../db'
import { eq } from 'drizzle-orm'
import { adminUsers } from '@repo/db'

// Admin authentication via Basic Auth or Bearer token
// Header format: Authorization: Basic base64(email:password)
// Or: Authorization: Bearer <session-token> (for future JWT implementation)

export const adminAuth = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader) {
      throw new HTTPException(401, { message: 'Missing Authorization header' })
    }

    // Support Basic Auth for now
    if (authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.slice(6)
      const credentials = atob(base64Credentials)
      const [email, password] = credentials.split(':')

      if (!email || !password) {
        throw new HTTPException(401, { message: 'Invalid credentials format' })
      }

      const db = createDb(c.env)
      const admin = await db.query.adminUsers.findFirst({
        where: eq(adminUsers.email, email),
      })

      if (!admin || !admin.isActive) {
        throw new HTTPException(401, { message: 'Invalid credentials' })
      }

      const isValid = await bcrypt.compare(password, admin.passwordHash)

      if (!isValid) {
        throw new HTTPException(401, { message: 'Invalid credentials' })
      }

      // Update last login time
      await db
        .update(adminUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(adminUsers.id, admin.id))

      // Set admin context for use in routes
      c.set('adminId', admin.id)
      c.set('adminRole', admin.role)
      c.set('adminEmail', admin.email)

      await next()
    } else {
      throw new HTTPException(401, { message: 'Unsupported authentication method' })
    }
  },
)

// Middleware to require SUPER_ADMIN role
export const requireSuperAdmin = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const role = c.get('adminRole')

    if (role !== 'SUPER_ADMIN') {
      throw new HTTPException(403, { message: 'Super admin access required' })
    }

    await next()
  },
)
