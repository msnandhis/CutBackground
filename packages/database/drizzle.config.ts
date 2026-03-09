import type { Config } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL for Drizzle config.");
}

export default {
    schema: "./src/schema/index.ts",
    out: "./src/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: databaseUrl,
    },
} satisfies Config;
