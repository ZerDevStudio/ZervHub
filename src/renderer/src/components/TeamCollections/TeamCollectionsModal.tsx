import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderGit2,
  X,
  Plus,
  Send,
  Terminal,
  Clock,
  GitBranch,
  Download,
  Upload,
  Copy,
  Check,
  Trash2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Tag,
  Search,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import { useTeamCollections } from '../../lib/teamCollections/TeamCollectionsContext'
import { CollectionCategory, TeamCollection, TeamCollectionItem } from '../../lib/teamCollections/types'
import { cyberAudio } from '../../lib/cyberAudio'
import { useToast } from '../../lib/ToastContext'

const CATEGORY_META: Record<
  CollectionCategory,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  api: {
    label: 'API İstekleri',
    icon: Send,
    color: 'text-sky-400',
    bg: 'bg-sky-500/15 border-sky-500/30'
  },
  regex: {
    label: 'Regex Kuralları',
    icon: Terminal,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/30'
  },
  cron: {
    label: 'Cron Görevleri',
    icon: Clock,
    color: 'text-orange-400',
    bg: 'bg-orange-500/15 border-orange-500/30'
  },
  mermaid: {
    label: 'Mermaid Diyagramları',
    icon: GitBranch,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15 border-purple-500/30'
  }
}

export const TeamCollectionsModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CollectionCategory | 'all'>('all')
  const [expandedCollectionId, setExpandedCollectionId] = useState<string | null>(null)
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null)
  const [importJsonText, setImportJsonText] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)

  // New collection form state
  const [newColName, setNewColName] = useState('')
  const [newColDesc, setNewColDesc] = useState('')
  const [newColCat, setNewColCat] = useState<CollectionCategory>('api')
  const [newColTags, setNewColTags] = useState('')

  const {
    collections,
    canWrite,
    currentRole,
    deleteCollection,
    createCollection,
    exportCollectionJson,
    importCollectionJson,
    resetToDefaults
  } = useTeamCollections()

  const { success: showToastSuccess, error: showToastError } = useToast()

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('nexus:open-team-collections', handleOpen)
    return () => window.removeEventListener('nexus:open-team-collections', handleOpen)
  }, [])

  const handleClose = () => {
    try { cyberAudio.click() } catch {}
    setIsOpen(false)
    setShowImportModal(false)
    setShowNewModal(false)
  }

  const handleCopyPayload = (item: TeamCollectionItem) => {
    try {
      const text = typeof item.payload === 'object' ? JSON.stringify(item.payload, null, 2) : String(item.payload)
      navigator.clipboard.writeText(text)
      setCopiedItemId(item.id)
      cyberAudio.copy()
      showToastSuccess('Kopyalandı', `"${item.name}" verisi panoya kopyalandı.`)
      setTimeout(() => setCopiedItemId(null), 2000)
    } catch {
      showToastError('Kopyalama Hatası', 'Veri panoya kopyalanamadı.')
    }
  }

  const handleExport = async (collection: TeamCollection) => {
    try {
      cyberAudio.click()
      const json = await exportCollectionJson(collection.id)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zendev-${collection.slug}-v${collection.version}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToastSuccess('Dışa Aktarıldı', `"${collection.name}" JSON formatında indirildi.`)
    } catch (err: any) {
      showToastError('Dışa Aktarma Hatası', err.message)
    }
  }

  const handleImportSubmit = async () => {
    if (!importJsonText.trim()) return
    const imported = await importCollectionJson(importJsonText)
    if (imported) {
      setImportJsonText('')
      setShowImportModal(false)
    }
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColName.trim()) return

    const tagsArray = newColTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)

    const created = createCollection({
      name: newColName.trim(),
      slug: newColName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: newColDesc.trim(),
      category: newColCat,
      version: '1.0.0',
      author: {
        id: 'usr_current',
        name: 'Ekip Üyesi',
        email: 'developer@zendev.io'
      },
      organizationId: 'org_zendev_core',
      visibility: 'team',
      tags: tagsArray.length > 0 ? tagsArray : ['custom'],
      items: []
    })

    if (created) {
      setNewColName('')
      setNewColDesc('')
      setNewColTags('')
      setShowNewModal(false)
    }
  }

  const filteredCollections = collections.filter((col) => {
    const matchesCategory = selectedCategory === 'all' || col.category === selectedCategory
    const matchesQuery =
      col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesQuery
  })

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-4xl max-h-[88vh] bg-nexus-card border border-nexus-cyan/30 rounded-3xl shadow-2xl shadow-nexus-cyan/10 flex flex-col overflow-hidden text-nexus-text z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-nexus-surface/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-nexus-cyan/20 to-nexus-accent/20 border border-nexus-cyan/40 flex items-center justify-center text-nexus-cyan shadow-lg shadow-nexus-cyan/10">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-wide">
                    Paylaşılabilir Takım Koleksiyonları
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-nexus-cyan/15 text-nexus-cyan border border-nexus-cyan/30 font-bold">
                    TEAM REPO
                  </span>
                </div>
                <p className="text-xs text-nexus-muted mt-0.5">
                  Versiyon kontrollü, Git-uyumlu paylaşımlı API, Regex, Cron ve Mermaid şablonları.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canWrite && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      try { cyberAudio.click() } catch {}
                      setShowImportModal(true)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:border-nexus-cyan/40 hover:bg-nexus-cyan/10 text-xs font-mono font-medium transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>İçe Aktar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try { cyberAudio.click() } catch {}
                      setShowNewModal(true)
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-nexus-cyan text-black text-xs font-bold font-mono shadow-md shadow-nexus-cyan/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yeni Koleksiyon</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-nexus-muted hover:text-white flex items-center justify-center transition-all cursor-pointer ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Role Status Bar */}
          {!canWrite && (
            <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-300 font-mono">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Erişim Kısıtlı: <strong>Viewer (İzleyici)</strong> modundasınız. Koleksiyonları görüntüleyebilir ve kopyalayabilirsiniz; ekleme/silme yetkiniz yoktur.</span>
              </div>
            </div>
          )}

          {/* Controls: Search + Categories */}
          <div className="p-4 border-b border-white/5 bg-nexus-card/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-nexus-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Koleksiyon veya etiket ara..."
                className="w-full bg-nexus-surface/80 border border-white/10 focus:border-nexus-cyan/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-nexus-muted outline-none transition-all"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => {
                  try { cyberAudio.click() } catch {}
                  setSelectedCategory('all')
                }}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-nexus-cyan text-black font-bold shadow-sm shadow-nexus-cyan/20'
                    : 'bg-white/5 text-nexus-muted hover:text-white hover:bg-white/10'
                }`}
              >
                Tümü ({collections.length})
              </button>

              {(Object.keys(CATEGORY_META) as CollectionCategory[]).map((cat) => {
                const meta = CATEGORY_META[cat]
                const Icon = meta.icon
                const count = collections.filter((c) => c.category === cat).length
                const isActive = selectedCategory === cat

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      try { cyberAudio.click() } catch {}
                      setSelectedCategory(cat)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'bg-white/5 text-nexus-muted hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${meta.color}`} />
                    <span>{meta.label}</span>
                    <span className="text-[10px] px-1 rounded bg-black/30 text-nexus-muted">
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Collection Cards List */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {filteredCollections.length === 0 ? (
              <div className="text-center py-16 text-nexus-muted">
                <FolderGit2 className="w-12 h-12 mx-auto text-nexus-muted/40 mb-3" />
                <p className="text-sm font-medium">Aramanızla eşleşen takım koleksiyonu bulunamadı.</p>
                <p className="text-xs mt-1">Farklı bir arama terimi deneyin veya varsayılan şablonları geri yükleyin.</p>
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className="mt-4 px-3 py-1.5 rounded-xl border border-white/10 hover:border-nexus-cyan/40 bg-white/5 hover:bg-nexus-cyan/10 text-xs font-mono text-nexus-cyan inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resmi Şablonları Yeniden Yükle</span>
                </button>
              </div>
            ) : (
              filteredCollections.map((col) => {
                const meta = CATEGORY_META[col.category]
                const Icon = meta.icon
                const isExpanded = expandedCollectionId === col.id

                return (
                  <div
                    key={col.id}
                    className="p-5 rounded-2xl bg-nexus-surface/50 border border-white/10 hover:border-white/20 transition-all flex flex-col gap-3"
                  >
                    {/* Card Top Line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4 h-4 ${meta.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-white tracking-wide">
                              {col.name}
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-nexus-cyan font-bold border border-white/5">
                              v{col.version}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${meta.bg} ${meta.color} font-medium`}>
                              {meta.label}
                            </span>
                          </div>
                          <p className="text-xs text-nexus-muted mt-0.5">
                            {col.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleExport(col)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-nexus-muted hover:text-white text-xs font-mono flex items-center gap-1 border border-white/5 cursor-pointer transition-all"
                          title="JSON olarak dışa aktar"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Dışa Aktar</span>
                        </button>

                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`"${col.name}" koleksiyonunu silmek istediğinizden emin misiniz?`)) {
                                deleteCollection(col.id)
                              }
                            }}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-nexus-muted hover:text-red-400 border border-white/5 cursor-pointer transition-all"
                            title="Koleksiyonu sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            try { cyberAudio.click() } catch {}
                            setExpandedCollectionId(isExpanded ? null : col.id)
                          }}
                          className="px-3 py-1.5 rounded-xl bg-nexus-cyan/10 hover:bg-nexus-cyan/20 text-nexus-cyan text-xs font-mono font-medium flex items-center gap-1 border border-nexus-cyan/30 cursor-pointer transition-all ml-1"
                        >
                          <span>{col.items.length} Öğe</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Metadata line: Author & Tags */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-nexus-muted border-t border-white/5 pt-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-nexus-muted" />
                          {col.tags.map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-nexus-muted">
                              #{t}
                            </span>
                          ))}
                        </span>
                      </div>
                      <span className="text-[10px]">
                        Yazar: <strong className="text-white">{col.author.name}</strong>
                      </span>
                    </div>

                    {/* Expanded Items Drawer */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2 space-y-2 border-t border-white/5 overflow-hidden"
                        >
                          {col.items.length === 0 ? (
                            <p className="text-xs text-nexus-muted italic py-2">
                              Bu koleksiyonda henüz kayıtlı bir şablon bulunmuyor.
                            </p>
                          ) : (
                            col.items.map((item) => (
                              <div
                                key={item.id}
                                className="p-3 rounded-xl bg-nexus-card border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white">{item.name}</span>
                                    {col.category === 'api' && 'method' in item.payload && (
                                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                        {item.payload.method}
                                      </span>
                                    )}
                                    {col.category === 'cron' && 'expression' in item.payload && (
                                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                        {item.payload.expression}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-nexus-muted mt-0.5">
                                    {item.description}
                                  </p>

                                  {/* Code / pattern snippet */}
                                  <div className="mt-1.5 p-2 rounded-lg bg-black/40 font-mono text-[11px] text-nexus-cyan/90 break-all select-all">
                                    {col.category === 'api' && 'url' in item.payload && item.payload.url}
                                    {col.category === 'regex' && 'pattern' in item.payload && `/${item.payload.pattern}/${item.payload.flags || ''}`}
                                    {col.category === 'cron' && 'humanReadable' in item.payload && item.payload.humanReadable}
                                    {col.category === 'mermaid' && 'diagramType' in item.payload && `[${item.payload.diagramType}] ${item.payload.chartDefinition.split('\n')[0]}`}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPayload(item)}
                                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-nexus-cyan/15 text-nexus-muted hover:text-nexus-cyan border border-white/5 hover:border-nexus-cyan/30 flex items-center gap-1 font-mono text-[11px] transition-all cursor-pointer"
                                  >
                                    {copiedItemId === item.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">Kopyalandı</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Kopyala</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-nexus-surface/80 flex items-center justify-between text-xs font-mono text-nexus-muted">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-nexus-cyan" />
              <span>Git-friendly JSON schema ile versiyonlanır ve şifreli bulut kasasıyla senkronize edilir.</span>
            </div>
            <button
              type="button"
              onClick={resetToDefaults}
              className="text-nexus-muted hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              title="Resmi şablonları sıfırla"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sıfırla</span>
            </button>
          </div>
        </motion.div>

        {/* JSON Import Sub-Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowImportModal(false)} />
            <div className="relative w-full max-w-lg bg-nexus-card border border-nexus-cyan/40 rounded-3xl p-6 shadow-2xl z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-nexus-cyan" />
                  <span>Koleksiyon JSON İçe Aktar</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-nexus-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-nexus-muted">
                ZenDev veya takım arkadaşınızdan aldığınız koleksiyon JSON verisini buraya yapıştırın:
              </p>

              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{ "name": "Mikroservis API", "category": "api", "items": [...] }'
                className="w-full h-44 bg-nexus-surface/90 border border-white/10 focus:border-nexus-cyan rounded-xl p-3 font-mono text-xs text-white placeholder-nexus-muted outline-none resize-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono font-medium text-nexus-muted"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  className="px-4 py-2 rounded-xl bg-nexus-cyan text-black text-xs font-bold font-mono shadow-md shadow-nexus-cyan/20 hover:brightness-110 active:scale-95"
                >
                  Koleksiyonu Ekle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Collection Modal */}
        {showNewModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowNewModal(false)} />
            <form
              onSubmit={handleCreateSubmit}
              className="relative w-full max-w-lg bg-nexus-card border border-nexus-cyan/40 rounded-3xl p-6 shadow-2xl z-10 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-nexus-cyan" />
                  <span>Yeni Takım Koleksiyonu</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-nexus-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-mono text-nexus-muted mb-1">
                  Koleksiyon Adı
                </label>
                <input
                  type="text"
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="Örn: Ödeme & Fatura Mikroservisleri"
                  className="w-full bg-nexus-surface/90 border border-white/10 focus:border-nexus-cyan rounded-xl p-2.5 text-xs text-white placeholder-nexus-muted outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-nexus-muted mb-1">
                  Kategori
                </label>
                <select
                  value={newColCat}
                  onChange={(e) => setNewColCat(e.target.value as CollectionCategory)}
                  className="w-full bg-nexus-surface/90 border border-white/10 focus:border-nexus-cyan rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="api">API İstekleri (REST & GraphQL)</option>
                  <option value="regex">Regex Kuralları & Şablonları</option>
                  <option value="cron">Cron Görevleri & Zamanlamaları</option>
                  <option value="mermaid">Mermaid Mimari Diyagramları</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-nexus-muted mb-1">
                  Açıklama
                </label>
                <textarea
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  placeholder="Takımın bu koleksiyonu ne için kullanacağını belirtin..."
                  className="w-full h-20 bg-nexus-surface/90 border border-white/10 focus:border-nexus-cyan rounded-xl p-2.5 text-xs text-white placeholder-nexus-muted outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-nexus-muted mb-1">
                  Etiketler (Virgülle ayırın)
                </label>
                <input
                  type="text"
                  value={newColTags}
                  onChange={(e) => setNewColTags(e.target.value)}
                  placeholder="api, payments, webhook, prod"
                  className="w-full bg-nexus-surface/90 border border-white/10 focus:border-nexus-cyan rounded-xl p-2.5 text-xs text-white placeholder-nexus-muted outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono font-medium text-nexus-muted"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-nexus-cyan text-black text-xs font-bold font-mono shadow-md shadow-nexus-cyan/20 hover:brightness-110 active:scale-95"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AnimatePresence>
  )
}
