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

Apply each SQL file in `supabase/migrations/` in order, either via the Supabase CLI (`npx supabase db push`) or by pasting them into the Supabase SQL editor:

| File | Purpose |
|---|---|
| `001_initial_schema.sql` | Core tables, indexes, RLS policies, pgvector extension |
| `005_match_lawyers_rpc.sql` | Cosine-similarity RPC used by the Connect matcher |
| `006_reputation_guards.sql` | Guards preventing duplicate reputation awards |
| `007_reputation_atomic.sql` | Atomic reputation-score increment function |
| `008_field_notes_jurisdiction_name.sql` | Denormalised jurisdiction name column on field notes |

If you have `DATABASE_URL` in `.env.local` you can apply any file with:

```bash
npx tsx scripts/apply-migration.ts supabase/migrations/005_match_lawyers_rpc.sql
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
npm run demo:reset
```

This clears Marcus's matters, tasks, team memberships, briefs, and reputation events, then reinstates the seeded lawyers, field notes, and reputation history. Runs in under 30 seconds. **Always run this immediately before a live demo.**

---

## Demo Script (8-minute walkthrough)

Run `npm run demo:reset` first so the database is in a predictable state.

### 1. Login as Marcus (30s)
- Go to `/login`
- Email: `marcus.chen@dentons.com`
- Click the magic link in Supabase (or in your inbox) → lands on `/dashboard`
- Dashboard shows Marcus's active matters, assigned tasks, and reputation history

### 2. Create a new matter (1m)
- Click **New Matter** from the sidebar or matters page
- Fill in:
  - **Title:** `TechCorp Global Expansion`
  - **Client:** `TechCorp`
  - **Matter type:** `Corporate`
  - **Deadline:** 5 days from today
  - **Jurisdictions:** Brazil (BR), Mexico (MX), Colombia (CO), Germany (DE)
- Submit → redirects to `/matters/[id]/overview`

### 3. Context tab — live brief generation (1m 30s)
- Click **Context** tab
- 4 jurisdiction briefs generate in parallel (~30s total) — skeletons show "Generating…" state
- Each brief contains: Legal landscape · Cultural intelligence · Regulatory notes
- Expand any section to show the generated content

### 4. Connect tab — lawyer matching (1m 30s)
- Click **Connect** tab
- AI-ranked list appears within ~1s (embedding + vector search + secondary scoring)
- Expected top 3: **Isabella Reyes (~92% match)**, **Rodrigo Costa (~88%)**, **Klaus Weber (~84%)**
- Each card shows: match score, matched jurisdiction flags with expertise stars, reputation tier
- Click **Invite to Matter** on Isabella → button becomes "Invited ✓" + toast shows "+20 reputation points"
- Repeat for Rodrigo and Klaus

### 5. Flow tab — timezone routing (1m 30s)
- Click **Flow** tab
- Team availability timeline shows all 4 lawyers across timezones
- Click **Route All Tasks** (or create a task, then route it) — routing engine assigns to the next-available qualified lawyer based on timezone and jurisdiction fit

### 6. Lawyer profile — Isabella (1m)
- Click Isabella's name anywhere she appears
- Profile shows: jurisdiction matrix with expertise levels, matters count, reputation history (with the +30 from joining this matter), field notes authored

### 7. Reputation leaderboard (1m)
- Click **Reputation** in the sidebar
- Chart shows reputation over time; event feed shows the fresh `match_accepted` / `matter_joined` events triggered in step 4
- Scroll the leaderboard — Isabella is near the top; Marcus's score reflects the +20 points per invite

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
