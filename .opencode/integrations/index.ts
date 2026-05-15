/**
 * Mandatory Tool Integrations Index
 *
 * This module exports all three mandatory tool integrations required
 * by the Kasparro Agentic Commerce Hackathon (Track 4):
 *
 * 1. Superpowers — Subagent orchestration and response enhancement
 * 2. Context7 — MCP-based documentation lookup
 * 3. Antigravity Skills — Expert skill injection library
 *
 * All integrations follow a consistent pattern:
 * - Config parsed from environment variables with sensible defaults
 * - Graceful degradation when not configured
 * - Typed interfaces for all public APIs
 *
 * Usage:
 *   import { superpowers, context7, antigravity } from "./integrations/index.js"
 *   const spClient = new superpowers.SuperpowersClient()
 *   const ctxClient = new context7.Context7Client()
 *   const skills = antigravity.getActiveSkills()
 */

export * as superpowers from "./superpowers.js"
export * as context7 from "./context7.js"
export * as antigravity from "./antigravity.js"

// Convenience re-exports for direct imports
export { SuperpowersClient, getSuperpowersConfig } from "./superpowers.js"
export { Context7Client, getContext7Config } from "./context7.js"
export { getAntigravityConfig, getActiveSkills, getSkillInstructionPaths } from "./antigravity.js"
