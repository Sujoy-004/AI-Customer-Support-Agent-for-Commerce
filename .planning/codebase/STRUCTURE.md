# Codebase Structure

**Last Updated:** 2026-05-14

## Root Directory Structure
```
antigravity skills\AI Customer Support Agent for Commerce\
├── .opencode/                    # ECC Plugin Source Code
├── .planning/                    # GSD Planning Artifacts
├── .gitignore                   # Git exclusion rules
├── .npmignore                   # npm publication exclusion rules
├── AGENTS.md                    # Agent instructions and guidelines
├── CHANGELOG.md                 # Project changelog
├── HACKATHON_DETAILS.md         # Hackathon event details
├── PRD.md                       # Product Requirements Document
├── SOVEREIGNTY.md               # Sovereignty protocol documentation
└── TRD.md                       # Technical Requirements Document
```

## .opencode/ Directory Structure
```
.opencode\
├── commands/                    # CLI command definitions (Markdown)
├── prompts/                     # Agent prompt templates
│   └── agents/                  # Agent-specific prompts
├── skills/                      # Specialized skill implementations
├── tools/                       # Utility scripts (TypeScript)
├── plugins/                     # Plugin interfaces and implementations
├── instructions/                # Skill instruction documents
├── index.ts                     # Main plugin entry point
├── opencode.json                # Plugin configuration
├── package.json                 # npm package definition
├── tsconfig.json                # TypeScript configuration
├── package-lock.json            # Locked dependency versions
└── README.md                    # Plugin documentation
```

## Detailed Component Breakdown

### Commands (.opencode\commands\)
Markdown files defining CLI commands for the OpenCode plugin:
- `plan.md` - Create implementation plans with risk assessment
- `test-coverage.md` - Check test coverage
- `tdd.md` - Test-driven development workflow
- `security.md` - Security scanning and audit
- `build-fix.md` - Build and TypeScript error resolution
- `orchestrate.md` - Multi-agent orchestration
- And many more specialized commands

### Skills (.opencode\skills\)
Specialized skill implementations organized by domain:
- **Development Workflow**: `tdd-workflow`, `verification-loop`, `eval-harness`
- **Code Quality**: `coding-standards`, `lint-check` tools
- **Architecture**: `backend-patterns`, `frontend-patterns`, `api-design`
- **DevOps**: `mcp-server-patterns`, `bun-runtime`, `nextjs-turbopack`
- **AI/ML**: `mle-workflow`, `exa-search`, `deep-research`, `fal-ai-media`
- **Content**: `article-writing`, `content-engine`, `crosspost`, `frontend-slides`
- **Business**: `investor-materials`, `investor-outreach`, `market-research`
- **Security**: `security-review`
- **Platform Specific**: `x-api` (Twitter/X integration)

### Tools (.opencode\tools\)
TypeScript utility scripts:
- `index.ts` - Main tools entry point
- `git-summary.ts` - Git summary generation
- `format-code.ts` - Code formatting detection
- `lint-check.ts` - Linting utility
- `run-tests.ts` - Test runner
- `check-coverage.ts` - Coverage checking
- `changed-files.ts` - Changed file tracking
- `security-audit.ts` - Security auditing

### Plugins (.opencode\plugins\)
Plugin interfaces and implementations:
- `index.ts` - Plugin exports
- `lib\changed-files-store.ts` - Changed files persistence
- `ecc-hooks.ts` - ECC-specific hooks

### Prompts (.opencode\prompts\agents\)
Agent prompt templates for various specializations:
- `architect.txt` - Architecture specialist
- `build-error-resolver.txt` - Build/TS error resolution
- `code-reviewer.txt` - Code quality review
- `database-reviewer.txt` - Database optimization
- `doc-updater.txt` - Documentation updates
- `e2e-runner.txt` - E2E testing with Playwright
- `explorer.txt` - Fast codebase exploration
- `general.txt` - General purpose agent
- `go-build-resolver.txt` - Go build error resolution
- `go-reviewer.txt` - Go code review
- `harness-optimizer.txt` - Agent harness optimization
- `java-build-resolver.txt` - Java build error resolution
- `java-reviewer.txt` - Java/Spring Boot review
- `kotlin-build-resolver.txt` - Kotlin build error resolution
- `kotlin-reviewer.txt` - Kotlin/Android review
- `loop-operator.txt` - Autonomous agent loops
- `planner.txt` - Implementation planning
- `python-reviewer.txt` - Python code review
- `refactor-cleaner.txt` - Dead code cleanup
- `rust-build-resolver.txt` - Rust build error resolution
- `rust-reviewer.txt` - Rust code review
- `security-reviewer.txt` - Security vulnerability detection
- `tdd-guide.txt` - TDD methodology enforcement

## Key Architectural Patterns

### Modular Separation of Concerns
- **Commands**: CLI interface layer
- **Skills**: Domain-specific functionality packages
- **Tools**: Shared utility functions
- **Plugins**: Extension points and interfaces
- **Prompts**: Agent behavior definitions
- **Instructions**: Skill documentation and guidance

### Type-First Development
- Primary use of TypeScript for type safety
- Definition files (.d.ts) for external dependencies
- Strict typing in tools and plugins

### Plugin Architecture
- Built as an OpenCode plugin using `@opencode-ai/plugin`
- Follows OpenCode's extension patterns
- Provides agents, commands, skills, and hooks to host environment

### Skill-Based Extensibility
- Each skill is a self-contained domain expertise package
- Skills can include agents, prompts, and references
- Easy to add/remove skills without affecting core

## Important Files and Their Purposes

### Configuration
- `opencode.json` - Main plugin configuration for OpenCode
- `package.json` - npm package metadata and dependencies
- `tsconfig.json` - TypeScript compiler configuration

### Documentation
- `README.md` - Plugin overview and usage
- `AGENTS.md` - Critical guidance for AI agents (this file you're reading)
- `PRD.md` - Product requirements for the AI Customer Support Agent
- `TRD.md` - Technical requirements
- `SOVEREIGNTY.md` - Sovereignty protocol documentation
- `HACKATHON_DETAILS.md` - Event-specific information
- `CHANGELOG.md` - Version history

### Entry Points
- `.opencode\index.ts` - Main plugin initialization
- Various command files in `.opencode\commands\` - CLI entry points

## Naming Conventions
- **Directories**: kebab-case (e.g., `agent-introspection-debugging`)
- **Files**: kebab-case for markdown/scripts, camelCase for TypeScript
- **TypeScript**: PascalCase for interfaces/classes, camelCase for variables/functions
- **Commands**: kebab-case naming in `.opencode\commands\`
- **Skills**: kebab-case directory names under `.opencode\skills\`

## Dependencies Structure
- **Production**: `@opencode-ai/plugin` (core OpenCode API)
- **Development**: TypeScript, @types/node (build tooling)
- **Bundled**: Numerous node_modules for tool functionality

## Data Flow and Communication
1. **CLI Layer**: Users invoke commands via OpenCode CLI
2. **Command Layer**: Commands delegate to skills or tools
3. **Skill Layer**: Skills provide domain-specific functionality
4. **Tool Layer**: Shared utilities used across commands/skills
5. **Plugin Layer**: Integrates with OpenCode host via `@opencode-ai/plugin`
6. **Agent Layer**: Skills may spawn specialized agents for complex tasks

## Extension Points
- **New Commands**: Add markdown files to `.opencode\commands\`
- **New Skills**: Add directories to `.opencode\skills\`
- **New Tools**: Add TypeScript files to `.opencode\tools\`
- **New Agents**: Add prompt files to `.opencode\prompts\agents\`
- **New Plugins**: Extend `.opencode\plugins\` interfaces

## Scale and Organization
- Approximately 50+ specialized skills covering various domains
- Modular design allows independent development of features
- Clear separation prevents coupling between concerns
- Easy to navigate due to consistent organizational patterns