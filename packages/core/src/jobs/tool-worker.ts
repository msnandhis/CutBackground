import { Worker } from "bullmq";
import {
  assertRuntimeRequirements,
  isMockToolExecutionEnabled,
  isProductionRuntime,
} from "../env";
import { getQueueConnection } from "./index";
import { recoverStaleJobsIfNeeded } from "./index";
import { processToolJobExecution } from "./process-tool-job";
import { logger } from "../logger";

export function startToolWorker() {
  assertRuntimeRequirements("background-queue");

  if (isMockToolExecutionEnabled() && isProductionRuntime()) {
    throw new Error(
      "Mock tool execution mode is not allowed in production. " +
        "Set TOOL_EXECUTION_MODE=replicate and configure REPLICATE_API_TOKEN.",
    );
  }

  if (isMockToolExecutionEnabled()) {
    logger.warn(
      "Tool worker is running in MOCK mode. Jobs will not call the real AI provider. " +
        "This should only be used for development and testing.",
    );
  }

  return new Worker(
    "tool-processing",
    async (job) => {
      await processToolJobExecution(String(job.data.jobId));
    },
    { connection: getQueueConnection() },
  );
}

async function main() {
  await recoverStaleJobsIfNeeded();
  const worker = startToolWorker();
  const recoveryInterval = setInterval(
    async () => {
      await recoverStaleJobsIfNeeded();
    },
    5 * 60 * 1000,
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Tool worker completed job.");
  });

  worker.on("failed", (job, error) => {
    logger.error(
      {
        jobId: job?.id,
        error: error.message,
      },
      "Tool worker failed job.",
    );
  });

  logger.info("Tool worker started.");

  const shutdown = async () => {
    clearInterval(recoveryInterval);
    await worker.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    logger.error({ err }, "Tool worker failed to start.");
    process.exit(1);
  });
}
