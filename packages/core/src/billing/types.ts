export interface CheckoutSession {
  sessionId: string;
  checkoutUrl: string;
  paymentId: string;
}

export interface PaymentResult {
  paymentId: string;
  customerId: string;
  status: "pending" | "succeeded" | "failed" | "cancelled";
  amount: number;
  currency: string;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookPayload {
  eventId: string;
  eventType: string;
  paymentId: string;
  customerId: string;
  status: "succeeded" | "failed" | "cancelled";
  amount: number;
  currency: string;
  productId: string;
  metadata?: Record<string, string>;
}

export interface PaymentProvider {
  createCheckoutSession(params: {
    planId: string;
    userId: string;
    userEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<CheckoutSession>;

  getPayment(paymentId: string): Promise<PaymentResult>;

  handleWebhook(payload: string, signature: string): Promise<WebhookPayload>;
}
