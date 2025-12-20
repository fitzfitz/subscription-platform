# API Endpoints

Complete API reference for the subscription platform.

## Base URL

```
Production: https://subscriptions.yourdomain.com
Development: http://localhost:8788
```

## Authentication

All requests require an API key in the header:

```http
X-API-Key: your_product_api_key_here
```

The API key identifies which product is making the request and ensures data isolation.

---

## Endpoints

### 1. Get User Subscription

Retrieve the current subscription for a user within your product.

**Endpoint**: `GET /subscriptions/:userId`

**Request**:
```http
GET /subscriptions/user_2abc123def
X-API-Key: al_prod_key_123456
```

**Response** (200 OK):
```json
{
  "id": "sub_xyz789",
  "userId": "user_2abc123def",
  "planId": "plan-002",
  "productId": "auto-landlord",
  "status": "active",
  "provider": "MANUAL",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": null,
  "plan": {
    "id": "plan-002",
    "name": "Pro",
    "slug": "auto-landlord-pro",
    "price": 2900,
    "features": "Unlimited properties,Advanced reporting,Priority support",
    "maxProperties": 999999
  }
}
```

**Response** (404 Not Found):
```json
{
  "error": "No active subscription found",
  "message": "User has no subscription for this product"
}
```

**Use Case**: Called after user logs in to determine their feature access.

---

### 2. List Available Plans

Get all active pricing plans for your product.

**Endpoint**: `GET /plans`

**Request**:
```http
GET /plans
X-API-Key: al_prod_key_123456
```

**Response** (200 OK):
```json
[
  {
    "id": "plan-001",
    "productId": "auto-landlord",
    "name": "Starter",
    "slug": "auto-landlord-starter",
    "price": 0,
    "features": "Up to 2 properties,Basic tenant management,Email support",
    "maxProperties": 2,
    "isActive": true
  },
  {
    "id": "plan-002",
    "productId": "auto-landlord",
    "name": "Pro",
    "slug": "auto-landlord-pro",
    "price": 2900,
    "features": "Unlimited properties,Advanced reporting,Priority support",
    "maxProperties": 999999,
    "isActive": true
  }
]
```

**Use Case**: Display pricing page, allow users to compare plans.

---

### 3. Request Upgrade (Manual Payment)

Submit a subscription upgrade with proof of payment.

**Endpoint**: `POST /subscriptions/:userId/upgrade`

**Request**:
```http
POST /subscriptions/user_2abc123def/upgrade
X-API-Key: al_prod_key_123456
Content-Type: application/json

{
  "planSlug": "auto-landlord-pro",
  "paymentProofUrl": "/upload/r2/proof-abc123.jpg",
  "paymentNote": "Bank transfer reference: TRX20240115ABC"
}
```

**Response** (200 OK):
```json
{
  "id": "sub_xyz789",
  "userId": "user_2abc123def",
  "planId": "plan-002",
  "productId": "auto-landlord",
  "status": "pending_verification",
  "paymentProofUrl": "/upload/r2/proof-abc123.jpg",
  "paymentNote": "Bank transfer reference: TRX20240115ABC",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Response** (400 Bad Request):
```json
{
  "error": "Invalid plan",
  "message": "Plan 'invalid-slug' not found"
}
```

**Flow**:
1. User uploads receipt via `/upload` endpoint
2. Frontend calls this endpoint with the receipt URL
3. Subscription status set to `pending_verification`
4. Admin reviews and approves/rejects

---

### 4. Admin: List Pending Verifications

Get all subscriptions awaiting approval (admin only).

**Endpoint**: `GET /admin/pending`

**Request**:
```http
GET /admin/pending
X-API-Key: admin_master_key_789
```

**Response** (200 OK):
```json
[
  {
    "id": "sub_xyz789",
    "userId": "user_2abc123def",
    "status": "pending_verification",
    "paymentProofUrl": "/upload/r2/proof-abc123.jpg",
    "paymentNote": "Bank transfer reference: TRX20240115ABC",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "plan": {
      "name": "Pro",
      "price": 2900
    },
    "user": {
      "email": "john@example.com",
      "name": "John Doe"
    },
    "product": {
      "name": "Auto-Landlord"
    }
  }
]
```

**Authentication**: Requires special admin API key with elevated permissions.

---

### 5. Admin: Verify Subscription

Approve or reject a pending subscription.

**Endpoint**: `POST /admin/verify`

**Request** (Approve):
```http
POST /admin/verify
X-API-Key: admin_master_key_789
Content-Type: application/json

{
  "subscriptionId": "sub_xyz789",
  "approve": true
}
```

**Request** (Reject):
```http
POST /admin/verify
X-API-Key: admin_master_key_789
Content-Type: application/json

{
  "subscriptionId": "sub_xyz789",
  "approve": false
}
```

**Response** (200 OK):
```json
{
  "id": "sub_xyz789",
  "status": "active",
  "startDate": "2024-01-15T11:00:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Effect**:
- **Approve**: Status → `active`, `startDate` set to now
- **Reject**: Status → `canceled`, user notified

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

**Cause**: Missing `X-API-Key` header or invalid key.

---

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Product is not active"
}
```

**Cause**: Product's `isActive` flag set to false.

---

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 100 requests per minute per product"
}
```

**Cause**: Exceeded rate limit threshold.

---

## Rate Limits

Per product API key:
- **Standard Endpoints**: 100 requests/minute
- **Admin Endpoints**: 1000 requests/minute

Limits reset every 60 seconds.

---

## Example Integration

### Frontend (React)

```typescript
// After Clerk authentication
const { userId } = useAuth();

const fetchSubscription = async () => {
  const response = await fetch(
    `https://subscriptions.yourdomain.com/subscriptions/${userId}`,
    {
      headers: {
        'X-API-Key': import.meta.env.VITE_SUBSCRIPTION_API_KEY,
      },
    }
  );
  
  if (!response.ok) {
    // User has no subscription, show free plan
    return null;
  }
  
  return response.json();
};
```

### Backend (Hono)

```typescript
// Feature gating middleware
const requirePro = async (c, next) => {
  const userId = c.get('userId');
  
  const response = await fetch(
    `https://subscriptions.yourdomain.com/subscriptions/${userId}`,
    {
      headers: {
        'X-API-Key': process.env.SUBSCRIPTION_API_KEY,
      },
    }
  );
  
  const subscription = await response.json();
  
  if (subscription.plan.slug !== 'auto-landlord-pro') {
    throw new HTTPException(403, { 
      message: 'Pro plan required' 
    });
  }
  
  await next();
};
```

---

## Webhooks (Future)

For automated payment processors like Stripe:

**Endpoint**: `POST /webhooks/:provider`

Example: `POST /webhooks/stripe`

This will handle:
- Payment success → auto-approve subscription
- Payment failure → mark as `past_due`
- Subscription cancellation

See [03_features.md](./03_features.md#webhook-integration) for details.
