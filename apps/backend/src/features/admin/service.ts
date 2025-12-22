import { DrizzleD1Database } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '@repo/db'
import { subscriptions } from '@repo/db'

export class AdminService {
  private readonly db: DrizzleD1Database<typeof schema>

  constructor(db: DrizzleD1Database<typeof schema>) {
    this.db = db
  }

  async getPendingSubscriptions(productId?: string) {
    return this.db.query.subscriptions.findMany({
      where: (subs, { eq, and }) =>
        and(
          eq(subs.status, 'pending_verification'),
          productId ? eq(subs.productId, productId) : undefined,
        ),
      with: {
        plan: true,
      },
    })
  }

  async verifySubscription(subscriptionId: string, approve: boolean) {
    const status = approve ? 'active' : 'canceled'
    const now = new Date()

    const [updated] = await this.db
      .update(subscriptions)
      .set({
        status,
        startDate: approve ? now : undefined,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning()

    return updated
  }
}
