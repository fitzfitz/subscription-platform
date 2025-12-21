import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const generateApiKey = async (productName: string) => {
  // Generate random key
  const apiKey = `${productName.toLowerCase().replace(/\s/g, '-')}_prod_${crypto.randomUUID()}`

  // Hash for storage
  const apiKeyHash = await bcrypt.hash(apiKey, 10)

  console.log('='.repeat(60))
  console.log('Product API Key (SAVE THIS - shown only once)')
  console.log('='.repeat(60))
  console.log('Product Name:', productName)
  console.log('API Key:', apiKey)
  console.log('\nHash (for database):', apiKeyHash)
  console.log('='.repeat(60))

  console.log('\nSQL to insert/update database:')
  console.log(
    `UPDATE products SET api_key_hash = '${apiKeyHash}' WHERE id = '${productName.toLowerCase().replace(/\s/g, '-')}';`,
  )
  console.log('\nor for new product:')
  console.log(
    `INSERT INTO products (id, name, api_key_hash, is_active, created_at) VALUES ('${productName.toLowerCase().replace(/\s/g, '-')}', '${productName}', '${apiKeyHash}', 1, ${Math.floor(Date.now() / 1000)});`,
  )
}

// Get product name from args or default
const productName = process.argv[2] || 'Auto-Landlord'
generateApiKey(productName)
