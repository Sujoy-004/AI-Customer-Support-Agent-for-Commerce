# Phase 1: Set up AI Customer Support Agent foundation - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the foundational infrastructure and basic structure for the AI Customer Support Agent for Shopify commerce. This phase sets up the core project architecture, installs necessary dependencies, and creates the basic framework that will support all subsequent customer support workflows (order status, returns, exchanges, and graceful handoff). The phase does not implement any specific customer support functionality - it focuses solely on setting up the development environment and project structure.

</domain>

<decisions>
## Implementation Decisions

### Project Structure and Tooling
- **Architecture:** Use the Everything Claude Code (ECC) plugin system as the foundation for extending OpenCode functionality
- **Language:** TypeScript with strict mode enabled for type safety and IDE support
- **Package Manager:** npm for dependency management and script execution
- **Build Process:** TypeScript compiler (tsc) with standard build/clean/prepublishOnly scripts

### GSD (Get Shit Done) Methodology
- **Workflow:** Implement GSD protocol for phased development with explicit discussion→plan→execute→verify cycles
- **Phase Definition:** Use integer phase numbering for major milestones (Phase 1, Phase 2, etc.)
- **Planning Artifacts:** Maintain .planning/ directory with structured documents (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
- **Version Control:** Commit all planning artifacts to git to maintain historical record

### AI Customer Support Agent Scope (Track 4)
- **Store-Native Integration:** All responses must be grounded in live Shopify store data (catalog, sizing, stock) - no hallucinations
- **Core Workflows:** Focus on four mandatory workflows:
  1. Product Intelligence (answer queries based on live store data)
  2. Policy Execution (explain and apply store policies)
  3. Active Workflows (order status/tracking, return initiation)
  4. Graceful Handoff (escalate to human support when needed)
- **Quality Constraints:** Balance technical execution, product thinking, and product experience equally

### Development Practices
- **Modular Organization:** Separate concerns across directories (agents, commands, skills, tools, plugins, prompts, instructions)
- **Context Management:** Use Context7 for latent context management and stability
- **Skill Injection:** Leverage Antigravity Skills for expert skill injection library
- **Documentation:** Use Obsidian Skills for brain structure and inter-linked documentation
</decisions>

<specifics>
## Specific Ideas

- "The agent should feel like a knowledgeable store employee who can access real-time inventory and policy information"
- "Order status queries should provide specific, actionable information like tracking numbers and estimated delivery dates"
- "Return initiation should guide users through the actual Shopify return process, not just provide policy information"
- "When escalating to human support, the agent should pass along all relevant conversation context and customer information"
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements
- `.planning/requirements/PROJECT.md` — Project overview, goals, architectural tooling requirements, and Track 4 specifics
- `.planning/requirements/TRACK_4_SUPPORT.md` — Detailed requirements for AI Customer Support Agent including core directive, workflows, and quality constraints

### Architecture and Tooling
- `.opencode/tsconfig.json` — TypeScript compiler configuration
- `.opencode/package.json` — Project dependencies and scripts
- `.opencode/opencode.json` — Main OpenCode plugin configuration

### GSD Framework
- `.opencode/get-shit-done/` — Complete GSD implementation including workflows, templates, and reference materials
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **OpenCode Plugin System:** Provides standard interfaces for agents, commands, skills, and hooks that can be extended for customer support functionality
- **TypeScript Base:** Existing TypeScript configuration provides foundation for type-safe development
- **Modular Directory Structure:** Pre-organized directories (agents/, commands/, skills/, etc.) follow separation of concerns principles

### Established Patterns
- **OpenCode Plugin Architecture:** Follows established patterns for extending OpenCode functionality through well-defined interfaces
- **GSD Methodology:** Implements battle-tested protocol for software development with clear phase gates and deliverables
- **Modular Skill System:** Specialized knowledge encapsulated in skills that can be composed and reused

### Integration Points
- **Shopify API Integration:** Future phases will need to integrate with Shopify's Admin API and Storefront API for live data access
- **OpenCode Hook System:** Will leverage OpenCode's hook system to integrate with agent conversations and workflows
- **Context7 Latent Context:** Will use Context7 for managing conversation state and customer-specific context across interactions
</code_context>

<deferred>
## Deferred Ideas

- Advanced analytics and reporting dashboard for support metrics
- Multi-language support for international customers
- Integration with third-party CRM systems beyond Shopify
- AI-powered sentiment analysis for customer satisfaction prediction
- Automated follow-up sequences for post-interaction engagement
</deferred>

---
*Phase: 01-set-up-ai-customer-support-agent-foundation*
*Context gathered: 2026-05-14*