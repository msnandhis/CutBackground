/**
 * Abstracted Payment Gateway Interface.
 *
 * This allows swapping between Stripe, LemonSqueezy, Paddle, etc.
 * by implementing this interface and changing the config.
 *
 * Not implemented yet — architecture placeholder for future billing features.
 */

export interface PaymentProvider {
    /** Create a checkout session for a given plan */
    createCheckoutSession(params: {
        planId: string;
        userId: string;
        successUrl: string;
        cancelUrl: string;
    }): Promise<{ url: string }>;

    /** Handle incoming webhook events from the provider */
    handleWebhook(payload: unknown, signature: string): Promise<WebhookEvent>;

    /** Get a customer's subscription status */
    getSubscriptionStatus(customerId: string): Promise<SubscriptionStatus>;

    /** Cancel a customer's subscription */
    cancelSubscription(subscriptionId: string): Promise<void>;
}

export interface WebhookEvent {
    type:
    | "checkout.completed"
    | "subscription.updated"
    | "subscription.cancelled"
    | "payment.failed";
    data: Record<string, unknown>;
}

export interface SubscriptionStatus {
    active: boolean;
    planId: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
}

export type PaymentProviderName = "stripe" | "lemonsqueezy" | "paddle";
