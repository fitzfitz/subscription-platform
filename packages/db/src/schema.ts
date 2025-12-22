import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

export const products = sqliteTable('products', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text('name').notNull(),
  // Product display name (e.g., "Auto-Landlord")

  apiKeyHash: text('api_key_hash').notNull().unique(),
  // Bcrypt hash of the product's API key
  // Never store plain text API keys

  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  // Administrative flag to disable a product

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const plans = sqliteTable('plans', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  // Which product this plan belongs to

  name: text('name').notNull(),
  // Display name (e.g., "Starter", "Pro", "Enterprise")

  slug: text('slug').notNull().unique(),
  // URL-safe identifier (e.g., "auto-landlord-pro")

  price: integer('price').notNull(),
  // Price in cents (e.g., 2900 = $29.00)

  features: text('features').notNull(),
  // Comma-separated feature list for display

  maxProperties: integer('max_properties').notNull(),
  // Feature gate: maximum properties allowed

  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  // Administrative flag to hide/show plans

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  // Clerk UserID from product apps - serves as primary key

  email: text('email').notNull().unique(),
  // Email for admin convenience only (display in subscription lists)

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),

  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Admin Users - Platform administrators (separate from product users)
export const adminUsers = sqliteTable('admin_users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  email: text('email').notNull().unique(),
  // Admin login email

  passwordHash: text('password_hash').notNull(),
  // Bcrypt hashed password

  name: text('name').notNull(),
  // Display name for the admin

  role: text('role').notNull().default('ADMIN'),
  // ADMIN | SUPER_ADMIN
  // SUPER_ADMIN can manage other admins

  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  // Whether admin can login

  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  // Track last login time

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),

  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    // Which user owns this subscription

    planId: text('plan_id')
      .notNull()
      .references(() => plans.id),
    // Current plan

    productId: text('product_id')
      .notNull()
      .references(() => products.id),
    // Which product this subscription is for

    status: text('status').notNull(),
    // active | pending_verification | past_due | canceled

    provider: text('provider').default('MANUAL'),
    // MANUAL | STRIPE | PAYPAL | SYSTEM

    externalId: text('external_id'),
    // External payment gateway transaction ID

    paymentProofUrl: text('payment_proof_url'),
    // URL to uploaded receipt (from R2)

    paymentNote: text('payment_note'),
    // User's message with payment details

    startDate: integer('start_date', { mode: 'timestamp' }),
    // When subscription became active

    endDate: integer('end_date', { mode: 'timestamp' }),
    // When subscription expires (null = lifetime/active)

    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),

    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    // Unique constraint: one subscription per user per product
    uniqueUserProduct: unique().on(table.userId, table.productId),
  }),
)

// Zod Schemas
export const insertProductSchema = createInsertSchema(products)
export const selectProductSchema = createSelectSchema(products)

export const insertPlanSchema = createInsertSchema(plans)
export const selectPlanSchema = createSelectSchema(plans)

export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)

export const insertSubscriptionSchema = createInsertSchema(subscriptions)
export const selectSubscriptionSchema = createSelectSchema(subscriptions)

export const insertAdminUserSchema = createInsertSchema(adminUsers)
export const selectAdminUserSchema = createSelectSchema(adminUsers)

// Drizzle Relations
export const productsRelations = relations(products, ({ many }) => ({
  plans: many(plans),
  subscriptions: many(subscriptions),
}))

export const plansRelations = relations(plans, ({ one, many }) => ({
  product: one(products, { fields: [plans.productId], references: [products.id] }),
  subscriptions: many(subscriptions),
}))

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
}))

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  plan: one(plans, { fields: [subscriptions.planId], references: [plans.id] }),
  product: one(products, { fields: [subscriptions.productId], references: [products.id] }),
}))
