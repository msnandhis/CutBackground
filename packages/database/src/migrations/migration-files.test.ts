import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationDir = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(
    migrationDir,
    "./0000_smiling_goliath.sql"
);
const journalPath = path.resolve(migrationDir, "./meta/_journal.json");

describe("database migration files", () => {
    it("contains the expected core tables", () => {
        const sql = readFileSync(migrationPath, "utf8");

        expect(sql).toContain('CREATE TABLE "jobs"');
        expect(sql).toContain('CREATE TABLE "api_keys"');
        expect(sql).toContain('CREATE TABLE "user"');
    });

    it("is registered in the journal", () => {
        const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
            entries: Array<{ tag: string }>;
        };

        expect(journal.entries.some((entry) => entry.tag === "0000_smiling_goliath")).toBe(true);
    });
});
