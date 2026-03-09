import Replicate from "replicate";
import { assertRuntimeRequirements, getReplicateConfig } from "../env";

function getClient() {
    assertRuntimeRequirements("replicate");
    return new Replicate({ auth: getReplicateConfig()!.apiToken });
}

function extractOutputFile(output: unknown) {
    if (Array.isArray(output)) {
        return output[0];
    }

    return output;
}

export async function runBackgroundRemoval(params: {
    image: Buffer;
    filename: string;
}) {
    const replicate = getClient();
    const model = getReplicateConfig()!
        .model as `${string}/${string}` | `${string}/${string}:${string}`;

    const prediction = await replicate.predictions.create({
        model,
        input: {
            image: params.image,
        },
    });

    const completedPrediction = await replicate.wait(prediction, {
        interval: 1000,
    });

    const fileOutput = extractOutputFile(completedPrediction.output);

    if (
        !fileOutput ||
        typeof fileOutput !== "object" ||
        !("blob" in fileOutput) ||
        typeof fileOutput.blob !== "function"
    ) {
        throw new Error("Replicate did not return a file output.");
    }

    const blob = await fileOutput.blob();

    return {
        provider: "replicate",
        model,
        providerJobId: completedPrediction.id,
        providerStatus: completedPrediction.status,
        providerVersion: completedPrediction.version,
        logs: completedPrediction.logs || null,
        metrics: completedPrediction.metrics || null,
        startedAt: completedPrediction.started_at || null,
        completedAt: completedPrediction.completed_at || null,
        bytes: Buffer.from(await blob.arrayBuffer()),
        contentType: blob.type || "image/png",
    };
}

export async function cancelBackgroundRemoval(predictionId: string) {
    const replicate = getClient();
    return replicate.predictions.cancel(predictionId);
}
