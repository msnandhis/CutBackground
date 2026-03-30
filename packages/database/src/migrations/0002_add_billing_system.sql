-- Add billing and credit system tables

-- Plans table for pricing tiers
CREATE TABLE IF NOT EXISTS "plans" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "description" text,
    "credits" integer NOT NULL,
    "price_cents" integer NOT NULL,
    "currency" text NOT NULL DEFAULT 'USD',
    "is_active" boolean NOT NULL DEFAULT true,
    "is_popular" boolean NOT NULL DEFAULT false,
    "stripe_product_id" text,
    "stripe_price_id" text,
    "dodo_product_id" text,
    "dodo_variant_id" text,
    "paddle_product_id" text,
    "paddle_price_id" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "plans_is_active_idx" ON "plans" ("is_active");
CREATE INDEX IF NOT EXISTS "plans_stripe_product_id_idx" ON "plans" ("stripe_product_id");
CREATE INDEX IF NOT EXISTS "plans_dodo_product_id_idx" ON "plans" ("dodo_product_id");

-- User credits table for balance tracking
CREATE TABLE IF NOT EXISTS "user_credits" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "balance" integer NOT NULL DEFAULT 0,
    "total_purchased" integer NOT NULL DEFAULT 0,
    "total_used" integer NOT NULL DEFAULT 0,
    "last_purchased_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "user_credits_user_id_idx" ON "user_credits" ("user_id");

-- Credit transactions for audit trail
CREATE TABLE IF NOT EXISTS "credit_transactions" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "amount" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "type" text NOT NULL,
    "reference" text,
    "description" text,
    "payment_provider" text,
    "payment_id" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "credit_transactions_user_id_idx" ON "credit_transactions" ("user_id");
CREATE INDEX IF NOT EXISTS "credit_transactions_type_idx" ON "credit_transactions" ("type");
CREATE INDEX IF NOT EXISTS "credit_transactions_created_at_idx" ON "credit_transactions" ("created_at");
CREATE INDEX IF NOT EXISTS "credit_transactions_reference_idx" ON "credit_transactions" ("reference");

-- Payments table for tracking payment records
CREATE TABLE IF NOT EXISTS "payments" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "plan_id" text REFERENCES "plans"("id") ON DELETE SET NULL,
    "provider" text NOT NULL,
    "provider_payment_id" text,
    "provider_customer_id" text,
    "provider_session_id" text,
    "amount_cents" integer NOT NULL,
    "currency" text NOT NULL DEFAULT 'USD',
    "credits" integer NOT NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "metadata" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "completed_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "payments_user_id_idx" ON "payments" ("user_id");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" ("status");
CREATE INDEX IF NOT EXISTS "payments_provider_idx" ON "payments" ("provider");
CREATE INDEX IF NOT EXISTS "payments_provider_payment_id_idx" ON "payments" ("provider_payment_id");
CREATE INDEX IF NOT EXISTS "payments_created_at_idx" ON "payments" ("created_at");

-- Webhook events for idempotent processing
CREATE TABLE IF NOT EXISTS "webhook_events" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
    "provider" text NOT NULL,
    "provider_event_id" text,
    "event_type" text NOT NULL,
    "payload" text,
    "processed" boolean NOT NULL DEFAULT false,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "webhook_events_provider_idx" ON "webhook_events" ("provider");
CREATE INDEX IF NOT EXISTS "webhook_events_processed_idx" ON "webhook_events" ("processed");
CREATE INDEX IF NOT EXISTS "webhook_events_created_at_idx" ON "webhook_events" ("created_at");

-- Insert default plans
INSERT INTO "plans" ("id", "name", "description", "credits", "price_cents", "currency", "is_active", "is_popular") VALUES
    ('starter', 'Starter', 'Perfect for trying out', 100, 0, 'USD', true, false),
    ('pro', 'Pro', 'Best for regular users', 2500, 2900, 'USD', true, true),
    ('scale', 'Scale', 'For high-volume users', 10000, 9900, 'USD', true, false),
    ('enterprise', 'Enterprise', 'Custom volume for teams', 50000, 39900, 'USD', true, false)
ON CONFLICT ("id") DO NOTHING;