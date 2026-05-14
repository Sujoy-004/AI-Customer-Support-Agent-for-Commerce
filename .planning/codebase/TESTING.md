# Testing Practices & Strategies

**Last Updated:** 2026-05-14

## Testing Philosophy
The ECC (Everything Claude Code) plugin follows a Test-Driven Development (TDD) approach with comprehensive test coverage requirements. Testing is considered an integral part of development, not an afterthought.

## Core Testing Principles

### 1. Test-First Development
- Always write tests before implementing code
- Tests define the expected behavior and interface
- Implementation is guided by making tests pass

### 2. Coverage Requirements
- Minimum 80% coverage across unit, integration, and E2E tests
- All edge cases and error scenarios must be tested
- Boundary conditions verified for all functions

### 3. Test Types & Purposes
- **Unit Tests**: Validate individual functions, components, and utilities
- **Integration Tests**: Test interactions between modules, APIs, and services
- **E2E Tests**: Verify complete user workflows and system behavior

## Testing Infrastructure

### Test Frameworks
- **Unit/Integration Tests**: Vitest (Jest-compatible) - Primary test runner
- **End-to-End Tests**: Playwright - Browser automation for user flows
- **Assertions**: Expect API (Jest-style syntax)
- **Mocking**: Jest.mock for dependency isolation
- **Coverage Reporting**: Built-in Vitest coverage or Istanbul/nyc

### Test Commands (from package.json scripts)
- `npm test` - Run all tests
- `npm run test:coverage` - Run tests with coverage report
- `npm test -- --watch` - Watch mode for TDD
- Specific test patterns can be run with `npm test -- <pattern>`

### Test Environment
- **Node.js**: >=18.0.0
- **Test Files**: Co-located with source or in `__tests__` directories
- **Test File Naming**: `{name}.test.{ts,tsx}` or `{name}.spec.{ts,tsx}`
- **Test Utilities**: Shared helpers in test setup files

## Test Organization

### Unit Test Structure
```
src/
├── lib/
│   ├── utils/
│   │   ├── formatDate.ts
│   │   └── formatDate.test.ts
│   └── api/
│       ├── marketClient.ts
│       └── marketClient.test.ts
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx
└── app/
    └── api/
        ├── markets/
        │   ├── route.ts
        │   └── route.test.ts
```

### E2E Test Structure
```
e2e/
├── markets.spec.ts
├── auth.spec.ts
├── trading.spec.ts
└── helpers/
    └── test-helpers.ts
```

### Test File Naming Conventions
- **Unit Tests**: `{filename}.test.ts` (e.g., `formatDate.test.ts`)
- **Integration Tests**: `{filename}.test.ts` (e.g., `route.test.ts`)
- **E2E Tests**: `{feature}.spec.ts` (e.g., `markets.spec.ts`)
- **Test Helpers**: Descriptive names in `test/` or `__tests__/` directories

## TDD Workflow Implementation

### Step-by-Step Process
1. **Write User Story**: As a [role], I want to [action] so that [benefit]
2. **Generate Test Cases**: Comprehensive test scenarios for the user story
3. **Write Failing Tests**: Tests should fail initially (RED phase)
4. **Implement Minimal Code**: Just enough to make tests pass (GREEN phase)
5. **Run Tests**: Verify all tests pass
6. **Refactor**: Improve code quality while keeping tests green (REFACTOR phase)
7. **Verify Coverage**: Ensure 80%+ coverage is maintained
8. **Repeat**: For next user story or feature

### Test Case Generation Guidelines
- **Happy Path**: Main expected usage
- **Edge Cases**: Empty/null values, boundary conditions
- **Error Scenarios**: Invalid inputs, failure modes, exception handling
- **Fallback Behavior**: Behavior when dependencies are unavailable
- **Performance**: Load handling, timeout scenarios (when relevant)

## Testing Patterns by Type

### Unit Test Patterns
```typescript
// Pure Function Test
describe('formatDate', () => {
  it('formats date correctly', () => {
    expect(formatDate(new Date('2023-01-01'))).toBe('Jan 1, 2023');
  });
  
  it('handles invalid dates gracefully', () => {
    expect(formatDate(undefined)).toBe('');
  });
});

// Component Test
describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Test Patterns
```typescript
// API Route Test
describe('GET /api/markets', () => {
  it('returns markets successfully', async () => {
    const request = new NextRequest('http://localhost/api/markets');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
  
  it('validates query parameters', async () => {
    const request = new NextRequest('http://localhost/api/markets?limit=invalid');
    const response = await GET(request);
    
    expect(response.status).toBe(400);
  });
});

// Service Interaction Test
describe('MarketService', () => {
  it('fetches market data from API', async () => {
    // Mock HTTP client
    const mockHttp = { get: jest.fn().mockResolvedValue({ data: testData }) };
    const service = new MarketService(mockHttp as any);
    
    const result = await service.getMarket('123');
    
    expect(mockHttp.get).toHaveBeenCalledWith('/markets/123');
    expect(result).toEqual(testData);
  });
});
```

### E2E Test Patterns (Playwright)
```typescript
test('user can search and filter markets', async ({ page }) => {
  // Given: User is on markets page
  await page.goto('/markets');
  await expect(page.locator('h1')).toContainText('Markets');
  
  // When: User searches for markets
  await page.fill('input[placeholder="Search markets"]', 'election');
  await page.waitForTimeout(600); // Wait for debounce
  
  // Then: Search results are displayed
  const results = page.locator('[data-testid="market-card"]');
  await expect(results).toHaveCount(5, { timeout: 5000 });
  await expect(results.first()).toContainText('election', { ignoreCase: true });
  
  // And: User can filter results
  await page.click('button:has-text("Active")');
  await expect(results).toHaveCount(3);
});

test('user can create a new market', async ({ page }) => {
  // Given: User is authenticated and on creation page
  await page.goto('/creator-dashboard');
  
  // When: User fills and submits market creation form
  await page.fill('input[name="name"]', 'Test Market');
  await page.fill('textarea[name="description"]', 'Test description');
  await page.fill('input[name="endDate"]', '2025-12-31');
  await page.click('button[type="submit"]');
  
  // Then: Success message is shown and user is redirected
  await expect(page.locator('text=Market created successfully')).toBeVisible();
  await expect(page).toHaveURL(/\/markets\/test-market/);
});
```

## Mocking Strategies

### External Service Mocking
```typescript
// Supabase Mock
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [{ id: 1, name: 'Test Market' }],
          error: null
        }))
      }))
    }))
  }
}));

// Redis Mock
jest.mock('@/lib/redis', () => ({
  searchMarketsByVector: jest.fn(() => Promise.resolve([
    { slug: 'test-market', similarity_score: 0.95 }
  ])),
  checkRedisHealth: jest.fn(() => Promise.resolve({ connected: true }))
}));

// OpenAI Mock
jest.mock('@/lib/openai', () => ({
  generateEmbedding: jest.fn(() => Promise.resolve(
    new Array(1536).fill(0.1) // Mock 1536-dim embedding
  ))
}));
```

### Module Mocking Best Practices
- **Location**: Mock at the usage site, not the source
- **Completeness**: Mock all functions that will be called
- **Realism**: Return realistic data shapes and types
- **Reset**: Clear mocks between tests when needed
- **Specificity**: Only mock what's necessary for the test

## Test Coverage Guidelines

### Coverage Types
- **Lines**: Percentage of executable lines covered
- **Statements**: Percentage of statements covered
- **Functions**: Percentage of functions called
- **Branches**: Percentage of branch conditions covered

### Thresholds (from TDD workflow skill)
```json
{
  "jest": {
    "coverageThresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### Coverage Report Generation
```bash
# Generate detailed coverage report
npm run test:coverage

# View coverage in terminal
npm test -- --coverage

# Generate HTML report (if configured)
npm run test:coverage -- --reporter=html
```

### Interpreting Coverage Results
- **High Coverage (≥80%)**: Good baseline, but review what's tested
- **Low Specific Areas**: Investigate uncovered complex/logic-heavy areas
- **Missing Edge Cases**: Focus on error paths and boundary conditions
- **Over-Mocking**: Ensure tests aren't mocking too much to achieve coverage

## Common Testing Practices

### Test Organization Patterns
- **Describe Blocks**: Group related tests
- **BeforeEach/AfterEach**: Setup and teardown for test isolation
- **Test.only/Test.skip**: Focus on specific tests during development
- **Test.todo**: Placeholder for tests to be written

### Assertion Best Practices
- **Be Specific**: Use precise matchers (`toBe`, `toEqual`) over loose ones
- **Test Behavior**: Focus on observable outcomes, not implementation
- **Error Messages**: Custom messages for complex assertions
- **Snapshot Testing**: For complex objects or UI structures (when appropriate)

### Test Data Management
- **Fixtures**: Reusable test data objects
- **Factories**: Functions that generate test data with variations
- **Builders**: For complex object construction
- **Mock Data**: Realistic but fake data for testing

### Performance Considerations
- **Test Speed**: Unit tests should be fast (<50ms each)
- **Setup Cost**: Expensive setup in `beforeAll`, not `beforeEach`
- **Parallel Execution**: Leverage Vitest's parallel test running
- **Memory**: Clean up large data structures in `afterEach`

## Testing in the ECC/OpenCode Context

### Plugin-Specific Testing
- **Command Testing**: Test CLI argument parsing and delegation
- **Skill Testing**: Validate skill behavior and agent interactions
- **Tool Testing**: Verify utility functions work correctly
- **Integration Testing**: Test plugin-OpenCode host interactions
- **Agent Testing**: Validate specialized agent behavior (when possible)

### OpenCode Integration Points
- **API Compatibility**: Ensure plugin works with OpenCode version
- **Hook Registration**: Test that hooks are properly registered
- **Resource Access**: Validate file system and configuration access
- **Event Handling**: Test event emission and handling
- **Permission Model**: Respect OpenCode's security boundaries

## Test Maintenance Practices

### Regular Test Care
- **Review Regularly**: As part of code review process
- **Update When Refactoring**: Keep tests aligned with changes
- **Remove Dead Tests**: Delete tests for removed functionality
- **Fix Flaky Tests**: Address intermittent failures promptly
- **Improve Coverage**: Address gaps identified in coverage reports

### Test Quality Characteristics
- **Isolated**: Tests don't depend on each other
- **Deterministic**: Same result every time when code unchanged
- **Fast**: Quick execution to encourage frequent running
- **Readable**: Clear intent and easy to understand
- **Maintainable**: Easy to update when requirements change
- **Valuable**: Tests meaningful behavior, not trivialities

### Testing Anti-Patterns to Avoid
- **Overly Brittle Tests**: Tests that break with irrelevant changes
- **Excessive Mocking**: Mocking more than necessary
- **Testing Implementation Details**: Focus on private methods/internal state
- **Slow Tests**: Tests that significantly slow down development
- **Unclear Test Names**: Tests that don't clearly state what they verify
- **Magic Numbers**: Unexplained values in tests
- **Duplicate Setup**: Repeated setup logic instead of using helpers

## Continuous Testing Practices

### Development Workflow
- **Pre-Commit Hook**: Run tests and lint before committing
- **Watch Mode**: `npm test -- --watch` during active development
- **Save-and-Test**: Some IDEs can run tests on file save
- **Pair Programming**: Write tests together during development

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm test -- --coverage
    - uses: codecov/codecov-action@v3
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
```

### Test Reporting
- **Coverage Reports**: Uploaded to codecov.io or similar
- **Test Results**: Visible in CI/CD pipeline
- **Trend Analysis**: Tracking coverage and test performance over time
- **Failure Notifications**: Alerts on test failures in PRs/commits

## Specific to AI Customer Support Agent (Track 4)

### Domain-Specific Testing Considerations
- **Order Status Testing**: Verify order lookup and status reporting
- **Returns/Exchanges Testing**: Test return initiation and processing
- **Exchange Workflows**: Validate exchange creation and fulfillment
- **Graceful Handoff**: Test transfer to human agents when needed
- **Shopify Integration**: Test interactions with Shopify APIs (when applicable)
- **Multi-turn Conversations**: Verify context retention across exchanges

### Test Data for E-commerce Scenarios
- **Mock Orders**: Various statuses (pending, processing, shipped, delivered)
- **Product Variants**: Different sizes, colors, configurations
- **Customer Data**: Profiles with histories and preferences
- **Shopify Resources**: Products, orders, customers, draft orders
- **Error Conditions**: Network failures, API rate limits, invalid data

### Test Environment for E-commerce Features
- **Shopify API Mocking**: Simulate Shopify Admin and Storefront APIs
- **Webhook Testing**: Verify webhook handling and validation
- **Authentication**: Test OAuth flows and token management
- **Webhook Security**: Validate HMAC signatures and request integrity
- **Data Synchronization**: Test local cache vs remote state consistency

---

*This document reflects the testing practices observed in the ECC plugin codebase as of 2026-05-14. Testing strategies and tools may evolve as the codebase matures and team practices develop.*