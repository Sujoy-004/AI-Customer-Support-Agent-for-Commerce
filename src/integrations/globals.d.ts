/**
 * Minimal ambient declarations for runtime globals used by integration
 * adapters. The project tsconfig uses `"lib": ["ES2022"]` without `@types/node`,
 * so these globals aren't available at compile time — but they ARE available
 * at runtime in Node 18+.
 *
 * These declare what the runtime provides:
 * - `process.env` — Node.js environment variables
 * - `fetch` / `Response` / `RequestInit` — Web API (available in Node 18+, jsdom)
 */

declare const process: {
  env: Record<string, string | undefined>
}

interface RequestInit {
  method?: string
  headers?: Record<string, string> | Headers
  body?: string
  signal?: AbortSignal
}

declare function fetch(
  input: Request | URL | string,
  init?: RequestInit
): Promise<Response>

declare class Response {
  constructor(body?: string | null, init?: ResponseInit)
  get ok(): boolean
  get status(): number
  json(): Promise<unknown>
  text(): Promise<string>
}

interface ResponseInit {
  status?: number
  statusText?: string
  headers?: Record<string, string>
}
