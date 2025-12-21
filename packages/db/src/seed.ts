// This script generates SQL for seeding the D1 database.
// It is intended to be piped: pnpm seed:generate | wrangler d1 execute DB --local --file -

// Dev API key hash - matches 'auto-landlord_dev_local-development-key'
// This allows new developers to start testing immediately after setup
const DEV_API_KEY_HASH = '$2b$10$BQdWbOunQXfsTXhN8szOGuvKwrQjUhrmSDxNe.RsM1tudEXGa.aCi'

async function generateSeed() {
  const sqlStatements = [
    `-- Seeding Products`,
    `INSERT OR IGNORE INTO products (id, name, api_key_hash, is_active, created_at) VALUES ('auto-landlord', 'Auto-Landlord', '${DEV_API_KEY_HASH}', 1, ${Math.floor(Date.now() / 1000)});`,
    `INSERT OR IGNORE INTO products (id, name, api_key_hash, is_active, created_at) VALUES ('product-b', 'Product B', '${DEV_API_KEY_HASH}', 1, ${Math.floor(Date.now() / 1000)});`,

    `-- Seeding Plans (Auto-Landlord)`,
    `INSERT OR IGNORE INTO plans (id, product_id, name, slug, price, features, max_properties, is_active, created_at) VALUES ('plan-001', 'auto-landlord', 'Starter', 'auto-landlord-starter', 0, 'Up to 2 properties,Basic tenant management,Email support', 2, 1, ${Math.floor(Date.now() / 1000)});`,
    `INSERT OR IGNORE INTO plans (id, product_id, name, slug, price, features, max_properties, is_active, created_at) VALUES ('plan-002', 'auto-landlord', 'Pro', 'auto-landlord-pro', 2900, 'Unlimited properties,Advanced reporting,Priority support', 999999, 1, ${Math.floor(Date.now() / 1000)});`,
  ]

  process.stdout.write(sqlStatements.join('\n') + '\n')
}

generateSeed()
