#!/bin/bash

# Seed Remote Production Database
# This script generates seed data and applies it to your remote Cloudflare D1 database

set -e

echo "🌱 Seeding Remote Production Database..."
echo ""

# Step 1: Generate seed SQL
echo "📝 Generating seed data..."
pnpm --filter @repo/db seed:generate | grep -E "^(--|INSERT)" > seed-remote.sql

if [ ! -s seed-remote.sql ]; then
  echo "❌ Error: No seed data generated"
  rm -f seed-remote.sql
  exit 1
fi

echo "✅ Seed data generated: seed-remote.sql"
echo ""

# Step 2: Show what will be inserted
echo "📊 Preview of data to be inserted:"
head -n 20 seed-remote.sql
echo "..."
echo ""

# Step 3: Ask for confirmation
read -p "⚠️  This will insert data into PRODUCTION. Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  rm -f seed-remote.sql
  exit 0
fi

# Step 4: Apply to remote database
echo ""
echo "🚀 Applying seed data to remote database..."
cd apps/backend
npx wrangler d1 execute DB --remote --file ../../seed-remote.sql

# Step 5: Cleanup
cd ../..
rm -f seed-remote.sql

echo ""
echo "✅ Remote database seeded successfully!"
echo ""
echo "🔍 Verify by checking your admin panel or running:"
echo "   npx wrangler d1 execute DB --remote --command 'SELECT * FROM admin_users LIMIT 5'"
