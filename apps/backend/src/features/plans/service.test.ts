/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi } from 'vitest'
import { PlansService } from './service'

describe('PlansService', () => {
  it('should fetch active plans for a product', async () => {
    const mockDb = {
      query: {
        plans: {
          findMany: vi.fn().mockResolvedValue([
            { id: '1', name: 'Plan 1', isActive: true },
            { id: '2', name: 'Plan 2', isActive: true },
          ]),
        },
      },
    } as any

    const service = new PlansService(mockDb)
    const result = await service.getActivePlans('test-product')

    expect(result).toHaveLength(2)
    expect(mockDb.query.plans.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Function),
      }),
    )
  })
})
