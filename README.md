# GradMate AI — From Idea to Graduation

منصة ذكية تساعد طلاب الجامعات على تحليل أفكار مشاريع التخرج، وتنظيم فرق العمل، وتوزيع المهام، ومتابعة الإنجاز، والاستعداد للمناقشة النهائية باستخدام الذكاء الاصطناعي.

An intelligent multi-agent AI platform that helps university students analyze graduation project ideas, organize teams, distribute tasks, track progress, and prepare for the final defense.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **Database**: Prisma ORM (SQLite for dev; PostgreSQL/Supabase for production)
- **Auth**: NextAuth.js v4 (Credentials provider; configurable for OAuth)
- **AI**: Multi-agent architecture powered by `z-ai-web-dev-sdk` (server-side only)
- **State**: Zustand (client) + TanStack Query (server)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Fonts**: Cairo + Tajawal (Arabic), Geist Mono (Latin)
- **Icons**: Lucide React

## Multi-Agent Architecture

GradMate AI is powered by six specialized AI agents, each with a distinct role:

| Agent | Responsibility | Endpoint |
|-------|----------------|----------|
| **Idea Analyzer Agent** | Evaluates feasibility, innovation, complexity, risks, roadmap | `/api/ai/idea-analyzer` |
| **Team Manager Agent** | Analyzes team skills, identifies gaps, recommends balanced workload | `/api/ai/team-analyzer` |
| **Task Distribution Agent** | Auto-assigns tasks based on skills, availability, workload | `/api/ai/task-distributor` |
| **Planning Agent** | Generates realistic timeline with phases and milestones | `/api/ai/planner` |
| **AI Assistant Agent** | Context-aware conversational helper bound to project data | `/api/ai/assistant` |
| **Defense Simulator Agent** | Conducts mock defense sessions with realistic questions | `/api/ai/defense-simulator` |

All AI calls run **server-side only** — API keys are never exposed to the client.

## Quick Start (Local Dev)

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Push schema to SQLite
bun run db:push

# Seed demo data (creates demo user + Smart Attendance System project)
bun run scripts/seed.ts

# Start dev server
bun run dev
```

Open http://localhost:3000

### Demo Credentials

- **Email**: `demo@gradmate.ai`
- **Password**: `gradmate123`

The seeded project is **Smart Attendance System** (نظام ذكي لتسجيل حضور الطلاب باستخدام التعرف على الوجوه) — a 12-week project with 4 team members, 9 tasks across phases, and 5 timeline phases.

## Environment Variables

Create `.env` (or `.env.local`):

```env
# Database — Supabase PostgreSQL via the transaction pooler (IPv4, serverless-safe)
DATABASE_URL="postgresql://postgres.<PROJECT-REF>:<PASSWORD>@aws-1-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# AI Provider — priority: Gemini (if key set) → z-ai-web-dev-sdk (sandbox) → demo fallback
GEMINI_API_KEY=AIza...
```

## Production Setup

### PostgreSQL / Supabase (already configured in this repo)

The schema is now `provider = "postgresql"` and points at Supabase. Two connection modes — pick by task:

- **Admin work** (`db push`, `seed`) — **session pooler, port 5432**:
  `postgresql://postgres.<PROJECT-REF>:<PASSWORD>@aws-1-<REGION>.pooler.supabase.com:5432/postgres`
- **Deployed app** (Netlify) — **transaction pooler, port 6543** with `?pgbouncer=true&connection_limit=1`

Why: direct connections (`db.xxx.supabase.co`) are **IPv6-only** on new Supabase projects and don't work from IPv4-only environments (including Netlify). The pooler host is IPv4. Region: Tokyo (`aws-1-ap-northeast-1`).

To (re)initialize a fresh Supabase project:

1. `DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-1-<region>.pooler.supabase.com:5432/postgres" bun run db:push`
2. `DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-1-<region>.pooler.supabase.com:5432/postgres" bun scripts/seed.ts`

### Switch to Supabase Auth

The codebase uses NextAuth with Credentials provider for the demo. To switch to Supabase Auth:

1. Install `@supabase/supabase-js` and `@supabase/ssr`
2. Replace `src/app/api/auth/[...nextauth]/route.ts` with Supabase SSR auth
3. Replace `bcrypt` password hashing with Supabase Auth's built-in hashing
4. Update `src/components/providers.tsx` to use Supabase session provider

### Configure AI Provider

`src/lib/ai.ts` ships with a provider chain — no other file changes needed:

1. **Google Gemini** (production) — used automatically when `GEMINI_API_KEY` is set
2. **z-ai-web-dev-sdk** (Z.ai sandbox) — auto-configured, no key needed
3. **Demo fallback** — deterministic JSON echo so the UI stays functional

To enable Gemini:

1. Get an API key at https://aistudio.google.com/apikey
2. Set env vars:

```env
GEMINI_API_KEY=AIza...
# optional — defaults to gemini-4-hydrogen
# alternatives: gemini-4-carbon, gemini-3.8-flash, gemini-3.5-flash-lite
GEMINI_MODEL=gemini-4-hydrogen
```

Notes:

- JSON agents (`callAIJson`) use Gemini's native `responseMimeType: application/json` for strictly valid output, with an automatic retry without it if a model rejects it
- Transient 429/5xx errors are retried once automatically
- `callAI` and `callAIJson` signatures are unchanged — all six agents work with either provider

## Deployment

### Netlify (recommended — configured in this repo)

The repo ships a ready `netlify.toml`: build command `bun run build:netlify` (runs `prisma generate` first — required, since the generated client is not committed), publish directory `.next`, Next.js runtime plugin auto-installed. `next.config.ts` disables `output: "standalone"` on Netlify because the OpenNext adapter doesn't support it. Prisma `binaryTargets` includes `rhel-openssl-3.0.x` for the Netlify Functions runtime (Amazon Linux 2023).

Steps:

1. Push this repo to GitHub
2. In Netlify: **Add new site → Import an existing project → GitHub → select the repo**
3. Build settings are picked up from `netlify.toml` automatically
4. In **Site configuration → Environment variables**, add:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | `postgresql://postgres.<PROJECT-REF>:<PASSWORD>@aws-1-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
   | `NEXTAUTH_SECRET` | long random string (`openssl rand -base64 32`) |
   | `NEXTAUTH_URL` | `https://<your-site>.netlify.app` |
   | `GEMINI_API_KEY` | your Google AI Studio key |

5. **Deploys → Trigger deploy → Deploy site** (so the new variables take effect)
6. Login at `https://<your-site>.netlify.app` with `demo@gradmate.ai` / `gradmate123`

The `netlify.toml` also sets placeholder `DATABASE_URL`/`NEXTAUTH_SECRET` values so the **first** build succeeds even before you add the real variables — the UI values override them on every deploy after that.

Vercel works too (remove `output: "standalone"` handling as in `next.config.ts`, or set the `NETLIFY` env var there).

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout: fonts, RTL, providers
│   ├── page.tsx                # SPA shell: view-state router
│   ├── globals.css             # Design system (navy + gold brand)
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth credentials
│       ├── auth/register/      # Registration
│       ├── me/                 # Current user + projects
│       ├── projects/           # CRUD
│       ├── tasks/              # CRUD
│       ├── members/            # CRUD
│       ├── timeline/           # CRUD
│       ├── files/              # CRUD
│       ├── notifications/      # CRUD
│       └── ai/
│           ├── idea-analyzer/  # AI Idea Analyzer Agent
│           ├── team-analyzer/  # AI Team Manager Agent
│           ├── task-distributor/ # AI Task Distribution Agent
│           ├── planner/        # AI Planning Agent
│           ├── assistant/      # AI Assistant Agent
│           ├── defense-simulator/ # AI Defense Simulator Agent
│           └── idea-discuss/   # Idea discussion follow-up
├── components/
│   ├── app-shell.tsx           # Sidebar + topbar + mobile drawer
│   ├── logo.tsx                # Brand logo component
│   ├── providers.tsx           # ThemeProvider + SessionProvider + QueryClient
│   └── views/
│       ├── landing.tsx         # Public landing page
│       ├── auth.tsx            # Login / Register / Forgot
│       ├── dashboard.tsx       # Main dashboard
│       ├── create-project.tsx  # 4-step wizard
│       ├── my-projects.tsx     # Project list
│       ├── project-overview.tsx
│       ├── idea-analyzer.tsx
│       ├── team-management.tsx
│       ├── smart-tasks.tsx     # Kanban with drag-drop
│       ├── project-timeline.tsx # Gantt-style
│       ├── ai-assistant.tsx    # Chat
│       ├── progress-tracking.tsx # Recharts analytics
│       ├── files.tsx
│       ├── defense-simulator.tsx
│       ├── notifications.tsx
│       └── settings.tsx
└── lib/
    ├── ai.ts                   # Server-side AI helper
    ├── db.ts                   # Prisma client
    ├── hooks.ts                # TanStack Query hooks
    ├── i18n.ts                 # Arabic + English translations
    ├── lang-store.ts           # Zustand language store
    └── utils.ts                # cn() helper
```

## Features

### Public
- Landing page with hero, features, how-it-works, footer
- Login / Register / Forgot Password

### Authenticated (18 views)
1. **Dashboard** — project summary, 7 stat cards, progress, upcoming tasks, AI recommendations, recent activity, quick actions
2. **Create Project** — 4-step wizard (basic → schedule → team → review)
3. **My Projects** — grid with search, filter, sort, edit, delete
4. **Project Overview** — full project info, timeline, team, stats, quick nav
5. **AI Idea Analyzer** — feasibility/innovation/complexity scores, tech recommendations, risks, improvements, roadmap, discussion panel
6. **Team Management** — member cards, skills, workload, smart skill analysis
7. **Smart Tasks** — Kanban with drag-drop, AI task distribution, overdue redistribution
8. **Project Timeline** — Gantt-style chart, AI planning, smart rescheduling
9. **AI Assistant** — chat with project context, suggested prompts, history
10. **Progress Tracking** — 5 charts (radial, pie, area, bar, line), team performance table
11. **Files & Reports** — upload, download, delete
12. **Defense Simulator** — mock exam with contextual questions and final feedback
13. **Notifications** — typed notifications, mark all read, delete all
14. **Profile & Settings** — profile, preferences, security, danger zone

### Internationalization
- Arabic (default, RTL) + English (LTR)
- Full translations for every label, button, message
- Language toggle in topbar and landing header
- Persists choice in localStorage

### Theming
- Light (default) + Dark mode
- Brand palette: Deep Navy Blue + Gold (extracted from logo)
- Toggle in topbar and settings

### Branding
- Official GradMate AI logo displayed in sidebar, login, register, landing
- Located at `public/gradmate-logo.png`
- Brand colors drive all UI elements (sidebar, buttons, accents, charts)

## License

© 2026 GradMate AI. All rights reserved.
