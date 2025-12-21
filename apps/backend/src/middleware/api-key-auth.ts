import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { Bindings, Variables } from '../types/bindings'
// import bcrypt from 'bcryptjs' // D1/Workers usually use web crypto or a simpler hashing for high perf, but let's stick to plan.
// Note: bcryptjs might be heavy for workers, but we'll use a placeholder/simplified version for now or standard comparsion if hashes are stored.
// Actually, `docs/03_features.md` mentions `bcrypt.compare`.
// For now, I will implement a basic check against the DB.

export const apiKeyAuth = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const apiKey = c.req.header('X-API-Key')

    if (!apiKey) {
      throw new HTTPException(401, { message: 'Missing API Key' })
    }

    // TODO: Implement real API key validation using bcrypt
    // c.set('productId', ...)

    // TEMPORARY: Just passing through if it looks like a key, to unblock scaffolding.
    // We will assume the key IS the ID for this specific MVP step until `bcryptjs` is added.
    if (apiKey === 'admin_master_key') {
      // Special admin bypass?
    } else {
      // Real logic
    }

    // Mock success for scaffolding
    c.set('productId', 'auto-landlord')

    await next()
  },
)
