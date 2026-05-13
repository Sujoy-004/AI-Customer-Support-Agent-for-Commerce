# GSD Implementation Plan — Kasparro Track 4: AI Customer Support Agent

> **Protocol:** Get Shit Done (GSD) — Phased Waves with Gates.
> Each wave has a hard gate. The next wave does not begin until the gate passes.
> Deadline: **20 May 2026, 11:59 PM IST**

---

## Wave Overview

| Wave | Name | Duration | Gate |
|---|---|---|---|
| 0 | Foundation & Contracts | Day 1 | DB up, stubs green |
| 1 | Data Layer (Shopify Sync) | Day 1–2 | 3 read-tools return real data |
| 2 | Write Workflows | Day 2–3 | Return flow end-to-end, failure-safe |
| 3 | Agent Core | Day 3–4 | All 4 workflows pass, 3 adversarial inputs escalate |
| 4 | UI + Experience | Day 4 | Full journey in browser, mobile-ready |
| 5 | Hardening + Docs | Day 5 | All deliverables present, video recorded |

---

## Wave 0 — Foundation & Contracts
**Goal:** Repo, environment, and inter-service contracts locked before any feature code.

### Tasks

| # | Task | Output |
|---|---|---|
| 0.1 | Monorepo scaffold (`/agent`, `/api`, `/ui`, `/docs`) | Folder structure committed |
| 0.2 | DB migrations — all schema tables via Drizzle/Prisma | `/migrations/*.sql` |
| 0.3 | Shopify OAuth flow + webhook endpoint registration | `POST /webhooks/shopify` |
| 0.4 | Environment config (API keys, secrets, feature flags) | `.env.example` with all keys documented |
| 0.5 | Define all 5 Tool Contracts as TypeScript interfaces | `/agent/tools/types.ts` |
| 0.6 | Stub all 5 tools (signatures + mock returns, no logic) | Stubs pass unit tests |
| 0.7 | Initialize `DECISION_LOG.md` with first 3 entries | `DECISION_LOG.md` |

### Gate 0 ✅
- Database is up and migrations run cleanly
- Shopify OAuth handshake succeeds on sandbox store
- All 5 stubs return mocked data without errors
- Test suite is green

---

## Wave 1 — Data Layer (Shopify Sync)
**Goal:** Agent can read real, grounded store data. No AI yet.

### Tasks

| # | Task | Output |
|---|---|---|
| 1.1 | `syncProducts` cron job — pull catalog → `products_cache` + generate embeddings | Scheduled job |
| 1.2 | `syncPolicies` cron job — pull store policies → `store_policies` + generate embeddings | Scheduled job |
| 1.3 | Order webhook handler → real-time upsert into `orders` cache | `POST /webhooks/orders` |
| 1.4 | `getOrder(orderId, customerEmail)` tool — includes verified ownership check | Tool v1 |
| 1.5 | `searchProducts(query)` tool — vector similarity search on `products_cache` | Tool v1 |
| 1.6 | `getPolicy(topic)` tool — semantic lookup on `store_policies` | Tool v1 |
| 1.7 | Unit tests: ownership bypass attempts, missing order, Shopify API timeout | Test suite |

### Gate 1 ✅
- All 3 read-tools return real Shopify sandbox data
- Ownership check rejects wrong-customer order lookup
- Shopify API downtime returns a structured error object — does not crash the process

---

## Wave 2 — Write Workflows
**Goal:** Agent can initiate returns. This is the only write path in scope.

### Tasks

| # | Task | Output |
|---|---|---|
| 2.1 | `initiateReturn(orderId, lineItems, reason)` tool — full implementation | Tool v1 |
| 2.2 | Return eligibility validation (policy window check, item condition rules) | Validation layer |
| 2.3 | Shopify Returns API call → store `shopify_return_id` in `return_requests` | API integration |
| 2.4 | Fallback path: if Shopify Returns API is unavailable → create `return_requests` row with `status = initiated`, add to retry queue | Queue + retry logic |
| 2.5 | Idempotency guard: DB unique constraint prevents duplicate return for same order + item | Migration update |
| 2.6 | `escalate(reason)` tool — writes to `escalations`, flips `conversations.status` to `escalated` | Tool v1 |
| 2.7 | Integration tests: double-submit rejection, ineligible item, API-down fallback | Test suite |

### Gate 2 ✅
- Return flow completes end-to-end on Shopify sandbox
- Duplicate return submission is rejected with clear error
- API-down path creates a queued `return_requests` record with no data loss
- `escalate` tool correctly updates conversation status

---

## Wave 3 — Agent Core
**Goal:** LLM orchestrator wired to all 5 tools with guardrails and boundary enforcement.

### Tasks

| # | Task | Output |
|---|---|---|
| 3.1 | System prompt v1: persona, scope definition, escalation triggers, no-hallucination rules | `/agent/prompts/system.ts` |
| 3.2 | Claude tool-use loop with all 5 tools registered and callable | Agent loop in `/agent/index.ts` |
| 3.3 | **AI/Deterministic boundary enforcement**: LLM decides *which* tool to call; deterministic code *executes* and *validates* all tool arguments | `/agent/executor.ts` |
| 3.4 | LLM output validation: if tool arguments fail Zod schema → retry once → escalate on second failure | Validation + retry middleware |
| 3.5 | Confidence scoring: detect hedging language on critical flows → auto-escalate | Escalation trigger |
| 3.6 | Context management: inject relevant order/product context into prompt via Context7 | Context layer |
| 3.7 | Conversation history truncation: last N turns + rolling summary for long sessions | Memory manager |
| 3.8 | Adversarial unit tests: garbage LLM output, hallucinated order IDs, missing tool call response | Test suite |

### Gate 3 ✅
- Agent completes all 4 workflows (product Q&A, policy Q&A, order status, return initiation) in test conversations
- Agent escalates correctly on 3 adversarial inputs
- Zero hallucinated Shopify data passes through to the user
- All tool args are validated before execution

---

## Wave 4 — UI + Experience
**Goal:** High-fidelity chat interface. Not a generic widget — a real, polished support experience.

### Tasks

| # | Task | Output |
|---|---|---|
| 4.1 | Chat UI (React) — message thread, typing indicator, tool-use status chips ("Checking your order…") | `/ui/components/Chat.tsx` |
| 4.2 | Return initiation flow — inline confirmation card showing item, reason, and policy window | UI component |
| 4.3 | Order status card — fulfillment timeline, tracking link, carrier name | UI component |
| 4.4 | Escalation state — handoff message, email capture for follow-up | UI component |
| 4.5 | Optimistic UI: show in-progress state while tool call is running | UX polish |
| 4.6 | Mobile-responsive layout, accessible (WCAG AA minimum) | Audit pass |
| 4.7 | Error states: Shopify-down banner, LLM retry indicator, graceful empty states | Error UI |

### Gate 4 ✅
- Full user journey demoed end-to-end in browser: product question → order status → return initiation → escalation
- No blank or broken states at any step
- Works correctly on mobile viewport

---

## Wave 5 — Hardening + Docs
**Goal:** Demo-ready for judges. All mandatory deliverables complete.

### Tasks

| # | Task | Output |
|---|---|---|
| 5.1 | Rate limiting per `session_token` to prevent abuse | Middleware |
| 5.2 | Internal `tool_call_logs` dashboard showing failure rates by tool | `/admin` page |
| 5.3 | Finalize `PRODUCT_DOC.md` — Problem, Journey, Decisions, Tradeoffs, Scope | Deliverable |
| 5.4 | Finalize `TECHNICAL_DOC.md` — Architecture diagram, AI boundary, failure handling, limitations | Deliverable |
| 5.5 | Finalize `DECISION_LOG.md` — minimum 10 entries in "Considered X, chose Y, because Z" format | Deliverable |
| 5.6 | `README.md` — setup in fewer than 5 commands | Deliverable |
| 5.7 | Record demo video (3–5 min, narrated) — cover all 4 workflows | `.mp4` file |
| 5.8 | Submit via Google Forms before deadline | Submitted ✅ |

### Gate 5 ✅
- All mandatory deliverables (`PRODUCT_DOC.md`, `TECHNICAL_DOC.md`, `DECISION_LOG.md`, `README.md`) are present and complete
- Demo video is recorded and covers all 4 core workflows
- Google Forms submission completed before **20 May 2026, 11:59 PM IST**

---

## AI / Deterministic Boundary (Reference)

```
User message
     │
     ▼
[ LLM ] ──── decides which tool to call, with what arguments
     │
     ▼
[ executor.ts ] ──── validates args with Zod schema (deterministic)
     │                 ├── FAIL → retry once → escalate
     │                 └── PASS → execute tool
     ▼
[ tool ] ──── calls Shopify API / DB / vector search (deterministic)
     │         ├── API error → structured error object returned
     │         └── Success → structured result returned
     ▼
[ LLM ] ──── synthesizes response from tool result (never raw API data to user)
```

---

## Scope Explicitly Excluded
*(Logged in DECISION_LOG.md as conscious product decisions — critical for the Product Thinking 25% criterion)*

| Cut | Reason |
|---|---|
| Exchange / reorder workflows | Doubles scope; return-only covers 80% of support volume |
| Multi-language support | Not in scope for hackathon store; add post-launch |
| Proactive outreach / push notifications | Requires separate channel infrastructure |
| Merchant-facing analytics dashboard | Different user; different product |
| Voice interface | No audio infra; no judging signal for it |
| Loyalty / rewards queries | Store-specific; no generalizable model |

---

## Submission Checklist

- [ ] `PRODUCT_DOC.md`
- [ ] `TECHNICAL_DOC.md`
- [ ] `DECISION_LOG.md` (10+ entries)
- [ ] `README.md`
- [ ] Demo video (3–5 min)
- [ ] Git history with atomic, meaningful commits
- [ ] Google Forms submitted: https://forms.gle/sYaqxeyBAajNPV9t7
