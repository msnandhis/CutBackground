import { logger } from "../logger";
import { getDodoPaymentsConfig } from "../env";
import type {
  PaymentProvider,
  CheckoutSession,
  PaymentResult,
  WebhookPayload,
} from "./types";

interface DodoCheckoutResponse {
  checkoutId: string;
  checkoutUrl: string;
  paymentId: string;
}

interface DodoPaymentResponse {
  paymentId: string;
  customerId: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "cancelled";
  amount: number;
  currency: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
}

interface DodoWebhookEvent {
  eventId: string;
  eventType: "payment.succeeded" | "payment.failed" | "payment.cancelled";
  data: {
    paymentId: string;
    customerId: string;
    amount: number;
    currency: string;
    productId: string;
    metadata?: Record<string, string>;
  };
}

export class DodoPaymentsProvider implements PaymentProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const config = getDodoPaymentsConfig();
    if (!config) {
      throw new Error("DodoPayments is not configured");
    }

    this.apiKey = config.apiKey;
    this.baseUrl =
      config.environment === "live"
        ? "https://api.dodopayments.com/v1"
        : "https://api.test.dodopayments.com/v1";
  }

  async createCheckoutSession(params: {
    planId: string;
    userId: string;
    userEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<CheckoutSession> {
    try {
      const response = await fetch(`${this.baseUrl}/checkouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          productId: params.planId,
          customerEmail: params.userEmail,
          successUrl: params.successUrl,
          cancelUrl: params.cancelUrl,
          metadata: {
            userId: params.userId,
            ...params.metadata,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error(
          {
            status: response.status,
            error,
            planId: params.planId,
            userId: params.userId,
          },
          "DodoPayments checkout creation failed",
        );

        throw new Error(
          `Failed to create checkout session: ${response.status}`,
        );
      }

      const data = (await response.json()) as DodoCheckoutResponse;

      return {
        sessionId: data.checkoutId,
        checkoutUrl: data.checkoutUrl,
        paymentId: data.paymentId,
      };
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : "Unknown error",
          planId: params.planId,
          userId: params.userId,
        },
        "DodoPayments checkout creation error",
      );

      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error(
          { status: response.status, error, paymentId },
          "DodoPayments payment fetch failed",
        );

        throw new Error(`Failed to get payment: ${response.status}`);
      }

      const data = (await response.json()) as DodoPaymentResponse;

      return {
        paymentId: data.paymentId,
        customerId: data.customerId,
        status: this.mapPaymentStatus(data.status),
        amount: data.amount,
        currency: data.currency,
        productId: data.productId,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : "Unknown error",
          paymentId,
        },
        "DodoPayments payment fetch error",
      );

      throw error;
    }
  }

  async handleWebhook(
    payload: string,
    signature: string,
  ): Promise<WebhookPayload> {
    try {
      const event = JSON.parse(payload) as DodoWebhookEvent;

      const webhookSecret = getDodoPaymentsConfig()?.webhookSecret;
      if (!webhookSecret) {
        logger.warn(
          { eventId: event.eventId },
          "DodoPayments webhook secret not configured",
        );
      }

      let status: "succeeded" | "failed" | "cancelled" = "failed";
      if (event.eventType === "payment.succeeded") {
        status = "succeeded";
      } else if (event.eventType === "payment.cancelled") {
        status = "cancelled";
      }

      return {
        eventId: event.eventId,
        eventType: event.eventType,
        paymentId: event.data.paymentId,
        customerId: event.data.customerId,
        status,
        amount: event.data.amount,
        currency: event.data.currency,
        productId: event.data.productId,
        metadata: event.data.metadata,
      };
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : "Unknown error" },
        "DodoPayments webhook parsing error",
      );

      throw new Error("Invalid webhook payload");
    }
  }

  private mapPaymentStatus(
    status: DodoPaymentResponse["status"],
  ): PaymentResult["status"] {
    switch (status) {
      case "succeeded":
        return "succeeded";
      case "failed":
        return "failed";
      case "cancelled":
        return "cancelled";
      case "processing":
      case "pending":
      default:
        return "pending";
    }
  }
}

export function createDodoPaymentsProvider(): DodoPaymentsProvider | null {
  const config = getDodoPaymentsConfig();
  if (!config) {
    return null;
  }

  return new DodoPaymentsProvider();
}
