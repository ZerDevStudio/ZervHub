/**
 * ZenDev Enterprise SaaS — AI Smart Dispatcher & Heuristic Classifier Architecture
 * Privacy-first contextual payload analyzer: detects cURL, JWT, valid/malformed JSON,
 * SQL queries, stacktraces, and Base64/Hex hashes with remediation actions.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 4: Diferansiyasyon & B2B Moat)
 */

export type DispatchedPayloadType =
  | 'curl'
  | 'jwt'
  | 'json'
  | 'malformed_json'
  | 'sql'
  | 'stacktrace'
  | 'base64_hex'
  | 'color'
  | 'math'

export interface CurlDispatchedPayload {
  type: 'curl'
  raw: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers: Record<string, string>
  body?: string
  targetRoute: '/api-studio'
  summary: string
}

export interface JwtDispatchedPayload {
  type: 'jwt'
  raw: string
  header: Record<string, any>
  payload: Record<string, any>
  signature: string
  algorithm: string
  subject?: string
  issuer?: string
  expiresAt?: string
  isExpired?: boolean
  targetRoute: '/jwt-studio'
}

export interface JsonDispatchedPayload {
  type: 'json'
  raw: string
  formatted: string
  minified: string
  byteSize: number
  itemCount: number
  isObject: boolean
  isArray: boolean
  targetRoute: '/json-studio'
}

export interface MalformedJsonDispatchedPayload {
  type: 'malformed_json'
  raw: string
  errorSnippet: string
  errorLine?: number
  repairedText?: string
  canAutoRepair: boolean
  repairReason?: string
  targetRoute: '/json-studio'
}

export interface SqlDispatchedPayload {
  type: 'sql'
  raw: string
  statementType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'ALTER' | 'DROP' | 'OTHER'
  tables: string[]
  formatted: string
  targetRoute?: string
}

export interface StacktraceDispatchedPayload {
  type: 'stacktrace'
  raw: string
  errorName: string
  errorMessage: string
  culpritFile?: string
  culpritLine?: number
  sanitized: string
  targetRoute?: string
}

export interface Base64HexDispatchedPayload {
  type: 'base64_hex'
  raw: string
  format: 'base64' | 'hex' | 'sha256' | 'md5'
  decodedPreview?: string
  targetRoute: '/encoding-studio' | '/hash-studio'
}

export interface ColorDispatchedPayload {
  type: 'color'
  raw: string
  hex: string
  rgb: string
  hsl: string
  hasAlpha: boolean
  previewColor: string
  targetRoute?: '/color-studio'
}

export interface MathDispatchedPayload {
  type: 'math'
  raw: string
  expression: string
  result: string
  detail?: string
  isUnitConversion?: boolean
}

export type DispatchedPayload =
  | CurlDispatchedPayload
  | JwtDispatchedPayload
  | JsonDispatchedPayload
  | MalformedJsonDispatchedPayload
  | SqlDispatchedPayload
  | StacktraceDispatchedPayload
  | Base64HexDispatchedPayload
  | ColorDispatchedPayload
  | MathDispatchedPayload
