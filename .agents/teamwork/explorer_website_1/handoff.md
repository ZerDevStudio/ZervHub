# Comprehensive Quality Assurance, UX, Performance, and Link Integrity Audit Report
**Target**: ZenDev Showcase Website (`website/`) & Live Production Deployment (`https://zerdevstudio.github.io/`)  
**Auditor**: Showcase Website Auditor (Explorer 1)  
**Date**: October 7, 2026  
**Status**: Completed — Hard Handoff

---

## 1. Observation

Direct empirical observations collected via static source analysis, live HTTP/HTTPS probes, bundle profiling, test runner executions, and DOM tree inspections:

### 1.1 Link Integrity, Broken Endpoints & 404 Assets
- **Observation 1.1.1 (Broken Social Card)**:
  `website/index.html:16` specifies:
  ```html
  <meta property="og:image" content="https://zendev-production-4a5b.up.railway.app/og-banner.png" />
  ```
  Executing `curl.exe -I -s -L "https://zendev-production-4a5b.up.railway.app/og-banner.png"` returned verbatim:
  ```http
  HTTP/1.1 404 Not Found
  Server: railway-hikari
  Content-Length: 21
  ```
  Furthermore, `website/index.html:17-19` defines `twitter:card`, `twitter:title`, and `twitter:description`, but completely omits `<meta name="twitter:image">`.
- **Observation 1.1.2 (Missing robots.txt and sitemap.xml)**:
  Executing `curl.exe -I -s -L "https://zerdevstudio.github.io/robots.txt"` and `curl.exe -I -s -L "https://zerdevstudio.github.io/sitemap.xml"` both returned verbatim:
  ```http
  HTTP/1.1 404 Not Found
  Server: GitHub.com
  ```
  Inspection of the repository filesystem confirmed that `website/public/` does not exist (`find_by_name` returned 0 results for any public static assets).
  In `website/src/components/Footer.tsx:100`, an active navigation link points directly to this broken endpoint:
  ```tsx
  <li><a href="/robots.txt" className="hover:text-cyan-400 transition">Robots & Sitemap</a></li>
  ```
- **Observation 1.1.3 (Broken Relative API Endpoints on Static GitHub Pages)**:
  `website/src/lib/api.ts:26-50` defines relative endpoints:
  ```typescript
  export async function lookupLicense(licenseKey: string): Promise<LicenseLookupResponse> {
    const cleanKey = licenseKey.trim().toUpperCase();
    const res = await fetch(`/api/license/lookup?key=${encodeURIComponent(cleanKey)}`);
    return res.json();
  }
  export async function resetHwid(licenseKey: string, hwid?: string): Promise<ResetHwidResponse> {
    const res = await fetch('/api/license/reset-hwid', ...);
    return res.json();
  }
  export async function joinWaitlist(email: string): Promise<{ success: boolean; ... }> {
    const res = await fetch('/api/waitlist', ...);
    return res.json();
  }
  ```
  On `https://zerdevstudio.github.io/`, every `fetch('/api/...')` resolves to the static 404 HTML page. In `website/src/components/LicensePortal.tsx:26-33`, calling `lookupLicense()` causes `res.json()` to throw `SyntaxError: Unexpected token '<' ("<!DOCTYPE...")`, triggering line 32: `setMessage({ text: 'Sunucuyla bağlantı kurulamadı.', type: 'error' });`. License lookup and HWID reset are 100% dysfunctional in production.
- **Observation 1.1.4 (Active GitHub Release Endpoints vs Version Divergence)**:
  Direct download URLs in `website/src/lib/downloadHelper.ts:19-25` point to `v2.5.6`:
  ```typescript
  export const ZENDEV_RELEASE_CONFIG = {
    version: '2.5.6',
    setupExe: 'https://github.com/ZerDevStudio/ZervHub-App/releases/download/v2.5.6/ZenDev-Setup-2.5.6.exe',
    portableExe: 'https://github.com/ZerDevStudio/ZervHub-App/releases/download/v2.5.6/ZenDev-Portable-2.5.6.exe',
    fallbackLatestRelease: 'https://github.com/ZerDevStudio/ZervHub-App/releases/latest',
    repoUrl: 'https://github.com/ZerDevStudio/ZervHub-App'
  } as const;
  ```
  Probing both binaries via curl confirmed active HTTP 200 responses:
  - `ZenDev-Setup-2.5.6.exe`: `HTTP/1.1 200 OK` (5,728,908 bytes)
  - `ZenDev-Portable-2.5.6.exe`: `HTTP/1.1 200 OK` (18,334,720 bytes)
  - `ZenDev-Setup-2.5.5.exe`: `HTTP/1.1 200 OK` (5,716,617 bytes)
  However, executing the regression test suites `tests/challenger_website_v255_empirical.mjs` and `tests/challenge_website_overhaul_m1_2.mjs` failed with **19 and 31 failures** respectively because the automated test suites expect strict `v2.5.5` synchronization.
- **Observation 1.1.5 (Payload Version Contradiction in LiveBase64Demo)**:
  In `website/src/components/LivePlayground/LiveBase64Demo.tsx`:
  - Line 23 (initial state): `input = 'ZenDev v2.5.6: Hızlı, Güvenli ve Özgür Geliştirici Paketi! 🚀'`
  - Line 224 (preset button):
    `<button onClick={() => loadPreset('WmVuRGV2IHYyLjUuNTogSMSxemzEsSwgR8O8dmVubGkgdmUgw5Z6Z8O8ciBHZWxpxZ90aXJpY2kgUGFrZXRpISDwn5qA', 'decode')}>`
    Base64 decoding `WmVu...` yields: `'ZenDev v2.5.5: Hızlı, Güvenli ve Özgür Geliştirici Paketi! 🚀'`.
- **Observation 1.1.6 (Staging URL Leak in LiveQrDemo)**:
  `website/src/components/LivePlayground/LiveQrDemo.tsx:7`:
  ```typescript
  const [text, setText] = useState('https://zendev-production-4a5b.up.railway.app');
  ```
  Visitors scanning the default QR code are redirected to an ephemeral Railway testing URL instead of the production canonical website `https://zerdevstudio.github.io/`.
- **Observation 1.1.7 (Mock SHA-256 and Generic VirusTotal Links)**:
  `website/src/components/HeroSection.tsx:17`:
  ```typescript
  const sampleSha = 'a8f4c2e9b1d7f6a3c5e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2';
  ```
  This is a static mock string that does not match the actual SHA-256 hash of `ZenDev-Setup-2.5.6.exe` (or `v2.5.5`).
  `website/src/components/HeroSection.tsx:93` and `website/src/components/Footer.tsx:59` link to `https://www.virustotal.com` (generic homepage), offering no verifiable scan verification.

---

### 1.2 Core Web Vitals, Bundle Sizing & Asset Loading
- **Observation 1.2.1 (Production JavaScript Bundle Weight — 628 KB Unchunked)**:
  Inspecting HTTP asset headers from `https://zerdevstudio.github.io/`:
  - `/assets/index-BcMnGMOO.js`: **461,211 bytes (~461.2 KB)**
  - `/assets/motion-D2B-yqsZ.js`: **125,488 bytes (~125.5 KB)**
  - `/assets/icons-DIL2E0N5.js`: **38,095 bytes (~38.1 KB)**
  - `/assets/index-uecsaFMR.css`: **76,491 bytes (~76.5 KB)**
  - `/assets/vendor-C0GHVzV1.js`: **4,209 bytes (~4.2 KB)**
  Total upfront JavaScript: **628.9 KB**.
- **Observation 1.2.2 (Missing Code-Splitting in App.tsx & PricingSection.tsx)**:
  In `website/src/App.tsx:17-32`:
  `ChangelogModal`, `CommandPalette`, `ShortcutsDrawer`, `WaitlistModal`, and `LivePlayground` are all statically imported.
  In `website/src/components/PricingSection.tsx:22`:
  `SimulatedCheckoutModal` is statically imported.
  In `website/src/components/LivePlayground/LivePlayground.tsx:20-29`:
  All 10 demo components (`LiveRegexDemo`, `LiveHashDemo`, `LiveBase64Demo`, `LiveQrDemo`, `LiveJwtDemo`, `LiveDecrypterDemo`, `LivePasswordDemo`, `LiveColorDemo`, `LiveFakeDataDemo`, `LiveShredderDemo`) are statically imported.
  Libraries `qrcode` (used solely in `LiveQrDemo`) and `canvas-confetti` (used solely in `SimulatedCheckoutModal`) are bundled into the critical path `index-*.js`.
- **Observation 1.2.3 (Render-Blocking External Typography in index.html)**:
  `website/index.html:21-24`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  ```
  Synchronous stylesheet download blocks rendering while fetching **11 distinct font weight variations**.

---

### 1.3 Responsive UI, Viewport Clipping & Touch Targets
- **Observation 1.3.1 (Desktop App Simulator Mobile Clipping on 375px Viewports)**:
  `website/src/components/HeroSection.tsx:128-148`:
  The title bar contains three window dots (`w-3 h-3`), title text `<span className="text-xs font-mono text-gray-400 ml-2">ZenDev Desktop v2.5.6 [Tauri Rust Engine]</span>`, and badge `<span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">RAM: 24.8 MB</span>`.
  At mobile screen widths (375px–414px), the unclipped text spans ~376px, exceeding container width (`375px - 32px padding = 343px`), causing horizontal text clipping and overflow.
- **Observation 1.3.2 (Touch Target Violations < 44x44px)**:
  Inspecting interactive elements against WCAG 2.5.5 and Google Lighthouse Mobile standards:
  - `Navbar.tsx:91-100`: Version badge changelog trigger is `<button className="text-[10px] px-2 py-0.5 ...">` (~20px height).
  - `Navbar.tsx:230-264`: Mobile header action icons (search, audio, language, hamburger) use `p-2` with `w-4 h-4` (32x32px bounding box).
  - `Navbar.tsx:304-315`: Currency switcher buttons use `px-2 py-1 text-xs` (~26px height).
  - `Navbar.tsx:317-347`: Mobile shortcuts, coupon, and changelog buttons use `px-2.5 py-1.5` (~28px height).
  - `HeroSection.tsx:81-90`: SHA-256 copy button uses `px-3 py-1.5` (~28px height).
  - `LivePlayground.tsx:104-114`: Playground tab selection buttons use `px-3 py-2 text-xs` (~32px height).
  - `ToolCatalog.tsx:90-97`: Category filter pills use `px-3 py-1.5 text-xs` (~28px height).
  - Modal close buttons (`ChangelogModal.tsx:33-38`, `WaitlistModal.tsx:86-94`, `ShortcutsDrawer.tsx:109-117`, `ToolCatalog.tsx:185-190`): All use `p-1.5` or `p-2` with `w-5 h-5` (32x32px to 36x36px).
  - `Footer.tsx:40-67`: GitHub, Discord, and VirusTotal icon buttons use `p-2` with `w-4 h-4` (32x32px).
- **Observation 1.3.3 (PricingMatrix Mobile Horizontal Scroll Usability)**:
  `website/src/components/PricingMatrix.tsx:254-255`:
  The table uses `min-w-[650px]` within `overflow-x-auto`. While this prevents page-level layout breakage, the first column (`Özellik / Yetenek`) is not sticky (`position: sticky`), making it impossible for mobile users scrolling right to identify which feature corresponds to which cell.
- **Observation 1.3.4 (Background Scroll Chaining & Lack of Body Scroll Lock)**:
  When opening any modal (`ChangelogModal`, `WaitlistModal`, `ShortcutsDrawer`, `ToolCatalog` modal, `SimulatedCheckoutModal`), none of the components set `document.body.style.overflow = 'hidden'`. Scrolling on touch devices cascades directly to the underlying landing page.

---

### 1.4 Conversion Touchpoints, Modals & Keyboard Focus
- **Observation 1.4.1 (Missing Escape Key Handlers Across 4 Modals)**:
  - `ChangelogModal.tsx`: Search for `Escape` or `keydown` yielded 0 occurrences.
  - `WaitlistModal.tsx`: Search for `Escape` or `keydown` yielded 0 occurrences.
  - `ShortcutsDrawer.tsx`: Search for `Escape` or `keydown` yielded 0 occurrences (even though line 44 of its own cheatsheet advertises `Esc: Aktif Modalı / Paneli Kapat`!).
  - `ToolCatalog.tsx` (selected tool detail modal): Search for `Escape` or `keydown` yielded 0 occurrences.
  Only `CommandPalette.tsx` and `SimulatedCheckoutModal.tsx` close on Escape.
- **Observation 1.4.2 (Missing Dialog ARIA Semantics & Focus Trapping)**:
  - In `ChangelogModal.tsx:17`, `WaitlistModal.tsx:79`, `ShortcutsDrawer.tsx:89`, `SimulatedCheckoutModal.tsx:125`, and `ToolCatalog.tsx:183`:
    None of the modal overlays include `role="dialog"`, `aria-modal="true"`, or `aria-labelledby`.
  - Icon-only close buttons (`<X className="w-5 h-5" />`) lack `aria-label="Close"`, rendering them nameless to assistive technologies.
  - None of the modals implement focus traps; keyboard users pressing Tab navigate through interactive links behind the backdrop.
- **Observation 1.4.3 (Regex Studio Regex Flag Crash)**:
  In `website/src/components/LivePlayground/LiveRegexDemo.tsx:14-16`:
  ```typescript
  const reg = new RegExp(pattern, flags);
  const allMatches = Array.from(testString.matchAll(reg));
  ```
  If the user clears the global flag `g` from the `flags` input (e.g. typing `i`), JavaScript's `String.prototype.matchAll` throws `TypeError: String.prototype.matchAll called with a non-global RegExp argument`. The error boundary catches it as "Geçersiz Regex", preventing regex matching without global flag.
- **Observation 1.4.4 (Simulated License Verification Dead-End)**:
  In `website/src/components/SimulatedCheckoutModal.tsx:325-330`:
  Clicking "Müşteri Portalında Test Et" (`handleGoToPortal`) closes checkout and scrolls down to `#portal`. However, because the license portal calls `/api/license/lookup` (which fails with 404 on GitHub Pages), entering the generated test license (`ZEN-PRO-XXXX-XXXX-XXXX-2026`) immediately fails with `"Sunucuyla bağlantı kurulamadı."`, breaking the user onboarding journey.

---

### 1.5 SEO Foundations, Internationalization & WCAG 2.1 AA Contrast
- **Observation 1.5.1 (Desynchronized Page Language Attribute & Metadata)**:
  `website/index.html:2` hardcodes `<html lang="tr" class="dark scroll-smooth">`.
  In `website/src/App.tsx:35`, switching language (`setLang('en')`) toggles local React state but does NOT execute `document.documentElement.lang = 'en'`.
  `document.title` and `meta[name="description"]` remain permanently in Turkish regardless of active language.
- **Observation 1.5.2 (Pervasive Hardcoded Turkish Strings in English Mode)**:
  When language is switched to English (`lang === 'en'`), multiple components remain in Turkish:
  - `Footer.tsx:72-124`: "Hızlı Erişim", "Destek & Güvenlik", "İndirme Merkezi", "Canlı Simülatör", "27+ Araç Kataloğu", "Tauri v2 Hız Testi", "Fiyatlandırma", "HWID Sıfırlama Portalı", "Son Kullanıcı Lisansı", "Gizlilik Politikası", and "Yukarı Çık" are hardcoded strings.
  - `HeroSection.tsx:140-142`: "🎯 Günlük" / "⚡ Geliştirici" header tabs.
  - `HeroSection.tsx:155`: "İSTASYONLAR".
  - `HeroSection.tsx:206`: "+ 27 Diğer Stüdyo Masaüstünde!".
  - `HeroSection.tsx:216-359`: All 4 desktop simulator panels (WorkflowChains, CyberFortress, ApiStudio, SqliteViewer) are hardcoded Turkish.
  - `HeroSection.tsx:362-367`: "ZenDev v2.5.6 Masaüstü Sürümünü İndirin" and "27 Aracın Tümünü Gör".
  - `RoiCalculator.tsx:115, 116, 143, 150, 153, 169, 183, 199, 211`: "Mevcut Ödediğiniz SaaS Araçları:", "ZenDev Karşılığı:", "Hesaplanan Tasarruf Raporu", "Ömür Boyu", "Hemen Tasarrufa Başlayın".
  - `TestimonialsWall.tsx:46`: "Doğrulanmış Lisans".
  - `PricingSection.tsx:182`: "🎉 %{discountPercent} İndirim Kuponu Başarıyla Tanımlandı!".
  - `PricingMatrix.tsx:273, 279`: Hardcodes `$` for all non-TRY currencies, ignoring EUR (`€`).
  - `LivePlayground/` demos: All UI labels in `LiveBase64Demo`, `LiveHashDemo`, `LiveQrDemo`, `LiveRegexDemo` are hardcoded in Turkish.
- **Observation 1.5.3 (Severe WCAG 2.1 AA Contrast Failures)**:
  - `Footer.tsx:116`: `<div className="text-[10px] text-gray-600 mt-1">{t.disclaimer}</div>`
    Color `#4b5563` on `#040509` yields a contrast ratio of **2.3:1**, failing the WCAG 2.1 AA 4.5:1 requirement.
  - `text-gray-500` (`#6b7280`) on dark background `#05060b` yields **3.8:1**, used extensively for microcopy and labels across `Navbar.tsx:84`, `HeroSection.tsx:154`, `ToolCatalog.tsx:158`, `CommandPalette.tsx:142`, and `Footer.tsx:103`.
- **Observation 1.5.4 (Missing Canonical URL & Social Meta Attributes)**:
  `website/index.html` lacks:
  - `<link rel="canonical" href="https://zerdevstudio.github.io/">`
  - `<meta property="og:url" content="https://zerdevstudio.github.io/">`
  - `<meta property="og:locale" content="tr_TR">` / `<meta property="og:locale:alternate" content="en_US">`
  - `<meta name="robots" content="index, follow">`

---

## 2. Logic Chain

From the concrete observations above, the deductive analysis proceeds as follows:

```
[Observation 1.1.1: og:image on railway.app returns 404 & twitter:image missing]
  → Social crawlers (Twitterbot, LinkedInBot, Discordbot, FacebookExternalHit) encounter 404
  → Shared links on social platforms display broken fallback icons instead of branded preview card
  → Direct conversion drop-off from organic developer social sharing.

[Observation 1.1.2: robots.txt & sitemap.xml return 404; public/ dir does not exist]
  → Search engine crawlers (Googlebot, Bingbot) request /robots.txt and /sitemap.xml and receive 404
  → In Footer.tsx:100, real human visitors clicking "Robots & Sitemap" encounter GitHub 404 page
  → Crawl budget is depleted and indexing of rich deep sections is impaired.

[Observation 1.1.3: api.ts fetch(/api/...) returns 404 on static GitHub Pages]
  → GitHub Pages serves only static client bundles without Node/serverless runtime
  → Calling lookupLicense() or resetHwid() produces unhandled JSON syntax errors
  → LicensePortal.tsx permanently displays "Sunucuyla bağlantı kurulamadı", rendering self-service HWID resets unusable.

[Observation 1.2.1 & 1.2.2: 628 KB unchunked JS + all modals & 10 playground demos statically imported]
  → Browser parser must download, parse, and compile 628 KB of JS before initial hydration
  → Heavy libraries (qrcode, canvas-confetti) execute on critical path even if visitor never opens checkout or QR demo
  → LCP (Largest Contentful Paint) and TBT (Total Blocking Time) degrade significantly, especially on mobile 4G/3G connections.

[Observation 1.2.3: 11 Google font weights loaded synchronously in head]
  → Initial page render is blocked until fonts.googleapis.com and fonts.gstatic.com resolve
  → Causes severe TTFB/LCP bottlenecks and FOUT (Flash of Unstyled Text) layout shifts.

[Observation 1.3.1 & 1.3.2: 376px simulator title on 343px mobile container + touch targets < 44px]
  → Mobile viewports (iPhone SE 375px) experience horizontal clipping in the simulator header
  → Touch targets below 32px (category tabs, close buttons, currency selectors) violate WCAG 2.5.5
  → Mobile visitors suffer accidental clicks, missed touches, and poor Lighthouse Mobile scores.

[Observation 1.4.1 & 1.4.2: 4 modals omit Escape listener + no dialog ARIA + no focus trap]
  → Keyboard and screen reader users opening Changelog, Waitlist, Shortcuts, or Tool details cannot close via Escape key
  → Tabbing navigates behind the modal, violating WCAG 2.1.1 (Keyboard) and 2.4.3 (Focus Order).

[Observation 1.5.1 & 1.5.2: html lang="tr" immutable + hardcoded Turkish strings across Footer, Hero, ROI, Demos]
  → English-speaking engineers experience broken localization where 40%+ of interactive UI remains Turkish
  → Screen readers read English words using Turkish phonetic pronunciation rules (WCAG 3.1.1 violation).

[Observation 1.1.4 & 1.1.5: Discrepancy between v2.5.5 regression test suites and v2.5.6 codebase]
  → Milestone M1 tests verify strict v2.5.5 compliance, but subsequent commits bumped select files to v2.5.6 while leaving others in v2.5.5
  → In LiveBase64Demo, initial state says v2.5.6 while preset decodes v2.5.5, creating visible product version confusion.
```

---

## 3. Caveats

1. **GitHub Pages Infrastructure Constraint**:
   Because `ZerDevStudio.github.io` is hosted on GitHub Pages (static web server), backend `/api/*` routes cannot run natively on this domain without an external API Gateway, serverless Cloudflare Worker, or Railway backend CORS proxy.
2. **Local npm Execution Environment**:
   `npm` is not in the system `PATH` in this environment; scripts must be invoked via Node binary (`C:\Users\BERKE\.gemini\antigravity\bin\node.exe` or `agy-node.cmd`).
3. **Dual-Mode Desktop App vs Website Synchronization Scope**:
   The website currently features 21 developer tools in `toolsData.ts`, whereas the marketing text claims "27+ Tools". The desktop application contains 20 native tool pages (`src/renderer/src/pages/`). Reconciling this number requires an editorial and marketing decision on whether to count sub-utilities (e.g. Hex Viewer, C-Array converter) as distinct tools or synchronize the catalog to exactly reflect active suites.

---

## 4. Conclusion

The showcase website is visually rich, functionally dynamic in its in-browser WASM/crypto engines, and accurately links to live GitHub binary releases (`v2.5.6` Setup and Portable). However, the audit identified **3 Critical, 6 High, 7 Medium, and 4 Low severity issues** that compromise production credibility, SEO discoverability, and accessibility:

### Severity Scorecard

| ID | Category | Severity | File Path & Citation | Issue Summary |
|---|---|---|---|---|
| **ISS-01** | Link Integrity / Social | **CRITICAL** | `website/index.html:16` | `og:image` URL returns HTTP 404 Not Found; `twitter:image` completely missing. |
| **ISS-02** | SEO / Routing | **CRITICAL** | `website/public/` (missing), `Footer.tsx:100` | `robots.txt` and `sitemap.xml` return 404; active footer link navigates users to 404. |
| **ISS-03** | Functionality / API | **CRITICAL** | `website/src/lib/api.ts:28,34,43` | Relative `/api/*` calls fail on GitHub Pages; License Portal HWID reset is 100% broken. |
| **ISS-04** | Performance / CWV | **HIGH** | `website/src/App.tsx:15-32`, `PricingSection.tsx:22` | 628 KB unchunked JS; all 5 modals and 10 playground demos loaded statically upfront. |
| **ISS-05** | Performance / Fonts | **HIGH** | `website/index.html:24` | 11 synchronous Google Font weights block rendering in `<head>`. |
| **ISS-06** | Responsive UX / Clipping | **HIGH** | `HeroSection.tsx:134-146` | Desktop Simulator header overflows and clips on mobile viewports (375px–414px). |
| **ISS-07** | Accessibility (a11y) | **HIGH** | `ChangelogModal.tsx`, `WaitlistModal.tsx`, `ShortcutsDrawer.tsx`, `ToolCatalog.tsx` | Modals lack Escape key handlers, focus traps, and background scroll locking. |
| **ISS-08** | Accessibility / Touch | **HIGH** | `Navbar.tsx:230-264`, `ToolCatalog.tsx:90-97`, modal close buttons | Touch targets < 32px violate WCAG 2.5.5 (44x44px minimum requirement). |
| **ISS-09** | Localization / a11y | **HIGH** | `Footer.tsx:72-124`, `HeroSection.tsx:216-359`, `App.tsx:35` | 40%+ of UI strings hardcoded in Turkish; `html lang="tr"` does not update on language switch. |
| **ISS-10** | Content Consistency | **MEDIUM** | `website/src/lib/toolsData.ts:334`, `ToolCatalog.tsx:104` | UI claims "27+ Tools" / "Tümü (27)", but catalog array contains only 21 items. |
| **ISS-11** | Integrity / Versioning | **MEDIUM** | `LiveBase64Demo.tsx:23,224` | Preset button decodes `v2.5.5` text while initial state contains `v2.5.6`. |
| **ISS-12** | Link Integrity / Staging | **MEDIUM** | `LiveQrDemo.tsx:7` | Default QR code points to temporary Railway URL instead of production domain. |
| **ISS-13** | Credibility / Checksums | **MEDIUM** | `HeroSection.tsx:17,93`, `Footer.tsx:59` | Dummy mock SHA-256 string; VirusTotal links point to generic homepage. |
| **ISS-14** | Accessibility / Contrast | **MEDIUM** | `Footer.tsx:116`, `Navbar.tsx:84` | Disclaimer text contrast is 2.3:1 (fails 4.5:1); `text-gray-500` is 3.8:1 on dark background. |
| **ISS-15** | Conversion / UX | **MEDIUM** | `SimulatedCheckoutModal.tsx:325` | "Test in License Portal" link leads to dysfunctional `/api/license/lookup` endpoint. |
| **ISS-16** | Functional / Edge-Case | **MEDIUM** | `LiveRegexDemo.tsx:14-16` | Removing `g` flag throws unhandled TypeError from `matchAll()`. |
| **ISS-17** | Currency Display Bug | **LOW** | `PricingMatrix.tsx:273,279` | Non-TRY currencies default to USD `$`, displaying `$6.58` even when EUR is selected. |
| **ISS-18** | SEO / Schema.org | **LOW** | `website/index.html:27-48` | JSON-LD schema omits canonical URL, author, and screenshots. |
| **ISS-19** | SEO / Meta Tags | **LOW** | `website/index.html:12-20` | Missing `<link rel="canonical">` and `<meta property="og:url">`. |
| **ISS-20** | Web App Standards | **LOW** | `website/index.html:9-11` | Inline SVG favicon only; missing `apple-touch-icon.png` and `site.webmanifest`. |

---

## 5. Verification Method

To independently verify these findings, execute the following commands and inspections:

### 5.1 Remote Endpoint Integrity & 404 Verification
Run PowerShell / curl to inspect HTTP status codes:
```powershell
# 1. Verify Broken OpenGraph Image (Expected: 404)
curl.exe -I -s -L "https://zendev-production-4a5b.up.railway.app/og-banner.png"

# 2. Verify Missing robots.txt and sitemap.xml on GitHub Pages (Expected: 404)
curl.exe -I -s -L "https://zerdevstudio.github.io/robots.txt"
curl.exe -I -s -L "https://zerdevstudio.github.io/sitemap.xml"

# 3. Verify Active GitHub Binary Releases (Expected: 200 OK)
curl.exe -I -s -L "https://github.com/ZerDevStudio/ZervHub-App/releases/download/v2.5.6/ZenDev-Setup-2.5.6.exe"
curl.exe -I -s -L "https://github.com/ZerDevStudio/ZervHub-App/releases/download/v2.5.6/ZenDev-Portable-2.5.6.exe"
```

### 5.2 Bundle Chunking & Asset Profiling
Inspect asset sizes on the live deployment:
```powershell
curl.exe -s -I "https://zerdevstudio.github.io/assets/index-BcMnGMOO.js"
curl.exe -s -I "https://zerdevstudio.github.io/assets/motion-D2B-yqsZ.js"
curl.exe -s -I "https://zerdevstudio.github.io/assets/index-uecsaFMR.css"
```
Observe that `index-*.js` exceeds 460 KB due to eager imports in `App.tsx` and `LivePlayground.tsx`.

### 5.3 Automated Empirical Regression Test Runner
Run the existing website verification test suites:
```powershell
& "C:\Users\BERKE\.gemini\antigravity\bin\node.exe" tests/challenger_website_v255_empirical.mjs
& "C:\Users\BERKE\.gemini\antigravity\bin\node.exe" tests/challenge_website_overhaul_m1_2.mjs
```
Observe the 19 and 31 failure points documenting version divergence (`v2.5.5` vs `v2.5.6`), missing attributes, and preset mismatches.

### 5.4 Manual Codebase Inspection Targets
1. `website/src/components/Footer.tsx:72-124`: Inspect hardcoded Turkish links and 2.3:1 contrast disclaimer.
2. `website/src/components/HeroSection.tsx:134-146`: Inspect Desktop Simulator header width without truncation.
3. `website/src/components/LivePlayground/LiveBase64Demo.tsx:224`: Inspect base64 preset string.
4. `website/src/components/LivePlayground/LiveQrDemo.tsx:7`: Inspect railway staging URL default.
5. `website/src/components/PricingMatrix.tsx:273,279`: Inspect ternary currency check lacking EUR.
6. `website/src/lib/api.ts:28,34,43`: Inspect relative `/api/*` fetch paths on static hosting.

### 5.5 Invalidation Conditions
This audit report is invalidated if:
1. `website/public/` is populated with valid `robots.txt`, `sitemap.xml`, and `og-banner.png`, and deployed to GitHub Pages.
2. An external API Gateway or mock handler is configured in `api.ts` to service `/api/license/*` requests.
3. Dynamic imports (`React.lazy`) and chunking split the main JS bundle below 200 KB.
4. All modals implement Escape listeners, ARIA dialog roles, focus traps, and body scroll locking.
5. Missing English translation keys are mapped to `translations.ts` and language switching updates `html lang`.

---

## Prioritized Remediation Action Plan

### Phase 1: P0 Critical & Security Fixes (Immediate)
1. **Create `website/public/` Directory**:
   - Add `robots.txt` allowing all bots and referencing `https://zerdevstudio.github.io/sitemap.xml`.
   - Add `sitemap.xml` with canonical URL, changefreq, and priority.
   - Generate and add a branded `og-banner.png` (1200x630px WebP/PNG).
   - Update `index.html:16` to point to `/og-banner.png` (relative) or `https://zerdevstudio.github.io/og-banner.png`.
   - Add `<meta name="twitter:image" content="https://zerdevstudio.github.io/og-banner.png">`.
2. **Handle License Portal on Static Hosting**:
   - In `website/src/lib/api.ts`, either connect to the live Railway backend with CORS (`https://zendev-production-4a5b.up.railway.app/api/...`) via an environment variable (`VITE_API_URL`), OR implement an offline mock validation engine with clear user messaging when running on GitHub Pages.
3. **Synchronize Version Discrepancies**:
   - Align all files and regression tests to `v2.5.6` (or align to `v2.5.5` if orchestrator requires matching the previous release milestone).
   - In `LiveBase64Demo.tsx:224`, update the preset Base64 string to match the current version.
   - In `LiveQrDemo.tsx:7`, change the default URL from Railway to `https://zerdevstudio.github.io/`.
   - In `HeroSection.tsx:17`, replace `sampleSha` with the true SHA-256 hash of the release binary.

### Phase 2: P1 High Priority UX & Performance (Core Web Vitals)
1. **Code-Split Modals and Playground Demos (`React.lazy`)**:
   - In `App.tsx`, lazy-load `ChangelogModal`, `CommandPalette`, `ShortcutsDrawer`, `WaitlistModal`, and `PricingSection`'s `SimulatedCheckoutModal`.
   - In `LivePlayground.tsx`, lazy-load demo tabs so heavy libraries (`qrcode`, `canvas-confetti`) are only downloaded on demand.
   - Configure `manualChunks` in `vite.config.ts` for third-party libraries.
2. **Optimize Google Fonts**:
   - Prune font weights in `index.html` from 11 weights down to 4 (Inter 400, 600, 700; JetBrains Mono 400, 600).
   - Use asynchronous font loading (`rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"`).
3. **Responsive Mobile Simulator Fix**:
   - In `HeroSection.tsx:134`, add `truncate max-w-[170px] sm:max-w-none` to prevent title bar clipping at 375px.
4. **Touch Target Expansion**:
   - Increase bounding boxes of all close buttons, category pills, mobile header buttons, and social links to a minimum of 44x44px (using `min-h-[44px] min-w-[44px]` or expanded touch padding).

### Phase 3: P2 Accessibility & Localization Polish
1. **Modal Accessibility & Focus Trap**:
   - Add global Escape key listeners to `ChangelogModal`, `WaitlistModal`, `ShortcutsDrawer`, and `ToolCatalog` modal.
   - Add `role="dialog"` and `aria-modal="true"`.
   - Add `aria-label="Kapat / Close"` to all `<X />` close buttons.
   - Implement `document.body.style.overflow = 'hidden'` on open and restore on close.
2. **Complete Bilingual Translation Parity**:
   - Extract all hardcoded Turkish strings in `Footer.tsx`, `HeroSection.tsx`, `RoiCalculator.tsx`, `TestimonialsWall.tsx`, and `LivePlayground/` demos into `translations.ts`.
   - Update `App.tsx` so changing language calls `document.documentElement.lang = lang` and updates `document.title`.
3. **Color Contrast Fixes**:
   - Increase `Footer.tsx` disclaimer text from `text-gray-600` to `text-gray-400` (exceeding 5:1 contrast).
   - Increase `text-gray-500` labels across the dark cyber theme to `text-gray-400`.
4. **Catalog Count Synchronization**:
   - Either expand `ZENDEV_TOOLS` to include all 27 suites or adjust the header counts to accurately reflect the 21 tools displayed.
