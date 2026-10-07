/**
 * ZenDev Enterprise SaaS — Shareable Team Collections Architecture & Types
 * Cross-studio version-controlled shared team collections:
 * API endpoints, Regex rulesets, Cron job schedules, and Mermaid architecture diagrams.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 4: Diferansiyasyon & B2B Moat)
 */

export type CollectionCategory = 'api' | 'regex' | 'cron' | 'mermaid'

export type CollectionVisibility = 'team' | 'public' | 'private'

export interface ApiItemPayload {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers: Record<string, string>
  body?: string
  queryParams?: Record<string, string>
  tests?: string[]
}

export interface RegexItemPayload {
  pattern: string
  flags: string
  description: string
  testStrings: string[]
  expectedMatches?: string[]
}

export interface CronItemPayload {
  expression: string
  humanReadable: string
  timezone: string
  description: string
  targetService?: string
}

export interface MermaidItemPayload {
  diagramType: 'sequence' | 'flowchart' | 'class' | 'state' | 'er'
  chartDefinition: string
  description: string
}

export type CollectionItemPayload =
  | ApiItemPayload
  | RegexItemPayload
  | CronItemPayload
  | MermaidItemPayload
  | Record<string, any>

export interface TeamCollectionItem {
  id: string
  name: string
  description: string
  category: CollectionCategory
  tags: string[]
  payload: CollectionItemPayload
  createdAt: number
  updatedAt: number
}

export interface GitSyncMetadata {
  remoteRepo?: string
  branch?: string
  lastCommitHash?: string
  lastSyncedAt?: number
}

export interface TeamCollection {
  id: string
  name: string
  slug: string
  description: string
  category: CollectionCategory
  version: string // Semver e.g. "1.0.0"
  author: {
    id: string
    name: string
    email: string
  }
  organizationId: string
  visibility: CollectionVisibility
  tags: string[]
  items: TeamCollectionItem[]
  gitSync?: GitSyncMetadata
  createdAt: number
  updatedAt: number
}

export interface CollectionExportEnvelope {
  schemaVersion: '1.0.0'
  exportedAt: number
  exportedBy: string
  checksum: string // SHA-256 of the collection JSON
  collection: TeamCollection
}
