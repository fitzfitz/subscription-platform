#!/usr/bin/env node
import { execSync } from 'child_process'
import { existsSync, copyFileSync, writeFileSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// Known dev credentials - these work out of the box for local development
const DEV_API_KEY = 'auto-landlord_dev_local-development-key'
const DEV_API_KEY_HASH = '$2b$10$BQdWbOunQXfsTXhN8szOGuvKwrQjUhrmSDxNe.RsM1tudEXGa.aCi'

const log = (emoji: string, msg: string) => console.log(`${emoji}  ${msg}`)
const run = (cmd: string, cwd = ROOT) => {
  try {
    execSync(cmd, { cwd, stdio: 'inherit' })
  } catch {
    return false
  }
  return true
}

async function setup() {
  console.log('\n🚀 Setting up Subscription Platform for local development\n')

  // Step 1: Copy environment files
  log('📁', 'Creating environment files...')

  const envFiles = [
    {
      src: 'apps/backend/.dev.vars.example',
      dest: 'apps/backend/.dev.vars',
    },
    {
      src: 'apps/web/.env.example',
      dest: 'apps/web/.env',
    },
    {
      src: 'packages/db/.env.example',
      dest: 'packages/db/.env',
    },
  ]

  for (const { src, dest } of envFiles) {
    const srcPath = resolve(ROOT, src)
    const destPath = resolve(ROOT, dest)

    if (!existsSync(destPath)) {
      if (existsSync(srcPath)) {
        copyFileSync(srcPath, destPath)
        log('  ✅', `Created ${dest}`)
      } else {
        log('  ⚠️', `Source not found: ${src}`)
      }
    } else {
      log('  ⏭️', `${dest} already exists, skipping`)
    }
  }

  // Step 2: Configure dev API key in web/.env
  const webEnvPath = resolve(ROOT, 'apps/web/.env')
  if (existsSync(webEnvPath)) {
    let webEnv = readFileSync(webEnvPath, 'utf-8')
    if (webEnv.includes('your_generated_api_key_here')) {
      webEnv = webEnv.replace('your_generated_api_key_here', DEV_API_KEY)
      writeFileSync(webEnvPath, webEnv)
      log('🔑', 'Configured dev API key in apps/web/.env')
    }
  }

  // Step 3: Run migrations
  log('🗄️', 'Running database migrations...')
  const migrateSuccess = run('pnpm migrate:local', resolve(ROOT, 'apps/backend'))

  if (!migrateSuccess) {
    log('❌', 'Migration failed. You may need to run migrations manually.')
  } else {
    log('  ✅', 'Migrations applied')
  }

  // Step 4: Seed database with dev-ready data
  log('🌱', 'Seeding database...')
  const seedSuccess = run('pnpm seed:run', resolve(ROOT, 'apps/backend'))

  if (!seedSuccess) {
    log('⚠️', 'Seed had issues (might be first run - continuing)')
  } else {
    log('  ✅', 'Database seeded')
  }

  // Step 5: Update product with working dev API key hash
  log('🔐', 'Configuring dev API key in database...')
  const sqlUpdatePath = resolve(ROOT, 'update-hash.sql')
  const sqlCmd = `UPDATE products SET api_key_hash = '${DEV_API_KEY_HASH}' WHERE id = 'auto-landlord';`

  try {
    writeFileSync(sqlUpdatePath, sqlCmd)
    execSync(
      `pnpm --filter backend exec wrangler d1 execute DB --local --file "${sqlUpdatePath}"`,
      {
        cwd: ROOT,
        stdio: 'inherit',
      },
    )
    log('  ✅', 'Dev API key configured')
  } catch (err) {
    log('⚠️', 'Could not update API key (product might not exist yet)')
  } finally {
    if (existsSync(sqlUpdatePath)) {
      const { unlinkSync } = await import('fs')
      unlinkSync(sqlUpdatePath)
    }
  }

  // Done!
  console.log('\n' + '='.repeat(60))
  console.log('✅ Setup complete!')
  console.log('='.repeat(60))
  console.log('\n📝 Dev API Key (for testing):')
  console.log(`   ${DEV_API_KEY}`)
  console.log('\n🚀 Start development:')
  console.log('   pnpm dev')
  console.log('\n📍 Endpoints:')
  console.log('   Backend:    http://localhost:8787')
  console.log('   Swagger UI: http://localhost:8787/ui')
  console.log('   Frontend:   http://localhost:5173')
  console.log('')
}

setup().catch(console.error)
