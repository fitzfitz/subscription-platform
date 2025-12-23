# 🚀 Subscription Platform Monorepo

[![Built with Hono](https://img.shields.io/badge/Built%20with-Hono-E36002?style=flat-square&logo=hono)](https://hono.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

A professional, scalable subscription management platform designed for SaaS products. Built with a modern edge-first stack for high performance and low cost.

---

## 📚 Documentation

- **[Deployment Guide](docs/deployment.md)** - How our GitHub Actions CI/CD pipeline works.
- **[Admin Guide](docs/ADMIN_GUIDE.md)** - How to use the admin dashboard to manage products & users.
- **[Architecture Overview](docs/ARCHITECTURE.md)** - Deep dive into the tech stack and design decisions.
- **[API Integration](docs/API_INTEGRATION.md)** - Guide for integrating your products with this platform.

---

## ⚡ Quick Start

### Prerequisites

- Node.js v20+
- pnpm v9+
- Cloudflare Account

### 1. Setup

```bash
git clone <repository-url>
cd subscription-platform
pnpm install
pnpm setup
```

The `setup` script will:

- Copy `.env.example` to `.env`
- Run local database migrations
- Seed initial data
- Generate a development API key

### 2. Run Locally

```bash
pnpm dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173) (Login: `admin@example.com` / `admin123`)
- **Backend**: [http://localhost:8787](http://localhost:8787)
- **Swagger UI**: [http://localhost:8787/ui](http://localhost:8787/ui)

---

## 🔄 Deployment Strategy

We use a fully automated **GitHub Actions** pipeline:

1.  **Preview**: Push to `master` → Deploys frontend to a unique Preview URL.
2.  **Production**: Push a tag (`v*`) → Deploys backend & frontend to Production.

For detailed instructions, see the **[Deployment Guide](docs/deployment.md)**.

---

## 🏗️ Project Structure

This monorepo uses **TurboRepo**:

- **`apps/backend`**: Hono API on Cloudflare Workers.
- **`apps/web`**: React Admin Dashboard on Cloudflare Pages.
- **`packages/db`**: Shared Drizzle ORM schema and migrations.
- **`packages/eslint-config`**: Shared linting configuration.

---

## 🛠️ Key Commands

| Command            | Description                                 |
| ------------------ | ------------------------------------------- |
| `pnpm dev`         | Start all apps locally                      |
| `pnpm build`       | Build all apps for production               |
| `pnpm typecheck`   | Run TypeScript checks                       |
| `pnpm format`      | Fix code formatting (Prettier)              |
| `pnpm seed:remote` | Seed the **production** database (Careful!) |

---

## 📄 License

MIT © Subscription Platform Team
