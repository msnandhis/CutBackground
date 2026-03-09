import type { createClient } from "./client";

export type Database = ReturnType<typeof createClient>;
