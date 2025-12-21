import { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '@repo/db'
import { subscriptions } from '@repo/db'

export class SubscriptionsService {
  constructor(private readonly db: DrizzleD1Database<typeof schema>) {}

  async getByUserId(userId: string, productId: string) {
    return this.db.query.subscriptions.findFirst({
      where: (subs, { eq, and }) => and(eq(subs.userId, userId), eq(subs.productId, productId)),
      with: {
        plan: true,
      },
    })
  }

  async createUpgradeRequest(data: {
    userId: string
    planId: string
    productId: string
    paymentProofUrl?: string
    paymentNote?: string
  }) {
    const [newSub] = await this.db
      .insert(subscriptions)
      .values({
        userId: data.userId,
        planId: data.planId,
        productId: data.productId,
        status: 'pending_verification',
        paymentProofUrl: data.paymentProofUrl,
        paymentNote: data.paymentNote,
        updatedAt: new Date(),
        createdAt: new Date(),
      })
      .returning()

    return newSub
  }

  async findPlanBySlug(slug: string, productId: string) {
    return this.db.query.plans.findFirst({
      where: (p, { eq, and }) => and(eq(p.slug, slug), eq(p.productId, productId)),
    })
  }
}
