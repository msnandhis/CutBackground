# Implementation Plan

## Phase 1: Monorepo Setup & Tooling [COMPLETE]
- [x] Initialize Turborepo with `pnpm` workspaces.
- [x] `apps/web`: Next.js 16 App Router with Tailwind CSS.
- [x] `apps/mobile`: Placeholder for future Expo app.
- [x] `packages/ui`: Shared component library (Button).
- [x] `packages/database`: Supabase client, typed schema.
- [x] `packages/core`: Logger (Pino), Redis, BullMQ, R2, Billing abstraction.
- [x] `packages/tsconfig`, `packages/eslint-config`: Shared configs.

## Phase 2: Homepage & Marketing [COMPLETE]
- [x] Navbar, Hero, Trusted By (scrolling logos), Use Cases (interactive tabs).
- [x] How It Works (3-step), Testimonials (amber/sky/magenta cards), CTA, Footer.
- [x] SEO metadata via `generateMetadata`, OpenGraph.
- [x] Google Fonts (Inter + Quicksand), Tailwind design system.

## Phase 3: AI Provider System (packages/core/ai-provider)

### 3.1 Provider Interface & Types
- Create `packages/core/src/ai-provider/types.ts`:
  - `AIProvider` interface: `createPrediction()`, `getPredictionStatus()`, `cancelPrediction()`
  - `PredictionInput`, `PredictionResult`, `PredictionStatus` types
  - `ProviderConfig` type with model, version, and fallback settings

### 3.2 Replicate Provider
- Create `packages/core/src/ai-provider/replicate.ts`:
  - Install `replicate` npm package
  - Implement `ReplicateProvider` class conforming to `AIProvider`
  - Support webhook URL injection on prediction creation
  - Handle both sync (polling) and async (webhook) modes
  - Map Replicate-specific response to generic `PredictionResult`

### 3.3 Provider Registry with Fallback
- Create `packages/core/src/ai-provider/registry.ts`:
  - `AIProviderRegistry` class managing named providers
  - `runWithFallback(providers[], input)`: try primary, fallback on failure
  - Idempotency key generation (hash of fileUrl + fingerprint + timestamp)
  - Duplicate detection: check `jobs` table before creating new prediction
  - Configurable timeout per provider (default 30s)

### 3.4 Future Providers (Stubs)
- Create `packages/core/src/ai-provider/fal.ts`: stub for fal.ai
- Create `packages/core/src/ai-provider/openrouter.ts`: stub for OpenRouter
- Barrel export from `packages/core/src/ai-provider/index.ts`

## Phase 4: Tool Processing & API Routes

### 4.1 Database Migrations
- Create Supabase migration for updated schema:
  - `jobs` table: id, idempotency_key, input_type, input_url, output_url, status, provider, provider_prediction_id, model_used, error_message, metadata, ip_address, fingerprint, created_at, completed_at
  - `addon_jobs` table: id, parent_job_id, addon_type, input_url, output_url, status, params, created_at
  - `usage_logs` table: id, ip_address, fingerprint, tool_name, action, metadata, created_at
  - RLS policies for public insert, service-role update

### 4.2 Upload API
- `apps/web/src/app/api/upload/presign/route.ts`:
  - Validate file type and size using `config/tool.ts`
  - Generate R2 presigned upload URL (5 min expiry)
  - Return presigned URL + unique file key

### 4.3 Job Start API
- `apps/web/src/app/api/jobs/start/route.ts`:
  - Validate request (Zod schema)
  - Rate limit check (Redis: IP + fingerprint)
  - Generate idempotency key, check for duplicates in `jobs` table
  - Create job record in Supabase (status: "pending")
  - Enqueue BullMQ job with file reference + job ID
  - Return job ID to client

### 4.4 BullMQ Tool Worker
- Update `packages/core/src/jobs/tool-worker.ts`:
  - Dequeue job, fetch file URL from Supabase
  - Detect input type (image vs video)
  - Call AI provider registry with fallback chain
  - For images: send R2 URL to Replicate (851-labs primary, lucataco fallback)
  - For videos: send to video-specific model or frame-by-frame processing
  - On success: upload output to R2, update job status + output_url
  - On failure: log error, update job status, retry up to 3 times

### 4.5 Replicate Webhook Handler
- `apps/web/src/app/api/webhooks/replicate/route.ts`:
  - Verify HMAC signature from Replicate
  - Extract jobId from query params
  - Update job status in Supabase based on webhook payload
  - If "succeeded": download output from Replicate, upload to R2, update output_url
  - If "failed": update error_message, optionally trigger fallback

### 4.6 Job Status API
- `apps/web/src/app/api/jobs/status/[id]/route.ts`:
  - Fetch job from Supabase by ID
  - Return current status, output_url if completed
  - Support SSE streaming for real-time updates (optional, polling as default)

## Phase 5: Add-On Features System

### 5.1 Add-On Interface & Registry
- Create `packages/core/src/addons/types.ts`:
  - `AddOn` interface: id, name, type, requiresAI, params schema, process()
  - `AddOnInput`, `AddOnOutput` types
- Create `packages/core/src/addons/registry.ts`:
  - `AddOnRegistry` class managing available add-ons
  - `getAvailableAddOns(inputType)`: returns add-ons for image or video

### 5.2 Non-AI Add-Ons (Server-Side Canvas)
- `packages/core/src/addons/bg-color.ts`: add solid color/gradient behind subject
- `packages/core/src/addons/crop.ts`: auto-crop to subject bounds
- `packages/core/src/addons/shadow.ts`: add drop shadow

### 5.3 AI-Powered Add-Ons
- `packages/core/src/addons/upscale.ts`: call upscale model via AI provider
- `packages/core/src/addons/bg-image.ts`: composite subject onto background image

### 5.4 Add-On API Route
- `apps/web/src/app/api/addons/apply/route.ts`:
  - Validate request (parent_job_id, addon_type, params)
  - Rate limit check
  - Create `addon_jobs` record
  - Enqueue BullMQ addon job
  - Return addon job ID

### 5.5 BullMQ Add-On Worker
- Create `packages/core/src/jobs/addon-worker.ts`:
  - Dequeue add-on job
  - Fetch source image from parent job output_url
  - Run the add-on processor
  - Upload result to R2
  - Update addon_jobs status + output_url

## Phase 6: Tool UI Components

### 6.1 Upload Zone
- `features/tool/components/upload-zone.tsx`:
  - Drag-and-drop with click-to-browse
  - File type/size validation (client-side with Zod)
  - Upload progress bar (direct to R2)
  - Support both image and video upload

### 6.2 Processing Status
- `features/tool/components/processing-status.tsx`:
  - React Query polling on `/api/jobs/status/[id]`
  - Animated progress indicator
  - Status text: "Uploading...", "Processing...", "Almost done..."

### 6.3 Result Preview
- `features/tool/components/result-preview.tsx`:
  - Display bg-removed image on checkerboard transparency
  - Before/After slider comparison
  - Download button (transparent PNG)

### 6.4 Add-On Toolbar
- `features/tool/components/addon-toolbar.tsx`:
  - Horizontal toolbar below result preview
  - Buttons: Upscale, Add BG Color, Add BG Image, Add Shadow, Crop
  - Each opens a modal/panel with add-on specific options
  - Apply button triggers add-on processing
  - Updated preview after add-on completes

### 6.5 React Query Hooks
- `features/tool/hooks/use-upload.ts`: manage presign + upload flow
- `features/tool/hooks/use-job-status.ts`: poll job status with React Query
- `features/tool/hooks/use-addon.ts`: trigger and track add-on processing

## Phase 7: SEO Automation
- Next.js `generateMetadata` dynamically mapping to `config/site.ts`.
- `sitemap.ts` and `robots.ts` auto-generation.
- `/app/llms.txt/route.ts` for AI crawler guidance.
- Structured `JSON-LD` schemas (FAQ, HowTo) in root layout.
- Blog pipeline with `next-mdx-remote`.
- i18n with `next-intl`.

## Phase 8: Deployment & DevOps
- **Docker/Coolify**: Multi-stage `Dockerfile` with `output: 'standalone'`.
- **Netlify**: `netlify.toml` with edge function config.
- **Vercel**: `vercel.json` for custom headers/redirects.
- CI/CD with GitHub Actions (lint, build, deploy).

## Phase 9: Verification & Launch
- Lighthouse audit (mobile + desktop).
- Rate limit integration testing.
- Replicate webhook verification.
- Cross-package import validation.
- Docker build and run test.
- End-to-end flow: upload -> process -> result -> add-on -> download.
