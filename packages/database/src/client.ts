import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export function createClient() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error(
            "Missing DATABASE_URL environment variable."
        );
    }

    const pool = new Pool({
        connectionString: databaseUrl,
    });

    return drizzle(pool);
}
