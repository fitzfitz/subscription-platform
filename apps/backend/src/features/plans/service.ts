import { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '@repo/db'

export class PlansService {
  private readonly db: DrizzleD1Database<typeof schema>

  constructor(db: DrizzleD1Database<typeof schema>) {
    this.db = db
  }
  async getActivePlans(productId: string) {
    const rawPlans = await this.db.query.plans.findMany({
      where: (plans, { eq, and }) => and(eq(plans.productId, productId), eq(plans.isActive, true)),
    })

    // Parse JSON limits field
    return rawPlans.map((plan) => ({
      ...plan,
      limits: typeof plan.limits === 'string' ? JSON.parse(plan.limits) : plan.limits,
      createdAt: plan.createdAt.toISOString(),
    }))
  }
}
