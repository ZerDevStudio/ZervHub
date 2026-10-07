/**
 * ZenDev Enterprise SaaS — Workflow Chains Architecture & Types
 * Visual & Scriptable multi-studio pipeline engine.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 4: Diferansiyasyon & B2B Moat)
 */

export type StepType =
  | 'HTTP_REQUEST'
  | 'JSON_EXTRACT'
  | 'TRANSFORM'
  | 'CRYPTO_SIGN'
  | 'WEBHOOK_DISPATCH'
  | 'DELAY'
  | 'ASSERT'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export type TransformType =
  | 'base64_encode'
  | 'base64_decode'
  | 'hex_encode'
  | 'hex_decode'
  | 'url_encode'
  | 'url_decode'
  | 'upper_case'
  | 'lower_case'
  | 'json_stringify'
  | 'json_parse'

export type CryptoAlgorithm = 'hmac_sha256' | 'hmac_sha512' | 'sha256' | 'sha512' | 'md5'

export interface HttpRequestConfig {
  method: HttpMethod
  url: string
  headers: Record<string, string>
  bodyType: 'json' | 'text' | 'none'
  body?: string
  authType: 'none' | 'bearer' | 'basic'
  authToken?: string
}

export interface JsonExtractConfig {
  path: string // e.g. "data.access_token" or "items[0].id"
  fallback?: string
}

export interface TransformConfig {
  transform: TransformType
}

export interface CryptoSignConfig {
  algorithm: CryptoAlgorithm
  secretKey?: string // Required for HMAC
  outputFormat: 'hex' | 'base64'
}

export interface WebhookDispatchConfig {
  url: string
  signatureHeader?: string // e.g. "X-Hub-Signature-256"
  signaturePrefix?: string // e.g. "sha256="
  headers?: Record<string, string>
}

export interface DelayConfig {
  delayMs: number
}

export interface AssertConfig {
  expectedField: string
  operator: 'equals' | 'contains' | 'exists' | 'greater_than'
  expectedValue: string
}

export interface ChainStep {
  id: string
  name: string
  type: StepType
  enabled: boolean
  config:
    | HttpRequestConfig
    | JsonExtractConfig
    | TransformConfig
    | CryptoSignConfig
    | WebhookDispatchConfig
    | DelayConfig
    | AssertConfig
    | Record<string, any>
}

export interface WorkflowChain {
  id: string
  name: string
  description: string
  category: 'api' | 'security' | 'webhook' | 'custom'
  isTemplate?: boolean
  variables: Record<string, string>
  steps: ChainStep[]
  createdAt: number
  updatedAt: number
}

export interface StepExecutionResult {
  stepId: string
  stepName: string
  stepType: StepType
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  durationMs: number
  input: any
  output: any
  error?: string
}

export interface ChainExecutionReport {
  chainId: string
  chainName: string
  startedAt: number
  finishedAt: number
  totalDurationMs: number
  status: 'success' | 'failed'
  stepResults: StepExecutionResult[]
  finalOutput?: any
}
