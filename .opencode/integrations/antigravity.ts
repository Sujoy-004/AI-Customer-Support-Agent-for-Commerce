/**
 * Antigravity Skills Integration Configuration
 *
 * Antigravity Skills (https://github.com/sickn33/antigravity-awesome-skills)
 * is an expert skill injection library installed under .opencode/skills/.
 * This configuration file registers and manages which skills are active,
 * wired to which agents, and used in which workflows.
 *
 * Integration approach:
 * - Scans the installed skills directory and registers them with metadata.
 * - Wires skills to OpenCode agents so they're loaded as instructions.
 * - Provides runtime configuration flags to enable/disable specific skills.
 * - Documents the mapping between skills and the project workflows they
 *   power.
 *
 * Environment variables:
 *   ANTIGRAVITY_SKILLS_ENABLED=true  — Enable skill integration (default: true)
 *   ANTIGRAVITY_SKILLS_FILTER=...    — Comma-separated whitelist of skill names
 */

export interface SkillRegistration {
  /** Directory name of the skill */
  name: string
  /** Human-readable description */
  description: string
  /** Whether this skill is currently active */
  enabled: boolean
  /** Which project workflows this skill powers */
  workflows: string[]
  /** Which OpenCode agents this skill is wired to */
  agents: string[]
}

export interface AntigravityConfig {
  /** Master toggle for Antigravity Skills integration */
  enabled: boolean
  /** Filter: only include these skills (empty = all enabled skills) */
  filter: string[]
  /** Registered skills with metadata */
  skills: SkillRegistration[]
}

/**
 * All installed Antigravity Skills with their project mappings.
 *
 * Each entry maps to a skill directory under .opencode/skills/<name>/.
 * The `workflows` and `agents` fields define where each skill is active.
 */
const ALL_SKILLS: SkillRegistration[] = [
  {
    name: "agent-introspection-debugging",
    description: "Structured self-debugging for AI agent failures",
    enabled: true,
    workflows: ["agent-debugging", "session-recovery"],
    agents: ["build", "architect"],
  },
  {
    name: "agent-sort",
    description: "Build evidence-based ECC install plans",
    enabled: false,
    workflows: ["project-setup", "onboarding"],
    agents: [],
  },
  {
    name: "api-design",
    description: "REST API design patterns and standards",
    enabled: true,
    workflows: ["api-development", "service-architecture"],
    agents: ["architect", "code-reviewer"],
  },
  {
    name: "backend-patterns",
    description: "Backend architecture and server-side best practices",
    enabled: true,
    workflows: ["service-development", "api-integration"],
    agents: ["build", "code-reviewer"],
  },
  {
    name: "coding-standards",
    description: "Baseline cross-project coding conventions",
    enabled: true,
    workflows: ["all"],
    agents: ["build", "code-reviewer", "tdd-guide"],
  },
  {
    name: "documentation-lookup",
    description: "Up-to-date library docs via Context7 MCP",
    enabled: true,
    workflows: ["docs-research", "catalog-enrichment"],
    agents: ["docs-lookup", "build"],
  },
  {
    name: "e2e-testing",
    description: "Playwright E2E testing patterns and POM",
    enabled: true,
    workflows: ["e2e-testing", "quality-assurance"],
    agents: ["e2e-runner", "tdd-guide"],
  },
  {
    name: "frontend-patterns",
    description: "Frontend patterns for React and Next.js",
    enabled: true,
    workflows: ["ui-development", "component-design"],
    agents: ["build", "code-reviewer"],
  },
  {
    name: "mcp-server-patterns",
    description: "Build MCP servers with Node/TypeScript SDK",
    enabled: true,
    workflows: ["mcp-development", "tool-integration"],
    agents: ["architect", "build"],
  },
  {
    name: "security-review",
    description: "Security patterns for auth, secrets, input handling",
    enabled: true,
    workflows: ["security-audit", "code-review"],
    agents: ["security-reviewer", "code-reviewer"],
  },
  {
    name: "strategic-compact",
    description: "Manual context compaction strategies",
    enabled: true,
    workflows: ["context-management"],
    agents: ["build"],
  },
  {
    name: "tdd-workflow",
    description: "Test-driven development with 80%+ coverage",
    enabled: true,
    workflows: ["test-development", "feature-implementation"],
    agents: ["tdd-guide", "build"],
  },
  {
    name: "verification-loop",
    description: "Comprehensive verification system",
    enabled: true,
    workflows: ["quality-assurance", "uat-testing"],
    agents: ["build", "tdd-guide"],
  },
  {
    name: "mle-workflow",
    description: "Production ML engineering workflow",
    enabled: false,
    workflows: ["ml-development"],
    agents: [],
  },
  {
    name: "deep-research",
    description: "Multi-source research with firecrawl and exa",
    enabled: true,
    workflows: ["market-research", "competitor-analysis"],
    agents: ["planner", "architect"],
  },
  {
    name: "content-engine",
    description: "Platform-native content creation system",
    enabled: false,
    workflows: ["content-creation"],
    agents: [],
  },
  {
    name: "brand-voice",
    description: "Source-derived writing style profiles",
    enabled: false,
    workflows: ["content-creation"],
    agents: [],
  },
  {
    name: "bun-runtime",
    description: "Bun as runtime and package manager",
    enabled: false,
    workflows: ["runtime-config"],
    agents: [],
  },
  {
    name: "article-writing",
    description: "Long-form content and blog post writing",
    enabled: false,
    workflows: ["content-creation"],
    agents: [],
  },
  {
    name: "crosspost",
    description: "Multi-platform content distribution",
    enabled: false,
    workflows: ["content-distribution"],
    agents: [],
  },
  {
    name: "eval-harness",
    description: "Formal evaluation framework for AI sessions",
    enabled: true,
    workflows: ["evaluation", "quality-assurance"],
    agents: ["build"],
  },
  {
    name: "exa-search",
    description: "Neural search via Exa MCP",
    enabled: true,
    workflows: ["market-research", "product-research"],
    agents: ["planner", "build"],
  },
  {
    name: "frontend-slides",
    description: "Animation-rich HTML presentations",
    enabled: false,
    workflows: ["presentation"],
    agents: [],
  },
  {
    name: "investor-materials",
    description: "Pitch decks and investor documents",
    enabled: false,
    workflows: ["fundraising"],
    agents: [],
  },
  {
    name: "investor-outreach",
    description: "Cold emails and investor communications",
    enabled: false,
    workflows: ["fundraising"],
    agents: [],
  },
  {
    name: "market-research",
    description: "Market sizing and competitive analysis",
    enabled: true,
    workflows: ["market-research", "planning"],
    agents: ["planner", "architect"],
  },
  {
    name: "nextjs-turbopack",
    description: "Next.js 16+ and Turbopack bundling",
    enabled: false,
    workflows: ["frontend-development"],
    agents: [],
  },
  {
    name: "product-capability",
    description: "PRD-to-SRS implementation capability planning",
    enabled: true,
    workflows: ["planning", "specification"],
    agents: ["planner", "architect"],
  },
  {
    name: "video-editing",
    description: "AI-assisted video editing workflows",
    enabled: false,
    workflows: ["video-production"],
    agents: [],
  },
  {
    name: "x-api",
    description: "X/Twitter API integration",
    enabled: false,
    workflows: ["social-media"],
    agents: [],
  },
  {
    name: "dmux-workflows",
    description: "Multi-agent orchestration with tmux",
    enabled: true,
    workflows: ["parallel-execution", "multi-agent"],
    agents: ["build", "planner"],
  },
  {
    name: "fal-ai-media",
    description: "Unified media generation via fal.ai",
    enabled: false,
    workflows: ["media-generation"],
    agents: [],
  },
  {
    name: "everything-claude-code",
    description: "ECC development conventions and patterns",
    enabled: true,
    workflows: ["plugin-development"],
    agents: ["build", "architect"],
  },
]

/**
 * Build the effective Antigravity configuration.
 * Applies env-var overrides and filter rules.
 */
export function getAntigravityConfig(): AntigravityConfig {
  const masterEnabled = process.env.ANTIGRAVITY_SKILLS_ENABLED !== "false"
  const filterRaw = process.env.ANTIGRAVITY_SKILLS_FILTER || ""
  const filter = filterRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  let skills = ALL_SKILLS

  // Apply master toggle
  if (!masterEnabled) {
    skills = skills.map((s) => ({ ...s, enabled: false }))
    return { enabled: false, filter, skills }
  }

  // Apply filter
  if (filter.length > 0) {
    skills = skills.map((s) => ({
      ...s,
      enabled: s.enabled && filter.includes(s.name),
    }))
  }

  return { enabled: true, filter, skills }
}

/**
 * Get only the currently enabled skills.
 */
export function getActiveSkills(): SkillRegistration[] {
  return getAntigravityConfig().skills.filter((s) => s.enabled)
}

/**
 * Get instructions paths for all enabled skills, suitable for
 * injection into opencode.json's instructions array.
 */
export function getSkillInstructionPaths(): string[] {
  return getActiveSkills().map((s) => `skills/${s.name}/SKILL.md`)
}

/**
 * Get the workflow-to-skill mapping for documentation and debugging.
 */
export function getWorkflowSkillMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const skill of ALL_SKILLS) {
    if (!skill.enabled) continue
    for (const wf of skill.workflows) {
      if (!map[wf]) map[wf] = []
      map[wf].push(skill.name)
    }
  }
  return map
}

export default {
  getAntigravityConfig,
  getActiveSkills,
  getSkillInstructionPaths,
  getWorkflowSkillMap,
}
