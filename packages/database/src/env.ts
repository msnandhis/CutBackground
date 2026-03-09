const localDevelopmentDatabaseUrl =
    "postgresql://postgres:postgres@127.0.0.1:5432/cutbackground";

export function getDatabaseUrl() {
    return process.env.DATABASE_URL ?? localDevelopmentDatabaseUrl;
}

export function isUsingLocalDevelopmentDatabaseFallback() {
    return !process.env.DATABASE_URL;
}
