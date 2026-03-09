const placeholderDatabaseUrl =
    "postgresql://placeholder:placeholder@127.0.0.1:9/placeholder";

export function getDatabaseUrl() {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    return placeholderDatabaseUrl;
}

export function isUsingLocalDevelopmentDatabaseFallback() {
    return !process.env.DATABASE_URL;
}
