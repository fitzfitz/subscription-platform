/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi } from 'vitest'
import { SubscriptionsService } from './service'

describe('SubscriptionsService', () => {
  const mockDb = {
    query: {
      subscriptions: {
        findFirst: vi.fn(),
      },
      plans: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'sub_123' }]),
      }),
    }),
  } as any

  const service = new SubscriptionsService(mockDb)

  it('should get subscription by user id', async () => {
    mockDb.query.subscriptions.findFirst.mockResolvedValue({ id: 'sub_1' })

    const result = await service.getByUserId('user_1', 'prod_1')

    expect(result).toEqual({ id: 'sub_1' })
    expect(mockDb.query.subscriptions.findFirst).toHaveBeenCalled()
  })

  it('should create an upgrade request', async () => {
    const data = {
      userId: 'user_1',
      planId: 'plan_1',
      productId: 'prod_1',
      paymentNote: 'Test note',
    }

    const result = await service.createUpgradeRequest(data)

    expect(result).toEqual({ id: 'sub_123' })
    expect(mockDb.insert).toHaveBeenCalled()
  })
})
