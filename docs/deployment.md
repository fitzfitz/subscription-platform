# 🚀 Deployment Guide

This project uses **GitHub Actions** for fully automated deployments.

## 🔄 Deployment Strategy

We use a tag-based deployment strategy that gives you full control:

| Trigger  | Branch / Tag         | Environment    | URL                                | Behavior                                           |
| -------- | -------------------- | -------------- | ---------------------------------- | -------------------------------------------------- |
| **Push** | `master`             | **Preview**    | `https://<hash>.project.pages.dev` | Deploys frontend only. Uses preview backend.       |
| **Tag**  | `v*` (e.g. `v1.0.0`) | **Production** | Main Domain                        | Full deployment (migrations + backend + frontend). |

---

## ✅ Prerequisites

Ensure these **GitHub Secrets** are set in your repository:

| Secret Name             | Description                | Required For     |
| ----------------------- | -------------------------- | ---------------- |
| `CLOUDFLARE_API_TOKEN`  | Your Cloudflare API Token  | All Deployments  |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID | All Deployments  |
| `API_URL`               | Production Backend URL     | Production Build |
| `PREVIEW_API_URL`       | Preview Backend URL        | Preview Build    |

> **Note:** `PREVIEW_API_URL` can be the same as `API_URL` or a dedicated staging backend.

---

## 🛠️ How to Deploy

### 1. Preview Deployment (Testing)

Simply push to the `master` branch.

```bash
git add .
git commit -m "feat: new feature"
git push origin master
```

- Github Actions will build the frontend and deploy it to a unique Preview URL.
- **Backend is NOT deployed** (to prevent breaking changes in dev).
- **Migrations are NOT run**.

### 2. Production Deployment (Live)

To release to production, push a git tag starting with `v`.

```bash
# 1. Create a tag
git tag v1.0.0

# 2. Push the tag
git push origin v1.0.0
```

- Runs **Database Migrations** (remote).
- Deploys **Backend** to Cloudflare Workers.
- Deploys **Frontend** to Cloudflare Pages (Production).
- Runs **Health Checks**.

---

## ⚙️ Configuration Details

- **Workflow File:** `.github/workflows/deploy.yml`
- **Cloudflare Pages:** Auto-deployments should be **PAUSED** in Cloudflare dashboard to let GitHub Actions handle everything.
- **Wrangler:** We use `wrangler pages deploy` with the `--branch` flag to correctly categorize deployments in Cloudflare.

## 🐛 Troubleshooting

- **Deployment Skipped?** If you see "Skipped" logs in Cloudflare Pages dashboard, that's **GOOD**. It means Cloudflare's auto-deploy is paused and GitHub Actions is in charge.
- **Production not updating?** Ensure you pushed a TAG (`v...`), not just a commit to master.
- **Frontend error "Invalid URL"?** Check if `VITE_API_URL` environment variable is correctly passed in the GitHub Action workflow.
