# Feature Research

**Domain:** Shopify Store-Native AI Support Agent
**Researched:** May 14 2026
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Live Catalog Sync | Essential to answer product questions accurately | MEDIUM | Must pull real-time data to avoid hallucinations |
| Store Policy Parsing | Users ask about shipping, returns, warranty | LOW | Need to ingest and accurately recall policies |
| Basic FAQ Resolution | Core function of any support bot | LOW | Handle common queries without escalation |
| Graceful Handoff | Users get frustrated if they can't reach a human | MEDIUM | Must escalate to a human agent seamlessly with full context |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Live Order Tracking | High volume support query handled instantly | HIGH | Requires deep integration with Shopify fulfillment API |
| In-Chat Return Initiation | Low friction for users, reduces manual support load | HIGH | Must execute active workflows directly via Shopify API |
| Real-Time Stock & Sizing | High-fidelity shopping assistance | HIGH | Prevent recommending out-of-stock items, needs real-time API sync |
| Socratic Clarification | Clarifies ambiguous user queries before acting | MEDIUM | Prevents wrong actions, builds trust |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| General LLM Chitchat | Seems engaging and human-like | Causes hallucinations, off-brand responses, and wasted tokens | Strict guardrails confining agent to store context |
| Product Discovery/Sales | Try to upsell users in support chat | Annoying when user just wants support | Focus strictly on Track 4 (Support), refer to catalog only when asked |

## Feature Dependencies

```
[Live Catalog Sync]
    └──requires──> [Real-Time Stock & Sizing]

[Live Order Tracking]
    └──requires──> [Graceful Handoff] (for edge cases)

[In-Chat Return Initiation]
    └──requires──> [Store Policy Parsing]
    └──requires──> [Live Order Tracking]
```

### Dependency Notes

- **Real-Time Stock & Sizing requires Live Catalog Sync:** Cannot check stock without a product catalog foundation.
- **In-Chat Return Initiation requires Store Policy Parsing:** Must ensure the return is within policy before initiating the workflow.
- **In-Chat Return Initiation requires Live Order Tracking:** Needs order context to initiate the return.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] Live Catalog Sync — Foundation for accurate product answers
- [x] Store Policy Parsing — Handles bulk of simple queries
- [x] Graceful Handoff — Critical safety net for MVP
- [x] Live Order Tracking — High-value workflow to prove utility

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] In-Chat Return Initiation — Complex workflow, high value but risky for v1
- [ ] Real-Time Stock & Sizing — Enhances accuracy, good fast-follow

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Advanced analytics and ticket classification
- [ ] Multi-language support

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Live Catalog Sync | HIGH | MEDIUM | P1 |
| Store Policy Parsing | HIGH | LOW | P1 |
| Live Order Tracking | HIGH | HIGH | P1 |
| Graceful Handoff | HIGH | MEDIUM | P1 |
| In-Chat Return Initiation | HIGH | HIGH | P2 |
| Real-Time Stock & Sizing | MEDIUM | HIGH | P2 |
| General LLM Chitchat | LOW | LOW | P3 (Anti-feature) |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Standard Support Bots | Our Approach (Antigravity) |
|---------|-----------------------|----------------------------|
| Order Tracking | Usually just links to a tracking page | Deep integration, explains status in natural language |
| Returns | Links to a portal | Executes the return workflow directly in the conversation |
| Context | Static FAQs, prone to hallucination | Zero-hallucination, strictly grounded in live Shopify data |

## Sources

- .planning/PROJECT.md (Project Context)
- Industry standard customer support expectations (Shopify ecosystem)

---
*Feature research for: Shopify Store-Native AI Support Agent*
*Researched: May 14 2026*
