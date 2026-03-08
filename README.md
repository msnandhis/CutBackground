<div align="center">

# ✂️ CutBackground

### Free AI-Powered Background Remover — Remove Image Backgrounds in Seconds

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?logo=turborepo)](https://turbo.build)

[Live Demo](https://cutbackground.com) · [Report Bug](https://github.com/msnandhis/CutBackground/issues) · [Request Feature](https://github.com/msnandhis/CutBackground/issues)

</div>

---

## 🎯 About

**CutBackground** is a production-ready, SEO-optimized web application for removing image backgrounds instantly using AI. Upload any image — product photo, headshot, or graphic — and get a clean transparent PNG in seconds. No signup, no watermark, no limits on quality.

Built as a **scalable monorepo boilerplate**, the architecture is designed to launch multiple AI tool websites quickly (e.g., video watermark remover, face generator, subtitle extractor) by swapping only the processing logic and page content.

---

## ⚡ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | SSR, SEO, routing, server components |
| **Language** | TypeScript 5 | Type safety across the entire stack |
| **Styling** | Tailwind CSS 3.4 | Fast UI development, consistent design system |
| **State** | React Query (TanStack) | Client-side cache, polling, optimistic updates |
| **Validation** | Zod | Runtime validation for forms, API payloads, env vars |
| **Database** | Supabase | PostgreSQL, Auth, Row Level Security |
| **Auth** | Supabase Auth (SSR) | Signup, login, OAuth, session lifecycle |
| **Storage** | Cloudflare R2 | S3-compatible object storage for uploads/outputs |
| **Queue** | BullMQ + Redis | Background jobs, rate limiting, log batching |
| **Logging** | Pino | Structured JSON logging with request context |
| **Monorepo** | Turborepo + pnpm | Shared packages, parallel builds, caching |

---

## 📁 Project Structure

```
CutBackground/
├── apps/
│   ├── web/                         # Next.js web application
│   │   ├── config/                  # Site & tool configuration
│   │   │   ├── site.ts              # Site identity, SEO, analytics
│   │   │   └── tool.ts              # Tool settings, file limits, rate limits
│   │   └── src/
│   │       ├── app/                 # Next.js App Router pages
│   │       └── features/            # Feature-based architecture
│   │           ├── tool/            # Core tool processing UI & API
│   │           ├── marketing/       # Landing page sections & SEO pages
│   │           ├── auth/            # Authentication flows
│   │           ├── billing/         # Subscription & payment logic
│   │           └── admin/           # Admin dashboards
│   └── mobile/                      # Future React Native / Expo app
├── packages/
│   ├── core/                        # Shared business logic
│   │   ├── src/logger/              # Pino structured logger
│   │   ├── src/redis/               # Redis client + rate limiter
│   │   ├── src/jobs/                # BullMQ queues & workers
│   │   ├── src/r2/                  # Cloudflare R2 presigned URLs
│   │   └── src/billing/             # Abstract payment provider interface
│   ├── database/                    # Supabase client & typed schema
│   ├── ui/                          # Shared React + Tailwind components
│   ├── tsconfig/                    # Shared TypeScript configurations
│   └── eslint-config/               # Shared ESLint rules
├── docs/
│   ├── plan.md                      # Full architecture plan
│   └── implementation.md            # Step-by-step implementation phases
├── Dockerfile                       # Multi-stage production build
├── .env.example                     # Environment variable template
├── turbo.json                       # Turborepo pipeline config
└── pnpm-workspace.yaml              # Workspace definitions
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- **Redis** (for BullMQ & rate limiting — self-hosted or cloud)

### Installation

```bash
# Clone the repository
git clone https://github.com/msnandhis/CutBackground.git
cd CutBackground

# Install all dependencies (root + all workspaces)
pnpm install

# Copy environment variables
cp .env.example .env.local
```

### Configure Environment

Edit `.env.local` with your service credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudflare R2
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=tool-uploads

# Redis
REDIS_URL=redis://localhost:6379

# Site Identity
NEXT_PUBLIC_SITE_DOMAIN=cutbackground.com
NEXT_PUBLIC_TOOL_NAME=background-remover
```

### Run Development Server

```bash
# Start the web app with Turbopack
pnpm dev --filter=@repo/web

# Or run all apps
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build all packages and apps
pnpm build

# Build web app only
pnpm build --filter=@repo/web
```

### Docker Deployment

```bash
# Build the Docker image
docker build -t cutbackground .

# Run the container
docker run -p 3000:3000 --env-file .env.local cutbackground
```

Works with **Coolify**, **Railway**, or any Docker-compatible platform.

---

## 🏗️ Current Progress

### ✅ Phase 1 — Monorepo Foundation (Complete)
- Turborepo + pnpm workspace scaffolding
- Shared TypeScript configurations (`base`, `nextjs`, `library`)
- Shared ESLint config (flat config with Prettier)
- `@repo/ui` — Shared component library (Button component)
- `@repo/database` — Supabase typed client and schema definitions
- `@repo/core` — Logger (Pino), Redis rate limiter, BullMQ job queues, Cloudflare R2 presigned URLs, billing abstraction

### ✅ Phase 2 — Homepage & Marketing (Complete)
- Responsive landing page with 8 sections:
  - Sticky navbar with glass-blur effect
  - Hero section with gradient text and before/after visual
  - Social proof / trusted by section
  - Use cases grid (E-Commerce, Headshots, Social Media, Marketing)
  - How it works (3-step flow)
  - Testimonials with quote cards
  - CTA section
  - Multi-column footer with social links
- SEO metadata via `generateMetadata` API
- OpenGraph and Twitter card meta tags
- Google Fonts (Inter + Quicksand)

### ✅ Deployment Ready
- Multi-stage Dockerfile (standalone Next.js output)
- `.dockerignore` for minimal build context
- `.env.example` with all required variables documented

---

## 🗺️ Roadmap

### Phase 3 — Core Tool Interface
- [ ] Drag-and-drop file upload component with progress indicator
- [ ] Direct client-to-R2 uploads via presigned URLs
- [ ] BullMQ worker for background processing
- [ ] SSE / polling for real-time job status updates
- [ ] Result preview and download interface

### Phase 4 — Authentication & User Dashboard
- [ ] Supabase Auth integration (email, Google OAuth)
- [ ] User profile and usage history
- [ ] Credits system with free tier

### Phase 5 — SEO Automation
- [ ] Dynamic `sitemap.xml` generation
- [ ] Auto-generated `robots.txt`
- [ ] `llms.txt` for AI crawler guidance
- [ ] JSON-LD structured data (FAQ schema, HowTo schema)
- [ ] Blog system with `next-mdx-remote`
- [ ] i18n with `next-intl`

### Phase 6 — Billing & Monetization
- [ ] Stripe integration via abstract payment provider
- [ ] Subscription plans and checkout flows
- [ ] Ad placement slots (AdSense, Carbon Ads)

### Phase 7 — Deployment & DevOps
- [ ] `netlify.toml` configuration
- [ ] Vercel deployment config
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Health checks and monitoring

---

## 🧩 Reusing for Other Tools

This boilerplate is designed to launch multiple tool websites. To create a new tool:

1. **Fork or clone** this repository
2. **Update `config/site.ts`** — change name, domain, SEO keywords
3. **Update `config/tool.ts`** — set accepted file types, rate limits, processing config
4. **Update page content** — modify the marketing components in `src/features/marketing/`
5. **Add processing logic** — implement your tool's AI processing in `src/features/tool/`

Example tools you can build:
- `VideoWatermarks.com` — Video watermark remover
- `GenerateFace.com` — AI face generator
- `SubtitlesVideo.com` — Video subtitle extractor
- `CompareFaces.com` — Face comparison tool

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

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
