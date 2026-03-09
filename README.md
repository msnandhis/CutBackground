<div align="center">

# ✂️ CutBackground

### Free AI-Powered Background Remover | Remove Image Backgrounds in Seconds

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?logo=turborepo)](https://turbo.build)

[Live Demo](https://cutbackground.com) · [Report Bug](https://github.com/msnandhis/CutBackground/issues) · [Request Feature](https://github.com/msnandhis/CutBackground/issues)

</div>

---

## 🎯 About

**CutBackground** is a production-ready, SEO-optimized web application for removing image backgrounds instantly using AI. Upload any image (product photo, headshot, or graphic) and get a clean transparent PNG in seconds. No signup, no watermark, no limits on quality.

Built as a **scalable monorepo boilerplate**, the architecture is designed to launch multiple AI tool websites quickly by swapping only the processing logic and page content.

---

## ⚡ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | SSR, SEO, routing, server components |
| **Language** | TypeScript 5 | Type safety across the entire stack |
| **Styling** | Tailwind CSS 3.4 | Fast UI development, consistent design system |
| **State** | React Query (TanStack) | Client-side cache, polling, optimistic updates |
| **Validation** | Zod | Runtime validation for forms, API payloads, env vars |
| **Database** | PostgreSQL (self-hosted) | Relational data store |
| **ORM** | Drizzle ORM | Type-safe SQL-like ORM with migrations |
| **Auth** | BetterAuth | Self-hosted auth, server-side sessions, CSRF |
| **Storage** | Cloudflare R2 | S3-compatible object storage for uploads/outputs |
| **Queue** | BullMQ + Redis | Background jobs, rate limiting, log batching |
| **AI** | Replicate (primary) | AI model inference with fallback support |
| **Logging** | Pino | Structured JSON logging with request context |
| **Monorepo** | Turborepo + pnpm | Shared packages, parallel builds, caching |

---

## 🔐 Authentication

Powered by **BetterAuth** with full security:

| Feature | Details |
|---|---|
| Email + Password | Signup, login, Argon2 hashing |
| Magic Link | Passwordless login via email |
| Forgot Password | Secure reset via time-limited email link |
| Reset Password | Set new password, revokes all sessions |
| Email Verification | Required before account activation |
| Session Management | Server-side sessions with httpOnly cookies |
| CSRF Protection | Built-in on all auth endpoints |
| Brute Force | Account lockout after failed attempts |
| Rate Limiting | Redis-based, per-endpoint limits |

---

## 🤖 AI Provider Architecture

Pluggable AI provider system with automatic fallback:

| Provider | Model | Status |
|---|---|---|
| **Replicate (primary)** | `851-labs/background-remover` | Active |
| **Replicate (fallback)** | `lucataco/remove-bg` | Active |
| **fal.ai** | TBD | Planned |
| **Gemini** | TBD | Planned |
| **OpenRouter** | TBD | Planned |

- Automatic fallback when primary model fails
- Webhook support for async processing
- Idempotency keys prevent duplicate requests
- Supports both image and video background removal

---

## 📁 Project Structure

```
CutBackground/
├── apps/
│   ├── web/                         # Next.js web application
│   │   ├── config/                  # Site & tool configuration
│   │   └── src/
│   │       ├── app/
│   │       │   ├── api/auth/        # BetterAuth handler
│   │       │   ├── api/jobs/        # Job processing APIs
│   │       │   ├── api/webhooks/    # Replicate webhooks
│   │       │   ├── (auth)/          # Login, signup, forgot/reset password pages
│   │       │   └── dashboard/       # User dashboard
│   │       ├── features/
│   │       │   ├── tool/            # Upload, processing, result UI
│   │       │   ├── auth/            # Auth forms and hooks
│   │       │   ├── marketing/       # Landing page sections
│   │       │   ├── billing/         # Subscription logic
│   │       │   └── admin/           # Admin dashboards
│   │       └── middleware.ts        # Auth + rate limiting
│   └── mobile/                      # Future React Native app
├── packages/
│   ├── core/                        # Shared business logic
│   │   ├── src/auth/                # BetterAuth server + client
│   │   ├── src/ai-provider/         # Replicate, fal.ai, etc.
│   │   ├── src/addons/              # Upscale, bg-color, crop, shadow
│   │   ├── src/jobs/                # BullMQ queues & workers
│   │   ├── src/logger/              # Pino structured logging
│   │   ├── src/redis/               # Redis client + rate limiter
│   │   ├── src/r2/                  # Cloudflare R2 presigned URLs
│   │   └── src/billing/             # Abstract payment interface
│   ├── database/                    # Drizzle ORM schema + migrations
│   ├── ui/                          # Shared React + Tailwind components
│   ├── tsconfig/                    # Shared TypeScript configs
│   └── eslint-config/               # Shared ESLint rules
├── Dockerfile
├── .env.example
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 9 (`npm install -g pnpm`)
- **PostgreSQL** (self-hosted, e.g., Docker or local install)
- **Redis** (for BullMQ & rate limiting)

### Installation

```bash
# Clone the repository
git clone https://github.com/msnandhis/CutBackground.git
cd CutBackground

# Install all dependencies
pnpm install

# Copy the local development environment template
cp .env.local.example .env.local
```

### Configure Environment

Edit `.env.local` with your credentials:

```env
# BetterAuth
BETTER_AUTH_SECRET=your-secret-min-32-chars  # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/cutbackground

# Replicate
REPLICATE_API_TOKEN=r8_your_token

# Optional Cloudflare R2 / MinIO
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=tool-uploads

# Redis
REDIS_URL=redis://localhost:6379

# Email (Resend)
RESEND_API_KEY=re_your_key
EMAIL_FROM=noreply@cutbackground.com
```

### Local Infrastructure

```bash
# PostgreSQL + Redis
pnpm infra:up

# Optional MinIO for S3-compatible local object storage
pnpm infra:up:storage
```

If Docker is not available on your machine, you can point `.env.local` at an already running local PostgreSQL / Redis instance instead.
The checked-in Compose stack uses host ports `15432` for PostgreSQL and `16379` for Redis so it can coexist with native local services and Docker Desktop port reservations.

### Database Setup

```bash
# Run the checked-in Drizzle migration against .env.local
pnpm db:migrate:local
```

### Run Development Server

```bash
# Start the validated web runtime
pnpm dev --filter=@repo/web

# Start the validated worker runtime
pnpm --filter=@repo/core worker:tool
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Deployment

```bash
docker build -t cutbackground .
docker run -p 3000:3000 --env-file .env.local cutbackground
```

Works with **Coolify**, **Railway**, or any Docker-compatible platform.

---

## 🏗️ Current Progress

### ✅ Phase 1: Monorepo Foundation (Complete)
- Turborepo + pnpm workspace scaffolding
- Shared TypeScript, ESLint, and Prettier configs
- Core packages: logger, Redis, BullMQ, R2, billing abstraction

### ✅ Phase 2: Homepage & Marketing (Complete)
- Responsive landing page with 8 sections
- Interactive tabbed Use Cases, vibrant testimonial cards
- SEO metadata, OpenGraph, Google Fonts

### ✅ Deployment Ready
- Multi-stage Dockerfile (standalone Next.js output)
- `.env.example` with all required variables

---

## 🗺️ Roadmap

### Phase 3: Database Layer (Drizzle ORM + PostgreSQL)
- [ ] Drizzle schema definitions for all tables
- [ ] Database migrations

### Phase 4: Authentication (BetterAuth)
- [ ] Email/password signup and login
- [ ] Magic link passwordless login
- [ ] Forgot password and reset password flows
- [ ] Email verification
- [ ] Auth middleware for route protection
- [ ] Auth pages (login, signup, forgot, reset, verify)

### Phase 5: AI Provider System
- [ ] Pluggable AI provider interface
- [ ] Replicate implementation with webhook support
- [ ] Primary + fallback model chain

### Phase 6: Core Tool Interface
- [ ] Drag-and-drop file upload to R2
- [ ] BullMQ background processing
- [ ] Result preview with before/after slider

### Phase 7: Add-On Features
- [ ] Upscale (AI-based 2x/4x)
- [ ] Background color/image replacement
- [ ] Auto-crop and shadow

### Phase 8: SEO Automation
- [ ] Sitemap, robots.txt, JSON-LD schemas
- [ ] Blog system, i18n

### Phase 9: Billing
- [ ] Abstract payment provider (Stripe first)
- [ ] Subscription plans and checkout

---

## 🧩 Reusing for Other Tools

This boilerplate launches multiple tool websites. To create a new tool:

1. **Fork or clone** this repository
2. **Update `config/site.ts`**: change name, domain, SEO keywords
3. **Update `config/tool.ts`**: set file types, rate limits, processing config
4. **Update page content**: modify marketing components
5. **Add processing logic**: implement AI processing in `features/tool/`

Example tools:
- `VideoWatermarks.com`: Video watermark remover
- `GenerateFace.com`: AI face generator
- `SubtitlesVideo.com`: Video subtitle extractor
- `CompareFaces.com`: Face comparison tool

---

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<div align="center">

**Built with ❤️ for the creator community**

[⬆ Back to Top](#-cutbackground)

</div>
