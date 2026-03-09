import { Worker } from "bullmq";
import { assertRuntimeRequirements } from "../env";
import { getQueueConnection } from "./index";
import { processToolJobExecution } from "./process-tool-job";
import { logger } from "../logger";

export function startToolWorker() {
    assertRuntimeRequirements("background-queue");

    return new Worker(
        "tool-processing",
        async (job) => {
            await processToolJobExecution(String(job.data.jobId));
        },
        { connection: getQueueConnection() }
    );
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const worker = startToolWorker();

    worker.on("completed", (job) => {
        logger.info({ jobId: job.id }, "Tool worker completed job.");
    });

    worker.on("failed", (job, error) => {
        logger.error(
            {
                jobId: job?.id,
                error: error.message,
            },
            "Tool worker failed job."
        );
    });

    logger.info("Tool worker started.");
}
