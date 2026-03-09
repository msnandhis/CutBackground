import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export function createClient() {
    const databaseUrl =
        process.env.DATABASE_URL ??
        "postgresql://postgres:postgres@127.0.0.1:5432/cutbackground";

    const pool = new Pool({
        connectionString: databaseUrl,
    });

    return drizzle(pool, { schema });
}

export const db = createClient();
export type DatabaseClient = typeof db;
export { schema };
