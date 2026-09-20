import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Upload, Zap } from 'lucide-react'
import Sidebar from './components/Sidebar'
import TitleBar from './components/TitleBar'
import Dashboard from './pages/Dashboard'
import Activation from './pages/Activation'
import EulaGate from './pages/EulaGate'
import OnboardingTour from './components/OnboardingTour'
import CommandPalette from './components/CommandPalette'
import MiniHud from './components/MiniHud'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal'
import ProLockGate from './components/ProLockGate'
import FloatingOrb from './components/FloatingOrb'
import UpdateManager from './components/UpdateManager'
import { cyberAudio } from './lib/cyberAudio'
import ErrorBoundary from './components/ErrorBoundary'
import { useLicense } from './lib/LicenseContext'
import { useToast } from './lib/ToastContext'
import { useWorkspaceMode } from './context/WorkspaceModeContext'
import { useT } from './lib/i18n'
import { resolveGatewayRoute, dispatchGatewayDrop, FileGatewayDropDetail } from './lib/fileGateway'

// Code-split heavy tool pages for blazing fast app launch & minimal RAM footprint

const UniversalDecrypter = lazy(() => import('./pages/UniversalDecrypter'))
const BulkOrganizer = lazy(() => import('./pages/BulkOrganizer'))
const PasswordGenerator = lazy(() => import('./pages/PasswordGenerator'))

const NetworkTools = lazy(() => import('./pages/NetworkTools'))
const ImageToolkit = lazy(() => import('./pages/ImageToolkit'))
const QrCodeStudio = lazy(() => import('./pages/QrCodeStudio'))
const JsonStudio = lazy(() => import('./pages/JsonStudio'))
const HashStudio = lazy(() => import('./pages/HashStudio'))
const ResourceSentinel = lazy(() => import('./pages/ResourceSentinel'))
const CyberFortress = lazy(() => import('./pages/CyberFortress'))
const RegexStudio = lazy(() => import('./pages/RegexStudio'))
const FakeDataStudio = lazy(() => import('./pages/FakeDataStudio'))
const ApiStudio = lazy(() => import('./pages/ApiStudio'))
const ColorStudio = lazy(() => import('./pages/ColorStudio'))

const Scratchpad = lazy(() => import('./pages/Scratchpad'))
const PdfStudio = lazy(() => import('./pages/PdfStudio'))
const ActivityFeed = lazy(() => import('./pages/ActivityFeed'))
const Account = lazy(() => import('./pages/Account'))
const JwtStudio = lazy(() => import('./pages/JwtStudio'))
const CronStudio = lazy(() => import('./pages/CronStudio'))
const MermaidStudio = lazy(() => import('./pages/MermaidStudio'))
const EncodingStudio = lazy(() => import('./pages/EncodingStudio'))

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98 },
}

const pageTransition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
}

const DEV_ONLY_ROUTES = [
  '/api-studio',
  '/json-studio',
  '/jwt-studio',
  '/regex-studio',
  '/cron-studio',
  '/mermaid-studio',
  '/encoding-studio',
  '/hash-studio',
  '/network',
  '/sentinel',
  '/fake-data',
]

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { status } = useLicense()
  const { warning: showToastWarning, info: showToastInfo, success: showToastSuccess } = useToast()
  const { t } = useT()
  const { mode, setMode, isEssential } = useWorkspaceMode()
  const isDevRoute = DEV_ONLY_ROUTES.includes(location.pathname)
  const lastToastedRouteRef = useRef<string | null>(null)

  useEffect(() => {
    if (isEssential && isDevRoute && lastToastedRouteRef.current !== location.pathname) {
      lastToastedRouteRef.current = location.pathname
      showToastInfo(
        t('workspace.developerRequiredTitle') || 'Geliştirici Modu Gerekli',
        t('workspace.switchToDeveloperDesc') || 'Geliştirici stüdyolarına erişmek için Geliştirici Moduna geçin.'
      )
    } else if (!isDevRoute) {
      lastToastedRouteRef.current = null
    }
  }, [location.pathname, isEssential, isDevRoute, showToastInfo, t])

  // Listen to desktop tray navigation and global shortcut events
  useEffect(() => {
    const unbindNav = window.nexusAPI?.onNavigate?.((path: string) => {
      navigate(path)
    })
    const unbindPalette = window.nexusAPI?.onPaletteToggle?.(() => {
      window.dispatchEvent(new CustomEvent('nexus:open-palette'))
    })
    return () => {
      unbindNav?.()
      unbindPalette?.()
    }
  }, [navigate])

  // Listen to desktop tray visibility & memory sweep lifecycle events
  useEffect(() => {
    const unbindVis = window.nexusAPI?.onVisibilityChange?.((visible: boolean) => {
      window.dispatchEvent(new CustomEvent('nexus:app-visibility', { detail: { visible } }))
    })
    const unbindSweep = window.nexusAPI?.onMemorySweep?.(() => {
      window.dispatchEvent(new CustomEvent('nexus:app-memory-sweep'))
      if (typeof (window as any).gc === 'function') {
        try { (window as any).gc() } catch {}
      }
    })
    return () => {
      unbindVis?.()
      unbindSweep?.()
    }
  }, [])
  
  // Initialize active Cyber Theme on app boot
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('nexus_cyber_theme') || 'default'
      if (savedTheme === 'default') {
        document.documentElement.removeAttribute('data-theme')
      } else {
        document.documentElement.setAttribute('data-theme', savedTheme)
      }
    } catch {}
  }, [])

    // Universal Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (isInput) return

      // Alt Navigation Shortcuts
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const k = e.key.toLowerCase()
        if (k === 'd') {
          e.preventDefault()
          navigate('/')
        } else if (k === 'f') {
          e.preventDefault()
          navigate('/fortress')
        } else if (k === 'a') {
          e.preventDefault()
          navigate('/activity-feed')
        }
      }

      // Ctrl+Shift Shortcuts
      if (e.ctrlKey && e.shiftKey) {
        const k = e.key.toLowerCase()
        if (k === 't') {
          e.preventDefault()
          window.nexusAPI?.toggleAlwaysOnTop?.()
        } else if (k === 's') {
          e.preventDefault()
          cyberAudio.toggleMute()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  // Global window drag-and-drop file gateway
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const dragCounter = useRef(0)

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer?.types?.includes('Files')) {
        dragCounter.current += 1
        setIsDraggingFile(true)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current -= 1
      if (dragCounter.current <= 0) {
        dragCounter.current = 0
        setIsDraggingFile(false)
      }
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current = 0
      setIsDraggingFile(false)

      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      const file = files[0]
      const targetRoute = resolveGatewayRoute(file.name)

      if (!targetRoute) {
        try {
          cyberAudio.error()
        } catch {}
        showToastWarning(
          t('gateway.unsupportedTitle') || 'Unsupported File Format',
          t('gateway.unsupportedDesc') ||
            'Unsupported file format. Please drop a valid document, image, database, vault, or data file.'
        )
        return
      }

      try {
        cyberAudio.copySuccess()
      } catch {}

      const detail: FileGatewayDropDetail = {
        file,
        name: file.name,
        path: (file as any).path || '',
        size: file.size,
        type: file.type,
      }

      dispatchGatewayDrop(detail)
      navigate(targetRoute)
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [navigate, showToastWarning, t])

  const [hasAcceptedEula, setHasAcceptedEula] = useState<boolean>(
    localStorage.getItem('nexus_eula_accepted') === 'true'
  )

  const [hasCompletedTour, setHasCompletedTour] = useState<boolean>(
    localStorage.getItem('nexus_tour_completed') === 'true'
  )

  const [hasChosenFree, setHasChosenFree] = useState<boolean>(
    localStorage.getItem('nexus_free_tier') === 'true'
  )

  const handleAcceptEula = () => {
    localStorage.setItem('nexus_eula_accepted', 'true')
    setHasAcceptedEula(true)
  }

  const handleCompleteTour = () => {
    localStorage.setItem('nexus_tour_completed', 'true')
    setHasCompletedTour(true)
  }

  const handleContinueFree = () => {
    localStorage.setItem('nexus_free_tier', 'true')
    setHasChosenFree(true)
  }

  // If license was revoked remotely, clear any free-tier bypass state
  useEffect(() => {
    if (status === 'revoked') {
      try {
        localStorage.removeItem('nexus_free_tier')
      } catch {}
      setHasChosenFree(false)
    }
  }, [status])

  // Gate 1: EULA
  if (!hasAcceptedEula) {
    return <EulaGate onAccept={handleAcceptEula} />
  }

  // Gate 2: License Check Loading
  if (status === 'checking') {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-nexus-bg select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-nexus-accent/20 border-t-nexus-cyan animate-spin" />
        </div>
      </div>
    )
  }

  // Gate 3: Instant Kick-Out on Revocation
  if (status === 'revoked') {
    return <Activation />
  }

  // Gate 3b: License Inactive or Expired (unless Free Tier selected)
  if ((status === 'inactive' || status === 'expired') && !hasChosenFree) {
    return <Activation onContinueFree={handleContinueFree} />
  }

  const isPro = status === 'active'

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-nexus-bg">
      <UpdateManager />
      <CommandPalette />
      <MiniHud />
      <KeyboardShortcutsModal />
      {!hasCompletedTour && <OnboardingTour onComplete={handleCompleteTour} />}
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {/* Ambient background glows */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-nexus-accent/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-nexus-cyan/5 rounded-full blur-3xl" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="relative z-10 p-8"
            >
              {/* Dual-Mode Workspace Cyber Banner for Dev Routes in Essential Mode */}
              {isEssential && isDevRoute && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-nexus-cyan/10 border border-nexus-cyan/30 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-nexus-cyan/20 border border-nexus-cyan/40 flex items-center justify-center text-nexus-cyan shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{t('workspace.developerRequiredTitle') || 'Geliştirici Modu Gerekli'}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          PRO DEV
                        </span>
                      </p>
                      <p className="text-[11px] text-nexus-muted mt-0.5">
                        {t('workspace.switchToDeveloperDesc') || 'Bu aracı tam yetkiyle kullanmak ve sol menüde görmek için Geliştirici Modunu etkinleştirin.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      try { cyberAudio.click() } catch {}
                      setMode('developer')
                      showToastSuccess(
                        t('workspace.developer') || 'Geliştirici',
                        t('workspace.switchToDeveloperDesc') || 'Geliştirici Modu etkinleştirildi.'
                      )
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-nexus-cyan via-nexus-accent to-purple-600 text-black font-bold text-xs shadow-lg shadow-nexus-cyan/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                  >
                    {t('workspace.switchToDeveloper') || 'Geliştirici Moduna Geç'}
                  </button>
                </motion.div>
              )}

              <ErrorBoundary fallbackType="inline">
                <Suspense
                  fallback={
                    <div className="flex h-64 items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-nexus-accent/20 border-t-nexus-cyan animate-spin" />
                    </div>
                  }
                >
                  <Routes location={location}>
                    <Route path="/" element={<Dashboard />} />
                    
                    <Route
                      path="/decrypter"
                      element={isPro ? <UniversalDecrypter /> : <ProLockGate toolName="Universal Decrypter" toolDesc="Resolve shortened and monetized redirect links to their true destination and strip privacy trackers." />}
                    />
                    <Route
                      path="/organizer"
                      element={isPro ? <BulkOrganizer /> : <ProLockGate toolName="Bulk File Organizer" toolDesc="Clean up messy directories by instantly categorizing and bulk-renaming files with one-click undo." />}
                    />
                    <Route path="/aylink" element={<Navigate to="/decrypter" replace />} />
                    <Route path="/password" element={<PasswordGenerator />} />
                    
                    <Route
                      path="/network"
                      element={isPro ? <NetworkTools /> : <ProLockGate toolName="Network Tools" toolDesc="Public IP detection, DNS querying, port scanning, and native ICMP ping." />}
                    />
                    <Route
                      path="/image"
                      element={isPro ? <ImageToolkit /> : <ProLockGate toolName="Image Toolkit" toolDesc="Batch convert images to JPEG, PNG, WebP, or AVIF with EXIF metadata stripper." />}
                    />
                    <Route path="/qr-code" element={<QrCodeStudio />} />
                    <Route path="/json-studio" element={<JsonStudio />} />
                    <Route path="/hash-studio" element={<HashStudio />} />
                    <Route path="/regex-studio" element={<RegexStudio />} />
                    <Route path="/fake-data" element={<FakeDataStudio />} />
                    <Route
                      path="/api-studio"
                      element={isPro ? <ApiStudio /> : <ProLockGate toolName="API Studio Pro" toolDesc="Full REST & GraphQL client with automated test suites, environment vaults, and cURL exporters." />}
                    />
                    <Route path="/color-studio" element={<ColorStudio />} />
                    
                    <Route path="/scratchpad" element={<Scratchpad />} />
                    <Route
                      path="/pdf-studio"
                      element={isPro ? <PdfStudio /> : <ProLockGate toolName="PDF Studio Pro" toolDesc="100% offline PDF workstation to merge, split, encrypt with AES-256, and apply custom security watermarks." />}
                    />
                    <Route
                      path="/activity-feed"
                      element={isPro ? <ActivityFeed /> : <ProLockGate toolName="Audit Journal & Forensics" toolDesc="Cryptographic tamper-evident activity ledger tracking all security events and operations." />}
                    />
                    <Route
                      path="/sentinel"
                      element={isPro ? <ResourceSentinel /> : <ProLockGate toolName="ResourceSentinel Radar" toolDesc="60 FPS real-time CPU, RAM, disk I/O velocity, and thermal telemetry hardware diagnostics." />}
                    />
                    <Route
                      path="/fortress"
                      element={isPro ? <CyberFortress /> : <ProLockGate toolName="Cyber Fortress" toolDesc="DoD 5220.22-M 7-pass file shredder and military-grade AES-256-GCM vault encryption." />}
                    />
                    <Route path="/cyber-fortress" element={<Navigate to="/fortress" replace />} />
                    <Route path="/jwt-studio" element={<JwtStudio />} />
                    <Route path="/cron-studio" element={<CronStudio />} />
                    <Route path="/mermaid-studio" element={<MermaidStudio />} />
                    <Route path="/encoding-studio" element={<EncodingStudio />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <FloatingOrb />

      {/* Global Drag-and-Drop File Gateway Overlay */}
      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-nexus-bg/85 backdrop-blur-md border-4 border-dashed border-nexus-accent shadow-[inset_0_0_80px_rgba(var(--nexus-accent-rgb,139,92,246),0.25)]"
          >
            <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-nexus-surface/90 border border-nexus-accent/40 shadow-2xl max-w-lg text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nexus-accent/30 to-nexus-cyan/20 border border-nexus-accent/50 flex items-center justify-center text-nexus-cyan shadow-lg shadow-nexus-accent/20">
                <Upload className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white gradient-text">ZenDev File Gateway</h2>
                <p className="text-xs text-nexus-muted mt-1 max-w-sm">
                  Release to instantly route this file to the matching workstation studio
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-nexus-muted w-full pt-2">
                <div className="p-2 rounded-xl bg-nexus-card border border-white/5 text-left">
                  <span className="text-nexus-cyan font-bold block">.pdf</span>
                  <span>PDF Studio & Merging</span>
                </div>
                <div className="p-2 rounded-xl bg-nexus-card border border-white/5 text-left">
                  <span className="text-amber-400 font-bold block">.sqlite / .db / .sql</span>
                  <span>SQLite & Table Viewer</span>
                </div>
                <div className="p-2 rounded-xl bg-nexus-card border border-white/5 text-left">
                  <span className="text-emerald-400 font-bold block">.png / .jpg / .webp</span>
                  <span>Image Toolkit & Convert</span>
                </div>
                <div className="p-2 rounded-xl bg-nexus-card border border-white/5 text-left">
                  <span className="text-rose-400 font-bold block">.nexusvault</span>
                  <span>Cyber Fortress Vault</span>
                </div>
                <div className="p-2 rounded-xl bg-nexus-card border border-white/5 text-left">
                  <span className="text-indigo-400 font-bold block">.json / .jwt</span>
                  <span>JSON & JWT Studio</span>
                </div>
                <div className="p-2 rounded-xl bg-nexus-card border border-white/5 text-left">
                  <span className="text-purple-400 font-bold block">.md / .txt / .sha256</span>
                  <span>Scratchpad & Hash Studio</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

