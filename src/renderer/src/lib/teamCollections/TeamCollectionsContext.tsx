/**
 * ZenDev Enterprise SaaS — Team Collections Context & React Provider
 * Reactive state management, live updates, and integration with TeamAuth RBAC.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 4: Diferansiyasyon & B2B Moat)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { TeamCollection, TeamCollectionItem, CollectionCategory } from './types'
import { TeamCollectionManager } from './teamCollectionManager'
import { useTeamAuth } from '../teamAuth/TeamAuthContext'
import { TeamRole } from '../teamAuth/types'
import { useToast } from '../ToastContext'
import { cyberAudio } from '../cyberAudio'

interface TeamCollectionsContextType {
  collections: TeamCollection[]
  activeCategory: CollectionCategory | 'all'
  setActiveCategory: (category: CollectionCategory | 'all') => void
  currentRole: TeamRole
  canWrite: boolean
  createCollection: (collection: Omit<TeamCollection, 'id' | 'createdAt' | 'updatedAt'>) => TeamCollection | null
  updateCollection: (id: string, updates: Partial<TeamCollection>) => void
  deleteCollection: (id: string) => void
  addItem: (collectionId: string, item: Omit<TeamCollectionItem, 'id' | 'createdAt' | 'updatedAt'>) => TeamCollectionItem | null
  removeItem: (collectionId: string, itemId: string) => void
  exportCollectionJson: (id: string) => Promise<string>
  importCollectionJson: (jsonStr: string) => Promise<TeamCollection | null>
  resetToDefaults: () => void
}

const TeamCollectionsContext = createContext<TeamCollectionsContextType | undefined>(undefined)

export const TeamCollectionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collections, setCollections] = useState<TeamCollection[]>(() => TeamCollectionManager.getCollections())
  const [activeCategory, setActiveCategory] = useState<CollectionCategory | 'all'>('all')
  const { currentRole } = useTeamAuth()
  const { success: showToastSuccess, error: showToastError } = useToast()

  const canWrite = currentRole !== 'viewer'

  const refreshCollections = useCallback(() => {
    setCollections(TeamCollectionManager.getCollections())
  }, [])

  useEffect(() => {
    const handleUpdate = () => refreshCollections()
    window.addEventListener('zendev:team-collections-updated', handleUpdate)
    return () => window.removeEventListener('zendev:team-collections-updated', handleUpdate)
  }, [refreshCollections])

  const createCollection = useCallback(
    (collectionData: Omit<TeamCollection, 'id' | 'createdAt' | 'updatedAt'>): TeamCollection | null => {
      try {
        const now = Date.now()
        const newCol: TeamCollection = {
          ...collectionData,
          id: `col_${collectionData.category}_${now}_${Math.random().toString(36).substring(2, 6)}`,
          createdAt: now,
          updatedAt: now
        }
        const saved = TeamCollectionManager.saveCollection(newCol, currentRole)
        refreshCollections()
        try { cyberAudio.success() } catch {}
        showToastSuccess('Koleksiyon Oluşturuldu', `"${saved.name}" takım kütüphanesine eklendi.`)
        return saved
      } catch (err: any) {
        try { cyberAudio.error() } catch {}
        showToastError('İşlem Başarısız', err.message)
        return null
      }
    },
    [currentRole, refreshCollections, showToastSuccess, showToastError]
  )

  const updateCollection = useCallback(
    (id: string, updates: Partial<TeamCollection>) => {
      try {
        const existing = TeamCollectionManager.getCollectionById(id)
        if (!existing) return
        const updated = { ...existing, ...updates }
        TeamCollectionManager.saveCollection(updated, currentRole)
        refreshCollections()
        try { cyberAudio.click() } catch {}
        showToastSuccess('Koleksiyon Güncellendi', `"${updated.name}" başarıyla kaydedildi.`)
      } catch (err: any) {
        try { cyberAudio.error() } catch {}
        showToastError('Güncelleme Başarısız', err.message)
      }
    },
    [currentRole, refreshCollections, showToastSuccess, showToastError]
  )

  const deleteCollection = useCallback(
    (id: string) => {
      try {
        const existing = TeamCollectionManager.getCollectionById(id)
        TeamCollectionManager.deleteCollection(id, currentRole)
        refreshCollections()
        try { cyberAudio.click() } catch {}
        showToastSuccess('Koleksiyon Silindi', existing ? `"${existing.name}" kaldırıldı.` : 'Koleksiyon kaldırıldı.')
      } catch (err: any) {
        try { cyberAudio.error() } catch {}
        showToastError('Silme Başarısız', err.message)
      }
    },
    [currentRole, refreshCollections, showToastSuccess, showToastError]
  )

  const addItem = useCallback(
    (collectionId: string, itemData: Omit<TeamCollectionItem, 'id' | 'createdAt' | 'updatedAt'>): TeamCollectionItem | null => {
      try {
        const item = TeamCollectionManager.addItemToCollection(collectionId, itemData, currentRole)
        refreshCollections()
        try { cyberAudio.success() } catch {}
        showToastSuccess('Öğe Eklendi', `"${item.name}" koleksiyona eklendi.`)
        return item
      } catch (err: any) {
        try { cyberAudio.error() } catch {}
        showToastError('Öğe Eklenemedi', err.message)
        return null
      }
    },
    [currentRole, refreshCollections, showToastSuccess, showToastError]
  )

  const removeItem = useCallback(
    (collectionId: string, itemId: string) => {
      try {
        TeamCollectionManager.removeItemFromCollection(collectionId, itemId, currentRole)
        refreshCollections()
        try { cyberAudio.click() } catch {}
        showToastSuccess('Öğe Silindi', 'Koleksiyon öğesi kaldırıldı.')
      } catch (err: any) {
        try { cyberAudio.error() } catch {}
        showToastError('Silme Başarısız', err.message)
      }
    },
    [currentRole, refreshCollections, showToastSuccess, showToastError]
  )

  const exportCollectionJson = useCallback(async (id: string): Promise<string> => {
    return TeamCollectionManager.exportCollectionJson(id)
  }, [])

  const importCollectionJson = useCallback(
    async (jsonStr: string): Promise<TeamCollection | null> => {
      try {
        const imported = await TeamCollectionManager.importCollectionJson(jsonStr, currentRole)
        refreshCollections()
        try { cyberAudio.success() } catch {}
        showToastSuccess('İçe Aktarma Başarılı', `"${imported.name}" koleksiyonu eklendi.`)
        return imported
      } catch (err: any) {
        try { cyberAudio.error() } catch {}
        showToastError('İçe Aktarma Başarısız', err.message)
        return null
      }
    },
    [currentRole, refreshCollections, showToastSuccess, showToastError]
  )

  const resetToDefaults = useCallback(() => {
    try {
      TeamCollectionManager.resetToDefaults()
      refreshCollections()
      try { cyberAudio.success() } catch {}
      showToastSuccess('Sıfırlandı', 'Resmi takım koleksiyonları yeniden yüklendi.')
    } catch (err: any) {
      showToastError('Sıfırlama Başarısız', err.message)
    }
  }, [refreshCollections, showToastSuccess, showToastError])

  return (
    <TeamCollectionsContext.Provider
      value={{
        collections,
        activeCategory,
        setActiveCategory,
        currentRole,
        canWrite,
        createCollection,
        updateCollection,
        deleteCollection,
        addItem,
        removeItem,
        exportCollectionJson,
        importCollectionJson,
        resetToDefaults
      }}
    >
      {children}
    </TeamCollectionsContext.Provider>
  )
}

export const useTeamCollections = () => {
  const context = useContext(TeamCollectionsContext)
  if (!context) {
    throw new Error('useTeamCollections must be used within a TeamCollectionsProvider')
  }
  return context
}
