/**
 * Superpowers Integration Adapter
 *
 * Superpowers (https://github.com/obra/superpowers) is a subagent
 * orchestration and capability framework from the Antigravity Skills
 * ecosystem. This adapter provides a typed interface for hooking into
 * Superpowers from within the OpenCode plugin system.
 *
 * Integration approach:
 * - Superpowers acts as an enhanced response pipeline that can wrap
 *   existing agent responses with additional context and capabilities.
 * - When SUPERPOERS_ENABLED is set and a Superpowers endpoint is
 *   configured, the adapter delegates response enhancement to it.
 * - Falls through to the original response if Superpowers is not
 *   configured, making the integration safe to deploy regardless of
 *   runtime environment.
 *
 * Environment variables:
 *   SUPERPOERS_ENABLED=true         — Enable Superpowers integration
 *   SUPERPOERS_ENDPOINT=...         — Optional custom endpoint URL
 *   SUPERPOERS_API_KEY=...          — Optional API key for auth
 */

export interface SuperpowersConfig {
  /** Whether Superpowers integration is enabled */
  enabled: boolean
  /** Custom endpoint URL (defaults to localhost:9876) */
  endpoint?: string
  /** Optional API key for authenticated access */
  apiKey?: string
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number
}

export interface EnhancedResponseOptions {
  /** The original agent response text */
  originalResponse: string
  /** The user query that triggered this response */
  userQuery: string
  /** Optional conversation context to pass to Superpowers */
  context?: Record<string, unknown>
  /** Available tools/capabilities the agent can use */
  capabilities?: string[]
}

export interface EnhancedResponse {
  /** The final response text (enhanced or fallback) */
  text: string
  /** Whether Superpowers was actually used */
  enhanced: boolean
  /** Additional metadata from the enhancement pipeline */
  metadata?: Record<string, unknown>
}

const DEFAULT_ENDPOINT = "http://localhost:9876"
const DEFAULT_TIMEOUT = 10000

/**
 * Parse Superpowers configuration from environment variables.
 * All config is optional — the adapter degrades gracefully.
 */
export function getSuperpowersConfig(): SuperpowersConfig {
  return {
    enabled: process.env.SUPERPOERS_ENABLED === "true",
    endpoint: process.env.SUPERPOERS_ENDPOINT || DEFAULT_ENDPOINT,
    apiKey: process.env.SUPERPOERS_API_KEY,
    timeout: Number(process.env.SUPERPOERS_TIMEOUT) || DEFAULT_TIMEOUT,
  }
}

/**
 * SuperpowersClient wraps the Superpowers API for response enhancement.
 *
 * Usage:
 *   const client = new SuperpowersClient(getSuperpowersConfig())
 *   const result = await client.getEnhancedResponse({
 *     originalResponse: "Your order has shipped.",
 *     userQuery: "Where is my order?",
 *   })
 */
export class SuperpowersClient {
  private config: SuperpowersConfig

  constructor(config?: Partial<SuperpowersConfig>) {
    this.config = { ...getSuperpowersConfig(), ...config }
  }

  /**
   * Check whether Superpowers is available and configured.
   * Returns true only when explicitly enabled via env or config.
   */
  get isAvailable(): boolean {
    return this.config.enabled
  }

  /**
   * Get an enhanced response by passing through Superpowers.
   * Falls through to the original response if Superpowers is not
   * configured or if the enhancement request fails.
   */
  async getEnhancedResponse(options: EnhancedResponseOptions): Promise<EnhancedResponse> {
    if (!this.config.enabled) {
      return {
        text: options.originalResponse,
        enhanced: false,
      }
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (this.config.apiKey) {
        headers["Authorization"] = `Bearer ${this.config.apiKey}`
      }

      const response = await fetch(`${this.config.endpoint}/api/enhance`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          response: options.originalResponse,
          query: options.userQuery,
          context: options.context ?? {},
          capabilities: options.capabilities ?? [],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(
          `[Superpowers] HTTP ${response.status} — falling through to original response`
        )
        return { text: options.originalResponse, enhanced: false }
      }

      const data = (await response.json()) as { text?: string; metadata?: Record<string, unknown> }

      return {
        text: data.text ?? options.originalResponse,
        enhanced: true,
        metadata: data.metadata,
      }
    } catch (error) {
      console.warn(
        `[Superpowers] Connection failed (${(error as Error).message}) — falling through to original response`
      )
      return {
        text: options.originalResponse,
        enhanced: false,
      }
    }
  }
}

export default SuperpowersClient
