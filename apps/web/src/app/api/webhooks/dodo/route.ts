import { NextResponse } from "next/server";
import { db } from "@repo/database";
import { payments, webhookEvents } from "@repo/database";
import { eq } from "drizzle-orm";
import { isBillingConfigured, isDatabaseConfigured } from "@repo/core/env";
import { createDodoPaymentsProvider } from "@repo/core/billing";
import { addCredits } from "@repo/core/credits";
import { logger } from "@repo/core/logger";

export async function POST(request: Request) {
  if (!isBillingConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "BILLING_NOT_CONFIGURED",
          message: "Billing is not configured.",
        },
      },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-dodo-signature") ?? "";

  const provider = createDodoPaymentsProvider();

  if (!provider) {
    return NextResponse.json(
      {
        error: {
          code: "PROVIDER_UNAVAILABLE",
          message: "Payment provider unavailable.",
        },
      },
      { status: 503 },
    );
  }

  try {
    const webhook = await provider.handleWebhook(rawBody, signature);

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          error: {
            code: "DATABASE_UNAVAILABLE",
            message: "Database is not configured.",
          },
        },
        { status: 503 },
      );
    }

    const existingEvent = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.providerEventId, webhook.eventId))
      .limit(1);

    if (existingEvent.length > 0) {
      logger.info(
        { eventId: webhook.eventId },
        "Webhook event already processed",
      );
      return new NextResponse(null, { status: 204 });
    }

    await db.insert(webhookEvents).values({
      provider: "dodo",
      providerEventId: webhook.eventId,
      eventType: webhook.eventType,
      payload: rawBody,
      processed: false,
    });

    if (webhook.status !== "succeeded") {
      logger.info(
        {
          eventId: webhook.eventId,
          paymentId: webhook.paymentId,
          status: webhook.status,
        },
        "Webhook received for non-successful payment",
      );

      await db
        .update(webhookEvents)
        .set({ processed: true, processedAt: new Date() })
        .where(eq(webhookEvents.providerEventId, webhook.eventId));

      return new NextResponse(null, { status: 204 });
    }

    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.providerPaymentId, webhook.paymentId))
      .limit(1);

    if (payment.length === 0) {
      logger.warn(
        {
          eventId: webhook.eventId,
          paymentId: webhook.paymentId,
        },
        "Payment not found for webhook",
      );

      await db
        .update(webhookEvents)
        .set({ processed: true, processedAt: new Date() })
        .where(eq(webhookEvents.providerEventId, webhook.eventId));

      return new NextResponse(null, { status: 204 });
    }

    const paymentRecord = payment[0];

    if (paymentRecord.status === "succeeded") {
      logger.info(
        {
          eventId: webhook.eventId,
          paymentId: webhook.paymentId,
        },
        "Payment already processed",
      );

      await db
        .update(webhookEvents)
        .set({ processed: true, processedAt: new Date() })
        .where(eq(webhookEvents.providerEventId, webhook.eventId));

      return new NextResponse(null, { status: 204 });
    }

    const planId = paymentRecord.planId;
    const credits = paymentRecord.credits;

    if (!planId || !credits) {
      logger.error(
        {
          eventId: webhook.eventId,
          paymentId: webhook.paymentId,
          planId,
          credits,
        },
        "Payment missing plan or credits",
      );

      await db
        .update(webhookEvents)
        .set({ processed: true, processedAt: new Date() })
        .where(eq(webhookEvents.providerEventId, webhook.eventId));

      return new NextResponse(null, { status: 204 });
    }

    await db
      .update(payments)
      .set({
        status: "succeeded",
        providerCustomerId: webhook.customerId,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentRecord.id));

    const result = await addCredits(
      paymentRecord.userId,
      credits,
      "purchase",
      webhook.paymentId,
      `Purchased ${credits} credits via DodoPayments`,
      "dodo",
      webhook.paymentId,
    );

    if (!result.success) {
      logger.error(
        {
          eventId: webhook.eventId,
          paymentId: webhook.paymentId,
          userId: paymentRecord.userId,
          credits,
          error: result.error,
        },
        "Failed to add credits after successful payment",
      );
    }

    await db
      .update(webhookEvents)
      .set({ processed: true, processedAt: new Date() })
      .where(eq(webhookEvents.providerEventId, webhook.eventId));

    logger.info(
      {
        eventId: webhook.eventId,
        paymentId: webhook.paymentId,
        userId: paymentRecord.userId,
        credits,
      },
      "Successfully processed payment webhook",
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "DodoPayments webhook processing error",
    );

    return NextResponse.json(
      {
        error: {
          code: "WEBHOOK_PROCESSING_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Unable to process the webhook.",
        },
      },
      { status: 500 },
    );
  }
}
