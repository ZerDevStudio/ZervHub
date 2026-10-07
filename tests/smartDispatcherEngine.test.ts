/**
 * ZenDev Enterprise SaaS — AI Smart Dispatcher Engine Test Suite
 * Tests cURL parsing, JWT decoding & expiry flags, valid/malformed JSON auto-repair,
 * SQL statement classification, stacktrace extraction & PII redaction, and Base64/Hash heuristics.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 4: Diferansiyasyon & B2B Moat)
 */

import { describe, it, expect } from 'vitest'
import { SmartDispatcherEngine } from '../src/renderer/src/lib/smartDispatcher/dispatcherEngine'

describe('AI Smart Dispatcher & Heuristic Classifier Engine', () => {
  describe('1. cURL Command Parsing', () => {
    it('parses cURL with explicit POST method, headers, and json body', () => {
      const curlCmd = `curl -X POST https://api.zendev.run/v1/payments \\
        -H "Content-Type: application/json" \\
        -H "Authorization: Bearer zen_sec_mock_token" \\
        -d '{"amount": 250, "currency": "USD"}'`

      const res = SmartDispatcherEngine.detectCurl(curlCmd)
      expect(res).not.toBeNull()
      expect(res?.type).toBe('curl')
      expect(res?.method).toBe('POST')
      expect(res?.url).toBe('https://api.zendev.run/v1/payments')
      expect(res?.headers['Content-Type']).toBe('application/json')
      expect(res?.headers['Authorization']).toBe('Bearer zen_sec_mock_token')
      expect(res?.body).toBe('{"amount": 250, "currency": "USD"}')
      expect(res?.targetRoute).toBe('/api-studio')
    })

    it('infers POST method when -d is supplied without explicit -X flag', () => {
      const curlCmd = `curl https://httpbin.org/post -d "param1=val&param2=123"`
      const res = SmartDispatcherEngine.detectCurl(curlCmd)
      expect(res).not.toBeNull()
      expect(res?.method).toBe('POST')
      expect(res?.url).toBe('https://httpbin.org/post')
      expect(res?.body).toBe('param1=val&param2=123')
    })

    it('returns null for non-curl inputs', () => {
      expect(SmartDispatcherEngine.detectCurl('fetch("https://api.com")')).toBeNull()
      expect(SmartDispatcherEngine.detectCurl('GET /api/v1/users HTTP/1.1')).toBeNull()
    })
  })

  describe('2. JWT Decoding & Expiry Detection', () => {
    it('detects JWT token, parses header/payload and marks expired token', () => {
      // Past expiration token (exp: 1516239022 -> year 2018)
      const expiredJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4S8lPjR7Gf8p7G7qjQ9P7G7qjQ9P7G7qjQ9P7G7qjQ8'
      const res = SmartDispatcherEngine.detectJwt(expiredJwt)
      expect(res).not.toBeNull()
      expect(res?.type).toBe('jwt')
      expect(res?.algorithm).toBe('HS256')
      expect(res?.subject).toBe('1234567890')
      expect(res?.isExpired).toBe(true)
      expect(res?.targetRoute).toBe('/jwt-studio')
    })

    it('returns null for non-JWT strings', () => {
      expect(SmartDispatcherEngine.detectJwt('not.a.valid.jwt.token')).toBeNull()
      expect(SmartDispatcherEngine.detectJwt('eyJhbGciOiJIUzI1NiJ9')).toBeNull()
    })
  })

  describe('3. Valid JSON Detection', () => {
    it('detects valid JSON object and computes metrics', () => {
      const json = '{"service": "auth", "replicas": 3, "enabled": true}'
      const res = SmartDispatcherEngine.detectValidJson(json)
      expect(res).not.toBeNull()
      expect(res?.type).toBe('json')
      expect(res?.isObject).toBe(true)
      expect(res?.itemCount).toBe(3)
      expect(res?.minified).toBe('{"service":"auth","replicas":3,"enabled":true}')
      expect(res?.targetRoute).toBe('/json-studio')
    })
  })

  describe('4. Malformed JSON Auto-Repair Heuristics', () => {
    it('repairs single-quoted keys and strings into valid JSON', () => {
      const malformed = "{'name': 'ZenDev', 'version': '2.5.6'}"
      const res = SmartDispatcherEngine.detectMalformedJson(malformed)
      expect(res).not.toBeNull()
      expect(res?.type).toBe('malformed_json')
      expect(res?.canAutoRepair).toBe(true)
      expect(res?.repairedText).toBeDefined()
      const parsed = JSON.parse(res?.repairedText!)
      expect(parsed.name).toBe('ZenDev')
      expect(parsed.version).toBe('2.5.6')
    })

    it('repairs unquoted object keys and trailing commas', () => {
      const malformed = '{ status: 200, active: true, }'
      const res = SmartDispatcherEngine.detectMalformedJson(malformed)
      expect(res).not.toBeNull()
      expect(res?.canAutoRepair).toBe(true)
      const parsed = JSON.parse(res?.repairedText!)
      expect(parsed.status).toBe(200)
      expect(parsed.active).toBe(true)
    })

    it('balances missing closing brace', () => {
      const unclosed = '{"key": "value"'
      const res = SmartDispatcherEngine.detectMalformedJson(unclosed)
      expect(res).not.toBeNull()
      expect(res?.canAutoRepair).toBe(true)
      const parsed = JSON.parse(res?.repairedText!)
      expect(parsed.key).toBe('value')
    })
  })

  describe('5. SQL Statement Detection', () => {
    it('detects SELECT query and extracts tables', () => {
      const query = 'SELECT id, email, created_at FROM users WHERE active = 1 ORDER BY id DESC'
      const res = SmartDispatcherEngine.detectSql(query)
      expect(res).not.toBeNull()
      expect(res?.type).toBe('sql')
      expect(res?.statementType).toBe('SELECT')
      expect(res?.tables).toContain('users')
    })

    it('detects INSERT INTO query and target table', () => {
      const query = 'INSERT INTO orders (id, amount) VALUES (42, 199.5)'
      const res = SmartDispatcherEngine.detectSql(query)
      expect(res).not.toBeNull()
      expect(res?.statementType).toBe('INSERT')
      expect(res?.tables).toContain('orders')
    })
  })

  describe('6. Stacktrace Detection & PII Sanitization', () => {
    it('extracts error name, culprit file/line and redacts user home directories', () => {
      const stack = `TypeError: Cannot read properties of undefined (reading 'sign')
    at PipelineService.execute (C:\\Users\\Developer\\ZenDev\\src\\pipeline.ts:148:22)
    at Module._compile (node:internal/modules/cjs/loader:1356:14)`

      const res = SmartDispatcherEngine.detectStacktrace(stack)
      expect(res).not.toBeNull()
      expect(res?.type).toBe('stacktrace')
      expect(res?.errorName).toBe('TypeError')
      expect(res?.culpritFile).toBe('pipeline.ts')
      expect(res?.culpritLine).toBe(148)
      expect(res?.sanitized).not.toContain('C:\\Users\\Developer')
      expect(res?.sanitized).toContain('[USER_DIR]')
    })
  })

  describe('7. Base64 & Hash Detection', () => {
    it('detects 64-char SHA-256 hash', () => {
      const sha256 = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9'
      const res = SmartDispatcherEngine.detectBase64OrHex(sha256)
      expect(res).not.toBeNull()
      expect(res?.format).toBe('sha256')
      expect(res?.targetRoute).toBe('/hash-studio')
    })

    it('detects 32-char MD5 hash', () => {
      const md5 = '5d41402abc4b2a76b9719d911017c592'
      const res = SmartDispatcherEngine.detectBase64OrHex(md5)
      expect(res).not.toBeNull()
      expect(res?.format).toBe('md5')
      expect(res?.targetRoute).toBe('/hash-studio')
    })

    it('detects Base64 encoded payload and generates decoded preview', () => {
      const b64 = Buffer.from('ZenDev Enterprise Desktop SaaS 2026').toString('base64')
      const res = SmartDispatcherEngine.detectBase64OrHex(b64)
      expect(res).not.toBeNull()
      expect(res?.format).toBe('base64')
      expect(res?.decodedPreview).toContain('ZenDev')
      expect(res?.targetRoute).toBe('/encoding-studio')
    })
  })
})
