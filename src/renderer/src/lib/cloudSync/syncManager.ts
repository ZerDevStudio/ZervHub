/**
 * ZenDev Sync & Workspace Manager
 * Local-First, Zero-Knowledge Cross-Device Synchronization Engine
 * Compliance: .agents/rules/zendev-saas-directive.md (Principles 3 & 4)
 */

import {
  Workspace,
  SyncPayload,
  EncryptedSyncEnvelope,
  SyncStatus,
  SyncProviderConfig,
  SyncLogEntry
} from './types'
import {
  encryptSyncPayload,
  decryptSyncPayload,
  computeSha256
} from './cryptoE2EE'
import { logActivity } from '../activityLogger'

const STORAGE_KEYS = {
  WORKSPACES: 'zendev_workspaces',
  ACTIVE_WORKSPACE_ID: 'zendev_active_workspace_id',
  SYNC_CONFIG: 'zendev_sync_provider_config',
  VAULT_ENVELOPE: 'zendev_sync_vault_envelope',
  LAST_SYNCED: 'zendev_sync_last_synced_at',
  SYNC_LOGS: 'zendev_sync_activity_logs',
  REVISION: 'zendev_sync_revision'
}

const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'ws_default_personal',
    name: 'Kişisel Çalışma Alanı (Personal)',
    slug: 'personal',
    color: '#06b6d4',
    description: 'Bireysel API testleri, yerel regex kütüphaneleri ve özel snippet koleksiyonu.',
    createdAt: 1774000000000,
    updatedAt: 1774000000000,
    isDefault: true
  },
  {
    id: 'ws_team_staging',
    name: 'Microservices & API Team',
    slug: 'team-staging',
    color: '#8b5cf6',
    description: 'Ekipler arası paylaşılan REST/gRPC ortam değişkenleri ve API test koleksiyonları.',
    createdAt: 1774000000000,
    updatedAt: 1774000000000
  }
]

const DEFAULT_CONFIG: SyncProviderConfig = {
  provider: 'local_only',
  endpointUrl: 'https://sync.zendev.dev/api/v1/vault',
  authToken: '',
  autoSync: true,
  syncIntervalSeconds: 60
}

class SyncManager {
  private activePassphrase: string | null = null
  private status: SyncStatus = 'locked'
  private autoSyncTimer: any = null

  constructor() {
    this.initStatus()
  }

  private initStatus() {
    const envelope = this.getStoredEnvelope()
    if (!envelope) {
      // No passphrase initialized yet
      this.status = 'offline'
    } else {
      this.status = 'locked'
    }
  }

  // --- Workspaces Management ---

  public getWorkspaces(): Workspace[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.WORKSPACES)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    this.saveWorkspaces(DEFAULT_WORKSPACES)
    return DEFAULT_WORKSPACES
  }

  public saveWorkspaces(workspaces: Workspace[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(workspaces))
      this.broadcast('zendev:workspaces-updated', { workspaces })
    } catch {}
  }

  public getActiveWorkspace(): Workspace {
    const list = this.getWorkspaces()
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID)
    const found = list.find((w) => w.id === activeId)
    if (found) return found
    const def = list.find((w) => w.isDefault) || list[0]
    this.setActiveWorkspace(def.id)
    return def
  }

  public setActiveWorkspace(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID, id)
    this.broadcast('zendev:active-workspace-changed', { workspace: this.getActiveWorkspace() })
  }

  public createWorkspace(name: string, color = '#06b6d4', description?: string): Workspace {
    const list = this.getWorkspaces()
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace'

    const newWs: Workspace = {
      id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      slug,
      color,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    const updated = [...list, newWs]
    this.saveWorkspaces(updated)
    this.setActiveWorkspace(newWs.id)
    this.addLog('unlock', 'success', `Yeni çalışma alanı oluşturuldu: ${name}`)
    return newWs
  }

  // --- E2EE Vault Passphrase & Security ---

  public hasPassphraseSet(): boolean {
    return !!this.getStoredEnvelope()
  }

  public isUnlocked(): boolean {
    return this.activePassphrase !== null
  }

  public getStatus(): SyncStatus {
    return this.status
  }

  public async setMasterPassphrase(passphrase: string): Promise<void> {
    if (!passphrase || passphrase.length < 6) {
      throw new Error('Ana şifre en az 6 karakter olmalıdır.')
    }
    this.activePassphrase = passphrase
    const payload = this.gatherLocalPayload()
    const envelope = await encryptSyncPayload(payload, passphrase, 1)
    this.saveEnvelope(envelope)
    this.status = 'synced'
    this.addLog('unlock', 'success', 'E2EE Kasa parolası yapılandırıldı ve ilk şifreleme tamamlandı.')
    logActivity({
      toolId: 'cloud_sync',
      action: 'vault_passphrase_configured',
      category: 'crypto',
      status: 'success',
      details: 'E2EE Kasa parolası yapılandırıldı ve ilk şifreleme tamamlandı'
    })
    this.broadcastStatus()
  }

  public async unlockVault(passphrase: string): Promise<boolean> {
    const envelope = this.getStoredEnvelope()
    if (!envelope) {
      // Setting initial
      await this.setMasterPassphrase(passphrase)
      return true
    }

    try {
      const payload = await decryptSyncPayload(envelope, passphrase)
      this.activePassphrase = passphrase
      this.status = 'synced'
      this.applyInboundPayload(payload)
      this.addLog('unlock', 'success', 'E2EE Kasa kilidi açıldı.')
      logActivity({
        toolId: 'cloud_sync',
        action: 'vault_unlocked',
        category: 'security',
        status: 'success',
        details: 'E2EE Kasa kilidi başarıyla açıldı'
      })
      this.broadcastStatus()
      return true
    } catch (err: any) {
      this.status = 'locked'
      this.broadcastStatus()
      this.addLog('unlock', 'failed', 'Kasa kilidi açılamadı: Hatalı parola.')
      logActivity({
        toolId: 'cloud_sync',
        action: 'vault_unlock_failed',
        category: 'security',
        status: 'failure',
        details: 'E2EE Kasa kilidi açma denemesi başarısız: Hatalı parola'
      })
      throw err
    }
  }

  public lockVault(): void {
    this.activePassphrase = null
    this.status = 'locked'
    this.addLog('lock', 'info', 'E2EE Kasa kilitlendi. Bellekteki oturum anahtarları temizlendi.')
    logActivity({
      toolId: 'cloud_sync',
      action: 'vault_locked',
      category: 'security',
      status: 'info',
      details: 'E2EE Kasa kilitlendi. Oturum anahtarları bellekten temizlendi.'
    })
    this.broadcastStatus()
  }

  // --- Sync Provider Configuration ---

  public getProviderConfig(): SyncProviderConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SYNC_CONFIG)
      if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
    } catch {}
    return DEFAULT_CONFIG
  }

  public saveProviderConfig(cfg: Partial<SyncProviderConfig>): void {
    const merged = { ...this.getProviderConfig(), ...cfg }
    localStorage.setItem(STORAGE_KEYS.SYNC_CONFIG, JSON.stringify(merged))
    this.broadcast('zendev:sync-config-updated', { config: merged })
  }

  // --- Local Data Extraction & Inbound Merging ---

  public gatherLocalPayload(): SyncPayload {
    const ws = this.getActiveWorkspace()

    // 1. API Studio collections & environments
    let apiCollections: any[] = []
    let apiEnvironments: any[] = []
    try {
      const colRaw = localStorage.getItem('nexus:api_collections') || localStorage.getItem('api_collections')
      if (colRaw) apiCollections = JSON.parse(colRaw)
    } catch {}
    try {
      const envRaw = localStorage.getItem('nexus:api_environments') || localStorage.getItem('api_environments')
      if (envRaw) apiEnvironments = JSON.parse(envRaw)
    } catch {}

    // 2. Custom Regex rules
    let regexRules: any[] = []
    try {
      const regRaw = localStorage.getItem('zendev_regex_presets')
      if (regRaw) regexRules = JSON.parse(regRaw)
    } catch {}

    // 3. Scratchpad snippets
    let snippets: any[] = []
    try {
      const snipRaw = localStorage.getItem('zendev_scratchpad_history')
      if (snipRaw) snippets = JSON.parse(snipRaw)
    } catch {}

    return {
      version: 1,
      workspaceId: ws.id,
      timestamp: Date.now(),
      clientFingerprint: `zendev-win-${navigator.userAgent.slice(0, 20)}`,
      collectionsCount: apiCollections.length,
      environmentsCount: apiEnvironments.length,
      snippetsCount: snippets.length,
      data: {
        api_collections: apiCollections,
        environments: apiEnvironments,
        regex_rules: regexRules,
        snippets: snippets
      }
    }
  }

  public applyInboundPayload(payload: SyncPayload): void {
    if (!payload?.data) return

    try {
      if (Array.isArray(payload.data.api_collections) && payload.data.api_collections.length > 0) {
        localStorage.setItem('nexus:api_collections', JSON.stringify(payload.data.api_collections))
      }
      if (Array.isArray(payload.data.environments) && payload.data.environments.length > 0) {
        localStorage.setItem('nexus:api_environments', JSON.stringify(payload.data.environments))
      }
      if (Array.isArray(payload.data.regex_rules) && payload.data.regex_rules.length > 0) {
        localStorage.setItem('zendev_regex_presets', JSON.stringify(payload.data.regex_rules))
      }
      if (Array.isArray(payload.data.snippets) && payload.data.snippets.length > 0) {
        localStorage.setItem('zendev_scratchpad_history', JSON.stringify(payload.data.snippets))
      }
      this.broadcast('zendev:workspace-data-reloaded', { workspaceId: payload.workspaceId })
    } catch (err) {
      console.error('Failed to apply inbound payload:', err)
    }
  }

  // --- Sync Execution ---

  public async syncNow(): Promise<void> {
    if (!this.activePassphrase) {
      this.status = 'locked'
      this.broadcastStatus()
      throw new Error('E2EE Kasa kilitli. Lütfen önce kasanın kilidini açın.')
    }

    this.status = 'syncing'
    this.broadcastStatus()

    try {
      const cfg = this.getProviderConfig()
      const payload = this.gatherLocalPayload()
      const currentRev = this.getRevision() + 1
      const envelope = await encryptSyncPayload(payload, this.activePassphrase, currentRev)

      // 1. Save local encrypted copy
      this.saveEnvelope(envelope)
      this.setRevision(currentRev)

      // 2. If remote provider configured, push envelope
      if (cfg.provider === 'zendev_cloud' || cfg.provider === 'self_hosted') {
        if (!cfg.endpointUrl) throw new Error('Geçerli bir senkronizasyon sunucu URL adresi girilmedi.')

        const response = await fetch(cfg.endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cfg.authToken ? { Authorization: `Bearer ${cfg.authToken}` } : {})
          },
          body: JSON.stringify(envelope)
        })

        if (!response.ok) {
          throw new Error(`Senkronizasyon sunucu hatası: HTTP ${response.status}`)
        }

        const resData = await response.json().catch(() => ({}))
        // If server sent back a newer envelope, decrypt & merge
        if (resData.envelope && resData.envelope.revision > currentRev) {
          const remotePayload = await decryptSyncPayload(resData.envelope, this.activePassphrase)
          this.applyInboundPayload(remotePayload)
          this.saveEnvelope(resData.envelope)
          this.setRevision(resData.envelope.revision)
          this.addLog('pull', 'success', `Uzak sunucudan revizyon #${resData.envelope.revision} indirildi ve birleştirildi.`)
        }
      }

      const now = Date.now()
      localStorage.setItem(STORAGE_KEYS.LAST_SYNCED, String(now))
      this.status = 'synced'
      this.addLog('push', 'success', `Çalışma alanı verileri E2EE AES-256 ile başarıyla senkronize edildi (Revizyon #${currentRev}).`)
      logActivity({
        toolId: 'cloud_sync',
        action: 'vault_synced',
        category: 'crypto',
        status: 'success',
        details: `Çalışma alanı verileri E2EE AES-256 ile senkronize edildi (Revizyon #${currentRev})`,
        metadata: { revision: currentRev, provider: cfg.provider }
      })
      this.broadcastStatus()
    } catch (err: any) {
      this.status = 'error'
      this.addLog('push', 'failed', `Senkronizasyon başarısız oldu: ${err.message || err}`)
      logActivity({
        toolId: 'cloud_sync',
        action: 'vault_sync_failed',
        category: 'crypto',
        status: 'failure',
        details: `E2EE Kasa senkronizasyon hatası: ${err.message || err}`,
        metadata: { error: String(err) }
      })
      this.broadcastStatus()
      throw err
    }
  }

  // --- Export / Import Encrypted Vault File ---

  public async exportEncryptedVaultFile(): Promise<Blob> {
    const envelope = this.getStoredEnvelope()
    if (!envelope) {
      if (!this.activePassphrase) throw new Error('Dışa aktarmak için önce kasa kilidini açın.')
      const payload = this.gatherLocalPayload()
      const newEnvelope = await encryptSyncPayload(payload, this.activePassphrase, 1)
      this.saveEnvelope(newEnvelope)
      return new Blob([JSON.stringify(newEnvelope, null, 2)], { type: 'application/json' })
    }
    return new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
  }

  public async importEncryptedVaultFile(jsonString: string, passphrase: string): Promise<SyncPayload> {
    const envelope = JSON.parse(jsonString) as EncryptedSyncEnvelope
    if (!envelope.ciphertext || !envelope.salt || !envelope.iv) {
      throw new Error('Geçersiz ZenDev şifreli kasa dosyası.')
    }
    const payload = await decryptSyncPayload(envelope, passphrase)
    this.activePassphrase = passphrase
    this.saveEnvelope(envelope)
    this.applyInboundPayload(payload)
    this.status = 'synced'
    this.addLog('pull', 'success', 'Şifreli kasa dosyası içeri aktarıldı ve çalışma alanına uygulandı.')
    this.broadcastStatus()
    return payload
  }

  // --- Storage & Activity Logging Helpers ---

  public getLastSyncedAt(): number | null {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_SYNCED)
    return raw ? parseInt(raw, 10) : null
  }

  public getRevision(): number {
    const raw = localStorage.getItem(STORAGE_KEYS.REVISION)
    return raw ? parseInt(raw, 10) : 0
  }

  private setRevision(rev: number): void {
    localStorage.setItem(STORAGE_KEYS.REVISION, String(rev))
  }

  public getStoredEnvelope(): EncryptedSyncEnvelope | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VAULT_ENVELOPE)
      if (raw) return JSON.parse(raw)
    } catch {}
    return null
  }

  private saveEnvelope(envelope: EncryptedSyncEnvelope): void {
    localStorage.setItem(STORAGE_KEYS.VAULT_ENVELOPE, JSON.stringify(envelope))
  }

  public getLogs(): SyncLogEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SYNC_LOGS)
      if (raw) return JSON.parse(raw)
    } catch {}
    return []
  }

  private addLog(type: SyncLogEntry['type'], status: SyncLogEntry['status'], message: string): void {
    const logs = this.getLogs()
    const newEntry: SyncLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      type,
      status,
      message
    }
    const updated = [newEntry, ...logs.slice(0, 19)]
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(updated))
    } catch {}
  }

  private broadcast(eventName: string, detail: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }))
    }
  }

  private broadcastStatus() {
    this.broadcast('zendev:sync-status-changed', {
      status: this.status,
      workspace: this.getActiveWorkspace(),
      lastSyncedAt: this.getLastSyncedAt()
    })
  }
}

export const syncManager = new SyncManager()
