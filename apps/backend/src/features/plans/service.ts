import { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '@repo/db'

export class PlansService {
  private readonly db: DrizzleD1Database<typeof schema>

  constructor(db: DrizzleD1Database<typeof schema>) {
    this.db = db
  }
  async getActivePlans(productId: string) {
    return this.db.query.plans.findMany({
      where: (plans, { eq, and }) => and(eq(plans.productId, productId), eq(plans.isActive, true)),
    })
  }
}
