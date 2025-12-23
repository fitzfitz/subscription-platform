# Subscription Platform API - Integration Guide

**Version:** 1.0  
**Base URL:** `https://subs-api.fitzgeral.my.id`  
**Documentation:** `/ui` (Interactive Swagger UI)

---

## 🔑 Authentication

All API requests require an **API Key** provided in the `X-API-Key` header.

### Getting Your API Key

1. Contact the admin team
2. They will create a product in the admin panel
3. You'll receive an API key in format: `{productId}_prod_{uuid}`

### Example Request

```bash
curl https://subs-api.fitzgeral.my.id/plans \
  -H "X-API-Key: auto-landlord_prod_abc123xyz"
```

> ⚠️ **Security:** Never expose your API key in client-side code. Always call from your backend.

---

## 📚 Available Endpoints

### 1. Get Available Plans

Retrieve all active subscription plans for your product.

**Endpoint:** `GET /plans`

**Headers:**

```
X-API-Key: your_api_key
```

**Response:** `200 OK`

```json
[
  {
    "id": "plan_basic",
    "name": "Basic Plan",
    "slug": "basic",
    "price": 100000,
    "features": "10 properties, Basic support",
    "maxProperties": 10,
    "isActive": true
  },
  {
    "id": "plan_pro",
    "name": "Pro Plan",
    "slug": "pro",
    "price": 250000,
    "features": "50 properties, Priority support, Analytics",
    "maxProperties": 50,
    "isActive": true
  }
]
```

**Example (JavaScript):**

```javascript
async function getPlans() {
  const response = await fetch('https://subs-api.fitzgeral.my.id/plans', {
    headers: {
      'X-API-Key': process.env.SUBSCRIPTION_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch plans')
  }

  return await response.json()
}
```

---

### 2. Get User Subscription

Check if a user has an active subscription.

**Endpoint:** `GET /subscriptions/{userId}`

**Headers:**

```
X-API-Key: your_api_key
```

**Path Parameters:**

- `userId` (string, required) - Your application's user ID

**Response:** `200 OK`

```json
{
  "id": "sub_123",
  "status": "active",
  "planId": "plan_pro",
  "plan": {
    "name": "Pro Plan",
    "features": "50 properties, Priority support, Analytics"
  }
}
```

**Response:** `404 Not Found`

```json
{
  "error": "No active subscription found"
}
```

**Subscription Statuses:**

- `active` - Subscription is active, user has full access
- `pending_verification` - Payment pending admin approval
- `canceled` - Subscription has been canceled
- `expired` - Subscription has expired

**Example (JavaScript):**

```javascript
async function getUserSubscription(userId) {
  const response = await fetch(`https://subs-api.fitzgeral.my.id/subscriptions/${userId}`, {
    headers: {
      'X-API-Key': process.env.SUBSCRIPTION_API_KEY,
    },
  })

  if (response.status === 404) {
    return null // No subscription
  }

  if (!response.ok) {
    throw new Error('Failed to fetch subscription')
  }

  return await response.json()
}
```

---

### 3. Get Available Payment Methods

Retrieve payment methods enabled for your product.

**Endpoint:** `GET /{productId}/payment-methods`

**Headers:**

```
X-API-Key: your_api_key
```

**Path Parameters:**

- `productId` (string, required) - Your product ID (from API key prefix)

**Response:** `200 OK`

```json
[
  {
    "id": "pm_001",
    "slug": "manual_bank",
    "name": "Bank Transfer",
    "type": "manual",
    "isActive": true,
    "config": "{\"bankName\":\"BCA\",\"accountNumber\":\"1234567890\",\"accountName\":\"PT Subscription\"}",
    "displayOrder": 0,
    "isDefault": true
  },
  {
    "id": "pm_002",
    "slug": "manual_qris",
    "name": "QRIS",
    "type": "manual",
    "isActive": true,
    "config": "{\"qrisImage\":\"https://example.com/qris.png\"}",
    "displayOrder": 1,
    "isDefault": false
  }
]
```

**Config Field:** JSON string containing payment-specific details:

- **Bank Transfer:** `bankName`, `accountNumber`, `accountName`
- **QRIS:** `qrisImage` (URL to QR code image)

**Example (JavaScript):**

```javascript
async function getPaymentMethods(productId) {
  const response = await fetch(
    `https://subs-api.fitzgeral.my.id/${productId}/payment-methods`,
    {
      headers: {
        'X-API-Key': process.env.SUBSCRIPTION_API_KEY,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to fetch payment methods')
  }

  const methods = await response.json()

  // Parse config JSON
  return methods.map((method) => ({
    ...method,
    config: JSON.parse(method.config || '{}'),
  }))
}
```

---

### 4. Submit Upgrade Request

Create a subscription for a user (manual payment flow).

**Endpoint:** `POST /subscriptions/{userId}/upgrade`

**Headers:**

```
X-API-Key: your_api_key
Content-Type: application/json
```

**Path Parameters:**

- `userId` (string, required) - Your application's user ID

**Request Body:**

```json
{
  "productId": "auto-landlord",
  "planId": "plan_pro",
  "paymentProofUrl": "https://storage.example.com/proof.jpg",
  "paymentNote": "Transferred from BCA to account 1234567890, Ref: USER123"
}
```

**Fields:**

- `productId` (string, required) - Your product ID
- `planId` (string, required) - Selected plan ID
- `paymentProofUrl` (string, optional) - URL to payment proof image
- `paymentNote` (string, optional) - Additional payment information

**Response:** `201 Created`

```json
{
  "id": "sub_123",
  "status": "pending_verification"
}
```

**Response:** `400 Bad Request`

```json
{
  "error": "Subscription already exists for this user"
}
```

**Example (JavaScript):**

```javascript
async function submitUpgrade(userId, planId, paymentProof) {
  const response = await fetch(
    `https://subs-api.fitzgeral.my.id/subscriptions/${userId}/upgrade`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.SUBSCRIPTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: 'auto-landlord',
        planId: planId,
        paymentProofUrl: paymentProof.url,
        paymentNote: paymentProof.note,
      }),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to submit upgrade')
  }

  return await response.json()
}
```

---

## 🔄 Payment Flow Integration

### Manual Payment Flow (Bank Transfer/QRIS)

**Step 1: Display Available Plans**

```javascript
const plans = await getPlans()
// Show plans to user with pricing
```

**Step 2: Get Payment Methods**

```javascript
const paymentMethods = await getPaymentMethods('auto-landlord')
const defaultMethod = paymentMethods.find((m) => m.isDefault)
```

**Step 3: Show Payment Instructions**

```javascript
// For bank transfer
const config = JSON.parse(defaultMethod.config)
// Display: config.bankName, config.accountNumber, config.accountName

// For QRIS
// Display QR code image from: config.qrisImage
```

**Step 4: User Uploads Payment Proof**

```javascript
// Upload to your storage (e.g., S3, Cloudinary)
const proofUrl = await uploadPaymentProof(file)
```

**Step 5: Submit Upgrade Request**

```javascript
const subscription = await submitUpgrade(userId, planId, {
  url: proofUrl,
  note: 'Payment via BCA mobile banking',
})

// subscription.status === 'pending_verification'
// Show waiting message to user
```

**Step 6: Poll for Approval**

```javascript
// Check every 30 seconds or use webhooks (future feature)
const interval = setInterval(async () => {
  const sub = await getUserSubscription(userId)

  if (sub?.status === 'active') {
    clearInterval(interval)
    // Unlock premium features
    unlockFeatures(sub.plan)
  }

  if (sub?.status === 'canceled') {
    clearInterval(interval)
    // Show rejection message
    showRejectionMessage()
  }
}, 30000)
```

---

## 🚀 Complete Integration Example

### React/Next.js Example

```typescript
// lib/subscription.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL
const API_KEY = process.env.SUBSCRIPTION_API_KEY

interface Plan {
  id: string
  name: string
  price: number
  features: string
}

interface Subscription {
  id: string
  status: 'active' | 'pending_verification' | 'canceled' | 'expired'
  planId: string
  plan?: {
    name: string
    features: string
  }
}

export async function fetchPlans(): Promise<Plan[]> {
  const res = await fetch(`${API_BASE}/plans`, {
    headers: { 'X-API-Key': API_KEY },
  })
  return res.json()
}

export async function fetchSubscription(userId: string): Promise<Subscription | null> {
  const res = await fetch(`${API_BASE}/subscriptions/${userId}`, {
    headers: { 'X-API-Key': API_KEY },
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to fetch subscription')

  return res.json()
}

export async function submitUpgrade(
  userId: string,
  planId: string,
  paymentProofUrl: string,
  paymentNote: string,
) {
  const res = await fetch(`${API_BASE}/subscriptions/${userId}/upgrade`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId: 'auto-landlord',
      planId,
      paymentProofUrl,
      paymentNote,
    }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error)
  }

  return res.json()
}
```

### Usage in Component

```tsx
// pages/subscription.tsx
import { useEffect, useState } from 'react'
import { fetchPlans, fetchSubscription, submitUpgrade } from '@/lib/subscription'

export default function SubscriptionPage({ userId }) {
  const [plans, setPlans] = useState([])
  const [subscription, setSub] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [plansData, subData] = await Promise.all([fetchPlans(), fetchSubscription(userId)])
      setPlans(plansData)
      setSub(subData)
      setLoading(false)
    }
    load()
  }, [userId])

  async function handleUpgrade(planId: string) {
    // 1. Upload payment proof
    const proofUrl = await uploadToStorage(paymentProofFile)

    // 2. Submit upgrade
    const result = await submitUpgrade(userId, planId, proofUrl, 'BCA Transfer')

    // 3. Poll for approval
    const interval = setInterval(async () => {
      const updated = await fetchSubscription(userId)
      if (updated?.status === 'active') {
        clearInterval(interval)
        setSub(updated)
        alert('Subscription activated!')
      }
    }, 30000)
  }

  if (loading) return <div>Loading...</div>

  if (subscription?.status === 'active') {
    return <div>You have {subscription.plan?.name}</div>
  }

  return (
    <div>
      <h1>Choose a Plan</h1>
      {plans.map((plan) => (
        <div key={plan.id}>
          <h2>{plan.name}</h2>
          <p>Rp {plan.price.toLocaleString()}</p>
          <button onClick={() => handleUpgrade(plan.id)}>Subscribe</button>
        </div>
      ))}
    </div>
  )
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Meaning      | Action                        |
| ---- | ------------ | ----------------------------- |
| 200  | Success      | Process response              |
| 201  | Created      | Resource created successfully |
| 400  | Bad Request  | Check request parameters      |
| 401  | Unauthorized | Verify API key                |
| 404  | Not Found    | Resource doesn't exist        |
| 500  | Server Error | Retry or contact support      |

### Common Errors

**Invalid API Key:**

```json
{
  "error": "Invalid API Key"
}
```

→ Check your API key is correct

**Product Not Active:**

```json
{
  "error": "Product not found or inactive"
}
```

→ Contact admin to activate your product

**Subscription Already Exists:**

```json
{
  "error": "Subscription already exists for this user"
}
```

→ User already has a subscription, use GET endpoint to check status

---

## 🔒 Security Best Practices

1. **Never expose API keys client-side**
   - Store in environment variables
   - Call API from your backend only

2. **Validate user IDs**
   - Ensure userId belongs to authenticated user
   - Prevent unauthorized subscription checks

3. **HTTPS Only**
   - Always use HTTPS in production
   - Never send API keys over HTTP

4. **Rate Limiting**
   - Maximum 100 requests per minute per API key
   - Implement exponential backoff for retries

---

## 📊 Rate Limits

- **Global:** 100 requests/minute per API key
- **Burst:** Up to 200 requests in short bursts
- **Headers:** Check `X-RateLimit-*` headers for limits

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## 🆘 Support

**Documentation:** `/ui` (Interactive API explorer)  
**Issues:** Contact your account admin  
**Status Page:** `https://status.subscription-platform.com`

---

## 📝 Changelog

### v1.0 (Current)

- ✅ Plans API
- ✅ Subscriptions API
- ✅ Payment Methods API
- ✅ Manual payment verification
- ✅ Multi-product support

### Coming Soon

- 🔄 Webhook notifications for status changes
- 🔄 Automated payment gateways (Stripe, Midtrans)
- 🔄 Subscription upgrades/downgrades
- 🔄 Usage-based billing
