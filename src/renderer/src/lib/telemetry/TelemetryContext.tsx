/**
 * ZenDev Privacy-First Telemetry — React Context Provider
 * Gives UI components access to consent toggles, breadcrumb logging, and diagnostic payload inspection.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 3: Table Stakes SaaS Altyapısı)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  TelemetryConsent,
  CrashReport,
  TelemetryEvent,
  DiagnosticPayload,
  BreadcrumbCategory,
  BreadcrumbLevel
} from './types'
import { telemetryManager } from './telemetryManager'

interface TelemetryContextValue {
  consent: TelemetryConsent
  installationId: string
  updateConsent: (partial: Partial<TelemetryConsent>) => void
  captureError: (error: Error | string, componentStack?: string) => CrashReport | null
  captureEvent: (
    eventName: string,
    category: 'studio' | 'performance' | 'lifecycle',
    properties?: Record<string, string | number | boolean>
  ) => TelemetryEvent | null
  addBreadcrumb: (category: BreadcrumbCategory, message: string, level?: BreadcrumbLevel) => void
  auditLogs: DiagnosticPayload[]
  clearAuditLogs: () => void
  exportAuditLogs: () => string
}

const TelemetryContext = createContext<TelemetryContextValue | undefined>(undefined)

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsent] = useState<TelemetryConsent>(() => telemetryManager.getConsent())
  const [auditLogs, setAuditLogs] = useState<DiagnosticPayload[]>(() => telemetryManager.getAuditLog())

  const syncState = useCallback(() => {
    setConsent(telemetryManager.getConsent())
    setAuditLogs(telemetryManager.getAuditLog())
  }, [])

  useEffect(() => {
    // Initialize global error / rejection capture
    telemetryManager.initGlobalListeners()

    const handleConsentChange = (e: any) => {
      if (e?.detail?.consent) {
        setConsent(e.detail.consent)
      } else {
        syncState()
      }
    }

    const handleAuditUpdate = (e: any) => {
      if (e?.detail?.logs) {
        setAuditLogs(e.detail.logs)
      } else {
        setAuditLogs(telemetryManager.getAuditLog())
      }
    }

    window.addEventListener('zendev:telemetry-consent-changed', handleConsentChange)
    window.addEventListener('zendev:telemetry-audit-updated', handleAuditUpdate)

    return () => {
      window.removeEventListener('zendev:telemetry-consent-changed', handleConsentChange)
      window.removeEventListener('zendev:telemetry-audit-updated', handleAuditUpdate)
    }
  }, [syncState])

  const updateConsent = useCallback((partial: Partial<TelemetryConsent>) => {
    const updated = telemetryManager.setConsent(partial)
    setConsent(updated)
  }, [])

  const captureError = useCallback((error: Error | string, componentStack?: string) => {
    const report = telemetryManager.captureError(error, componentStack)
    setAuditLogs(telemetryManager.getAuditLog())
    return report
  }, [])

  const captureEvent = useCallback(
    (
      eventName: string,
      category: 'studio' | 'performance' | 'lifecycle',
      properties?: Record<string, string | number | boolean>
    ) => {
      const evt = telemetryManager.captureEvent(eventName, category, properties)
      setAuditLogs(telemetryManager.getAuditLog())
      return evt
    },
    []
  )

  const addBreadcrumb = useCallback(
    (category: BreadcrumbCategory, message: string, level: BreadcrumbLevel = 'info') => {
      telemetryManager.addBreadcrumb(category, message, level)
    },
    []
  )

  const clearAuditLogs = useCallback(() => {
    telemetryManager.clearAuditLog()
    setAuditLogs([])
  }, [])

  const exportAuditLogs = useCallback(() => {
    return telemetryManager.exportAuditLogJson()
  }, [])

  const value: TelemetryContextValue = {
    consent,
    installationId: telemetryManager.getInstallationId(),
    updateConsent,
    captureError,
    captureEvent,
    addBreadcrumb,
    auditLogs,
    clearAuditLogs,
    exportAuditLogs
  }

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  )
}

export function useTelemetry(): TelemetryContextValue {
  const context = useContext(TelemetryContext)
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider')
  }
  return context
}
