import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { Bindings, Variables } from '../types/bindings'
import bcrypt from 'bcryptjs'
import { createDb } from '../db'
import { eq } from 'drizzle-orm'
import { products } from '@repo/db'

export const apiKeyAuth = createMiddleware<{ Bindings: Bindings; Variables: Variables }>(
  async (c, next) => {
    const apiKey = c.req.header('X-API-Key')

    if (!apiKey) {
      throw new HTTPException(401, { message: 'Missing API Key' })
    }

    // Keys are prefixed with the product identifier: {productId}_prod_{uuid}
    const parts = apiKey.split('_')
    const productId = parts[0]

    if (!productId) {
      throw new HTTPException(401, { message: 'Invalid API Key format' })
    }

    const db = createDb(c.env)
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    })

    if (!product || !product.isActive) {
      throw new HTTPException(401, { message: 'Product not found or inactive' })
    }

    // Verify key against stored hash
    const isValid = await bcrypt.compare(apiKey, product.apiKeyHash)

    if (!isValid) {
      throw new HTTPException(401, { message: 'Invalid API Key' })
    }

    c.set('productId', product.id)
    await next()
  },
)
