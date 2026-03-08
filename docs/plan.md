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
| **Database** | PostgreSQL (self-hosted) | Relational data store |
| **ORM** | Drizzle ORM | Type-safe, SQL-like ORM with migrations |
| **Auth** | BetterAuth | Self-hosted auth with server-side sessions |
| **Storage** | Cloudflare R2 | S3-compatible object storage for uploads/outputs |
| **Queue** | BullMQ + Redis | Background job processing, rate limiting, log batching |
| **Logging** | Pino | Fast, structured JSON logging with request context |
| **AI Provider** | Replicate (primary), fal.ai, Gemini, OpenRouter (future) | AI model inference via pluggable provider system |
| **Monorepo** | Turborepo + pnpm | Shared packages, parallel builds, caching |

---

## Authentication: BetterAuth + Drizzle

### Why BetterAuth

- **Self-hosted**: Full ownership of user data and auth logic
- **Server-side sessions**: Secure httpOnly cookies, not localStorage JWTs
- **CSRF protection**: Built-in on all auth endpoints
- **Session rotation**: Automatic on privilege changes (password change, role update)
- **Brute force protection**: Account lockout after repeated failed attempts
- **TypeScript-first**: Full type safety with the Drizzle adapter
- **Plugin system**: Extensible with magic-link, email-verification, forgot-password plugins

### Auth Flows

| Flow | Description | Security |
|---|---|---|
| **Email + Password Signup** | User registers with email/password. Email verification sent. | Argon2 hashing, email verification required |
| **Email + Password Login** | User logs in with verified credentials. Session created. | CSRF token, httpOnly cookie, brute force lockout |
| **Magic Link Login** | User enters email, receives one-time login link | Time-limited token (15 min), single-use, httpOnly session |
| **Forgot Password** | User requests reset email with secure token | Time-limited token (1 hour), single-use |
| **Reset Password** | User clicks reset link, sets new password | Invalidates all existing sessions on password change |
| **Logout** | Destroys server-side session, clears cookie | Session revoked from DB |

### Session Management

- Sessions stored in PostgreSQL via Drizzle (server-side, not JWT)
- Session token set as httpOnly, Secure, SameSite=Lax cookie
- Default expiration: 7 days, auto-refresh on activity
- On password change: all other sessions are revoked
- Rate limiting applied to all auth endpoints via Redis

### BetterAuth Configuration

```typescript
// packages/core/src/auth/auth.ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { magicLink } from "better-auth/plugins"
import { db } from "@repo/database"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // Send via email service (Resend/Nodemailer)
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Send via email service
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
  rateLimit: {
    window: 60,  // 1 minute window
    max: 10,     // max 10 requests per window
  },
})
```

### Next.js Integration

```typescript
// apps/web/src/app/api/auth/[...all]/route.ts
import { auth } from "@repo/core/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { POST, GET } = toNextJsHandler(auth)
```

### Client-Side Auth

```typescript
// packages/core/src/auth/auth-client.ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
})

// Available hooks:
// authClient.useSession()
// authClient.signIn.email()
// authClient.signUp.email()
// authClient.signIn.magicLink()
// authClient.forgetPassword()
// authClient.resetPassword()
// authClient.signOut()
```

### Auth Middleware (Route Protection)

```typescript
// apps/web/middleware.ts
import { auth } from "@repo/core/auth"
import { NextRequest, NextResponse } from "next/server"

const protectedPaths = ["/dashboard", "/settings", "/api/jobs"]

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}
```

---

## Database: Drizzle ORM + Self-Hosted PostgreSQL

### Schema Overview

BetterAuth auto-manages its own tables (`user`, `session`, `verification`, `account`). Application tables are defined alongside:

```typescript
// packages/database/src/schema/index.ts

// BetterAuth tables (auto-managed)
// - user
// - session
// - verification
// - account

// Application tables
export { jobs } from "./jobs"
export { addonJobs } from "./addon-jobs"
export { usageLogs } from "./usage-logs"
```

### `jobs` Table

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| userId | text (nullable) | FK to user.id (null for anonymous) |
| idempotencyKey | text | Unique key to prevent duplicate requests |
| inputType | text | "image" or "video" |
| inputUrl | text | R2 URL of uploaded file |
| outputUrl | text | R2 URL of processed result |
| status | text | "pending", "processing", "succeeded", "failed", "canceled" |
| provider | text | "replicate", "fal", etc. |
| providerPredictionId | text | External prediction ID |
| modelUsed | text | Model identifier used |
| errorMessage | text | Error details if failed |
| metadata | jsonb | Additional data (file size, processing time, etc.) |
| ipAddress | text | Requester IP |
| fingerprint | text | Device fingerprint |
| createdAt | timestamptz | Job creation time |
| completedAt | timestamptz | Job completion time |

### `addon_jobs` Table

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| parentJobId | uuid | FK to jobs.id |
| addonType | text | "upscale", "bg-color", etc. |
| inputUrl | text | Source image URL |
| outputUrl | text | Processed result URL |
| status | text | "pending", "processing", "succeeded", "failed" |
| params | jsonb | Add-on specific parameters |
| createdAt | timestamptz | Creation time |

### `usage_logs` Table

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| userId | text (nullable) | FK to user.id |
| ipAddress | text | Requester IP |
| fingerprint | text | Device fingerprint |
| toolName | text | e.g., "background-remover" |
| action | text | "upload", "process", "addon", "download" |
| metadata | jsonb | Additional context |
| createdAt | timestamptz | Log time |

---

## AI Provider Architecture

### Design Principle: Pluggable Provider System

All AI model calls go through an abstract `AIProvider` interface:

```typescript
// packages/core/src/ai-provider/types.ts

interface AIProvider {
  name: string
  createPrediction(params: PredictionInput): Promise<PredictionResult>
  getPredictionStatus(id: string): Promise<PredictionStatus>
  cancelPrediction(id: string): Promise<void>
  supportsWebhook: boolean
}
```

### Replicate Configuration

**Primary Model (images):**
- `851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc`
- Cost: ~$0.00048/run, T4 GPU, ~3 seconds

**Fallback Model (images):**
- `lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1`

### Fallback Strategy

```
Request -> Try Primary (851-labs) -> If fails/timeout 30s -> Try Fallback (lucataco) -> If both fail -> Error + retry
```

### Webhook Flow

```
1. User uploads image to R2
2. API creates BullMQ job
3. Worker calls Replicate with webhook URL
4. Replicate POSTs to /api/webhooks/replicate on completion
5. Webhook handler updates job in PostgreSQL
6. Client polls /api/jobs/status/[id]
```

---

## Add-On Features

After background removal, users can apply add-ons to the result:

| Add-On | Type | AI Required | Description |
|---|---|---|---|
| **Upscale** | Image | Yes | 2x/4x resolution via AI model |
| **BG Color** | Image | No | Add solid color/gradient behind subject |
| **BG Image** | Image | No | Place subject on custom background |
| **Shadow** | Image | No | Add natural drop shadow |
| **Crop** | Image | No | Auto-crop to subject bounds |

---

## Folder Structure

```
apps/
├── web/
│   ├── config/
│   │   ├── site.ts
│   │   └── tool.ts
│   └── src/
│       ├── app/
│       │   ├── api/
│       │   │   ├── auth/[...all]/route.ts     # BetterAuth handler
│       │   │   ├── upload/presign/route.ts
│       │   │   ├── jobs/start/route.ts
│       │   │   ├── jobs/status/[id]/route.ts
│       │   │   ├── webhooks/replicate/route.ts
│       │   │   └── addons/apply/route.ts
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   ├── signup/page.tsx
│       │   │   ├── forgot-password/page.tsx
│       │   │   ├── reset-password/page.tsx
│       │   │   └── verify-email/page.tsx
│       │   ├── dashboard/page.tsx
│       │   └── page.tsx
│       ├── features/
│       │   ├── tool/
│       │   ├── marketing/
│       │   ├── auth/
│       │   │   ├── components/
│       │   │   │   ├── login-form.tsx
│       │   │   │   ├── signup-form.tsx
│       │   │   │   ├── forgot-password-form.tsx
│       │   │   │   ├── reset-password-form.tsx
│       │   │   │   └── magic-link-form.tsx
│       │   │   └── hooks/
│       │   │       └── use-auth.ts
│       │   ├── admin/
│       │   └── billing/
│       └── middleware.ts                       # Auth + rate limit middleware

packages/
├── core/
│   ├── src/
│   │   ├── auth/
│   │   │   ├── auth.ts                        # BetterAuth server instance
│   │   │   ├── auth-client.ts                 # BetterAuth React client
│   │   │   └── index.ts
│   │   ├── ai-provider/
│   │   ├── addons/
│   │   ├── logger/
│   │   ├── redis/
│   │   ├── jobs/
│   │   ├── r2/
│   │   └── billing/
├── database/
│   ├── src/
│   │   ├── schema/
│   │   │   ├── auth.ts                        # BetterAuth-managed tables
│   │   │   ├── jobs.ts
│   │   │   ├── addon-jobs.ts
│   │   │   ├── usage-logs.ts
│   │   │   └── index.ts
│   │   ├── migrations/
│   │   ├── client.ts                          # Drizzle + pg client
│   │   └── index.ts
│   ├── drizzle.config.ts
│   └── package.json
├── ui/
├── tsconfig/
└── eslint-config/
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| Auth (login/signup) | 10 requests | 1 minute |
| Image bg removal | 5 jobs | 1 hour |
| Video bg removal | 2 jobs | 1 hour |
| Add-ons | 10 applications | 1 hour |
| File upload | 10 uploads | 1 hour |

Tracked by: IP + device fingerprint (anonymous) or userId (authenticated) via Redis sliding window.

---

## Environment Variables

```env
# BetterAuth
BETTER_AUTH_SECRET=                         # 32+ char secret (openssl rand -base64 32)
BETTER_AUTH_URL=http://localhost:3000

# PostgreSQL (self-hosted)
DATABASE_URL=postgresql://user:password@localhost:5432/cutbackground

# Replicate
REPLICATE_API_TOKEN=r8_...
REPLICATE_WEBHOOK_SECRET=whsec_...
REPLICATE_MODEL_PRIMARY=851-labs/background-remover
REPLICATE_MODEL_PRIMARY_VERSION=a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc
REPLICATE_MODEL_FALLBACK=lucataco/remove-bg
REPLICATE_MODEL_FALLBACK_VERSION=95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1

# Cloudflare R2
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=tool-uploads

# Redis
REDIS_URL=redis://localhost:6379

# Email (for auth emails: verification, magic link, password reset)
EMAIL_FROM=noreply@cutbackground.com
RESEND_API_KEY=re_...

# Site
NEXT_PUBLIC_SITE_DOMAIN=cutbackground.com
NEXT_PUBLIC_TOOL_NAME=background-remover
```

---

## Security Checklist

- [x] Server-side sessions (not JWT in localStorage)
- [x] httpOnly, Secure, SameSite cookies
- [x] CSRF protection on all auth endpoints (BetterAuth built-in)
- [x] Argon2 password hashing (BetterAuth built-in)
- [x] Brute force lockout (BetterAuth built-in)
- [x] Email verification before account activation
- [x] Session revocation on password change
- [x] Time-limited, single-use tokens (magic link, password reset)
- [x] HMAC webhook verification (Replicate)
- [x] Presigned URL expiration (R2: 5 min upload, 1 hour download)
- [x] Redis rate limiting on all API endpoints
- [x] Zod input validation on all routes
- [x] Idempotency keys to prevent duplicate processing
