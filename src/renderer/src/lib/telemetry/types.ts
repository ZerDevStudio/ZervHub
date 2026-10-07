/**
 * ZenDev Enterprise SaaS — Privacy-First Telemetry & Crash Reporting Types
 * Opt-in only, 100% GDPR/KVKK compliant, strict PII redaction.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 3: Table Stakes SaaS Altyapısı)
 */

export interface TelemetryConsent {
  enabled: boolean              // Master opt-in toggle (strictly false by default)
  crashReporting: boolean       // Unhandled exceptions and React render panics
  performanceMetrics: boolean   // Boot time, memory footprint, studio transition times
  anonymousUsage: boolean       // Studio usage frequency (e.g. studio_opened: json)
  updatedAt: number
}

export type BreadcrumbLevel = 'info' | 'warn' | 'error'
export type BreadcrumbCategory = 'navigation' | 'studio' | 'action' | 'system'

export interface TelemetryBreadcrumb {
  category: BreadcrumbCategory
  message: string
  level: BreadcrumbLevel
  timestamp: number
}

export interface CrashReport {
  id: string
  timestamp: number
  errorName: string
  errorMessage: string
  stackTrace?: string
  componentStack?: string
  appVersion: string
  platform: string
  breadcrumbs: TelemetryBreadcrumb[]
  sanitized: boolean
}

export interface TelemetryEvent {
  id: string
  eventName: string
  category: 'studio' | 'performance' | 'lifecycle'
  timestamp: number
  properties?: Record<string, string | number | boolean>
}

export interface DiagnosticPayload {
  installationId: string
  timestamp: number
  type: 'crash' | 'event'
  payload: CrashReport | TelemetryEvent
}
