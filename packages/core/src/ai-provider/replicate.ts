import { createHmac, timingSafeEqual } from "node:crypto";
import Replicate from "replicate";
import { assertRuntimeRequirements, getReplicateConfig, getServerAuthBaseUrl, getToolMockDelayMs, isMockToolExecutionEnabled } from "../env";

function getClient() {
    if (isMockToolExecutionEnabled()) {
        throw new Error("Replicate client is unavailable in mock execution mode.");
    }

    assertRuntimeRequirements("replicate");
    return new Replicate({ auth: getReplicateConfig()!.apiToken });
}

function getModel() {
    return getReplicateConfig()!
        .model as `${string}/${string}` | `${string}/${string}:${string}`;
}

function extractOutputFile(output: unknown) {
    if (Array.isArray(output)) {
        return output[0];
    }

    return output;
}

function extractOutputUrl(output: unknown) {
    const fileOutput = extractOutputFile(output);

    if (typeof fileOutput === "string") {
        return fileOutput;
    }

    if (
        fileOutput &&
        typeof fileOutput === "object" &&
        "url" in fileOutput &&
        typeof fileOutput.url === "function"
    ) {
        return fileOutput.url();
    }

    if (
        fileOutput &&
        typeof fileOutput === "object" &&
        "href" in fileOutput &&
        typeof fileOutput.href === "string"
    ) {
        return fileOutput.href;
    }

    return null;
}

async function predictionOutputToBuffer(output: unknown) {
    const fileOutput = extractOutputFile(output);

    if (
        !fileOutput ||
        typeof fileOutput !== "object" ||
        !("blob" in fileOutput) ||
        typeof fileOutput.blob !== "function"
    ) {
        const outputUrl = extractOutputUrl(output);

        if (!outputUrl) {
            throw new Error("Replicate did not return a file output.");
        }

        const response = await fetch(outputUrl);

        if (!response.ok) {
            throw new Error(`Unable to download Replicate output: ${response.status}`);
        }

        return {
            bytes: Buffer.from(await response.arrayBuffer()),
            contentType: response.headers.get("content-type") || "image/png",
            outputUrl,
        };
    }

    const blob = await fileOutput.blob();

    return {
        bytes: Buffer.from(await blob.arrayBuffer()),
        contentType: blob.type || "image/png",
        outputUrl: extractOutputUrl(output),
    };
}

function getWebhookUrl() {
    return `${getServerAuthBaseUrl().replace(/\/$/, "")}/api/webhooks/replicate`;
}

function decodeWebhookSecret(secret: string) {
    return secret.startsWith("whsec_") ? Buffer.from(secret.slice("whsec_".length), "base64") : Buffer.from(secret, "utf8");
}

function readHeader(headers: Headers, name: string) {
    return headers.get(name) || headers.get(name.toLowerCase());
}

function isValidTimestamp(timestampSeconds: number) {
    const toleranceSeconds = getReplicateConfig()?.webhookToleranceSeconds ?? 300;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return Math.abs(nowSeconds - timestampSeconds) <= toleranceSeconds;
}

function signatureMatches(expected: Buffer, provided: string) {
    const providedBuffer = Buffer.from(provided, "base64");

    if (providedBuffer.length !== expected.length) {
        return false;
    }

    return timingSafeEqual(providedBuffer, expected);
}

function verifyWebhookSignature(rawBody: string, headers: Headers, secret: string) {
    const webhookId = readHeader(headers, "webhook-id");
    const webhookTimestamp = readHeader(headers, "webhook-timestamp");
    const webhookSignature = readHeader(headers, "webhook-signature");

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
        return false;
    }

    const timestampSeconds = Number(webhookTimestamp);

    if (!Number.isFinite(timestampSeconds) || !isValidTimestamp(timestampSeconds)) {
        return false;
    }

    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const expected = createHmac("sha256", decodeWebhookSecret(secret))
        .update(signedContent)
        .digest();

    const signatures = webhookSignature
        .split(" ")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => entry.split(","))
        .flat()
        .map((entry) => entry.trim())
        .map((entry) => (entry.includes("=") ? entry.split("=")[1] : entry))
        .filter(Boolean);

    return signatures.some((signature) => signatureMatches(expected, signature));
}

export interface ReplicatePredictionPayload {
    id: string;
    status: string;
    version?: string | null;
    model?: string | null;
    output?: unknown;
    error?: string | null;
    logs?: string | null;
    metrics?: Record<string, unknown> | null;
    started_at?: string | null;
    completed_at?: string | null;
}

export async function createBackgroundRemovalPrediction(params: {
    image: Buffer;
    filename: string;
    webhook?: boolean;
}) {
    void params.filename;
    if (isMockToolExecutionEnabled()) {
        throw new Error("Webhook predictions are not available in mock execution mode.");
    }

    const replicate = getClient();
    const prediction = await replicate.predictions.create({
        model: getModel(),
        input: {
            image: params.image,
        },
        ...(params.webhook
            ? {
                  webhook: getWebhookUrl(),
                  webhook_events_filter: ["completed"],
              }
            : {}),
    });

    return prediction;
}

export async function runBackgroundRemoval(params: {
    image: Buffer;
    filename: string;
}) {
    if (isMockToolExecutionEnabled()) {
        const delayMs = getToolMockDelayMs();

        if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        return {
            provider: "mock",
            model: "mock/background-remover",
            providerJobId: `mock-${Date.now()}`,
            providerStatus: "succeeded",
            providerVersion: "mock-v1",
            logs: "Mock execution completed successfully.",
            metrics: {
                mocked: true,
                filename: params.filename,
            },
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            outputSourceUrl: null,
            bytes: params.image,
            contentType: "image/png",
        };
    }

    const prediction = await createBackgroundRemovalPrediction({
        image: params.image,
        filename: params.filename,
        webhook: false,
    });

    const replicate = getClient();
    const completedPrediction = await replicate.wait(prediction, {
        interval: 1000,
    });

    const output = await predictionOutputToBuffer(completedPrediction.output);

    return {
        provider: "replicate",
        model: getModel(),
        providerJobId: completedPrediction.id,
        providerStatus: completedPrediction.status,
        providerVersion: completedPrediction.version,
        logs: completedPrediction.logs || null,
        metrics: completedPrediction.metrics || null,
        startedAt: completedPrediction.started_at || null,
        completedAt: completedPrediction.completed_at || null,
        outputSourceUrl: output.outputUrl,
        bytes: output.bytes,
        contentType: output.contentType,
    };
}

export async function downloadPredictionOutput(output: unknown) {
    return predictionOutputToBuffer(output);
}

export async function cancelBackgroundRemoval(predictionId: string) {
    const replicate = getClient();
    return replicate.predictions.cancel(predictionId);
}

export function verifyReplicateWebhook(rawBody: string, headers: Headers) {
    if (isMockToolExecutionEnabled()) {
        return true;
    }

    const secret = getReplicateConfig()?.webhookSecret;

    if (!secret) {
        throw new Error("Replicate webhook secret is not configured.");
    }

    return verifyWebhookSignature(rawBody, headers, secret);
}
