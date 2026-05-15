/**
 * Antigravity Skills Runtime Integration
 *
 * Application-side runtime configuration for Antigravity Skills.
 * This documents which skills power which workflows at runtime
 * and provides programmatic access to skill metadata.
 *
 * The actual skill files live at .opencode/skills/<name>/SKILL.md
 * and are loaded by the OpenCode agent system. This module provides
 * runtime introspection so the application can advertise which skills
 * are active.
 */

export interface RuntimeSkillInfo {
  name: string
  description: string
  active: boolean
  workflow: string
}

/**
 * Skills active in the runtime application context.
 * Maps to skill directories under .opencode/skills/.
 */
const RUNTIME_SKILLS: RuntimeSkillInfo[] = [
  {
    name: "tdd-workflow",
    description: "Test-driven development with 80%+ coverage",
    active: true,
    workflow: "All feature development follows TDD (RED/GREEN/REFACTOR)",
  },
  {
    name: "e2e-testing",
    description: "Playwright E2E testing with Page Object Model",
    active: true,
    workflow: "E2E tests in e2e/ directory follow Playwright POM patterns",
  },
  {
    name: "documentation-lookup",
    description: "Context7 MCP for live library documentation",
    active: false,
    workflow: "Available for catalog enrichment when CONTEXT7_ENABLED=true",
  },
  {
    name: "security-review",
    description: "Security review for auth, secrets, input handling",
    active: true,
    workflow: "All code reviewed against security patterns before merge",
  },
  {
    name: "verification-loop",
    description: "Comprehensive verification before marking complete",
    active: true,
    workflow: "UAT verification run after each feature completion",
  },
  {
    name: "coding-standards",
    description: "TypeScript conventions, immutability, error handling",
    active: true,
    workflow: "All code follows TypeScript strict conventions",
  },
]

export function getRuntimeSkills(): RuntimeSkillInfo[] {
  return RUNTIME_SKILLS
}

export function getActiveRuntimeSkills(): RuntimeSkillInfo[] {
  return RUNTIME_SKILLS.filter((s) => s.active)
}
