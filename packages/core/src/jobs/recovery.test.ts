import { describe, expect, it } from "vitest";
import { getStaleJobAgeSeconds } from "./recovery";

describe("getStaleJobAgeSeconds", () => {
    it("returns null when workerStartedAt is missing", () => {
        expect(getStaleJobAgeSeconds({}, Date.now())).toBeNull();
    });

    it("calculates age in seconds from metadata", () => {
        const now = new Date("2026-03-09T12:00:30.000Z").getTime();
        const metadata = {
            workerStartedAt: "2026-03-09T12:00:00.000Z",
        };

        expect(getStaleJobAgeSeconds(metadata, now)).toBe(30);
    });
});
