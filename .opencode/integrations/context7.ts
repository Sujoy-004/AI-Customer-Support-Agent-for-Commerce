/**
 * Context7 Integration Adapter
 *
 * Context7 (https://github.com/upstash/context7) provides latent context
 * management and documentation lookup via MCP (Model Context Protocol).
 * This adapter wraps the Context7 MCP for use within the OpenCode plugin
 * system and the application's catalog/policy services.
 *
 * Integration approach:
 * - Wraps Context7's MCP tools (resolve-library-id and query-docs) as
 *   typed async methods.
 * - When not configured, all methods return empty results gracefully.
 * - Can be used standalone or wired into catalog enrichment flows.
 *
 * Environment variables:
 *   CONTEXT7_ENABLED=true           — Enable Context7 integration
 *   CONTEXT7_API_KEY=...            — API key for Context7 service
 *   CONTEXT7_ENDPOINT=...           — Custom endpoint (default: https://api.context7.dev)
 *
 * The documentation-lookup skill at .opencode/skills/documentation-lookup/
 * provides detailed workflows for using Context7 MCP tools.
 */

export interface Context7Config {
  /** Whether Context7 integration is enabled */
  enabled: boolean
  /** API key for the Context7 service */
  apiKey?: string
  /** Custom endpoint URL */
  endpoint?: string
}

export interface DocResult {
  /** The library identifier (e.g., "/facebook/react") */
  libraryId: string
  /** Matched documentation content */
  content: string
  /** Source URL for the documentation */
  sourceUrl?: string
  /** Relevance score if available */
  relevance?: number
}

export interface LibraryResolution {
  /** The resolved library ID compatible with Context7 */
  libraryId: string
  /** Display name of the library */
  name: string
}

const DEFAULT_ENDPOINT = "https://api.context7.dev"

/**
 * Parse Context7 configuration from environment variables.
 */
export function getContext7Config(): Context7Config {
  return {
    enabled: process.env.CONTEXT7_ENABLED === "true",
    apiKey: process.env.CONTEXT7_API_KEY,
    endpoint: process.env.CONTEXT7_ENDPOINT || DEFAULT_ENDPOINT,
  }
}

/**
 * Context7Client wraps the Context7 MCP API for documentation lookup.
 *
 * Usage:
 *   const client = new Context7Client(getContext7Config())
 *   const library = await client.resolveLibrary("react", "useEffect")
 *   const docs = await client.lookupDocs("/facebook/react", "useEffect hook")
 */
export class Context7Client {
  private config: Context7Config

  constructor(config?: Partial<Context7Config>) {
    this.config = { ...getContext7Config(), ...config }
  }

  /**
   * Check whether Context7 is available.
   */
  get isAvailable(): boolean {
    return this.config.enabled && !!this.config.apiKey
  }

  /**
   * Resolve a library name to a Context7-compatible library ID.
   * Falls back to a best-guess ID if the API is unavailable.
   */
  async resolveLibrary(
    libraryName: string,
    query?: string
  ): Promise<LibraryResolution | null> {
    if (!this.isAvailable) {
      return null
    }

    try {
      const response = await fetch(
        `${this.config.endpoint}/api/resolve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.config.apiKey
              ? { Authorization: `Bearer ${this.config.apiKey}` }
              : {}),
          },
          body: JSON.stringify({ library: libraryName, query }),
        }
      )

      if (!response.ok) return null

      const data = (await response.json()) as LibraryResolution
      return data
    } catch {
      return null
    }
  }

  /**
   * Look up documentation for a given topic from a resolved library.
   * The libraryId should come from resolveLibrary().
   *
   * Graceful degradation: returns empty array on any failure so callers
   * don't need to handle errors.
   */
  async lookupDocs(topic: string, libraryId?: string): Promise<DocResult[]> {
    if (!this.isAvailable) {
      return []
    }

    try {
      const url = libraryId
        ? `${this.config.endpoint}/api/docs?library=${encodeURIComponent(libraryId)}&topic=${encodeURIComponent(topic)}`
        : `${this.config.endpoint}/api/docs?topic=${encodeURIComponent(topic)}`

      const response = await fetch(url, {
        headers: {
          ...(this.config.apiKey
            ? { Authorization: `Bearer ${this.config.apiKey}` }
            : {}),
        },
      })

      if (!response.ok) return []

      const data = (await response.json()) as DocResult[]
      return data
    } catch {
      return []
    }
  }

  /**
   * Convenience: resolve a library then immediately look up docs.
   */
  async resolveAndLookup(
    libraryName: string,
    topic: string
  ): Promise<{ library: LibraryResolution | null; docs: DocResult[] }> {
    const library = await this.resolveLibrary(libraryName, topic)
    const docs = library
      ? await this.lookupDocs(topic, library.libraryId)
      : []
    return { library, docs }
  }
}

export default Context7Client
