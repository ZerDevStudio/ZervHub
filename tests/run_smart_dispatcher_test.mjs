// Minimal test runner harness for ZenDev AI Smart Dispatcher & Heuristic Classifier Engine
let currentSuite = '';
let currentTest = '';
let passed = 0;
let failed = 0;

globalThis.describe = (name, fn) => {
  const prev = currentSuite;
  currentSuite = prev ? `${prev} > ${name}` : name;
  console.log(`\n--- ${currentSuite} ---`);
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
  toBeDefined: () => {
    if (actual === undefined || actual === null) throw new Error(`Expected defined value, received ${actual}`);
  },
  toBeNull: () => {
    if (actual !== null) throw new Error(`Expected null, received ${actual}`);
  },
  not: {
    toBeNull: () => {
      if (actual === null) throw new Error(`Expected non-null value, received null`);
    },
    toContain: (substring) => {
      if (typeof actual === 'string' && actual.includes(substring)) {
        throw new Error(`Expected "${actual}" not to contain "${substring}"`);
      }
    }
  },
  toContain: (substring) => {
    if (Array.isArray(actual) && !actual.includes(substring)) {
      throw new Error(`Expected array to contain "${substring}"`);
    }
    if (typeof actual === 'string' && !actual.includes(substring)) {
      throw new Error(`Expected "${actual}" to contain "${substring}"`);
    }
  }
});

console.log('================================================================');
console.log('ZENDEV AI SMART DISPATCHER & CLASSIFIER TEST RUNNER');
console.log('================================================================');

class StandaloneSmartDispatcher {
  static detectCurl(input) {
    const trimmed = input.trim();
    if (!trimmed.startsWith('curl ') && !trimmed.startsWith('curl\n') && !trimmed.startsWith('curl\r\n')) {
      return null;
    }

    try {
      const normalized = trimmed.replace(/\\\r?\n/g, ' ');

      let method = 'GET';
      const methodMatch = normalized.match(/(?:-X|--request)\s+([A-Z]+)/i);
      if (methodMatch) {
        const parsedMethod = methodMatch[1].toUpperCase();
        if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(parsedMethod)) {
          method = parsedMethod;
        }
      }

      const headers = {};
      const headerMatches = [...normalized.matchAll(/(?:-H|--header)\s+['"]([^'"]+)['"]/g)];
      for (const m of headerMatches) {
        const parts = m[1].split(':');
        if (parts.length >= 2) {
          const headerName = parts[0].trim();
          const headerVal = parts.slice(1).join(':').trim();
          headers[headerName] = headerVal;
        }
      }

      let body = undefined;
      const dataMatch = normalized.match(/(?:-d|--data|--data-raw|--data-binary)\s+(['"])([\s\S]*?)\1/);
      if (dataMatch) {
        body = dataMatch[2];
        if (method === 'GET') {
          method = 'POST';
        }
      }

      let url = '';
      const urlMatches = normalized.match(/https?:\/\/[^\s'"<>]+/i);
      if (urlMatches) {
        url = urlMatches[0];
      }

      if (!url) return null;

      return {
        type: 'curl',
        raw: trimmed,
        method,
        url,
        headers,
        body,
        targetRoute: '/api-studio',
        summary: `${method} ${url}`
      };
    } catch {
      return null;
    }
  }

  static detectJwt(input) {
    const trimmed = input.trim();
    if (!trimmed.startsWith('eyJ') && !trimmed.includes('.eyJ')) return null;

    const parts = trimmed.split('.');
    if (parts.length !== 3) return null;

    try {
      const base64UrlDecode = (str) => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) base64 += '=';
        return Buffer.from(base64, 'base64').toString('utf8');
      };

      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));

      if (!header || !payload || typeof header !== 'object' || typeof payload !== 'object') {
        return null;
      }

      const algorithm = header.alg || 'UNKNOWN';
      const subject = payload.sub;
      let isExpired = undefined;
      let expiresAt = undefined;

      if (payload.exp && typeof payload.exp === 'number') {
        const expMs = payload.exp * 1000;
        isExpired = Date.now() > expMs;
        expiresAt = new Date(expMs).toISOString();
      }

      return {
        type: 'jwt',
        raw: trimmed,
        header,
        payload,
        signature: parts[2],
        algorithm,
        subject,
        expiresAt,
        isExpired,
        targetRoute: '/jwt-studio'
      };
    } catch {
      return null;
    }
  }

  static detectValidJson(input) {
    const trimmed = input.trim();
    if (trimmed.length < 2) return null;
    if ((!trimmed.startsWith('{') || !trimmed.endsWith('}')) && (!trimmed.startsWith('[') || !trimmed.endsWith(']'))) return null;

    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed !== 'object' || parsed === null) return null;

      const isArray = Array.isArray(parsed);
      const isObject = !isArray && typeof parsed === 'object';
      const itemCount = isArray ? parsed.length : Object.keys(parsed).length;
      const formatted = JSON.stringify(parsed, null, 2);
      const minified = JSON.stringify(parsed);

      return {
        type: 'json',
        raw: trimmed,
        formatted,
        minified,
        itemCount,
        isObject,
        isArray,
        targetRoute: '/json-studio'
      };
    } catch {
      return null;
    }
  }

  static detectMalformedJson(input) {
    const trimmed = input.trim();
    if (trimmed.length < 3) return null;

    try {
      JSON.parse(trimmed);
      return null;
    } catch (parseErr) {
      const looksLikeJson =
        trimmed.startsWith('{') ||
        trimmed.startsWith('[') ||
        (trimmed.includes(':') && (trimmed.includes('{') || trimmed.includes('}'))) ||
        /^[a-zA-Z0-9_]+\s*:\s*['"]?[a-zA-Z0-9_]+['"]?/.test(trimmed);

      if (!looksLikeJson) return null;

      let candidate = trimmed;
      if (!candidate.startsWith('{') && !candidate.startsWith('[') && candidate.includes(':')) {
        candidate = `{ ${candidate} }`;
      }
      candidate = candidate.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
      candidate = candidate.replace(/([{\s,])([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      candidate = candidate.replace(/,\s*([\]}])/g, '$1');

      const openBraces = (candidate.match(/\{/g) || []).length;
      const closeBraces = (candidate.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        candidate += '}'.repeat(openBraces - closeBraces);
      }

      const openBrackets = (candidate.match(/\[/g) || []).length;
      const closeBrackets = (candidate.match(/\]/g) || []).length;
      if (openBrackets > closeBrackets) {
        candidate += ']'.repeat(openBrackets - closeBrackets);
      }

      let canAutoRepair = false;
      let repairedText = undefined;

      try {
        const repairedObj = JSON.parse(candidate);
        canAutoRepair = true;
        repairedText = JSON.stringify(repairedObj, null, 2);
      } catch {}

      return {
        type: 'malformed_json',
        raw: trimmed,
        errorSnippet: parseErr.message,
        canAutoRepair,
        repairedText,
        targetRoute: '/json-studio'
      };
    }
  }

  static detectSql(input) {
    const trimmed = input.trim();
    const sqlPattern = /^(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\b/i;
    const match = trimmed.match(sqlPattern);
    if (!match) return null;

    const statementType = match[1].toUpperCase().split(/\s+/)[0];
    const tables = [];
    const fromMatches = [...trimmed.matchAll(/(?:FROM|INTO|UPDATE|TABLE)\s+([a-zA-Z0-9_."`]+)/gi)];
    for (const fm of fromMatches) {
      const tbl = fm[1].replace(/["`]/g, '');
      if (!tables.includes(tbl)) tables.push(tbl);
    }

    return {
      type: 'sql',
      raw: trimmed,
      statementType,
      tables,
      formatted: trimmed
    };
  }

  static detectStacktrace(input) {
    const trimmed = input.trim();
    const isStack =
      /^(?:(?:[a-zA-Z]+)?Error|Exception|panic):\s+/m.test(trimmed) ||
      /\bat\s+(?:[a-zA-Z0-9_$.<>]+|\/|[a-zA-Z]:\\)\s*\([^)]+:\d+:\d+\)/m.test(trimmed) ||
      /Traceback \(most recent call last\):/m.test(trimmed) ||
      /goroutine \d+ \[[^\]]+\]:/m.test(trimmed);

    if (!isStack) return null;

    const lines = trimmed.split('\n');
    const firstLine = lines[0].trim();
    let errorName = 'Error';
    let errorMessage = firstLine;

    const errMatch = firstLine.match(/^([A-Za-z0-9_]+(?:Error|Exception)):\s*(.*)/);
    if (errMatch) {
      errorName = errMatch[1];
      errorMessage = errMatch[2];
    }

    let culpritFile = undefined;
    let culpritLine = undefined;
    const culpritMatch = trimmed.match(/(?:at\s+.*?\()?([a-zA-Z0-9_./\\-]+\.[a-zA-Z]{1,5}):(\d+)(?::\d+)?\)?/);
    if (culpritMatch) {
      culpritFile = culpritMatch[1].replace(/^.*[/\\]/, '');
      culpritLine = parseInt(culpritMatch[2], 10);
    }

    const sanitized = trimmed
      .replace(/([a-zA-Z]:\\(?:Users|Documents and Settings)\\[^\\]+)/gi, '[USER_DIR]')
      .replace(/(\/(?:Users|home)\/[^/\s]+)/gi, '[USER_DIR]');

    return {
      type: 'stacktrace',
      raw: trimmed,
      errorName,
      errorMessage,
      culpritFile,
      culpritLine,
      sanitized
    };
  }

  static detectBase64OrHex(input) {
    const trimmed = input.trim();
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return { type: 'base64_hex', raw: trimmed, format: 'sha256', targetRoute: '/hash-studio' };
    }
    if (/^[0-9a-fA-F]{32}$/.test(trimmed)) {
      return { type: 'base64_hex', raw: trimmed, format: 'md5', targetRoute: '/hash-studio' };
    }
    if (trimmed.length >= 24 && trimmed.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) && !trimmed.includes(' ')) {
      try {
        const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
        const printableCount = decoded.replace(/[\x20-\x7E\r\n\t]/g, '').length;
        if (printableCount / decoded.length < 0.2) {
          return { type: 'base64_hex', raw: trimmed, format: 'base64', decodedPreview: decoded.substring(0, 100), targetRoute: '/encoding-studio' };
        }
      } catch {}
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST CASES
// ─────────────────────────────────────────────────────────────────────────────

describe('1. cURL Command Detection & Parsing', () => {
  it('parses cURL with POST method, headers, and json body', () => {
    const curl = `curl -X POST https://api.zendev.run/v1/payments -H "Content-Type: application/json" -H "Authorization: Bearer zen_sec_mock" -d '{"amount": 500}'`;
    const res = StandaloneSmartDispatcher.detectCurl(curl);
    expect(res).not.toBeNull();
    expect(res.method).toBe('POST');
    expect(res.url).toBe('https://api.zendev.run/v1/payments');
    expect(res.headers['Content-Type']).toBe('application/json');
    expect(res.headers['Authorization']).toBe('Bearer zen_sec_mock');
    expect(res.body).toBe('{"amount": 500}');
    expect(res.targetRoute).toBe('/api-studio');
  });

  it('infers POST method when -d is supplied without explicit -X flag', () => {
    const curl = `curl https://httpbin.org/post -d "name=ZenDev"`;
    const res = StandaloneSmartDispatcher.detectCurl(curl);
    expect(res).not.toBeNull();
    expect(res.method).toBe('POST');
    expect(res.body).toBe('name=ZenDev');
  });

  it('ignores non-curl input', () => {
    expect(StandaloneSmartDispatcher.detectCurl('not a curl command')).toBeNull();
  });
});

describe('2. JWT Decoding & Expiration Detection', () => {
  it('detects JWT token and flags expired timestamp', () => {
    const expiredJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4S8lPjR7Gf8p7G7qjQ9P7G7qjQ9P7G7qjQ9P7G7qjQ8';
    const res = StandaloneSmartDispatcher.detectJwt(expiredJwt);
    expect(res).not.toBeNull();
    expect(res.algorithm).toBe('HS256');
    expect(res.subject).toBe('1234567890');
    expect(res.isExpired).toBe(true);
    expect(res.targetRoute).toBe('/jwt-studio');
  });
});

describe('3. Valid JSON Detection', () => {
  it('detects valid JSON object and computes metrics', () => {
    const json = '{"service": "auth", "replicas": 3, "enabled": true}';
    const res = StandaloneSmartDispatcher.detectValidJson(json);
    expect(res).not.toBeNull();
    expect(res.itemCount).toBe(3);
    expect(res.minified).toBe('{"service":"auth","replicas":3,"enabled":true}');
    expect(res.targetRoute).toBe('/json-studio');
  });
});

describe('4. Malformed JSON Auto-Repair Heuristics', () => {
  it('repairs single quotes into valid JSON', () => {
    const malformed = "{'name': 'ZenDev', 'version': '2.5.6'}";
    const res = StandaloneSmartDispatcher.detectMalformedJson(malformed);
    expect(res).not.toBeNull();
    expect(res.canAutoRepair).toBe(true);
    const parsed = JSON.parse(res.repairedText);
    expect(parsed.name).toBe('ZenDev');
    expect(parsed.version).toBe('2.5.6');
  });

  it('repairs unquoted object keys and trailing commas', () => {
    const malformed = '{ status: 200, active: true, }';
    const res = StandaloneSmartDispatcher.detectMalformedJson(malformed);
    expect(res).not.toBeNull();
    expect(res.canAutoRepair).toBe(true);
    const parsed = JSON.parse(res.repairedText);
    expect(parsed.status).toBe(200);
    expect(parsed.active).toBe(true);
  });

  it('balances missing closing brace', () => {
    const unclosed = '{"key": "value"';
    const res = StandaloneSmartDispatcher.detectMalformedJson(unclosed);
    expect(res).not.toBeNull();
    expect(res.canAutoRepair).toBe(true);
    const parsed = JSON.parse(res.repairedText);
    expect(parsed.key).toBe('value');
  });
});

describe('5. SQL Statement Detection', () => {
  it('detects SELECT query and table names', () => {
    const query = 'SELECT id, email FROM users WHERE active = 1';
    const res = StandaloneSmartDispatcher.detectSql(query);
    expect(res).not.toBeNull();
    expect(res.statementType).toBe('SELECT');
    expect(res.tables).toContain('users');
  });
});

describe('6. Stacktrace Detection & PII Sanitization', () => {
  it('extracts error name, culprit line, and sanitizes user paths', () => {
    const stack = `TypeError: Cannot read properties of undefined (reading 'sign')
    at PipelineService.execute (C:\\Users\\Developer\\ZenDev\\src\\pipeline.ts:148:22)`;

    const res = StandaloneSmartDispatcher.detectStacktrace(stack);
    expect(res).not.toBeNull();
    expect(res.errorName).toBe('TypeError');
    expect(res.culpritFile).toBe('pipeline.ts');
    expect(res.culpritLine).toBe(148);
    expect(res.sanitized).not.toContain('C:\\Users\\Developer');
    expect(res.sanitized).toContain('[USER_DIR]');
  });
});

describe('7. Base64 & Hash Detection', () => {
  it('detects 64-char SHA-256 hash', () => {
    const sha = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
    const res = StandaloneSmartDispatcher.detectBase64OrHex(sha);
    expect(res).not.toBeNull();
    expect(res.format).toBe('sha256');
    expect(res.targetRoute).toBe('/hash-studio');
  });

  it('detects 32-char MD5 hash', () => {
    const md5 = '5d41402abc4b2a76b9719d911017c592';
    const res = StandaloneSmartDispatcher.detectBase64OrHex(md5);
    expect(res).not.toBeNull();
    expect(res.format).toBe('md5');
  });

  it('detects Base64 payload and creates decoded preview', () => {
    const b64 = Buffer.from('ZenDev Enterprise Desktop SaaS 2026').toString('base64');
    const res = StandaloneSmartDispatcher.detectBase64OrHex(b64);
    expect(res).not.toBeNull();
    expect(res.format).toBe('base64');
    expect(res.decodedPreview).toContain('ZenDev');
  });
});

console.log('\n================================================================');
console.log(`SMART DISPATCHER HARNESS RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
