/**
 * Tool Configuration — Technical settings only.
 */
export const toolConfig = {
    name: "AI Background Remover",
    slug: "background-remover",
    description: "Remove backgrounds from any image instantly with AI.",

    /** Input */
    input: {
        type: "file" as "file" | "text" | "url",
        acceptedFormats: [".png", ".jpg", ".jpeg", ".webp"],
        acceptedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
        maxFileSizeMB: 10,
        maxFiles: 1,
    },

    /** Output */
    output: {
        type: "file" as "file" | "text" | "url",
        format: "png",
    },

    /** Rate limiting */
    rateLimit: {
        maxRequestsPerHour: 10,
        maxRequestsPerDay: 50,
        windowSeconds: 3600,
    },

    /** Processing */
    processing: {
        timeoutMs: 120_000,
        retries: 3,
    },
} as const;

export type ToolConfig = typeof toolConfig;
