-- Add performance indexes for common query patterns

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS "jobs_status_idx" ON "jobs" ("status");
CREATE INDEX IF NOT EXISTS "jobs_user_id_idx" ON "jobs" ("user_id");
CREATE INDEX IF NOT EXISTS "jobs_user_created_idx" ON "jobs" ("user_id", "created_at");

-- Usage logs indexes
CREATE INDEX IF NOT EXISTS "usage_logs_user_id_idx" ON "usage_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "usage_logs_tool_name_idx" ON "usage_logs" ("tool_name");
CREATE INDEX IF NOT EXISTS "usage_logs_created_at_idx" ON "usage_logs" ("created_at");

-- Session indexes
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");

-- Account indexes
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id");

-- Verification indexes
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");
CREATE INDEX IF NOT EXISTS "verification_expires_at_idx" ON "verification" ("expires_at");

-- Add-on jobs indexes
CREATE INDEX IF NOT EXISTS "addon_jobs_parent_job_id_idx" ON "addon_jobs" ("parent_job_id");
CREATE INDEX IF NOT EXISTS "addon_jobs_status_idx" ON "addon_jobs" ("status");

-- API keys indexes
CREATE INDEX IF NOT EXISTS "api_keys_user_id_idx" ON "api_keys" ("user_id");