export function getDatabaseUrl() {
    return process.env.DATABASE_URL ?? null;
}

export function isUsingLocalDevelopmentDatabaseFallback() {
    return !process.env.DATABASE_URL;
}

export function getDatabaseUrlOrThrow() {
    const databaseUrl = getDatabaseUrl();

    if (!databaseUrl) {
        throw new Error("DATABASE_URL is not configured for the current process.");
    }

    return databaseUrl;
}
