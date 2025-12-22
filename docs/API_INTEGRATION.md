# Subscription Platform - Product Integration Guide

Welcome! This guide will help you integrate your product application with the Subscription Platform.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Integration Patterns](#integration-patterns)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)

---

## Quick Start

### Step 1: Get Your API Key

Contact your platform administrator to:

1. Create a product for your application
2. Receive your unique API key (format: `{product-id}_prod_{uuid}`)

> [!CAUTION]
> **Save your API key securely!** It's only shown once during product creation.

### Step 2: Store API Key Securely

```bash
# .env
SUBSCRIPTION_PLATFORM_API_KEY=your-product-api-key
SUBSCRIPTION_PLATFORM_URL=https://api.subscription-platform.com
```

### Step 3: Make Your First API Call

```javascript
const response = await fetch(`${SUBSCRIPTION_PLATFORM_URL}/plans`, {
  headers: {
    'X-API-Key': process.env.SUBSCRIPTION_PLATFORM_API_KEY,
  },
})

const plans = await response.json()
console.log('Available plans:', plans)
```

---

## Authentication

All API requests require authentication using your product's API key.

### Header Format

```
X-API-Key: {your-product-api-key}
```

### Example

```bash
curl -H "X-API-Key: auto-landlord_prod_abc123xyz" \
     https://api.subscription-platform.com/plans
```

---

## API Endpoints

### Base URL

```
https://api.subscription-platform.com
```

or for local development:

```
http://localhost:8788
```

---

### 1. List Available Plans

Get all active subscription plans for your product.

**Endpoint**: `GET /plans`

**Authentication**: API Key required

**Response** (200 OK):

```json
[
  {
    "id": "plan_abc123",
    "productId": "auto-landlord",
    "name": "Starter",
    "slug": "auto-landlord-starter",
    "price": 1900,
    "features": "Up to 5 properties, Basic support, Monthly reports",
    "maxProperties": 5,
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z"
  },
  {
    "id": "plan_def456",
    "productId": "auto-landlord",
    "name": "Pro",
    "slug": "auto-landlord-pro",
    "price": 4900,
    "features": "Up to 20 properties, Priority support, Advanced analytics",
    "maxProperties": 20,
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z"
  }
]
```

**Use Case**: Display pricing page to users

---

### 2. Get User Subscription

Check if a user has an active subscription for your product.

**Endpoint**: `GET /subscriptions/{userId}`

**Authentication**: API Key required

**Parameters**:

- `userId` (path) - The user's ID (from your authentication system, e.g., Clerk UserID)

**Response** (200 OK):

```json
{
  "id": "sub_xyz789",
  "status": "active",
  "planId": "plan_def456",
  "plan": {
    "name": "Pro",
    "features": "Up to 20 properties, Priority support, Advanced analytics"
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

---

### 3. Request Subscription Upgrade

Allow users to upgrade their plan (requires admin approval for payment verification).

**Endpoint**: `POST /subscriptions/{userId}/upgrade`

**Authentication**: API Key required

**Parameters**:

- `userId` (path) - The user's ID

**Request Body**:

```json
{
  "productId": "auto-landlord",
  "planId": "plan_ghi789",
  "paymentProofUrl": "https://storage.example.com/receipts/user123.jpg",
  "paymentNote": "Paid via bank transfer, reference: TRX123456"
}
```

**Response** (201 Created):

```json
{
  "id": "sub_new123",
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

### Pattern 1: Feature Gating (Recommended)

Verify subscription before allowing access to features:

```javascript
// middleware/subscription-check.js
async function requireActiveSubscription(req, res, next) {
  const userId = req.user.id // From your auth system

  const response = await fetch(`${process.env.SUBSCRIPTION_PLATFORM_URL}/subscriptions/${userId}`, {
    headers: {
      'X-API-Key': process.env.SUBSCRIPTION_PLATFORM_API_KEY,
    },
  })

  if (response.status === 404) {
    return res.status(403).json({
      error: 'Active subscription required',
      upgradeUrl: '/pricing',
    })
  }

  const subscription = await response.json()
  req.subscription = subscription
  next()
}

// usage
app.post('/properties', requireActiveSubscription, createProperty)
```

### Pattern 2: Plan-Based Limits

Enforce limits based on user's plan:

```javascript
async function checkPropertyLimit(userId) {
  const response = await fetch(`${process.env.SUBSCRIPTION_PLATFORM_URL}/subscriptions/${userId}`, {
    headers: {
      'X-API-Key': process.env.SUBSCRIPTION_PLATFORM_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error('No active subscription')
  }

  const subscription = await response.json()
  const planResponse = await fetch(`${process.env.SUBSCRIPTION_PLATFORM_URL}/plans`, {
    headers: {
      'X-API-Key': process.env.SUBSCRIPTION_PLATFORM_API_KEY,
    },
  })

  const plans = await planResponse.json()
  const userPlan = plans.find((p) => p.id === subscription.planId)

  const currentCount = await countUserProperties(userId)

  if (currentCount >= userPlan.maxProperties) {
    throw new Error(`Property limit reached (${userPlan.maxProperties}). Upgrade your plan.`)
  }

  return true
}
```

### Pattern 3: Caching (For Better Performance)

Cache subscription data to reduce API calls:

```javascript
import { LRUCache } from 'lru-cache'

const subscriptionCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
})

async function getSubscriptionCached(userId) {
  const cached = subscriptionCache.get(userId)
  if (cached) return cached

  const response = await fetch(`${process.env.SUBSCRIPTION_PLATFORM_URL}/subscriptions/${userId}`, {
    headers: {
      'X-API-Key': process.env.SUBSCRIPTION_PLATFORM_API_KEY,
    },
  })

  if (!response.ok) return null

  const subscription = await response.json()
  subscriptionCache.set(userId, subscription)

  return subscription
}
```

---

## Error Handling

### Status Codes

| Code | Meaning      | Action                               |
| ---- | ------------ | ------------------------------------ |
| 200  | Success      | Process response data                |
| 201  | Created      | Subscription/upgrade request created |
| 400  | Bad Request  | Check request format and parameters  |
| 401  | Unauthorized | Verify API key is correct            |
| 404  | Not Found    | User has no active subscription      |
| 409  | Conflict     | Duplicate subscription exists        |
| 429  | Rate Limited | Implement exponential backoff        |
| 500  | Server Error | Retry with exponential backoff       |

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "hint": "Suggestion on how to fix (optional)"
}
```

### Retry Strategy

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)

      if (response.ok) return response

      if (response.status === 429 || response.status >= 500) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
        continue
      }

      return response // Don't retry client errors
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
}
```

---

## Code Examples

### Complete Integration Example (Node.js Express)

```javascript
// config/subscription.js
export const subscriptionClient = {
  baseUrl: process.env.SUBSCRIPTION_PLATFORM_URL,
  apiKey: process.env.SUBSCRIPTION_PLATFORM_API_KEY,

  async getPlans() {
    const response = await fetch(`${this.baseUrl}/plans`, {
      headers: { 'X-API-Key': this.apiKey },
    })
    return response.json()
  },

  async getSubscription(userId) {
    const response = await fetch(`${this.baseUrl}/subscriptions/${userId}`, {
      headers: { 'X-API-Key': this.apiKey },
    })

    if (response.status === 404) return null
    if (!response.ok) throw new Error('Failed to fetch subscription')

    return response.json()
  },

  async requestUpgrade(userId, planId, paymentProof) {
    const response = await fetch(`${this.baseUrl}/subscriptions/${userId}/upgrade`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: 'auto-landlord',
        planId,
        paymentProofUrl: paymentProof.url,
        paymentNote: paymentProof.note,
      }),
    })

    return response.json()
  },
}

// routes/properties.js
import { subscriptionClient } from '../config/subscription.js'

export async function createProperty(req, res) {
  const userId = req.user.id

  // Check subscription
  const subscription = await subscriptionClient.getSubscription(userId)

  if (!subscription) {
    return res.status(403).json({
      error: 'Active subscription required',
      message: 'Please subscribe to create properties',
    })
  }

  // Check limits
  const plans = await subscriptionClient.getPlans()
  const userPlan = plans.find((p) => p.id === subscription.planId)
  const currentCount = await countUserProperties(userId)

  if (currentCount >= userPlan.maxProperties) {
    return res.status(403).json({
      error: 'Property limit reached',
      message: `Your ${userPlan.name} plan allows up to ${userPlan.maxProperties} properties`,
      upgradeUrl: '/pricing',
    })
  }

  // Create property...
  const property = await db.properties.create({
    userId,
    ...req.body,
  })

  res.json(property)
}
```

### React Frontend Example

```typescript
// hooks/useSubscription.ts
import { useQuery } from '@tanstack/react-query';

export function useSubscription(userId: string) {
  return useQuery({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUBSCRIPTION_PLATFORM_URL}/subscriptions/${userId}`,
        {
          headers: {
            'X-API-Key': import.meta.env.VITE_SUBSCRIPTION_PLATFORM_API_KEY
          }
        }
      );

      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch subscription');

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// components/FeatureGuard.tsx
export function FeatureGuard({ children, userId }) {
  const { data: subscription, isLoading } = useSubscription(userId);

  if (isLoading) return <LoadingSpinner />;

  if (!subscription) {
    return (
      <div className="upgrade-prompt">
        <h3>Subscription Required</h3>
        <p>Please subscribe to access this feature</p>
        <Link to="/pricing">View Plans</Link>
      </div>
    );
  }

  return <>{children}</>;
}
```

---

## Best Practices

### ✅ DO

- **Cache subscription data** to reduce API calls
- **Implement exponential backoff** for retries
- **Store API key in environment variables**
- **Validate user subscription** before expensive operations
- **Show upgrade prompts** when limits are reached
- **Log API errors** for debugging

### ❌ DON'T

- **Don't hardcode API keys** in source code
- **Don't skip subscription checks** on sensitive features
- **Don't make API calls** on every request (use caching)
- **Don't ignore rate limits** (implement backoff)
- **Don't expose subscription endpoints** publicly

---

## Support

For questions or issues:

- **Documentation**: [https://docs.subscription-platform.com](https://docs.subscription-platform.com)
- **API Status**: [https://status.subscription-platform.com](https://status.subscription-platform.com)
- **Support Email**: support@subscription-platform.com
- **Swagger UI**: `{API_URL}/ui`

---

## Changelog

### v1.0.0 (2025-01-15)

- Initial release
- GET /plans endpoint
- GET /subscriptions/:userId endpoint
- POST /subscriptions/:userId/upgrade endpoint
- API key authentication
