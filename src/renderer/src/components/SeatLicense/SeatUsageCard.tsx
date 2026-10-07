import React from 'react'
import { motion } from 'framer-motion'
import { Monitor, Laptop, Shield, ExternalLink, Wifi, CheckCircle } from 'lucide-react'
import { useSeatLicense } from '../../lib/seatLicense/SeatLicenseContext'
import { useT } from '../../lib/i18n'
import { cyberAudio } from '../../lib/cyberAudio'

export const SeatUsageCard: React.FC = () => {
  const { license, devices, leaseHealth } = useSeatLicense()
  const { locale } = useT()
  const isTr = locale === 'tr'

  const seatPercent = Math.min(100, Math.round((license.allocatedSeats / license.maxSeats) * 100))

  const handleOpenModal = () => {
    try {
      cyberAudio.click()
    } catch {}
    window.dispatchEvent(new CustomEvent('nexus:open-seat-modal'))
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
          <div className="w-8 h-8 rounded-lg bg-nexus-cyan/15 border border-nexus-cyan/30 flex items-center justify-center text-nexus-cyan">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {isTr ? 'Cihaz & Koltuk Yönetimi' : 'Workstations & Seats'}
            </h2>
            <p className="text-xs text-nexus-muted mt-0.5">
              {isTr
                ? 'Sunucu tarafında lisansınıza kayıtlı aktif bilgisayarlar'
                : 'Server-side registered active workstations'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="px-3 py-1.5 rounded-lg bg-nexus-surface border border-nexus-border hover:border-nexus-cyan/50 text-xs font-medium text-white transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>{isTr ? 'Cihazları Yönet' : 'Manage Seats'}</span>
          <ExternalLink className="w-3 h-3 text-nexus-cyan" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Allocation stats */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-nexus-muted">
            {isTr ? 'Aktif Koltuk Durumu:' : 'Active Seat Status:'}
          </span>
          <span className="text-xs font-mono font-bold text-nexus-cyan">
            {license.allocatedSeats} / {license.maxSeats} {isTr ? 'Koltuk Kullanımda' : 'Seats Allocated'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-nexus-surface overflow-hidden p-0.5 border border-nexus-border/40">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${seatPercent}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${
              seatPercent >= 100
                ? 'bg-amber-500 shadow-amber-500/50'
                : 'bg-gradient-to-r from-nexus-cyan to-nexus-accent'
            } shadow-sm`}
          />
        </div>

        {/* Info pills */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/40 flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] text-nexus-text">
              {leaseHealth.status === 'healthy'
                ? (isTr ? '7 Gün Çevrimdışı İzin' : '7-Day Offline Grace')
                : (isTr ? `${leaseHealth.daysLeft} Gün Kaldı` : `${leaseHealth.daysLeft}d Grace Left`)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-nexus-bg/50 border border-nexus-border/40 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-nexus-cyan shrink-0" />
            <span className="text-[11px] text-nexus-text">
              {isTr ? 'Anlık Koltuk Devri' : 'Instant Seat Revocation'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
