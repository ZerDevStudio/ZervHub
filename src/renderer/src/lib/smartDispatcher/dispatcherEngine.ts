/**
 * ZenDev Enterprise SaaS — AI Smart Dispatcher & Heuristic Classifier Engine
 * Privacy-first contextual payload analyzer: detects cURL, JWT, valid/malformed JSON,
 * SQL queries, stacktraces, and Base64/Hex hashes with remediation actions.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 4: Diferansiyasyon & B2B Moat)
 */

import {
  DispatchedPayload,
  CurlDispatchedPayload,
  JwtDispatchedPayload,
  JsonDispatchedPayload,
  MalformedJsonDispatchedPayload,
  SqlDispatchedPayload,
  StacktraceDispatchedPayload,
  Base64HexDispatchedPayload,
  ColorDispatchedPayload,
  MathDispatchedPayload
} from './types'

export class SmartDispatcherEngine {
  /**
   * 1. Detects and parses cURL command lines into API Studio requests.
   */
  public static detectCurl(input: string): CurlDispatchedPayload | null {
    const trimmed = input.trim()
    if (!trimmed.startsWith('curl ') && !trimmed.startsWith('curl\n') && !trimmed.startsWith('curl\r\n')) {
      return null
    }

    try {
      // Normalize line breaks and backslash continuations
      const normalized = trimmed.replace(/\\\r?\n/g, ' ')

      // Extract Method
      let method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET'
      const methodMatch = normalized.match(/(?:-X|--request)\s+([A-Z]+)/i)
      if (methodMatch) {
        const parsedMethod = methodMatch[1].toUpperCase()
        if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(parsedMethod)) {
          method = parsedMethod as any
        }
      }

      // Extract Headers
      const headers: Record<string, string> = {}
      const headerMatches = [...normalized.matchAll(/(?:-H|--header)\s+['"]([^'"]+)['"]/g)]
      for (const m of headerMatches) {
        const parts = m[1].split(':')
        if (parts.length >= 2) {
          const headerName = parts[0].trim()
          const headerVal = parts.slice(1).join(':').trim()
          headers[headerName] = headerVal
        }
      }

      // Extract Body / Data
      let body: string | undefined = undefined
      const dataMatch = normalized.match(/(?:-d|--data|--data-raw|--data-binary)\s+(['"])([\s\S]*?)\1/)
      if (dataMatch) {
        body = dataMatch[2]
        if (method === 'GET') {
          method = 'POST' // Implicit POST if data is provided without explicit -X
        }
      }

      // Extract URL
      let url = ''
      const urlMatches = normalized.match(/https?:\/\/[^\s'"<>]+/i)
      if (urlMatches) {
        url = urlMatches[0]
      } else {
        // Fallback: look for quoted token or word starting with / or localhost
        const localMatch = normalized.match(/(?:localhost|127\.0\.0\.1|::1)[^\s'"]*/i)
        if (localMatch) {
          url = `http://${localMatch[0]}`
        }
      }

      if (!url) return null

      return {
        type: 'curl',
        raw: trimmed,
        method,
        url,
        headers,
        body,
        targetRoute: '/api-studio',
        summary: `${method} ${url}`
      }
    } catch {
      return null
    }
  }

  /**
   * 2. Detects JWT Tokens, decodes payload and checks expiration status.
   */
  public static detectJwt(input: string): JwtDispatchedPayload | null {
    const trimmed = input.trim()
    if (!trimmed.startsWith('eyJ') && !trimmed.includes('.eyJ')) return null

    const parts = trimmed.split('.')
    if (parts.length !== 3) return null

    try {
      const base64UrlDecode = (str: string) => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
        while (base64.length % 4 !== 0) base64 += '='
        if (typeof atob !== 'undefined') {
          return decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
        }
        return Buffer.from(base64, 'base64').toString('utf8')
      }

      const headerJson = base64UrlDecode(parts[0])
      const payloadJson = base64UrlDecode(parts[1])

      const header = JSON.parse(headerJson)
      const payload = JSON.parse(payloadJson)

      if (!header || !payload || typeof header !== 'object' || typeof payload !== 'object') {
        return null
      }

      const algorithm = header.alg || 'UNKNOWN'
      const subject = payload.sub
      const issuer = payload.iss

      let isExpired: boolean | undefined = undefined
      let expiresAt: string | undefined = undefined

      if (payload.exp && typeof payload.exp === 'number') {
        const expMs = payload.exp * 1000
        isExpired = Date.now() > expMs
        expiresAt = new Date(expMs).toISOString()
      }

      return {
        type: 'jwt',
        raw: trimmed,
        header,
        payload,
        signature: parts[2],
        algorithm,
        subject,
        issuer,
        expiresAt,
        isExpired,
        targetRoute: '/jwt-studio'
      }
    } catch {
      return null
    }
  }

  /**
   * 3. Detects valid JSON objects or arrays.
   */
  public static detectValidJson(input: string): JsonDispatchedPayload | null {
    const trimmed = input.trim()
    if (trimmed.length < 2) return null

    const startsObject = trimmed.startsWith('{') && trimmed.endsWith('}')
    const startsArray = trimmed.startsWith('[') && trimmed.endsWith(']')
    if (!startsObject && !startsArray) return null

    try {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed !== 'object' || parsed === null) return null

      const isArray = Array.isArray(parsed)
      const isObject = !isArray && typeof parsed === 'object'
      const itemCount = isArray ? parsed.length : Object.keys(parsed).length
      const formatted = JSON.stringify(parsed, null, 2)
      const minified = JSON.stringify(parsed)
      const byteSize = new TextEncoder().encode(trimmed).length

      return {
        type: 'json',
        raw: trimmed,
        formatted,
        minified,
        byteSize,
        itemCount,
        isObject,
        isArray,
        targetRoute: '/json-studio'
      }
    } catch {
      return null
    }
  }

  /**
   * 4. Detects malformed/broken JSON syntax and applies intelligent auto-repair heuristics.
   */
  public static detectMalformedJson(input: string): MalformedJsonDispatchedPayload | null {
    const trimmed = input.trim()
    if (trimmed.length < 3) return null

    // Don't flag if it's already valid JSON
    try {
      JSON.parse(trimmed)
      return null
    } catch (parseErr: any) {
      // Looks like an object or array candidate
      const looksLikeJson =
        (trimmed.startsWith('{') || trimmed.startsWith('[')) ||
        (trimmed.includes(':') && (trimmed.includes('{') || trimmed.includes('}'))) ||
        /^[a-zA-Z0-9_]+\s*:\s*['"]?[a-zA-Z0-9_]+['"]?/.test(trimmed)

      if (!looksLikeJson) return null

      // Attempt smart repair heuristics:
      let candidate = trimmed

      // 1. Wrap unbracketed key-values in braces if needed
      if (!candidate.startsWith('{') && !candidate.startsWith('[') && candidate.includes(':')) {
        candidate = `{ ${candidate} }`
      }

      // 2. Replace single quotes on keys and strings with double quotes
      candidate = candidate.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')

      // 3. Quote unquoted object keys: { foo: 1 } -> { "foo": 1 }
      candidate = candidate.replace(/([{\s,])([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')

      // 4. Remove trailing commas before closing braces/brackets
      candidate = candidate.replace(/,\s*([\]}])/g, '$1')

      // 5. Balance missing closing brace/bracket if simple off-by-one
      const openBraces = (candidate.match(/\{/g) || []).length
      const closeBraces = (candidate.match(/\}/g) || []).length
      if (openBraces > closeBraces) {
        candidate += '}'.repeat(openBraces - closeBraces)
      }

      const openBrackets = (candidate.match(/\[/g) || []).length
      const closeBrackets = (candidate.match(/\]/g) || []).length
      if (openBrackets > closeBrackets) {
        candidate += ']'.repeat(openBrackets - closeBrackets)
      }

      let canAutoRepair = false
      let repairedText: string | undefined = undefined
      let repairReason: string | undefined = undefined

      try {
        const repairedObj = JSON.parse(candidate)
        canAutoRepair = true
        repairedText = JSON.stringify(repairedObj, null, 2)
        repairReason = 'Tek tırnaklar, tırnaksız anahtarlar veya fazlalık virgüller otomatik onarıldı.'
      } catch {}

      return {
        type: 'malformed_json',
        raw: trimmed,
        errorSnippet: parseErr.message || 'JSON Sözdizimi Hatası',
        canAutoRepair,
        repairedText,
        repairReason,
        targetRoute: '/json-studio'
      }
    }
  }

  /**
   * 5. Detects SQL Queries (SELECT, INSERT, UPDATE, DELETE, CREATE, etc.).
   */
  public static detectSql(input: string): SqlDispatchedPayload | null {
    const trimmed = input.trim()
    const sqlPattern = /^(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\b/i
    const match = trimmed.match(sqlPattern)

    if (!match) return null

    const statementType = match[1].toUpperCase().split(/\s+/)[0] as any

    // Extract table names heuristically
    const tables: string[] = []
    const fromMatches = [...trimmed.matchAll(/(?:FROM|INTO|UPDATE|TABLE)\s+([a-zA-Z0-9_."`]+)/gi)]
    for (const fm of fromMatches) {
      const tbl = fm[1].replace(/["`]/g, '')
      if (!tables.includes(tbl)) {
        tables.push(tbl)
      }
    }

    return {
      type: 'sql',
      raw: trimmed,
      statementType,
      tables,
      formatted: trimmed
    }
  }

  /**
   * 6. Detects error stacktraces (Node, Python, Rust, Go, Java).
   */
  public static detectStacktrace(input: string): StacktraceDispatchedPayload | null {
    const trimmed = input.trim()
    const isStack =
      /^(?:(?:[a-zA-Z]+)?Error|Exception|panic):\s+/m.test(trimmed) ||
      /\bat\s+(?:[a-zA-Z0-9_$.<>]+|\/|[a-zA-Z]:\\)\s*\([^)]+:\d+:\d+\)/m.test(trimmed) ||
      /Traceback \(most recent call last\):/m.test(trimmed) ||
      /goroutine \d+ \[[^\]]+\]:/m.test(trimmed)

    if (!isStack) return null

    // Extract error name and message from first line
    const lines = trimmed.split('\n')
    const firstLine = lines[0].trim()
    let errorName = 'Error'
    let errorMessage = firstLine

    const errMatch = firstLine.match(/^([A-Za-z0-9_]+(?:Error|Exception)):\s*(.*)/)
    if (errMatch) {
      errorName = errMatch[1]
      errorMessage = errMatch[2]
    }

    // Extract culprit file and line
    let culpritFile: string | undefined
    let culpritLine: number | undefined
    const culpritMatch = trimmed.match(/(?:at\s+.*?\()?([a-zA-Z0-9_./\\-]+\.[a-zA-Z]{1,5}):(\d+)(?::\d+)?\)?/)
    if (culpritMatch) {
      culpritFile = culpritMatch[1].replace(/^.*[/\\]/, '')
      culpritLine = parseInt(culpritMatch[2], 10)
    }

    // Sanitize user paths
    const sanitized = trimmed
      .replace(/([a-zA-Z]:\\(?:Users|Documents and Settings)\\[^\\]+)/gi, '[USER_DIR]')
      .replace(/(\/(?:Users|home)\/[^/\s]+)/gi, '[USER_DIR]')

    return {
      type: 'stacktrace',
      raw: trimmed,
      errorName,
      errorMessage,
      culpritFile,
      culpritLine,
      sanitized
    }
  }

  /**
   * 7. Detects Base64 strings and Cryptographic Hashes (SHA-256, MD5, Hex).
   */
  public static detectBase64OrHex(input: string): Base64HexDispatchedPayload | null {
    const trimmed = input.trim()

    // SHA-256 (64 hex characters)
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return {
        type: 'base64_hex',
        raw: trimmed,
        format: 'sha256',
        targetRoute: '/hash-studio'
      }
    }

    // MD5 (32 hex characters)
    if (/^[0-9a-fA-F]{32}$/.test(trimmed)) {
      return {
        type: 'base64_hex',
        raw: trimmed,
        format: 'md5',
        targetRoute: '/hash-studio'
      }
    }

    // Base64 (length >= 24, valid alphabet and padding)
    if (
      trimmed.length >= 24 &&
      trimmed.length % 4 === 0 &&
      /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) &&
      !trimmed.includes(' ')
    ) {
      try {
        let decoded = ''
        if (typeof atob !== 'undefined') {
          decoded = atob(trimmed)
        } else {
          decoded = Buffer.from(trimmed, 'base64').toString('utf8')
        }

        // Verify decoded string is predominantly printable characters
        const printableCount = decoded.replace(/[\x20-\x7E\r\n\t]/g, '').length
        if (printableCount / decoded.length < 0.2) {
          return {
            type: 'base64_hex',
            raw: trimmed,
            format: 'base64',
            decodedPreview: decoded.substring(0, 100),
            targetRoute: '/encoding-studio'
          }
        }
      } catch {}
    }

    return null
  }

  /**
   * Main Dispatch Classifier: Evaluates inputs against all studios in priority order.
   */
  public static dispatch(input: string): DispatchedPayload | null {
    if (!input || !input.trim()) return null

    // 1. cURL
    const curl = this.detectCurl(input)
    if (curl) return curl

    // 2. JWT
    const jwt = this.detectJwt(input)
    if (jwt) return jwt

    // 3. Valid JSON
    const validJson = this.detectValidJson(input)
    if (validJson) return validJson

    // 4. Malformed JSON with Auto-Repair
    const malformedJson = this.detectMalformedJson(input)
    if (malformedJson) return malformedJson

    // 5. SQL Query
    const sql = this.detectSql(input)
    if (sql) return sql

    // 6. Stacktrace
    const stacktrace = this.detectStacktrace(input)
    if (stacktrace) return stacktrace

    // 7. Base64 / Hex / Hash
    const base64Hex = this.detectBase64OrHex(input)
    if (base64Hex) return base64Hex

    return null
  }
}
