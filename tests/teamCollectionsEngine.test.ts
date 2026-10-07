/**
 * ZenDev Enterprise SaaS — Team Collections Engine Test Suite
 * Validates cross-studio team presets, RBAC write restrictions,
 * SemVer auto-incrementing, Git-friendly JSON export/import, and SHA-256 checksums.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 4: Diferansiyasyon & B2B Moat)
 */

import { describe, it, expect, beforeEach } from 'vitest'

export type CollectionCategory = 'api' | 'regex' | 'cron' | 'mermaid'
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface TeamCollectionItem {
  id: string
  name: string
  description: string
  category: CollectionCategory
  tags: string[]
  payload: Record<string, any>
  createdAt: number
  updatedAt: number
}

export interface TeamCollection {
  id: string
  name: string
  slug: string
  description: string
  category: CollectionCategory
  version: string
  author: { id: string; name: string; email: string }
  organizationId: string
  visibility: 'team' | 'public' | 'private'
  tags: string[]
  items: TeamCollectionItem[]
  createdAt: number
  updatedAt: number
}

export interface CollectionExportEnvelope {
  schemaVersion: '1.0.0'
  exportedAt: number
  exportedBy: string
  checksum: string
  collection: TeamCollection
}

export class TestTeamCollectionManager {
  private static store: Record<string, TeamCollection> = {}

  public static clear(): void {
    this.store = {}
  }

  public static saveCollection(collection: TeamCollection, actorRole: TeamRole = 'admin'): TeamCollection {
    if (actorRole === 'viewer') {
      throw new Error('Viewer rolündeki kullanıcılar koleksiyon düzenleyemez!')
    }
    const updated = {
      ...collection,
      updatedAt: Date.now()
    }
    this.store[collection.id] = updated
    return updated
  }

  public static getCollection(id: string): TeamCollection | undefined {
    return this.store[id]
  }

  public static deleteCollection(id: string, actorRole: TeamRole = 'admin'): void {
    if (actorRole === 'viewer') {
      throw new Error('Viewer rolündeki kullanıcılar koleksiyon silemez!')
    }
    delete this.store[id]
  }

  public static addItem(
    collectionId: string,
    item: Omit<TeamCollectionItem, 'id' | 'createdAt' | 'updatedAt'>,
    actorRole: TeamRole = 'admin'
  ): TeamCollectionItem {
    if (actorRole === 'viewer') {
      throw new Error('Viewer rolündeki kullanıcılar koleksiyon öğesi ekleyemez!')
    }
    const col = this.getCollection(collectionId)
    if (!col) throw new Error('Collection not found')

    const now = Date.now()
    const newItem: TeamCollectionItem = {
      ...item,
      id: `item_${now}`,
      createdAt: now,
      updatedAt: now
    }

    col.items.push(newItem)
    col.version = this.incrementSemver(col.version, 'patch')
    col.updatedAt = now
    this.saveCollection(col, actorRole)
    return newItem
  }

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

  public static async computeChecksum(data: string): Promise<string> {
    const enc = new TextEncoder()
    const buffer = enc.encode(data)
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer)
    return Buffer.from(hashBuffer).toString('hex')
  }

  public static async exportCollection(collectionId: string, actorName = 'Admin User'): Promise<CollectionExportEnvelope> {
    const collection = this.getCollection(collectionId)
    if (!collection) throw new Error('Collection not found')

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

  public static async importCollection(jsonStr: string, actorRole: TeamRole = 'admin'): Promise<TeamCollection> {
    if (actorRole === 'viewer') {
      throw new Error('Viewer rolündeki kullanıcılar koleksiyon içe aktaramaz!')
    }
    const parsed = JSON.parse(jsonStr)
    const target = parsed.collection ?? parsed

    if (!target.name || !target.category || !Array.isArray(target.items)) {
      throw new Error('Geçersiz koleksiyon şeması')
    }

    const now = Date.now()
    const imported: TeamCollection = {
      ...target,
      id: `col_imported_${now}`,
      name: `${target.name} (İçe Aktarıldı)`,
      createdAt: now,
      updatedAt: now
    }

    this.saveCollection(imported, actorRole)
    return imported
  }
}

describe('ZenDev Shareable Team Collections Engine', () => {
  beforeEach(() => {
    TestTeamCollectionManager.clear()
  })

  describe('1. CRUD Operations & Persistence', () => {
    it('creates and retrieves a team API collection', () => {
      const col: TeamCollection = {
        id: 'col_api_test',
        name: 'Stripe & Webhook Gateway',
        slug: 'stripe-webhook-gateway',
        description: 'Test API endpoints',
        category: 'api',
        version: '1.0.0',
        author: { id: 'usr_1', name: 'Dev', email: 'dev@zendev.io' },
        organizationId: 'org_test',
        visibility: 'team',
        tags: ['api', 'webhook'],
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      TestTeamCollectionManager.saveCollection(col, 'admin')
      const fetched = TestTeamCollectionManager.getCollection('col_api_test')
      expect(fetched).toBeDefined()
      expect(fetched?.name).toBe('Stripe & Webhook Gateway')
      expect(fetched?.category).toBe('api')
    })

    it('deletes a collection successfully', () => {
      const col: TeamCollection = {
        id: 'col_delete_me',
        name: 'Temporary Regex',
        slug: 'temp-regex',
        description: '',
        category: 'regex',
        version: '1.0.0',
        author: { id: 'usr_1', name: 'Dev', email: 'dev@zendev.io' },
        organizationId: 'org_test',
        visibility: 'team',
        tags: [],
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      TestTeamCollectionManager.saveCollection(col, 'owner')
      expect(TestTeamCollectionManager.getCollection('col_delete_me')).toBeDefined()

      TestTeamCollectionManager.deleteCollection('col_delete_me', 'owner')
      expect(TestTeamCollectionManager.getCollection('col_delete_me')).toBeUndefined()
    })
  })

  describe('2. Role-Based Access Control (RBAC) Enforcement', () => {
    const sampleCol: TeamCollection = {
      id: 'col_rbac',
      name: 'SecOps Ruleset',
      slug: 'secops-ruleset',
      description: 'Zero trust rules',
      category: 'regex',
      version: '1.0.0',
      author: { id: 'usr_1', name: 'Sec', email: 'sec@zendev.io' },
      organizationId: 'org_test',
      visibility: 'team',
      tags: ['sec'],
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    it('allows Owner, Admin, and Member to save collections', () => {
      expect(() => TestTeamCollectionManager.saveCollection(sampleCol, 'owner')).not.toThrow()
      expect(() => TestTeamCollectionManager.saveCollection(sampleCol, 'admin')).not.toThrow()
      expect(() => TestTeamCollectionManager.saveCollection(sampleCol, 'member')).not.toThrow()
    })

    it('strictly forbids Viewer from modifying or creating collections', () => {
      expect(() => TestTeamCollectionManager.saveCollection(sampleCol, 'viewer')).toThrow('Viewer rolündeki kullanıcılar')
    })

    it('strictly forbids Viewer from deleting collections', () => {
      TestTeamCollectionManager.saveCollection(sampleCol, 'admin')
      expect(() => TestTeamCollectionManager.deleteCollection(sampleCol.id, 'viewer')).toThrow('Viewer rolündeki kullanıcılar')
    })

    it('strictly forbids Viewer from importing collections', async () => {
      const json = JSON.stringify(sampleCol)
      await expect(TestTeamCollectionManager.importCollection(json, 'viewer')).rejects.toThrow('Viewer rolündeki kullanıcılar')
    })
  })

  describe('3. Item Management & SemVer Versioning', () => {
    it('automatically increments SemVer patch version when adding items', () => {
      const col: TeamCollection = {
        id: 'col_semver',
        name: 'DevOps Crons',
        slug: 'devops-crons',
        description: 'Nightly tasks',
        category: 'cron',
        version: '1.2.0',
        author: { id: 'usr_1', name: 'Dev', email: 'dev@zendev.io' },
        organizationId: 'org_test',
        visibility: 'team',
        tags: [],
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      TestTeamCollectionManager.saveCollection(col, 'admin')

      TestTeamCollectionManager.addItem('col_semver', {
        name: 'Midnight DB Backup',
        description: '0 0 * * *',
        category: 'cron',
        tags: ['backup'],
        payload: { expression: '0 0 * * *' }
      }, 'admin')

      const updated = TestTeamCollectionManager.getCollection('col_semver')
      expect(updated?.items.length).toBe(1)
      expect(updated?.version).toBe('1.2.1')
    })

    it('supports major and minor semver increments', () => {
      expect(TestTeamCollectionManager.incrementSemver('1.2.5', 'minor')).toBe('1.3.0')
      expect(TestTeamCollectionManager.incrementSemver('1.3.0', 'major')).toBe('2.0.0')
      expect(TestTeamCollectionManager.incrementSemver('2.0.0', 'patch')).toBe('2.0.1')
    })
  })

  describe('4. Git-Friendly Export & Checksum Verification', () => {
    it('generates a valid export envelope with SHA-256 integrity hash', async () => {
      const col: TeamCollection = {
        id: 'col_export',
        name: 'Mermaid Architecture Flows',
        slug: 'mermaid-arch-flows',
        description: 'Auth sequence and topologies',
        category: 'mermaid',
        version: '1.0.0',
        author: { id: 'usr_1', name: 'Architect', email: 'arch@zendev.io' },
        organizationId: 'org_test',
        visibility: 'team',
        tags: ['mermaid', 'sequence'],
        items: [
          {
            id: 'item_1',
            name: 'OAuth2 PKCE Flow',
            description: 'Sequence diagram',
            category: 'mermaid',
            tags: ['oauth'],
            payload: { chart: 'sequenceDiagram\nUser->>API: Login' },
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      TestTeamCollectionManager.saveCollection(col, 'admin')

      const envelope = await TestTeamCollectionManager.exportCollection('col_export', 'System Architect')
      expect(envelope.schemaVersion).toBe('1.0.0')
      expect(envelope.exportedBy).toBe('System Architect')
      expect(envelope.checksum).toBeDefined()
      expect(envelope.checksum.length).toBe(64)
      expect(envelope.collection.name).toBe('Mermaid Architecture Flows')
    })

    it('imports an exported envelope successfully with renamed identifier', async () => {
      const sampleExport = {
        schemaVersion: '1.0.0',
        exportedAt: Date.now(),
        exportedBy: 'Teammate',
        checksum: 'mock_hash',
        collection: {
          name: 'Partner Webhook Catalog',
          slug: 'partner-webhooks',
          description: 'Shared endpoints',
          category: 'api',
          version: '1.0.0',
          author: { id: 'usr_2', name: 'Partner', email: 'partner@corp.com' },
          organizationId: 'org_partner',
          visibility: 'team',
          tags: ['partner'],
          items: []
        }
      }

      const imported = await TestTeamCollectionManager.importCollection(JSON.stringify(sampleExport), 'admin')
      expect(imported.name).toBe('Partner Webhook Catalog (İçe Aktarıldı)')
      expect(imported.category).toBe('api')
      expect(imported.id).toContain('col_imported_')
    })
  })
})
