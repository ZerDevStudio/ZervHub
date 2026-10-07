import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch,
  Play,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Upload,
  RotateCcw,
  Send,
  Braces,
  Binary,
  Shield,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Settings,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Code2,
  Zap,
  Sliders
} from 'lucide-react'
import {
  WorkflowChain,
  ChainStep,
  StepType,
  ChainExecutionReport,
  StepExecutionResult
} from '../lib/workflowChains/types'
import { ChainStore } from '../lib/workflowChains/chainStore'
import { ChainExecutor } from '../lib/workflowChains/chainExecutor'
import { PREBUILT_TEMPLATES } from '../lib/workflowChains/templates'
import { useT } from '../lib/i18n'
import { useToast } from '../lib/ToastContext'
import { cyberAudio } from '../lib/cyberAudio'

const STEP_TYPE_META: Record<
  StepType,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  HTTP_REQUEST: {
    label: 'API Request',
    icon: Send,
    color: 'text-sky-400',
    bg: 'bg-sky-500/15 border-sky-500/30'
  },
  JSON_EXTRACT: {
    label: 'JSON Filter',
    icon: Braces,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/30'
  },
  TRANSFORM: {
    label: 'Transform',
    icon: Binary,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15 border-purple-500/30'
  },
  CRYPTO_SIGN: {
    label: 'HMAC / Sign',
    icon: Shield,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15 border-emerald-500/30'
  },
  WEBHOOK_DISPATCH: {
    label: 'Webhook Post',
    icon: Globe,
    color: 'text-nexus-cyan',
    bg: 'bg-nexus-cyan/15 border-nexus-cyan/30'
  },
  DELAY: {
    label: 'Delay / Wait',
    icon: Clock,
    color: 'text-orange-400',
    bg: 'bg-orange-500/15 border-orange-500/30'
  },
  ASSERT: {
    label: 'Assert Check',
    icon: CheckCircle2,
    color: 'text-teal-400',
    bg: 'bg-teal-500/15 border-teal-500/30'
  }
}

export default function WorkflowChains() {
  const [chains, setChains] = useState<WorkflowChain[]>(() => ChainStore.getChains())
  const [activeChainId, setActiveChainId] = useState<string>(() => chains[0]?.id || '')
  const [isRunning, setIsRunning] = useState(false)
  const [executionReport, setExecutionReport] = useState<ChainExecutionReport | null>(null)
  const [activeStepResults, setActiveStepResults] = useState<Record<string, StepExecutionResult>>({})
  const [editingStep, setEditingStep] = useState<ChainStep | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const { locale } = useT()
  const { success: showToastSuccess, error: showToastError } = useToast()
  const isTr = locale === 'tr'

  const activeChain = chains.find((c) => c.id === activeChainId) || chains[0]

  useEffect(() => {
    const handleUpdate = () => {
      setChains(ChainStore.getChains())
    }
    window.addEventListener('zendev:chains-updated', handleUpdate)
    return () => window.removeEventListener('zendev:chains-updated', handleUpdate)
  }, [])

  const handleSelectChain = (id: string) => {
    try {
      cyberAudio.click()
    } catch {}
    setActiveChainId(id)
    setExecutionReport(null)
    setActiveStepResults({})
    setEditingStep(null)
  }

  const handleCreateNew = () => {
    try {
      cyberAudio.click()
    } catch {}
    const newChain = ChainStore.createEmptyChain(
      isTr ? 'Yeni Özel Pipeline' : 'Custom Workflow Pipeline',
      isTr ? 'Stüdyoları birbirine bağlayan özel zincir' : 'Custom studio chaining workflow'
    )
    setChains(ChainStore.getChains())
    setActiveChainId(newChain.id)
    showToastSuccess(
      isTr ? 'Zincir Oluşturuldu' : 'Workflow Created',
      newChain.name
    )
  }

  const handleResetTemplates = () => {
    try {
      cyberAudio.click()
    } catch {}
    const reset = ChainStore.resetToTemplates()
    setChains(reset)
    setActiveChainId(reset[0]?.id || '')
    setExecutionReport(null)
    setActiveStepResults({})
    showToastSuccess(
      isTr ? 'Şablonlar Sıfırlandı' : 'Templates Reset',
      isTr ? '3 hazır kurumsal şablon yüklendi.' : 'Prebuilt templates restored.'
    )
  }

  const handleRunChain = async () => {
    if (!activeChain || isRunning) return
    setIsRunning(true)
    setExecutionReport(null)
    setActiveStepResults({})

    try {
      cyberAudio.click()
    } catch {}

    try {
      const report = await ChainExecutor.executeChain(activeChain, (stepResult) => {
        setActiveStepResults((prev) => ({
          ...prev,
          [stepResult.stepId]: stepResult
        }))
      })

      setExecutionReport(report)
      if (report.status === 'success') {
        try {
          cyberAudio.copySuccess()
        } catch {}
        showToastSuccess(
          isTr ? 'Zincir Başarıyla Tamamlandı' : 'Chain Completed Successfully',
          `${report.stepResults.length} adım ${report.totalDurationMs}ms sürede çalıştı.`
        )
      } else {
        try {
          cyberAudio.error()
        } catch {}
        showToastError(
          isTr ? 'Zincirde Hata Oluştu' : 'Pipeline Error',
          report.stepResults.find((s) => s.status === 'failed')?.error || 'Hata'
        )
      }
    } catch (err: any) {
      showToastError(
        isTr ? 'Çalıştırma Hatası' : 'Execution Failed',
        err.message || String(err)
      )
    } finally {
      setIsRunning(false)
    }
  }

  const handleToggleStep = (stepId: string) => {
    if (!activeChain) return
    const updatedSteps = activeChain.steps.map((s) =>
      s.id === stepId ? { ...s, enabled: !s.enabled } : s
    )
    const updatedChain = { ...activeChain, steps: updatedSteps }
    ChainStore.saveChain(updatedChain)
    setChains(ChainStore.getChains())
  }

  const handleDeleteStep = (stepId: string) => {
    if (!activeChain) return
    const updatedSteps = activeChain.steps.filter((s) => s.id !== stepId)
    const updatedChain = { ...activeChain, steps: updatedSteps }
    ChainStore.saveChain(updatedChain)
    setChains(ChainStore.getChains())
    if (editingStep?.id === stepId) setEditingStep(null)
  }

  const handleAddStep = (type: StepType) => {
    if (!activeChain) return
    try {
      cyberAudio.click()
    } catch {}

    const newStepId = `step_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`
    let defaultConfig: any = {}

    switch (type) {
      case 'HTTP_REQUEST':
        defaultConfig = {
          method: 'GET',
          url: 'https://httpbin.org/get',
          headers: {},
          bodyType: 'none',
          authType: 'none'
        }
        break
      case 'JSON_EXTRACT':
        defaultConfig = { path: 'data.id', fallback: '' }
        break
      case 'TRANSFORM':
        defaultConfig = { transform: 'base64_encode' }
        break
      case 'CRYPTO_SIGN':
        defaultConfig = { algorithm: 'hmac_sha256', secretKey: 'secret_key', outputFormat: 'hex' }
        break
      case 'WEBHOOK_DISPATCH':
        defaultConfig = { url: 'https://httpbin.org/post', signatureHeader: 'X-Hub-Signature-256' }
        break
      case 'DELAY':
        defaultConfig = { delayMs: 500 }
        break
      case 'ASSERT':
        defaultConfig = { expectedField: 'status', operator: 'equals', expectedValue: '200' }
        break
    }

    const newStep: ChainStep = {
      id: newStepId,
      name: `${activeChain.steps.length + 1}. ${STEP_TYPE_META[type].label}`,
      type,
      enabled: true,
      config: defaultConfig
    }

    const updatedChain = {
      ...activeChain,
      steps: [...activeChain.steps, newStep]
    }
    ChainStore.saveChain(updatedChain)
    setChains(ChainStore.getChains())
    setEditingStep(newStep)
  }

  const handleExportJson = () => {
    if (!activeChain) return
    try {
      cyberAudio.copySuccess()
    } catch {}
    const jsonStr = ChainStore.exportJson(activeChain)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeChain.name.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToastSuccess(
      isTr ? 'Zincir İndirildi' : 'Chain Exported',
      `${activeChain.name}.json`
    )
  }

  const handleCopyText = (text: string, key: string) => {
    try {
      navigator.clipboard.writeText(text)
      cyberAudio.copySuccess()
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-nexus-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nexus-cyan/15 border border-nexus-cyan/30 flex items-center justify-center text-nexus-cyan shadow-inner">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-wide">
                {isTr ? 'Workflow Chains (İş Akışı Zincirleri)' : 'Workflow Chains Studio'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-nexus-cyan/20 to-purple-500/20 text-nexus-cyan border border-nexus-cyan/30">
                PIPELINE ENGINE
              </span>
            </div>
            <p className="text-xs text-nexus-muted mt-0.5">
              {isTr
                ? 'Stüdyoları birbirine bağlayan görsel ve scriptable API & veri boru hattı motoru'
                : 'Visual & scriptable pipeline chaining developer studios together'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunChain}
            disabled={isRunning || !activeChain}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
              isRunning
                ? 'bg-amber-500 text-black shadow-amber-500/20 animate-pulse'
                : 'bg-gradient-to-r from-nexus-cyan via-nexus-accent to-purple-600 text-black shadow-nexus-cyan/20 hover:brightness-110 active:scale-95'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : 'fill-black'}`} />
            <span>
              {isRunning
                ? (isTr ? 'Çalıştırılıyor...' : 'Executing Pipeline...')
                : (isTr ? 'Tüm Zinciri Çalıştır' : 'Run Workflow Chain')}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="p-2 rounded-xl bg-nexus-surface border border-nexus-border hover:border-nexus-cyan/40 text-nexus-muted hover:text-white transition cursor-pointer"
            title={isTr ? 'JSON İndir' : 'Export JSON'}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetTemplates}
            className="p-2 rounded-xl bg-nexus-surface border border-nexus-border hover:border-nexus-cyan/40 text-nexus-muted hover:text-white transition cursor-pointer"
            title={isTr ? 'Varsayılan Şablonlara Sıfırla' : 'Reset Templates'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Chains Sidebar & Center Workflow Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Chains List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-nexus-muted">
              {isTr ? 'Kayıtlı Zincirler' : 'Pipelines'} ({chains.length})
            </span>
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex items-center gap-1 text-xs text-nexus-cyan hover:underline font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isTr ? 'Yeni Zincir' : 'New Chain'}</span>
            </button>
          </div>

          <div className="space-y-2">
            {chains.map((chain) => {
              const isActive = chain.id === activeChainId
              return (
                <div
                  key={chain.id}
                  onClick={() => handleSelectChain(chain.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isActive
                      ? 'bg-nexus-cyan/15 border-nexus-cyan/60 text-white shadow-md shadow-nexus-cyan/10'
                      : 'bg-nexus-surface/50 border-nexus-border/50 text-nexus-muted hover:text-nexus-text hover:border-nexus-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-nexus-bg border border-white/5 font-bold">
                      {chain.category}
                    </span>
                    <span className="text-[10px] text-nexus-muted font-mono">
                      {chain.steps.length} {isTr ? 'adım' : 'steps'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold truncate text-white">
                    {chain.name}
                  </h4>
                  <p className="text-[11px] text-nexus-muted line-clamp-2 mt-1">
                    {chain.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Center & Right Column: Pipeline Canvas & Live Output */}
        <div className="lg:col-span-3 space-y-6">
          {activeChain && (
            <>
              {/* Active Chain Overview Card */}
              <div className="p-4 rounded-xl bg-nexus-surface/60 border border-nexus-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{activeChain.name}</span>
                    {activeChain.isTemplate && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        OFFICIAL TEMPLATE
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-nexus-muted mt-0.5">
                    {activeChain.description}
                  </p>

                  {/* Variables pills */}
                  {Object.keys(activeChain.variables).length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-nexus-border/30">
                      <span className="text-[10px] font-mono text-nexus-muted">
                        {isTr ? 'Parametreler:' : 'Variables:'}
                      </span>
                      {Object.entries(activeChain.variables).map(([k, v]) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded bg-black/40 border border-nexus-border/50 text-[10px] font-mono text-nexus-cyan"
                        >
                          {`{{variables.${k}}}`}: <span className="text-nexus-muted">{v}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="dropdown relative">
                    <button
                      type="button"
                      onClick={() => handleAddStep('HTTP_REQUEST')}
                      className="px-3 py-1.5 rounded-lg bg-nexus-surface border border-nexus-border hover:border-nexus-cyan/40 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-nexus-cyan" />
                      <span>{isTr ? 'Adım Ekle' : 'Add Step'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Steps Flow Canvas */}
              <div className="space-y-4 relative">
                {activeChain.steps.map((step, idx) => {
                  const meta = STEP_TYPE_META[step.type] || STEP_TYPE_META.TRANSFORM
                  const Icon = meta.icon
                  const stepResult = activeStepResults[step.id]
                  const isEditing = editingStep?.id === step.id

                  return (
                    <div key={step.id} className="relative">
                      {/* Step Card */}
                      <motion.div
                        layout
                        className={`p-4 rounded-xl border transition-all ${
                          !step.enabled
                            ? 'opacity-40 bg-nexus-bg/50 border-nexus-border/30'
                            : stepResult?.status === 'success'
                            ? 'bg-nexus-surface/90 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                            : stepResult?.status === 'failed'
                            ? 'bg-nexus-surface/90 border-rose-500/40 shadow-sm shadow-rose-500/10'
                            : 'bg-nexus-surface/80 border-nexus-border/60 hover:border-nexus-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-black/40 border border-nexus-border flex items-center justify-center text-[11px] font-mono font-bold text-nexus-muted">
                              {idx + 1}
                            </span>

                            <div className={`p-2 rounded-lg border ${meta.bg}`}>
                              <Icon className={`w-4 h-4 ${meta.color}`} />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-xs font-bold text-white">
                                  {step.name}
                                </h3>
                                <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${meta.bg} ${meta.color}`}>
                                  {meta.label}
                                </span>
                              </div>

                              {/* Mini config preview */}
                              <div className="text-[11px] font-mono text-nexus-muted mt-1 truncate max-w-md">
                                {step.type === 'HTTP_REQUEST' && (
                                  <span>{(step.config as any).method} {(step.config as any).url}</span>
                                )}
                                {step.type === 'JSON_EXTRACT' && (
                                  <span>Path: {(step.config as any).path}</span>
                                )}
                                {step.type === 'TRANSFORM' && (
                                  <span>Op: {(step.config as any).transform}</span>
                                )}
                                {step.type === 'CRYPTO_SIGN' && (
                                  <span>{(step.config as any).algorithm?.toUpperCase()} ({(step.config as any).outputFormat})</span>
                                )}
                                {step.type === 'WEBHOOK_DISPATCH' && (
                                  <span>POST {(step.config as any).url}</span>
                                )}
                                {step.type === 'ASSERT' && (
                                  <span>{(step.config as any).expectedField} {(step.config as any).operator} {(step.config as any).expectedValue}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Execution Result Badge */}
                            {stepResult && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                                stepResult.status === 'success'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}>
                                {stepResult.status === 'success' ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                <span>{stepResult.durationMs}ms</span>
                              </span>
                            )}

                            {/* Enable/Disable Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleStep(step.id)}
                              className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                                step.enabled
                                  ? 'bg-nexus-cyan/15 text-nexus-cyan border-nexus-cyan/30'
                                  : 'bg-nexus-bg text-nexus-muted border-nexus-border'
                              }`}
                            >
                              {step.enabled ? 'ON' : 'OFF'}
                            </button>

                            {/* Delete Step */}
                            <button
                              type="button"
                              onClick={() => handleDeleteStep(step.id)}
                              className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                              title={isTr ? 'Adımı Sil' : 'Delete Step'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Step Result Output Preview */}
                        {stepResult && (
                          <div className="mt-3 pt-3 border-t border-nexus-border/30 text-[11px] font-mono">
                            {stepResult.error ? (
                              <div className="text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                                {stepResult.error}
                              </div>
                            ) : (
                              <div className="bg-black/40 p-2.5 rounded-lg border border-nexus-border/40 text-nexus-cyan flex items-start justify-between gap-2 overflow-x-auto max-h-28">
                                <pre className="whitespace-pre-wrap break-all">
                                  {typeof stepResult.output === 'object'
                                    ? JSON.stringify(stepResult.output, null, 2)
                                    : String(stepResult.output)}
                                </pre>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(
                                    typeof stepResult.output === 'object'
                                      ? JSON.stringify(stepResult.output, null, 2)
                                      : String(stepResult.output),
                                    step.id
                                  )}
                                  className="text-nexus-muted hover:text-white shrink-0 p-1"
                                >
                                  {copiedKey === step.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>

                      {/* Animated Connector Arrow between steps */}
                      {idx < activeChain.steps.length - 1 && (
                        <div className="flex justify-center my-1">
                          <div className="w-0.5 h-4 bg-gradient-to-b from-nexus-cyan to-purple-500 rounded-full" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Step Quick Adder Bar */}
              <div className="p-3 rounded-xl bg-nexus-surface/40 border border-dashed border-nexus-border/60 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-nexus-muted">
                  {isTr ? 'Adım Ekle:' : 'Quick Add Step:'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      { type: 'HTTP_REQUEST', label: 'API İstek' },
                      { type: 'JSON_EXTRACT', label: 'JSON Filtre' },
                      { type: 'TRANSFORM', label: 'Dönüştür' },
                      { type: 'CRYPTO_SIGN', label: 'HMAC İmzala' },
                      { type: 'WEBHOOK_DISPATCH', label: 'Webhook' },
                      { type: 'ASSERT', label: 'Doğrulama' }
                    ] as const
                  ).map((btn) => (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => handleAddStep(btn.type)}
                      className="px-2.5 py-1 rounded-lg bg-nexus-surface border border-nexus-border hover:border-nexus-cyan/40 text-[11px] font-medium text-white transition cursor-pointer"
                    >
                      ＋ {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Execution Summary Report Banner */}
              {executionReport && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border ${
                    executionReport.status === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {executionReport.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      )}
                      <h4 className="text-sm font-bold text-white">
                        {executionReport.status === 'success'
                          ? (isTr ? 'Zincir Başarıyla Tamamlandı' : 'Pipeline Execution Succeeded')
                          : (isTr ? 'Zincir Hatayla Sonlandı' : 'Pipeline Execution Failed')}
                      </h4>
                    </div>

                    <span className="text-xs font-mono font-bold text-white">
                      {isTr ? 'Toplam Süre:' : 'Total Latency:'} {executionReport.totalDurationMs}ms
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-nexus-muted pt-2 border-t border-white/5">
                    <div>Adımlar: {executionReport.stepResults.length}</div>
                    <div>Başarılı: {executionReport.stepResults.filter((s) => s.status === 'success').length}</div>
                    <div>Atlanan: {executionReport.stepResults.filter((s) => s.status === 'skipped').length}</div>
                    <div>Hatalı: {executionReport.stepResults.filter((s) => s.status === 'failed').length}</div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
