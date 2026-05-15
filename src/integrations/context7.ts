/**
 * Context7 Runtime Integration
 *
 * Application-side adapter that wires Context7 documentation lookup
 * into the catalog service for response enrichment.
 *
 * When a product query is received, Context7 can augment the response
 * with relevant documentation (e.g., sizing guides, material specs)
 * from linked documentation sources.
 *
 * Environment variables:
 *   CONTEXT7_ENABLED=true  — Enable Context7 enrichment
 *   CONTEXT7_API_KEY=...   — API key for Context7 service
 *
 * Graceful degradation: returns empty results when not configured,
 * so callers never need to check availability explicitly.
 */

import type { Product } from "../services/types.js";

export interface Context7Enrichment {
  /** Documentation snippets relevant to the query */
  snippets: string[]
  /** Source identifiers for attribution */
  sources: string[]
  /** Whether enrichment was actually applied */
  enriched: boolean
}

export interface Context7RuntimeConfig {
  enabled: boolean
  apiKey?: string
}

/**
 * Safe env-var accessor that works in Node 18+ and browser environments.
 * Avoids direct `process.env` reference to keep the tsconfig clean
 * (the project uses `"lib": ["ES2022"]` without `@types/node`).
 */
function getEnv(): Record<string, string | undefined> {
  if (typeof process !== "undefined") {
    const p = process as { env?: Record<string, string | undefined> }
    return p.env ?? {}
  }
  return {}
}

export function getContext7RuntimeConfig(): Context7RuntimeConfig {
  const env = getEnv()
  return {
    enabled: env.CONTEXT7_ENABLED === "true",
    apiKey: env.CONTEXT7_API_KEY,
  }
}

/**
 * Safe fetch wrapper for environments where `fetch` is available
 * (Node 18+, modern browsers, jsdom). Falls back gracefully if unavailable.
 */
async function safeFetch(url: string, init?: Record<string, unknown>): Promise<Response | null> {
  if (typeof globalThis.fetch !== "function") return null
  try {
    return await globalThis.fetch(url, init as RequestInit)
  } catch {
    return null
  }
}

/**
 * Enrich a product response with Context7 documentation.
 *
 * Looks up relevant documentation based on the product type/name
 * and appends useful context to the response.
 */
export async function enrichWithContext7(
  product: Product,
  _query: string
): Promise<Context7Enrichment> {
  const config = getContext7RuntimeConfig()
  if (!config.enabled) {
    return { snippets: [], sources: [], enriched: false }
  }

  const response = await safeFetch(
    `https://api.context7.dev/api/docs?topic=${encodeURIComponent(
      `${product.title} ${product.type}`
    )}`,
    config.apiKey
      ? { headers: { Authorization: `Bearer ${config.apiKey}` } }
      : undefined
  )

  if (!response || !response.ok) {
    return { snippets: [], sources: [], enriched: false }
  }

  const data = (await response.json()) as Array<{
    content: string
    sourceUrl?: string
  }>

  return {
    snippets: data.map((d) => d.content),
    sources: data.map((d) => d.sourceUrl ?? "").filter(Boolean),
    enriched: data.length > 0,
  }
}
