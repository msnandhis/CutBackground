import "server-only";

import { db } from "@repo/database";
import { payments, plans } from "@repo/database";
import { and, eq } from "drizzle-orm";
import {
  isBillingConfigured,
  isDatabaseConfigured,
  isAuthConfigured,
} from "@repo/core/env";
import { createDodoPaymentsProvider } from "@repo/core/billing";
import { apiRouteError } from "@/lib/server/api";

export async function requireDashboardApiSession(request: Request) {
  if (!isDatabaseConfigured() || !isAuthConfigured()) {
    throw apiRouteError({
      status: 503,
      code: "SERVICE_UNAVAILABLE",
      message: "Authentication and database services are not configured.",
    });
  }

  const { auth } = await import("@repo/core/auth/server");

  let session = null;

  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch {
    session = null;
  }

  if (!session) {
    throw apiRouteError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "You must be signed in to access billing features.",
    });
  }

  return session;
}

export async function getAvailablePlans() {
  if (!isDatabaseConfigured()) {
    return [];
  }

  return db
    .select()
    .from(plans)
    .where(eq(plans.isActive, true))
    .orderBy(plans.priceCents);
}

export async function getPlanById(planId: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const result = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.isActive, true)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createCheckoutSession(params: {
  userId: string;
  userEmail: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!isBillingConfigured()) {
    throw apiRouteError({
      status: 503,
      code: "BILLING_NOT_CONFIGURED",
      message: "Payment processing is not available.",
    });
  }

  const plan = await getPlanById(params.planId);

  if (!plan) {
    throw apiRouteError({
      status: 404,
      code: "PLAN_NOT_FOUND",
      message: "The selected plan does not exist.",
    });
  }

  if (!plan.dodoProductId || !plan.dodoVariantId) {
    throw apiRouteError({
      status: 400,
      code: "PLAN_NOT_PURCHASABLE",
      message: "This plan cannot be purchased at this time.",
    });
  }

  const provider = createDodoPaymentsProvider();

  if (!provider) {
    throw apiRouteError({
      status: 503,
      code: "PAYMENT_PROVIDER_UNAVAILABLE",
      message: "Payment processing is temporarily unavailable.",
    });
  }

  const checkout = await provider.createCheckoutSession({
    planId: plan.dodoProductId,
    userId: params.userId,
    userEmail: params.userEmail,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    metadata: {
      planId: params.planId,
      credits: plan.credits.toString(),
    },
  });

  await db.insert(payments).values({
    userId: params.userId,
    planId: params.planId,
    provider: "dodo",
    providerSessionId: checkout.sessionId,
    amountCents: plan.priceCents,
    currency: plan.currency,
    credits: plan.credits,
    status: "pending",
  });

  return {
    checkoutUrl: checkout.checkoutUrl,
    sessionId: checkout.sessionId,
  };
}

export async function getPaymentBySessionId(sessionId: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.providerSessionId, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updatePaymentStatus(params: {
  sessionId: string;
  providerPaymentId: string;
  providerCustomerId: string;
  status: "succeeded" | "failed" | "cancelled";
}) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const [payment] = await db
    .update(payments)
    .set({
      providerPaymentId: params.providerPaymentId,
      providerCustomerId: params.providerCustomerId,
      status: params.status,
      completedAt: params.status === "succeeded" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(payments.providerSessionId, params.sessionId))
    .returning();

  return payment;
}
