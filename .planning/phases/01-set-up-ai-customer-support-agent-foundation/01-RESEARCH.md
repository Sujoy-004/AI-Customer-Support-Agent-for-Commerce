# Phase 1: UI Foundation & Error Handling - Research

**Researched:** 2026-05-15
**Domain:** Shopify App Embed UI, Vanilla TypeScript, Chat Widget, Resilience Patterns
**Confidence:** HIGH

## Summary

This phase establishes the user interface foundation for the Shopify Customer Support Agent using a resilient, vanilla TypeScript approach. Since it's destined for a Shopify App Embed, we avoid heavy frameworks (like React or Vue) to prevent bundle bloat and global CSS collisions. 

**Primary recommendation:** Implement the chat widget as a vanilla TypeScript class (`ChatWidget`) injected into the DOM, supported by a `MessageQueue` for offline resilience and a `NetworkDetector` to handle Shopify API or LLM downtime gracefully.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Architecture:** Use the Everything Claude Code (ECC) plugin system as the foundation for extending OpenCode functionality
- **Language:** TypeScript with strict mode enabled for type safety and IDE support
- **Package Manager:** npm for dependency management and script execution
- **Build Process:** TypeScript compiler (tsc) with standard build/clean/prepublishOnly scripts
- **Workflow:** Implement GSD protocol for phased development with explicit discussion→plan→execute→verify cycles
- **Phase Definition:** Use integer phase numbering for major milestones (Phase 1, Phase 2, etc.)
- **Planning Artifacts:** Maintain .planning/ directory with structured documents (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
- **Version Control:** Commit all planning artifacts to git to maintain historical record
- **Store-Native Integration:** All responses must be grounded in live Shopify store data (catalog, sizing, stock) - no hallucinations
- **Core Workflows:** Focus on four mandatory workflows: Product Intelligence, Policy Execution, Active Workflows, Graceful Handoff
- **Quality Constraints:** Balance technical execution, product thinking, and product experience equally
- **Modular Organization:** Separate concerns across directories (agents, commands, skills, tools, plugins, prompts, instructions)
- **Context Management:** Use Context7 for latent context management and stability
- **Skill Injection:** Leverage Antigravity Skills for expert skill injection library
- **Documentation:** Use Obsidian Skills for brain structure and inter-linked documentation

### the agent's Discretion
- None explicitly defined in CONTEXT.md.

### Deferred Ideas (OUT OF SCOPE)
- Advanced analytics and reporting dashboard for support metrics
- Multi-language support for international customers
- Integration with third-party CRM systems beyond Shopify
- AI-powered sentiment analysis for customer satisfaction prediction
- Automated follow-up sequences for post-interaction engagement
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SAFE-02 | Graceful handling of network loss | Implemented via `NetworkDetector` and `MessageQueue` to cache unsent messages |
| SAFE-03 | API failure fallback | UI notifications alerting the user when Shopify API or LLM responds with errors |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Chat UI Rendering | Browser / Client | — | Shopify App Embeds run entirely in the browser context. Vanilla JS manipulates the DOM. |
| Network Detection | Browser / Client | — | `navigator.onLine` and `window.addEventListener('offline')` must be handled locally. |
| Message Queuing | Browser / Client | — | Local memory/storage buffers messages if the API is down before reaching the backend. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.3.0 | Language | Provides strict typing for DOM manipulation and queue management. |
| HTML/CSS | Native | UI | Avoids heavy frameworks in Shopify storefronts. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla TS | Preact / React | React adds ~130KB bundle size. Vanilla TS keeps the App Embed lightweight and isolated. |

## Architecture Patterns

### Recommended Project Structure
```
shopify-widget/
├── src/
│   ├── ui/
│   │   ├── ChatWidget.ts    # Main DOM injection and event listeners
│   │   └── styles.css       # JetBrains Mono and CSS variables
│   ├── core/
│   │   ├── MessageQueue.ts  # Caches messages when offline
│   │   └── NetworkDetector.ts # Listens to online/offline events
```

### Pattern 1: Isolated CSS using Shadow DOM or Strict Scoping
**What:** Encapsulating widget styles to prevent them from bleeding into the merchant's theme.
**When to use:** Always, for Shopify App Embeds.

### Anti-Patterns to Avoid
- **Relying on Global State:** Do not attach widget state to `window`. Use class instances.
- **Assuming Always-Online:** Don't fire `fetch` blindly. Always check `NetworkDetector` or catch network errors.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fonts | Custom font loaders | Google Fonts (`JetBrains Mono`) | Ensures reliable caching and performance. |

## Common Pitfalls

### Pitfall 1: CSS Specificity Wars
**What goes wrong:** Merchant's theme CSS overrides the chat widget's CSS.
**Why it happens:** App Embed CSS shares the global scope.
**How to avoid:** Use a highly specific prefix (e.g., `.ksp-chat-widget`) or Shadow DOM.

### Pitfall 2: Silent Message Drops
**What goes wrong:** User types a message, hits enter, network fails, message disappears.
**Why it happens:** No queue or retry logic.
**How to avoid:** Save messages to `MessageQueue` before sending. Remove only on HTTP 200.

## Code Examples

### Network Detector Pattern
```typescript
class NetworkDetector {
  private isOnline: boolean = navigator.onLine;

  constructor(private onStatusChange: (status: boolean) => void) {
    window.addEventListener('online', () => this.updateStatus(true));
    window.addEventListener('offline', () => this.updateStatus(false));
  }

  private updateStatus(status: boolean) {
    this.isOnline = status;
    this.onStatusChange(status);
  }
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SAFE-02 | Queues message when offline | unit | `vitest run tests/MessageQueue.test.ts` | ❌ Wave 0 |
| SAFE-03 | Displays error on API fail | unit | `vitest run tests/ChatWidget.test.ts` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `tests/MessageQueue.test.ts` — covers SAFE-02
- [ ] `tests/NetworkDetector.test.ts` — covers SAFE-02
- [ ] `tests/ChatWidget.test.ts` — covers SAFE-03

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Sanitize chat input to prevent XSS before rendering in DOM |

## Sources

### Primary (HIGH confidence)
- Existing `STATE.md` references (vanilla HTML/CSS/JS, JetBrains Mono, MessageQueue, NetworkDetector).
- OpenCode Plugin constraints.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Dictated by context.
- Architecture: HIGH - Matches standard vanilla widget patterns.
- Pitfalls: HIGH - Common issues with Shopify frontend extensions.

**Research date:** 2026-05-15
**Valid until:** 2026-06-15
