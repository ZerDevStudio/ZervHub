import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Bug,
  Zap,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  Lock,
  FileCode,
  Sparkles
} from 'lucide-react'
import { useTelemetry } from '../../lib/telemetry/TelemetryContext'
import { DiagnosticPayload } from '../../lib/telemetry/types'
import { useT } from '../../lib/i18n'
import { useToast } from '../../lib/ToastContext'
import { cyberAudio } from '../../lib/cyberAudio'

export const TelemetryModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPayload, setSelectedPayload] = useState<DiagnosticPayload | null>(null)

  const {
    consent,
    installationId,
    updateConsent,
    auditLogs,
    clearAuditLogs,
    exportAuditLogs
  } = useTelemetry()

  const { locale } = useT()
  const { success: showToastSuccess, info: showToastInfo } = useToast()
  const isTr = locale === 'tr'

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true)
      setSelectedPayload(null)
      try {
        cyberAudio.click()
      } catch {}
    }
    window.addEventListener('nexus:open-telemetry-modal', handleOpen)
    return () => window.removeEventListener('nexus:open-telemetry-modal', handleOpen)
  }, [])

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleToggleMaster = () => {
    try {
      cyberAudio.click()
    } catch {}
    const nextState = !consent.enabled
    updateConsent({
      enabled: nextState,
      crashReporting: nextState,
      performanceMetrics: nextState,
      anonymousUsage: nextState
    })
    if (nextState) {
      showToastSuccess(
        isTr ? 'Şeffaf Telemetri Aktif' : 'Telemetry Enabled',
        isTr
          ? 'Anonim hata raporlama etkinleştirildi. Tüm kişisel veriler maskelenir.'
          : 'Anonymous crash reporting enabled with strict PII redaction.'
      )
    } else {
      showToastInfo(
        isTr ? 'Telemetri Kapatıldı' : 'Telemetry Disabled',
        isTr
          ? 'Hiçbir tanı veya kullanım verisi toplanmayacaktır.'
          : 'Zero diagnostic or usage metrics will be collected.'
      )
    }
  }

  const handleExport = () => {
    try {
      cyberAudio.copySuccess()
    } catch {}
    const jsonStr = exportAuditLogs()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zendev-diagnostic-audit-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToastSuccess(
      isTr ? 'Rapor İndirildi' : 'Audit Log Exported',
      isTr ? 'Anonim denetim kaydı JSON olarak kaydedildi.' : 'Diagnostic audit log exported.'
    )
  }

  const handleClear = () => {
    try {
      cyberAudio.click()
    } catch {}
    clearAuditLogs()
    setSelectedPayload(null)
    showToastSuccess(
      isTr ? 'Kayıtlar Temizlendi' : 'Logs Cleared',
      isTr ? 'Tüm yerel telemetri kayıtları silindi.' : 'All local telemetry logs purged.'
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl bg-nexus-surface/95 border border-nexus-cyan/40 rounded-2xl shadow-2xl shadow-nexus-cyan/10 overflow-hidden flex flex-col z-10 max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-nexus-border flex items-center justify-between relative bg-gradient-to-r from-nexus-surface via-nexus-surface to-nexus-bg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-nexus-cyan/15 border border-nexus-cyan/30 flex items-center justify-center text-nexus-cyan shadow-inner">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      {isTr ? 'Şeffaf & Gizlilik Odaklı Telemetri' : 'Privacy-First Telemetry Hub'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      GDPR / KVKK OPT-IN
                    </span>
                  </div>
                  <p className="text-xs text-nexus-muted mt-0.5">
                    {isTr
                      ? 'Kullanıcı onayına bağlı, sıfır kişisel veri (PII) sızdıran şeffaf hata raporlama'
                      : 'Strictly opt-in, zero-PII transparent crash reporting and performance observability'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-nexus-surface border border-nexus-border/60 hover:border-nexus-cyan/50 text-nexus-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Master Opt-in Banner */}
              <div className={`p-4 rounded-xl border transition-all ${
                consent.enabled
                  ? 'bg-nexus-cyan/10 border-nexus-cyan/40'
                  : 'bg-nexus-bg/70 border-nexus-border'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      consent.enabled ? 'bg-nexus-cyan/20 text-nexus-cyan' : 'bg-nexus-surface text-nexus-muted'
                    }`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">
                        {isTr ? 'Anonim Tanı & Hata Raporlama' : 'Anonymous Diagnostic Reporting'}
                      </h3>
                      <p className="text-[11px] text-nexus-muted mt-0.5">
                        {isTr
                          ? 'Yazılım kararlılığını artırmak için yalnızca anonim çökme raporları toplanır'
                          : 'Only anonymous crash stacks collected to improve software stability'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleMaster}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      consent.enabled
                        ? 'bg-nexus-cyan text-black shadow-lg shadow-nexus-cyan/20'
                        : 'bg-nexus-surface text-nexus-muted border border-nexus-border hover:text-white'
                    }`}
                  >
                    {consent.enabled ? (isTr ? 'AÇIK (OPT-IN)' : 'ENABLED') : (isTr ? 'KAPALI' : 'DISABLED')}
                  </button>
                </div>
              </div>

              {/* Sub-Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-nexus-bg/50 border border-nexus-border/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
                      <Bug className="w-3.5 h-3.5 text-rose-400" />
                      <span>{isTr ? 'Çökme Raporları' : 'Crash Reports'}</span>
                    </div>
                    <p className="text-[10px] text-nexus-muted">
                      {isTr ? 'Bileşen ve render hatalarını yakalar' : 'Captures unhandled render panics'}
                    </p>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <input
                      type="checkbox"
                      disabled={!consent.enabled}
                      checked={consent.enabled && consent.crashReporting}
                      onChange={(e) => updateConsent({ crashReporting: e.target.checked })}
                      className="w-4 h-4 rounded text-nexus-cyan accent-nexus-cyan cursor-pointer disabled:opacity-30"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-nexus-bg/50 border border-nexus-border/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isTr ? 'Performans' : 'Performance'}</span>
                    </div>
                    <p className="text-[10px] text-nexus-muted">
                      {isTr ? 'Açılış süresi ve RAM tüketimi' : 'Boot time & RAM telemetry'}
                    </p>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <input
                      type="checkbox"
                      disabled={!consent.enabled}
                      checked={consent.enabled && consent.performanceMetrics}
                      onChange={(e) => updateConsent({ performanceMetrics: e.target.checked })}
                      className="w-4 h-4 rounded text-nexus-cyan accent-nexus-cyan cursor-pointer disabled:opacity-30"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-nexus-bg/50 border border-nexus-border/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1">
                      <Activity className="w-3.5 h-3.5 text-nexus-cyan" />
                      <span>{isTr ? 'Kullanım Sıklığı' : 'Studio Usage'}</span>
                    </div>
                    <p className="text-[10px] text-nexus-muted">
                      {isTr ? 'Hangi aracın açıldığı' : 'Frequency of studio launches'}
                    </p>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <input
                      type="checkbox"
                      disabled={!consent.enabled}
                      checked={consent.enabled && consent.anonymousUsage}
                      onChange={(e) => updateConsent({ anonymousUsage: e.target.checked })}
                      className="w-4 h-4 rounded text-nexus-cyan accent-nexus-cyan cursor-pointer disabled:opacity-30"
                    />
                  </div>
                </div>
              </div>

              {/* Zero-PII Guarantee Card */}
              <div className="p-4 rounded-xl bg-nexus-surface/60 border border-nexus-border/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>{isTr ? 'Sıfır PII ve Gizlilik Koruma Garantisi' : 'Zero-PII & Privacy Guarantees'}</span>
                </div>
                <ul className="text-[11px] text-nexus-muted space-y-1 pl-5 list-disc">
                  <li>
                    {isTr
                      ? 'Tüm dosya yollarından işletim sistemi kullanıcı adı çıkarılır (C:\\Users\\[REDACTED]\\...)'
                      : 'Usernames stripped from filesystem traces (C:\\Users\\[REDACTED]\\...)'}
                  </li>
                  <li>
                    {isTr
                      ? 'E-posta, parola, API tokenları (JWT/Bearer), gizli anahtarlar ve IP adresleri otomatik maskelenir'
                      : 'Emails, passwords, JWT tokens, Bearer headers, API keys, and IP addresses automatically sanitized'}
                  </li>
                  <li>
                    {isTr
                      ? 'Kimlik numarası, donanım seri no veya MAC adresi gibi kişisel tanımlayıcılar asla saklanmaz'
                      : 'No hardware serial numbers, MAC addresses, or personal identity numbers are stored'}
                  </li>
                </ul>
              </div>

              {/* Live Diagnostic Audit Inspector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-nexus-muted flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{isTr ? 'Şeffaf Denetim Kaydı' : 'Transparent Audit Log'} ({auditLogs.length})</span>
                  </h3>

                  <div className="flex items-center gap-2">
                    {auditLogs.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={handleExport}
                          className="px-2.5 py-1 rounded-lg bg-nexus-bg border border-nexus-border hover:border-nexus-cyan/40 text-[11px] text-white flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Download className="w-3 h-3 text-nexus-cyan" />
                          <span>{isTr ? 'JSON İndir' : 'Export JSON'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleClear}
                          className="px-2.5 py-1 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{isTr ? 'Temizle' : 'Clear'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {auditLogs.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-nexus-border/40 text-center text-xs text-nexus-muted">
                    {isTr
                      ? 'Henüz kaydedilmiş telemetri kaydı bulunmuyor. Sistem tamamen temiz.'
                      : 'No telemetry diagnostic payloads logged. System clean.'}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {auditLogs.map((log, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedPayload(selectedPayload === log ? null : log)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedPayload === log
                            ? 'bg-nexus-cyan/10 border-nexus-cyan/50 text-white'
                            : 'bg-nexus-bg/50 border-nexus-border/40 hover:border-nexus-border text-nexus-muted hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              log.type === 'crash' ? 'bg-rose-400' : 'bg-nexus-cyan'
                            }`} />
                            <span className="font-mono font-bold uppercase text-[10px]">
                              [{log.type}]
                            </span>
                            <span className="truncate max-w-[280px]">
                              {log.type === 'crash'
                                ? (log.payload as any).errorMessage
                                : (log.payload as any).eventName}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-nexus-muted">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Payload Raw JSON Inspector */}
                {selectedPayload && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl bg-black/60 border border-nexus-cyan/30 text-[11px] font-mono text-nexus-cyan overflow-x-auto max-h-40"
                  >
                    <pre>{JSON.stringify(selectedPayload, null, 2)}</pre>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-nexus-border bg-nexus-bg/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-nexus-muted">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-[11px]">
                  Anon ID: {installationId.slice(0, 16)}...
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-nexus-surface border border-nexus-border hover:bg-nexus-surface/80 text-white text-xs font-semibold transition cursor-pointer"
              >
                {isTr ? 'Tamam' : 'Done'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
