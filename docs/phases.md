# Doly — Project Phases
**NUGIC Innovation Challenge · Dentons · 2026**

---

## Overview

The build is divided into 5 phases across 5 weeks. Each phase has a clear goal, a defined set of deliverables, and an exit criteria that must be met before the next phase begins.

| Phase | Name | Dates | Status |
|---|---|---|---|
| 0 | Foundation | Apr 3–9 | 🔲 Not started |
| 1 | Context | Apr 10–16 | 🔲 Not started |
| 2 | Connect | Apr 17–23 | 🔲 Not started |
| 3 | Flow + Gamification | Apr 24–30 | 🔲 Not started |
| 4 | Polish & Demo Hardening | May 1–7 | 🔲 Not started |

---

## Phase 0 — Foundation
**Dates:** Apr 3–9  
**Goal:** A deployed, navigable app skeleton with auth, database, and lawyer profiles working end-to-end.

### Deliverables
- Next.js 14 project scaffolded with TypeScript and Tailwind CSS
- Supabase project created with pgvector extension enabled
- Full database schema applied via migrations (`001_initial_schema.sql`, `002_enable_pgvector.sql`)
- Supabase Auth wired up — email/magic link login, session management, auth middleware
- All page routes created as working shells (no broken navigation)
- Dentons brand applied — navy/red/cream CSS variables, logo, typography
- Sidebar and navbar components built
- Lawyer directory page (`/lawyers`) — searchable, filterable
- Lawyer profile page (`/lawyers/[id]`) — jurisdictions, bio, reputation score
- My profile page (`/profile`) — editable bio, jurisdictions, availability
- Seed script run — 15 demo lawyers with full profiles across 10+ countries
- Vercel deployment live with environment variables configured

### Exit Criteria
- [ ] Live Vercel URL is accessible
- [ ] Login and logout work via email magic link
- [ ] All page routes render without errors
- [ ] Lawyer directory shows all 15 seeded lawyers
- [ ] Individual lawyer profiles display jurisdiction matrix and bio
- [ ] Dentons colour theme is applied consistently across all pages

---

## Phase 1 — Context
**Dates:** Apr 10–16  
**Goal:** Full Context feature working end-to-end — matter creation triggers live AI briefing generation visible in the UI.

### Deliverables
- Matter creation form (`/matters/new`) — title, client name, matter type, jurisdiction multi-select, deadline picker
- Matter list page (`/matters`) with status filters
- Matter overview page (`/matters/[id]`) with tab navigation (Overview / Context / Connect / Flow)
- `POST /api/matters` — creates matter and triggers context generation automatically
- `POST /api/context/generate` — fires parallel Groq API calls (one per jurisdiction)
- `GET /api/context/[briefId]` — polling endpoint, returns brief status and content
- Groq integration (`lib/ai/groq.ts`) — `generateBrief(jurisdiction, matterType)` function
- Prompt templates (`lib/ai/prompts.ts`) — structured output: Legal Landscape, Cultural Intelligence, Regulatory Notes
- Context tab UI — `BriefSkeleton` shimmer cards while generating, `BriefCard` components that populate as each brief completes
- Frontend polling loop — 2-second interval per brief, clears when all briefs are `status: ready`
- Reputation award — 50 points to matter creator when all briefs are ready
- Brief caching — if briefs already exist for a matter, serve from DB (no re-generation)

### Exit Criteria
- [ ] Creating a matter with 4 jurisdictions automatically triggers briefing generation
- [ ] Context tab shows skeleton cards immediately, briefs populate one by one as they complete
- [ ] Each brief contains all three sections: Legal Landscape, Cultural Intelligence, Regulatory Notes
- [ ] Briefs are stored in the database and served from cache on revisit
- [ ] 50 reputation points are awarded on brief completion
- [ ] Groq failure (e.g. rate limit) shows an error state with a retry button — does not crash the page

---

## Phase 2 — Connect
**Dates:** Apr 17–23  
**Goal:** Full Connect feature working — AI-powered lawyer matching surfaces the right colleagues for any matter, with Isabella ranking #1 for the demo matter.

### Deliverables
- Embedding pipeline (`lib/ai/embeddings.ts`) — `embedText()` using `@xenova/transformers` (`Xenova/all-MiniLM-L6-v2`, 384 dimensions)
- One-time seed script (`scripts/embed-lawyers.ts`) — generates and stores embeddings for all 15 lawyers
- Supabase RPC function — cosine similarity search via pgvector (`lawyers.embedding <=> query_vector`)
- Connect matching engine (`lib/connect/matcher.ts`) — vector search + secondary scoring (jurisdiction overlap, language match, reputation)
- `POST /api/connect/match` — accepts `matterId`, returns ranked lawyer list with `match_score`
- `POST /api/lawyers/[id]/embed` — regenerates embedding when a lawyer updates their profile
- Connect tab UI (`/matters/[id]/connect`) — ranked `LawyerMatchCard` list with match score bar, jurisdiction badges, expertise stars
- One-click invite — `POST /api/matters/[id]/team`, adds lawyer to matter team
- Reputation awards on invite — 20 points to inviter, 30 points to invitee
- Lawyer directory enhanced — full-text search by name, filter by jurisdiction and language

### Exit Criteria
- [ ] `scripts/embed-lawyers.ts` runs without error and all 15 lawyers have embeddings stored
- [ ] Running Connect match for Marcus's 4-country matter (BR, MX, CO, DE) returns Isabella as the #1 result
- [ ] Match scores are visible on each card as a percentage bar
- [ ] Matched jurisdictions are highlighted on each card
- [ ] Inviting a lawyer adds them to the matter team and awards reputation points to both parties
- [ ] Updating a lawyer profile triggers embedding regeneration

---

## Phase 3 — Flow + Gamification
**Dates:** Apr 24–30  
**Goal:** Flow engine routes tasks across timezones, gamification drives reputation accumulation, and the full end-to-end demo path works start to finish.

### Deliverables

#### Flow
- Flow routing engine (`lib/flow/engine.ts`) — `routeTask(taskId)`: checks timezone availability using `date-fns-tz`, assigns to best available lawyer, falls back to next to come online
- `lawyer_availability` seed data — all demo lawyers seeded with 9am–6pm local working hours, Monday–Friday
- Task creation — tasks auto-created per jurisdiction when a matter is opened
- `POST /api/flow/route-task` — runs the routing engine for a single task
- `PATCH /api/flow/tasks/[id]` — update task status, assignment, append handoff context
- `task_handoffs` writes — full `context_snapshot` preserved on every routing event
- Flow tab UI (`/matters/[id]/flow`) — three-column task board (Pending / In Progress / Completed)
- `TimezoneTimeline` component — horizontal strip showing current local time for each assigned office, green "online" / grey "offline" indicator
- `HandoffModal` — confirm routing with optional handoff notes, auto-populated with prior context
- "Route All Tasks" button — triggers routing engine for all unassigned tasks, animates cards to correct columns
- 25 reputation points awarded to receiving lawyer on each handoff

#### Gamification
- Reputation awards (`lib/reputation/awards.ts`) — full point table wired to all trigger events
- Reputation leaderboard (`/reputation`) — top 20 firm-wide, filterable by office
- `ReputationChart` — sparkline of point accumulation over last 30 days (using `recharts`)
- `EventFeed` — last 10 reputation events with icon, description, points, timestamp
- Badge tier system — Contributor / Rising Star / Regional Expert / Global Expert / Elite Partner
- Pre-seeded reputation history — 20–30 past events for Isabella, Klaus, Rodrigo so their charts show genuine growth

#### Field Notes
- Field notes list (`/field-notes`) — browse and search by jurisdiction
- Contribute form (`/field-notes/new`) — awards 40 reputation points on publish
- Upvote system — 10 points per upvote to author (capped at 200)
- 15 pre-seeded field notes across BR, MX, CO, DE jurisdictions

### Exit Criteria
- [ ] "Route All Tasks" on Marcus's matter correctly routes: CO/MX tasks to Isabella, BR task to Rodrigo, DE task to Klaus
- [ ] `TimezoneTimeline` shows Klaus as offline (Frankfurt evening), Isabella and Rodrigo as online at ~3pm EST
- [ ] Handoff context is preserved and visible when reviewing a routed task
- [ ] Reputation leaderboard loads with Isabella in top 3
- [ ] Reputation chart shows growth history for top lawyers
- [ ] Field notes page shows pre-seeded notes; publishing a new note awards points
- [ ] Full demo path runs end-to-end without errors: matter → Context → Connect → Flow → Reputation

---

## Phase 4 — Polish & Demo Hardening
**Dates:** May 1–7  
**Goal:** The prototype is visually polished, demo-proof, and performant enough to impress judges on a live URL.

### Deliverables
- Dentons brand consistency pass — colour, typography, logo placement across all pages
- Loading states on every async operation — no empty white screens
- Empty states on every list — no "undefined" or blank pages
- Error boundaries — one failed API call does not crash the page
- `scripts/demo-reset.ts` — resets DB to exact clean demo state in under 30 seconds
- Tablet/mobile responsiveness — navigation and key pages work on iPad (judges may demo on tablet)
- Lighthouse performance pass — lazy-load `@xenova/transformers` model, optimise images with Next.js `Image`
- Security audit — RLS policies confirmed, auth middleware covers all protected routes
- 3× full demo rehearsal — timed run-through of the 8-minute demo script
- Backup demo video — recorded walkthrough in case of live connectivity issues on demo day
- `README.md` — setup instructions and demo script documented

### Exit Criteria
- [ ] `scripts/demo-reset.ts` resets the database to clean demo state in under 30 seconds
- [ ] Full 8-minute demo runs without errors on the live Vercel URL
- [ ] No broken links, undefined states, or console errors during demo path
- [ ] App is usable on a 768px-wide tablet screen
- [ ] Backup video recording exists and covers the full demo story
- [ ] A second person (not the builder) can run the demo successfully using only the demo script

---

## Dependencies Between Phases

```
Phase 0 (Foundation)
    │
    ▼
Phase 1 (Context) ──── requires: matters, DB schema, Groq
    │
    ▼
Phase 2 (Connect) ──── requires: lawyer embeddings, pgvector, matter team
    │
    ▼
Phase 3 (Flow + Gamification) ──── requires: matter team, tasks, reputation events
    │
    ▼
Phase 4 (Polish) ──── requires: all features working
```

Each phase must meet its exit criteria before the next phase begins. If a phase slips, Phase 4 (Polish) absorbs the time — feature completeness takes priority over polish.

---

*Last updated: April 2026*
