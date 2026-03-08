# CutBackground: Architecture & Plan

## Project Goal

Create a production-ready web application for AI-powered background removal from images and videos. Built as a scalable monorepo boilerplate that can be reused to launch multiple AI tool websites quickly.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | SSR, SEO, routing, server components |
| **Language** | TypeScript 5 | Type safety across the entire stack |
| **Styling** | Tailwind CSS 3.4 | Fast UI development, consistent design system |
| **State** | React Query (TanStack) | Client-side cache, polling, optimistic updates |
| **Validation** | Zod | Runtime validation for forms, API payloads, env vars |
| **Database** | Supabase | PostgreSQL, Auth, Row Level Security |
| **Auth** | Supabase Auth (SSR) | Session handling, user identity, OAuth |
| **Storage** | Cloudflare R2 | S3-compatible object storage for uploads/outputs |
| **Queue** | BullMQ + Redis | Background job processing, rate limiting, log batching |
| **Logging** | Pino | Fast, structured JSON logging with request context |
| **AI Provider** | Replicate (primary), fal.ai, Gemini, OpenRouter (future) | AI model inference via pluggable provider system |
| **Monorepo** | Turborepo + pnpm | Shared packages, parallel builds, caching |

## AI Provider Architecture

### Design Principle: Pluggable Provider System

All AI model calls go through an abstract `AIProvider` interface. This ensures:
- Easy switching between providers (Replicate, fal.ai, Gemini, OpenRouter)
- Fallback chains when a primary provider fails
- Per-operation cost tracking
- Webhook support for async predictions

### Provider Interface

```typescript
// packages/core/src/ai-provider/types.ts

interface AIProvider {
  name: string
  createPrediction(params: PredictionInput): Promise<PredictionResult>
  getPredictionStatus(id: string): Promise<PredictionStatus>
  cancelPrediction(id: string): Promise<void>
  supportsWebhook: boolean
}

interface PredictionInput {
  model: string                    // e.g., "851-labs/background-remover"
  version?: string                 // specific version hash
  input: Record<string, unknown>   // model-specific input
  webhookUrl?: string              // callback URL for async results
  webhookEvents?: string[]         // ["start", "completed"]
}

interface PredictionResult {
  id: string
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled"
  output?: unknown
  error?: string
  provider: string
}
```

### Replicate Configuration

**Primary Model (images):**
- `851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc`
- Cost: ~$0.00048/run, T4 GPU, ~3 seconds

**Fallback Model (images):**
- `lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1`

**Video Models (future):**
- Video background removal models will be added as they become available on Replicate

### Fallback Strategy

```
Request arrives
  -> Try Primary Model (851-labs/background-remover)
  -> If fails/timeout after 30s -> Try Fallback (lucataco/remove-bg)
  -> If both fail -> Return error with retry option
```

Deduplication: Each job gets a unique `idempotencyKey` (hash of file URL + user fingerprint + timestamp). Before creating a prediction, the system checks if one already exists in the `jobs` table with the same key.

### Webhook Flow

```
1. User uploads image to R2 -> gets presigned URL
2. API creates BullMQ job with file reference
3. BullMQ worker calls Replicate API with webhook URL
4. Replicate sends POST to /api/webhooks/replicate when done
5. Webhook handler updates job status in Supabase
6. Client polls /api/jobs/status/[id] or receives SSE update
```

Webhook URL format: `https://{domain}/api/webhooks/replicate?jobId={id}&secret={hmac}`

## Tool Processing: Images & Videos

### Input Types

| Type | Formats | Max Size | Processing |
|---|---|---|---|
| **Image** | PNG, JPG, JPEG, WebP | 10MB | Background removal, transparent PNG output |
| **Video** | MP4, WebM, MOV | 50MB | Frame-by-frame or model-based bg removal |

### Processing Pipeline

```
Input File (R2)
  -> Validate (type, size, format)
  -> Rate Limit Check (IP + fingerprint)
  -> Create Job Record (Supabase)
  -> Enqueue BullMQ Job
  -> Worker: Call AI Provider (with fallback)
  -> Store Output (R2)
  -> Update Job Status (Supabase)
  -> Notify Client (SSE/polling)
```

### Video Processing

Video background removal works in two modes:

1. **Model-based**: Send entire video to an AI model that handles it natively
2. **Frame-by-frame**: Extract frames, process each through image bg removal, reassemble

The system will start with model-based when available, falling back to frame-by-frame.

## Add-On Features Architecture

After the primary background removal, users can apply additional processing to the result:

### Available Add-Ons

| Add-On | Type | Description |
|---|---|---|
| **Upscale** | Image | Increase resolution of the bg-removed image (2x, 4x) |
| **Background Color** | Image | Add a solid color or gradient behind the subject |
| **Background Image** | Image | Place subject on a custom background |
| **Blur Background** | Image/Video | Keep subject sharp, blur the background |
| **Shadow** | Image | Add natural drop shadow to the isolated subject |
| **Crop to Subject** | Image | Auto-crop to the subject bounds |

### Add-On Architecture

```typescript
// packages/core/src/addons/types.ts

interface AddOn {
  id: string                        // "upscale" | "bg-color" | "bg-image" | "blur" | "shadow" | "crop"
  name: string
  type: "image" | "video" | "both"
  requiresAI: boolean               // true for upscale, false for bg-color
  params: Record<string, ZodSchema> // validated input params
  process(input: AddOnInput): Promise<AddOnOutput>
}

interface AddOnInput {
  sourceUrl: string                 // URL of the bg-removed result
  params: Record<string, unknown>   // add-on specific params (color, scale, etc.)
}
```

Add-ons that need AI (like upscale) go through the same AI provider system. Simple ones (like adding a background color) run as server-side canvas operations.

### Result Page UX Flow

```
Upload -> Processing -> Result Preview
                          |
                          v
                    [Download Original]
                          |
                    [Add-On Toolbar]
                    ├── Upscale (2x/4x)
                    ├── Add BG Color
                    ├── Add BG Image
                    ├── Add Shadow
                    └── Crop to Subject
                          |
                    [Apply] -> Re-process -> Updated Preview
                          |
                    [Download Final]
```

## Folder Structure (Updated)

```
apps/
├── web/
│   ├── config/
│   │   ├── site.ts                # Site identity, SEO, analytics
│   │   └── tool.ts                # Tool settings, file limits, rate limits
│   └── src/
│       ├── app/
│       │   ├── api/
│       │   │   ├── upload/presign/route.ts
│       │   │   ├── jobs/start/route.ts
│       │   │   ├── jobs/status/[id]/route.ts
│       │   │   ├── webhooks/replicate/route.ts
│       │   │   └── addons/apply/route.ts
│       │   └── page.tsx
│       └── features/
│           ├── tool/
│           │   ├── components/
│           │   │   ├── upload-zone.tsx
│           │   │   ├── processing-status.tsx
│           │   │   ├── result-preview.tsx
│           │   │   └── addon-toolbar.tsx
│           │   ├── hooks/
│           │   │   ├── use-upload.ts
│           │   │   ├── use-job-status.ts
│           │   │   └── use-addon.ts
│           │   └── index.ts
│           ├── marketing/
│           ├── admin/
│           ├── auth/
│           └── billing/
├── mobile/                          # Future React Native / Expo app

packages/
├── core/
│   ├── src/
│   │   ├── ai-provider/            # Pluggable AI provider system
│   │   │   ├── types.ts            # AIProvider interface, PredictionInput/Result types
│   │   │   ├── registry.ts         # Provider registry with fallback chain
│   │   │   ├── replicate.ts        # Replicate implementation
│   │   │   ├── fal.ts              # fal.ai implementation (future)
│   │   │   └── index.ts
│   │   ├── addons/                 # Add-on processing system
│   │   │   ├── types.ts            # AddOn interface
│   │   │   ├── registry.ts         # Add-on registry
│   │   │   ├── upscale.ts          # AI-based upscale
│   │   │   ├── bg-color.ts         # Canvas-based bg color
│   │   │   ├── bg-image.ts         # Canvas-based bg image
│   │   │   └── index.ts
│   │   ├── logger/
│   │   ├── redis/
│   │   ├── jobs/
│   │   │   ├── queues.ts           # BullMQ queue definitions
│   │   │   ├── tool-worker.ts      # Main tool processing worker
│   │   │   ├── addon-worker.ts     # Add-on processing worker
│   │   │   └── logs-worker.ts      # Log batching worker
│   │   ├── r2/
│   │   └── billing/
│   └── index.ts
├── database/
│   └── src/
│       ├── client.ts
│       ├── types.ts                # Updated with jobs, addons tables
│       └── index.ts
├── ui/
├── tsconfig/
└── eslint-config/
```

## Database Schema (Updated)

### `jobs` table

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| idempotency_key | text | Unique key to prevent duplicate requests |
| input_type | text | "image" or "video" |
| input_url | text | R2 URL of uploaded file |
| output_url | text | R2 URL of processed result |
| status | text | "pending", "processing", "succeeded", "failed", "canceled" |
| provider | text | "replicate", "fal", etc. |
| provider_prediction_id | text | External prediction ID |
| model_used | text | Model identifier used |
| error_message | text | Error details if failed |
| metadata | jsonb | Additional data (file size, processing time, etc.) |
| ip_address | text | Requester IP |
| fingerprint | text | Device fingerprint |
| created_at | timestamptz | Job creation time |
| completed_at | timestamptz | Job completion time |

### `addon_jobs` table

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| parent_job_id | uuid | FK to jobs.id |
| addon_type | text | "upscale", "bg-color", etc. |
| input_url | text | Source image URL (from parent job output) |
| output_url | text | Processed result URL |
| status | text | "pending", "processing", "succeeded", "failed" |
| params | jsonb | Add-on specific parameters |
| created_at | timestamptz | Creation time |

### `usage_logs` table

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| ip_address | text | Requester IP |
| fingerprint | text | Device fingerprint |
| tool_name | text | e.g., "background-remover" |
| action | text | "upload", "process", "addon", "download" |
| metadata | jsonb | Additional context |
| created_at | timestamptz | Log time |

## Rate Limiting

- Anonymous users: 5 image removals / hour, 2 video removals / hour
- Tracked by IP + fingerprint via Redis sliding window
- Add-ons share the same rate limit pool as the parent operation

## Environment Variables (Updated)

```env
# Replicate
REPLICATE_API_TOKEN=r8_...
REPLICATE_WEBHOOK_SECRET=whsec_...

# Primary Model
REPLICATE_MODEL_PRIMARY=851-labs/background-remover
REPLICATE_MODEL_PRIMARY_VERSION=a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc

# Fallback Model
REPLICATE_MODEL_FALLBACK=lucataco/remove-bg
REPLICATE_MODEL_FALLBACK_VERSION=95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Cloudflare R2
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=tool-uploads

# Redis
REDIS_URL=redis://localhost:6379

# Site
NEXT_PUBLIC_SITE_DOMAIN=cutbackground.com
NEXT_PUBLIC_TOOL_NAME=background-remover
```

## Security

- Replicate webhook requests are verified using HMAC signatures
- R2 presigned URLs expire after 5 minutes (upload) and 1 hour (download)
- Rate limiting on all API endpoints
- Input validation with Zod on all routes
- Row Level Security on Supabase
- Idempotency keys prevent duplicate processing
