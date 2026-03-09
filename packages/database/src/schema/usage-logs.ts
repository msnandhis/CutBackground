import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const usageLogs = pgTable("usage_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    ipAddress: text("ip_address"),
    fingerprint: text("fingerprint"),
    toolName: text("tool_name").notNull(),
    action: text("action").notNull(),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
