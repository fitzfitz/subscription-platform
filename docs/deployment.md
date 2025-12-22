# Deployment Guide

This repository uses **GitHub Actions** for automated deployments to Cloudflare.

## Prerequisites

### 1. Cloudflare Tokens

You need to generate an API Token in the Cloudflare Dashboard:

- Go to [User Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens).
- Create a custom token with the following permissions:
  - **Workers Scripts**: Edit
  - **D1**: Edit (for database migrations)
  - **Pages**: Edit
  - **Account Settings**: Read (optional, helpful for verifying account ID)

### 2. GitHub Secrets

Add the following secrets to your GitHub Repository (`Settings > Secrets and variables > Actions`):

| Secret Name             | Description                                                         |
| :---------------------- | :------------------------------------------------------------------ |
| `CLOUDFLARE_API_TOKEN`  | The API Token created above.                                        |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID (found in the dashboard URL or sidebar). |

### 3. Update Worker URL

Edit `.github/workflows/deploy.yml` and replace `YOUR_SUBDOMAIN` with your actual worker subdomain:

```yaml
RESPONSE=$(curl ... https://subscription-platform-backend.YOUR_SUBDOMAIN.workers.dev/health)
```

### 4. Cloudflare Pages Project

For the frontend, you must first create a Pages project in Cloudflare:

1. Go to **Workers & Pages > Create application > Pages > Connect to Git**.
2. Select this repository.
3. **Build settings**:
   - **Framework preset**: Vite
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
4. **Project Name**: Ensure the project name matches the one in `.github/workflows/deploy.yml` (Default: `subscription-platform-web`).

## CI/CD Workflow

The pipeline is defined in `.github/workflows/deploy.yml`.

### Continuous Integration (CI)

Runs on every push to `master`.

- **Linting**: Checks code style using ESLint.
- **Typecheck**: Verifies TypeScript types.
- **Build**: Ensures all packages build successfully.

### Deployment (CD)

Runs **ONLY** when a new release tag is pushed (e.g., `v1.0.0`).

#### Deployment Steps

1. **Run Database Migrations** - Automatically applies pending migrations to production D1 database
2. **Deploy Backend** - Deploys to Cloudflare Workers
3. **Health Check** - Verifies deployment with `/health` endpoint
4. **Deploy Frontend** - Deploys to Cloudflare Pages

#### How to Release

To trigger a deployment, create and push a tag:

```bash
# 1. Commit your changes
git add .
git commit -m "feat: release features"
git push origin master

# 2. Tag the release
git tag v0.1.0

# 3. Push the tag to trigger deployment
git push origin v0.1.0
```

The workflow will:

1. Run CI checks.
2. Apply database migrations automatically.
3. Deploy `apps/backend` to **Cloudflare Workers**.
4. Verify deployment health.
5. Deploy `apps/web/dist` to **Cloudflare Pages**.

## Health Monitoring

The backend includes a `/health` endpoint that:

- Checks database connectivity
- Returns JSON status
- Used by CI/CD for post-deployment verification

**Test locally:**

```bash
curl http://localhost:8787/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "subscription-platform-backend"
}
```

## Manual Deployment

For manual deployment steps, see [manual-deployment.md](./manual-deployment.md).
