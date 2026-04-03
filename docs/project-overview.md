# Doly — Project Overview
**NUGIC Innovation Challenge · Dentons · 2026**

---

## What is Doly?

Doly (short for **Dentons Polycentric**) is a global operating system built specifically for Dentons, the world's largest law firm. It connects 12,000 lawyers across 80+ countries into one seamless, intelligent network — turning Dentons' distributed structure from a coordination liability into a 24-hour competitive advantage.

> *"One firm. Everywhere."*

---

## The Problem

Dentons' polycentric model — built through 40 mergers over 12 years — gives it unmatched global reach. But that same structure creates four compounding problems that no internal system currently solves:

| # | Problem | Root Cause |
|---|---|---|
| 1 | **Knowledge lives in silos** | Each merger created a separate knowledge base. Expertise is invisible across borders. |
| 2 | **No incentive to collaborate globally** | The Swiss verein structure keeps office finances separate. Cross-border work depends on personal goodwill, not system design. |
| 3 | **Cultural intelligence is undocumented** | Decades of market expertise — negotiation norms, regulatory nuance, communication styles — exists only in individual lawyers' heads. Never captured. Never shared. |
| 4 | **Time zones break momentum** | Cross-border matters stall when offices close. Without intelligent routing, progress depends on manual coordination across 24-hour gaps. |

> *"The right expertise exists inside Dentons. The opportunity is making it instantly accessible — to every lawyer, on every matter, everywhere."*

---

## The Solution

Doly addresses all four problems through three integrated features, layered on top of infrastructure Dentons already owns.

### Context — Instant Country Intelligence
When a cross-border matter opens, Doly automatically generates a structured briefing for every jurisdiction involved: legal landscape, cultural business norms, and regulatory requirements. Built from public sources and lawyer field notes. Zero client data used.

### Connect — Global Expertise Matching
Every lawyer's jurisdiction knowledge is mapped and searchable firm-wide. When a matter opens, Doly uses AI-powered vector similarity to surface the right colleagues — matched by jurisdiction, language, experience, and matter type — in seconds. A gamified reputation engine rewards lawyers for sharing knowledge, replacing the financial incentive the verein structure removes.

### Flow — 24-Hour Work Engine
Doly routes tasks to the next available qualified office as each timezone closes. Full context is preserved on every handoff. Client matters progress overnight without manual coordination. Dentons' global footprint becomes a 24-hour delivery advantage.

---

## Success Criteria

The prototype is considered successful if a judge can:

- [ ] Log in as a Dentons lawyer and view the dashboard
- [ ] Create a cross-border matter with multiple jurisdictions
- [ ] Watch jurisdiction briefs generate live via AI (Context)
- [ ] See a ranked list of matched lawyers with AI similarity scores (Connect)
- [ ] Invite lawyers to the matter with one click
- [ ] View tasks routed across timezones with context preserved (Flow)
- [ ] See a firm-wide reputation leaderboard with real point accumulation
- [ ] Browse the global lawyer directory and individual profiles
- [ ] Contribute and browse field notes by jurisdiction

---

## Constraints

| Constraint | Detail |
|---|---|
| **Deadline** | May 7, 2026 — live demo at NUGIC Innovation Challenge |
| **Team size** | 1–2 developers |
| **Budget** | $0 — all services must be free tier |
| **AI** | No paid AI APIs — Groq (free) for text generation, `@xenova/transformers` (local) for embeddings |
| **Deployment** | Must be accessible via a live hosted URL for judges |
| **Data privacy** | No client data may cross borders; attorney-client privilege fully protected |
| **Brand** | Must follow Dentons colour theme (navy, red, cream) |

---

## Tech Stack (Summary)

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | Supabase (PostgreSQL + pgvector) |
| Text AI | Groq — Llama 3.3 70B (free tier) |
| Embeddings | `@xenova/transformers` — runs in-process, no API needed |
| Deployment | Vercel (free tier) |

→ See [architecture.md](./architecture.md) for full technical detail.

---

## The Demo Story

**Marcus** is a corporate lawyer at Dentons Miami. A US tech client needs a coordinated legal strategy across Brazil, Mexico, Colombia, and Germany — in five days.

**Before Doly:** Marcus searches manually, emails six colleagues, hears back from two, neither in the right market. He builds a generic strategy without local confidence.

**With Doly:**
1. Marcus opens the matter — Doly detects four jurisdictions and activates instantly
2. Four country briefings generate in real time — laws, culture, communication norms
3. Doly surfaces Isabella (Bogotá), Rodrigo (São Paulo), and Klaus (Frankfurt) — matched in one click
4. Tasks route overnight: Rodrigo picks up the Brazil filing at 4pm São Paulo, Klaus handles Germany at 8am Frankfurt
5. A locally fluent, four-country strategy is delivered in five days

**Isabella** — a senior partner in Bogotá with deep LatAm tech expertise — was invisible before Doly. Three similar matters this year, zero discoverability. Doly makes her the first result.

> *"Every competitor can copy a tool. No one can copy a network that has been activating itself for years. That is Doly."*

---

## Scope: What This Prototype Is (and Isn't)

**In scope:**
- Full working system with real AI, real routing logic, real data
- All three core features: Context, Connect, Flow
- Gamification and reputation engine
- Field notes knowledge base
- Seeded with realistic demo data (15 lawyers, 80+ countries represented)

**Out of scope for this prototype:**
- Integration with real Dentons systems (DAISY, AXL, OpenAI Enterprise)
- Real lawyer authentication against Dentons directory
- Document management or matter billing
- Mobile native app

---

*Last updated: April 2026*
