/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiKeyAuth } from './api-key-auth'
import { HTTPException } from 'hono/http-exception'
import bcrypt from 'bcryptjs'

// Mock database utilities
const mockFindFirst = vi.fn()
vi.mock('../db', () => ({
  createDb: vi.fn(() => ({
    query: {
      products: {
        findFirst: mockFindFirst,
      },
    },
  })),
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}))

describe('apiKeyAuth Middleware', () => {
  let mockContext: any
  let mockNext: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockContext = {
      req: {
        header: vi.fn(),
      },
      env: {},
      set: vi.fn(),
    }
    mockNext = vi.fn()
  })

  it('should throw 401 if API key is missing', async () => {
    mockContext.req.header.mockReturnValue(undefined)

    await expect(apiKeyAuth(mockContext, mockNext)).rejects.toThrow(HTTPException)
    await expect(apiKeyAuth(mockContext, mockNext)).rejects.toMatchObject({ status: 401 })
  })

  it('should throw 401 if product is not found', async () => {
    mockContext.req.header.mockReturnValue('prod_123_key')
    mockFindFirst.mockResolvedValue(null)

    await expect(apiKeyAuth(mockContext, mockNext)).rejects.toThrow(HTTPException)
    mockFindFirst.mockResolvedValue(null)
  })

  it('should verify key and call next() if valid', async () => {
    const key = 'prod_123_key'
    mockContext.req.header.mockReturnValue(key)
    mockFindFirst.mockResolvedValue({ id: 'prod', isActive: true, apiKeyHash: 'hash' })
    ;(bcrypt.compare as any).mockResolvedValue(true)

    await apiKeyAuth(mockContext, mockNext)

    expect(mockContext.set).toHaveBeenCalledWith('productId', 'prod')
    expect(mockNext).toHaveBeenCalled()
  })

  it('should throw 401 if key is invalid', async () => {
    const key = 'prod_123_key'
    mockContext.req.header.mockReturnValue(key)
    mockFindFirst.mockResolvedValue({ id: 'prod', isActive: true, apiKeyHash: 'hash' })
    ;(bcrypt.compare as any).mockResolvedValue(false)

    await expect(apiKeyAuth(mockContext, mockNext)).rejects.toThrow(HTTPException)
  })
})
