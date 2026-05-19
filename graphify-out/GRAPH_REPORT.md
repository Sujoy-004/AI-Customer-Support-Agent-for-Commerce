# Graph Report - C:\Users\KIIT0001\Documents\antigravity skills\AI Customer Support Agent for Commerce  (2026-05-19)

## Corpus Check
- 124 files · ~97,179 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 558 nodes · 819 edges · 58 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]

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
- `fetch()` --calls--> `makeRequest()`  [INFERRED]
  C:\Users\KIIT0001\Documents\antigravity skills\AI Customer Support Agent for Commerce\shopify-proxy\src\worker.ts → C:\Users\KIIT0001\Documents\antigravity skills\AI Customer Support Agent for Commerce\shopify-proxy\test\worker.test.ts
- `fetch()` --calls--> `safeFetch()`  [INFERRED]
  C:\Users\KIIT0001\Documents\antigravity skills\AI Customer Support Agent for Commerce\shopify-proxy\src\worker.ts → C:\Users\KIIT0001\Documents\antigravity skills\AI Customer Support Agent for Commerce\src\integrations\context7.ts
- `SynonymResolver` --references--> `Color Synonym Config Table`  [INFERRED]
  PRODUCT_DOC.md → src/config/synonyms/CHANGELOG.md
- `SynonymResolver` --references--> `Size Synonym Config Table`  [INFERRED]
  PRODUCT_DOC.md → src/config/synonyms/CHANGELOG.md
- `SynonymResolver` --references--> `Material Synonym Config Table`  [INFERRED]
  PRODUCT_DOC.md → src/config/synonyms/CHANGELOG.md

## Hyperedges (group relationships)
- **Full Pipeline Flow** — offtopicdetector, escalationdetector, orderintentdetector, catalogintentdetector, policyservice, refusalresponseservice, chatwidget [EXTRACTED 1.00]
- **Zero LLM Catalog Pipeline** — catalogintentdetector, catalogservice, synonymresolver, catalogdatasource, mockcatalogdatasource, resolvedquery [EXTRACTED 1.00]
- **Escalation Workflow Subsystem** — escalationdetector, escalationstatemachine, escalationtransferhandler, humanagentsimulator, escalation_keyword_decision, escalation_statemachine_decision [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (4): ChatWidget, EscalationTransferHandler, HandoffChannel, SuggestedActionsService

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (7): fixtureFor(), makeFixture(), createWidget(), createDetector(), Playwright E2E Framework, Playwright E2E over Vitest-Only Decision, Vitest Testing Framework

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (11): buildAmbiguousMessage(), CatalogIntentDetector, escapeRegex(), formatCatalogResponse(), formatStockBadge(), summarizeStock(), buildMockProducts(), buildProduct() (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (42): Browser-Side Services vs Server-Side API Decision, 2-Min Catalog Cache NEVER Cache Inventory Decision, CatalogDataSource Interface, CatalogIntentDetector, CatalogService, ChatWidget, ConversationContextManager, Cross-Turn Context 5min 3turn Decision (+34 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (5): EscalationDetector, OrderIntentDetector, OrderService, MockReturnDataSource, ReturnService

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (4): AgentPresenceTracker, CacheManager, createDefaultState(), EscalationStateMachine

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (16): ShopifyOrderProxyDataSource, checkRateLimit(), fetch(), getCorsHeaders(), getSecurityHeaders(), hexToBytes(), jsonResponse(), logRequest() (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (4): ConversationContextManager, OffTopicDetector, RefusalResponseService, SemanticRouter

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (5): mapFrontmatterToPolicyData(), parseFrontmatter(), parseYamlValue(), PolicyService, ResponseGrounder

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (5): CatalogService, getSynonymTableForOption(), normalizeOptionValue(), resolveSynonyms(), tryResolveToken()

### Community 10 - "Community 10"
Cohesion: 0.27
Nodes (9): getStatusColor(), getStatusEmoji(), getTimelineStatusClass(), isActiveStatus(), OrderCard, renderItemsSummary(), renderTimeline(), buildOrderResponse() (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.27
Nodes (11): addSortIndicators(), enableUI(), getNthColumn(), getTable(), getTableBody(), getTableHeader(), loadColumns(), loadData() (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.2
Nodes (1): CatalogSyncManager

### Community 13 - "Community 13"
Cohesion: 0.35
Nodes (8): a(), B(), D(), g(), i(), k(), Q(), y()

### Community 14 - "Community 14"
Cohesion: 0.25
Nodes (1): PolicySyncManager

### Community 15 - "Community 15"
Cohesion: 0.31
Nodes (1): EscalationQueueSimulator

### Community 16 - "Community 16"
Cohesion: 0.25
Nodes (8): AI Customer Support Agent for Commerce, Graphify Knowledge Graph Output, GSD Protocol, Kasparro Agentic Commerce Hackathon, OpenCode Plugin System, Store-Native Approach, Track 4: AI Customer Support Agent, Zero Hallucination Principle

### Community 17 - "Community 17"
Cohesion: 0.57
Nodes (4): enrichWithContext7(), getContext7RuntimeConfig(), getEnv(), safeFetch()

### Community 18 - "Community 18"
Cohesion: 0.48
Nodes (2): buildMockOrders(), MockOrderDataSource

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (1): NetworkDetector

### Community 20 - "Community 20"
Cohesion: 0.7
Nodes (4): goToNext(), goToPrevious(), makeCurrent(), toggleClass()

### Community 21 - "Community 21"
Cohesion: 0.4
Nodes (1): HumanAgentSimulator

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (2): getActiveRuntimeSkills(), getRuntimeSkills()

### Community 23 - "Community 23"
Cohesion: 0.83
Nodes (2): getSuperpowersRuntimeConfig(), isSuperpowersAvailable()

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (1): AutocompleteService

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (1): Response

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (2): Berkeley Mono Typography, OpenCode Design System

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (2): Code Coverage Report, Sort Arrow Sprite

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): EscalationTransferHandler

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (1): HumanAgentSimulator

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (1): Phase 6: Return Initiation Workflow

## Ambiguous Edges - Review These
- `Sort Arrow Sprite` → `Code Coverage Report`  [AMBIGUOUS]
  coverage/sort-arrow-sprite.png · relation: references

## Knowledge Gaps
- **34 isolated node(s):** `Response`, `Kasparro Agentic Commerce Hackathon`, `Track 4: AI Customer Support Agent`, `Zero Hallucination Principle`, `Store-Native Approach` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 25`** (2 nodes): `generateEmbeddings.ts`, `generate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `globals.d.ts`, `Response`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `synonymConstants.ts`, `buildSynonymRecord()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `Berkeley Mono Typography`, `OpenCode Design System`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `Code Coverage Report`, `Sort Arrow Sprite`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `dev-server.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `playwright.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `playwright.dom.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `catalogQuery.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `domSnapshot.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `offTopic.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `stockCheck.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `catalogIntents.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `offTopicIntents.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `orderIntents.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `colors.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `materials.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `sizes.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `types.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `colors.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `materials.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `sizes.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `EscalationTransferHandler`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `HumanAgentSimulator`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `Phase 6: Return Initiation Workflow`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Sort Arrow Sprite` and `Code Coverage Report`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `ChatWidget` connect `Community 0` to `Community 1`, `Community 4`, `Community 14`, `Community 7`?**
  _High betweenness centrality (0.197) - this node is a cross-community bridge._
- **Why does `Vitest Testing Framework` connect `Community 1` to `Community 6`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Why does `fetch()` connect `Community 6` to `Community 8`, `Community 17`, `Community 2`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `fetch()` (e.g. with `.get()` and `makeRequest()`) actually correct?**
  _`fetch()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Response`, `Kasparro Agentic Commerce Hackathon`, `Track 4: AI Customer Support Agent` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._