import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Laptop,
  Monitor,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Clock,
  Sparkles,
  PlusCircle,
  Edit2,
  Check,
  CreditCard
} from 'lucide-react'
import { useSeatLicense } from '../../lib/seatLicense/SeatLicenseContext'
import { SeatDevice, DevicePlatform } from '../../lib/seatLicense/types'
import { useT } from '../../lib/i18n'
import { useToast } from '../../lib/ToastContext'
import { cyberAudio } from '../../lib/cyberAudio'

export const SeatManagementModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [editingDeviceName, setEditingDeviceName] = useState(false)
  const [newNameInput, setNewNameInput] = useState('')

  const {
    license,
    devices,
    currentDeviceId,
    currentDeviceName,
    leaseHealth,
    releaseSeat,
    setDeviceName,
    registerDevice
  } = useSeatLicense()

  const { locale } = useT()
  const { success: showToastSuccess, error: showToastError } = useToast()
  const isTr = locale === 'tr'

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true)
      setNewNameInput(currentDeviceName)
      try {
        cyberAudio.click()
      } catch {}
    }
    window.addEventListener('nexus:open-seat-modal', handleOpen)
    return () => window.removeEventListener('nexus:open-seat-modal', handleOpen)
  }, [currentDeviceName])

  // Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleRelease = (device: SeatDevice) => {
    try {
      cyberAudio.click()
    } catch {}

    const res = releaseSeat(device.deviceId)
    if (res.success) {
      showToastSuccess(
        isTr ? 'Koltuk Boşaltıldı' : 'Seat Released',
        isTr
          ? `${device.deviceName} başarıyla devreden çıkarıldı. Yeni koltuk kullanılabilir!`
          : `${device.deviceName} has been released. A new seat is available!`
      )
    } else {
      showToastError(
        isTr ? 'İşlem Başarısız' : 'Action Failed',
        res.message || 'Hata oluştu'
      )
    }
  }

  const handleSaveDeviceName = () => {
    if (newNameInput.trim()) {
      setDeviceName(newNameInput.trim())
      setEditingDeviceName(false)
      showToastSuccess(
        isTr ? 'Cihaz Adı Güncellendi' : 'Device Name Updated',
        newNameInput.trim()
      )
    }
  }

  const handleRegisterCurrent = () => {
    const res = registerDevice()
    if (res.success) {
      showToastSuccess(
        isTr ? 'Cihaz Kaydedildi' : 'Device Registered',
        isTr ? 'Bu cihaz başarıyla lisans koltuğuna bağlandı.' : 'This device has been registered.'
      )
    } else {
      showToastError(
        isTr ? 'Kayıt Başarısız' : 'Registration Failed',
        res.message || 'Kota dolu'
      )
    }
  }

  const getPlatformIcon = (platform: DevicePlatform) => {
    switch (platform) {
      case 'windows':
      case 'linux':
        return <Monitor className="w-4 h-4 text-nexus-cyan" />
      case 'macos':
        return <Laptop className="w-4 h-4 text-purple-400" />
      default:
        return <Monitor className="w-4 h-4 text-nexus-muted" />
    }
  }

  const formatRelativeTime = (timestamp: number) => {
    const diffMin = Math.round((Date.now() - timestamp) / (60 * 1000))
    if (diffMin < 2) return isTr ? 'Şimdi aktif' : 'Active now'
    if (diffMin < 60) return isTr ? `${diffMin} dakika önce` : `${diffMin}m ago`
    const diffHours = Math.round(diffMin / 60)
    if (diffHours < 24) return isTr ? `${diffHours} saat önce` : `${diffHours}h ago`
    const diffDays = Math.round(diffHours / 24)
    return isTr ? `${diffDays} gün önce` : `${diffDays}d ago`
  }

  const seatPercent = Math.min(100, Math.round((license.allocatedSeats / license.maxSeats) * 100))
  const isCurrentRegistered = devices.some((d) => d.deviceId === currentDeviceId)

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
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      {isTr ? 'Koltuk & Cihaz Yönetimi' : 'Seat & Device Management'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-nexus-cyan/20 to-purple-500/20 text-nexus-cyan border border-nexus-cyan/30">
                      {license.tier.toUpperCase()} TIER
                    </span>
                  </div>
                  <p className="text-xs text-nexus-muted mt-0.5">
                    {isTr
                      ? 'Sunucu tarafında lisansınıza kayıtlı aktif cihazlar ve donanım kimlikleri'
                      : 'Hardware IDs and active workstations linked to your enterprise license'}
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
              {/* Seat Quota & Lease Progress Banner */}
              <div className="p-4 rounded-xl bg-nexus-bg/70 border border-nexus-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-nexus-cyan" />
                    <span className="text-xs font-bold text-white">
                      {isTr ? 'Lisans Koltuk Kullanımı' : 'License Seat Allocation'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-nexus-cyan">
                    {license.allocatedSeats} / {license.maxSeats} {isTr ? 'Koltuk Dolu' : 'Seats Used'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-nexus-surface overflow-hidden p-0.5 border border-nexus-border/50">
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

                <div className="flex items-center justify-between text-[11px] text-nexus-muted pt-1">
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {leaseHealth.status === 'healthy'
                        ? (isTr ? 'Lease Doğrulandı: 7 Gün Çevrimdışı İzin' : 'Lease Verified: 7-Day Offline Grace')
                        : (isTr ? `Grace Period: ${leaseHealth.daysLeft} Gün Kaldı` : `Grace Period: ${leaseHealth.daysLeft}d Remaining`)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      window.dispatchEvent(new CustomEvent('nexus:open-billing'))
                    }}
                    className="text-nexus-cyan hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>{isTr ? 'Koltuk Arttır' : 'Upgrade Seats'}</span>
                  </button>
                </div>
              </div>

              {/* Current Device Status */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-nexus-cyan/10 via-purple-500/10 to-transparent border border-nexus-cyan/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white">
                        {isTr ? 'Mevcut Bilgisayarınız:' : 'Your Workstation:'}
                      </span>
                      {editingDeviceName ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newNameInput}
                            onChange={(e) => setNewNameInput(e.target.value)}
                            className="px-2 py-0.5 rounded bg-nexus-bg border border-nexus-cyan/50 text-white text-xs font-mono focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSaveDeviceName}
                            className="p-1 rounded bg-nexus-cyan text-black hover:brightness-110"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-nexus-cyan flex items-center gap-1.5">
                          {currentDeviceName}
                          <button
                            type="button"
                            onClick={() => setEditingDeviceName(true)}
                            className="text-nexus-muted hover:text-white"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-nexus-muted mt-1">
                      HWID: {currentDeviceId}
                    </p>
                  </div>

                  {!isCurrentRegistered && (
                    <button
                      type="button"
                      onClick={handleRegisterCurrent}
                      className="px-3 py-1.5 rounded-lg bg-nexus-cyan text-black text-xs font-bold shadow-lg shadow-nexus-cyan/20 hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{isTr ? 'Bu Cihazı Kaydet' : 'Register Device'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Devices List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-nexus-muted flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>{isTr ? 'Kayıtlı Cihazlar' : 'Registered Workstations'} ({devices.length})</span>
                </h3>

                <div className="space-y-2">
                  {devices.map((device) => {
                    const isCurrent = device.deviceId === currentDeviceId
                    return (
                      <motion.div
                        key={device.deviceId}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                          isCurrent
                            ? 'bg-nexus-surface/80 border-nexus-cyan/40 shadow-sm shadow-nexus-cyan/10'
                            : 'bg-nexus-surface/30 border-nexus-border/40 hover:border-nexus-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-nexus-bg border border-nexus-border flex items-center justify-center">
                            {getPlatformIcon(device.platform)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white">
                                {device.deviceName}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-nexus-cyan/20 text-nexus-cyan border border-nexus-cyan/30">
                                  {isTr ? 'BU CİHAZ' : 'THIS DEVICE'}
                                </span>
                              )}
                              <span className="text-[10px] text-nexus-muted uppercase font-mono">
                                • {device.platform}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-nexus-muted mt-0.5">
                              <span className="font-mono">{device.ipAddress}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-nexus-muted" />
                                {formatRelativeTime(device.lastHeartbeatAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => handleRelease(device)}
                            className="px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                            title={isTr ? 'Koltuktan çıkar' : 'Release seat'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isTr ? 'Serbest Bırak' : 'Release'}</span>
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-nexus-border bg-nexus-bg/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-nexus-muted">
                <CheckCircle2 className="w-4 h-4 text-nexus-cyan" />
                <span>
                  {isTr
                    ? 'Koltuk serbest bırakıldığında yeni cihaz hemen bağlanabilir.'
                    : 'Releasing a seat immediately frees quota for another device.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-nexus-surface border border-nexus-border hover:bg-nexus-surface/80 text-white text-xs font-semibold transition cursor-pointer"
              >
                {isTr ? 'Kapat' : 'Close'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
