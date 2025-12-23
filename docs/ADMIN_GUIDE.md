# 🛡️ Admin Panel Guide

This guide explains how to use the Subscription Platform Admin Portal to manage your SaaS products, plans, and users.

## 🔑 Accessing the Admin Panel

1.  **URL**: `https://<your-domain>.pages.dev/login` (or `http://localhost:5173/login` for local dev).
2.  **Credentials**:
    - **Email**: `admin@example.com`
    - **Password**: `admin123`
    - _(Note: Change these credentials in the database for production security!)_

---

## 📦 Managing Products

Products represent the different SaaS applications you are selling (e.g., "Auto-Landlord", "Email-Marketing-Pro").

### Create a Product

1.  Navigate to **Products** in the sidebar.
2.  Click **+ Add Product**.
3.  Enter the **Name** and **Description**.
4.  **Important**: Currently, API Key generation is done via CLI (see below), but you can view product details here.

### API Keys

To integrate a product with the backend, you need an API Key. currently, keys are generated via a script:

```bash
pnpm tsx scripts/generate-api-key.ts "Product Name"
```

This will output:

1.  **Public API Key**: `prod_...` (Save this! It's never shown again).
2.  **SQL Command**: Run this command to store the hash in the database.

---

## 💳 Managing Plans

Plans define the pricing and limits for your products.

1.  Navigate to **Plans**.
2.  Click **+ Add Plan**.
3.  **Fields**:
    - **Name**: e.g., "Pro Plan".
    - **Product**: Select the parent product.
    - **Price**: Monthly cost (in cents).
    - **Limits**: Define usage limits as JSON object (e.g., `{"properties": 50, "users": 10}`).
      - For different product types, use different limit keys
      - Property Management: `{"properties": N, "tenants": N}`
      - Project Management: `{"projects": N, "team_members": N}`
      - Email Marketing: `{"contacts": N, "emails_per_month": N}`

---

## 👥 Managing Users

View and manage the end-users who have subscribed to your products.

1.  Navigate to **Users**.
2.  View list of users, their emails, and subscription status.
3.  **Details View**: Click on a user to see their active subscriptions and usage history.

---

## ⚙️ Settings

Configurable application settings (currently under development).

---

## 🔒 Security Best Practices

- **Rotate Admin Password**: Immediately update the admin user's password in the `admin_users` table after deployment.
- **API Keys**: Never commit API keys to version control.
- **Production Data**: Be careful when editing plans that have active subscribers.
