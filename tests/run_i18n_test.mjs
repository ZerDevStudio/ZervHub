import fs from 'fs';

// Mock Vitest globals to run tests/i18nParityElevation.test.ts without npm dependencies
let currentSuite = '';
let currentTest = '';
let passed = 0;
let failed = 0;

globalThis.describe = (name, fn) => {
  const prev = currentSuite;
  currentSuite = prev ? `${prev} > ${name}` : name;
  fn();
  currentSuite = prev;
};

globalThis.it = (name, fn) => {
  currentTest = name;
  try {
    fn();
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
  toContain: (item) => {
    if (Array.isArray(actual) && !actual.includes(item)) throw new Error(`Array does not contain ${item}`);
    if (typeof actual === 'string' && !actual.includes(item)) throw new Error(`String does not contain ${item}`);
  }
});

console.log('Running tests/i18nParityElevation.test.ts through agy-node...');

// Load json files directly
const enJson = JSON.parse(fs.readFileSync('src/renderer/src/locales/en.json', 'utf8'));
const trJson = JSON.parse(fs.readFileSync('src/renderer/src/locales/tr.json', 'utf8'));

// Now evaluate the test logic exactly as written in tests/i18nParityElevation.test.ts
function flattenKeys(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value, fullKey));
    } else {
      result[fullKey] = String(value ?? '');
    }
  }
  return result;
}

const enFlat = flattenKeys(enJson);
const trFlat = flattenKeys(trJson);

const enKeys = Object.keys(enFlat).sort();
const trKeys = Object.keys(trFlat).sort();

describe('Internationalization (i18n) — 100% Key Parity & Elevation Verification', () => {
  describe('1. Global Dictionary Parity & Cardinality', () => {
    it('verifies exact total count of 785 keys in both en.json and tr.json', () => {
      expect(enKeys.length).toBe(785);
      expect(trKeys.length).toBe(785);
    });

    it('verifies zero missing keys in tr.json relative to en.json', () => {
      const missingInTr = enKeys.filter((k) => !trFlat.hasOwnProperty(k));
      expect(missingInTr).toEqual([]);
    });

    it('verifies zero missing keys in en.json relative to tr.json', () => {
      const missingInEn = trKeys.filter((k) => !enFlat.hasOwnProperty(k));
      expect(missingInEn).toEqual([]);
    });

    it('verifies zero empty strings or undefined values in en.json', () => {
      const emptyEn = Object.entries(enFlat)
        .filter(([_, v]) => !v || v.trim() === '')
        .map(([k]) => k);
      expect(emptyEn).toEqual([]);
    });

    it('verifies zero empty strings or undefined values in tr.json', () => {
      const emptyTr = Object.entries(trFlat)
        .filter(([_, v]) => !v || v.trim() === '')
        .map(([k]) => k);
      expect(emptyTr).toEqual([]);
    });
  });

  describe('2. Four New Developer SaaS Utilities Namespaces Parity', () => {
    it('verifies jwtStudio namespace parity (49 keys)', () => {
      const enJwt = enKeys.filter((k) => k.startsWith('jwtStudio.'));
      const trJwt = trKeys.filter((k) => k.startsWith('jwtStudio.'));
      expect(enJwt.length).toBe(49);
      expect(trJwt.length).toBe(49);
      expect(enJwt).toEqual(trJwt);
    });

    it('verifies cronStudio namespace parity (30 keys)', () => {
      const enCron = enKeys.filter((k) => k.startsWith('cronStudio.'));
      const trCron = trKeys.filter((k) => k.startsWith('cronStudio.'));
      expect(enCron.length).toBe(30);
      expect(trCron.length).toBe(30);
      expect(enCron).toEqual(trCron);
    });

    it('verifies mermaidStudio namespace parity (24 keys)', () => {
      const enMermaid = enKeys.filter((k) => k.startsWith('mermaidStudio.'));
      const trMermaid = trKeys.filter((k) => k.startsWith('mermaidStudio.'));
      expect(enMermaid.length).toBe(24);
      expect(trMermaid.length).toBe(24);
      expect(enMermaid).toEqual(trMermaid);
    });

    it('verifies encodingStudio namespace parity (31 keys)', () => {
      const enEncoding = enKeys.filter((k) => k.startsWith('encodingStudio.'));
      const trEncoding = trKeys.filter((k) => k.startsWith('encodingStudio.'));
      expect(enEncoding.length).toBe(31);
      expect(trEncoding.length).toBe(31);
      expect(enEncoding).toEqual(trEncoding);
    });
  });

  describe('3. Desktop UX Elevation Modules Namespaces Parity', () => {
    it('verifies portKiller namespace was purged in v2.5.3 per SaaS Directive Principle 2', () => {
      const enPort = enKeys.filter((k) => k.startsWith('portKiller.'));
      const trPort = trKeys.filter((k) => k.startsWith('portKiller.'));
      expect(enPort.length).toBe(0);
      expect(trPort.length).toBe(0);
    });

    it('verifies activityFeed namespace parity (87 keys)', () => {
      const enFeed = enKeys.filter((k) => k.startsWith('activityFeed.'));
      const trFeed = trKeys.filter((k) => k.startsWith('activityFeed.'));
      expect(enFeed.length).toBe(87);
      expect(trFeed.length).toBe(87);
      expect(enFeed).toEqual(trFeed);
    });

    it('verifies nav.tools namespace parity (23 keys including all 4 new tools)', () => {
      const enNav = enKeys.filter((k) => k.startsWith('nav.tools.'));
      const trNav = trKeys.filter((k) => k.startsWith('nav.tools.'));
      expect(enNav.length).toBe(23);
      expect(trNav.length).toBe(23);
      expect(enNav).toEqual(trNav);
      expect(enNav).toContain('nav.tools.jwtStudio');
      expect(enNav).toContain('nav.tools.cronStudio');
      expect(enNav).toContain('nav.tools.mermaidStudio');
      expect(enNav).toContain('nav.tools.encodingStudio');
    });

    it('verifies dashboard.tools namespace parity (14 keys)', () => {
      const enDash = enKeys.filter((k) => k.startsWith('dashboard.tools.'));
      const trDash = trKeys.filter((k) => k.startsWith('dashboard.tools.'));
      expect(enDash.length).toBe(14);
      expect(trDash.length).toBe(14);
      expect(enDash).toEqual(trDash);
      expect(enDash).toContain('dashboard.tools.jwtStudio.desc');
      expect(enDash).toContain('dashboard.tools.cronStudio.desc');
      expect(enDash).toContain('dashboard.tools.mermaidStudio.desc');
      expect(enDash).toContain('dashboard.tools.encodingStudio.desc');
      expect(enDash).toContain('dashboard.tools.colorStudio.desc');
      expect(enDash).toContain('dashboard.tools.scratchpad.desc');
    });
  });

  describe('4. Interpolation Placeholders Parity for Elevation Workstations', () => {
    it('verifies all {{variable}} interpolation tags match between en.json and tr.json across elevated namespaces', () => {
      const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
      const elevatedPrefixes = [
        'jwtStudio.',
        'cronStudio.',
        'mermaidStudio.',
        'encodingStudio.',
        'activityFeed.',
      ];

      const elevatedKeys = enKeys.filter((k) =>
        elevatedPrefixes.some((prefix) => k.startsWith(prefix))
      );

      for (const key of elevatedKeys) {
        const enVal = enFlat[key];
        const trVal = trFlat[key];

        const enVars = [...enVal.matchAll(regex)].map((m) => m[1]).sort();
        const trVars = [...trVal.matchAll(regex)].map((m) => m[1]).sort();

        expect(trVars).toEqual(enVars);
      }
    });
  });
});

console.log(`\nResults: ${passed} PASSED, ${failed} FAILED`);
if (failed > 0) process.exit(1);
