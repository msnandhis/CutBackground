# Implementation Plan

## Phase 1: Monorepo Setup & Tooling (Turborepo)
- Initialize Turborepo with `pnpm` workspaces.
- Base Structure:
  - `apps/web`: Initialize Next.js App Router boilerplate.
  - `apps/mobile`: Initialize empty/placeholder Expo app for future use.
  - `packages/ui`: Shared Tailwind config, layout shell, and shadcn/ui components.
  - `packages/database`: Supabase client definitions, types generated via Supabase CLI.
  - `packages/core`: Core utilities (Redis, Cloudflare R2 presigned URLs, general validation schemas with Zod).
  - `packages/config-*`: Shared ESLint, Prettier, and TypeScript configs.

## Phase 2: Core Architecture & External Services Integration
- **Supabase**: 
  - Define migrations for tables (`usage_logs` with JSONB payloads, `jobs`).
  - Set up Row Level Security (RLS) policies.
- **Cloudflare R2**: 
  - Create standard bucket for tools. Configure CORS to allow direct uploads.
- **Redis (Rate Limiting & Queues)**: 
  - Set up connection in `packages/core/redis`.
  - Create `rateLimitUser(ip, fingerprint)` utility.
- **Logging & Background Jobs (Pino + BullMQ)**:
  - Setup `packages/core/logger` abstracting Pino structured JSON logs.
  - Setup `packages/core/jobs/logsWorker.ts` to batch-insert log queues into Supabase recursively.
  - Setup primary `packages/core/jobs/toolWorker.ts` to handle heavy tool processing tasks asynchronously.
- **Billing Abstraction**:
  - Define `PaymentProvider` interface in `packages/core/billing` to ensure easy switching between Stripe and LemonSqueezy later.

## Phase 3: Web Application Implementation (Feature-Based Approach)

### Configuration Layer
- Create `config/site.ts` (Theme, domain, SEO tags, Ad config).
- Create `config/tool.ts` (File limits, allowed Mime types, rate limit settings).

### Feature Modules (`apps/web/src/features`)
- **`tool/`**: 
  - Drag and drop file upload UI wrapped in `zod` validation.
  - API Routes: `/api/tool/presign`, `/api/tool/start` (Enqueues BullMQ Job), `/api/tool/status/[id]`.
  - Processing State component (React Query polling).
- **`marketing/`**:
  - Hero, Use Cases, How It Works, FAQ components.
  - MDX blog pipeline.
- **`admin/` (Placeholder)**:
  - Architecture ready for future internal dashboards.
- **`auth/` (Placeholder)**:
  - Architecture ready for future user sessions.
- **Public & Marketing Pages**:
  - `/[locale]/page.tsx` (Hero, Tool Interface, How It Works, Use Cases, related tools, Ad slots).
  - `/[locale]/faq/page.tsx`
  - `/[locale]/blog/...` using `next-mdx-remote` for content marketing.
- **API Routes**:
  - `/api/upload/presign`: Generates and returns a Cloudflare R2 presigned upload URL.
  - `/api/jobs/start`: Receives uploaded file ID/URL, validates limits, initiates processing job, and saves to the database.
  - `/api/jobs/status/[id]`: Returns the current SSE stream or polling response for the tool job.
  
### UI / UX Implementation (React Query)
- Drag and drop file upload interface wrapped in `zod` validation.
- Tool Processing State component that listens to the `status` endpoint.
- Success / Download Result component.
- Integrate `next-intl` wrapping across components.

## Phase 4: SEO Automation
- Setup Next.js `generateMetadata` dynamically mapping to `config/site.ts`.
- Implement `sitemap.ts` and `robots.ts` auto-generation.
- Create `/app/llms.txt.ts` route to output raw markdown representing the tool for AI Agents.
- Inject structured `JSON-LD` schemas into the `<head>` of the root layout.

## Phase 5: Deployment Configuration & Tooling
- **Docker / Coolify**: 
  - Create a multi-stage `Dockerfile` utilizing `output: 'standalone'` in `next.config.js`.
  - Add `.dockerignore` for minimal image size.
- **Netlify**:
  - Add `netlify.toml` configuring Next.js edge functions.
- **Vercel**:
  - Add `vercel.json` if custom redirects/headers are needed.

## Phase 6: Verification & Launch Readiness
- Review Lighthouse metrics for mobile/desktop.
- Verify that rate-limiting blocks requests appropriately using simulated Fingerprints/IPs.
- Confirm cross-package imports (e.g. `apps/web` can successfully import from `packages/ui`).
- Test local build using `docker build` and `docker run` to verify the standalone output works.
