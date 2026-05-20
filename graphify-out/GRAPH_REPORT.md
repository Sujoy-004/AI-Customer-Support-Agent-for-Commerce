# Graph Report - AI Customer Support Agent for Commerce (2026-05-19)

## Corpus Check
- 124 files · ~97,179 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 558 nodes · 819 edges · 58 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]] through [[_COMMUNITY_Community 24|Community 24]] (communities 25-57 are thin clusters with ≤2 nodes each)

## God Nodes (most connected - your core abstractions)
1. `ChatWidget` - 59 edges
2. `Vitest Testing Framework` - 33 edges
3. `CatalogIntentDetector` - 21 edges
4. `fetch()` - 18 edges
5. `EscalationStateMachine` - 12 edges
6. `OrderIntentDetector` - 12 edges
7. `CatalogSyncManager` - 11 edges
8. `HandoffChannel` - 11 edges
9. `SemanticRouter` - 10 edges
10. `PolicyService` - 10 edges

## Surprising Connections (you probably didn't know these)
- `fetch()` --calls--> `makeRequest()` [INFERRED]
- `fetch()` --calls--> `safeFetch()` [INFERRED]
- `SynonymResolver` --references--> `Color Synonym Config Table` [INFERRED]
- `SynonymResolver` --references--> `Size Synonym Config Table` [INFERRED]
- `SynonymResolver` --references--> `Material Synonym Config Table` [INFERRED]

## Hyperedges (group relationships)
- **Full Pipeline Flow** — offtopicdetector, escalationdetector, orderintentdetector, catalogintentdetector, policyservice, refusalresponseservice, chatwidget [EXTRACTED 1.00]
- **Zero LLM Catalog Pipeline** — catalogintentdetector, catalogservice, synonymresolver, catalogdatasource, mockcatalogdatasource, resolvedquery [EXTRACTED 1.00]
- **Escalation Workflow Subsystem** — escalationdetector, escalationstatemachine, escalationtransferhandler, humanagentsimulator, escalation_keyword_decision, escalation_statemachine_decision [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0" (Cohesion: 0.05)
Nodes (4): ChatWidget, EscalationTransferHandler, HandoffChannel, SuggestedActionsService

### Community 1 - "Community 1" (Cohesion: 0.03)
Nodes (7): fixtureFor(), makeFixture(), createWidget(), createDetector(), Playwright E2E Framework, Playwright E2E over Vitest-Only Decision, Vitest Testing Framework

### Community 2 - "Community 2" (Cohesion: 0.09)
Nodes (11): buildAmbiguousMessage(), CatalogIntentDetector, escapeRegex(), formatCatalogResponse(), formatStockBadge(), summarizeStock(), buildMockProducts(), buildProduct() (+3 more)

### Community 3 - "Community 3" (Cohesion: 0.06)
Nodes (42): Browser-Side Services vs Server-Side API Decision, 2-Min Catalog Cache NEVER Cache Inventory Decision, CatalogDataSource Interface, CatalogIntentDetector, CatalogService, ChatWidget, ConversationContextManager, Cross-Turn Context 5min 3turn Decision (+34 more)

### Community 4 - "Community 4" (Cohesion: 0.06)
Nodes (5): EscalationDetector, OrderIntentDetector, OrderService, MockReturnDataSource, ReturnService

### Community 5 - "Community 5" (Cohesion: 0.08)
Nodes (4): AgentPresenceTracker, CacheManager, createDefaultState(), EscalationStateMachine

### Community 6 - "Community 6" (Cohesion: 0.11)
Nodes (16): ShopifyOrderProxyDataSource, checkRateLimit(), fetch(), getCorsHeaders(), getSecurityHeaders(), hexToBytes(), jsonResponse(), logRequest() (+8 more)

### Community 7 - "Community 7" (Cohesion: 0.08)
Nodes (4): ConversationContextManager, OffTopicDetector, RefusalResponseService, SemanticRouter

### Community 8 - "Community 8" (Cohesion: 0.13)
Nodes (5): mapFrontmatterToPolicyData(), parseFrontmatter(), parseYamlValue(), PolicyService, ResponseGrounder

### Community 9 - "Community 9" (Cohesion: 0.19)
Nodes (5): CatalogService, getSynonymTableForOption(), normalizeOptionValue(), resolveSynonyms(), tryResolveToken()

### Community 10 - "Community 10" (Cohesion: 0.27)
Nodes (9): getStatusColor(), getStatusEmoji(), getTimelineStatusClass(), isActiveStatus(), OrderCard, renderItemsSummary(), renderTimeline(), buildOrderResponse() (+1 more)

### Community 11 - "Community 11" (Cohesion: 0.27)
Nodes (11): addSortIndicators(), enableUI(), getNthColumn(), getTable(), getTableBody(), getTableHeader(), loadColumns(), loadData() (+3 more)

### Community 12 - "Community 12" (Cohesion: 0.2)
Nodes (1): CatalogSyncManager

### Community 13 - "Community 13" (Cohesion: 0.35)
Nodes (8): a(), B(), D(), g(), i(), k(), Q(), y()

### Community 14 - "Community 14" (Cohesion: 0.25)
Nodes (1): PolicySyncManager

### Community 15 - "Community 15" (Cohesion: 0.31)
Nodes (1): EscalationQueueSimulator

### Community 16 - "Community 16" (Cohesion: 0.25)
Nodes (8): AI Customer Support Agent for Commerce, Graphify Knowledge Graph Output, GSD Protocol, Kasparro Agentic Commerce Hackathon, OpenCode Plugin System, Store-Native Approach, Track 4: AI Customer Support Agent, Zero Hallucination Principle

### Community 17 - "Community 17" (Cohesion: 0.57)
Nodes (4): enrichWithContext7(), getContext7RuntimeConfig(), getEnv(), safeFetch()

### Community 18 - "Community 18" (Cohesion: 0.48)
Nodes (2): buildMockOrders(), MockOrderDataSource

### Community 19 - "Community 19" (Cohesion: 0.33)
Nodes (1): NetworkDetector

### Community 20 - "Community 20" (Cohesion: 0.7)
Nodes (4): goToNext(), goToPrevious(), makeCurrent(), toggleClass()

### Community 21 - "Community 21" (Cohesion: 0.4)
Nodes (1): HumanAgentSimulator

### Community 22 - "Community 22" (Cohesion: 0.67)
Nodes (2): getActiveRuntimeSkills(), getRuntimeSkills()

### Community 23 - "Community 23" (Cohesion: 0.83)
Nodes (2): getSuperpowersRuntimeConfig(), isSuperpowersAvailable()

### Community 24 - "Community 24" (Cohesion: 0.67)
Nodes (1): AutocompleteService

*Communities 25-57 omitted — all are thin clusters with cohesion 1.0 and 0-2 nodes each. See Knowledge Gaps section for details.*

## Ambiguous Edges - Review These
- `Sort Arrow Sprite` → `Code Coverage Report` [AMBIGUOUS] — coverage/sort-arrow-sprite.png · relation: references

## Knowledge Gaps
- **34 isolated nodes:** Nodes with ≤1 connection, e.g. `Response`, `Kasparro Agentic Commerce Hackathon`, `Track 4: AI Customer Support Agent`, `Zero Hallucination Principle`, `Store-Native Approach` (+29 more). Possible missing edges or undocumented components.
- **33 thin communities** (Community 25-57): Each has 0-2 nodes. Most are single-file config/spec/test entries. Likely noise or needs more connections extracted.

## Suggested Questions
- **What is the exact relationship between `Sort Arrow Sprite` and `Code Coverage Report`?** Edge tagged AMBIGUOUS (relation: references) — confidence is low.
- **Why does `ChatWidget` connect Community 0 to Community 1, 4, 14, 7?** High betweenness centrality (0.197) — cross-community bridge.
- **Why does `Vitest Testing Framework` connect Community 1 to Community 6?** High betweenness centrality (0.145).
- **Why does `fetch()` connect Community 6 to Community 8, 17, 2?** High betweenness centrality (0.132).
- **Are the 7 inferred relationships involving `fetch()` actually correct?** `fetch()` has 7 INFERRED edges — model-reasoned connections needing verification.
- **What connects `Response`, `Kasparro Agentic Commerce Hackathon`, `Track 4` to the rest?** 34 weakly-connected nodes found — possible documentation gaps.
- **Should Community 0 be split into smaller, more focused modules?** Cohesion 0.05 — nodes weakly interconnected.
