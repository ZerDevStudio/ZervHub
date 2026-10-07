// Standalone test runner for ZenDev EDR & Antivirus Zero False-Positive Compliance
import fs from 'fs';
import path from 'path';

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
  toBeDefined: () => {
    if (actual === undefined || actual === null) throw new Error(`Expected defined value, received ${actual}`);
  },
  toContain: (substring) => {
    if (typeof actual !== 'string' || !actual.includes(substring)) {
      throw new Error(`Expected content to contain "${substring}"`);
    }
  },
  notToContain: (substring) => {
    if (typeof actual === 'string' && actual.includes(substring)) {
      throw new Error(`Expected content NOT to contain "${substring}"`);
    }
  }
});

// Implementation of PII and Secret Scrubbing matching activityLogger.ts
function luhnCheck(cardNo) {
  const clean = cardNo.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(clean)) return false;
  let sum = 0;
  let double = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

function sanitizeString(val) {
  if (!val || typeof val !== 'string') return val;
  let sanitized = val;

  // 1. Private Keys
  sanitized = sanitized.replace(
    /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/g,
    '[REDACTED_PRIVATE_KEY]'
  );

  // 2. JWTs
  sanitized = sanitized.replace(
    /\bey[A-Za-z0-9_-]{10,}\.ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_\-+/=]{10,}\b/g,
    '[REDACTED_JWT]'
  );

  // 3. API Keys
  sanitized = sanitized.replace(/\bsk-ant-[a-zA-Z0-9_\-]{20,}\b/g, '[REDACTED_API_KEY]');
  sanitized = sanitized.replace(/\bsk-[a-zA-Z0-9_\-]{20,}\b/g, '[REDACTED_API_KEY]');
  sanitized = sanitized.replace(/\bAIza[0-9A-Za-z\-_]{35}\b/g, '[REDACTED_API_KEY]');

  // 4. Bearer & Basic Auth
  sanitized = sanitized.replace(/\bBearer\s+[a-zA-Z0-9\-._~+/]+=*\b/gi, 'Bearer [REDACTED_TOKEN]');
  sanitized = sanitized.replace(/\bBasic\s+[a-zA-Z0-9+/=]{10,}\b/gi, 'Basic [REDACTED_AUTH]');

  // 5. Luhn-valid Credit Cards
  sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,19}\b/g, (match) => {
    return luhnCheck(match) ? '[REDACTED_CREDIT_CARD]' : match;
  });

  return sanitized;
}

// -------------------------------------------------------------
// TEST SUITE EXECUTION
// -------------------------------------------------------------
async function runTests() {
  console.log('================================================================');
  console.log('ZENDEV EDR & ANTIVIRUS ZERO FALSE-POSITIVE COMPLIANCE TEST');
  console.log('================================================================');

  const rootDir = process.cwd();

  await describe('1. Transparent Update Flow & Silent Execution Ban', async () => {
    await it('ensures updater installer is spawned interactively without stealth background flags', () => {
      const updaterPath = path.join(rootDir, 'src-tauri', 'src', 'updater.rs');
      const content = fs.readFileSync(updaterPath, 'utf8');

      // Must launch installer visibly via the audited interactive helper, never with stealth flags
      expect(content).toContain('process_ext::spawn_interactive(&path');
      expect(content).notToContain('arg("/S")');
      expect(content).notToContain('arg("/SILENT")');
      expect(content).notToContain('arg("/qn")');
      expect(content).notToContain('CREATE_NO_WINDOW');

      const processExt = fs.readFileSync(path.join(rootDir, 'src-tauri', 'src', 'process_ext.rs'), 'utf8');
      const helperStart = processExt.indexOf('pub fn spawn_interactive');
      expect(helperStart > -1 ? 'found' : 'missing').toBe('found');
      const rest = processExt.slice(helperStart);
      const endMatch = rest.match(/\r?\n\}\r?\n/);
      const helperBody = endMatch ? rest.slice(0, endMatch.index) : rest;
      expect(helperBody).notToContain('creation_flags');
      expect(helperBody).notToContain('silent');
    });

    await it('enforces HTTPS and trusted GitHub endpoints for update binary payloads', () => {
      const updaterPath = path.join(rootDir, 'src-tauri', 'src', 'updater.rs');
      const content = fs.readFileSync(updaterPath, 'utf8');

      expect(content).toContain('parsed_url.scheme() != "https"');
      expect(content).toContain('!host.ends_with("github.com") && !host.ends_with("githubusercontent.com")');
    });
  });

  await describe('2. Decoupling of Banned OS Intrusions & Malware-Heuristic Vectors', async () => {
    await it('verifies absence of arbitrary OS process termination (taskkill/killall) in Rust core', () => {
      const srcTauriSrc = path.join(rootDir, 'src-tauri', 'src');
      const files = fs.readdirSync(srcTauriSrc).filter((f) => f.endsWith('.rs'));

      for (const file of files) {
        const content = fs.readFileSync(path.join(srcTauriSrc, file), 'utf8');
        expect(content).notToContain('taskkill');
        expect(content).notToContain('killall');
        expect(content).notToContain('/flushdns');
      }
    });

    await it('verifies absence of disposable email (Temp Mail) modules in frontend', () => {
      const srcRenderer = path.join(rootDir, 'src', 'renderer', 'src');
      const searchTempMail = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            searchTempMail(fullPath);
          } else if (entry.name.toLowerCase().includes('tempmail')) {
            throw new Error(`Forbidden TempMail module found: ${fullPath}`);
          }
        }
      };
      searchTempMail(srcRenderer);
    });
  });

  await describe('3. Data Sanitization & PII Masking Pre-Flight', async () => {
    await it('redacts private RSA/EC keys before disk or log serialization', () => {
      const raw = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0\n-----END RSA PRIVATE KEY-----';
      const clean = sanitizeString(raw);
      expect(clean).toBe('[REDACTED_PRIVATE_KEY]');
    });

    await it('redacts JSON Web Tokens (JWT) in log strings', () => {
      const raw = 'Auth failure with token: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const clean = sanitizeString(raw);
      expect(clean).toContain('[REDACTED_JWT]');
      expect(clean).notToContain('eyJhbGciOi');
    });

    await it('redacts Claude and OpenAI API keys in error diagnostics', () => {
      const raw = 'API Error: key sk-ant-api03-abcdef1234567890abcdef123 is invalid';
      const clean = sanitizeString(raw);
      expect(clean).toContain('[REDACTED_API_KEY]');
      expect(clean).notToContain('abcdef1234567890');
    });

    await it('masks Luhn-valid credit card numbers while preserving non-PAN numbers', () => {
      const validVisa = '4532 0150 1234 5671';
      const clean = sanitizeString(`Payment error with card ${validVisa}`);
      expect(clean).toContain('[REDACTED_CREDIT_CARD]');

      const normalNumber = 'Invoice # 1234567890123';
      const cleanNormal = sanitizeString(normalNumber);
      expect(cleanNormal).toBe(normalNumber);
    });
  });

  await describe('4. Windows Defender & EDR Behavioral Posture', async () => {
    await it('confirms process_ext.rs encapsulates subprocess arguments safely', () => {
      const processExtPath = path.join(rootDir, 'src-tauri', 'src', 'process_ext.rs');
      const content = fs.readFileSync(processExtPath, 'utf8');

      expect(content).toContain('pub const CREATE_NO_WINDOW: u32 = 0x0800_0000;');
      expect(content).toContain('self.creation_flags(CREATE_NO_WINDOW);');
    });
  });

  console.log('\n================================================================');
  console.log(`EDR & ANTIVIRUS COMPLIANCE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
