export type Bindings = {
  DB: D1Database
  API_SECRET_KEY?: string
  // RATE_LIMIT_KV: KVNamespace // Uncomment when implementing rate limiting
}

export type Variables = {
  productId?: string
  // Admin context (set by admin-auth middleware)
  adminId?: string
  adminRole?: string
  adminEmail?: string
}
