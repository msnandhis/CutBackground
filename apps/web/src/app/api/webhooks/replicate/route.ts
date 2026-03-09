import { NextResponse } from "next/server";
import { completeToolJobFromReplicateWebhook } from "@repo/core/jobs";
import { verifyReplicateWebhook, type ReplicatePredictionPayload } from "@repo/core/ai-provider/replicate";

export async function POST(request: Request) {
    const rawBody = await request.text();

    try {
        const verified = verifyReplicateWebhook(rawBody, request.headers);

        if (!verified) {
            return NextResponse.json(
                {
                    error: {
                        code: "INVALID_WEBHOOK_SIGNATURE",
                        message: "The webhook signature is invalid.",
                    },
                },
                { status: 401 }
            );
        }

        const prediction = JSON.parse(rawBody) as ReplicatePredictionPayload;
        await completeToolJobFromReplicateWebhook(prediction);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json(
            {
                error: {
                    code: "WEBHOOK_PROCESSING_FAILED",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unable to process the Replicate webhook.",
                },
            },
            { status: 500 }
        );
    }
}
