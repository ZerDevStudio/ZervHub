/**
 * ZenDev Privacy-First Telemetry & Crash Reporting Manager
 * Opt-in by default, zero personal identifier leakage, client-side audit logs.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 3: Table Stakes SaaS Altyapısı)
 */

import {
  TelemetryConsent,
  CrashReport,
  TelemetryEvent,
  TelemetryBreadcrumb,
  DiagnosticPayload,
  BreadcrumbCategory,
  BreadcrumbLevel
} from './types'
import { TelemetrySanitizer } from './sanitizer'

const STORAGE_KEYS = {
  CONSENT: 'zendev_telemetry_consent',
  INSTALLATION_ID: 'zendev_telemetry_installation_id',
  AUDIT_LOG: 'zendev_telemetry_audit_log'
}

const MAX_BREADCRUMBS = 25
const MAX_AUDIT_ENTRIES = 50
const APP_VERSION = 'v2.5.6'

export class TelemetryManager {
  private installationId: string
  private breadcrumbs: TelemetryBreadcrumb[] = []
  private isInitialized = false

  constructor() {
    this.installationId = this.resolveInstallationId()
  }

  private resolveInstallationId(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INSTALLATION_ID)
      if (stored) return stored
      const newId = `inst_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`
      localStorage.setItem(STORAGE_KEYS.INSTALLATION_ID, newId)
      return newId
    } catch {
      return 'inst_anon_session'
    }
  }

  public getInstallationId(): string {
    return this.installationId
  }

  public getConsent(): TelemetryConsent {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONSENT)
      if (raw) return JSON.parse(raw)
    } catch {}

    // GDPR / KVKK strictly requires opt-in (default disabled)
    return {
      enabled: false,
      crashReporting: false,
      performanceMetrics: false,
      anonymousUsage: false,
      updatedAt: Date.now()
    }
  }

  public setConsent(partial: Partial<TelemetryConsent>): TelemetryConsent {
    const current = this.getConsent()
    const updated: TelemetryConsent = {
      ...current,
      ...partial,
      updatedAt: Date.now()
    }

    try {
      localStorage.setItem(STORAGE_KEYS.CONSENT, JSON.stringify(updated))
      this.broadcast('zendev:telemetry-consent-changed', { consent: updated })
    } catch {}

    return updated
  }

  public initGlobalListeners(): void {
    if (this.isInitialized || typeof window === 'undefined') return
    this.isInitialized = true

    // Capture global unhandled exceptions
    window.addEventListener('error', (event: ErrorEvent) => {
      if (event.error) {
        this.captureError(event.error)
      } else if (event.message) {
        this.captureError(new Error(event.message))
      }
    })

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (reason instanceof Error) {
        this.captureError(reason)
      } else {
        this.captureError(new Error(String(reason || 'Unhandled Promise Rejection')))
      }
    })

    this.addBreadcrumb('system', 'App boot initialized with privacy-first telemetry', 'info')
  }

  public addBreadcrumb(category: BreadcrumbCategory, message: string, level: BreadcrumbLevel = 'info'): void {
    const sanitizedMsg = TelemetrySanitizer.sanitize(message)
    const breadcrumb: TelemetryBreadcrumb = {
      category,
      message: sanitizedMsg,
      level,
      timestamp: Date.now()
    }

    this.breadcrumbs.push(breadcrumb)
    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs.shift()
    }
  }

  public captureError(error: Error | string, componentStack?: string): CrashReport | null {
    const consent = this.getConsent()
    if (!consent.enabled || !consent.crashReporting) {
      return null
    }

    const errObj = typeof error === 'string' ? new Error(error) : error
    const rawMessage = errObj.message || 'Unknown Error'
    const rawStack = errObj.stack || ''

    const report: CrashReport = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      errorName: errObj.name || 'Error',
      errorMessage: TelemetrySanitizer.sanitize(rawMessage),
      stackTrace: rawStack ? TelemetrySanitizer.sanitize(rawStack) : undefined,
      componentStack: componentStack ? TelemetrySanitizer.sanitize(componentStack) : undefined,
      appVersion: APP_VERSION,
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'desktop',
      breadcrumbs: [...this.breadcrumbs],
      sanitized: true
    }

    this.recordAuditPayload('crash', report)
    return report
  }

  public captureEvent(
    eventName: string,
    category: 'studio' | 'performance' | 'lifecycle',
    properties?: Record<string, string | number | boolean>
  ): TelemetryEvent | null {
    const consent = this.getConsent()
    if (!consent.enabled || !consent.anonymousUsage) {
      return null
    }

    const sanitizedProps = properties ? TelemetrySanitizer.sanitizeObject(properties) : undefined

    const event: TelemetryEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventName: TelemetrySanitizer.sanitize(eventName),
      category,
      timestamp: Date.now(),
      properties: sanitizedProps
    }

    this.recordAuditPayload('event', event)
    return event
  }

  private recordAuditPayload(type: 'crash' | 'event', payload: CrashReport | TelemetryEvent): void {
    const diagnostic: DiagnosticPayload = {
      installationId: this.installationId,
      timestamp: Date.now(),
      type,
      payload
    }

    const logs = this.getAuditLog()
    logs.unshift(diagnostic)
    if (logs.length > MAX_AUDIT_ENTRIES) {
      logs.pop()
    }

    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(logs))
      this.broadcast('zendev:telemetry-audit-updated', { logs })
    } catch {}
  }

  public getAuditLog(): DiagnosticPayload[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG)
      if (raw) return JSON.parse(raw)
    } catch {}
    return []
  }

  public clearAuditLog(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUDIT_LOG)
      this.broadcast('zendev:telemetry-audit-updated', { logs: [] })
    } catch {}
  }

  public exportAuditLogJson(): string {
    const logs = this.getAuditLog()
    return JSON.stringify(
      {
        installationId: this.installationId,
        exportedAt: new Date().toISOString(),
        totalEntries: logs.length,
        entries: logs
      },
      null,
      2
    )
  }

  private broadcast(eventName: string, detail: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }))
    }
  }
}

export const telemetryManager = new TelemetryManager()
