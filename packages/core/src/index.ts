// @repo/core - Core Utilities
export { auth } from "./auth/auth";
export { logger, createRequestLogger } from "./logger";
export { getRedisClient } from "./redis";
export { getPresignedUploadUrl, getPresignedDownloadUrl } from "./r2";
export {
  cancelBackgroundRemoval,
  runBackgroundRemoval,
} from "./ai-provider/replicate";
export { isLocalToolAsset, readToolAsset, storeToolAsset } from "./storage";
export { sendTransactionalEmail } from "./mail";
export { logToolUsage, type ToolUsageAction } from "./usage-logging";
export {
  getUserCredits,
  hasCredits,
  deductCredits,
  addCredits,
  refundCredits,
  ensureUserCreditsRecord,
  type CreditBalance,
  type CreditTransactionType,
} from "./credits";
export {
  assertRuntimeRequirements,
  getProductionReadinessSummary,
  getRuntimeDependencyStatuses,
  isAuthConfigured,
  isBackgroundQueueConfigured,
  isDatabaseConfigured,
  isEmailConfigured,
  isR2Configured,
  isRedisConfigured,
  isReplicateConfigured,
  isBillingConfigured,
  getDodoPaymentsConfig,
  getBillingDependencyStatus,
} from "./env";
