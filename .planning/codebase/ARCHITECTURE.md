# System Architecture

**Last Updated:** 2026-05-14

## Architectural Overview
The AI Customer Support Agent for Commerce is built as an OpenCode plugin (ECC - Everything Claude Code) that extends OpenCode's capabilities with specialized agents, commands, skills, and tools for e-commerce customer support scenarios.

## Core Architectural Patterns

### Plugin Architecture
- **Host-Extension Model**: The plugin extends OpenCode's core functionality
- **Dependency Injection**: Uses `@opencode-ai/plugin` for integration with OpenCode host
- **Modular Design**: Separation into commands, skills, tools, and prompts layers
- **Configuration-Driven**: Behavior configurable via `opencode.json`

### Layered Architecture
```
Presentation Layer (CLI/Commands)
        ↓
Application Layer (Skills/Tools)
        ↓
Domain Layer (Agent Prompts/Logic)
        ↓
Integration Layer (OpenCode Plugin API)
```

### Component Responsibilities
1. **Commands Layer** (`/commands`)
   - CLI interface exposed to users
   - Parses arguments and delegates to appropriate skills/tools
   - Provides help, validation, and user interaction

2. **Skills Layer** (`/skills`)
   - Domain-specific expertise packages
   - Each skill encapsulates a complete workflow or capability
   - May include specialized agents, prompts, and references

3. **Tools Layer** (`/tools`)
   - Shared utility functions used across commands/skills
   - Cross-cutting concerns like git operations, formatting, testing
   - Implemented in TypeScript for reusability

4. **Prompts Layer** (`/prompts/agents`)
   - Defines behavior and expertise of specialized AI agents
   - Template-based prompts for consistent agent behavior
   - Organized by specialization (architect, code-reviewer, etc.)

5. **Plugin Layer** (`/index.ts`, `/plugins/`)
   - Main entry point and plugin registration
   - Exports commands, skills, tools to OpenCode host
   - Manages plugin lifecycle

## Key Architectural Decisions

### 1. Modular Skill-Based Design
**Decision**: Organize functionality into discrete, reusable skills
**Rationale**: 
- Enables independent development and testing
- Allows users to load only needed functionality
- Facilitates sharing and collaboration
- Supports the OpenCode plugin ecosystem model

**Implementation**: Each skill in `/skills/` contains:
- Specialized agents (in `/agents/` subdirectory)
- Skill instructions (referenced from `.opencode/instructions/`)
- Optional prompts, references, and supporting files

### 2. TypeScript-First Implementation
**Decision**: Use TypeScript for all implementation code
**Rationale**:
- Type safety reduces runtime errors
- Better IDE support and refactoring capabilities
- Self-documenting code through type annotations
- Alignment with modern JavaScript/TypeScript ecosystem

**Implementation**: 
- All tools in `/tools/` are TypeScript
- Plugin main entry (`index.ts`) is TypeScript
- Configuration files use TypeScript where appropriate (`tsconfig.json`)
- Dependency on `@types/node` for Node.js type definitions

### 3. OpenCode Plugin Integration
**Decision**: Build as an OpenCode plugin using official SDK
**Rationale**:
- Leverages OpenCode's existing infrastructure
- Provides standardized extension mechanisms
- Enables discoverability through OpenCode's plugin system
- Benefits from OpenCode's security and permission models

**Implementation**:
- Depends on `@opencode-ai/plugin` package
- Exports standardized plugin interface
- Uses OpenCode's agent, command, skill, and hook systems
- Follows OpenCode's publishing conventions

### 4. Separation of Concerns
**Decision**: Strict separation between different types of functionality
**Rationale**:
- Reduces cognitive complexity
- Prevents accidental coupling
- Enables parallel development
- Improves maintainability and testability

**Implementation**:
- Commands: User interface and argument parsing
- Skills: Domain expertise and workflows
- Tools: Shared low-level utilities
- Prompts: Agent behavior definitions
- Plugin: Host integration and lifecycle management

## Data Flow and Request Handling

### Command Execution Flow
1. **User Input**: User invokes a command via OpenCode CLI (e.g., `/plan`)
2. **Command Resolution**: OpenCode routes to appropriate command in `/commands/`
3. **Argument Parsing**: Command processes user arguments and flags
4. **Delegation**: Command delegates to appropriate skill or tool
5. **Skill/Tool Execution**: Skill performs domain-specific work
6. **Agent Spawning** (if needed): Skill may spawn specialized agents
7. **Result Return**: Results passed back through the chain to user
8. **Persistence**: Any changes saved via OpenCode's file system

### Agent-Based Task Execution
For complex tasks, skills may spawn specialized agents:
1. **Skill Determination**: Skill identifies need for specialized expertise
2. **Agent Selection**: Chooses appropriate agent type from `/prompts/agents/`
3. **Context Preparation**: Gathers relevant information for agent
4. **Agent Invocation**: Uses OpenCode's agent spawning mechanism
5. **Collaboration**: Agent works on subtask and returns results
6. **Integration**: Skill incorporates agent results into overall workflow

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
1. **Command Registration**: Commands made available via OpenCode CLI
2. **Agent Registration**: Specialized agents available for spawning
3. **Skill Availability**: Skills discoverable through OpenCode skill system
4. **Hook System**: Ability to register for OpenCode lifecycle events
5. **Resource Access**: File system, configuration, and other host services

### External Integration Patterns (via Skills)
While the core plugin focuses on OpenCode extension, included skills suggest integration patterns:
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
1. **More Granular Skills**: Breaking large skills into smaller, composable units
2. **Enhanced Configuration**: More sophisticated skill/command configuration
3. **Improved Agent Communication**: Better patterns for agent collaboration
4. **Extended Integration Points**: Additional OpenCode host integration capabilities
5. **Performance Optimizations**: Advanced caching, precompilation, etc.

### Technology Updates
- Potential migration to newer TypeScript versions
- Updates to @opencode-ai/plugin as it evolves
- Adoption of new JavaScript/TC39 features as appropriate
- Consideration of alternative packaging/distribution mechanisms

## Architectural Guidelines for Contributors

### Adding New Functionality
1. **Determine Type**: Is it a command, skill, tool, or prompt?
2. **Follow Conventions**: Use established naming and structure
3. **Maintain Separation**: Don't mix concerns across layers
4. **Provide Documentation**: Include appropriate README/comments
5. **Consider Reusability**: Make it useful beyond immediate need

### Modifying Existing Code
1. **Understand Layer**: Know which layer you're modifying
2. **Respect Interfaces**: Don't break public contracts
3. **Maintain Consistency**: Follow existing patterns and styles
4. **Update Documentation**: Reflect changes in relevant docs
5. **Consider Backwards Compatibility**: Avoid breaking changes when possible

### Cross-Cutting Concerns
1. **Error Handling**: Follow established patterns in tools/skills
2. **Logging**: Use appropriate logging mechanisms
3. **Security**: Follow security-review skill patterns
4. **Performance**: Consider performance implications of changes
5. **Testing**: Ensure new functionality is adequately tested