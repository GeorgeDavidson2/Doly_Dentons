# Dentons Technology Ecosystem
**Reference Document — Doly Build Team**

> This document maps Dentons' existing technology stack and explains how Doly relates to each tool. Use this when building, pitching, or answering judge questions about fit.

---

## Overview: The "Build + Buy + Partner" Strategy

Dentons operates a deliberate three-track technology doctrine:
- **Build** — FleetAI and DAISY secure the operational core with full data control
- **Buy/Partner** — Legora, Intanify, Luminance, and Noxtua cover specialist niches faster than in-house builds could
- **Scout** — Office Hours systematically evaluates what comes next

DAISY's model-agnostic architecture is the most strategically significant piece — Dentons is not locked into any single LLM vendor, which is both a technical and regulatory hedge (EU AI Act, Canada's AIDA).

---

## The 7 Tools

### 1. FleetAI — Built In-House
**What it is:** Dentons' flagship proprietary generative AI chatbot. Launched in London, it became the firm's most rapidly adopted legal tech product ever.

| Attribute | Detail |
|---|---|
| Model | OpenAI GPT-4 |
| Architecture | Private, closed deployment — no external access |
| Data handling | Auto-erasure after 30 days; zero public model training |
| Scope | Global |
| Primary use | General-purpose AI productivity for all lawyers and staff |

**Relationship to Doly:** FleetAI is a chat assistant — it does not do expertise matching, timezone routing, or knowledge capture. No overlap. Doly operates at the coordination layer FleetAI doesn't touch.

---

### 2. DAISY — Built In-House
**What it is:** A modular, plug-and-play GenAI platform developed by Dentons' European Innovation and Intelligence team. Model-agnostic — can swap between GPT-4, Claude, Mistral, or any future LLM without rebuilding the platform.

| Attribute | Detail |
|---|---|
| Architecture | Model-agnostic, plug-and-play modular system |
| LLM flexibility | Swappable — GPT-4, Claude, Mistral, or any future model |
| Features | Document summarisation, drafting, translation, internal policy browser |
| Security | Private, firm-controlled — no data leaves the firm |
| Scope | Europe & Central Asia |
| Primary use | General-purpose AI for all firm personnel |

**Relationship to Doly:** **Critical integration point.** In production, Doly's Groq API calls are replaced by DAISY calls — Doly becomes a coordination layer on top of DAISY's AI capabilities. This is a one-file change (`lib/ai/groq.ts`). Doly does not compete with DAISY; it uses DAISY as its AI backbone.

---

### 3. Legora — Partnership
**What it is:** A collaborative AI workspace built specifically for legal workflows. Partnered with Dentons for European offices in June 2025. Designed for high-volume, high-stakes legal work — document review, drafting, and secure legal research.

| Attribute | Detail |
|---|---|
| AI layer | Generative AI + machine learning + NLP |
| Key capabilities | Large-scale document review, drafting, editing, secure legal research |
| Data access | Internal and external legal databases |
| Deployment | SaaS — European offices |
| Scope | Europe |

**Relationship to Doly:** Legora handles documents. Doly handles people and coordination. A lawyer might use Legora to review the Germany regulatory filings and Doly to route that task to Klaus in Frankfurt. Entirely complementary.

---

### 4. Intanify — Partnership
**What it is:** An AI-powered fintech startup specialising in intellectual property analysis. Deployed firm-wide (October 2024) as a white-label product embedded inside Dentons' own interface.

| Attribute | Detail |
|---|---|
| Core tech | IP knowledge graphs + structured legal and financial datasets |
| Capabilities | IP due diligence, risk assessment, IP asset valuation |
| Deployment | White-label — embedded inside Dentons' interface |
| Scope | Global |

**Relationship to Doly:** IP-domain specific. No overlap with Doly's coordination and expertise-matching functions.

---

### 5. Luminance — Partnership
**What it is:** A purpose-built legal AI platform trained specifically on legal documents (not a general LLM). Dentons' Dubai office used it to cut a two-month contract review process to two weeks — an 80% time reduction.

| Attribute | Detail |
|---|---|
| Core tech | Machine learning + NLP trained on legal documents |
| Specialty | Contract review and analysis at scale |
| Architecture | Purpose-built legal AI — not a general LLM wrapper |
| Deployment | SaaS |
| Scope | Global |

**Relationship to Doly:** Contract review only. No overlap.

---

### 6. Noxtua — Partnership
**What it is:** Described as the first "sovereign AI in Europe." Data never crosses borders — critical for GDPR and EU AI Act compliance. Runs entirely on European infrastructure, unlike most law firm AI tools that run on US hyperscalers (AWS, Azure, GCP).

| Attribute | Detail |
|---|---|
| Type | Sovereign AI — jurisdiction-controlled, on-premise |
| Key feature | Data sovereignty — data never leaves a specific legal jurisdiction |
| Compliance | GDPR and EU AI Act compliant |
| Infrastructure | On-premise, EU-native |
| Scope | Europe |

**Relationship to Doly:** Noxtua confirms that **data sovereignty is a hard firm requirement**, not optional. Doly's architecture is designed around this constraint from the ground up — no client data stored, no data crossing borders, single-region database, attorney-client privilege protected globally.

---

### 7. Office Hours — Innovation Infrastructure
**What it is:** A legal tech incubator launched in April 2025 by Dentons UKIME. Companies with a working MVP apply, collaborate with Dentons' Innovation and AI team on a specific focus area, and if successful enter a commercial agreement scalable to other Dentons regions globally.

| Attribute | Detail |
|---|---|
| Process | Lean Six Sigma evaluation framework |
| Testing | Synthetic data for initial product evaluation |
| Stage gate | Proof of Technology → Pilot → Commercial agreement |
| Scope | UK, Ireland & Middle East (scalable globally) |

**Six focus areas:**
1. Knowledge management
2. Document lifecycle and matter management
3. Communication and collaboration
4. Document and data extraction
5. Data analysis and information visualisation
6. Budgeting, costs and resource management

**Relationship to Doly:** **Primary adoption pathway.** Doly addresses focus areas 1, 2, and 3 directly. The NUGIC prototype is Doly's Proof of Technology submission — the first stage of the Office Hours gate. A successful innovation challenge demo is the natural entry point to an Office Hours application.

---

## How Doly Fits — Summary

```
┌─────────────────────────────────────────────────────────────┐
│                  Dentons Technology Stack                   │
│                                                             │
│  FleetAI ──── General AI chat (all staff, global)          │
│  DAISY ─────── Model-agnostic GenAI platform (EU/CA)        │
│                         ↑                                   │
│                   Doly plugs in here in production          │
│                         │                                   │
│  Doly ──────── Coordination OS (expertise matching,        │
│                cross-border routing, knowledge capture)     │
│                         │                                   │
│  Legora ────── Document review + legal research (EU)        │
│  Luminance ─── Contract review at scale (global)           │
│  Intanify ──── IP due diligence (global)                    │
│  Noxtua ─────── Sovereign EU AI (EU)                        │
│                                                             │
│  Office Hours ─ Innovation incubator → Doly entry point    │
└─────────────────────────────────────────────────────────────┘
```

**No existing tool does what Doly does.** Doly is the missing coordination layer — it connects lawyers to each other and to the right work, rather than lawyers to documents or general AI assistance.

---

*Last updated: April 2026*
*Source: Dentons Technology Ecosystem document (internal)*
