import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    inputType: text("input_type").notNull(),
    inputUrl: text("input_url").notNull(),
    outputUrl: text("output_url"),
    status: text("status").notNull().default("pending"),
    provider: text("provider"),
    providerJobId: text("provider_job_id"),
    modelUsed: text("model_used"),
    errorMessage: text("error_message"),
    metadata: text("metadata"),
    ipAddress: text("ip_address"),
    fingerprint: text("fingerprint"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("jobs_status_idx").on(table.status),
    index("jobs_user_id_idx").on(table.userId),
    index("jobs_user_created_idx").on(table.userId, table.createdAt),
  ],
);
