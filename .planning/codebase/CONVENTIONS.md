# Code Conventions & Best Practices

**Last Updated:** 2026-05-14

## Overview
This document outlines the coding conventions, patterns, and best practices used throughout the ECC (Everything Claude Code) plugin codebase. These conventions ensure consistency, readability, and maintainability across the project.

## Language Standards
- **Primary Language**: TypeScript (>=5.3.0)
- **Runtime**: Node.js (>=18.0.0)
- **Strict Mode**: Enforced via tsconfig.json
- **Module System**: ES Modules (import/export)

## File Organization

### Directory Structure Conventions
```
.opencode\
├── commands/          # CLI command definitions (.md files)
├── prompts/           # Agent prompt templates
│   └── agents/        # Specialized agent prompts (.txt files)
├── skills/            # Domain-specific skill packages
│   ├── {skill-name}/  # Individual skill directories
│   │   ├── agents/    # Skill-specific agents (optional)
│   │   └── SKILL.md   # Skill documentation
├── tools/             # Shared utility scripts (.ts files)
├── plugins/           # Plugin interfaces (.ts files)
├── instructions/      # Skill reference documents
├── index.ts           # Main plugin entry point
└── opencode.json      # Plugin configuration
```

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
1. **Core Node.js Modules** (e.g., `fs`, `path`)
2. **External Dependencies** (e.g., `@opencode-ai/plugin`, `zod`)
3. **Internal Modules** (relative paths)
   - Plugin internals: `../tools/...`, `../skills/...`
   - Type imports: `../types/...`
4. **Type-only Imports**: `import type { ... } from '...'`

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
```typescript
describe('Module/Feature', () => {
  beforeEach(() => {
    // Setup common state
  });
  
  afterEach(() => {
    // Cleanup
  });
  
  describe('Specific Function/Behavior', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

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
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  }
}
```

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
- **Atomic Commits**: One logical change per commit
- **Commit Messages**: Clear, conventional format
- **Branch Naming**: Feature/bugfix/hotfix prefixes
- **Merge Strategies**: Prefer rebase for clean history

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

---

*This document reflects the conventions observed in the ECC plugin codebase as of 2026-05-14. Conventions may evolve as the codebase matures and team practices develop.*