export interface PendingSubscription {
  id: string
  userId: string
  status: string
  paymentProofUrl?: string | null
  paymentNote?: string | null
  plan?: {
    id: string
    name: string
  }
}

export interface VerifySubscriptionRequest {
  subscriptionId: string
  approve: boolean
}
