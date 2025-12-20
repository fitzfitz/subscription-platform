# Subscription Platform Documentation

Comprehensive guide for building a centralized subscription service to power multiple SaaS products.

## 📚 Documentation Index

Read these documents in order for best understanding:

### 1. [Overview](./00_overview.md)
**Start here** - Understand the big picture, architecture, and design principles.

**Topics**:
- Purpose and goals
- High-level architecture diagrams
- Technology stack
- Request flow
- Core entities

---

### 2. [Database Schema](./01_database_schema.md)
Deep dive into data models and relationships.

**Topics**:
- Entity relationship diagram
- Table definitions (products, plans, users, subscriptions)
- Indexes for performance
- Key relationships
- Migration strategy

---

### 3. [API Endpoints](./02_api_endpoints.md)
Complete API reference with examples.

**Topics**:
- Authentication with API keys
- User subscription endpoints
- Manual payment upgrade flow
- Admin verification endpoints
- Error responses and rate limits
- Integration examples

---

### 4. [Features](./03_features.md)
Feature breakdown and implementation approach.

**Topics**:
- Multi-product support
- Manual payment verification
- Feature gating
- API key management
- Rate limiting
- Future features (Stripe, usage metering, analytics)

---

### 5. [Security Model](./04_security.md)
Security architecture and best practices.

**Topics**:
- Threat model
- Defense layers (TLS, API keys, input validation)
- SQL injection prevention
- File upload security
- Admin access control
- Incident response procedures
- Compliance (GDPR, PCI DSS)

---

### 6. [Deployment Guide](./05_deployment.md)
Step-by-step deployment and maintenance.

**Topics**:
- Prerequisites and project setup
- Database configuration
- API key generation
- Local development
- Production deployment to Cloudflare
- Auto-Landlord integration
- Monitoring and troubleshooting
- Cost estimates

---

## 🚀 Quick Start

### For Product Managers
1. Read [Overview](./00_overview.md) to understand the vision
2. Review [Features](./03_features.md) for roadmap planning
3. Check [Deployment Guide](./05_deployment.md) for cost estimates

### For Developers
1. Read [Overview](./00_overview.md) for architecture
2. Study [Database Schema](./01_database_schema.md) for data models
3. Review [API Endpoints](./02_api_endpoints.md) for integration
4. Follow [Deployment Guide](./05_deployment.md) for setup

### For Security Engineers
1. Read [Security Model](./04_security.md) first
2. Review [API Endpoints](./02_api_endpoints.md) for authentication
3. Check [Deployment Guide](./05_deployment.md) for secure deployment

---

## 🎯 Key Decisions Needed

Before implementation, decide on:

1. **Billing Model**: Per-product vs. cross-product subscriptions
2. **Admin UI Location**: Separate app or integrate with Auto-Landlord?
3. **Payment Providers**: Manual only, or also Stripe/PayPal?
4. **Currency Support**: USD only or multi-currency from day 1?

See [Overview](./00_overview.md#user-review-required) for detailed discussion.

---

## 🏗️ Architecture at a Glance

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Auto-Landlord  │     │   Product B     │     │   Product C     │
│  (React + Vite) │     │  (Next.js)      │     │   (Vue)         │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │        API Key + Clerk UserID                 │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Subscription Platform  │
                    │  (Cloudflare Worker)    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  D1 Database (SQLite)   │
                    │  - Products             │
                    │  - Plans                │
                    │  - Subscriptions        │
                    │  - Users                │
                    └─────────────────────────┘
```

---

## 📊 Implementation Phases

### ✅ Phase 1: MVP (Current)
- [x] Manual payment verification
- [x] Basic feature gating
- [x] Single product support (Auto-Landlord)

### 🚧 Phase 2: Multi-Product
- [ ] Products table and API key system
- [ ] Product-scoped subscriptions
- [ ] Rate limiting per product
- [ ] Admin dashboard integration

### 📅 Phase 3: Automation
- [ ] Stripe webhook integration
- [ ] Automated approval flow
- [ ] Email notifications
- [ ] Analytics dashboard

### 🔮 Phase 4: Advanced
- [ ] Usage-based billing
- [ ] Multi-currency support
- [ ] Team/organization accounts
- [ ] Customer self-service portal

---

## 🤝 Contributing

When updating this documentation:

1. **Keep it current**: Update diagrams when architecture changes
2. **Be specific**: Include code examples, not just concepts
3. **Think audience**: Consider both technical and non-technical readers
4. **Version control**: Note breaking changes prominently

---

## 📞 Support

- **Technical Questions**: Check [04_security.md](./04_security.md) and [05_deployment.md](./05_deployment.md)
- **Implementation Help**: Review [02_api_endpoints.md](./02_api_endpoints.md) for integration guide
- **Architecture Decisions**: See [00_overview.md](./00_overview.md) and [03_features.md](./03_features.md)

---

## 📝 License

Internal documentation for Auto-Landlord subscription platform.

---

**Last Updated**: 2024-01-20  
**Version**: 1.0.0  
**Maintainer**: Development Team
