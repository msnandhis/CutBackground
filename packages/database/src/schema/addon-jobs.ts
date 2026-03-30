import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { jobs } from "./jobs";

export const addonJobs = pgTable(
  "addon_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentJobId: uuid("parent_job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    addonType: text("addon_type").notNull(),
    inputUrl: text("input_url").notNull(),
    outputUrl: text("output_url"),
    status: text("status").notNull().default("pending"),
    params: text("params"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("addon_jobs_parent_job_id_idx").on(table.parentJobId),
    index("addon_jobs_status_idx").on(table.status),
  ],
);
