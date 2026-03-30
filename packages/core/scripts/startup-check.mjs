import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { Client as PgClient } from "pg";
import Redis from "ioredis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

function loadEnvFile(filename) {
  const filepath = path.join(repoRoot, filename);

  if (!fs.existsSync(filepath)) {
    return;
  }

  const lines = fs.readFileSync(filepath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function fail(message) {
  console.error(`startup-check: ${message}`);
  process.exit(1);
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    fail(`missing required env var ${name}`);
  }

  return value;
}

function requireOneOf(names) {
  for (const name of names) {
    if (process.env[name]) {
      return process.env[name];
    }
  }

  fail(`missing one of required env vars: ${names.join(", ")}`);
}

function getEmailProvider() {
  return process.env.EMAIL_PROVIDER || "auto";
}

function requireEmailConfig() {
  requireEnv("EMAIL_FROM");

  const provider = getEmailProvider();

  if (provider === "resend") {
    requireEnv("RESEND_API_KEY");
    return;
  }

  if (provider === "brevo") {
    requireEnv("BREVO_API_KEY");
    return;
  }

  requireOneOf(["RESEND_API_KEY", "BREVO_API_KEY"]);
}

function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

function isMockToolExecution() {
  return process.env.TOOL_EXECUTION_MODE === "mock";
}

async function checkPostgres() {
  const databaseUrl = requireEnv("DATABASE_URL");

  if (isProductionEnvironment()) {
    const hasSsl =
      databaseUrl.includes("sslmode=") || databaseUrl.includes("ssl=");
    if (!hasSsl) {
      console.warn(
        "startup-check: WARNING - PostgreSQL connection in production without SSL. " +
          "Consider adding ?sslmode=require to DATABASE_URL.",
      );
    }
  }

  const client = new PgClient({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });

  await client.connect();
  await client.query("select 1");
  await client.end();
}

async function checkRedis() {
  const redisUrl = requireEnv("REDIS_URL");
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    const response = await redis.ping();

    if (response !== "PONG") {
      fail("redis ping did not return PONG");
    }
  } finally {
    redis.disconnect();
  }
}

async function main() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");

  const target = process.argv[2];

  if (!target || (target !== "web" && target !== "worker")) {
    fail(
      "usage: node --experimental-strip-types startup-check.mjs <web|worker>",
    );
  }

  await checkPostgres();

  if (target === "web") {
    requireEnv("BETTER_AUTH_SECRET");
    requireOneOf(["BETTER_AUTH_URL", "NEXT_PUBLIC_BETTER_AUTH_URL"]);

    if (isProductionEnvironment()) {
      requireEmailConfig();
    }

    if (process.env.ENABLE_BACKGROUND_QUEUE === "true") {
      await checkRedis();
    }

    console.log("startup-check: web runtime prerequisites are satisfied");
    return;
  }

  if (!isMockToolExecution()) {
    requireEnv("REPLICATE_API_TOKEN");
  }
  await checkRedis();

  if (isProductionEnvironment() && !isMockToolExecution()) {
    requireEnv("REPLICATE_WEBHOOK_SECRET");
    requireOneOf(["BETTER_AUTH_URL", "NEXT_PUBLIC_BETTER_AUTH_URL"]);
  }

  console.log("startup-check: worker runtime prerequisites are satisfied");
}

main().catch((error) => {
  fail(
    error instanceof Error ? error.message : "unknown startup validation error",
  );
});
