import React from 'react'
import { motion } from 'framer-motion'
import { Lock, RefreshCw, CheckCircle2, CloudOff, AlertTriangle, Layers } from 'lucide-react'
import { useCloudSync } from '../../lib/cloudSync/CloudSyncContext'
import { useT } from '../../lib/i18n'
import { cyberAudio } from '../../lib/cyberAudio'

export const SyncStatusBadge: React.FC = () => {
  const { status, currentWorkspace, isUnlocked, lastSyncedAt } = useCloudSync()
  const { t, locale } = useT()

  const handleClick = () => {
    try {
      cyberAudio.click()
    } catch {}
    window.dispatchEvent(new CustomEvent('nexus:open-cloud-sync'))
  }

  const getStatusDisplay = () => {
    if (!isUnlocked || status === 'locked') {
      return {
        icon: <Lock className="w-3 h-3 text-amber-400" />,
        text: t('cloudSync.statusLocked') || (locale === 'tr' ? 'E2EE Kilitli' : 'E2EE Locked'),
        bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:border-amber-400/50'
      }
    }
    if (status === 'syncing') {
      return {
        icon: <RefreshCw className="w-3 h-3 text-nexus-cyan animate-spin" />,
        text: t('cloudSync.statusSyncing') || (locale === 'tr' ? 'Eşitleniyor...' : 'Syncing...'),
        bg: 'bg-nexus-cyan/15 border-nexus-cyan/40 text-nexus-cyan hover:border-nexus-cyan'
      }
    }
    if (status === 'error') {
      return {
        icon: <AlertTriangle className="w-3 h-3 text-rose-400" />,
        text: t('cloudSync.statusError') || (locale === 'tr' ? 'Hata' : 'Sync Error'),
        bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:border-rose-400'
      }
    }
    if (status === 'offline') {
      return {
        icon: <CloudOff className="w-3 h-3 text-nexus-muted" />,
        text: t('cloudSync.statusOffline') || (locale === 'tr' ? 'Yerel Kasa' : 'Local Vault'),
        bg: 'bg-white/5 border-white/10 text-nexus-muted hover:text-white hover:border-white/20'
      }
    }
    return {
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
      text: t('cloudSync.statusSynced') || (locale === 'tr' ? 'E2EE Senkron' : 'E2EE Synced'),
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:border-emerald-400/50'
    }
  }

  const current = getStatusDisplay()

  const formattedTime = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`no-drag flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border transition-all cursor-pointer ${current.bg}`}
      title={`${currentWorkspace.name} • ${current.text}${formattedTime ? ` (${formattedTime})` : ''}`}
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: currentWorkspace.color || '#06b6d4' }}
      />
      {current.icon}
      <span className="hidden sm:inline font-semibold">{current.text}</span>
    </motion.button>
  )
}
