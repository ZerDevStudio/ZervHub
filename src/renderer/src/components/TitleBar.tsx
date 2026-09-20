import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Minus, Square, X, Copy, Pin, PinOff, Zap } from 'lucide-react'
import { cyberAudio } from '../lib/cyberAudio'

import { useLicense } from '../lib/LicenseContext'
import { useWorkspaceMode } from '../context/WorkspaceModeContext'
import { useT } from '../lib/i18n'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const { tier, trialHoursLeft } = useLicense()
  const { mode, setMode } = useWorkspaceMode()
  const { t, locale } = useT()

  useEffect(() => {
    const checkStatus = async () => {
      if (window.nexusAPI) {
        try {
          const maximized = await window.nexusAPI.isMaximized()
          setIsMaximized(maximized)
          if (window.nexusAPI.isAlwaysOnTop) {
            const pinned = await window.nexusAPI.isAlwaysOnTop()
            setIsPinned(pinned)
          }
        } catch {}
      }
    }
    checkStatus()

    // Event-driven check on window resize and window focus (zero CPU polling)
    window.addEventListener('resize', checkStatus)
    window.addEventListener('focus', checkStatus)
    return () => {
      window.removeEventListener('resize', checkStatus)
      window.removeEventListener('focus', checkStatus)
    }
  }, [])

  const handleTogglePin = async () => {
    if (window.nexusAPI?.toggleAlwaysOnTop) {
      const state = await window.nexusAPI.toggleAlwaysOnTop()
      setIsPinned(state)
      cyberAudio.click()
    }
  }

  const handleMinimize = () => {
    cyberAudio.click()
    window.nexusAPI?.minimize()
  }
  const handleMaximize = () => {
    cyberAudio.click()
    window.nexusAPI?.maximize()
    setIsMaximized(!isMaximized)
  }
  const handleClose = () => {
    cyberAudio.click()
    window.nexusAPI?.close()
  }

  return (
    <div onDoubleClick={handleMaximize} className="h-10 flex items-center justify-between bg-nexus-surface/80 backdrop-blur-xl border-b border-nexus-border/20 drag select-none shrink-0 cursor-default">
      {/* Left branding & status badges */}
      <div className="flex items-center gap-2 pl-4">
        <span className="text-xs text-nexus-muted font-medium tracking-wide">ZenDev</span>
        {tier === 'trial' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono font-medium animate-pulse">
            ★ PRO TRIAL {trialHoursLeft !== null ? `(${trialHoursLeft}h)` : ''}
          </span>
        )}
        {isPinned && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-nexus-accent/20 text-nexus-accent border border-nexus-accent/30 flex items-center gap-1 font-mono">
            PINNED
          </span>
        )}
      </div>

      {/* Centered Segmented Workspace Mode Switcher */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center no-drag z-20">
        <div className="p-0.5 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md flex items-center gap-0.5 shadow-inner">
          <button
            type="button"
            onClick={() => {
              if (mode !== 'essential') {
                cyberAudio.click()
                setMode('essential')
              }
            }}
            className={`relative px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              mode === 'essential' ? 'text-white font-semibold' : 'text-nexus-muted hover:text-white'
            }`}
            title={`${t('workspace.essential') || (locale === 'tr' ? 'Günlük Araçlar' : 'Essential Tools')} (Ctrl+M)`}
          >
            {mode === 'essential' && (
              <motion.div
                layoutId="activeWorkspaceModeTitle"
                className="absolute inset-0 rounded-md bg-gradient-to-r from-nexus-cyan/25 to-nexus-accent/20 border border-nexus-cyan/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 text-xs">🎯</span>
            <span className="relative z-10">
              {t('workspace.essential') || (locale === 'tr' ? 'Günlük Araçlar' : 'Essential Tools')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (mode !== 'developer') {
                cyberAudio.click()
                setMode('developer')
              }
            }}
            className={`relative px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              mode === 'developer' ? 'text-white font-semibold' : 'text-nexus-muted hover:text-white'
            }`}
            title={`${t('workspace.developer') || (locale === 'tr' ? 'Geliştirici' : 'Developer')} (Ctrl+M)`}
          >
            {mode === 'developer' && (
              <motion.div
                layoutId="activeWorkspaceModeTitle"
                className="absolute inset-0 rounded-md bg-gradient-to-r from-nexus-cyan/25 to-nexus-accent/20 border border-nexus-cyan/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 text-xs">⚡</span>
            <span className="relative z-10">
              {t('workspace.developer') || (locale === 'tr' ? 'Geliştirici' : 'Developer')}
            </span>
          </button>
        </div>
      </div>

      {/* Window controls */}
      <div className="flex items-center no-drag">
        <motion.button
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            cyberAudio.click()
            window.dispatchEvent(new CustomEvent('nexus:toggle-hud'))
          }}
          className="w-10 h-10 flex items-center justify-center text-nexus-muted hover:text-nexus-cyan transition-colors"
          title="Cyber Mini HUD & Quick Launcher (Ctrl+Shift+Space)"
        >
          <Zap className="w-3.5 h-3.5 text-nexus-cyan" />
        </motion.button>
        <motion.button
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            cyberAudio.click()
            window.dispatchEvent(new CustomEvent('nexus:toggle-shortcuts'))
          }}
          className="w-10 h-10 flex items-center justify-center text-nexus-muted hover:text-nexus-cyan transition-colors"
          title="Klavye Kısayolları Kılavuzu (? / F1)"
        >
          <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border border-nexus-border/60 bg-nexus-bg/50">?</span>
        </motion.button>
        <motion.button
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={handleTogglePin}
          className={`w-10 h-10 flex items-center justify-center transition-colors ${
            isPinned ? 'text-nexus-accent bg-nexus-accent/10' : 'text-nexus-muted hover:text-nexus-text'
          }`}
          title={isPinned ? 'Pencere Sabitlendi (Always on Top)' : 'Pencereyi Üstte Sabitle (Pin to Top)'}
        >
          {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </motion.button>
        <motion.button
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMinimize}
          className="w-11 h-10 flex items-center justify-center text-nexus-muted hover:text-nexus-text transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </motion.button>

        <motion.button
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMaximize}
          className="w-11 h-10 flex items-center justify-center text-nexus-muted hover:text-nexus-text transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
        </motion.button>

        <motion.button
          whileHover={{ backgroundColor: 'rgba(239,68,68,0.8)' }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          className="w-11 h-10 flex items-center justify-center text-nexus-muted hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  )
}
