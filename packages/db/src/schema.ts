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

  limits: text('limits').notNull(),
  // JSON object containing plan limits (e.g., {"properties": 50, "users": 10})
  // Supports any product-specific limit structure

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

// Payment Methods - Available payment providers and methods
export const paymentMethods = sqliteTable('payment_methods', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  slug: text('slug').notNull().unique(),
  // Unique identifier (e.g., "manual_bank", "stripe", "midtrans")

  name: text('name').notNull(),
  // Display name (e.g., "Bank Transfer", "Credit Card", "QRIS")

  type: text('type').notNull(),
  // 'manual' | 'automated'

  provider: text('provider'),
  // 'stripe' | 'midtrans' | 'xendit' | null (for manual)

  config: text('config'),
  // JSON configuration (account numbers, API keys, etc.)

  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  // Whether this payment method is enabled globally

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Product Payment Methods - Junction table for product-specific payment method configuration
export const productPaymentMethods = sqliteTable('product_payment_methods', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  // Which product this configuration belongs to

  paymentMethodId: text('payment_method_id')
    .notNull()
    .references(() => paymentMethods.id, { onDelete: 'cascade' }),
  // Which payment method is enabled

  displayOrder: integer('display_order').notNull().default(0),
  // Order in which payment methods appear in the UI

  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  // Whether this is the pre-selected payment method

  createdAt: integer('created_at', { mode: 'timestamp' })
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

    paymentMethodId: text('payment_method_id').references(() => paymentMethods.id),
    // Which payment method was used (optional, for future tracking)

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

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods)
export const selectPaymentMethodSchema = createSelectSchema(paymentMethods)

export const insertProductPaymentMethodSchema = createInsertSchema(productPaymentMethods)
export const selectProductPaymentMethodSchema = createSelectSchema(productPaymentMethods)

// Drizzle Relations
export const productsRelations = relations(products, ({ many }) => ({
  plans: many(plans),
  subscriptions: many(subscriptions),
  productPaymentMethods: many(productPaymentMethods),
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
  paymentMethod: one(paymentMethods, {
    fields: [subscriptions.paymentMethodId],
    references: [paymentMethods.id],
  }),
}))

export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
  productPaymentMethods: many(productPaymentMethods),
  subscriptions: many(subscriptions),
}))

export const productPaymentMethodsRelations = relations(productPaymentMethods, ({ one }) => ({
  product: one(products, {
    fields: [productPaymentMethods.productId],
    references: [products.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [productPaymentMethods.paymentMethodId],
    references: [paymentMethods.id],
  }),
}))
