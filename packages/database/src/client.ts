import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getDatabaseUrlOrThrow } from "./env";
import * as schema from "./schema";

function createConfiguredClient() {
    const pool = new Pool({
        connectionString: getDatabaseUrlOrThrow(),
    });

    return drizzle(pool, { schema });
}

export type DatabaseClient = ReturnType<typeof createConfiguredClient>;

export function createClient() {
    if (!process.env.DATABASE_URL) {
        return new Proxy(
            {},
            {
                get() {
                    throw new Error("DATABASE_URL is not configured for the current process.");
                },
            }
        ) as DatabaseClient;
    }

    return createConfiguredClient();
}

export const db = createClient();
export { schema };
