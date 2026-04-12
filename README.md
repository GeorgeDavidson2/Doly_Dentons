# Doly — Dentons Polycentric

> A global operating system for Dentons that connects 12,000 lawyers across 80+ countries into one intelligent, coordinated network.

Built for the **NUGIC Innovation Challenge · May 7, 2026**.

---

## What It Does

Dentons' polycentric structure — built through 40 mergers — gives it unmatched global reach but creates four structural problems: knowledge silos, no cross-border collaboration incentive, undocumented cultural intelligence, and time zones that break deal momentum.

Doly solves all four through three integrated features:

- **Context** — When a cross-border matter opens, Doly instantly generates AI-powered briefings for every jurisdiction: legal landscape, cultural norms, regulatory requirements.
- **Connect** — AI-powered vector similarity matching surfaces the right lawyers firm-wide — ranked by jurisdiction expertise, language, and reputation — in seconds.
- **Flow** — Tasks automatically route to the next available qualified office as timezones close. Full context preserved on every handoff. Matters progress overnight without manual coordination.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL + pgvector) |
| Text AI | Groq — `llama-3.3-70b-versatile` (free tier) |
| Embeddings | `@xenova/transformers` — `all-MiniLM-L6-v2` (runs in-process) |
| Deployment | Vercel (Hobby tier) |
| Auth | Supabase Auth (email / magic link) |

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- A **Supabase** project (free tier) — [supabase.com](https://supabase.com)
- A **Groq** API key (free) — [console.groq.com](https://console.groq.com)
- A **Vercel** account (for deployment) — [vercel.com](https://vercel.com)

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/GeorgeDavidson2/Doly_Dentons.git
cd Doly_Dentons
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

See [Environment Variables](#environment-variables) below for what each variable does and where to find it.

### 4. Set up the database

Run the migration to create all tables, indexes, and RLS policies:

```bash
npx supabase db push
```

Or apply the migration file directly in the Supabase SQL editor:

```
supabase/migrations/001_initial_schema.sql
```

### 5. Seed demo data

```bash
npm run seed
```

This inserts 15 lawyers (Isabella, Klaus, Rodrigo, Sofia, Marcus, and 10 supporting lawyers), lawyer jurisdictions, field notes, reputation history, and availability windows.

### 6. Generate lawyer embeddings

```bash
npm run embed-lawyers
```

This generates 384-dimension vector embeddings for all lawyer profiles and stores them in Supabase. Required for the Connect feature to work.

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Supabase dashboard → Settings → API |
| `GROQ_API_KEY` | Groq API key for jurisdiction brief generation | [console.groq.com](https://console.groq.com) → API Keys |

---

## Project Structure

```
doly/
├── app/
│   ├── (auth)/              # Login + Supabase auth callback
│   ├── dashboard/           # Main hub — active matters, tasks, reputation
│   ├── matters/             # Matter list, creation, and detail pages
│   │   └── [matterId]/
│   │       ├── context/     # Jurisdiction briefings (Context feature)
│   │       ├── connect/     # Lawyer matching (Connect feature)
│   │       └── flow/        # Task routing and timeline (Flow feature)
│   ├── lawyers/             # Firm directory and individual profiles
│   ├── reputation/          # Leaderboard and reputation event history
│   ├── field-notes/         # Jurisdiction knowledge base
│   └── api/                 # All API routes
├── components/              # React components by feature
├── lib/
│   ├── ai/                  # Groq text generation + embeddings
│   ├── connect/             # Vector matching + secondary scoring
│   ├── flow/                # Timezone routing engine
│   └── supabase/            # Client and server Supabase clients
├── types/                   # TypeScript interfaces
├── supabase/
│   └── migrations/          # SQL schema migrations
├── scripts/
│   ├── embed-lawyers.ts     # Generate + store all lawyer embeddings
│   └── demo-reset.ts        # Reset database to clean demo state
└── docs/                    # Project documentation
```

---

## Demo Reset

To restore the database to a clean demo state before a presentation:

```bash
npm run demo-reset
```

This resets all matters, tasks, and reputation events while preserving the 15 seeded lawyers and their profiles. Runs in under 30 seconds.

---

## Deployment

### Deploy to Vercel

1. Push the repository to GitHub (already done)
2. Go to [vercel.com](https://vercel.com) → New Project → Import `Doly_Dentons`
3. Add all four environment variables in the Vercel project settings
4. Deploy — Vercel auto-detects Next.js, zero config needed

The `@xenova/transformers` model (~23MB) downloads on first cold start and is then cached. Subsequent embedding requests take ~100ms.

---

## Docs

Full technical documentation is in [`/docs`](./docs/):

- [Project Overview](./docs/project-overview.md) — problem, solution, demo story, constraints
- [Architecture](./docs/architecture.md) — system design, data flow, DB schema, security
- [Phases](./docs/phases.md) — 5-week build plan with exit criteria
- [Milestones](./docs/milestones.md) — pass/fail tests for each milestone
- [Dentons Ecosystem](./docs/dentons-ecosystem.md) — how Doly fits the existing Dentons tech stack

---

*NUGIC Innovation Challenge · Dentons · 2026*
