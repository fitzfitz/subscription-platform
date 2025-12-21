import { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '@repo/db'

export class PlansService {
  constructor(private readonly db: DrizzleD1Database<typeof schema>) {}

  async getActivePlans(productId: string) {
    return this.db.query.plans.findMany({
      where: (plans, { eq, and }) => and(eq(plans.productId, productId), eq(plans.isActive, true)),
    })
  }
}
