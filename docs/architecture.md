# Doly — System Architecture
**NUGIC Innovation Challenge · Dentons · 2026**

---

## System Overview

Doly (Dentons Polycentric) is a global operating system built for Dentons that connects 12,000 lawyers across 80+ countries. It solves four structural problems:

1. **Knowledge silos** — 40 mergers created 40 separate knowledge bases; expertise is invisible across borders
2. **No collaboration incentive** — the Swiss verein structure keeps office finances separate, removing cross-border financial incentives
3. **Undocumented cultural intelligence** — decades of market expertise lives only in individual lawyers' heads
4. **Time zones break momentum** — cross-border matters stall when offices close without intelligent task routing

Doly addresses all four through three core features: **Context** (market intelligence), **Connect** (expertise matching), and **Flow** (timezone routing).

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                  Next.js React App (App Router)                 │
│         Dashboard │ Matters │ Lawyers │ Flow │ Reputation       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / Server Components
┌──────────────────────────▼──────────────────────────────────────┐
│                   NEXT.JS API ROUTES (Server)                   │
│                                                                 │
│   /api/matters    /api/context    /api/connect    /api/flow     │
│   /api/lawyers    /api/field-notes               /api/reputation│
└──────┬────────────────┬──────────────┬───────────────┬──────────┘
       │                │              │               │
┌──────▼──────┐  ┌──────▼──────┐  ┌───▼────────┐  ┌──▼──────────┐
│  SUPABASE   │  │    GROQ     │  │ @xenova/   │  │  FLOW       │
│             │  │             │  │ transformers│  │  ENGINE     │
│ PostgreSQL  │  │ llama-3.3-  │  │            │  │             │
│ + pgvector  │  │ 70b-        │  │ all-MiniLM │  │ date-fns-tz │
│ + Auth      │  │ versatile   │  │ -L6-v2     │  │ timezone    │
│             │  │             │  │ (384d)     │  │ routing     │
│ RLS enabled │  │ Text gen    │  │ Embeddings │  │ logic       │
└─────────────┘  └─────────────┘  └────────────┘  └─────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────┐
│                         VERCEL                                  │
│              Deployment · CDN · Environment Variables           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| **Framework** | Next.js 14 (App Router) + TypeScript | Full-stack in one repo — API routes + React in one deploy target. Optimal for a 1–2 dev team |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI construction with accessible, composable primitives. No custom CSS files needed |
| **Database** | Supabase (PostgreSQL + pgvector) | Free tier includes pgvector (required for vector similarity search), built-in auth, Row Level Security, and a JS client |
| **Text Generation** | Groq — `llama-3.3-70b-versatile` | Best-quality free model (70B parameters), fastest inference of any free provider. 14,400 req/day free. Used for jurisdiction briefings |
| **Embeddings** | `@xenova/transformers` — `Xenova/all-MiniLM-L6-v2` | Runs directly in the Next.js server process. No API key, no rate limits, no demo-day failures. Model is ~23MB, downloads once, then cached. 384-dimension vectors |
| **Deployment** | Vercel (Hobby tier) | Native Next.js deployment, zero config, automatic preview URLs, free custom domain |
| **Auth** | Supabase Auth | Included in Supabase free tier. Email/magic link, JWT sessions, RLS integration |

### AI Architecture Decision Log

| Option | Considered For | Decision | Reason |
|---|---|---|---|
| Groq (llama-3.3-70b) | Text generation | ✅ **Selected** | Free, fast, 70B quality is production-grade |
| `@xenova/transformers` | Embeddings | ✅ **Selected** | Zero rate limits, runs in-process, reliable on demo day |
| Ollama | Text gen + embeddings | ❌ Ruled out | Can't run on Vercel free tier; CPU inference too slow for live demo |
| HuggingFace Inference API | Embeddings | ❌ Ruled out | 30K req/month rate limit is a demo-day risk |
| OpenAI API | Text gen + embeddings | ❌ Ruled out | Paid service — not available for this build |
| Google Gemini Flash | Text generation | ❌ Not selected | Groq is faster; keeping AI stack minimal |

---

## Core Data Flow

### 1. Matter Opens → Context Activates
```
Lawyer creates matter (title, client, jurisdictions, deadline)
        │
        ▼
POST /api/matters → inserts matter + matter_jurisdictions rows
        │
        ▼
POST /api/context/generate
        │
        ├── Insert context_briefs row (status: 'generating') for each jurisdiction
        │
        └── Promise.all → parallel Groq API calls (one per jurisdiction)
                │
                ▼
            Groq llama-3.3-70b generates:
            - Legal Landscape (3–4 paragraphs)
            - Cultural Intelligence (2–3 paragraphs)
            - Regulatory Notes (bullet list)
                │
                ▼
            Update context_briefs row (status: 'ready', text stored)
                │
                ▼
            Frontend polls every 2s → briefs pop in as they complete
```

### 2. Matter Opens → Connect Activates
```
Matter created with jurisdictions [BR, MX, CO, DE]
        │
        ▼
POST /api/connect/match
        │
        ▼
Build query text: "Legal matter in Brazil, Mexico, Colombia, Germany
                   requiring Corporate Expansion expertise"
        │
        ▼
@xenova/transformers embeds query → 384-dimension vector
        │
        ▼
Supabase pgvector cosine similarity search:
  SELECT lawyers WHERE jurisdiction IN (BR, MX, CO, DE)
  ORDER BY embedding <=> query_vector
        │
        ▼
Secondary scoring:
  + 0.10 per matching jurisdiction
  + 0.05 per matching language
  + 0.03 per reputation decile
        │
        ▼
Return ranked lawyer list with match_score 0.0–1.0
```

### 3. Task Needs Routing → Flow Activates
```
Task created: "Draft Colombia regulatory filing"
  required_jurisdiction: CO
  required_expertise: ["regulatory", "tech law"]
        │
        ▼
POST /api/flow/route-task
        │
        ▼
lib/flow/engine.ts → routeTask(taskId)
        │
        ├── Fetch matter team lawyers with CO jurisdiction
        │
        ├── For each candidate:
        │     utcToZonedTime(now, lawyer.timezone)
        │     → isWorking? (9am–6pm, Mon–Fri local)
        │
        ├── Prefer: available now + highest expertise_level
        │   Fallback: next to come online
        │
        ▼
Assign task → update tasks row
Create task_handoffs row (full context_snapshot preserved)
Award 25 reputation points to receiving lawyer
```

---

## Database Architecture

### Entity Relationships

```
lawyers ──────────── lawyer_jurisdictions
   │                       │
   │                       │ (jurisdiction expertise)
   │
   ├──────────────── matter_team ──────────── matters
   │                                             │
   │                                             ├── matter_jurisdictions
   │                                             ├── context_briefs  [pgvector]
   │                                             └── tasks
   │                                                   │
   ├──────────────── tasks (assigned_to)               └── task_handoffs
   │
   ├──────────────── field_notes
   ├──────────────── reputation_events
   └──────────────── lawyer_availability
```

### Vector Columns (pgvector)
| Table | Column | Dimensions | Purpose |
|---|---|---|---|
| `lawyers` | `embedding` | 384 | Profile similarity for Connect matching |
| `context_briefs` | `embedding` | 384 | Brief similarity (future cross-matter search) |

### Key Indexes
```sql
-- Vector similarity (IVFFlat for approximate nearest neighbor)
CREATE INDEX ON lawyers USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON context_briefs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Standard query performance
CREATE INDEX ON lawyers (office_country);
CREATE INDEX ON lawyer_jurisdictions (jurisdiction_code);
CREATE INDEX ON tasks (matter_id, status);
CREATE INDEX ON tasks (assigned_to, status);
```

---

## Security & Compliance

### Attorney-Client Privilege Protection
- **No client data stored** — matters contain only titles, descriptions, and jurisdiction codes. No case documents, no client PII, no privileged communications.
- **No data crosses borders** — Supabase database is single-region. Cross-border "routing" in Doly is task assignment only, not data replication.

### Row Level Security (RLS)
All Supabase tables have RLS enabled. Key policies:
- Lawyers can only update their own profile
- Matter team members can read matter data; non-members cannot
- Field notes with `visibility = 'private'` are readable only by their author
- Reputation events are readable by all (leaderboard) but writable only by server-side API routes

### Auth
- Supabase Auth with email/magic link
- JWT tokens validated in Next.js middleware on every request to protected routes
- All API routes validate the user session before executing queries

---

## External Services

| Service | Purpose | Free Tier Limit | Fallback |
|---|---|---|---|
| **Supabase** | Database, auth, real-time | 500MB DB, 50K monthly active users | — |
| **Groq** | Jurisdiction briefing generation | 14,400 req/day, 30 req/min | Cached briefs served if quota hit |
| **Vercel** | Hosting, CDN, deployments | 100GB bandwidth/month | — |
| **`@xenova/transformers`** | Embeddings | Unlimited (local) | No fallback needed |

### Offline / Failure Resilience
- **Groq rate limit hit**: `context_briefs` rows already exist with `status = 'error'` — UI shows retry button, cached briefs from previous runs can be served
- **Vercel cold start**: `@xenova/transformers` model is cached after first load — subsequent requests are fast (~100ms embedding generation)
- **Supabase downtime**: Unlikely on free tier; no specific mitigation for demo

---

## Repository Structure (planned)

```
doly/
├── docs/                    ← project documentation (this folder)
│   ├── architecture.md
│   ├── project-overview.md
│   ├── phases.md
│   └── milestones.md
├── app/                     ← Next.js App Router
├── components/              ← React components
├── lib/                     ← business logic (AI, Flow, Connect)
├── types/                   ← TypeScript interfaces
├── supabase/                ← migrations + seed scripts
└── scripts/                 ← embed-lawyers, demo-reset
```

---

*Last updated: April 2026*
