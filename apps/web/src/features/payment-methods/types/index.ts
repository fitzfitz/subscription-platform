export interface PaymentMethod {
  id: string
  slug: string
  name: string
  type: 'manual' | 'automated'
  provider: string | null
  config: string | null
  isActive: boolean
  createdAt: string
}

export interface CreatePaymentMethodRequest {
  slug: string
  name: string
  type: 'manual' | 'automated'
  provider?: string
  config?: string
  isActive?: boolean
}

export interface UpdatePaymentMethodRequest {
  name?: string
  type?: 'manual' | 'automated'
  provider?: string | null
  config?: string | null
  isActive?: boolean
}

export interface ProductPaymentMethod extends PaymentMethod {
  displayOrder: number
  isDefault: boolean
}
