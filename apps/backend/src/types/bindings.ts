export type Bindings = {
  DB: D1Database
  // RATE_LIMIT_KV: KVNamespace // Uncomment when implementing rate limiting
}

export type Variables = {
  productId?: string
}
