import { describe, expect, it } from "vitest";
import { apiKeyRouteParamsSchema, createApiKeyRequestSchema } from "./api-keys";

describe("api key schemas", () => {
    it("accepts a valid key creation request", () => {
        expect(createApiKeyRequestSchema.parse({ name: "Production worker" })).toEqual({
            name: "Production worker",
        });
    });

    it("rejects an invalid key route param", () => {
        expect(() => apiKeyRouteParamsSchema.parse({ keyId: "not-a-uuid" })).toThrow();
    });
});
