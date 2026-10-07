// Minimal test runner harness for ZenDev Shareable Team Collections Engine
let currentSuite = '';
let currentTest = '';
let passed = 0;
let failed = 0;

globalThis.describe = async (name, fn) => {
  const prev = currentSuite;
  currentSuite = prev ? `${prev} > ${name}` : name;
  console.log(`\n--- ${currentSuite} ---`);
  await fn();
  currentSuite = prev;
};

globalThis.it = async (name, fn) => {
  currentTest = name;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failed++;
  }
};

globalThis.expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) throw new Error(`Expected ${expected}, received ${actual}`);
  },
  toEqual: (expected) => {
    const actStr = JSON.stringify(actual);
    const expStr = JSON.stringify(expected);
    if (actStr !== expStr) throw new Error(`Expected ${expStr}, received ${actStr}`);
  },
  toBeDefined: () => {
    if (actual === undefined || actual === null) throw new Error(`Expected defined value, received ${actual}`);
  },
  toBeUndefined: () => {
    if (actual !== undefined) throw new Error(`Expected undefined value, received ${actual}`);
  },
  toContain: (substring) => {
    if (typeof actual !== 'string' || !actual.includes(substring)) {
      throw new Error(`Expected "${actual}" to contain "${substring}"`);
    }
  },
  toThrow: (substring) => {
    let threw = false;
    let message = '';
    try {
      actual();
    } catch (err) {
      threw = true;
      message = err.message;
    }
    if (!threw) throw new Error('Expected function to throw, but it did not throw.');
    if (substring && !message.includes(substring)) {
      throw new Error(`Expected error message "${message}" to contain "${substring}"`);
    }
  },
  not: {
    toThrow: () => {
      try {
        actual();
      } catch (err) {
        throw new Error(`Expected function not to throw, but it threw: ${err.message}`);
      }
    }
  },
  rejects: {
    toThrow: async (substring) => {
      let threw = false;
      let message = '';
      try {
        await actual;
      } catch (err) {
        threw = true;
        message = err.message;
      }
      if (!threw) throw new Error('Expected promise to reject, but it resolved.');
      if (substring && !message.includes(substring)) {
        throw new Error(`Expected rejection message "${message}" to contain "${substring}"`);
      }
    }
  }
});

console.log('================================================================');
console.log('ZENDEV SHAREABLE TEAM COLLECTIONS ENGINE TEST RUNNER');
console.log('================================================================');

class StandaloneTeamCollectionManager {
  static store = {};

  static clear() {
    this.store = {};
  }

  static saveCollection(collection, actorRole = 'admin') {
    if (actorRole === 'viewer') {
      throw new Error('Viewer rolündeki kullanıcılar koleksiyon düzenleyemez!');
    }
    const updated = {
      ...collection,
      updatedAt: Date.now()
    };
    this.store[collection.id] = updated;
    return updated;
  }

  static getCollection(id) {
    return this.store[id];
  }

  static deleteCollection(id, actorRole = 'admin') {
    if (actorRole === 'viewer') {
      throw new Error('Viewer rolündeki kullanıcılar koleksiyon silemez!');
    }
    delete this.store[id];
  }

  static addItem(collectionId, item, actorRole = 'admin') {
    if (actorRole === 'viewer') {
      throw new Error('Viewer rolündeki kullanıcılar koleksiyon öğesi ekleyemez!');
    }
    const col = this.getCollection(collectionId);
    if (!col) throw new Error('Collection not found');

    const now = Date.now();
    const newItem = {
      ...item,
      id: `item_${now}`,
      createdAt: now,
      updatedAt: now
    };

    col.items.push(newItem);
    col.version = this.incrementSemver(col.version, 'patch');
    col.updatedAt = now;
    this.saveCollection(col, actorRole);
    return newItem;
  }

  static incrementSemver(version, type) {
    const parts = (version || '1.0.0').split('.').map((p) => parseInt(p, 10) || 0);
    let [major = 1, minor = 0, patch = 0] = parts;

    switch (type) {
      case 'major':
        major++;
        minor = 0;
        patch = 0;
        break;
      case 'minor':
        minor++;
        patch = 0;
        break;
      case 'patch':
      default:
        patch++;
        break;
    }
    return `${major}.${minor}.${patch}`;
  }

  static async computeChecksum(data) {
    const enc = new TextEncoder();
    const buffer = enc.encode(data);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer);
    return Buffer.from(hashBuffer).toString('hex');
  }

  static async exportCollection(collectionId, actorName = 'Admin User') {
    const collection = this.getCollection(collectionId);
    if (!collection) throw new Error('Collection not found');

    const serialized = JSON.stringify(collection, null, 2);
    const checksum = await this.computeChecksum(serialized);

    return {
      schemaVersion: '1.0.0',
      exportedAt: Date.now(),
      exportedBy: actorName,
      checksum,
      collection
    };
  }

  static async importCollection(jsonStr, actorRole = 'admin') {
    if (actorRole === 'viewer') {
      throw new Error('Viewer rolündeki kullanıcılar koleksiyon içe aktaramaz!');
    }
    const parsed = JSON.parse(jsonStr);
    const target = parsed.collection ?? parsed;

    if (!target.name || !target.category || !Array.isArray(target.items)) {
      throw new Error('Geçersiz koleksiyon şeması');
    }

    const now = Date.now();
    const imported = {
      ...target,
      id: `col_imported_${now}`,
      name: `${target.name} (İçe Aktarıldı)`,
      createdAt: now,
      updatedAt: now
    };

    this.saveCollection(imported, actorRole);
    return imported;
  }
}

async function runAllTests() {
  await describe('1. CRUD Operations & Persistence', async () => {
    await it('creates and retrieves a team API collection', async () => {
      const col = {
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
      };

      StandaloneTeamCollectionManager.saveCollection(col, 'admin');
      const fetched = StandaloneTeamCollectionManager.getCollection('col_api_test');
      expect(fetched).toBeDefined();
      expect(fetched.name).toBe('Stripe & Webhook Gateway');
      expect(fetched.category).toBe('api');
    });

    await it('deletes a collection successfully', async () => {
      const col = {
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
      };
      StandaloneTeamCollectionManager.saveCollection(col, 'owner');
      expect(StandaloneTeamCollectionManager.getCollection('col_delete_me')).toBeDefined();

      StandaloneTeamCollectionManager.deleteCollection('col_delete_me', 'owner');
      expect(StandaloneTeamCollectionManager.getCollection('col_delete_me')).toBeUndefined();
    });
  });

  await describe('2. Role-Based Access Control (RBAC) Enforcement', async () => {
    const sampleCol = {
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
    };

    await it('allows Owner, Admin, and Member to save collections', async () => {
      expect(() => StandaloneTeamCollectionManager.saveCollection(sampleCol, 'owner')).not.toThrow();
      expect(() => StandaloneTeamCollectionManager.saveCollection(sampleCol, 'admin')).not.toThrow();
      expect(() => StandaloneTeamCollectionManager.saveCollection(sampleCol, 'member')).not.toThrow();
    });

    await it('strictly forbids Viewer from modifying or creating collections', async () => {
      expect(() => StandaloneTeamCollectionManager.saveCollection(sampleCol, 'viewer')).toThrow('Viewer rolündeki kullanıcılar');
    });

    await it('strictly forbids Viewer from deleting collections', async () => {
      StandaloneTeamCollectionManager.saveCollection(sampleCol, 'admin');
      expect(() => StandaloneTeamCollectionManager.deleteCollection(sampleCol.id, 'viewer')).toThrow('Viewer rolündeki kullanıcılar');
    });

    await it('strictly forbids Viewer from importing collections', async () => {
      const json = JSON.stringify(sampleCol);
      await expect(StandaloneTeamCollectionManager.importCollection(json, 'viewer')).rejects.toThrow('Viewer rolündeki kullanıcılar');
    });
  });

  await describe('3. Item Management & SemVer Versioning', async () => {
    await it('automatically increments SemVer patch version when adding items', async () => {
      const col = {
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
      };
      StandaloneTeamCollectionManager.saveCollection(col, 'admin');

      StandaloneTeamCollectionManager.addItem('col_semver', {
        name: 'Midnight DB Backup',
        description: '0 0 * * *',
        category: 'cron',
        tags: ['backup'],
        payload: { expression: '0 0 * * *' }
      }, 'admin');

      const updated = StandaloneTeamCollectionManager.getCollection('col_semver');
      expect(updated.items.length).toBe(1);
      expect(updated.version).toBe('1.2.1');
    });

    await it('supports major and minor semver increments', async () => {
      expect(StandaloneTeamCollectionManager.incrementSemver('1.2.5', 'minor')).toBe('1.3.0');
      expect(StandaloneTeamCollectionManager.incrementSemver('1.3.0', 'major')).toBe('2.0.0');
      expect(StandaloneTeamCollectionManager.incrementSemver('2.0.0', 'patch')).toBe('2.0.1');
    });
  });

  await describe('4. Git-Friendly Export & Checksum Verification', async () => {
    await it('generates a valid export envelope with SHA-256 integrity hash', async () => {
      const col = {
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
      };
      StandaloneTeamCollectionManager.saveCollection(col, 'admin');

      const envelope = await StandaloneTeamCollectionManager.exportCollection('col_export', 'System Architect');
      expect(envelope.schemaVersion).toBe('1.0.0');
      expect(envelope.exportedBy).toBe('System Architect');
      expect(envelope.checksum).toBeDefined();
      expect(envelope.checksum.length).toBe(64);
      expect(envelope.collection.name).toBe('Mermaid Architecture Flows');
    });

    await it('imports an exported envelope successfully with renamed identifier', async () => {
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
      };

      const imported = await StandaloneTeamCollectionManager.importCollection(JSON.stringify(sampleExport), 'admin');
      expect(imported.name).toBe('Partner Webhook Catalog (İçe Aktarıldı)');
      expect(imported.category).toBe('api');
      expect(imported.id).toContain('col_imported_');
    });
  });

  console.log('\n================================================================');
  console.log(`TEAM COLLECTIONS HARNESS RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests();
