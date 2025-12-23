import { DrizzleD1Database } from 'drizzle-orm/d1'
import { eq, desc, and } from 'drizzle-orm'
import * as schema from '@repo/db'
import { adminUsers, products, plans, users, subscriptions } from '@repo/db'
import bcrypt from 'bcryptjs'
import { PaymentMethodsService } from '../payment-methods/service'

export class AdminManagementService {
  private readonly db: DrizzleD1Database<typeof schema>

  constructor(db: DrizzleD1Database<typeof schema>) {
    this.db = db
  }

  // ==================== ADMIN USERS ====================

  async createAdmin(data: { email: string; password: string; name: string; role?: string }) {
    const passwordHash = await bcrypt.hash(data.password, 10)

    const [admin] = await this.db
      .insert(adminUsers)
      .values({
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role || 'ADMIN',
      })
      .returning()

    // Return without password hash
    const { passwordHash: _, ...safeAdmin } = admin
    return safeAdmin
  }

  async listAdmins() {
    const admins = await this.db.query.adminUsers.findMany({
      orderBy: [desc(adminUsers.createdAt)],
    })

    // Remove password hashes from response
    return admins.map(({ passwordHash: _, ...admin }) => admin)
  }

  async getAdminById(id: string) {
    const admin = await this.db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, id),
    })

    if (!admin) return null

    const { passwordHash: _, ...safeAdmin } = admin
    return safeAdmin
  }

  async updateAdmin(
    id: string,
    data: {
      name?: string
      email?: string
      role?: string
      isActive?: boolean
      password?: string
    },
  ) {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (data.name) updateData.name = data.name
    if (data.email) updateData.email = data.email
    if (data.role) updateData.role = data.role
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10)
    }

    const [updated] = await this.db
      .update(adminUsers)
      .set(updateData)
      .where(eq(adminUsers.id, id))
      .returning()

    if (!updated) return null

    const { passwordHash: _, ...safeAdmin } = updated
    return safeAdmin
  }

  async deleteAdmin(id: string) {
    const [deleted] = await this.db.delete(adminUsers).where(eq(adminUsers.id, id)).returning()

    return !!deleted
  }

  // ==================== PRODUCTS ====================

  async createProduct(data: { name: string; isActive?: boolean }) {
    // Generate API key
    const productId = data.name.toLowerCase().replace(/\s+/g, '-')
    const apiKey = `${productId}_prod_${crypto.randomUUID()}`
    const apiKeyHash = await bcrypt.hash(apiKey, 10)

    const [product] = await this.db
      .insert(products)
      .values({
        id: productId,
        name: data.name,
        apiKeyHash,
        isActive: data.isActive ?? true,
      })
      .returning()

    // Return product with plain API key (only shown once!)
    return {
      ...product,
      apiKey, // Only returned on creation!
    }
  }

  async listProducts() {
    return this.db.query.products.findMany({
      orderBy: [desc(products.createdAt)],
      with: {
        plans: true,
      },
    })
  }

  async getProductById(id: string) {
    return this.db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        plans: true,
        subscriptions: true,
      },
    })
  }

  async updateProduct(
    id: string,
    data: {
      name?: string
      isActive?: boolean
    },
  ) {
    const [updated] = await this.db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning()

    return updated
  }

  async regenerateProductApiKey(id: string) {
    const product = await this.db.query.products.findFirst({
      where: eq(products.id, id),
    })

    if (!product) return null

    const apiKey = `${id}_prod_${crypto.randomUUID()}`
    const apiKeyHash = await bcrypt.hash(apiKey, 10)

    await this.db.update(products).set({ apiKeyHash }).where(eq(products.id, id))

    return { apiKey } // Only shown once!
  }

  async deleteProduct(id: string) {
    // Note: This will fail if there are related plans/subscriptions
    // Consider soft delete in production
    const [deleted] = await this.db.delete(products).where(eq(products.id, id)).returning()

    return !!deleted
  }

  async updateProductPaymentMethods(
    productId: string,
    methods: Array<{
      paymentMethodId: string
      displayOrder: number
      isDefault: boolean
    }>,
  ) {
    // Delegate to PaymentMethodsService
    const paymentMethodsService = new PaymentMethodsService(this.db)
    return paymentMethodsService.updateProductPaymentMethods(productId, methods)
  }

  async getProductPaymentMethods(productId: string) {
    // Delegate to PaymentMethodsService
    const paymentMethodsService = new PaymentMethodsService(this.db)
    return paymentMethodsService.getProductPaymentMethods(productId)
  }

  // ==================== PLANS ====================

  async createPlan(data: {
    productId: string
    name: string
    slug: string
    price: number
    features: string
    maxProperties: number
    isActive?: boolean
  }) {
    const [plan] = await this.db
      .insert(plans)
      .values({
        productId: data.productId,
        name: data.name,
        slug: data.slug,
        price: data.price,
        features: data.features,
        maxProperties: data.maxProperties,
        isActive: data.isActive ?? true,
      })
      .returning()

    return plan
  }

  async listPlans(productId?: string) {
    if (productId) {
      return this.db.query.plans.findMany({
        where: eq(plans.productId, productId),
        orderBy: [desc(plans.createdAt)],
        with: {
          product: true,
        },
      })
    }

    return this.db.query.plans.findMany({
      orderBy: [desc(plans.createdAt)],
      with: {
        product: true,
      },
    })
  }

  async getPlanById(id: string) {
    return this.db.query.plans.findFirst({
      where: eq(plans.id, id),
      with: {
        product: true,
        subscriptions: true,
      },
    })
  }

  async updatePlan(
    id: string,
    data: {
      name?: string
      slug?: string
      price?: number
      features?: string
      maxProperties?: number
      isActive?: boolean
    },
  ) {
    const [updated] = await this.db.update(plans).set(data).where(eq(plans.id, id)).returning()

    return updated
  }

  async deletePlan(id: string) {
    // Note: This will fail if there are related subscriptions
    const [deleted] = await this.db.delete(plans).where(eq(plans.id, id)).returning()

    return !!deleted
  }

  // ==================== USERS ====================

  async listUsers(filters?: { search?: string; productId?: string }) {
    // Get all users with their subscriptions
    const allUsers = await this.db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      with: {
        subscriptions: {
          with: {
            plan: true,
            product: true,
          },
        },
      },
    })

    // Apply filters in memory (for simple cases)
    let filteredUsers = allUsers

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      filteredUsers = filteredUsers.filter((u) => u.email.toLowerCase().includes(search))
    }

    if (filters?.productId) {
      filteredUsers = filteredUsers.filter((u) =>
        u.subscriptions.some((s) => s.productId === filters.productId),
      )
    }

    return filteredUsers
  }

  async getUserById(id: string) {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        subscriptions: {
          with: {
            plan: true,
            product: true,
          },
        },
      },
    })
  }

  async updateUser(
    id: string,
    data: {
      name?: string
      email?: string
      role?: string
    },
  ) {
    const [updated] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()

    return updated
  }

  // ==================== SUBSCRIPTIONS ====================

  async listSubscriptions(filters?: { status?: string; productId?: string; planId?: string }) {
    const conditions = []

    if (filters?.status) {
      conditions.push(eq(subscriptions.status, filters.status))
    }
    if (filters?.productId) {
      conditions.push(eq(subscriptions.productId, filters.productId))
    }
    if (filters?.planId) {
      conditions.push(eq(subscriptions.planId, filters.planId))
    }

    return this.db.query.subscriptions.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(subscriptions.createdAt)],
      with: {
        user: true,
        plan: true,
        product: true,
      },
    })
  }

  async getSubscriptionById(id: string) {
    return this.db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, id),
      with: {
        user: true,
        plan: true,
        product: true,
      },
    })
  }

  async updateSubscription(
    id: string,
    data: {
      status?: string
      planId?: string
      startDate?: Date
      endDate?: Date | null
    },
  ) {
    // If changing the plan, validate the new plan belongs to the same product
    if (data.planId) {
      const currentSubscription = await this.db.query.subscriptions.findFirst({
        where: eq(subscriptions.id, id),
      })

      if (!currentSubscription) {
        throw new Error('Subscription not found')
      }

      const newPlan = await this.db.query.plans.findFirst({
        where: eq(plans.id, data.planId),
      })

      if (!newPlan) {
        throw new Error('Plan not found')
      }

      // Ensure plan belongs to the same product
      if (newPlan.productId !== currentSubscription.productId) {
        throw new Error(
          'Cannot change to a plan from a different product. Please create a new subscription instead.',
        )
      }
    }

    const [updated] = await this.db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning()

    return updated
  }

  async cancelSubscription(id: string) {
    return this.updateSubscription(id, {
      status: 'canceled',
      endDate: new Date(),
    })
  }

  async createSubscription(data: {
    userId: string
    planId: string
    productId: string
    status?: string
    provider?: string
    startDate?: Date
    endDate?: Date
  }) {
    // Check if subscription already exists for this user-product combination
    // (regardless of status - enforcing database unique constraint)
    const existingSubscription = await this.db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, data.userId),
        eq(subscriptions.productId, data.productId),
      ),
    })

    if (existingSubscription) {
      throw new Error(
        `Subscription already exists for this user-product combination (ID: ${existingSubscription.id}, Status: ${existingSubscription.status}). ` +
          `Please use the update endpoint to modify the existing subscription.`,
      )
    }

    const [subscription] = await this.db
      .insert(subscriptions)
      .values({
        userId: data.userId,
        planId: data.planId,
        productId: data.productId,
        status: data.status || 'active',
        provider: data.provider || 'MANUAL',
        startDate: data.startDate || new Date(),
        endDate: data.endDate,
      })
      .returning()

    return subscription
  }

  // ==================== DASHBOARD STATS ====================

  async getDashboardStats() {
    // Use simple queries to count records
    const allProducts = await this.db.query.products.findMany({
      where: eq(products.isActive, true),
    })

    const allPlans = await this.db.query.plans.findMany()

    const allUsers = await this.db.query.users.findMany()

    const activeSubscriptions = await this.db.query.subscriptions.findMany({
      where: eq(subscriptions.status, 'active'),
    })

    const pendingSubscriptions = await this.db.query.subscriptions.findMany({
      where: eq(subscriptions.status, 'pending_verification'),
    })

    return {
      products: allProducts.length,
      plans: allPlans.length,
      users: allUsers.length,
      activeSubscriptions: activeSubscriptions.length,
      pendingSubscriptions: pendingSubscriptions.length,
    }
  }
}
