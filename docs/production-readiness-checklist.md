# Production Readiness Checklist

This checklist is the release gate for moving the app from internal alpha to a production deployment. A box stays unchecked until the implementation is verified in code and in the target environment.

## 1. Pre-Migration Hardening

- [x] Centralize runtime configuration and dependency checks for database, auth, queue, storage, and provider execution.
- [x] Remove eager Redis and R2 client initialization from import paths so missing infra does not silently bind to localhost.
- [x] Add a machine-runnable readiness check before migration and deployment.
- [x] Make dashboard and tool server loaders degrade predictably when auth or database runtime requirements are absent.
- [x] Add startup validation for the web server process so production boot fails fast on incomplete env.
- [x] Add startup validation for the worker process so queue workers cannot start with partial queue or provider config.
- [ ] Eliminate remaining implicit local-development database fallback from server runtime paths.
- [ ] Remove build-time database connection noise by making build-safe route/data evaluation fully infra-aware.

## 2. Database Rollout

- [ ] Review the generated migration in [packages/database/src/migrations/0000_smiling_goliath.sql](/Users/nandhis/Documents/Projects/WebApp.js/Domain_Tools/000_CutBackground/packages/database/src/migrations/0000_smiling_goliath.sql).
- [x] Apply the migration to a development database and verify all auth, jobs, and API key tables exist with expected indexes and constraints.
- [ ] Smoke-test signup, login, job creation, retry, and cancel flows against the migrated database.
- [ ] Define migration deployment order for app, worker, and database changes.
- [ ] Document rollback expectations for a failed migration deployment.

## 3. Auth and Session Hardening

- [ ] Replace log-only email verification and password reset handlers with real email delivery.
- [ ] Validate Better Auth production settings, cookie behavior, and trusted origins.
- [ ] Add explicit server-side authorization checks on all authenticated mutation routes.
- [ ] Add account/profile management flows instead of session-only auth surfaces.
- [ ] Add session revocation and device/session visibility if multi-device use is expected.

## 4. API and Domain Validation

- [ ] Add request schema validation for all mutation routes.
- [ ] Add consistent structured error responses with stable error codes.
- [ ] Add idempotency protection to mutating routes where retries are expected.
- [ ] Add API rate limiting and abuse protection for auth and tool execution routes.
- [ ] Finish API key issuance, hashing, revoke, and usage attribution flows.

## 5. Job Processing and Worker Operations

- [x] Implement a real queue worker that executes persisted jobs.
- [x] Persist processed outputs and provider metadata.
- [x] Support retry and cancel flows from the dashboard.
- [ ] Add worker heartbeat and queue health visibility.
- [ ] Add stale job recovery and dead-letter handling.
- [ ] Add explicit concurrency and backoff tuning for production workloads.
- [ ] Add support procedures for failed provider runs and stuck jobs.

## 6. Storage and Asset Lifecycle

- [x] Support local and R2-backed asset storage.
- [ ] Define retention and cleanup policy for original uploads and generated outputs.
- [ ] Define cache-control and signed URL lifetime policy.
- [ ] Add size-limit enforcement and storage monitoring for production workloads.
- [ ] Validate content-type and file-signature checks beyond browser-provided MIME types.

## 7. Frontend Product Completeness

- [x] Complete marketing, auth, tool, and dashboard route surfaces.
- [x] Replace tool-page-only mocks with persisted job execution flow.
- [ ] Add upload progress reporting and stronger tool-state feedback.
- [ ] Add pagination, search, and filtering for dashboard jobs.
- [ ] Surface queue/provider/runtime metadata in a more operator-friendly format.
- [ ] Finish API key management UI against real endpoints.

## 8. Testing and Quality Gates

- [ ] Add unit tests for env validation, provider execution, storage adapters, and job state transitions.
- [ ] Add integration tests for auth flows, job creation, job polling, retry, and cancel.
- [ ] Add migration smoke tests against a real disposable database.
- [ ] Add end-to-end coverage for the primary user journey from signup to successful output download.
- [ ] Fail CI on lint, build, and test regressions.

## 9. Production Operations

- [ ] Add health and readiness endpoints for app and worker processes.
- [ ] Add structured logging, error reporting, and alerting.
- [ ] Add deployment documentation for app, worker, database, Redis, and object storage.
- [ ] Define backup, restore, and incident response expectations.
- [ ] Add release checklist covering migration, worker rollout, and provider validation.

## Current Execution Order

1. Finish pre-migration hardening completely.
2. Apply and verify the first migration in a real database.
3. Close auth/API hardening gaps.
4. Add worker and ops visibility.
5. Add tests and CI gates.
6. Finish remaining UX and operator surfaces.
