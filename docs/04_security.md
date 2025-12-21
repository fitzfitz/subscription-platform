# Security Model

Comprehensive security architecture for the subscription platform.

## Threat Model

### Assets to Protect

1. **User Data**: Email, subscription details, payment information
2. **Business Logic**: Pricing, plan limits, verification status
3. **API Keys**: Product authentication credentials
4. **Payment Proofs**: Uploaded receipts and transaction details

### Threat Actors

- **Malicious Users**: Attempt to bypass payment or feature limits
- **Compromised Products**: Stolen API keys used to access data
- **External Attackers**: DDoS, SQL injection, XSS attempts

---

## Defense Layers

### Layer 1: Transport Security

**TLS/HTTPS Everywhere**

- All API communication over HTTPS
- Cloudflare Workers enforce TLS 1.3
- HSTS headers prevent downgrade attacks

```typescript
// Hono middleware
app.use('*', async (c, next) => {
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  await next()
})
```

---

### Layer 2: API Key Authentication

**Secure Key Storage**

❌ **Never store plain text**:

```javascript
// WRONG
apiKey: 'al_prod_a1b2c3d4e5f6'
```

✅ **Always hash**:

```javascript
// CORRECT
apiKeyHash: '$2a$10$N9qo8uLOickgx2ZMRZoMye...'
```

**Key Format**:

```
[product]_[environment]_[random]
Example: al_prod_8f7e6d5c4b3a
```

**Validation Process**:

```typescript
const validateApiKey = async (providedKey: string, storedHash: string) => {
  // Use bcrypt compare (timing-safe)
  return await bcrypt.compare(providedKey, storedHash)
}
```

**Key Rotation**:

1. Generate new key via admin endpoint
2. Both old and new keys valid for 24 hours
3. Update product environment variables
4. Old key automatically expires

---

### Layer 3: Product Isolation

**Database-Level Isolation**

Every query filtered by `product_id`:

```typescript
// ✅ CORRECT - Includes product context
const subscription = await db.query.subscriptions.findFirst({
  where: and(
    eq(subscriptions.userId, userId),
    eq(subscriptions.productId, productId), // From API key
  ),
})

// ❌ WRONG - Missing product filter
const subscription = await db.query.subscriptions.findFirst({
  where: eq(subscriptions.userId, userId),
  // Danger: Could return subscription from different product!
})
```

**Middleware Enforcement**:

```typescript
// Extract product from validated API key
app.use('*', async (c, next) => {
  const productId = c.get('productId') // Set by API key validator
  c.set('dbContext', { productId }) // Propagate to all queries
  await next()
})
```

---

### Layer 4: Input Validation

**Zod Schema Validation**

All API inputs validated before processing:

```typescript
import { z } from 'zod'

const upgradeSchema = z.object({
  planSlug: z.string().min(1).max(100),
  paymentProofUrl: z.string().url().optional(),
  paymentNote: z.string().max(500).optional(),
})

app.post('/subscriptions/:userId/upgrade', async (c) => {
  const body = await c.req.json()

  // Validation throws if invalid
  const validated = upgradeSchema.parse(body)

  // Safe to use
  await processUpgrade(validated)
})
```

**Common Validations**:

- Email: `z.string().email()`
- UUID: `z.string().uuid()`
- Enum: `z.enum(['active', 'pending_verification'])`
- Price: `z.number().int().min(0)`

---

### Layer 5: SQL Injection Prevention

**Drizzle ORM Protection**

Using Drizzle's query builder prevents SQL injection:

```typescript
// ✅ SAFE - Parameterized by Drizzle
const subs = await db.query.subscriptions.findMany({
  where: eq(subscriptions.userId, userInput),
})

// ❌ DANGEROUS - Raw SQL with string concatenation
const subs = await db.run(`SELECT * FROM subscriptions WHERE user_id = '${userInput}'`)
```

**When Raw SQL is Necessary**:

```typescript
import { sql } from 'drizzle-orm'

// Use sql`` template literals (auto-escaped)
const result = await db.run(sql`SELECT * FROM subscriptions WHERE user_id = ${userId}`)
```

---

### Layer 6: Rate Limiting

**Per-Product Limits**

```typescript
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const limits: Record<string, RateLimitConfig> = {
  standard: { windowMs: 60000, maxRequests: 100 },
  admin: { windowMs: 60000, maxRequests: 1000 },
}

const rateLimit = async (c: Context, next: Next) => {
  const productId = c.get('productId')
  const endpoint = c.req.path

  const config = endpoint.startsWith('/admin') ? limits.admin : limits.standard

  const key = `rl:${productId}:${(Date.now() / config.windowMs) | 0}`

  const current = await c.env.RATE_LIMIT_KV.get(key)

  if (current && parseInt(current) >= config.maxRequests) {
    throw new HTTPException(429, {
      message: `Rate limit: ${config.maxRequests}/${config.windowMs}ms`,
    })
  }

  await c.env.RATE_LIMIT_KV.put(key, String(parseInt(current || '0') + 1), {
    expirationTtl: config.windowMs / 1000,
  })

  await next()
}
```

**Bypass for Trusted IPs** (future):

```typescript
const TRUSTED_IPS = ['1.2.3.4', '5.6.7.8']

if (TRUSTED_IPS.includes(clientIp)) {
  return await next() // Skip rate limit
}
```

---

### Layer 7: File Upload Security

**Receipt Upload Validation**

```typescript
const validateUpload = (file: File) => {
  // 1. Check file type
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type')
  }

  // 2. Check file size (max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    throw new Error('File too large')
  }

  // 3. Check file extension
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    throw new Error('Invalid file extension')
  }

  return true
}
```

**Cloudflare R2 Security**:

- Generate unique, unguessable filenames
- Set appropriate CORS headers
- No directory listing
- Signed URLs for sensitive files (future)

---

### Layer 8: Admin Access Control

**Super Admin Role**

```typescript
const requireAdmin = async (c: Context, next: Next) => {
  const userId = c.get('userId')

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (user?.role !== 'SUPER_ADMIN') {
    throw new HTTPException(403, {
      message: 'Admin access required',
    })
  }

  await next()
}

// Apply to admin routes
app.use('/admin/*', requireAdmin)
```

**Audit Logging** (future):

```typescript
// Log all admin actions
await db.insert(audit_logs).values({
  userId: adminId,
  action: 'approve_subscription',
  targetId: subscriptionId,
  timestamp: new Date(),
})
```

---

## Security Checklist

### Before Deployment

- [ ] All API keys hashed with bcrypt (cost factor ≥ 10)
- [ ] HTTPS enforced on all endpoints
- [ ] Rate limiting configured
- [ ] Input validation with Zod
- [ ] No raw SQL queries with user input
- [ ] File upload validation active
- [ ] Admin routes protected
- [ ] CORS configured correctly
- [ ] Environment variables secured
- [ ] Database backups scheduled

### Monitoring

- [ ] Log all authentication failures
- [ ] Alert on unusual rate limit violations
- [ ] Monitor failed file uploads
- [ ] Track admin actions
- [ ] Regular security audits

---

## Incident Response

### If API Key Compromised

1. **Immediately rotate key**:

   ```bash
   curl -X POST https://subscriptions.yourdomain.com/admin/products/auto-landlord/rotate-key \
     -H "X-API-Key: admin_master_key"
   ```

2. **Update product environment**:

   ```bash
   # In Auto-Landlord
   VITE_SUBSCRIPTION_API_KEY=new_key_here
   ```

3. **Monitor for abuse**:
   - Check rate limit violations
   - Review subscription modifications
   - Audit user data access

4. **Notify affected users** if data accessed

---

### If User Data Breach

1. **Isolate affected records**
2. **Rotate all API keys**
3. **Force password resets** (via Clerk)
4. **Legal compliance**: GDPR notifications if applicable
5. **Post-mortem**: Document root cause

---

## Compliance

### GDPR Considerations

- **Right to Access**: `/users/:id/data-export` endpoint
- **Right to Deletion**: Cascade deletes for subscriptions
- **Data Minimization**: Only store necessary fields
- **Consent**: Opt-in for marketing emails

### PCI DSS

> **Note**: We do NOT store credit card numbers.
> All card processing via Stripe (PCI compliant).
> We only store:
>
> - Receipt images (user-provided)
> - Subscription status
> - Plan information

This limits our compliance scope significantly.

---

## Security Best Practices

### For Product Developers

1. **Never hardcode API keys**

   ```typescript
   // ❌ WRONG
   const API_KEY = 'al_prod_abc123'

   // ✅ CORRECT
   const API_KEY = import.meta.env.VITE_SUBSCRIPTION_API_KEY
   ```

2. **Always validate subscriptions server-side**

   ```typescript
   // Frontend check is just UX
   // Backend MUST verify before granting access
   ```

3. **Log security events**
   ```typescript
   console.log('[Security] Failed auth attempt from IP:', ip)
   ```

### For Admins

1. **Use strong admin API key**

   ```bash
   # Generate cryptographically secure key
   openssl rand -base64 32
   ```

2. **Rotate keys quarterly**
3. **Review audit logs weekly**
4. **Limit admin key distribution**
