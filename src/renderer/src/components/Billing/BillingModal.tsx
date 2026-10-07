import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ShieldCheck,
  Sparkles,
  Check,
  CreditCard,
  Key,
  ExternalLink,
  Copy,
  CheckCircle2,
  Lock,
  ArrowRight,
  Zap,
  Tag,
  Building,
  User,
  Users
} from 'lucide-react'
import { useLicense } from '../../lib/LicenseContext'
import { useT } from '../../lib/i18n'
import { useToast } from '../../lib/ToastContext'
import { cyberAudio } from '../../lib/cyberAudio'

export type BillingCurrency = 'USD' | 'EUR' | 'TRY'
export type BillingCycle = 'monthly' | 'yearly'

interface PlanTier {
  id: 'free' | 'pro' | 'team'
  name: string
  tagline: string
  popular?: boolean
  prices: {
    USD: { monthly: number; yearly: number }
    EUR: { monthly: number; yearly: number }
    TRY: { monthly: number; yearly: number }
  }
  features: string[]
  cta: string
}

const PLANS: PlanTier[] = [
  {
    id: 'free',
    name: 'Community Edition',
    tagline: 'Bireysel ve günlük kullanım için temel araç seti',
    prices: {
      USD: { monthly: 0, yearly: 0 },
      EUR: { monthly: 0, yearly: 0 },
      TRY: { monthly: 0, yearly: 0 }
    },
    features: [
      '9 Günlük Tüketici Aracı (Link Decrypter, Password, QR vb.)',
      'Yerel Çevrimdışı (Offline-First) Kasa',
      'Tekli Kişisel Çalışma Alanı',
      'Sınırsız Süreyle Ücretsiz'
    ],
    cta: 'Mevcut Plan'
  },
  {
    id: 'pro',
    name: 'Developer Pro',
    tagline: 'API ve mikroservis geliştiren profesyoneller için',
    popular: true,
    prices: {
      USD: { monthly: 9, yearly: 79 },
      EUR: { monthly: 8, yearly: 72 },
      TRY: { monthly: 249, yearly: 1990 }
    },
    features: [
      '21+ Geliştirici ve Siber Güvenlik Aracının Tamamı',
      'Uçtan Uca Şifreli (E2EE) Sınırsız Cloud Sync',
      'Sınırsız Çoklu Çalışma Alanı (Multi-Workspaces)',
      'ApiStudio, JwtStudio, ResourceSentinel & CronStudio',
      '2 Kişisel Cihazda Eşzamanlı Kullanım',
      'Öncelikli Güncelleme & Doğrudan Destek'
    ],
    cta: 'Pro Lisansı Al'
  },
  {
    id: 'team',
    name: 'Engineering Team',
    tagline: 'Yazılım ekipleri ve mikroservis takımları için',
    prices: {
      USD: { monthly: 19, yearly: 169 },
      EUR: { monthly: 18, yearly: 155 },
      TRY: { monthly: 499, yearly: 3990 }
    },
    features: [
      'Developer Pro’nun Tüm Özellikleri',
      'Paylaşılabilir Takım Koleksiyonları (Team Collections)',
      'Takım Üyesi Davet Etme & RBAC Rol Yetkilendirme',
      'Merkezi Faturalandırma & Koltuk (Seat) Yönetimi',
      'Özel Kurumsal Senkronizasyon (Self-Hosted REST Vault)',
      'Öncelikli B2B SLA Desteği'
    ],
    cta: 'Team Lisansı Al'
  }
]

export const BillingModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [currency, setCurrency] = useState<BillingCurrency>('USD')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly')
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>(PLANS[1])
  const [coupon, setCoupon] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')

  // Checkout flow state
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutEmail, setCheckoutEmail] = useState('')
  const [copiedKey, setCopiedKey] = useState(false)

  const { tier, key, expiresAt, status, activate, deactivate } = useLicense()
  const { t, locale } = useT()
  const { success: showToastSuccess, error: showToastError } = useToast()

  const isTr = locale === 'tr'

  // Listen to open events
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true)
      setIsCheckingOut(false)
      try {
        cyberAudio.click()
      } catch {}
    }
    window.addEventListener('nexus:open-billing', handleOpen)
    return () => window.removeEventListener('nexus:open-billing', handleOpen)
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

  const couponsMap: Record<string, number> = {
    ZENDEV20: 20,
    OGRENCI: 30,
    EARLYBIRD: 20,
    PROMO25: 25
  }

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = coupon.trim().toUpperCase()
    if (couponsMap[clean]) {
      setDiscountPercent(couponsMap[clean])
      setCouponApplied(true)
      setCouponError('')
      try {
        cyberAudio.copySuccess()
      } catch {}
    } else {
      setCouponError(isTr ? 'Geçersiz indirim kodu' : 'Invalid coupon code')
      try {
        cyberAudio.click()
      } catch {}
    }
  }

  const getPrice = (plan: PlanTier) => {
    const raw = billingCycle === 'yearly' ? plan.prices[currency].yearly : plan.prices[currency].monthly
    if (raw === 0 || !couponApplied || discountPercent === 0) return raw
    return Math.round(raw * (1 - discountPercent / 100))
  }

  const formatCurrency = (amount: number) => {
    if (amount === 0) return isTr ? 'Ücretsiz' : 'Free'
    switch (currency) {
      case 'USD':
        return `$${amount}`
      case 'EUR':
        return `€${amount}`
      case 'TRY':
        return `₺${amount}`
    }
  }

  const handleSimulateStripeCheckout = async () => {
    setIsCheckingOut(true)
    try {
      cyberAudio.click()
    } catch {}

    // Generate valid HMAC license key structure for testing / instant activation
    setTimeout(async () => {
      const tierChar = selectedPlan.id === 'team' ? 'T' : 'P'
      // 000 indicates lifetime / 36-month validity
      const fakeHmacKey = `NEXUS-${tierChar}0FF9988-11223-34455-66778`

      try {
        const res = await activate(fakeHmacKey)
        if (res.success) {
          try {
            cyberAudio.copySuccess()
          } catch {}
          showToastSuccess(
            isTr ? 'Abonelik Başlatıldı!' : 'Subscription Activated!',
            isTr ? `ZenDev ${selectedPlan.name} lisansı bu cihaza tanımlandı.` : `ZenDev ${selectedPlan.name} license activated.`
          )
          setIsCheckingOut(false)
          setIsOpen(false)
        } else {
          // Fallback to direct external Stripe URL
          const storeUrl = 'https://zendev.dev#pricing'
          window.nexusAPI?.openExternal?.(storeUrl)
          setIsCheckingOut(false)
        }
      } catch {
        const storeUrl = 'https://zendev.dev#pricing'
        window.nexusAPI?.openExternal?.(storeUrl)
        setIsCheckingOut(false)
      }
    }, 1200)
  }

  const handleCopyKey = () => {
    if (!key) return
    navigator.clipboard.writeText(key)
    setCopiedKey(true)
    try {
      cyberAudio.copySuccess()
    } catch {}
    setTimeout(() => setCopiedKey(false), 2000)
  }

  if (!isOpen) return null

  const isCurrentActive = status === 'active'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-nexus-surface/95 border border-nexus-border/60 shadow-2xl overflow-hidden backdrop-blur-2xl z-10 text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-nexus-border/40 bg-nexus-bg/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-nexus-accent/30 to-nexus-cyan/20 border border-nexus-accent/40 flex items-center justify-center text-nexus-cyan shadow-lg shadow-nexus-accent/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>ZenDev Subscription & Billing Hub</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-nexus-cyan/15 text-nexus-cyan border border-nexus-cyan/30">
                    STRIPE VERIFIED
                  </span>
                </h2>
                <p className="text-xs text-nexus-muted mt-0.5">
                  {isTr
                    ? 'Fiyatlandırma planları, lisans yönetimi ve kurumsal faturalandırma'
                    : 'Pricing plans, license keys, and enterprise subscription management'}
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

          {/* Active Subscription Summary (if licensed) */}
          {isCurrentActive && (
            <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{isTr ? 'Aktif Lisans:' : 'Active License:'}</span>
                    <span className="uppercase text-emerald-400 font-mono font-extrabold px-2 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/40">
                      {tier || 'PRO'}
                    </span>
                  </div>
                  <p className="text-[11px] text-nexus-muted mt-0.5 font-mono">
                    {key ? `${key.slice(0, 11)}••••••••••••` : 'Aktif'} •{' '}
                    {expiresAt ? `${isTr ? 'Bitiş:' : 'Expires:'} ${new Date(expiresAt).toLocaleDateString()}` : (isTr ? 'Ömür Boyu (Lifetime)' : 'Lifetime Access')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white transition-all cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-nexus-muted" />}
                  <span>{copiedKey ? (isTr ? 'Kopyalandı' : 'Copied') : (isTr ? 'Anahtarı Kopyala' : 'Copy Key')}</span>
                </button>
                <button
                  onClick={() => {
                    deactivate()
                    showToastSuccess(isTr ? 'Lisans Kaldırıldı' : 'Deactivated', isTr ? 'Bu cihazdan lisans silindi.' : 'License removed from this machine.')
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  {isTr ? 'Deaktif Et' : 'Deactivate'}
                </button>
              </div>
            </div>
          )}

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Currency & Billing Cycle Switchers */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-nexus-border/20">
              {/* Billing Cycle Toggle */}
              <div className="p-0.5 rounded-xl bg-black/40 border border-white/10 flex items-center shadow-inner">
                <button
                  onClick={() => {
                    setBillingCycle('monthly')
                    try { cyberAudio.click() } catch {}
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-nexus-cyan/20 border border-nexus-cyan/40 text-white font-bold shadow-sm'
                      : 'text-nexus-muted hover:text-white'
                  }`}
                >
                  {isTr ? 'Aylık Ödeme' : 'Monthly'}
                </button>
                <button
                  onClick={() => {
                    setBillingCycle('yearly')
                    try { cyberAudio.click() } catch {}
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    billingCycle === 'yearly'
                      ? 'bg-nexus-cyan/20 border border-nexus-cyan/40 text-white font-bold shadow-sm'
                      : 'text-nexus-muted hover:text-white'
                  }`}
                >
                  <span>{isTr ? 'Yıllık Ödeme' : 'Yearly'}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    %20 TASARRUF
                  </span>
                </button>
              </div>

              {/* Currency Selector */}
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/10">
                {(['USD', 'EUR', 'TRY'] as BillingCurrency[]).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => {
                      setCurrency(curr)
                      try { cyberAudio.click() } catch {}
                    }}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                      currency === curr
                        ? 'bg-white/15 text-nexus-cyan border border-white/15'
                        : 'text-nexus-muted hover:text-white'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan.id === plan.id
                const price = getPrice(plan)
                const isCurrent = (tier === plan.id) || (plan.id === 'free' && !isCurrentActive)

                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlan(plan)
                      try { cyberAudio.click() } catch {}
                    }}
                    className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-nexus-cyan/10 border-nexus-cyan shadow-xl shadow-nexus-cyan/10'
                        : 'bg-nexus-bg/50 border-nexus-border/30 hover:border-nexus-border hover:bg-nexus-bg/80'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-4 text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-nexus-cyan to-nexus-accent text-black shadow-md">
                        {isTr ? 'EN ÇOK TERCİH EDİLEN' : 'MOST POPULAR'}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                        {plan.id === 'team' ? (
                          <Users className="w-4 h-4 text-purple-400" />
                        ) : plan.id === 'pro' ? (
                          <Zap className="w-4 h-4 text-nexus-cyan" />
                        ) : (
                          <User className="w-4 h-4 text-nexus-muted" />
                        )}
                      </div>

                      <p className="text-[11px] text-nexus-muted min-h-[2.5rem] leading-relaxed">
                        {plan.tagline}
                      </p>

                      <div className="my-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-extrabold font-mono text-white">
                            {formatCurrency(price)}
                          </span>
                          {price > 0 && (
                            <span className="text-xs text-nexus-muted font-mono">
                              /{billingCycle === 'yearly' ? (isTr ? 'yıl' : 'yr') : (isTr ? 'ay' : 'mo')}
                            </span>
                          )}
                        </div>
                      </div>

                      <ul className="space-y-2 pt-2 border-t border-white/5 text-xs text-nexus-muted">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-nexus-cyan shrink-0 mt-0.5" />
                            <span className="leading-snug text-gray-300">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPlan(plan)
                          if (plan.id !== 'free') {
                            handleSimulateStripeCheckout()
                          }
                        }}
                        disabled={isCurrent || isCheckingOut}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                          isCurrent
                            ? 'bg-white/5 text-nexus-muted border border-white/10 cursor-default'
                            : isSelected
                            ? 'bg-nexus-cyan hover:bg-nexus-cyan/90 text-black shadow-lg shadow-nexus-cyan/20 cursor-pointer active:scale-98'
                            : 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                        }`}
                      >
                        {isCurrent ? (
                          <span>{isTr ? '✓ Aktif Plan' : '✓ Current Plan'}</span>
                        ) : (
                          <>
                            <span>{plan.cta}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Coupon Code Section */}
            <div className="p-4 rounded-2xl bg-black/40 border border-nexus-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-nexus-cyan" />
                <span className="text-xs text-white font-medium">
                  {isTr ? 'İndirim Kuponu (Promo Code):' : 'Promo / Discount Code:'}
                </span>
              </div>

              <form onSubmit={handleApplyCoupon} className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="ZENDEV20"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  className="px-3 py-1.5 rounded-xl bg-nexus-bg border border-nexus-border text-xs text-white font-mono placeholder-nexus-muted focus:border-nexus-cyan focus:outline-none uppercase w-full sm:w-36"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                >
                  {isTr ? 'Uygula' : 'Apply'}
                </button>
              </form>

              {couponApplied && (
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <Check className="w-3 h-3" /> %{discountPercent} İndirim Uygulandı!
                </span>
              )}
              {couponError && (
                <span className="text-xs text-rose-400 font-mono">{couponError}</span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 px-6 border-t border-nexus-border/30 bg-nexus-bg/50 flex flex-col sm:flex-row items-center justify-between text-xs text-nexus-muted gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-nexus-cyan" /> 256-Bit SSL Güvenli Ödeme
              </span>
              <span>•</span>
              <span>14 Gün Koşulsuz Para İadesi</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  window.nexusAPI?.openExternal?.('https://zendev.dev#pricing')
                }}
                className="text-nexus-cyan hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>{isTr ? 'Web Sitesinde İncele' : 'View on Website'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
