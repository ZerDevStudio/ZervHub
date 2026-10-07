/**
 * ZenDev Enterprise SaaS — Cloud Sync & Multi-Workspace Architecture
 * Zero-Knowledge End-to-End Encrypted (E2EE) Sync Types
 * Compliance: .agents/rules/zendev-saas-directive.md (Principles 1, 3, 5)
 */

export type SyncDataType =
  | 'api_collections'
  | 'environments'
  | 'regex_rules'
  | 'cron_jobs'
  | 'snippets'
  | 'settings'

export interface Workspace {
  id: string
  name: string
  slug: string
  color: string
  description?: string
  createdAt: number
  updatedAt: number
  isDefault?: boolean
}

export interface SyncPayload {
  version: 1
  workspaceId: string
  timestamp: number
  clientFingerprint: string
  collectionsCount: number
  environmentsCount: number
  snippetsCount: number
  data: {
    api_collections?: any[]
    environments?: any[]
    regex_rules?: any[]
    cron_jobs?: any[]
    snippets?: any[]
    settings?: Record<string, any>
  }
}

export interface EncryptedSyncEnvelope {
  version: 1
  workspaceId: string
  revision: number
  timestamp: number
  cipher: 'AES-256-GCM'
  kdf: 'PBKDF2-SHA256'
  iterations: number
  salt: string // Base64
  iv: string // Base64
  ciphertext: string // Base64
  tag: string // Base64 (or included in ciphertext in WebCrypto)
  clientFingerprint: string
  payloadChecksum?: string
}

export type SyncStatus =
  | 'locked'     // Master passphrase not entered
  | 'synced'     // Up to date with remote/local vault
  | 'syncing'    // Push/pull in progress
  | 'offline'    // Network unavailable or local-vault mode
  | 'conflict'   // Concurrent revisions detected
  | 'error'      // Network or decryption error

export type SyncProvider = 'zendev_cloud' | 'self_hosted' | 'local_only'

export interface SyncProviderConfig {
  provider: SyncProvider
  endpointUrl?: string
  authToken?: string
  autoSync: boolean
  syncIntervalSeconds: number
}

export interface SyncLogEntry {
  id: string
  timestamp: number
  type: 'push' | 'pull' | 'lock' | 'unlock' | 'conflict' | 'error'
  status: 'success' | 'failed' | 'info'
  message: string
  details?: string
}
