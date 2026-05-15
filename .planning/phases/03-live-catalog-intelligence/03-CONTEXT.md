# Phase 3: Live Catalog Intelligence - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Real-time Shopify product catalog queries — users can ask about product availability, sizing, stock levels, and variant options with answers grounded entirely in live (mock) catalog data. This phase builds the catalog service layer, intent detection, and ChatWidget integration pipeline. No order, return, or escalation workflows — those are Phases 4-6.

</domain>

<decisions>
## Implementation Decisions

### Mock Data Scope
- **D-01:** 5-7 products across two categories (clothing + accessories)
- **D-02:** 3 variant dimensions per product: Size, Color, Material
- **D-03:** Stock scenarios: in-stock, out-of-stock, low-stock (≤5 = low), and backordered
- **D-04:** Product naming is abstract/generic (not branded)

### Variant Matching Precision
- **D-05:** Parse in two phases — structured (product + option values) first, natural language fallback second
- **D-06:** Color matching via synonym alias table (navy→Blue, charcoal→Gray, etc.)
- **D-07:** Size matching via normalized mapping (S→Small, M→Medium, XL→Extra Large, MD→Medium)
- **D-08:** Ambiguous matches trigger an interactive clarification request (not silent pick-first)

### Out-of-Stock Behavior
- **D-09:** When OOS: state unavailability + automatically show up to 5 alternative products
- **D-10:** Alternative criteria: same category + similar price range (±20%)
- **D-11:** Low-stock items flagged with urgency message (stock ≤5 units)
- **D-12:** Backordered items presented with offer to backorder + ETA

### Intent Detection Approach
- **D-13:** Hybrid approach — keyword pre-filter, then structured parsing
- **D-14:** Categories: stock check, sizing inquiry, product search, variant lookup
- **D-15:** Integration point: extend Phase 2's ResponseGrounder rather than adding a separate pipeline branch
- **D-16:** Catalog keywords live in a separate `CATALOG_KEYWORDS` alongside Phase 2's `ON_TOPIC_KEYWORDS`

### Search Depth & Response Format
- **D-17:** Search covers title + product type + description (full text)
- **D-18:** Results displayed as rich product cards (name, price, image placeholder, variant options, stock status)
- **D-19:** Stock status uses both colored badge (green/red/yellow) + text label
- **D-20:** Up to 10 results shown per response

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements
- `.planning/requirements/TRACK_4_SUPPORT.md` — Mandatory Product Intelligence workflow requirements
- `.planning/requirements/PROJECT.md` — Project overview, goals, Track 4 specifics

### Project Artifacts
- `.planning/ROADMAP.md` — Phase 3: Live Catalog Intelligence goal and success criteria
- `.planning/STATE.md` — Current project state, locked decisions about caching and CatalogDataSource

### Architecture & Codebase
- `.planning/codebase/ARCHITECTURE.md` — System architecture, layered design, integration patterns
- `.planning/codebase/STACK.md` — Technology stack (TypeScript, OpenCode plugin, npm, tsc)
- `.planning/codebase/INTEGRATIONS.md` — External integration patterns

### Phase Context
- `.planning/phases/01-set-up-ai-customer-support-agent-foundation/01-CONTEXT.md` — Prior decisions that carry forward (store-native, no hallucinations, modular services)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **PolicyService pattern** (`src/services/`) — Interface-driven service with swappable data sources. CatalogService should follow this exactly
- **OffTopicDetector keyword system** — `ON_TOPIC_KEYWORDS` pattern can be extended with `CATALOG_KEYWORDS`
- **ResponseGrounder** — Can be extended to route catalog intents (per D-15)
- **ChatWidget** — Existing message rendering pipeline needs product card component

### Established Patterns
- **Interface-first design** — PolicyService defines an interface, then mock implementation. CatalogService should mirror this
- **src/services/ organization** — Each service in its own module with `.test.ts` alongside
- **TDD workflow** — Tests required before implementation, 80%+ coverage

### Integration Points
- **ResponseGrounder.extend()** — Hook for catalog intent routing (per D-15)
- **ChatWidget render pipeline** — New ProductCard component needs to slot into existing message rendering
- **CatalogDataSource interface** — Swappable between MockCatalogDataSource and future ShopifyApiDataSource

</code_context>

<specifics>
## Specific Ideas

- Product cards should feel like real e-commerce product display — name, variants grid-style, stock badge, price
- "Only 2 left!" urgency flag for low-stock items
- Alternative suggestions should feel helpful, not pushy — "Here are some similar options:"
- Disambiguation should be natural: "We have the Classic Hoodie in Medium in Blue, Black, and Gray. Which color?"

</specifics>

<deferred>
## Deferred Ideas

- Comparison queries ("how does X compare to Y") — could be a future enhancement
- Add-to-cart action from chat — belongs in a future checkout/handoff phase
- Real Shopify API integration — Phase 3 uses mock data; live integration belongs in a later phase when store is connected

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-live-catalog-intelligence*
*Context gathered: 2026-05-15*
