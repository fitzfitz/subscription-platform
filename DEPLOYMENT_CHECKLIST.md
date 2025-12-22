# Quick GitHub Setup Checklist

## ✅ What You Need to Do

### 1. Add GitHub Secrets (Required!)

Go to: **Your Repo → Settings → Secrets and variables → Actions → New repository secret**

Add these 2 secrets:

```
Name: CLOUDFLARE_API_TOKEN
Value: <your-cloudflare-api-token>

Name: CLOUDFLARE_ACCOUNT_ID  
Value: <your-cloudflare-account-id>
```

### 2. Get Cloudflare API Token

1. Visit: https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token** → **Create Custom Token**
3. Set permissions:
   - Workers Scripts: **Edit**
   - D1: **Edit**
   - Pages: **Edit**
4. Copy the token → Add to GitHub secrets

### 3. Get Cloudflare Account ID

1. Open Cloudflare Dashboard
2. Look at URL or sidebar
3. Copy your Account ID (looks like: `abc123def456...`)
4. Add to GitHub secrets

### 4. Create D1 Database

```bash
cd apps/backend
npx wrangler d1 create subscription-platform-db
```

Update `apps/backend/wrangler.toml` with the database ID from output.

### 5. Create Cloudflare Pages Project

1. Cloudflare Dashboard → **Workers & Pages** → **Create**
2. Connect your GitHub repo
3. Settings:
   - Build command: `cd apps/web && pnpm install && pnpm build`
   - Build output: `apps/web/dist`
   - Project name: `subscription-platform-web`

### 6. Deploy!

```bash
git tag v0.1.0
git push origin v0.1.0
```

Done! ✨

---

**Full detailed guide**: See `github-setup-guide.md`
