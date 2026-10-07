import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Lock,
  Unlock,
  Cloud,
  Layers,
  ShieldCheck,
  RefreshCw,
  Plus,
  Download,
  Upload,
  Check,
  AlertCircle,
  Server,
  KeyRound,
  FileCheck
} from 'lucide-react'
import { useCloudSync } from '../../lib/cloudSync/CloudSyncContext'
import { useT } from '../../lib/i18n'
import { useToast } from '../../lib/ToastContext'
import { cyberAudio } from '../../lib/cyberAudio'
import { SyncProvider } from '../../lib/cloudSync/types'

export const CloudSyncModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'workspaces' | 'vault' | 'provider'>('workspaces')

  const {
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
  } = useCloudSync()

  const { t, locale } = useT()
  const { success: showToastSuccess, error: showToastError } = useToast()

  // Form states
  const [passphraseInput, setPassphraseInput] = useState('')
  const [newWsName, setNewWsName] = useState('')
  const [newWsColor, setNewWsColor] = useState('#06b6d4')
  const [isCreatingWs, setIsCreatingWs] = useState(false)
  const [isSyncingAction, setIsSyncingAction] = useState(false)

  // Listen to open events
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true)
      try {
        cyberAudio.click()
      } catch {}
    }
    window.addEventListener('nexus:open-cloud-sync', handleOpen)
    return () => window.removeEventListener('nexus:open-cloud-sync', handleOpen)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleUnlock = async () => {
    if (!passphraseInput) return
    try {
      await unlock(passphraseInput)
      setPassphraseInput('')
      try {
        cyberAudio.copySuccess()
      } catch {}
      showToastSuccess(
        t('cloudSync.unlockedTitle') || (locale === 'tr' ? 'Kasa Açıldı' : 'Vault Unlocked'),
        t('cloudSync.unlockedDesc') || (locale === 'tr' ? 'E2EE Kasa kilidi başarıyla açıldı.' : 'E2EE Vault unlocked.')
      )
    } catch (err: any) {
      showToastError(
        t('cloudSync.unlockError') || (locale === 'tr' ? 'Kilit Açılamadı' : 'Unlock Failed'),
        err.message || (locale === 'tr' ? 'Hatalı parola.' : 'Invalid passphrase.')
      )
    }
  }

  const handleSetPassphrase = async () => {
    if (passphraseInput.length < 6) {
      showToastError(
        t('cloudSync.weakPassphrase') || (locale === 'tr' ? 'Zayıf Parola' : 'Weak Passphrase'),
        locale === 'tr' ? 'Parola en az 6 karakter olmalıdır.' : 'Passphrase must be at least 6 characters.'
      )
      return
    }
    try {
      await setMasterPassphrase(passphraseInput)
      setPassphraseInput('')
      try {
        cyberAudio.copySuccess()
      } catch {}
      showToastSuccess(
        locale === 'tr' ? 'Parola Oluşturuldu' : 'Passphrase Configured',
        locale === 'tr' ? 'E2EE Kasanız başarıyla şifrelendi.' : 'E2EE Vault encrypted successfully.'
      )
    } catch (err: any) {
      showToastError('Hata', err.message)
    }
  }

  const handleSyncNow = async () => {
    if (isSyncingAction) return
    setIsSyncingAction(true)
    try {
      await syncNow()
      try {
        cyberAudio.copySuccess()
      } catch {}
      showToastSuccess(
        locale === 'tr' ? 'Senkronizasyon Başarılı' : 'Sync Successful',
        locale === 'tr' ? 'Tüm çalışma alanı verileri güncellendi.' : 'All workspace data synchronized.'
      )
    } catch (err: any) {
      showToastError(
        locale === 'tr' ? 'Senkronizasyon Hatası' : 'Sync Error',
        err.message || 'Hata oluştu'
      )
    } finally {
      setIsSyncingAction(false)
    }
  }

  const handleCreateWorkspace = () => {
    if (!newWsName.trim()) return
    const ws = createWorkspace(newWsName.trim(), newWsColor)
    setNewWsName('')
    setIsCreatingWs(false)
    try {
      cyberAudio.copySuccess()
    } catch {}
    showToastSuccess(
      locale === 'tr' ? 'Çalışma Alanı Oluşturuldu' : 'Workspace Created',
      `"${ws.name}" aktif çalışma alanı olarak seçildi.`
    )
  }

  const handleExport = async () => {
    try {
      const blob = await exportVault()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zendev-${currentWorkspace.slug}-vault-${Date.now()}.zendev-vault`
      a.click()
      URL.revokeObjectURL(url)
      try {
        cyberAudio.copySuccess()
      } catch {}
      showToastSuccess(
        locale === 'tr' ? 'Kasa Dışa Aktarıldı' : 'Vault Exported',
        locale === 'tr' ? 'AES-256 şifreli yedek dosyası indirildi.' : 'Encrypted backup downloaded.'
      )
    } catch (err: any) {
      showToastError('Hata', err.message)
    }
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      if (!content) return
      const pwd = prompt(
        locale === 'tr'
          ? 'Bu şifreli kasa dosyasının ana parolasını girin:'
          : 'Enter the master passphrase for this encrypted vault:'
      )
      if (!pwd) return
      try {
        await importVault(content, pwd)
        try {
          cyberAudio.copySuccess()
        } catch {}
        showToastSuccess(
          locale === 'tr' ? 'Kasa İçe Aktarıldı' : 'Vault Imported',
          locale === 'tr' ? 'Veriler başarıyla çözüldü ve uygulandı.' : 'Vault data decrypted and merged.'
        )
      } catch (err: any) {
        showToastError(
          locale === 'tr' ? 'İçe Aktarma Başarısız' : 'Import Failed',
          err.message || 'Hatalı dosya veya parola.'
        )
      }
    }
    reader.readAsText(file)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-nexus-surface/95 border border-nexus-border/60 shadow-2xl overflow-hidden backdrop-blur-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-nexus-border/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-nexus-cyan/20 to-nexus-accent/20 border border-nexus-cyan/40 flex items-center justify-center text-nexus-cyan shadow-lg shadow-nexus-cyan/15">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>ZenDev E2EE Cloud Sync</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-nexus-accent/20 text-nexus-accent border border-nexus-accent/30">
                    ZERO-KNOWLEDGE
                  </span>
                </h2>
                <p className="text-xs text-nexus-muted mt-0.5">
                  {locale === 'tr'
                    ? 'Uçtan Uca Şifreli (AES-256-GCM) Çalışma Alanları & Senkronizasyon'
                    : 'End-to-End Encrypted (AES-256-GCM) Workspaces & Cloud Sync'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-nexus-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-6 pt-3 border-b border-nexus-border/20 bg-nexus-bg/40">
            <button
              onClick={() => setActiveTab('workspaces')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'workspaces'
                  ? 'border-nexus-cyan text-nexus-cyan bg-nexus-cyan/10'
                  : 'border-transparent text-nexus-muted hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{locale === 'tr' ? 'Çalışma Alanları' : 'Workspaces'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">
                {workspaces.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'vault'
                  ? 'border-nexus-cyan text-nexus-cyan bg-nexus-cyan/10'
                  : 'border-transparent text-nexus-muted hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{locale === 'tr' ? 'E2EE Kasa & Güvenlik' : 'E2EE Vault & Security'}</span>
              {isUnlocked ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('provider')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'provider'
                  ? 'border-nexus-cyan text-nexus-cyan bg-nexus-cyan/10'
                  : 'border-transparent text-nexus-muted hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>{locale === 'tr' ? 'Sunucu & Senkronizasyon' : 'Sync Provider'}</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: WORKSPACES */}
            {activeTab === 'workspaces' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {locale === 'tr' ? 'Mevcut Çalışma Alanları' : 'Available Workspaces'}
                    </h3>
                    <p className="text-[11px] text-nexus-muted">
                      {locale === 'tr'
                        ? 'Her çalışma alanı kendine özel API koleksiyonlarını ve değişkenlerini saklar.'
                        : 'Each workspace isolates its own API collections and environment variables.'}
                    </p>
                  </div>

                  <button
                    onClick={() => setIsCreatingWs(!isCreatingWs)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nexus-cyan/15 hover:bg-nexus-cyan/25 border border-nexus-cyan/40 text-nexus-cyan text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{locale === 'tr' ? 'Yeni Alan' : 'New Workspace'}</span>
                  </button>
                </div>

                {/* Create Form */}
                {isCreatingWs && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-2xl bg-black/40 border border-nexus-cyan/30 space-y-3"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={locale === 'tr' ? 'Çalışma alanı adı (örn: Backend API)' : 'Workspace name'}
                        value={newWsName}
                        onChange={(e) => setNewWsName(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-nexus-bg border border-nexus-border text-xs text-white placeholder-nexus-muted focus:border-nexus-cyan focus:outline-none"
                      />
                      <input
                        type="color"
                        value={newWsColor}
                        onChange={(e) => setNewWsColor(e.target.value)}
                        className="w-10 h-9 p-0.5 rounded-xl bg-nexus-bg border border-nexus-border cursor-pointer"
                        title="Workspace Theme Color"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsCreatingWs(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-nexus-muted hover:text-white"
                      >
                        İptal
                      </button>
                      <button
                        onClick={handleCreateWorkspace}
                        disabled={!newWsName.trim()}
                        className="px-4 py-1.5 rounded-lg bg-nexus-cyan text-black font-semibold text-xs disabled:opacity-50"
                      >
                        Oluştur & Seç
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Workspace Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workspaces.map((ws) => {
                    const isActive = ws.id === currentWorkspace.id
                    return (
                      <div
                        key={ws.id}
                        onClick={() => {
                          if (!isActive) {
                            switchWorkspace(ws.id)
                            try {
                              cyberAudio.click()
                            } catch {}
                            showToastSuccess(
                              locale === 'tr' ? 'Çalışma Alanı Değiştirildi' : 'Workspace Switched',
                              `Aktif alan: ${ws.name}`
                            )
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isActive
                            ? 'bg-nexus-cyan/10 border-nexus-cyan/60 shadow-lg shadow-nexus-cyan/10'
                            : 'bg-nexus-bg/50 border-nexus-border/30 hover:border-nexus-border hover:bg-nexus-bg/80'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: ws.color }}
                            />
                            <div>
                              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                                {ws.name}
                                {ws.isDefault && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-nexus-muted">
                                    VARSAYILAN
                                  </span>
                                )}
                              </h4>
                              {ws.description && (
                                <p className="text-[10px] text-nexus-muted mt-0.5 line-clamp-1">
                                  {ws.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {isActive && (
                            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-nexus-cyan px-2 py-0.5 rounded-full bg-nexus-cyan/20 border border-nexus-cyan/40">
                              <Check className="w-2.5 h-2.5" />
                              AKTİF
                            </span>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-nexus-muted">
                          <span>ID: {ws.slug}</span>
                          <span>{new Date(ws.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: VAULT & ENCRYPTION */}
            {activeTab === 'vault' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-nexus-bg/60 border border-nexus-border/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-nexus-cyan/10 border border-nexus-cyan/30 flex items-center justify-center text-nexus-cyan">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Sıfır Bilgili Şifreleme (Zero-Knowledge AES-256)</h4>
                      <p className="text-[11px] text-nexus-muted mt-0.5">
                        Verileriniz cihazınızdan çıkmadan önce PBKDF2 (100.000 döngü) ile türetilen AES-256-GCM anahtarıyla şifrelenir.
                        ZenDev sunucuları asla açık metin anahtarınızı göremez.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-white/5 text-xs">
                    <span className="text-nexus-muted">Kasa Durumu:</span>
                    <span className={`font-mono font-bold ${isUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isUnlocked ? 'KİLİT AÇIK (RAM Aktif)' : 'KİLİTLİ'}
                    </span>
                  </div>
                </div>

                {/* Unlock / Set Passphrase Section */}
                <div className="p-4 rounded-2xl bg-black/40 border border-nexus-border/30 space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-nexus-cyan" />
                    <span>{hasPassphraseSet ? 'Kasa Anahtarını Gir' : 'Yeni Ana Parola Belirle'}</span>
                  </h4>

                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder={hasPassphraseSet ? 'Kasa Parolası' : 'En az 6 karakterlik güçlü parola'}
                      value={passphraseInput}
                      onChange={(e) => setPassphraseInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          hasPassphraseSet ? handleUnlock() : handleSetPassphrase()
                        }
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-nexus-bg border border-nexus-border text-xs text-white placeholder-nexus-muted focus:border-nexus-cyan focus:outline-none font-mono"
                    />

                    {hasPassphraseSet ? (
                      <button
                        onClick={handleUnlock}
                        disabled={!passphraseInput}
                        className="px-4 py-2.5 rounded-xl bg-nexus-cyan hover:bg-nexus-cyan/90 text-black font-bold text-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Kilidi Aç</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleSetPassphrase}
                        disabled={passphraseInput.length < 6}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-nexus-cyan to-nexus-accent text-black font-bold text-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Kaydet & Şifrele</span>
                      </button>
                    )}
                  </div>

                  {isUnlocked && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          lock()
                          showToastSuccess('Kilitlendi', 'Kasa başarıyla kilitlendi.')
                        }}
                        className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Kasayı Şimdi Kilitle (RAM Temizle)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Encrypted Backup / Restore */}
                <div className="pt-2 border-t border-nexus-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-semibold text-white">Çevrimdışı Şifreli Dosya (.zendev-vault)</h5>
                    <p className="text-[11px] text-nexus-muted">İnternetsiz ortamlarda kasayı dosya olarak dışa/içe aktarın</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Dışa Aktar</span>
                    </button>

                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nexus-cyan/15 hover:bg-nexus-cyan/25 border border-nexus-cyan/40 text-nexus-cyan text-xs font-semibold transition-all cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>İçe Aktar</span>
                      <input type="file" accept=".zendev-vault,.json" onChange={handleImportFile} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SYNC PROVIDER & ACTIVITY */}
            {activeTab === 'provider' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-white block uppercase tracking-wider">
                    {locale === 'tr' ? 'Senkronizasyon Modu' : 'Sync Provider'}
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'local_only', title: 'Yerel Kasa', desc: 'Sadece cihaz içi E2EE depolama' },
                        { id: 'zendev_cloud', title: 'ZenDev Cloud', desc: 'SaaS E2EE sunucu senkronizasyonu' },
                        { id: 'self_hosted', title: 'Özel Sunucu (REST)', desc: 'Kurumsal kendi sunucun' }
                      ] as const
                    ).map((prov) => (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => {
                          updateProviderConfig({ provider: prov.id as SyncProvider })
                          try {
                            cyberAudio.click()
                          } catch {}
                        }}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          providerConfig.provider === prov.id
                            ? 'bg-nexus-cyan/15 border-nexus-cyan text-nexus-cyan shadow-sm'
                            : 'bg-nexus-bg/50 border-nexus-border/30 text-nexus-muted hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{prov.title}</div>
                        <div className="text-[10px] text-nexus-muted mt-1 leading-snug">{prov.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {providerConfig.provider !== 'local_only' && (
                  <div className="p-4 rounded-2xl bg-black/40 border border-nexus-border/40 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-white block mb-1">
                        {locale === 'tr' ? 'Senkronizasyon Uç Noktası (Endpoint URL)' : 'Sync Endpoint URL'}
                      </label>
                      <input
                        type="text"
                        value={providerConfig.endpointUrl || ''}
                        onChange={(e) => updateProviderConfig({ endpointUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-nexus-bg border border-nexus-border text-xs text-white font-mono focus:border-nexus-cyan focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-white block mb-1">
                        {locale === 'tr' ? 'Erişim Tokenı (Bearer Auth Token)' : 'Bearer Auth Token'}
                      </label>
                      <input
                        type="password"
                        placeholder="zendev_live_..."
                        value={providerConfig.authToken || ''}
                        onChange={(e) => updateProviderConfig({ authToken: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-nexus-bg border border-nexus-border text-xs text-white font-mono focus:border-nexus-cyan focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Action Button & Status */}
                <div className="p-4 rounded-2xl bg-nexus-bg/50 border border-nexus-border/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Manuel Senkronizasyon</span>
                    <span className="text-[10px] text-nexus-muted">
                      {lastSyncedAt
                        ? `Son işlem: ${new Date(lastSyncedAt).toLocaleString()}`
                        : 'Henüz senkronize edilmedi.'}
                    </span>
                  </div>

                  <button
                    onClick={handleSyncNow}
                    disabled={isSyncingAction || !isUnlocked}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-nexus-cyan hover:bg-nexus-cyan/90 text-black font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-nexus-cyan/15"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAction ? 'animate-spin' : ''}`} />
                    <span>{isSyncingAction ? 'Eşitleniyor...' : 'Şimdi Eşitle'}</span>
                  </button>
                </div>

                {/* Activity Logs */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {locale === 'tr' ? 'Son Eşitleme İşlemleri' : 'Recent Sync Operations'}
                  </h4>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
                    {logs.length === 0 ? (
                      <p className="text-nexus-muted italic">Kayıtlı işlem geçmişi bulunmuyor.</p>
                    ) : (
                      logs.map((log) => (
                        <div
                          key={log.id}
                          className="p-2 rounded-xl bg-nexus-bg/40 border border-white/5 flex items-center justify-between"
                        >
                          <span className={log.status === 'failed' ? 'text-rose-400' : 'text-nexus-muted'}>
                            {log.message}
                          </span>
                          <span className="text-nexus-muted/60 shrink-0 ml-2">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
