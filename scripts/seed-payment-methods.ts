import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '@repo/db'

const DATABASE_URL = process.env.DATABASE_URL
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is required')
  process.exit(1)
}

const client = createClient({
  url: DATABASE_URL,
  authToken: DATABASE_AUTH_TOKEN,
})

const db = drizzle(client, { schema })

async function seedPaymentMethods() {
  console.log('🌱 Seeding default payment methods...')

  // Create default manual payment method
  const [manualBank] = await db
    .insert(schema.paymentMethods)
    .values({
      slug: 'manual_bank',
      name: 'Bank Transfer',
      type: 'manual',
      provider: null,
      config: JSON.stringify({
        bankName: 'BCA',
        accountNumber: '1234567890',
        accountName: 'PT Subscription Platform',
        instructions: 'Transfer to the account above and upload proof of payment',
      }),
      isActive: true,
    })
    .returning()

  console.log('✅ Created payment method:', manualBank.name)

  // Link all existing products to manual_bank
  const products = await db.query.products.findMany()

  for (const product of products) {
    await db.insert(schema.productPaymentMethods).values({
      productId: product.id,
      paymentMethodId: manualBank.id,
      displayOrder: 0,
      isDefault: true,
    })

    console.log(`✅ Linked ${product.name} to manual bank transfer`)
  }

  console.log('✨ Seed completed successfully!')
}

seedPaymentMethods()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(() => {
    client.close()
  })
