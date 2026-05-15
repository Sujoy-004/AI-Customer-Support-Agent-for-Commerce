# Phase 3: Live Catalog Intelligence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 03-live-catalog-intelligence
**Areas discussed:** Mock data scope, Variant matching precision, Out-of-stock behavior, Intent detection approach, Search depth & response format

---

## Mock Data Scope

| Option | Description | Selected |
|--------|-------------|----------|
| 3-5 products, one category | E.g., 3-5 hoodies with size/color variants | |
| 5-7 products, two categories | Clothing + accessories | ✓ |
| You decide | Agent picks | |

**User's choice:** 5-7 products, two categories (clothing + accessories)
**Notes:** User wanted variety to show cross-category search.

| Option | Description | Selected |
|--------|-------------|----------|
| 2 dimensions (Size + Color) | S/M/L + Red/Blue/Black | |
| 3 dimensions (Size + Color + Material) | S/M/L + Red/Blue + Cotton/Polyester | ✓ |
| Mixed per product | Some 2-dim, some 1-dim, some no variants | |

**User's choice:** 3 dimensions (Size + Color + Material)
**Notes:** Realistic for apparel.

| Option | Description | Selected |
|--------|-------------|----------|
| In-stock + out-of-stock + low-stock | 0, 1-3, 10+ | |
| In-stock + out-of-stock only | Binary | |
| In-stock + OOS + low + backordered | Also includes backordered | ✓ |

**User's choice:** In-stock + OOS + low + backordered
**Notes:** Most comprehensive stock scenario coverage.

| Option | Description | Selected |
|--------|-------------|----------|
| Generic but realistic | Fictional "AeroWear" | |
| Abstract/generic | "Product A", "Product B" | ✓ |
| You decide | Agent picks | |

**User's choice:** Abstract/generic
**Notes:** Easier to maintain, no trademark concerns.

---

## Variant Matching Precision

| Option | Description | Selected |
|--------|-------------|----------|
| Product name + option values | "Classic Hoodie in medium blue" | |
| Natural language | "Got any medium blue hoodies?" | |
| Both | Structured first, natural language fallback | ✓ |

**User's choice:** Both
**Notes:** Try structured first, fall back to NL parsing.

| Option | Description | Selected |
|--------|-------------|----------|
| Exact match only | "Blue" matches only "Blue" | |
| Synonym mapping | Color alias table: navy→Blue, charcoal→Gray | ✓ |
| Fuzzy/semantic matching | String similarity or embedding | |

**User's choice:** Synonym mapping
**Notes:** User-friendly without risk of wrong matches from fuzzy matching.

| Option | Description | Selected |
|--------|-------------|----------|
| Exact match only | "Medium" matches "Medium" only | |
| Normalized mapping | S→Small, M→Medium, XL→Extra Large | ✓ |
| You decide | Agent picks | |

**User's choice:** Normalized mapping
**Notes:** Catches user shorthand for sizes.

| Option | Description | Selected |
|--------|-------------|----------|
| Ask user to clarify | "Which color?" — interactive | ✓ |
| Pick the first match | Returns first matching variant | |
| Show all matches | Lists all matching variants | |

**User's choice:** Ask user to clarify
**Notes:** Natural conversational disambiguation.

---

## Out-of-Stock Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| State unavailability + offer alternatives | "Want me to show you similar hoodies?" | |
| Just state unavailability | Direct, no upsell | |
| State + show alternatives automatically | Proactive list | ✓ |

**User's choice:** State + show alternatives automatically
**Notes:** Proactive helpfulness — saves a conversation turn.

| Option | Description | Selected |
|--------|-------------|----------|
| Same category (exact) | Only same product type | |
| Same category, in-stock only | Filter out also-OOS | |
| Same category + similar price range | ±20% price | ✓ |

**User's choice:** Same category + similar price range
**Notes:** Most targeted alternative suggestions.

| Option | Description | Selected |
|--------|-------------|----------|
| Flag as low stock | "Only 2 left!" urgency | ✓ |
| Treat as normal | Unless pressed for info | |
| You decide | Agent picks | |

**User's choice:** Flag as low stock
**Notes:** Urgency messaging for low stock.

| Option | Description | Selected |
|--------|-------------|----------|
| Treat as unavailable with note | "Can be backordered" | |
| Offer backorder option | "Want to place a backorder?" + ETA | ✓ |
| Treat same as OOS | Don't differentiate | |

**User's choice:** Offer backorder option
**Notes:** Keeps conversion open for backordered items.

| Option | Description | Selected |
|--------|-------------|----------|
| Up to 3 | Keep it brief | |
| Up to 5 | More choices | ✓ |
| You decide | Agent picks | |

**User's choice:** Up to 5
**Notes:** Extra follow-up round asked by agent.

| Option | Description | Selected |
|--------|-------------|----------|
| ≤3 units | Typical retail | |
| ≤5 units | More conservative | ✓ |
| You decide | Agent picks | |

**User's choice:** ≤5 units
**Notes:** Lower threshold catches more items as low stock.

---

## Intent Detection Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Keyword/regex (same as Phase 2) | Match catalog keywords | |
| Structured pattern matching | Parse sentence precisely | |
| Hybrid | Keyword pre-filter + structured parsing | ✓ |

**User's choice:** Hybrid
**Notes:** Best of both — speed from keywords, precision from parsing.

| Option | Description | Selected |
|--------|-------------|----------|
| Stock + sizing + general search | 3 categories | |
| Stock + sizing + product search + variant lookup | 4 categories | ✓ |
| Stock + sizing + search + compare | Also detect comparisons | |

**User's choice:** Stock + sizing + product search + variant lookup
**Notes:** More granular routing than 3-category approach.

| Option | Description | Selected |
|--------|-------------|----------|
| Before policy check | Faster catalog response | |
| After policy check, before mock fallback | Aligns with plan | |
| Plug into ResponseGrounder | Cleanest architecture | ✓ |

**User's choice:** Plug into ResponseGrounder
**Notes:** Extend Phase 2's ResponseGrounder to route catalog intents — single routing point.

| Option | Description | Selected |
|--------|-------------|----------|
| Extend with catalog-specific section | CATALOG_KEYWORDS alongside ON_TOPIC_KEYWORDS | ✓ |
| Merge into broader ON_TOPIC_KEYWORDS | Expand existing list | |
| You decide | Agent picks | |

**User's choice:** Extend with catalog-specific section
**Notes:** Keeps concerns separate while coexisting.

---

## Search Depth & Response Format

| Option | Description | Selected |
|--------|-------------|----------|
| Title only | Simplest | |
| Title + product type | Better categorization | |
| Title + type + description | Full text | ✓ |

**User's choice:** Title + type + description
**Notes:** Most comprehensive search coverage.

| Option | Description | Selected |
|--------|-------------|----------|
| Plain text formatted response | Matches chat text style | |
| Rich product card | Formatted card with all details | ✓ |
| Hybrid | Brief text + expandable card | |

**User's choice:** Rich product card
**Notes:** More visual, needs a new ProductCard component.

| Option | Description | Selected |
|--------|-------------|----------|
| Name + price + variants + stock | Lean and fast | |
| + image placeholder | More like real Shopify | |
| Full details + compare + add-to-cart hint | Most detailed | ✓ |

**User's choice:** Full details + compare + add-to-cart hint
**Notes:** Most comprehensive card layout.

| Option | Description | Selected |
|--------|-------------|----------|
| Colored badge only | Green/red/yellow | |
| Text label only | "In Stock", etc. | |
| Both | Badge + text | ✓ |

**User's choice:** Both
**Notes:** Redundant but most accessible and scannable.

| Option | Description | Selected |
|--------|-------------|----------|
| Up to 3 | Brief | |
| Up to 5 | Moderate | |
| Up to 10 | Comprehensive | ✓ |

**User's choice:** Up to 10
**Notes:** Best for "show me all" queries.

---

## Deferred Ideas

- Comparison queries ("how does X compare to Y") — future enhancement
- Add-to-cart action from chat — future checkout/handoff phase
- Real Shopify API integration — future phase
