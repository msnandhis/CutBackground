import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getDatabaseUrl } from "./env";
import * as schema from "./schema";

export function createClient() {
    const pool = new Pool({
        connectionString: getDatabaseUrl(),
    });

    return drizzle(pool, { schema });
}

export const db = createClient();
export type DatabaseClient = typeof db;
export { schema };
