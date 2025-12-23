// This script generates SQL for seeding the D1 database.
// It is intended to be piped: pnpm seed:generate | wrangler d1 execute DB --local --file -

// Dev API key hash - matches 'auto-landlord_dev_local-development-key'
// This allows new developers to start testing immediately after setup
const DEV_API_KEY_HASH = '$2b$10$BQdWbOunQXfsTXhN8szOGuvKwrQjUhrmSDxNe.RsM1tudEXGa.aCi'

// Default super admin password hash - matches 'admin123'
// IMPORTANT: Change this password immediately in production!
const ADMIN_PASSWORD_HASH = '$2b$10$xM3iPMrSxIdO8bEORuvdC.juWjqxCI69HKVtZ86z/kCf4gFPmKaoi'

async function generateSeed() {
  const now = Math.floor(Date.now() / 1000)

  const sqlStatements = [
    `-- Seeding Admin Users`,
    `INSERT OR IGNORE INTO admin_users (id, email, password_hash, name, role, is_active, created_at, updated_at) VALUES ('admin-001', 'admin@example.com', '${ADMIN_PASSWORD_HASH}', 'Super Admin', 'SUPER_ADMIN', 1, ${now}, ${now});`,

    `-- Seeding Products`,
    `INSERT OR IGNORE INTO products (id, name, api_key_hash, is_active, created_at) VALUES ('auto-landlord', 'Auto-Landlord', '${DEV_API_KEY_HASH}', 1, ${now});`,

    `-- Seeding Plans (Auto-Landlord)`,
    `INSERT OR IGNORE INTO plans (id, product_id, name, slug, price, features, limits, is_active, created_at) VALUES ('plan-001', 'auto-landlord', 'Starter', 'auto-landlord-starter', 0, 'Up to 2 properties,Basic tenant management,Email support', '{"properties": 2}', 1, ${now});`,
    `INSERT OR IGNORE INTO plans (id, product_id, name, slug, price, features, limits, is_active, created_at) VALUES ('plan-002', 'auto-landlord', 'Pro', 'auto-landlord-pro', 2900, 'Unlimited properties,Advanced reporting,Priority support', '{"properties": 999999}', 1, ${now});`,
  ]

  process.stdout.write(sqlStatements.join('\n') + '\n')
}

generateSeed()
