/**
 * ZenDev Privacy-First Telemetry & Crash Reporting Test Suite
 * Tests opt-in consent gates, strict PII redaction, breadcrumbs queue, and diagnostic audit logs.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 3: Table Stakes SaaS Altyapısı)
 */

import { describe, it, expect, beforeEach } from 'vitest'

export interface TelemetryConsent {
  enabled: boolean
  crashReporting: boolean
  performanceMetrics: boolean
  anonymousUsage: boolean
}

export interface TelemetryBreadcrumb {
  category: string
  message: string
  level: string
  timestamp: number
}

export interface CrashReport {
  id: string
  errorMessage: string
  stackTrace?: string
  breadcrumbs: TelemetryBreadcrumb[]
  sanitized: boolean
}

export class TelemetrySanitizer {
  private static readonly WINDOWS_USER_PATH_REGEX = /([a-zA-Z]:\\(?:Users|Documents and Settings)\\[^\\]+)/gi
  private static readonly UNIX_USER_PATH_REGEX = /(\/(?:Users|home)\/[^/\s]+)/gi
  private static readonly EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
  private static readonly JWT_REGEX = /\beyJ[a-zA-Z0-9_-]{5,}\.eyJ[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{10,}\b/gi
  private static readonly BEARER_TOKEN_REGEX = /Bearer\s+[a-zA-Z0-9_\-\.~+/]+=*/gi
  private static readonly IP_V4_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/gi
  private static readonly API_KEY_REGEX = /\b(?:zen|sec|ghp|tauri|apikey)_[a-zA-Z0-9_]{16,}\b/gi

  public static sanitize(text: string): string {
    if (!text) return ''
    let out = text
    out = out.replace(this.WINDOWS_USER_PATH_REGEX, (match) => {
      const drive = match.split('\\').slice(0, 2).join('\\')
      return `${drive}\\[REDACTED]`
    })
    out = out.replace(this.UNIX_USER_PATH_REGEX, (match) => {
      const prefix = match.split('/')[1]
      return `/${prefix}/[REDACTED]`
    })
    out = out.replace(this.EMAIL_REGEX, '[EMAIL_REDACTED]')
    out = out.replace(this.JWT_REGEX, '[JWT_REDACTED]')
    out = out.replace(this.BEARER_TOKEN_REGEX, 'Bearer [TOKEN_REDACTED]')
    out = out.replace(this.API_KEY_REGEX, '[KEY_REDACTED]')
    out = out.replace(this.IP_V4_REGEX, '[IP_REDACTED]')
    return out
  }

  public static sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const res: Record<string, any> = {}
    for (const [k, v] of Object.entries(obj)) {
      const lower = k.toLowerCase()
      if (lower.includes('password') || lower.includes('secret') || lower.includes('token')) {
        res[k] = '[REDACTED]'
      } else if (typeof v === 'string') {
        res[k] = this.sanitize(v)
      } else {
        res[k] = v
      }
    }
    return res
  }
}

export class MockTelemetryManager {
  public consent: TelemetryConsent = {
    enabled: false,
    crashReporting: false,
    performanceMetrics: false,
    anonymousUsage: false
  }
  public breadcrumbs: TelemetryBreadcrumb[] = []
  public auditLogs: any[] = []

  public addBreadcrumb(category: string, message: string) {
    this.breadcrumbs.push({
      category,
      message: TelemetrySanitizer.sanitize(message),
      level: 'info',
      timestamp: Date.now()
    })
    if (this.breadcrumbs.length > 25) {
      this.breadcrumbs.shift()
    }
  }

  public captureError(error: Error): CrashReport | null {
    if (!this.consent.enabled || !this.consent.crashReporting) {
      return null
    }

    const report: CrashReport = {
      id: `err_${Date.now()}`,
      errorMessage: TelemetrySanitizer.sanitize(error.message),
      stackTrace: error.stack ? TelemetrySanitizer.sanitize(error.stack) : undefined,
      breadcrumbs: [...this.breadcrumbs],
      sanitized: true
    }

    this.auditLogs.unshift(report)
    return report
  }

  public captureEvent(name: string, properties: Record<string, any> = {}): any | null {
    if (!this.consent.enabled || !this.consent.anonymousUsage) {
      return null
    }

    const evt = {
      name: TelemetrySanitizer.sanitize(name),
      properties: TelemetrySanitizer.sanitizeObject(properties),
      timestamp: Date.now()
    }

    this.auditLogs.unshift(evt)
    return evt
  }

  public clearLogs() {
    this.auditLogs = []
  }
}

describe('ZenDev Privacy-First Telemetry Engine', () => {
  let manager: MockTelemetryManager

  beforeEach(() => {
    manager = new MockTelemetryManager()
  })

  describe('1. Opt-in Consent Enforcement', () => {
    it('defaults to strictly disabled (zero diagnostic data collected)', () => {
      expect(manager.consent.enabled).toBe(false)
      expect(manager.consent.crashReporting).toBe(false)
      expect(manager.consent.anonymousUsage).toBe(false)
    })

    it('drops error reports and events when consent is disabled', () => {
      const err = new Error('Test unhandled crash')
      const report = manager.captureError(err)
      expect(report).toBeNull()
      expect(manager.auditLogs.length).toBe(0)

      const evt = manager.captureEvent('studio_opened', { studio: 'json' })
      expect(evt).toBeNull()
      expect(manager.auditLogs.length).toBe(0)
    })

    it('captures sanitized reports only when explicitly opted in', () => {
      manager.consent.enabled = true
      manager.consent.crashReporting = true

      const err = new Error('Database connection failed')
      const report = manager.captureError(err)
      expect(report).not.toBeNull()
      expect(report?.errorMessage).toBe('Database connection failed')
      expect(manager.auditLogs.length).toBe(1)
    })
  })

  describe('2. Strict PII Redaction & Sanitization', () => {
    it('redacts Windows user directory paths from stack traces', () => {
      const raw = 'Error at C:\\Users\\berke\\AppData\\Local\\ZenDev\\index.js:42:15'
      const sanitized = TelemetrySanitizer.sanitize(raw)
      expect(sanitized).toBe('Error at C:\\Users\\[REDACTED]\\AppData\\Local\\ZenDev\\index.js:42:15')
    })

    it('redacts Unix/macOS user directory paths', () => {
      const raw = 'Failed to load file at /Users/sarah_j/Documents/api_keys.json'
      const sanitized = TelemetrySanitizer.sanitize(raw)
      expect(sanitized).toBe('Failed to load file at /Users/[REDACTED]/Documents/api_keys.json')
    })

    it('redacts email addresses, JWT tokens, Bearer headers, and API keys', () => {
      const emailText = 'Notification sent to developer@zerdev.app successfully'
      expect(TelemetrySanitizer.sanitize(emailText)).toBe('Notification sent to [EMAIL_REDACTED] successfully')

      const jwtText = 'Invalid signature in eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c token'
      expect(TelemetrySanitizer.sanitize(jwtText)).toContain('[JWT_REDACTED]')

      const bearerText = 'Header Authorization: Bearer secret-auth-token-1234567890'
      expect(TelemetrySanitizer.sanitize(bearerText)).toBe('Header Authorization: Bearer [TOKEN_REDACTED]')

      const apiKeyText = 'Auth failed with key zen_sec_998877665544332211aabbcc'
      expect(TelemetrySanitizer.sanitize(apiKeyText)).toBe('Auth failed with key [KEY_REDACTED]')

      const ipText = 'Connection refused from 192.168.1.104 port 8080'
      expect(TelemetrySanitizer.sanitize(ipText)).toBe('Connection refused from [IP_REDACTED] port 8080')
    })

    it('sanitizes password and secret properties in objects', () => {
      const obj = {
        username: 'admin',
        password: 'SuperSecretPassword123!',
        apiSecret: 'zen_sec_1234567890abcdef12',
        email: 'test@domain.com'
      }
      const cleaned = TelemetrySanitizer.sanitizeObject(obj)
      expect(cleaned.username).toBe('admin')
      expect(cleaned.password).toBe('[REDACTED]')
      expect(cleaned.apiSecret).toBe('[REDACTED]')
      expect(cleaned.email).toBe('[EMAIL_REDACTED]')
    })
  })

  describe('3. Circular Breadcrumbs Queue & Audit Log', () => {
    it('caps breadcrumbs buffer at maximum capacity (25)', () => {
      for (let i = 0; i < 30; i++) {
        manager.addBreadcrumb('action', `Step ${i}`)
      }
      expect(manager.breadcrumbs.length).toBe(25)
      expect(manager.breadcrumbs[0].message).toBe('Step 5')
      expect(manager.breadcrumbs[24].message).toBe('Step 29')
    })

    it('clears diagnostic logs when purged', () => {
      manager.clearLogs()
      manager.consent.enabled = true
      manager.consent.crashReporting = true
      manager.captureError(new Error('Sample error'))
      expect(manager.auditLogs.length).toBe(1)

      manager.clearLogs()
      expect(manager.auditLogs.length).toBe(0)
    })
  })
})
