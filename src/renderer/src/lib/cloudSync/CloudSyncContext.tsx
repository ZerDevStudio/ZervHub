import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  Workspace,
  SyncStatus,
  SyncProviderConfig,
  SyncLogEntry
} from './types'
import { syncManager } from './syncManager'

interface CloudSyncContextValue {
  status: SyncStatus
  isUnlocked: boolean
  hasPassphraseSet: boolean
  currentWorkspace: Workspace
  workspaces: Workspace[]
  lastSyncedAt: number | null
  logs: SyncLogEntry[]
  providerConfig: SyncProviderConfig
  unlock: (passphrase: string) => Promise<boolean>
  lock: () => void
  setMasterPassphrase: (passphrase: string) => Promise<void>
  syncNow: () => Promise<void>
  switchWorkspace: (id: string) => void
  createWorkspace: (name: string, color?: string, description?: string) => Workspace
  updateProviderConfig: (cfg: Partial<SyncProviderConfig>) => void
  exportVault: () => Promise<Blob>
  importVault: (jsonString: string, passphrase: string) => Promise<void>
}

const CloudSyncContext = createContext<CloudSyncContextValue | null>(null)

export const CloudSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SyncStatus>(() => syncManager.getStatus())
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => syncManager.isUnlocked())
  const [hasPassphraseSet, setHasPassphraseSet] = useState<boolean>(() => syncManager.hasPassphraseSet())
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(() => syncManager.getActiveWorkspace())
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => syncManager.getWorkspaces())
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => syncManager.getLastSyncedAt())
  const [logs, setLogs] = useState<SyncLogEntry[]>(() => syncManager.getLogs())
  const [providerConfig, setProviderConfig] = useState<SyncProviderConfig>(() => syncManager.getProviderConfig())

  const refreshState = useCallback(() => {
    setStatus(syncManager.getStatus())
    setIsUnlocked(syncManager.isUnlocked())
    setHasPassphraseSet(syncManager.hasPassphraseSet())
    setCurrentWorkspace(syncManager.getActiveWorkspace())
    setWorkspaces(syncManager.getWorkspaces())
    setLastSyncedAt(syncManager.getLastSyncedAt())
    setLogs(syncManager.getLogs())
    setProviderConfig(syncManager.getProviderConfig())
  }, [])

  useEffect(() => {
    const handleStatusChanged = () => refreshState()
    const handleWorkspacesUpdated = () => refreshState()
    const handleWorkspaceChanged = () => refreshState()

    window.addEventListener('zendev:sync-status-changed', handleStatusChanged)
    window.addEventListener('zendev:workspaces-updated', handleWorkspacesUpdated)
    window.addEventListener('zendev:active-workspace-changed', handleWorkspaceChanged)
    window.addEventListener('zendev:sync-config-updated', handleStatusChanged)

    return () => {
      window.removeEventListener('zendev:sync-status-changed', handleStatusChanged)
      window.removeEventListener('zendev:workspaces-updated', handleWorkspacesUpdated)
      window.removeEventListener('zendev:active-workspace-changed', handleWorkspaceChanged)
      window.removeEventListener('zendev:sync-config-updated', handleStatusChanged)
    }
  }, [refreshState])

  const unlock = async (passphrase: string): Promise<boolean> => {
    const res = await syncManager.unlockVault(passphrase)
    refreshState()
    return res
  }

  const lock = () => {
    syncManager.lockVault()
    refreshState()
  }

  const setMasterPassphrase = async (passphrase: string): Promise<void> => {
    await syncManager.setMasterPassphrase(passphrase)
    refreshState()
  }

  const syncNow = async (): Promise<void> => {
    await syncManager.syncNow()
    refreshState()
  }

  const switchWorkspace = (id: string) => {
    syncManager.setActiveWorkspace(id)
    refreshState()
  }

  const createWorkspace = (name: string, color?: string, description?: string): Workspace => {
    const ws = syncManager.createWorkspace(name, color, description)
    refreshState()
    return ws
  }

  const updateProviderConfig = (cfg: Partial<SyncProviderConfig>) => {
    syncManager.saveProviderConfig(cfg)
    refreshState()
  }

  const exportVault = async (): Promise<Blob> => {
    return syncManager.exportEncryptedVaultFile()
  }

  const importVault = async (jsonString: string, passphrase: string): Promise<void> => {
    await syncManager.importEncryptedVaultFile(jsonString, passphrase)
    refreshState()
  }

  return (
    <CloudSyncContext.Provider
      value={{
        status,
        isUnlocked,
        hasPassphraseSet,
        currentWorkspace,
        workspaces,
        lastSyncedAt,
        logs,
        providerConfig,
        unlock,
        lock,
        setMasterPassphrase,
        syncNow,
        switchWorkspace,
        createWorkspace,
        updateProviderConfig,
        exportVault,
        importVault
      }}
    >
      {children}
    </CloudSyncContext.Provider>
  )
}

export function useCloudSync(): CloudSyncContextValue {
  const ctx = useContext(CloudSyncContext)
  if (!ctx) {
    throw new Error('useCloudSync must be used within a CloudSyncProvider')
  }
  return ctx
}
