# AGENTS.md - Essential Guidance for AI Customer Support Agent Development

## Tone & Communication Style

Talk to me like that git warning. Short sentences. Plain words. No fancy talk. Say what's happening and why in the simplest way possible. Don't dumb down the thinking — just make the output easy to read. One or two sentences is usually enough. If I ask for detail, give it. Otherwise, keep it tight.

## Critical Must-Haves (Hackathon Audit — May 2026)

These are non-negotiable. Everything else can wait.

**4 mandatory workflows — 1 built, 3 to go:**
- Product Intelligence (Phase 3) — NOT built. Execute immediately.
- Policy Execution (Phase 2) — Built ✓
- Active Workflows: order tracking (Phase 4) + return initiation (Phase 6) — NOT started.
- Graceful Handoff (Phase 5) — NOT started.

**4 mandatory docs (25% of score):**
- `PRODUCT_DOC.md` — NOT created. Write during/after executing each phase.
- `TECHNICAL_DOC.md` — NOT created. Must show AI/deterministic boundary and failure handling.
- `DECISION_LOG.md` — NOT created. Log every "considered X, chose Y, because Z."
- `README.md` — NOT created. Setup and overview.

**3 mandatory tools — zero evidence of use:**
- Superpowers — not integrated anywhere. Must use.
- Context7 — not integrated anywhere. Must use.
- Antigravity Skills — installed but unused in plans. Must use.

**Testing gaps:**
- Playwright NOT set up — only Vitest exists. E2E tests are required.
- `e2e/` directory does not exist. Create it.
- Current test coverage (~376 lines across 5 files) is too thin. Target 80%+.

**Git warning:**
- `.planning/` and `.opencode/` are in `.gitignore`. Judges won't see your planning artifacts or plugin code if they're not committed. Fix before submission.

**Priority order for remaining work:**
1. Execute Phase 3 (catalog — already planned and decided)
2. Write docs alongside each phase execution (don't leave them for the end)
3. Set up Playwright + E2E tests
4. Integrate Superpowers, Context7, Antigravity Skills
5. Execute Phases 4-6
6. Fix .gitignore for submission
7. Record demo video

## Critical Setup
- **Primary workspace**: Work in repository root, not `.opencode/` subdirectory
- **Main entry point**: `.opencode/index.ts` (TypeScript)
- **Configuration**: `.opencode/opencode.json` defines agents, commands, skills
- **Dependencies**: Install with `npm install` (requires Node.js >=18.0.0)

## Essential Commands
Use these OpenCode commands for development work:
- `/plan` - Create implementation plans (requires planner agent)
- `/tdd` - Enforce TDD workflow with 80%+ coverage
- `/code-review` - Review code for quality/security
- `/build-fix` - Fix TypeScript/build errors with minimal changes
- `/test-coverage` - Analyze test coverage
- `/verify` - Run verification loop for completed work
- `/update-docs` - Update documentation after changes

## Development Workflow
1. **TDD First**: Write tests before implementing (`/tdd`)
2. **Build Check**: Fix TypeScript errors (`/build-fix`)
3. **Test**: Run tests and verify 80%+ coverage (`/test-coverage`)
4. **Review**: Check code quality (`/code-review`)
5. **Document**: Update docs (`/update-docs`)

## Key Directories
- `.opencode/commands/` - CLI command definitions (markdown)
- `.opencode/skills/` - Domain-specific skill packages
- `.opencode/prompts/agents/` - Specialized agent prompts (txt)
- `.opencode/tools/` - Shared TypeScript utilities
- `.opencode/plugins/` - Plugin interfaces
- `.planning/` - GSD artifacts (codebase maps, plans, specs)

## Track 4 Specifics (AI Customer Support Agent)
- **Zero hallucinations**: All responses must be Shopify-verifiable
- **Store-native only**: Use live catalog/sizing/stock data
- **Active workflows**: Order status/tracking, returns, exchanges, graceful handoff
- **Required artifacts**: PRODUCT_DOC.md, TECHNICAL_DOC.md, DECISION_LOG.md, README.md

## Testing Requirements
- **Coverage target**: 80%+ (unit + integration + E2E)
- **Test command**: `npm test` or `/test-coverage` OpenCode command
- **Test structure**: Unit tests alongside source, E2E in `e2e/` directory
- **Frameworks**: Vitest (unit/integration), Playwright (E2E)

## Code Conventions
- **Language**: TypeScript (strict mode)
- **Naming**: camelCase variables/functions, PascalCase types/interfaces
- **Immutability**: Use spread operator, never mutate directly
- **Error handling**: Try/catch with meaningful messages
- **Async**: Prefer Promise.all() for independent operations
- **Comments**: Explain WHY, not WHAT

## Architecture Notes
- **Plugin model**: Extends OpenCode via `@opencode-ai/plugin`
- **Modular skills**: Each skill in `/skills/` is self-contained
- **Layered design**: Commands → Skills/Tools → Agent Prompts → OpenCode API
- **Entry point**: `.opencode/index.ts` registers all components

## Verification
Before considering work complete:
1. Run `/verify` for conversational UAT
2. Check no secrets leaked (scan for API keys, tokens)
3. Confirm all required documents exist and are updated
4. Verify Shopify integration uses live data (no mocks)

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Kasparro Agentic Commerce Hackathon: AI Customer Support Agent**

A "Store-Native" Shopify AI customer support agent (Track 4) built using the Antigravity Skills stack, GSD protocol, and Superpowers. This is not a generic FAQ wrapper; it is deeply integrated into live store data (catalog, sizing, stock) and executes active workflows like real-time order status tracking and return initiation, with a seamless graceful handoff for complex edge cases.

**Core Value:** Zero-hallucination, high-fidelity customer resolution grounded strictly in live Shopify data, powered by Socratic specification and TDD execution via the Antigravity Senior Architect protocol.

### Constraints

- **Technical**: Must use GSD protocol, Superpowers, Context7, and Antigravity Skills.
- **Methodology**: Socratic Specification (SPEC.md first) and TDD-First execution (RED-GREEN-REFACTOR) are non-negotiable.
- **Architecture**: Strict Typing (no `any`), no production print statements, 100% Training-Inference parity.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages & Runtimes
- **TypeScript** - Primary language for ECC plugin and skills
- **JavaScript/Node.js** - Runtime environment
## Frameworks & Libraries
- **OpenCode Plugin System** - Core framework for extending OpenCode functionality
- **Everything Claude Code (ECC)** - The plugin being developed
## Build Tools & Configuration
- **TypeScript Compiler (tsc)** - Used for building the plugin
- **Node Package Manager (npm)** - Dependency management
## Configuration Files
- **opencode.json** - Main OpenCode plugin configuration
- **tsconfig.json** - TypeScript compiler configuration
- **package.json** - Project metadata and dependencies
- **.gitignore** - Git exclusion rules
- **.npmignore** - npm publication exclusion rules
## Key Directories
- `.opencode/` - Contains the ECC plugin source code
## External Dependencies
- **@opencode-ai/plugin** - Core OpenCode plugin API (v1.14.50)
- **TypeScript** - Language and compiler (^5.3.0)
- **@types/node** - Node.js type definitions (^20.0.0)
- **typescript** - TypeScript compiler (^5.3.0)
## Development Practices
- **Modular Architecture** - Separation of concerns across directories
- **Typed Codebase** - TypeScript for type safety and IDE support
- **npm Package** - Published as an installable OpenCode plugin
- **MIT License** - Permissive open-source licensing
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Overview
## Language Standards
- **Primary Language**: TypeScript (>=5.3.0)
- **Runtime**: Node.js (>=18.0.0)
- **Strict Mode**: Enforced via tsconfig.json
- **Module System**: ES Modules (import/export)
## File Organization
### Directory Structure Conventions
### File Naming Conventions
- **TypeScript Files**: camelCase (e.g., `git-summary.ts`, `format-code.ts`)
- **Markdown Files**: kebab-case (e.g., `plan.md`, `test-coverage.md`)
- **JSON Files**: kebab-case (e.g., `package.json`, `tsconfig.json`)
- **Skill Directories**: kebab-case (e.g., `agent-introspection-debugging`)
- **Agent Prompts**: kebab-case with .txt extension (e.g., `code-reviewer.txt`)
- **Components**: PascalCase with appropriate extension (e.g., `Button.tsx`)
## TypeScript/JavaScript Standards
### Variable & Function Naming
- **Variables**: descriptive camelCase (e.g., `marketSearchQuery`, `isUserAuthenticated`)
- **Functions**: verb-noun pattern (e.g., `fetchMarketData`, `calculateSimilarity`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- **Interfaces/Types**: PascalCase (e.g., `MarketSearchQuery`, `ApiResponse`)
- **Classes**: PascalCase (e.g., `MarketAnalyzer`, `SearchService`)
- **Private Members**: underscore prefix (e.g., `_privateMethod`, `_internalState`)
### Code Formatting
- **Indentation**: 2 spaces (no tabs)
- **Line Length**: Maximum 100 characters (preferred)
- **Semicolons**: Required
- **Quotes**: Single quotes for strings (double quotes for JSX attributes)
- **Trailing Commas**: Es5-compatible (multiline only)
- **Braces**: Same-line opening brace for blocks
### Import Organization
### Immutability Patterns
- **Objects**: Spread operator (`{ ...obj, prop: value }`)
- **Arrays**: Spread operator (`[...arr, newItem]`) or array methods (`map`, `filter`)
- **Never**: Direct mutation (`obj.prop = value`, `arr.push(item)`)
- **Exceptions**: Local variables in isolated scopes (with clear justification)
### Error Handling
- **Async Functions**: Try/catch blocks with meaningful error messages
- **Validation**: Early returns for invalid inputs
- **Error Types**: Custom Error classes or enhanced Error objects
- **Logging**: Console.error for unexpected failures
- **User Feedback**: Throw errors with actionable messages
### Async/Await Best Practices
- **Parallel Execution**: `Promise.all()` for independent operations
- **Sequential**: await when operations depend on previous results
- **Error Handling**: Always wrap in try/catch
- **Timeouts**: Use Promise.race with timeout for external calls
- **Cancellation**: Consider AbortController for fetch operations
### Type Safety
- **Strict Types**: Avoid `any` and `unknown` when possible
- **Interface Segregation**: Small, focused interfaces
- **Union Types**: For limited value sets (e.g., `'active' | 'resolved' | 'closed'`)
- **Generics**: For reusable type-safe components
- **Type Assertions**: Only when absolutely necessary (`as Type`)
## React-Specific Standards (when applicable)
### Component Structure
- **Functional Components**: Preferred over class components
- **Props Interface**: Typed props destructuring
- **Default Values**: Destructuring with defaults (`prop = defaultValue`)
- **Children Typing**: `React.ReactNode` for children props
- **Event Handlers**: Proper typing (e.g., `React.MouseEventHandler`)
### State Management
- **useState**: Functional updates when based on previous state
- **useReducer**: For complex state logic
- **Context API**: For global state (theme, auth, etc.)
- **State Location**: Colocate state with usage when possible
### Performance Optimization
- **useMemo**: For expensive computations
- **useCallback**: For function references in dependencies
- **React.lazy**: For code splitting
- **Suspense**: For lazy loading fallbacks
- **memo**: For preventing unnecessary re-renders
### Styling
- **CSS Modules**: For component-scoped styles
- **Styled Components**: When dynamic styling is needed
- **Tailwind/Utility-first**: When configured in project
- **Global Styles**: Limited to reset and base styles
## Testing Conventions
### Test Framework
- **Primary**: Vitest (Jest-compatible) for unit/integration tests
- **E2E**: Playwright for browser-based tests
- **Assertions**: Expect API (Jest-style)
- **Mocking**: Jest.mock for dependencies
### Test Organization
- **Unit Tests**: `__tests__` directory alongside source or `.test.ts` suffix
- **Integration Tests**: Similar to unit tests but test broader interactions
- **E2E Tests**: Dedicated `e2e/` directory at project root
- **Test Files**: Same basename as source with `.test.` prefix (e.g., `util.test.ts`)
### Test Patterns
- **AAA Pattern**: Arrange, Act, Assert
- **Descriptive Names**: Clear explanation of what's being tested
- **One Assertion Per Test**: Focus on single behavior when possible
- **Edge Cases**: Test null, undefined, empty, boundary values
- **Error Paths**: Test failure scenarios, not just happy paths
- **Mocking**: External dependencies mocked for unit tests
### Test File Structure
## Code Quality Principles
### Readability
- **Self-Documenting Code**: Clear names over comments
- **Comments**: Explain WHY, not WHAT
- **JSDoc**: For public APIs and complex functions
- **Function Size**: < 50 lines preferred
- **File Size**: < 500 lines preferred
### Simplicity (KISS)
- **Simple Solutions**: Prefer straightforward approaches
- **Avoid Over-engineering**: Don't solve problems you don't have
- **Readability > Cleverness**: Clear code is better than tricky code
### Maintainability (DRY/YAGNI)
- **DRY**: Extract reusable logic into functions/modules
- **YAGNI**: Don't implement features before they're needed
- **Refactoring**: Continuously improve code structure
- **Technical Debt**: Address proactively, not reactively
### Error Handling Expectations
- **Graceful Degradation**: Fail gracefully when possible
- **Informative Errors**: Messages should help users resolve issues
- **Logging**: Appropriate levels (debug, info, warn, error)
- **Recovery**: Attempt recovery when feasible
- **Fallbacks**: Provide sensible defaults when possible
## API Design Standards (when building APIs)
### REST Conventions
- **HTTP Methods**: GET (read), POST (create), PUT/PATCH (update), DELETE (remove)
- **Resource Naming**: Plural nouns (`/markets`, `/orders`)
- **Nested Resources**: `/markets/{id}/items`
- **Query Parameters**: Filtering, sorting, pagination
- **Status Codes**: Proper use of 2xx, 4xx, 5xx codes
### Response Format
### Validation
- **Input Validation**: Schema-based (Zod/Yup preferred)
- **Output Sanitization**: Remove sensitive data before returning
- **Consistent Errors**: Standardized error response format
- **Rate Limiting**: Implement when appropriate
## Security Practices
### Data Protection
- **No Secrets in Code**: Use environment variables
- **Input Sanitization**: Prevent injection attacks
- **Output Encoding**: Prevent XSS in web contexts
- **Secure Headers**: Set appropriate HTTP headers
- **Authentication**: Validate tokens/sessions properly
### Dependency Security
- **Regular Updates**: Keep dependencies current
- **Vulnerability Scanning**: Use npm audit or similar
- **License Compliance**: Verify OSS licenses
- **Minimal Dependencies**: Only include what's needed
## Documentation Standards
### Code Comments
- **JSDoc**: For exported functions, classes, interfaces
- **TODO Comments**: With ticket/reference when possible
- **FIXME Comments**: For known issues needing attention
- **Documentation Blocks**: For complex algorithms or workflows
### External Documentation
- **README.md**: Project overview and setup instructions
- **CHANGELOG.md**: Version history and changes
- **API Docs**: Generated or maintained separately
- **Skill Instructions**: Detailed usage guides for each skill
- **Agent Prompts**: Clear descriptions of agent capabilities
## Specific to ECC/OpenCode Plugin
### Plugin Development
- **Entry Point**: `index.ts` exports plugin interface
- **Command Registration**: Markdown files in `/commands/`
- **Skill Registration**: Directories in `/skills/` with SKILL.md
- **Agent Prompts**: TXT files in `/prompts/agents/`
- **Tools**: TypeScript utilities in `/tools/`
### Configuration
- **opencode.json**: Main plugin configuration
- **Environment Variables**: For runtime configuration
- **Package.json**: npm metadata and dependencies
- **tsconfig.json**: TypeScript compiler options
### Integration Patterns
- **OpenCode API**: Use `@opencode-ai/plugin` correctly
- **Event Handling**: Proper hook registration and usage
- **Resource Access**: File system, configuration via plugin APIs
- **Agent Spawning**: Follow OpenCode's agent creation patterns
## Tool-Specific Conventions
### Utility Functions
- **Pure Functions**: Preferred when possible
- **Side Effects**: Clearly documented and isolated
- **Error Handling**: Consistent patterns across tools
- **Logging**: Appropriate levels for operational insight
- **Testing**: High test coverage for shared utilities
### Git Operations
- **Atomic Commits**: One logical change per commit — never batch unrelated changes
- **Commit Messages**: Write like a human. No conventional-commits tags (`feat:`, `fix:`, `docs:`). Just say what changed and why in plain English. Short first line, details after if needed
- **Branch Naming**: Feature/bugfix/hotfix prefixes
- **Merge Strategies**: Prefer rebase for clean history
- **Auto-commit**: After every atomic change (new file, edited function, passing test), commit immediately with a humane message before moving to the next task
### Testing Utilities
- **Test Helpers**: Shared setup/teardown functions
- **Mock Factories**: Consistent mock creation patterns
- **Assertion Helpers**: Custom matchers when beneficial
- **Coverage**: Tools to measure and report coverage
## Evolution and Maintenance
### Backward Compatibility
- **Semantic Versioning**: Follow semver for releases
- **Deprecation Warnings**: For removed/changed functionality
- **Migration Guides**: For breaking changes
- **Feature Flags**: For gradual rollouts
### Code Review
- **Checklist**: Verify conventions followed
- **Testing**: Ensure new code is tested
- **Documentation**: Update relevant docs
- **Performance**: Consider performance implications
- **Security**: Review for vulnerabilities
### Refactoring Guidelines
- **Boy Scout Rule**: Leave code cleaner than you found it
- **Incremental Improvements**: Small, frequent refactors
- **Test Coverage**: Maintain or improve test coverage
- **Behavior Preservation**: Ensure refactoring doesn't change behavior
- **Team Agreement**: Refactor with team consensus when impactful
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Architectural Overview
## Core Architectural Patterns
### Plugin Architecture
- **Host-Extension Model**: The plugin extends OpenCode's core functionality
- **Dependency Injection**: Uses `@opencode-ai/plugin` for integration with OpenCode host
- **Modular Design**: Separation into commands, skills, tools, and prompts layers
- **Configuration-Driven**: Behavior configurable via `opencode.json`
### Layered Architecture
```
```
### Component Responsibilities
## Key Architectural Decisions
### 1. Modular Skill-Based Design
- Enables independent development and testing
- Allows users to load only needed functionality
- Facilitates sharing and collaboration
- Supports the OpenCode plugin ecosystem model
- Specialized agents (in `/agents/` subdirectory)
- Skill instructions (referenced from `.opencode/instructions/`)
- Optional prompts, references, and supporting files
### 2. TypeScript-First Implementation
- Type safety reduces runtime errors
- Better IDE support and refactoring capabilities
- Self-documenting code through type annotations
- Alignment with modern JavaScript/TypeScript ecosystem
- All tools in `/tools/` are TypeScript
- Plugin main entry (`index.ts`) is TypeScript
- Configuration files use TypeScript where appropriate (`tsconfig.json`)
- Dependency on `@types/node` for Node.js type definitions
### 3. OpenCode Plugin Integration
- Leverages OpenCode's existing infrastructure
- Provides standardized extension mechanisms
- Enables discoverability through OpenCode's plugin system
- Benefits from OpenCode's security and permission models
- Depends on `@opencode-ai/plugin` package
- Exports standardized plugin interface
- Uses OpenCode's agent, command, skill, and hook systems
- Follows OpenCode's publishing conventions
### 4. Separation of Concerns
- Reduces cognitive complexity
- Prevents accidental coupling
- Enables parallel development
- Improves maintainability and testability
- Commands: User interface and argument parsing
- Skills: Domain expertise and workflows
- Tools: Shared low-level utilities
- Prompts: Agent behavior definitions
- Plugin: Host integration and lifecycle management
## Data Flow and Request Handling
### Command Execution Flow
### Agent-Based Task Execution
## Architectural Viewpoints
### Deployment View
- **Single Deployable Unit**: Published as npm package (`ecc-universal`)
- **Host Dependency**: Requires OpenCode host with plugin support
- **Node.js Runtime**: Requires Node.js >=18.0.0
- **Installation**: Standard npm install into OpenCode plugins directory
### Runtime View
- **Process Model**: Runs within OpenCode host process
- **Threading**: Asynchronous JavaScript/TypeScript execution
- **Memory**: Shared memory space with host OpenCode instance
- **Communication**: Via OpenCode's plugin API interfaces
### Development View
- **Source Organization**: Clearly separated by concern (commands, skills, etc.)
- **Build Process**: TypeScript compilation to `dist/` directory
- **Dependencies**: Managed through npm/package.json
- **Testing**: Individual skill/tool testing with shared test utilities
### Evolution View
- **Extensibility**: New skills/commands added by dropping in files
- **Backward Compatibility**: Maintained through semantic versioning
- **Plugin Updates**: Standard npm update mechanism
- **Feature Flags**: Configuration-driven enable/disable capabilities
## Integration Architecture
### OpenCode Integration Points
### External Integration Patterns (via Skills)
- **API Design Skill**: Patterns for REST API integration
- **MCP Server Patterns**: Building Model Context Protocol servers
- **Exa Search/Firecrawl**: Web search and scraping integrations
- **Fal.ai Media**: AI media generation service integration
- **X API**: Social media platform integration
- **MLE Workflow**: Machine learning platform integration patterns
## Quality Attributes Supported by Architecture
### Modularity
- High modularity through skill/command separation
- Independent deployment and versioning of capabilities
- Clear interfaces between layers
### Extensibility
- Easy addition of new skills, commands, and tools
- Well-defined extension points
- Plugin system designed for growth
### Maintainability
- Separation of concerns reduces change impact
- Consistent patterns across codebase
- Type safety prevents many classes of errors
### Testability
- Modular components can be tested in isolation
- Tools and skills have clear interfaces
- Mocking capabilities for external dependencies
### Performance
- Asynchronous non-blocking design
- Lazy loading of skills/commands as needed
- Efficient TypeScript compilation
## Current Architectural Constraints
### Platform Constraints
- Tightly coupled to OpenCode plugin system
- Requires Node.js >=18.0.0 runtime
- Dependent on @opencode-ai/plugin version compatibility
### Design Constraints
- Must follow OpenCode's plugin API contracts
- Security model inherited from OpenCode host
- Distribution mechanism tied to npm/OpenCode ecosystem
### Implementation Constraints
- TypeScript requirement for all implementation code
- Specific directory structure expectations
- Naming conventions for discoverability
## Future Architectural Considerations
### Potential Evolutions
### Technology Updates
- Potential migration to newer TypeScript versions
- Updates to @opencode-ai/plugin as it evolves
- Adoption of new JavaScript/TC39 features as appropriate
- Consideration of alternative packaging/distribution mechanisms
## Architectural Guidelines for Contributors
### Adding New Functionality
### Modifying Existing Code
### Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
- On session start, if `graphify-out/` exists, read `GRAPH_REPORT.md` before exploring the codebase
