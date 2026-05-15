/**
 * Superpowers Runtime Integration
 *
 * Application-side adapter for the Superpowers response enhancement
 * pipeline. This is the consumer side of the OpenCode plugin adapter
 * at .opencode/integrations/superpowers.ts.
 *
 * When SUPERPOERS_ENABLED is set, the agent response pipeline will
 * pass through Superpowers for context-aware enhancement before
 * returning to the user.
 *
 * Falls through gracefully when not configured.
 */

export interface SuperpowersRuntimeConfig {
  enabled: boolean
  endpoint?: string
}

export function getSuperpowersRuntimeConfig(): SuperpowersRuntimeConfig {
  const env: Record<string, string | undefined> =
    typeof process !== "undefined"
      ? (process as { env: Record<string, string | undefined> }).env
      : {}
  return {
    enabled: env.SUPERPOERS_ENABLED === "true",
    endpoint: env.SUPERPOERS_ENDPOINT || "http://localhost:9876",
  }
}

/**
 * Runtime check: is Superpowers available for this session?
 */
export function isSuperpowersAvailable(): boolean {
  const cfg = getSuperpowersRuntimeConfig()
  return cfg.enabled
}
