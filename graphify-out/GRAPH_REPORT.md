# Graph Report - .  (2026-05-17)

## Corpus Check
- 101 files · ~59,272 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 375 nodes · 521 edges · 51 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Chat Widget & UI|Chat Widget & UI]]
- [[_COMMUNITY_Core Architecture & Services|Core Architecture & Services]]
- [[_COMMUNITY_Catalog Intent Detection|Catalog Intent Detection]]
- [[_COMMUNITY_Test Suite|Test Suite]]
- [[_COMMUNITY_Order Tracking|Order Tracking]]
- [[_COMMUNITY_Policy & Response Grounding|Policy & Response Grounding]]
- [[_COMMUNITY_Catalog Search & Synonyms|Catalog Search & Synonyms]]
- [[_COMMUNITY_Order Display|Order Display]]
- [[_COMMUNITY_Coverage Sorter|Coverage Sorter]]
- [[_COMMUNITY_Off-Topic Detection|Off-Topic Detection]]
- [[_COMMUNITY_Coverage Prettify|Coverage Prettify]]
- [[_COMMUNITY_Escalation State Machine|Escalation State Machine]]
- [[_COMMUNITY_Escalation Queue|Escalation Queue]]
- [[_COMMUNITY_Escalation Detection|Escalation Detection]]
- [[_COMMUNITY_Project Concepts & Track|Project Concepts & Track]]
- [[_COMMUNITY_Cache Management|Cache Management]]
- [[_COMMUNITY_Conversation Context|Conversation Context]]
- [[_COMMUNITY_Mock Order Data|Mock Order Data]]
- [[_COMMUNITY_Context7 Integration|Context7 Integration]]
- [[_COMMUNITY_Coverage Navigation|Coverage Navigation]]
- [[_COMMUNITY_Network Detection|Network Detection]]
- [[_COMMUNITY_Human Agent Simulation|Human Agent Simulation]]
- [[_COMMUNITY_Superpowers Integration|Superpowers Integration]]
- [[_COMMUNITY_Antigravity Integration|Antigravity Integration]]
- [[_COMMUNITY_Globals Types|Globals Types]]
- [[_COMMUNITY_Design System|Design System]]
- [[_COMMUNITY_Coverage Reports|Coverage Reports]]
- [[_COMMUNITY_Vitest Config|Vitest Config]]
- [[_COMMUNITY_E2E Dev Server|E2E Dev Server]]
- [[_COMMUNITY_Playwright Config|Playwright Config]]
- [[_COMMUNITY_Playwright DOM Config|Playwright DOM Config]]
- [[_COMMUNITY_E2E Catalog Query|E2E Catalog Query]]
- [[_COMMUNITY_E2E DOM Snapshot|E2E DOM Snapshot]]
- [[_COMMUNITY_E2E Off-Topic|E2E Off-Topic]]
- [[_COMMUNITY_E2E Stock Check|E2E Stock Check]]
- [[_COMMUNITY_Shopify Widget Vite|Shopify Widget Vite]]
- [[_COMMUNITY_Colors JS Synonyms|Colors JS Synonyms]]
- [[_COMMUNITY_Index JS Synonyms|Index JS Synonyms]]
- [[_COMMUNITY_Materials JS Synonyms|Materials JS Synonyms]]
- [[_COMMUNITY_Sizes JS Synonyms|Sizes JS Synonyms]]
- [[_COMMUNITY_Integrations JS Index|Integrations JS Index]]
- [[_COMMUNITY_Types JS|Types JS]]
- [[_COMMUNITY_Colors TS Synonyms|Colors TS Synonyms]]
- [[_COMMUNITY_Index TS Synonyms|Index TS Synonyms]]
- [[_COMMUNITY_Materials TS Synonyms|Materials TS Synonyms]]
- [[_COMMUNITY_Sizes TS Synonyms|Sizes TS Synonyms]]
- [[_COMMUNITY_Integrations TS Index|Integrations TS Index]]
- [[_COMMUNITY_Types TS|Types TS]]
- [[_COMMUNITY_Escalation Transfer Handler|Escalation Transfer Handler]]
- [[_COMMUNITY_Human Agent Simulator|Human Agent Simulator]]
- [[_COMMUNITY_Phase 6 Return|Phase 6 Return]]

## God Nodes (most connected - your core abstractions)
1. `ChatWidget` - 37 edges
2. `CatalogIntentDetector` - 20 edges
3. `Vitest Testing Framework` - 18 edges
4. `OrderIntentDetector` - 11 edges
5. `EscalationStateMachine` - 11 edges
6. `CatalogService` - 9 edges
7. `ResponseGrounder` - 8 edges
8. `EscalationQueueSimulator` - 8 edges
9. `CatalogIntentDetector` - 8 edges
10. `EscalationDetector` - 7 edges

## Surprising Connections (you probably didn't know these)
- `SynonymResolver` --references--> `Color Synonym Config Table`  [INFERRED]
  PRODUCT_DOC.md → src/config/synonyms/CHANGELOG.md
- `SynonymResolver` --references--> `Size Synonym Config Table`  [INFERRED]
  PRODUCT_DOC.md → src/config/synonyms/CHANGELOG.md
- `SynonymResolver` --references--> `Material Synonym Config Table`  [INFERRED]
  PRODUCT_DOC.md → src/config/synonyms/CHANGELOG.md
- `AI Customer Support Agent for Commerce` --conceptually_related_to--> `Kasparro Agentic Commerce Hackathon`  [EXTRACTED]
  README.md → hackathon.md
- `AI Customer Support Agent for Commerce` --conceptually_related_to--> `Track 4: AI Customer Support Agent`  [EXTRACTED]
  README.md → hackathon.md

## Hyperedges (group relationships)
- **Full Pipeline Flow** — offtopicdetector, escalationdetector, orderintentdetector, catalogintentdetector, policyservice, refusalresponseservice, chatwidget [EXTRACTED 1.00]
- **Zero LLM Catalog Pipeline** — catalogintentdetector, catalogservice, synonymresolver, catalogdatasource, mockcatalogdatasource, resolvedquery [EXTRACTED 1.00]
- **Escalation Workflow Subsystem** — escalationdetector, escalationstatemachine, escalationtransferhandler, humanagentsimulator, escalation_keyword_decision, escalation_statemachine_decision [EXTRACTED 1.00]

## Communities

### Community 0 - "Chat Widget & UI"
Cohesion: 0.1
Nodes (2): ChatWidget, EscalationTransferHandler

### Community 1 - "Core Architecture & Services"
Cohesion: 0.06
Nodes (42): Browser-Side Services vs Server-Side API Decision, 2-Min Catalog Cache NEVER Cache Inventory Decision, CatalogDataSource Interface, CatalogIntentDetector, CatalogService, ChatWidget, ConversationContextManager, Cross-Turn Context 5min 3turn Decision (+34 more)

### Community 2 - "Catalog Intent Detection"
Cohesion: 0.12
Nodes (11): buildAmbiguousMessage(), CatalogIntentDetector, escapeRegex(), formatCatalogResponse(), formatStockBadge(), summarizeStock(), buildMockProducts(), buildProduct() (+3 more)

### Community 3 - "Test Suite"
Cohesion: 0.06
Nodes (3): Playwright E2E Framework, Playwright E2E over Vitest-Only Decision, Vitest Testing Framework

### Community 4 - "Order Tracking"
Cohesion: 0.14
Nodes (2): OrderIntentDetector, OrderService

### Community 5 - "Policy & Response Grounding"
Cohesion: 0.16
Nodes (2): PolicyService, ResponseGrounder

### Community 6 - "Catalog Search & Synonyms"
Cohesion: 0.19
Nodes (5): CatalogService, getSynonymTableForOption(), normalizeOptionValue(), resolveSynonyms(), tryResolveToken()

### Community 7 - "Order Display"
Cohesion: 0.27
Nodes (9): getStatusColor(), getStatusEmoji(), getTimelineStatusClass(), isActiveStatus(), OrderCard, renderItemsSummary(), renderTimeline(), buildOrderResponse() (+1 more)

### Community 8 - "Coverage Sorter"
Cohesion: 0.27
Nodes (11): addSortIndicators(), enableUI(), getNthColumn(), getTable(), getTableBody(), getTableHeader(), loadColumns(), loadData() (+3 more)

### Community 9 - "Off-Topic Detection"
Cohesion: 0.18
Nodes (2): OffTopicDetector, RefusalResponseService

### Community 10 - "Coverage Prettify"
Cohesion: 0.35
Nodes (8): a(), B(), D(), g(), i(), k(), Q(), y()

### Community 11 - "Escalation State Machine"
Cohesion: 0.25
Nodes (2): createDefaultState(), EscalationStateMachine

### Community 12 - "Escalation Queue"
Cohesion: 0.31
Nodes (1): EscalationQueueSimulator

### Community 13 - "Escalation Detection"
Cohesion: 0.25
Nodes (1): EscalationDetector

### Community 14 - "Project Concepts & Track"
Cohesion: 0.25
Nodes (8): AI Customer Support Agent for Commerce, Graphify Knowledge Graph Output, GSD Protocol, Kasparro Agentic Commerce Hackathon, OpenCode Plugin System, Store-Native Approach, Track 4: AI Customer Support Agent, Zero Hallucination Principle

### Community 15 - "Cache Management"
Cohesion: 0.33
Nodes (1): CacheManager

### Community 16 - "Conversation Context"
Cohesion: 0.29
Nodes (1): ConversationContextManager

### Community 17 - "Mock Order Data"
Cohesion: 0.48
Nodes (2): buildMockOrders(), MockOrderDataSource

### Community 18 - "Context7 Integration"
Cohesion: 0.73
Nodes (4): enrichWithContext7(), getContext7RuntimeConfig(), getEnv(), safeFetch()

### Community 19 - "Coverage Navigation"
Cohesion: 0.7
Nodes (4): goToNext(), goToPrevious(), makeCurrent(), toggleClass()

### Community 20 - "Network Detection"
Cohesion: 0.4
Nodes (1): NetworkDetector

### Community 21 - "Human Agent Simulation"
Cohesion: 0.4
Nodes (1): HumanAgentSimulator

### Community 22 - "Superpowers Integration"
Cohesion: 0.83
Nodes (2): getSuperpowersRuntimeConfig(), isSuperpowersAvailable()

### Community 23 - "Antigravity Integration"
Cohesion: 0.67
Nodes (2): getActiveRuntimeSkills(), getRuntimeSkills()

### Community 24 - "Globals Types"
Cohesion: 1.0
Nodes (1): Response

### Community 25 - "Design System"
Cohesion: 1.0
Nodes (2): Berkeley Mono Typography, OpenCode Design System

### Community 26 - "Coverage Reports"
Cohesion: 1.0
Nodes (2): Code Coverage Report, Sort Arrow Sprite

### Community 27 - "Vitest Config"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "E2E Dev Server"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Playwright Config"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Playwright DOM Config"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "E2E Catalog Query"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "E2E DOM Snapshot"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "E2E Off-Topic"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "E2E Stock Check"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Shopify Widget Vite"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Colors JS Synonyms"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Index JS Synonyms"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Materials JS Synonyms"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Sizes JS Synonyms"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Integrations JS Index"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Types JS"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Colors TS Synonyms"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Index TS Synonyms"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Materials TS Synonyms"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Sizes TS Synonyms"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Integrations TS Index"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Types TS"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Escalation Transfer Handler"
Cohesion: 1.0
Nodes (1): EscalationTransferHandler

### Community 49 - "Human Agent Simulator"
Cohesion: 1.0
Nodes (1): HumanAgentSimulator

### Community 50 - "Phase 6 Return"
Cohesion: 1.0
Nodes (1): Phase 6: Return Initiation Workflow

## Ambiguous Edges - Review These
- `Sort Arrow Sprite` → `Code Coverage Report`  [AMBIGUOUS]
  coverage/sort-arrow-sprite.png · relation: references

## Knowledge Gaps
- **34 isolated node(s):** `Response`, `Kasparro Agentic Commerce Hackathon`, `Track 4: AI Customer Support Agent`, `Zero Hallucination Principle`, `Store-Native Approach` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Globals Types`** (2 nodes): `globals.d.ts`, `Response`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Design System`** (2 nodes): `Berkeley Mono Typography`, `OpenCode Design System`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Coverage Reports`** (2 nodes): `Code Coverage Report`, `Sort Arrow Sprite`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vitest Config`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `E2E Dev Server`** (1 nodes): `dev-server.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Playwright Config`** (1 nodes): `playwright.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Playwright DOM Config`** (1 nodes): `playwright.dom.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `E2E Catalog Query`** (1 nodes): `catalogQuery.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `E2E DOM Snapshot`** (1 nodes): `domSnapshot.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `E2E Off-Topic`** (1 nodes): `offTopic.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `E2E Stock Check`** (1 nodes): `stockCheck.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Shopify Widget Vite`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Colors JS Synonyms`** (1 nodes): `colors.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Index JS Synonyms`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Materials JS Synonyms`** (1 nodes): `materials.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sizes JS Synonyms`** (1 nodes): `sizes.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Integrations JS Index`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Types JS`** (1 nodes): `types.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Colors TS Synonyms`** (1 nodes): `colors.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Index TS Synonyms`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Materials TS Synonyms`** (1 nodes): `materials.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sizes TS Synonyms`** (1 nodes): `sizes.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Integrations TS Index`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Types TS`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Escalation Transfer Handler`** (1 nodes): `EscalationTransferHandler`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Human Agent Simulator`** (1 nodes): `HumanAgentSimulator`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Phase 6 Return`** (1 nodes): `Phase 6: Return Initiation Workflow`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Sort Arrow Sprite` and `Code Coverage Report`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `formatCatalogResponse()` connect `Catalog Intent Detection` to `Chat Widget & UI`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `ChatWidget` connect `Chat Widget & UI` to `Policy & Response Grounding`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `Response`, `Kasparro Agentic Commerce Hackathon`, `Track 4: AI Customer Support Agent` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Chat Widget & UI` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Core Architecture & Services` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Catalog Intent Detection` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._