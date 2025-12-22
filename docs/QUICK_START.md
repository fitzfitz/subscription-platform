# Quick Start Guide - Product Integration

Get your product integrated with the Subscription Platform in 5 minutes.

## Prerequisites

- Product created by platform admin
- API key received
- User authentication system (e.g., Clerk, Auth0)

## Step 1: Install (Optional)

Create a simple SDK or use fetch directly:

```bash
npm install node-fetch  # if using Node.js
```

## Step 2: Configure

```javascript
// config.js
export const SUBSCRIPTION_API = {
  url: process.env.SUBSCRIPTION_PLATFORM_URL || 'http://localhost:8788',
  apiKey: process.env.SUBSCRIPTION_API_KEY,
}
```

## Step 3: Create API Client

```javascript
// subscription-client.js
import { SUBSCRIPTION_API } from './config.js'

export async function checkSubscription(userId) {
  const response = await fetch(`${SUBSCRIPTION_API.url}/subscriptions/${userId}`, {
    headers: { 'X-API-Key': SUBSCRIPTION_API.apiKey },
  })

  if (response.status === 404) return null
  return response.json()
}

export async function getPlans() {
  const response = await fetch(`${SUBSCRIPTION_API.url}/plans`, {
    headers: { 'X-API-Key': SUBSCRIPTION_API.apiKey },
  })
  return response.json()
}
```

## Step 4: Protect Your Routes

```javascript
// middleware.js
import { checkSubscription } from './subscription-client.js'

export async function requireSubscription(req, res, next) {
  const subscription = await checkSubscription(req.user.id)

  if (!subscription) {
    return res.status(403).json({
      error: 'Subscription required',
      upgradeUrl: '/pricing',
    })
  }

  req.subscription = subscription
  next()
}

// app.js
import { requireSubscription } from './middleware.js'

app.post('/api/properties', requireSubscription, createProperty)
app.get('/api/analytics', requireSubscription, getAnalytics)
```

## Step 5: Display Pricing

```javascript
// pages/pricing.js
import { getPlans } from './subscription-client.js'

export async function PricingPage() {
  const plans = await getPlans()

  return (
    <div>
      <h1>Choose Your Plan</h1>
      {plans.map((plan) => (
        <div key={plan.id}>
          <h3>{plan.name}</h3>
          <p>${(plan.price / 100).toFixed(2)}/month</p>
          <p>{plan.features}</p>
          <button onClick={() => handleSubscribe(plan.id)}>Subscribe</button>
        </div>
      ))}
    </div>
  )
}
```

## Done! 🎉

Your product is now integrated with the subscription platform.

### Next Steps

- Read full [API Integration Guide](./API_INTEGRATION.md)
- Implement [plan-based limits](./API_INTEGRATION.md#pattern-2-plan-based-limits)
- Add [caching](./API_INTEGRATION.md#pattern-3-caching-for-better-performance) for better performance

### Common Issues

**401 Unauthorized**

- Check your API key is correct
- Ensure `X-API-Key` header is set

**404 Not Found**

- User doesn't have a subscription
- Show upgrade prompt to user

**Rate Limited (429)**

- Implement caching
- Add exponential backoff
