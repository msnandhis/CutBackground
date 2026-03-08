# Implementation Plan

## Phase 1: Monorepo Setup & Tooling [COMPLETE]
- [x] Initialize Turborepo with `pnpm` workspaces
- [x] `apps/web`: Next.js 16 App Router with Tailwind CSS
- [x] `apps/mobile`: Placeholder for future Expo app
- [x] `packages/ui`: Shared component library
- [x] `packages/tsconfig`, `packages/eslint-config`: Shared configs

## Phase 2: Homepage & Marketing [COMPLETE]
- [x] Navbar, Hero (solid dark bg), Trusted By (scrolling logos)
- [x] Use Cases (interactive tabs), How It Works (3-step)
- [x] Testimonials (amber/sky/magenta cards), CTA (sky-50 bg)
- [x] Footer (solid black, multi-column)
- [x] SEO metadata, Google Fonts, Tailwind design system

## Phase 3: Database Layer (Drizzle ORM + PostgreSQL)

### 3.1 Setup Drizzle ORM
- Install `drizzle-orm`, `drizzle-kit`, `pg` in `packages/database`
- Create `packages/database/src/client.ts`: Drizzle instance with `pg` Pool
- Create `packages/database/drizzle.config.ts`: migration config pointing to `DATABASE_URL`

### 3.2 Define Schema
- `packages/database/src/schema/auth.ts`: BetterAuth auto-managed tables (user, session, verification, account)
- `packages/database/src/schema/jobs.ts`: jobs table (id, userId, idempotencyKey, inputType, inputUrl, outputUrl, status, provider, providerJobId, modelUsed, errorMessage, metadata, ipAddress, fingerprint, createdAt, completedAt)
- `packages/database/src/schema/addon-jobs.ts`: addon_jobs table (id, parentJobId, addonType, inputUrl, outputUrl, status, params, createdAt)
- `packages/database/src/schema/usage-logs.ts`: usage_logs table (id, userId, ipAddress, fingerprint, toolName, action, metadata, createdAt)
- `packages/database/src/schema/index.ts`: barrel export

### 3.3 Migrations
- Run `npx drizzle-kit generate` to create initial migration
- Run `npx drizzle-kit migrate` to apply to PostgreSQL
- BetterAuth CLI: `npx @better-auth/cli generate` and `npx @better-auth/cli migrate` for auth tables

## Phase 4: Authentication (BetterAuth)

### 4.1 BetterAuth Server Setup
- Install `better-auth` in `packages/core`
- Create `packages/core/src/auth/auth.ts`:
  - `betterAuth()` instance with Drizzle adapter (`provider: "pg"`)
  - Enable `emailAndPassword` with `requireEmailVerification: true`
  - Configure `sendResetPassword` callback (via Resend/Nodemailer)
  - Add `magicLink` plugin with `sendMagicLink` callback
  - Session config: 7-day expiry, daily refresh
  - Rate limit config: 10 req/min on auth endpoints

### 4.2 BetterAuth Client Setup
- Create `packages/core/src/auth/auth-client.ts`:
  - `createAuthClient()` with `baseURL`
  - Export hooks: `useSession()`, `signIn`, `signUp`, `signOut`, `forgetPassword`, `resetPassword`

### 4.3 Next.js Route Handler
- Create `apps/web/src/app/api/auth/[...all]/route.ts`:
  - Import auth from `@repo/core/auth`
  - Export `{ POST, GET }` via `toNextJsHandler(auth)`

### 4.4 Auth Middleware
- Create `apps/web/middleware.ts`:
  - Protect routes: `/dashboard`, `/settings`, `/api/jobs`
  - Validate session via `auth.api.getSession({ headers })`
  - Redirect unauthenticated users to `/login`
  - Apply Redis rate limiting to all API routes

### 4.5 Auth Pages
- `apps/web/src/app/(auth)/login/page.tsx`: email/password + magic link option
- `apps/web/src/app/(auth)/signup/page.tsx`: email/password registration
- `apps/web/src/app/(auth)/forgot-password/page.tsx`: request reset email
- `apps/web/src/app/(auth)/reset-password/page.tsx`: set new password (via token from email)
- `apps/web/src/app/(auth)/verify-email/page.tsx`: email verification confirmation

### 4.6 Auth Feature Components
- `features/auth/components/login-form.tsx`: email + password fields, "Forgot password?" link, "Sign in with magic link" toggle
- `features/auth/components/signup-form.tsx`: email + password + confirm password, Zod validation
- `features/auth/components/forgot-password-form.tsx`: email input, submit sends reset link
- `features/auth/components/reset-password-form.tsx`: new password + confirm, validates token from URL
- `features/auth/components/magic-link-form.tsx`: email input, submit sends magic link

### 4.7 Email Service
- Install `resend` (or `nodemailer` for self-hosted SMTP)
- Create `packages/core/src/email/send.ts`: generic email sending utility
- Email templates: verification, magic link, password reset
- All emails include: brand header, clear CTA button, expiry notice

### 4.8 Security Hardening
- Session revocation on password change (BetterAuth: `revokeOtherSessions: true`)
- Brute force lockout after 5 failed login attempts (15 min cooldown)
- Magic link tokens: 15 min expiry, single-use
- Password reset tokens: 1 hour expiry, single-use
- CSRF protection: automatic via BetterAuth
- httpOnly + Secure + SameSite=Lax cookies

## Phase 5: AI Provider System

### 5.1 Provider Interface & Types
- Create `packages/core/src/ai-provider/types.ts`: AIProvider, AIJobInput, AIJobResult
- Create `packages/core/src/ai-provider/registry.ts`: provider registry with fallback chain
- Idempotency key: hash(fileUrl + fingerprint + timestamp)

### 5.2 Replicate Provider
- Install `replicate` npm package
- Create `packages/core/src/ai-provider/replicate.ts`: implements AIProvider
- Webhook URL injection on prediction creation
- Map Replicate responses to generic AIJobResult

### 5.3 Future Provider Stubs
- `packages/core/src/ai-provider/fal.ts`: stub for fal.ai
- `packages/core/src/ai-provider/openrouter.ts`: stub for OpenRouter

## Phase 6: Tool Processing & API Routes

### 6.1 Upload API
- `apps/web/src/app/api/upload/presign/route.ts`: validate file, generate R2 presigned URL

### 6.2 Job Start API
- `apps/web/src/app/api/jobs/start/route.ts`: validate, rate limit, create job in DB, enqueue BullMQ

### 6.3 BullMQ Tool Worker
- `packages/core/src/jobs/tool-worker.ts`: dequeue, call AI provider with fallback, store output, update status

### 6.4 Replicate Webhook
- `apps/web/src/app/api/webhooks/replicate/route.ts`: verify HMAC, update job, download output to R2

### 6.5 Job Status API
- `apps/web/src/app/api/jobs/status/[id]/route.ts`: return job status and output URL

## Phase 7: Add-On Features

### 7.1 Add-On Interface
- `packages/core/src/addons/types.ts`: AddOn interface with id, name, type, process()
- `packages/core/src/addons/registry.ts`: available add-ons by input type

### 7.2 Implementations
- `bg-color.ts`: server-side canvas, add solid color/gradient
- `crop.ts`: auto-crop to subject bounds
- `shadow.ts`: add drop shadow
- `upscale.ts`: AI-based upscale via provider system
- `bg-image.ts`: composite subject onto background

### 7.3 Add-On API + Worker
- `apps/web/src/app/api/addons/apply/route.ts`: validate, create addon_job, enqueue
- `packages/core/src/jobs/addon-worker.ts`: process add-on, upload result to R2

## Phase 8: Tool UI Components

### 8.1 Upload Zone
- Drag-and-drop + click-to-browse, file validation, upload progress

### 8.2 Processing Status
- React Query polling, animated progress, status text updates

### 8.3 Result Preview
- Checkerboard transparency, before/after slider, download button

### 8.4 Add-On Toolbar
- Horizontal toolbar: Upscale, BG Color, BG Image, Shadow, Crop
- Modal/panel for each with apply button

## Phase 9: SEO Automation
- `generateMetadata` from `config/site.ts`
- `sitemap.ts`, `robots.ts` auto-generation
- JSON-LD schemas (FAQ, HowTo)
- Blog pipeline with `next-mdx-remote`
- i18n with `next-intl`

## Phase 10: Deployment & DevOps
- Docker multi-stage build with `output: 'standalone'`
- `netlify.toml` for edge functions
- CI/CD with GitHub Actions

## Phase 11: Verification & Launch
- Lighthouse audit
- Auth flow testing: signup, login, magic link, forgot/reset password, logout
- Session security testing: cookie flags, CSRF, revocation
- Rate limit testing
- Replicate webhook verification
- End-to-end: upload, process, result, add-on, download
