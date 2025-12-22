# Subscription Platform Monorepo

A professional, scalable subscription management platform built with Hono, Cloudflare D1, Drizzle ORM, and React.

## 🚀 Quick Start

```bash
git clone <repository-url>
cd subscription-platform
pnpm install
pnpm setup
pnpm dev
```

That's it! The setup script automatically:

- Copies all environment files
- Runs database migrations
- Seeds initial data
- Configures a dev API key

**Dev API Key** (for testing): `auto-landlord_dev_local-development-key`

### Endpoints

| Service    | URL                      |
| ---------- | ------------------------ |
| Backend    | http://localhost:8787    |
| Swagger UI | http://localhost:8787/ui |
| Frontend   | http://localhost:5173    |

### Prerequisites

- **Node.js**: v20.0.0 or higher
- **pnpm**: v9.0.0 or higher

---

## 📖 Manual Setup (Advanced)

<details>
<summary>Click to expand if you prefer step-by-step control</summary>

### 1. Environment Files

```bash
cp apps/backend/.dev.vars.example apps/backend/.dev.vars
cp packages/db/.env.example packages/db/.env
cp apps/web/.env.example apps/web/.env
```

### 2. Database

```bash
cd apps/backend
pnpm migrate:local
pnpm seed:run
```

### 3. Generate Custom API Key

```bash
pnpm tsx scripts/generate-api-key.ts "Your-Product-Name"
# Copy the SQL command from output
pnpm db:execute --command "UPDATE products SET api_key_hash = '...' WHERE id = '...';"
```

### 4. Configure Frontend

Add your API key to `apps/web/.env`:

```env
VITE_SUBSCRIPTION_API_KEY=your-product_prod_...
```

</details>

---

## 🏗️ Project Structure

- `apps/backend`: Hono API running on Cloudflare Workers. Features a modular, domain-driven architecture.
- `apps/web`: React SPA frontend with Tailwind CSS and Shadcn UI.
- `packages/db`: Shared database logic using Drizzle ORM, schema definitions, and migrations.
- `packages/eslint-config`: Centralized linting rules used across the entire monorepo.
- `scripts/`: Development utility scripts.

## 🛠️ Key Commands

- `pnpm lint`: Run ESLint across all packages.
- `pnpm typecheck`: Run TypeScript compilation check.
- `pnpm build`: Build all applications for production.
- `pnpm format`: Format code using Prettier.

## 📄 License

MIT
