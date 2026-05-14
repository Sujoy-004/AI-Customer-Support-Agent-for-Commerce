# Technology Stack

**Project:** AI Customer Support Agent for Commerce
**Researched:** May 14 2026

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Remix | 2.x | Full-stack Web Framework | Official standard for Shopify App development. Native integration with Shopify App Bridge. |
| @shopify/shopify-app-remix | 4.x | Shopify App Library | Provides authenticated context, webhooks, and Admin API access out-of-the-box. |
| React | 19.x | UI Library | Required by Remix and Shopify Polaris. Supports concurrent rendering and modern React features. |

### AI Integration
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ai (Vercel AI SDK) | 6.x | LLM Orchestration | Standard protocol for streaming responses, managing conversation state, and tool calling with strict typing. |
| @ai-sdk/openai / @ai-sdk/anthropic | latest | Model Providers | Deep integration with Vercel AI SDK. Allows easily swapping models if one underperforms on specific logic. |

### Database & ORM
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Prisma | 6.x | Database ORM | Strict typing, robust migrations. Essential for "no any" constraints. |
| PostgreSQL | 16+ | Primary Database | Stores shop configurations, session states, and historical chat logs (vectors if using pgvector). Better for production than standard SQLite. |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 3.x | Validation / Schemas | Defining strict Tool inputs for LLM, validating Shopify webhooks, guaranteeing exact types. |
| @shopify/polaris | 13.x | Admin UI Components | Mandatory for the Shopify Admin embedded app interface. Ensures native look and feel. |
| vitest | 3.x | Testing | Unit and integration testing. Much faster than Jest, pairs perfectly with Remix/Vite. |
| playwright | 1.x | E2E Testing | E2E validation for Shopify App Bridge iframe and customer widget workflows. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Remix | Next.js | Next.js lacks the first-class, officially supported and maintained `@shopify/shopify-app-remix` library. Shopify explicitly recommends Remix. |
| AI Orchestration | Vercel AI SDK | LangChain | LangChain adds too much abstraction and implicit magic. Vercel AI SDK offers better primitive control for strict "zero-hallucination" logic. |
| DB | PostgreSQL | SQLite | SQLite is standard for Shopify boilerplate, but an AI app requires robust concurrency for webhooks and eventually pgvector for embeddings. |

## Installation

```bash
# Core framework & Shopify
npm install @shopify/shopify-app-remix @shopify/polaris remix react react-dom

# AI and Validation
npm install ai @ai-sdk/openai zod

# Database
npm install prisma @prisma/client

# Dev dependencies
npm install -D vitest playwright typescript @types/react @types/node
```

## Sources

- [Shopify Dev Docs: Remix App Template] - HIGH confidence
- [Vercel AI SDK Docs] - HIGH confidence
- [PROJECT.md context constraint] - HIGH confidence
