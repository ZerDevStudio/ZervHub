import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Activity, Eye, ExternalLink, Lock } from 'lucide-react'
import { useTelemetry } from '../../lib/telemetry/TelemetryContext'
import { useT } from '../../lib/i18n'
import { cyberAudio } from '../../lib/cyberAudio'

export const TelemetrySettingsCard: React.FC = () => {
  const { consent, updateConsent } = useTelemetry()
  const { locale } = useT()
  const isTr = locale === 'tr'

  const handleOpenModal = () => {
    try {
      cyberAudio.click()
    } catch {}
    window.dispatchEvent(new CustomEvent('nexus:open-telemetry-modal'))
  }

  const handleToggle = () => {
    try {
      cyberAudio.click()
    } catch {}
    const next = !consent.enabled
    updateConsent({
      enabled: next,
      crashReporting: next,
      performanceMetrics: next,
      anonymousUsage: next
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            consent.enabled
              ? 'bg-nexus-cyan/15 border border-nexus-cyan/30 text-nexus-cyan'
              : 'bg-nexus-surface border border-nexus-border text-nexus-muted'
          }`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {isTr ? 'Gizlilik & Şeffaf Telemetri' : 'Privacy & Telemetry'}
            </h2>
            <p className="text-xs text-nexus-muted mt-0.5">
              {isTr
                ? 'KVKK ve GDPR uyumlu, kullanıcı onaylı anonim hata raporlama'
                : 'GDPR/KVKK compliant opt-in crash and diagnostic telemetry'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="px-3 py-1.5 rounded-lg bg-nexus-surface border border-nexus-border hover:border-nexus-cyan/50 text-xs font-medium text-white transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>{isTr ? 'Kayıtları İncele' : 'Inspect Logs'}</span>
          <ExternalLink className="w-3 h-3 text-nexus-cyan" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface/60 border border-white/5">
          <div>
            <p className="text-sm font-medium text-white">
              {isTr ? 'Anonim Hata ve Çökme Paylaşımı' : 'Anonymous Crash Sharing'}
            </p>
            <p className="text-xs text-nexus-muted mt-0.5">
              {consent.enabled
                ? (isTr ? 'Aktif: Kişisel veriler (PII) otomatik maskelenerek toplanır' : 'Active: Personal data sanitized before capture')
                : (isTr ? 'Kapalı: Sıfır veri toplanmaktadır' : 'Disabled: Zero diagnostic data is collected')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              consent.enabled
                ? 'bg-nexus-cyan text-black shadow-md shadow-nexus-cyan/20'
                : 'bg-nexus-bg text-nexus-muted border border-nexus-border hover:text-white'
            }`}
          >
            {consent.enabled ? (isTr ? 'AÇIK (OPT-IN)' : 'ENABLED') : (isTr ? 'KAPALI' : 'DISABLED')}
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-nexus-muted">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {isTr
              ? 'Dosya yolları, e-postalar, tokenlar ve IP adresleri asla sunucuya iletilmez.'
              : 'File paths, emails, JWT tokens, and IP addresses are never transmitted.'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
