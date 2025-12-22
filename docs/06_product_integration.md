# Product App Integration Guide

**For Developers Building SaaS Products Using This Platform**

This guide shows you how to integrate your SaaS application with the subscription platform to verify user subscriptions and enforce access control.

---

## Getting Started

### 1. Get Your Product's API Key

Contact your platform administrator to create a product entry and receive your unique API key.

**API Key Format**: `{product-id}_prod_{uuid}`

**Example**: `auto-landlord_prod_abc123xyz456`

> **⚠️ Important**: Save this securely - it's only shown once!

---

### 2. Set Environment Variables

```bash
# .env
SUBSCRIPTION_PLATFORM_URL=https://api.subscription-platform.com
SUBSCRIPTION_API_KEY=your_product_api_key_here
```

---

## API Endpoints Reference

### Base URL

- **Production**: `https://api.subscription-platform.com`
- **Local Dev**: `http://localhost:8788`
- **Swagger Docs**: `{BASE_URL}/ui`

### Authentication

All requests require the API key header:

```
X-API-Key: {your-api-key}
```

---

## 1. List Available Plans

**GET** `/plans`

Get all active subscription plans for your product.

**Authentication**: Required

**Response** (200 OK):

```json
[
  {
    "id": "plan_123",
    "productId": "auto-landlord",
    "name": "Starter",
    "slug": "auto-landlord-starter",
    "price": 1900,
    "features": "Up to 5 properties, Basic support",
    "maxProperties": 5,
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z"
  }
]
```

**Use Case**: Display pricing page to users

**Example**:

```javascript
const plans = await fetch(`${API_URL}/plans`, {
  headers: { 'X-API-Key': API_KEY },
}).then((r) => r.json())
```

---

## 2. Check User Subscription

**GET** `/subscriptions/{userId}`

Verify if a user has an active subscription.

**Parameters**:

- `userId` (path) - User's ID from your auth system (e.g., Clerk UserID)

**Response** (200 OK):

```json
{
  "id": "sub_xyz",
  "status": "active",
  "planId": "plan_123",
  "plan": {
    "name": "Pro",
    "features": "Up to 20 properties, Priority support"
  }
}
```

**Response** (404 Not Found):

```json
{
  "error": "No active subscription found"
}
```

**Use Case**: Verify access before allowing feature usage

**Example**:

```javascript
const response = await fetch(`${API_URL}/subscriptions/${userId}`, {
  headers: { 'X-API-Key': API_KEY },
})

if (response.status === 404) {
  // No subscription - redirect to pricing
  return { hasAccess: false }
}

const subscription = await response.json()
return { hasAccess: true, subscription }
```

---

## 3. Request Upgrade

**POST** `/subscriptions/{userId}/upgrade`

Submit an upgrade request (requires platform admin approval).

**Parameters**:

- `userId` (path) - User's ID

**Request Body**:

```json
{
  "productId": "auto-landlord",
  "planId": "plan_456",
  "paymentProofUrl": "https://storage.com/receipt.jpg",
  "paymentNote": "Bank transfer ref: TRX12345"
}
```

**Response** (201 Created):

```json
{
  "id": "sub_new",
  "status": "pending_verification"
}
```

**Response** (400 Bad Request):

```json
{
  "error": "User already has an active subscription for this product. Please cancel or modify the existing subscription first."
}
```

**Use Case**: Handle user-initiated plan changes

---

## Integration Patterns

### Pattern 1: Feature Gate Middleware

Protect routes that require an active subscription:

```javascript
// middleware/subscription.js
export async function requireSubscription(req, res, next) {
  const userId = req.user.id // from your auth (Clerk, Auth0, etc.)

  const response = await fetch(`${process.env.SUBSCRIPTION_PLATFORM_URL}/subscriptions/${userId}`, {
    headers: { 'X-API-Key': process.env.SUBSCRIPTION_API_KEY },
  })

  if (response.status === 404) {
    return res.status(403).json({
      error: 'Active subscription required',
      upgradeUrl: '/pricing',
    })
  }

  if (!response.ok) {
    return res.status(500).json({
      error: 'Failed to verify subscription',
    })
  }

  req.subscription = await response.json()
  next()
}

// Use it:
app.post('/properties', requireSubscription, createProperty)
```

### Pattern 2: Plan-Based Limits

Enforce limits based on the user's plan:

```javascript
async function checkPropertyLimit(userId) {
  // Get user's subscription
  const subResponse = await fetch(`${API_URL}/subscriptions/${userId}`, {
    headers: { 'X-API-Key': API_KEY },
  })

  if (!subResponse.ok) {
    throw new Error('No active subscription')
  }

  const subscription = await subResponse.json()

  // Get all plans
  const plansResponse = await fetch(`${API_URL}/plans`, {
    headers: { 'X-API-Key': API_KEY },
  })

  const plans = await plansResponse.json()
  const userPlan = plans.find((p) => p.id === subscription.planId)

  // Check current usage
  const currentCount = await countUserProperties(userId)

  if (currentCount >= userPlan.maxProperties) {
    throw new Error(`Limit reached: ${userPlan.maxProperties} properties on ${userPlan.name} plan`)
  }

  return true
}
```

### Pattern 3: Caching (Recommended)

Cache subscription data to reduce API calls:

```javascript
import { LRU Cache } from 'lru-cache';

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5 // 5 minutes
});

async function getSubscriptionCached(userId) {
  const cached = cache.get(userId);
  if (cached) return cached;

  const response = await fetch(
    `${API_URL}/subscriptions/${userId}`,
    { headers: { 'X-API-Key': API_KEY } }
  );

  if (!response.ok) return null;

  const subscription = await response.json();
  cache.set(userId, subscription);
  return subscription;
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning      | Recommended Action              |
| ---- | ------------ | ------------------------------- |
| 200  | Success      | Process response                |
| 201  | Created      | Subscription request created    |
| 400  | Bad Request  | Validate input parameters       |
| 401  | Unauthorized | Check API key                   |
| 404  | Not Found    | User has no active subscription |
| 409  | Conflict     | Duplicate subscription attempt  |
| 429  | Rate Limited | Implement backoff               |
| 500  | Server Error | Retry with backoff              |

### Retry Strategy

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)

      // Don't retry client errors (4xx except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response
      }

      // Retry on server errors or rate limit
      if (response.ok) return response

      // Exponential backoff
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000))
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000))
    }
  }
}
```

---

## Complete Example (Node.js + Express)

```javascript
// config/subscription.js
export const subscriptionConfig = {
  url: process.env.SUBSCRIPTION_PLATFORM_URL,
  apiKey: process.env.SUBSCRIPTION_API_KEY,
}

// services/subscription.js
import { subscriptionConfig } from '../config/subscription.js'

export const subscriptionService = {
  async getPlans() {
    const response = await fetch(`${subscriptionConfig.url}/plans`, {
      headers: { 'X-API-Key': subscriptionConfig.apiKey },
    })
    return response.json()
  },

  async checkSubscription(userId) {
    const response = await fetch(`${subscriptionConfig.url}/subscriptions/${userId}`, {
      headers: { 'X-API-Key': subscriptionConfig.apiKey },
    })

    if (response.status === 404) return null
    if (!response.ok) throw new Error('Failed to check subscription')

    return response.json()
  },

  async requestUpgrade(userId, planId, paymentProof) {
    const response = await fetch(`${subscriptionConfig.url}/subscriptions/${userId}/upgrade`, {
      method: 'POST',
      headers: {
        'X-API-Key': subscriptionConfig.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: 'your-product-id',
        planId,
        paymentProofUrl: paymentProof.url,
        paymentNote: paymentProof.note,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }

    return response.json()
  },
}

// routes/properties.js
import { subscriptionService } from '../services/subscription.js'

export async function createProperty(req, res) {
  // Check subscription
  const subscription = await subscriptionService.checkSubscription(req.user.id)

  if (!subscription) {
    return res.status(403).json({
      error: 'Active subscription required',
      message: 'Please subscribe to create properties',
    })
  }

  // Check limits
  const plans = await subscriptionService.getPlans()
  const userPlan = plans.find((p) => p.id === subscription.planId)
  const count = await countUserProperties(req.user.id)

  if (count >= userPlan.maxProperties) {
    return res.status(403).json({
      error: 'Property limit reached',
      message: `Your ${userPlan.name} plan allows ${userPlan.maxProperties} properties`,
      upgradeUrl: '/pricing',
    })
  }

  // Create property...
  const property = await db.properties.create({
    userId: req.user.id,
    ...req.body,
  })

  res.json(property)
}
```

---

## React/Frontend Example

```typescript
// hooks/useSubscription.ts
import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_SUBSCRIPTION_PLATFORM_URL;
const API_KEY = import.meta.env.VITE_SUBSCRIPTION_API_KEY;

export function useSubscription(userId: string) {
  return useQuery({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/subscriptions/${userId}`,
        { headers: { 'X-API-Key': API_KEY } }
      );

      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch subscription');

      return response.json();
    },
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });
}

// components/FeatureGuard.tsx
export function FeatureGuard({ userId, children }) {
  const { data: subscription, isLoading } = useSubscription(userId);

  if (isLoading) return <LoadingSpinner />;

  if (!subscription) {
    return (
      <UpgradePrompt>
        <h3>Subscription Required</h3>
        <p>Please subscribe to access this feature</p>
        <Link to="/pricing">View Plans</Link>
      </UpgradePrompt>
    );
  }

  return <>{children}</>;
}

// Usage
<FeatureGuard userId={user.id}>
  <PropertyDashboard />
</FeatureGuard>
```

---

## Best Practices

### ✅ DO

- **Cache subscription checks** (5 min cache recommended)
- **Implement exponential backoff** for retries
- **Store API keys in env variables**
- **Validate before expensive operations**
- **Show clear upgrade prompts** when limits hit
- **Log API errors** for debugging

### ❌ DON'T

- **Don't hardcode API keys** in source code
- **Don't skip subscription validation** on sensitive features
- **Don't call API on every request** (use caching!)
- **Don't ignore rate limits** (429 responses)
- **Don't expose API key** client-side

---

## Testing

### Local Development

```bash
# Start the subscription platform locally
cd subscription-platform
npm run dev

# In your app
SUBSCRIPTION_PLATFORM_URL=http://localhost:8788
SUBSCRIPTION_API_KEY=your-test-api-key
```

### Integration Tests

```javascript
// __tests__/subscription.test.js
describe('Subscription Integration', () => {
  it('should deny access without subscription', async () => {
    const response = await request(app)
      .post('/properties')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test Property' })

    expect(response.status).toBe(403)
    expect(response.body.error).toMatch(/subscription required/i)
  })

  it('should enforce plan limits', async () => {
    // User on Starter plan (5 properties max)
    await createPropertiesForUser(userId, 5)

    const response = await request(app)
      .post('/properties')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: '6th Property' })

    expect(response.status).toBe(403)
    expect(response.body.error).toMatch(/limit reached/i)
  })
})
```

---

## Support & Resources

- **Swagger UI**: Visit `{API_URL}/ui` for interactive docs
- **OpenAPI Spec**: Available at `{API_URL}/doc`
- **Platform Admin**: Contact for API key issues
- **Status Page**: Check service uptime

---

## Changelog

### v1.0.0 (2025-01-23)

- Initial product integration guide
- GET /plans endpoint
- GET /subscriptions/:userId endpoint
- POST /subscriptions/:userId/upgrade endpoint

---

**Last Updated**: 2025-01-23  
**Maintained By**: Platform Team
