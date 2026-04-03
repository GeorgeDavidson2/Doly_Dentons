# Doly — Milestones
**NUGIC Innovation Challenge · Dentons · 2026**

---

## Overview

Milestones are specific, dated checkpoints that confirm a phase is complete and the build is on track. Each milestone has a clear pass/fail test — either it works or it doesn't.

| # | Milestone | Date | Phase |
|---|---|---|---|
| M1 | Live URL with auth and lawyer profiles | Apr 9 | Foundation |
| M2 | Matter creation triggers live AI briefing generation | Apr 16 | Context |
| M3 | Isabella surfaces #1 for Marcus's 4-country matter | Apr 23 | Connect |
| M4 | Full end-to-end demo path works | Apr 30 | Flow + Gamification |
| M5 | Demo-ready on live URL | May 7 | Polish |

---

## M1 — Live URL with Auth and Lawyer Profiles
**Date:** April 9, 2026  
**Phase:** Foundation

### What must be true
- Vercel URL is live and publicly accessible
- Login via email magic link works (sign in, session persists, sign out)
- All page routes navigate without errors
- `/lawyers` shows all 15 seeded lawyers with name, office, jurisdiction tags
- `/lawyers/[id]` shows full profile — bio, jurisdiction matrix, reputation score
- Dentons navy/red/cream colour theme is applied across all pages

### Test
Open the Vercel URL in an incognito browser. Log in with a demo lawyer email. Navigate to every page in the sidebar. Click through to 3 different lawyer profiles. Sign out. All steps complete without errors.

---

## M2 — Matter Creation Triggers Live AI Briefing Generation
**Date:** April 16, 2026  
**Phase:** Context

### What must be true
- `/matters/new` form accepts title, client name, matter type, up to 6 jurisdictions, and deadline
- Submitting the form creates the matter and immediately redirects to the Context tab
- Context tab shows skeleton shimmer cards for each jurisdiction instantly
- Briefs populate one by one as Groq completes each call (not all at once)
- Each brief contains all three sections: Legal Landscape, Cultural Intelligence, Regulatory Notes
- Revisiting the matter serves briefs from the database — no re-generation
- 50 reputation points are awarded to the matter creator

### Test
Log in as Marcus. Create a matter: "TechCorp Global Expansion" with jurisdictions BR, MX, CO, DE. Watch the Context tab. All 4 briefs must generate and display within 60 seconds. Navigate away and back — briefs load instantly from cache.

---

## M3 — Isabella Surfaces #1 for Marcus's 4-Country Matter
**Date:** April 23, 2026  
**Phase:** Connect

### What must be true
- All 15 lawyers have embeddings stored in Supabase
- Connect tab on Marcus's matter shows a ranked list of matched lawyers
- Isabella Reyes appears as the #1 match with the highest score
- Rodrigo Costa and Klaus Weber appear in the top 5
- Each match card shows: name, office, match score (as a % bar), matched jurisdictions (highlighted), expertise level, reputation score
- Clicking "Invite" adds the lawyer to the matter team and awards reputation points to both parties

### Test
Open Marcus's 4-country matter. Go to Connect tab. Verify Isabella is ranked #1. Verify Rodrigo and Klaus are in the top 5. Invite Isabella — confirm she appears in the matter team roster and both lawyers gained reputation points.

---

## M4 — Full End-to-End Demo Path Works
**Date:** April 30, 2026  
**Phase:** Flow + Gamification

### What must be true
- Tasks exist for the matter — one per jurisdiction (BR, MX, CO, DE)
- Flow tab shows a three-column task board and a timezone timeline
- Timezone timeline shows correct local times for Miami, Bogotá, São Paulo, Frankfurt
- "Route All Tasks" assigns tasks correctly: CO → Isabella, BR → Rodrigo, DE → Klaus (or "queued for Klaus at 8am Frankfurt")
- Each routed task shows the assigned lawyer, their timezone, and preserved handoff context
- Reputation leaderboard at `/reputation` loads with Isabella in the top 3
- Reputation charts show growth history for top lawyers
- Field notes at `/field-notes` display pre-seeded notes across BR, MX, CO, DE
- The complete demo script (login → create matter → Context → Connect → Flow → Reputation) runs without any errors in under 10 minutes

### Test
Run the full 8-minute demo script from start to finish. Every step must complete without errors, broken states, or console warnings. Time the run — it must finish in under 10 minutes.

---

## M5 — Demo-Ready on Live URL
**Date:** May 7, 2026  
**Phase:** Polish

### What must be true
- `scripts/demo-reset.ts` resets the database to clean demo state in under 30 seconds
- The full demo runs cleanly on the live Vercel URL in an incognito browser
- No broken links, undefined states, loading spinners that never resolve, or console errors during the demo path
- App is usable on a 768px tablet screen (key pages scroll and display correctly)
- A second person can run the full demo using only the written demo script — no coaching needed
- A backup video recording of the full demo exists
- `README.md` documents setup steps and the demo script

### Test
Run `demo-reset.ts`. Open the Vercel URL in a fresh incognito browser on a different device. Hand the demo script to a second person. They must complete the full demo without assistance. Record the session as the backup video.

---

## Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Groq rate limit during demo | Low | High | Brief caching means re-running the demo never hits Groq again after first run |
| `@xenova/transformers` slow cold start on Vercel | Medium | Medium | Pre-warm the model with a health-check endpoint; Vercel keeps instances warm for active apps |
| Isabella doesn't rank #1 in Connect | Low | High | Tune secondary scoring weights during Phase 2; verified as M3 exit criteria |
| Phase slippage | Medium | Medium | Phase 4 (Polish) absorbs the time — feature completeness always takes priority |
| Demo reset script fails on demo day | Low | High | Test `demo-reset.ts` at least 5 times before May 7; keep a pre-reset Supabase snapshot as backup |

---

*Last updated: April 2026*
