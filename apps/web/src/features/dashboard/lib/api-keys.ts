import { z } from "zod";

export const apiKeyNameSchema = z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(48, "Name must be 48 characters or fewer.");

export const createApiKeyRequestSchema = z.object({
    name: apiKeyNameSchema,
});

export const apiKeyRouteParamsSchema = z.object({
    keyId: z.string().uuid(),
});

export type CreateApiKeyRequest = z.infer<typeof createApiKeyRequestSchema>;
