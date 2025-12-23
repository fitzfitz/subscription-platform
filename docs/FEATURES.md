# Features Documentation

**Platform Version:** 1.0  
**Last Updated:** 2025-12-23

---

## 📋 Overview

The Subscription Platform is a multi-product SaaS subscription management system that allows you to manage multiple products, plans, users, and subscriptions from a single admin panel while providing APIs for product applications to verify user subscriptions.

---

## ✅ Implemented Features

### 1. Multi-Product Support

**Description:** Manage multiple products from one platform, each with its own plans, users, and subscriptions.

**Capabilities:**

- Create unlimited products
- Generate unique API keys per product
- Isolate users and subscriptions per product
- Product activation/deactivation
- API key regeneration

**Use Case:**
You can manage "Auto-Landlord", "Hotel Manager", and "Inventory System" all from one admin panel, each with separate API keys and plan configurations.

**Admin Panel:**

- Products page: `/admin/products`
- Create/edit/delete products
- View product statistics

**API:**

- Products are identified by API key
- Each API call is scoped to the product

---

### 2. Flexible Plan Management

**Description:** Create and manage subscription plans with custom pricing and features.

**Capabilities:**

- Unlimited plans per product
- Custom pricing (in Indonesian Rupiah)
- Feature lists (text-based)
- Property limits (maxProperties field)
- Plan activation/deactivation
- Plan slugs for easy identification

**Plan Structure:**

```json
{
  "id": "plan_pro",
  "name": "Pro Plan",
  "slug": "pro",
  "price": 250000,
  "features": "50 properties, Priority support, Analytics",
  "limits": {
    "properties": 50,
    "tenants": 200,
    "analytics": true,
    "priority_support": true
  },
  "isActive": true
}
```

**Flexible Limits**:

The `limits` field is a JSON object that can contain any product-specific limits:

- **Property Management**: `{"properties": 50, "tenants": 200, "storage_gb": 10}`
- **Project Management**: `{"projects": 10, "team_members": 5, "tasks_per_project": 1000}`
- **Email Marketing**: `{"contacts": 5000, "emails_per_month": 10000, "campaigns": 3}`

**Admin Panel:**

- Plans management in product detail page
- Create/edit/delete plans
- View plan subscriptions

**API:**

- `GET /plans` - List all active plans

---

### 3. Multi-Provider Payment Architecture

**Description:** Flexible payment system supporting multiple payment providers per product.

**Payment Method Types:**

- **Manual:** Bank transfer, QRIS, Cash
- **Automated:** Stripe, Midtrans, Xendit (ready for integration)

**Capabilities:**

- Create payment methods with custom configurations
- Enable/disable payment methods globally
- Configure which payment methods each product accepts
- Set display order for payment methods
- Mark default payment method per product
- Store payment-specific config (JSON)

**Payment Methods:**

```json
{
  "id": "pm_001",
  "slug": "manual_bank",
  "name": "Bank Transfer BCA",
  "type": "manual",
  "provider": null,
  "config": "{\"bankName\":\"BCA\",\"accountNumber\":\"1234567890\"}",
  "isActive": true
}
```

**Admin Panel:**

- Payment Methods page: `/admin/payment-methods`
- CRUD operations on payment methods
- Product payment configuration

**API:**

- `GET /{productId}/payment-methods` - Get available methods for a product

---

### 4. Manual Payment Verification

**Description:** Admin review and approval system for manual payments (bank transfers, QRIS).

**Payment Flow:**

1. User selects plan in product app
2. Product app shows payment instructions
3. User makes payment and uploads proof
4. Product app submits upgrade request
5. Admin reviews and approves/rejects
6. Subscription becomes active or canceled

**Capabilities:**

- View all pending subscriptions
- View payment proof images
- View payment notes
- Approve subscriptions (status → active)
- Reject subscriptions (status → canceled)
- Real-time updates after verification

**Admin Panel:**

- Pending Subscriptions page: `/admin/subscriptions`
- Image viewer for payment proofs
- One-click approve/reject

**API:**

- `POST /subscriptions/{userId}/upgrade` - Submit payment proof
- `GET /admin/pending` - List pending (admin only)
- `POST /admin/verify` - Approve/reject (admin only)

---

### 5. User Management

**Description:** Manage end-users who subscribe to your products.

**Capabilities:**

- View all users across all products
- Filter users by product
- Search users by email
- View user subscriptions
- Edit user details
- See user subscription history

**User Data:**

- Email
- Created/Updated timestamps
- Associated subscriptions
- Product relationships

**Admin Panel:**

- Users page: `/admin/users`
- User detail page with subscription history
- Edit user information

---

### 6. Subscription Management

**Description:** Complete subscription lifecycle management.

**Subscription Statuses:**

- `active` - User has access
- `pending_verification` - Awaiting payment approval
- `canceled` - Subscription canceled
- `expired` - Subscription ended

**Capabilities:**

- View all subscriptions
- Filter by status/product/plan
- Manual subscription creation
- Subscription cancellation
- Plan upgrades/downgrades
- View subscription details
- Track payment methods used

**Admin Panel:**

- Subscription management in user detail
- Subscription management in product detail
- Pending subscriptions page

**API:**

- `GET /subscriptions/{userId}` - Get user subscription
- `POST /subscriptions/{userId}/upgrade` - Create subscription

---

### 7. Admin User Management

**Description:** Role-based admin access control.

**Admin Roles:**

- `SUPER_ADMIN` - Full platform access
- `ADMIN` - Standard admin access

**Capabilities:**

- Create admin users
- Assign roles
- Activate/deactivate admins
- Update admin details
- Password management
- Track last login

**Security:**

- Password hashing (bcrypt)
- Basic Authentication
- Session tracking
- Role-based route protection

**Admin Panel:**

- Admin management (super admin only)
- Password reset
- Role assignment

---

### 8. Dashboard & Analytics

**Description:** Real-time statistics and overview.

**Metrics Displayed:**

- Total products (active)
- Total plans
- Total users
- Active subscriptions count
- Pending subscriptions count

**Quick Actions:**

- Review pending subscriptions
- Create new product
- View recent activity

**Admin Panel:**

- Dashboard: `/admin`
- Real-time data
- Quick action cards

---

### 9. API Key Authentication

**Description:** Secure API access for product applications.

**Features:**

- Unique API keys per product
- Key format: `{productId}_prod_{uuid}`
- API key hashing (bcrypt)
- Rate limiting (100 req/min)
- Key regeneration
- Product isolation via API key

**Security:**

- Keys never stored in plain text
- Automatic product context injection
- Invalid key protection
- Inactive product blocking

---

### 10. Admin Authentication

**Description:** Secure admin panel access.

**Features:**

- Basic Authentication (email:password)
- Password hashing
- Role-based access control
- Session management
- Last login tracking
- Route protection

**Routes Protected:**

- `/admin/*` - Admin-only routes (Basic Auth)
- `/manage/*` - Admin management routes (Basic Auth)

---

## 🔒 Security Features

### Input Validation

- Slug format validation (alphanumeric + underscore)
- JSON config validation
- Email format validation
- Password strength requirements

### Delete Protection

- Checks product usage before deletion
- Checks subscription usage before deletion
- Cascade delete for relationships
- Clear error messages

### Authentication & Authorization

- API Key Auth for product apps
- Basic Auth for admin users
- Role-based access control
- Route-level protection
- Credential hashing

### Rate Limiting

- 100 requests per minute per API key
- Burst protection
- Rate limit headers

---

## 🚀 API Features

### OpenAPI Documentation

- Interactive Swagger UI at `/ui`
- Complete API documentation
- Try-it-out functionality
- Schema definitions
- Authentication examples

### RESTful Design

- Standard HTTP methods
- Proper status codes
- JSON responses
- Error handling
- Pagination ready

### Multi-Product Support

- API key scoping
- Automatic product context
- Isolated data access

---

## 📱 Admin Panel Features

### Modern UI

- React + TypeScript
- TanStack Router
- shadcn/ui components
- Responsive design
- Dark mode ready

### Navigation

- Sidebar navigation
- Breadcrumbs
- Quick actions
- Search functionality

### Data Management

- Tables with sorting
- Filtering
- CRUD operations
- Form validation
- Real-time updates

### User Experience

- Loading states
- Error handling
- Success notifications
- Confirmation dialogs
- Image viewers

---

## 🗄️ Database Features

### SQLite (D1)

- Cloudflare D1 database
- Local development support
- Migration system (Drizzle)
- Type-safe queries

### Tables

- products
- plans
- users
- subscriptions
- admin_users
- payment_methods ✨ (Phase 2)
- product_payment_methods ✨ (Phase 2)

### Relationships

- Foreign keys with cascade delete
- Proper indexing
- Unique constraints
- Relations for easy querying

---

## 🔄 Deployment Features

### CI/CD

- GitHub Actions
- Tag-based production deployment
- Branch-based preview deployment
- Automated migrations
- Health checks

### Environment Support

- Production
- Preview (staging)
- Local development

### Configuration

- Environment variables
- Secrets management
- Domain configuration
- CORS setup

---

## 📊 Current Status

### Phase 1 (MVP) - ✅ Complete

- [x] Multi-product support
- [x] Manual payment verification
- [x] Feature gating
- [x] API key management
- [x] Admin panel
- [x] User management

### Phase 2 (Multi-Provider) - ✅ Complete

- [x] Payment methods architecture
- [x] Product payment configuration
- [x] Payment provider management
- [x] Enhanced security
- [x] Input validation

### Phase 3 (Future)

- [ ] Automated payment gateways (Stripe, Midtrans)
- [ ] Webhook handlers
- [ ] Recurring billing
- [ ] Usage-based billing
- [ ] Email notifications
- [ ] Analytics dashboard

---

## 🎯 Use Cases

### SaaS Product Developer

"I built a property management system and need to monetize it. I use this platform to handle subscriptions while I focus on building features."

**What they do:**

1. Get API key from admin
2. Integrate subscription checks
3. Direct users to payment flow
4. Verify subscription status
5. Gate features based on plan

### Platform Administrator

"I manage multiple SaaS products and need a centralized subscription system."

**What they do:**

1. Create products and plans
2. Configure payment methods
3. Review pending subscriptions
4. Manage users
5. Monitor analytics

### End User

"I want to subscribe to premium features of my favorite app."

**What they do:**

1. Choose plan in product app
2. See payment instructions
3. Make payment
4. Upload proof
5. Wait for approval
6. Get premium access

---

## 📈 Key Metrics

- **Products Managed:** Unlimited
- **Plans per Product:** Unlimited
- **Payment Methods:** Multiple per product
- **API Rate Limit:** 100 req/min
- **Admin Roles:** 2 (Admin, Super Admin)
- **Subscription Statuses:** 4 states
- **Payment Types:** Manual + Automated (ready)

---

## 🛠️ Technology Stack

**Backend:**

- Hono.js (Web framework)
- TypeScript
- Cloudflare Workers
- Drizzle ORM
- Zod (Validation)
- OpenAPI

**Frontend:**

- React 18
- TypeScript
- TanStack Router
- TanStack Query
- shadcn/ui
- Tailwind CSS

**Database:**

- Cloudflare D1 (SQLite)

**Deployment:**

- Cloudflare Workers
- GitHub Actions
- Wrangler CLI

---

## 📚 Related Documentation

- [API Integration Guide](./api_integration_guide.md) - For product developers
- [Admin Guide](./ADMIN_GUIDE.md) - For administrators
- [Database Schema](./01_database_schema.md) - Database structure
- [Security Practices](./04_security.md) - Security guidelines
- [Deployment Guide](./deployment.md) - Deployment instructions
