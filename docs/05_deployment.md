# Deployment Guide

Complete guide for deploying and managing the subscription platform.

## Prerequisites

### Accounts Required
- [Cloudflare Account](https://dash.cloudflare.com/sign-up) (Free tier works)
- [Clerk Account](https://clerk.com/) (for user authentication)
- Domain name (optional but recommended)

### Local Development Tools
```bash
node -v    # v18+ required
pnpm -v    # v8+ required
git --version
```

---

## Project Setup

### 1. Create New Application

```bash
cd auto-landlord/apps
mkdir subscription-service
cd subscription-service

# Initialize package.json
pnpm init
```

### 2. Install Dependencies

```bash
pnpm add hono @hono/zod-openapi drizzle-orm bcryptjs
pnpm add -D wrangler typescript @types/node vitest
pnpm add -D @cloudflare/workers-types
```

### 3. Project Structure

```
apps/subscription-service/
├── src/
│   ├── index.ts                 # Main Hono app
│   ├── db/
│   │   └── index.ts             # Database connection
│   ├── middleware/
│   │   ├── api-key-auth.ts      # API key validation
│   │   ├── rate-limit.ts        # Rate limiting
│   │   └── error-handler.ts     # Error handling
│   ├── features/
│   │   ├── subscriptions/
│   │   │   ├── index.ts         # Routes
│   │   │   └── service.ts       # Business logic
│   │   ├── plans/
│   │   │   ├── index.ts
│   │   │   └── service.ts
│   │   └── admin/
│   │       ├── index.ts
│   │       └── service.ts
│   └── types/
│       └── bindings.ts          # Cloudflare env types
├── wrangler.json                # Cloudflare config
├── package.json
└── tsconfig.json
```

---

## Database Setup

### 1. Create D1 Database

```bash
cd apps/subscription-service

# Create database
npx wrangler d1 create subscription-platform-db

# Output will show:
# [[d1_databases]]
# binding = "DB"
# database_name = "subscription-platform-db"
# database_id = "abc-123-def-456"
```

### 2. Update wrangler.json

```json
{
  "name": "subscription-service",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-15",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "subscription-platform-db",
      "database_id": "YOUR_DATABASE_ID_HERE"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "RATE_LIMIT_KV",
      "id": "YOUR_KV_NAMESPACE_ID"
    }
  ]
}
```

### 3. Create Migrations

```bash
# Use shared package migrations
cd ../../packages/shared

# Generate migration
pnpm drizzle-kit generate:sqlite

# This creates: drizzle/0003_add_products.sql
```

**Migration Content**:
```sql
-- drizzle/0003_add_products.sql

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL UNIQUE,
  is_active INTEGER DEFAULT 1 NOT NULL,
  created_at INTEGER NOT NULL
);

-- Add product_id to existing tables
ALTER TABLE subscriptions ADD COLUMN product_id TEXT 
  REFERENCES products(id);

ALTER TABLE plans ADD COLUMN product_id TEXT 
  REFERENCES products(id);

-- Backfill existing data
INSERT INTO products (id, name, api_key_hash, created_at)
VALUES (
  'auto-landlord', 
  'Auto-Landlord', 
  '$2a$10$PLACEHOLDER', -- Replace with real hash
  strftime('%s', 'now')
);

UPDATE subscriptions 
SET product_id = 'auto-landlord' 
WHERE product_id IS NULL;

UPDATE plans 
SET product_id = 'auto-landlord' 
WHERE product_id IS NULL;
```

### 4. Apply Migrations

```bash
# Local
npx wrangler d1 migrations apply subscription-platform-db --local

# Production (after testing)
npx wrangler d1 migrations apply subscription-platform-db --remote
```

### 5. Seed Initial Data

```sql
-- scripts/seed-subscription-platform.sql

-- Insert plans for Auto-Landlord
INSERT INTO plans (id, product_id, name, slug, price, features, max_properties)
VALUES 
  (
    'al-starter',
    'auto-landlord',
    'Starter',
    'auto-landlord-starter',
    0,
    'Up to 2 properties,Basic features,Email support',
    2
  ),
  (
    'al-pro',
    'auto-landlord',
    'Pro',
    'auto-landlord-pro',
    2900,
    'Unlimited properties,Advanced reporting,Priority support',
    999999
  );
```

```bash
# Apply seed
npx wrangler d1 execute subscription-platform-db \
  --local \
  --file=scripts/seed-subscription-platform.sql
```

---

## API Key Generation

### Generate Product API Key

```typescript
// scripts/generate-api-key.ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const generateApiKey = async (productName: string) => {
  // Generate random key
  const apiKey = `${productName.toLowerCase().replace(/\s/g, '-')}_prod_${crypto.randomUUID()}`;
  
  // Hash for storage
  const apiKeyHash = await bcrypt.hash(apiKey, 10);
  
  console.log('='.repeat(60));
  console.log('Product API Key (SAVE THIS - shown only once)');
  console.log('='.repeat(60));
  console.log('API Key:', apiKey);
  console.log('\nHash (for database):', apiKeyHash);
  console.log('='.repeat(60));
  
  console.log('\nInsert into database:');
  console.log(`UPDATE products SET api_key_hash = '${apiKeyHash}' WHERE id = '${productName.toLowerCase()}';`);
};

generateApiKey('auto-landlord');
```

```bash
# Run generator
npx tsx scripts/generate-api-key.ts
```

**Save the output** - you'll need it for Auto-Landlord's `.env` file.

---

## Local Development

### 1. Start Dev Server

```bash
cd apps/subscription-service

# Start Wrangler dev server
pnpm wrangler dev

# Output:
# ⎔ Starting local server...
# ⎔ Ready on http://localhost:8788
```

### 2. Test Endpoints

```bash
# Get plans
curl http://localhost:8788/plans \
  -H "X-API-Key: auto-landlord_prod_abc123"

# Get user subscription
curl http://localhost:8788/subscriptions/user_123 \
  -H "X-API-Key: auto-landlord_prod_abc123"
```

### 3. Database Studio

```bash
# View local database
npx wrangler d1 execute subscription-platform-db --local \
  --command "SELECT * FROM products"
```

---

## Production Deployment

### 1. Deploy to Cloudflare

```bash
cd apps/subscription-service

# Deploy
pnpm wrangler deploy

# Output:
# Published subscription-service (X.X s)
#   https://subscription-service.your-subdomain.workers.dev
```

### 2. Configure Custom Domain

In Cloudflare Dashboard:
1. Go to **Workers & Pages**
2. Select `subscription-service`
3. Click **Triggers** tab
4. Add custom domain: `subscriptions.yourdomain.com`

### 3. Set Environment Variables

```bash
# Set secrets (not in wrangler.json)
npx wrangler secret put ADMIN_API_KEY

# Prompt: Enter secret value
# Input: <your-secure-admin-key>
```

### 4. Apply Remote Migrations

```bash
# Run migrations on production database
npx wrangler d1 migrations apply subscription-platform-db --remote

# Seed production data
npx wrangler d1 execute subscription-platform-db \
  --remote \
  --file=scripts/seed-subscription-platform.sql
```

---

## Auto-Landlord Integration

### 1. Update Environment Variables

```bash
# apps/auto-landlord-admin/.env
VITE_SUBSCRIPTION_API_URL=https://subscriptions.yourdomain.com
VITE_SUBSCRIPTION_API_KEY=auto-landlord_prod_abc123
```

### 2. Modify AuthProvider

```typescript
// apps/auto-landlord-admin/src/providers/AuthProvider.tsx

const fetchSubscription = async (userId: string) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUBSCRIPTION_API_URL}/subscriptions/${userId}`,
      {
        headers: {
          'X-API-Key': import.meta.env.VITE_SUBSCRIPTION_API_KEY,
        },
      }
    );
    
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    return null;
  }
};
```

### 3. Test Integration

```bash
# Start Auto-Landlord
cd apps/auto-landlord-admin
pnpm dev

# Login as a user
# Check browser console for subscription API calls
```

---

## Monitoring & Maintenance

### View Logs

```bash
# Tail production logs
npx wrangler tail

# Filter by status
npx wrangler tail --status error
```

### Database Backups

```bash
# Export database
npx wrangler d1 export subscription-platform-db \
  --remote \
  --output=backups/backup-$(date +%Y%m%d).sql
```

### Monitor Performance

Cloudflare Dashboard → Workers & Pages → subscription-service:
- **Requests**: Total API calls
- **Errors**: 5xx responses
- **CPU Time**: Average execution time
- **Invocations**: Unique executions

---

## Rollback Procedure

### If Deployment Fails

```bash
# Deploy previous version
npx wrangler rollback
```

### If Migration Breaks Database

```bash
# Restore from backup
npx wrangler d1 execute subscription-platform-db \
  --remote \
  --file=backups/backup-20240115.sql
```

---

## Scaling

### Automatic Scaling
Cloudflare Workers auto-scale to handle:
- **10,000 requests/second** per worker
- **Global edge network** (300+ locations)
- **0ms cold starts**

No manual configuration needed.

### When to Optimize

Monitor these metrics:
- **CPU Time > 50ms**: Optimize database queries
- **Error Rate > 1%**: Investigate failed requests
- **Rate Limit Hits**: Adjust limits or scale KV

---

## Troubleshooting

### "401 Unauthorized" Errors

**Check**:
1. API key properly set in environment
2. API key hash matches database
3. Product `is_active = 1`

```bash
# Verify API key
npx wrangler d1 execute subscription-platform-db --local \
  --command "SELECT * FROM products WHERE id = 'auto-landlord'"
```

### "Database Locked" Errors

D1 uses SQLite with serialized writes.

**Solution**: Retry failed writes with exponential backoff.

```typescript
const retryWrite = async (fn: () => Promise<any>, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 100));
    }
  }
};
```

### "Rate Limit Exceeded"

**Temporary Fix**: Increase limits in middleware

**Long-term**: Investigate unusual traffic patterns

---

## Cost Estimates

Cloudflare Workers pricing (as of 2024):

| Resource | Free Tier | Paid Tier |
|----------|-----------|-----------|
| Requests | 100,000/day | $0.50/million |
| CPU Time | 10ms/request | Same |
| D1 Rows Read | 5 million/day | $0.001/million |
| D1 Rows Written | 100,000/day | $1.00/million |

**Expected Monthly Cost** (1,000 active subscriptions):
- Requests: ~3M/month = $1.50
- D1 Operations: ~10M reads, 100K writes = $10
- **Total: ~$12/month**

Very affordable for a multi-product subscription platform!
