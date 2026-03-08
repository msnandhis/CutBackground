Project Goal

Create a production-ready web application boilerplate for building SEO-optimized online tools. The template should be scalable, cleanly architected, and suitable for launching many different tool websites quickly. The project must be designed so that each new tool site can reuse the boilerplate and only change configuration and processing logic.

The codebase should prioritize maintainability, performance, SEO, and clean user experience.

Tech Stack

Use the following stack:

Next.js (latest stable version) with App Router
TypeScript
Tailwind CSS (Purpose: Fast UI development and consistent design system)
React Query (Purpose: Client-side cache for interactive features, polling, and optimistic updates)
Zod (Purpose: Runtime validation for forms, API request payloads, and processing inputs)
Supabase (Purpose: Database)
Supabase SSR Client & Auth (Purpose: Session handling, user identity)
Cloudflare R2 (Purpose: Object storage for tool input/output files)
BullMQ + Self-hosted Redis (Purpose: Background job processing, rate limiting, and batching logs)
Pino (Purpose: Fast, structured JSON logging across all environments)
Server actions, API routes, or BullMQ Workers for tool processing
Edge-compatible architecture when possible

The project must be structured for production deployment.

Project Objectives

The template will power websites like:

Video watermark remover
Background remover
AI face generator
Video subtitle generator
Face comparison tools

Each website will contain a single main tool with supporting SEO pages.

The architecture must use a scalable Monorepo (e.g., Turborepo + pnpm workspaces) to support both the Next.js web application and future mobile applications. Both apps will share a core set of internal packages (`packages/*`). This drastically speeds up iteration while still keeping business logic decoupled.

Focus on:

excellent SEO structure
very fast load performance
clean UI and UX
rate limiting for free usage
future upgrade path for paid plans

Do not hardcode anything tool specific.

Use configuration files instead.

Folder Structure

Design a clear and scalable Turborepo Monorepo structure.

Example structure (Feature-Based Architecture):

apps/
├─ web/                  
│  ├─ src/
│  │  ├─ app/            # Next.js App Router (Public facing routes)
│  │  ├─ features/       # Feature-Based Architecture
│  │  │  ├─ admin/       # Future admin dashboards & logic
│  │  │  ├─ auth/        # Authentication & user profile logic
│  │  │  ├─ billing/     # Stripe/Credits logic
│  │  │  ├─ marketing/   # SEO pages, blog, landing pages
│  │  │  └─ tool/        # Core tool UI and processing logic
│  │  └─ shared/         # App-specific shared utilities
│  ├─ config/site.ts     
│  └─ config/tool.ts     
└─ mobile/               

packages/
├─ ui/                   # Shared Tailwind and layout components
├─ database/             # Supabase schema, typed clients, auth
├─ core/                 # Shared business logic
│  ├─ logger/            # Pino structured logging utilities (`logger.ts`, `requestLogger.ts`)
│  ├─ billing/           # Abstracted Payment Gateway interface (Stripe vs LemonSqueezy)
│  ├─ jobs/              # BullMQ queue definitions and workers
│  └─ redis/             # Redis connection and rate limits
├─ tsconfig/             # Shared TypeScript config
└─ eslint-config/        # Shared ESLint config

The architecture must perfectly separate UI components (`packages/ui`), core logic (`packages/core`), and tool-specific configurations (`apps/web/config`).

Configuration Driven System

The template must use configuration files to control the behavior of the website.

site configuration should include:

site name
domain
description
SEO keywords
main product URL for traffic redirection

tool configuration should include:

tool name
input type (image, video, audio, text)
output type
file size limits
rate limit per user
supported formats

Changing these configuration files should allow the template to power a completely different tool website.

User Experience Requirements

The UI must feel like a professional SaaS tool, not a generic template.

Design a minimal and modern interface.

Use the following design system:

Primary color
#FF0076

Dark brand background
#12131A

Light section background
#f0faff

White
#FFFFFF

Neutral gray scale
#f6f6f7 to #333333

Success color
#10B981

Typography:

Headings use Quicksand
Body text uses Inter

Use large readable typography with strong hierarchy.

Buttons:

Primary CTA buttons use the brand magenta color with rounded full style.

Secondary buttons should use outline styles.

Cards should have subtle shadows and hover lift effects.

Animations should be subtle and smooth.

The interface must feel clean and fast.

Layout Structure

The website should follow this structure:

Header navigation

Hero section containing tool title and upload interface

Tool interface section

Hero section containing tool title and upload interface

Tool interface section

Ad placement slot (capable of supporting Carbon Ads, AdSense, or promotional banners)

How it works section

Use cases section

FAQ section

Related tools section

Footer

All sections must be responsive.

Mobile first design is required.

SEO Requirements

The project must be optimized for search engines.

Implement:

dynamic metadata generation (`generateMetadata` API)
structured data schema (JSON-LD script tags)
FAQ schema
OpenGraph and Twitter metadata
Auto-generated `sitemap.xml` for all static pages, blog posts, and dynamic routes
Auto-generated `robots.txt`
Auto-generated `llms.txt` to provide clean AI crawler parsing of site context
Internationalization (i18n) allowing dynamic localized routes (e.g. `/es`, `/fr`) to multiply global traffic

Include built-in SEO sections like:

FAQ block
how it works
use cases

Pages should load extremely fast.

Use static rendering when possible.

Include a `blog` section for long-form content marketing (using next-mdx-remote or similar) to capture long-tail SEO traffic.

Performance Requirements

The project must achieve high Lighthouse scores.

Use optimized image loading.

Avoid unnecessary client JavaScript.

Use server components where possible.

Minimize bundle size.

Tool Interaction Flow

The tool page should follow this user flow:

user uploads file directly to Cloudflare R2 via presigned URL
client pings Next.js API with file reference
system validates input and checks rate limits
processing state is shown
Next.js enqueues a processing job to BullMQ
BullMQ worker processes the file in the background (avoiding serverless timeouts)
client listens for updates via Server-Sent Events (SSE) or polling
result preview is displayed
user can download or copy result
result screen should also show a CTA promoting the main platform.

Database Design

Use Supabase with minimal schema.

Tables should include:

usage_logs

fields:
id
ip_address
device_fingerprint
tool_name
created_at

jobs

fields:
id
status
input_url
output_url
error_message
metadata (JSONB)
created_at

This allows tracking tool usage and future expansion.

Rate Limiting

Implement rate limiting for anonymous users.

Rate limiting should run in edge middleware using self-hosted Redis.
Anonymous users should be tracked using a combination of IP address and device fingerprinting (e.g., FingerprintJS or similar lightweight client hashing).

Users exceeding limits should see a friendly message.

Future Paid Plan Support

The architecture must support adding:

user accounts (via Supabase Auth)
credits system
subscription plans

**Billing Abstraction**: The codebase must implement an abstract Payment Gateway interface (`packages/core/billing`) so swapping between providers like Stripe and LemonSqueezy later only requires updating a single config file, keeping the `features/billing` module entirely provider-agnostic.

Logging & Observability

To support deploying many standalone tool sites safely, the boilerplate must use **Structured Logging**.

Use **Pino** for extremely fast, structured JSON logging to automatically attach metadata (domain, tool name, endpoint, requestId, timestamp) to every log event. All log events (API routes, job starts/failures, AI requests, rate limits) should use this interface.

*Performance Optimization*: To avoid database bottlenecking by writing a Postgres row on every request log, the system should push log events to **BullMQ** (via Redis). A scheduled BullMQ worker should batch-insert the structured logs into the Supabase `usage_logs` table at routine intervals (e.g., every 10 seconds).

Analytics

Include a simple analytics integration layer.

The analytics system should track:

page views
tool usage
conversion clicks

Keep it modular so analytics providers can be swapped.

Accessibility

Ensure accessibility best practices.

Include:

keyboard navigation
visible focus states
ARIA attributes where needed
sufficient color contrast

Code Quality

Write clean TypeScript code.

Use consistent naming conventions.

Organize components logically.

Avoid deeply nested components.

Ensure the code looks like it was written by an experienced engineer.

Documentation

Add a short README explaining:

how to run the project
how to change site configuration
how to change tool logic
how to deploy the site natively (Vercel/Netlify)
how to build the Docker image (Coolify)

Deployment Support

The boilerplate must support three first-class deployment targets:
1. Serverless/Edge deployments (Vercel).
2. Netlify (via `@netlify/plugin-nextjs`).
3. Self-Hosted Docker (Provide a robust `Dockerfile` optimized for Next.js standalone output to easily deploy on Coolify or bare-metal VPS).

Final Goal

The result should be a professional, production-ready boilerplate that can be reused to launch many SEO tool websites quickly.

It should feel like a real startup project, not an auto-generated template.
