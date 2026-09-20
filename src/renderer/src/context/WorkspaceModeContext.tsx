import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { cyberAudio } from '../lib/cyberAudio'

export type WorkspaceMode = 'essential' | 'developer'

export interface WorkspaceModeContextValue {
  /** Currently active workspace mode */
  mode: WorkspaceMode
  /** True if currently in Essential (daily productivity) mode */
  isEssential: boolean
  /** True if currently in Developer (pro studios) mode */
  isDeveloper: boolean
  /** Explicitly set the workspace mode */
  setMode: (mode: WorkspaceMode) => void
  /** Toggle between Essential and Developer modes */
  toggleMode: () => void
}

export type WorkspaceModeContextType = WorkspaceModeContextValue

const STORAGE_KEY = 'zendev_workspace_mode'
const DEFAULT_MODE: WorkspaceMode = 'essential'

function getInitialMode(): WorkspaceMode {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved === 'essential' || saved === 'developer') {
        return saved
      }
    }
  } catch {}
  return DEFAULT_MODE
}

const WorkspaceModeContext = createContext<WorkspaceModeContextValue | null>(null)

export function WorkspaceModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<WorkspaceMode>(getInitialMode)
  const modeRef = useRef<WorkspaceMode>(mode)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const setMode = useCallback((newMode: WorkspaceMode) => {
    modeRef.current = newMode
    setModeState(newMode)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, newMode)
      }
    } catch (err) {
      console.warn('[WorkspaceMode] Failed to save mode:', err)
    }

    try {
      cyberAudio.click()
    } catch {}

    try {
      window.dispatchEvent(
        new CustomEvent('zendev:workspace-mode-changed', { detail: { mode: newMode } })
      )
    } catch {}
  }, [])

  const toggleMode = useCallback(() => {
    const next = modeRef.current === 'essential' ? 'developer' : 'essential'
    setMode(next)
  }, [setMode])

  // Cross-window and cross-tab storage synchronization
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'essential' || e.newValue === 'developer')) {
        modeRef.current = e.newValue
        setModeState(e.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Global keyboard shortcut (Ctrl+M / Cmd+M) with audio feedback and input suppression
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('contenteditable') === 'true')

      if (isInput) return

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        toggleMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleMode])

  const value = useMemo<WorkspaceModeContextValue>(
    () => ({
      mode,
      isEssential: mode === 'essential',
      isDeveloper: mode === 'developer',
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode]
  )

  return (
    <WorkspaceModeContext.Provider value={value}>
      {children}
    </WorkspaceModeContext.Provider>
  )
}

export function useWorkspaceMode(): WorkspaceModeContextValue {
  const ctx = useContext(WorkspaceModeContext)
  if (!ctx) {
    throw new Error('useWorkspaceMode must be used within a WorkspaceModeProvider')
  }
  return ctx
}

export default WorkspaceModeProvider;
