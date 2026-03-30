import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const plans = pgTable(
  "plans",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    credits: integer("credits").notNull(),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    isActive: boolean("is_active").notNull().default(true),
    isPopular: boolean("is_popular").notNull().default(false),
    stripeProductId: text("stripe_product_id"),
    stripePriceId: text("stripe_price_id"),
    dodoProductId: text("dodo_product_id"),
    dodoVariantId: text("dodo_variant_id"),
    paddleProductId: text("paddle_product_id"),
    paddlePriceId: text("paddle_price_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("plans_is_active_idx").on(table.isActive),
    index("plans_stripe_product_id_idx").on(table.stripeProductId),
    index("plans_dodo_product_id_idx").on(table.dodoProductId),
  ],
);

export const userCredits = pgTable(
  "user_credits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    balance: integer("balance").notNull().default(0),
    totalPurchased: integer("total_purchased").notNull().default(0),
    totalUsed: integer("total_used").notNull().default(0),
    lastPurchasedAt: timestamp("last_purchased_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("user_credits_user_id_idx").on(table.userId)],
);

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    type: text("type").notNull(),
    reference: text("reference"),
    description: text("description"),
    paymentProvider: text("payment_provider"),
    paymentId: text("payment_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("credit_transactions_user_id_idx").on(table.userId),
    index("credit_transactions_type_idx").on(table.type),
    index("credit_transactions_created_at_idx").on(table.createdAt),
    index("credit_transactions_reference_idx").on(table.reference),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: text("plan_id").references(() => plans.id, {
      onDelete: "set null",
    }),
    provider: text("provider").notNull(),
    providerPaymentId: text("provider_payment_id"),
    providerCustomerId: text("provider_customer_id"),
    providerSessionId: text("provider_session_id"),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    credits: integer("credits").notNull(),
    status: text("status").notNull().default("pending"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("payments_user_id_idx").on(table.userId),
    index("payments_status_idx").on(table.status),
    index("payments_provider_idx").on(table.provider),
    index("payments_provider_payment_id_idx").on(table.providerPaymentId),
    index("payments_created_at_idx").on(table.createdAt),
  ],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id"),
    eventType: text("event_type").notNull(),
    payload: text("payload"),
    processed: boolean("processed").notNull().default(false),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("webhook_events_provider_idx").on(table.provider),
    index("webhook_events_processed_idx").on(table.processed),
    index("webhook_events_created_at_idx").on(table.createdAt),
  ],
);
