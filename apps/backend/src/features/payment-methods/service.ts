import { DrizzleD1Database } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '@repo/db'
import { paymentMethods, productPaymentMethods } from '@repo/db'

export class PaymentMethodsService {
  private readonly db: DrizzleD1Database<typeof schema>

  constructor(db: DrizzleD1Database<typeof schema>) {
    this.db = db
  }

  // List all payment methods
  async listPaymentMethods() {
    return this.db.query.paymentMethods.findMany({
      orderBy: (methods, { asc }) => [asc(methods.name)],
    })
  }

  // Get single payment method by ID
  async getPaymentMethodById(id: string) {
    return this.db.query.paymentMethods.findFirst({
      where: (methods, { eq }) => eq(methods.id, id),
    })
  }

  // Create new payment method
  async createPaymentMethod(data: {
    slug: string
    name: string
    type: string
    provider?: string | null
    config?: string | null
    isActive?: boolean
  }) {
    // Validate slug format (lowercase alphanumeric + underscore only)
    if (!/^[a-z0-9_]+$/.test(data.slug)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and underscores')
    }

    // Validate JSON config if provided
    if (data.config) {
      try {
        JSON.parse(data.config)
      } catch (e) {
        throw new Error('Invalid JSON in config field')
      }
    }

    const [method] = await this.db
      .insert(paymentMethods)
      .values({
        slug: data.slug,
        name: data.name,
        type: data.type,
        provider: data.provider || null,
        config: data.config || null,
        isActive: data.isActive ?? true,
      })
      .returning()

    return method
  }

  // Update payment method
  async updatePaymentMethod(
    id: string,
    data: {
      name?: string
      type?: string
      provider?: string | null
      config?: string | null
      isActive?: boolean
    },
  ) {
    // Validate JSON config if provided
    if (data.config !== undefined && data.config !== null) {
      try {
        JSON.parse(data.config)
      } catch (e) {
        throw new Error('Invalid JSON in config field')
      }
    }

    const [updated] = await this.db
      .update(paymentMethods)
      .set({
        ...data,
        provider: data.provider === undefined ? undefined : data.provider || null,
        config: data.config === undefined ? undefined : data.config || null,
      })
      .where(eq(paymentMethods.id, id))
      .returning()

    return updated
  }

  // Delete payment method
  async deletePaymentMethod(id: string) {
    // Check if any products are using this payment method
    const productUsages = await this.db.query.productPaymentMethods.findMany({
      where: (ppm, { eq }) => eq(ppm.paymentMethodId, id),
    })

    // Check if any subscriptions are using this payment method
    const subscriptionUsages = await this.db.query.subscriptions.findMany({
      where: (subs, { eq }) => eq(subs.paymentMethodId, id),
    })

    if (productUsages.length > 0 || subscriptionUsages.length > 0) {
      throw new Error(
        `Cannot delete payment method: ${productUsages.length} product(s) and ${subscriptionUsages.length} subscription(s) are using it`,
      )
    }

    const [deleted] = await this.db
      .delete(paymentMethods)
      .where(eq(paymentMethods.id, id))
      .returning()

    return !!deleted
  }

  // Get payment methods available for a specific product
  async getProductPaymentMethods(productId: string) {
    const productMethods = await this.db.query.productPaymentMethods.findMany({
      where: (ppm, { eq }) => eq(ppm.productId, productId),
      with: {
        paymentMethod: true,
      },
      orderBy: (ppm, { asc }) => [asc(ppm.displayOrder)],
    })

    return productMethods
      .filter((pm) => pm.paymentMethod.isActive)
      .map((pm) => ({
        ...pm.paymentMethod,
        displayOrder: pm.displayOrder,
        isDefault: pm.isDefault,
      }))
  }

  // Update product payment methods configuration
  async updateProductPaymentMethods(
    productId: string,
    methods: Array<{
      paymentMethodId: string
      displayOrder: number
      isDefault: boolean
    }>,
  ) {
    // Delete existing configuration
    await this.db
      .delete(productPaymentMethods)
      .where(eq(productPaymentMethods.productId, productId))

    // Insert new configuration
    if (methods.length > 0) {
      await this.db.insert(productPaymentMethods).values(
        methods.map((m) => ({
          productId,
          paymentMethodId: m.paymentMethodId,
          displayOrder: m.displayOrder,
          isDefault: m.isDefault,
        })),
      )
    }

    // Return updated configuration
    return this.getProductPaymentMethods(productId)
  }
}
