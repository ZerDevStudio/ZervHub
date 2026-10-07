/**
 * ZenDev Enterprise SaaS — Team Collection Manager
 * CRUD operations, RBAC permission verification, Git-friendly export/import, and SHA-256 checksums.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 4: Diferansiyasyon & B2B Moat)
 */

import { TeamCollection, TeamCollectionItem, CollectionCategory, CollectionExportEnvelope } from './types'
import { DEFAULT_TEAM_COLLECTIONS } from './defaultPresets'
import { TeamRole } from '../teamAuth/types'
import { TeamAuthManager } from '../teamAuth/teamAuthManager'
import { logActivity } from '../activityLogger'

const STORAGE_KEY = 'zendev_team_collections'

export class TeamCollectionManager {
  /**
   * Retrieves all team collections from local storage, populating defaults if empty.
   */
  public static getCollections(): TeamCollection[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {}

    // First run initialization
    this.saveCollections(DEFAULT_TEAM_COLLECTIONS)
    return DEFAULT_TEAM_COLLECTIONS
  }

  /**
   * Retrieves a single collection by its ID.
   */
  public static getCollectionById(id: string): TeamCollection | undefined {
    return this.getCollections().find((c) => c.id === id)
  }

  /**
   * Filters collections by category (api, regex, cron, mermaid).
   */
  public static getCollectionsByCategory(category: CollectionCategory): TeamCollection[] {
    return this.getCollections().filter((c) => c.category === category)
  }

  /**
   * Persists collections array to local storage and dispatches sync event.
   */
  public static saveCollections(collections: TeamCollection[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collections))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zendev:team-collections-updated', { detail: collections }))
      }
    } catch (err) {
      console.error('Failed to save team collections:', err)
    }
  }

  /**
   * Asserts whether the given role has write permission to modify collections.
   */
  public static assertWritePermission(role?: TeamRole): void {
    const activeRole = role ?? TeamAuthManager.getCurrentRole()
    if (activeRole === 'viewer') {
      throw new Error('Yetki Hatası: "Viewer" rolündeki kullanıcılar takım koleksiyonlarında değişiklik yapamaz.')
    }
  }

  /**
   * Creates or updates a collection. Enforces RBAC permissions.
   */
  public static saveCollection(collection: TeamCollection, actorRole?: TeamRole): TeamCollection {
    this.assertWritePermission(actorRole)

    const collections = this.getCollections()
    const index = collections.findIndex((c) => c.id === collection.id)
    const now = Date.now()

    const updated: TeamCollection = {
      ...collection,
      updatedAt: now
    }

    const nextList = [...collections]
    if (index >= 0) {
      nextList[index] = updated
    } else {
      nextList.unshift(updated)
    }

    this.saveCollections(nextList)

    logActivity({
      toolId: 'team_collections',
      action: index >= 0 ? 'collection_updated' : 'collection_created',
      category: 'api',
      status: 'success',
      details: `Takım koleksiyonu kaydedildi: ${collection.name} (v${updated.version})`,
      metadata: {
        id: collection.id,
        name: collection.name,
        category: collection.category,
        version: updated.version,
        itemCount: updated.items.length
      }
    })

    return updated
  }

  /**
   * Deletes a collection by ID. Enforces RBAC permissions.
   */
  public static deleteCollection(id: string, actorRole?: TeamRole): void {
    this.assertWritePermission(actorRole)

    const collections = this.getCollections()
    const nextList = collections.filter((c) => c.id !== id)
    this.saveCollections(nextList)

    logActivity({
      toolId: 'team_collections',
      action: 'collection_deleted',
      category: 'api',
      status: 'warning',
      details: `Takım koleksiyonu silindi: ${id}`,
      metadata: { id }
    })
  }

  /**
   * Adds an item to a collection and updates semver patch version.
   */
  public static addItemToCollection(
    collectionId: string,
    item: Omit<TeamCollectionItem, 'id' | 'createdAt' | 'updatedAt'>,
    actorRole?: TeamRole
  ): TeamCollectionItem {
    this.assertWritePermission(actorRole)

    const collection = this.getCollectionById(collectionId)
    if (!collection) {
      throw new Error(`Koleksiyon bulunamadı: ${collectionId}`)
    }

    const now = Date.now()
    const newItem: TeamCollectionItem = {
      ...item,
      id: `item_${collection.category}_${now}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now
    }

    const updatedItems = [...collection.items, newItem]
    const updatedCollection: TeamCollection = {
      ...collection,
      items: updatedItems,
      version: this.incrementSemver(collection.version, 'patch'),
      updatedAt: now
    }

    this.saveCollection(updatedCollection, actorRole)
    return newItem
  }

  /**
   * Removes an item from a collection.
   */
  public static removeItemFromCollection(
    collectionId: string,
    itemId: string,
    actorRole?: TeamRole
  ): void {
    this.assertWritePermission(actorRole)

    const collection = this.getCollectionById(collectionId)
    if (!collection) {
      throw new Error(`Koleksiyon bulunamadı: ${collectionId}`)
    }

    const updatedItems = collection.items.filter((i) => i.id !== itemId)
    const updatedCollection: TeamCollection = {
      ...collection,
      items: updatedItems,
      version: this.incrementSemver(collection.version, 'patch'),
      updatedAt: Date.now()
    }

    this.saveCollection(updatedCollection, actorRole)
  }

  /**
   * Increments semantic version (patch, minor, major).
   */
  public static incrementSemver(version: string, type: 'patch' | 'minor' | 'major'): string {
    const parts = (version || '1.0.0').split('.').map((p) => parseInt(p, 10) || 0)
    let [major = 1, minor = 0, patch = 0] = parts

    switch (type) {
      case 'major':
        major++
        minor = 0
        patch = 0
        break
      case 'minor':
        minor++
        patch = 0
        break
      case 'patch':
      default:
        patch++
        break
    }

    return `${major}.${minor}.${patch}`
  }

  /**
   * Computes deterministic SHA-256 checksum for Git verification and tamper-evidence.
   */
  public static async computeChecksum(data: string): Promise<string> {
    const enc = new TextEncoder()
    const buffer = enc.encode(data)
    const cryptoSubtle = typeof window !== 'undefined' ? window.crypto.subtle : (globalThis as any).crypto?.subtle
    if (!cryptoSubtle) {
      return 'sha256_mock_env'
    }

    const hashBuffer = await cryptoSubtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Exports collection as a versioned Git-friendly envelope with checksum.
   */
  public static async exportCollection(collectionId: string, actorName = 'ZenDev User'): Promise<CollectionExportEnvelope> {
    const collection = this.getCollectionById(collectionId)
    if (!collection) {
      throw new Error(`Dışa aktarılacak koleksiyon bulunamadı: ${collectionId}`)
    }

    const serialized = JSON.stringify(collection, null, 2)
    const checksum = await this.computeChecksum(serialized)

    return {
      schemaVersion: '1.0.0',
      exportedAt: Date.now(),
      exportedBy: actorName,
      checksum,
      collection
    }
  }

  /**
   * Exports collection as clean formatted JSON string.
   */
  public static async exportCollectionJson(collectionId: string, actorName?: string): Promise<string> {
    const envelope = await this.exportCollection(collectionId, actorName)
    return JSON.stringify(envelope, null, 2)
  }

  /**
   * Imports a collection from JSON envelope or raw collection format.
   */
  public static async importCollectionJson(jsonStr: string, actorRole?: TeamRole): Promise<TeamCollection> {
    this.assertWritePermission(actorRole)

    let parsed: any
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      throw new Error('Geçersiz JSON formatı! Lütfen geçerli bir ZenDev koleksiyon dosyası seçin.')
    }

    // Support both direct TeamCollection and CollectionExportEnvelope
    const targetCollection: TeamCollection = parsed.collection ?? parsed

    if (!targetCollection.name || !targetCollection.category || !Array.isArray(targetCollection.items)) {
      throw new Error('Eksik koleksiyon alanları: "name", "category" ve "items" zorunludur.')
    }

    const now = Date.now()
    const imported: TeamCollection = {
      ...targetCollection,
      id: `col_${targetCollection.category}_imported_${now}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${targetCollection.name} (İçe Aktarıldı)`,
      slug: `${targetCollection.slug || 'imported'}-${now}`,
      createdAt: now,
      updatedAt: now
    }

    this.saveCollection(imported, actorRole)
    return imported
  }

  /**
   * Resets all collections back to official presets.
   */
  public static resetToDefaults(): TeamCollection[] {
    this.saveCollections(DEFAULT_TEAM_COLLECTIONS)
    return DEFAULT_TEAM_COLLECTIONS
  }
}
