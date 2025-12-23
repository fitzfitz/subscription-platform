
> @repo/db@0.0.0 seed:generate /Users/fitzgeral/Kerja/Projects/subscription-platform/packages/db
> tsx src/seed.ts

-- Seeding Admin Users
INSERT OR IGNORE INTO admin_users (id, email, password_hash, name, role, is_active, created_at, updated_at) VALUES ('admin-001', 'admin@example.com', '$2b$10$xM3iPMrSxIdO8bEORuvdC.juWjqxCI69HKVtZ86z/kCf4gFPmKaoi', 'Super Admin', 'SUPER_ADMIN', 1, 1766458759, 1766458759);
-- Seeding Products
INSERT OR IGNORE INTO products (id, name, api_key_hash, is_active, created_at) VALUES ('auto-landlord', 'Auto-Landlord', '$2b$10$BQdWbOunQXfsTXhN8szOGuvKwrQjUhrmSDxNe.RsM1tudEXGa.aCi', 1, 1766458759);
-- Seeding Plans (Auto-Landlord)
INSERT OR IGNORE INTO plans (id, product_id, name, slug, price, features, limits, is_active, created_at) VALUES ('plan-001', 'auto-landlord', 'Starter', 'auto-landlord-starter', 0, 'Up to 2 properties,Basic tenant management,Email support', '{"properties": 2}', 1, 1766458759);
INSERT OR IGNORE INTO plans (id, product_id, name, slug, price, features, limits, is_active, created_at) VALUES ('plan-002', 'auto-landlord', 'Pro', 'auto-landlord-pro', 2900, 'Unlimited properties,Advanced reporting,Priority support', '{"properties": 999999}', 1, 1766458759);
