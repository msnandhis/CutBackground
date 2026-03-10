import { Client } from "pg";

const databaseUrl =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:15432/cutbackground";

async function withClient<T>(task: (client: Client) => Promise<T>) {
    const client = new Client({
        connectionString: databaseUrl,
    });

    await client.connect();

    try {
        return await task(client);
    } finally {
        await client.end();
    }
}

export async function resetE2EDatabase() {
    await withClient(async (client) => {
        await client.query(`TRUNCATE TABLE
            api_keys,
            jobs,
            addon_jobs,
            usage_logs,
            account,
            session,
            verification,
            rate_limit,
            "user"
            RESTART IDENTITY CASCADE`);
    });
}

export async function markUserEmailVerified(email: string) {
    await withClient(async (client) => {
        await client.query(`UPDATE "user" SET email_verified = true WHERE email = $1`, [email]);
    });
}
