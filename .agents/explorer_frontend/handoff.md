# Frontend Architecture, Code Quality & i18n Audit Report (ZenDev / NexusHub)

**Auditor Subagent:** Frontend Architecture & Code Quality Auditor (`explorer_frontend`)  
**Date:** 2026-09-20  
**Target Scope:** `src/renderer/` (all 27 developer studios, layout, components, locales, configuration)  
**Directive Compliance:** ZenDev SaaS Dönüşüm Direktifi (`.agents/rules/zendev-saas-directive.md`)  
**Status:** COMPLETED (Hard Handoff)

---

## Executive Summary

An exhaustive, read-only architectural, code health, and localization audit was executed across the entire React 19 + TypeScript frontend (`src/renderer/`). The audit encompassed all 27 developer studios and pages in `src/renderer/src/pages/`, core layout modules (`App.tsx`, `Sidebar.tsx`, `Dashboard.tsx`), shared components, IPC bridge abstraction (`tauriBridge.ts`, `ipc.ts`), dependency manifests (`package.json`, `vite.config.ts`), and localization dictionaries (`tr.json` vs `en.json`).

### Key Audit Metrics
- **Total Studios/Pages Surveyed:** 27
- **Total Components Audited:** 25+ shared components and subcomponents
- **Total i18n Keys Compared:** 784 in `tr.json` vs 784 in `en.json` (100% top-level key parity)
- **i18n Keys Missing in Locales but Used in React Components:** 2 (`dashboard.tools.colorStudio.desc`, `dashboard.tools.scratchpad.desc`)
- **Duplicate/Conflicting Keys in Locales:** 1 pair (`encodingStudio.tabs.hexdump` vs `encodingStudio.tabs.hexDump`)
- **Hardcoded Strings Bypassing i18n:** 261 occurrences across 41 files
- **Dangling References to Purged Tools (Port Killer, System Optimizer, Temp Mail, Clipboard Manager):** 11 occurrences
- **Dead Pages / Redundant Redirect Chunks:** 2 (`CurlRunner.tsx`, `DevSandbox.tsx`)
- **Ghost/Unused Dependencies in `package.json`:** 3 (`cheerio`, `validator`, `axios`)
- **Misplaced Dependencies:** 2 (`sql.js` in devDependencies, `dompurify` in dependencies)
- **Severe React Anti-Patterns & Memory Leaks:** 3 (Side-effect in `useMemo` in `HashStudio`, dangling `URL.createObjectURL` in `SqliteViewer`, direct DOM access in `CyberFortress`)

---

## 1. Observation

### Category A: Prohibited / Purged Tool Traces (SaaS Directive Principle 2)

#### [PURGE-01] Dangling `port-killer` in Default Pinned Tools
- **File:** `src/renderer/src/pages/Dashboard.tsx:50, 52`
- **Severity:** High
- **Observation:**
  ```typescript
  // Lines 49-53
  const saved = localStorage.getItem('nexus_pinned_tools')
  return saved ? JSON.parse(saved) : ['color-studio', 'port-killer', 'scratchpad']
  // ...
  return ['color-studio', 'port-killer', 'scratchpad']
  ```
  On fresh user installs or when `localStorage` is cleared, `Dashboard.tsx` pins `'port-killer'` by default. Although `'port-killer'` was removed from the active `tools` array, the dead ID remains in state, causing confusing empty state or phantom pin keys.
- **Impact:** Violates Principle 2 of SaaS Directive. Exposes dead legacy identifier in core dashboard state.
- **Recommendation:** Replace default pinned IDs with active developer studios: `['api-studio', 'json-studio', 'jwt-studio']`.

#### [PURGE-02] Dead Icon Imports for Temp Mail and Clipboard Manager
- **File:** `src/renderer/src/pages/Dashboard.tsx:10, 14` & `src/renderer/src/components/CommandPalette.tsx:10, 14`
- **Severity:** Low
- **Observation:**
  ```typescript
  // Dashboard.tsx:10, 14
  import {
    ...
    Mail,       // Dead import (originally Temp Mail)
    ...
    Clipboard,  // Dead import (originally Clipboard Manager)
    ...
  } from 'lucide-react'
  ```
- **Impact:** Unused imported symbols inflate bundle AST, confuse maintainers, and signal incomplete purging.
- **Recommendation:** Remove `Mail` and `Clipboard` from `lucide-react` import lists.

#### [PURGE-03] CommandPalette Search Placeholder Recommends Purged Tools
- **File:** `src/renderer/src/locales/en.json:463` & `src/renderer/src/locales/tr.json:463`
- **Severity:** Medium
- **Observation:**
  - `en.json:463`: `"searchPlaceholder": "Search tool or action (e.g. regex, optimizer, mock, mail)...",`
  - `tr.json:463`: `"searchPlaceholder": "Araç veya işlem ara (örn: regex, optimizer, mock, mail)...",`
- **Impact:** Users are actively instructed to search for `optimizer` (System Optimizer) and `mail` (Temp Mail), both of which were purged under Principle 2. Searching for them yields no tools or routes to dead items.
- **Recommendation:** Change placeholder to active SaaS studios: `"Search tool or action (e.g. api, jwt, cron, json)..."` / `"Araç veya işlem ara (örn: api, jwt, cron, json)..."`.

#### [PURGE-04] FloatingOrb Retains "RAM Optimizer" Action & IPC Call
- **File:** `src/renderer/src/components/FloatingOrb.tsx:86-101, 176`
- **Severity:** High
- **Observation:**
  ```typescript
  // Lines 86-95
  // Quick RAM Optimizer
  const handleQuickOptimize = async () => {
    if (isOptimizing) return
    setIsOptimizing(true)
    try {
      if (window.nexusAPI?.sentinel?.optimizeMemory) {
        await window.nexusAPI.sentinel.optimizeMemory()
        setOptSuccess(true)
        setTimeout(() => setOptSuccess(false), 2500)
      }
    } catch {
  ```
- **Impact:** Invokes OS-level memory optimization / working set trimming (`optimizeMemory`). Principle 2 states that OS-level tuning and system optimizer features do not belong in a developer SaaS.
- **Recommendation:** Remove the Quick Optimize button from FloatingOrb HUD; replace with "Open Command Palette" or "New API Request" shortcut.

#### [PURGE-05] Purged Tool References in Scratchpad Default Markdown
- **File:** `src/renderer/src/pages/Scratchpad.tsx:131, 173`
- **Severity:** Low
- **Observation:**
  - Line 131: `İstemci --> [ZenDev GUI] --> [IPC Watchdog] --> [Kritik Süreç]`
  - Line 173: `- [ ] **@Backend:** TCP watchdog port kapatma testlerini tamamla`
- **Impact:** Exposes legacy Port Watchdog architecture in user-facing default documentation.
- **Recommendation:** Update default scratchpad sample text to reflect API Studio, JWT token verification, and Workflow Chains.

#### [PURGE-06] Leftover Comment in Tauri IPC Bridge
- **File:** `src/renderer/src/lib/tauriBridge.ts:60`
- **Severity:** Low
- **Observation:**
  ```typescript
  // Line 60
  // ── 2. Temp Mail ──
  // ── 3. Link Decrypter ──
  ```
- **Impact:** Code cleanliness artifact.
- **Recommendation:** Remove dead section heading.

---

### Category B: Code Health & State Hygiene

#### [CODE-01] Severe React Anti-Pattern: Asynchronous State Mutation Inside `useMemo` & Out-of-Order Race Condition
- **File:** `src/renderer/src/pages/HashStudio.tsx:218-236`
- **Severity:** Critical
- **Observation:**
  ```typescript
  // Lines 218-236
  useMemo(() => {
    const encoder = new TextEncoder()
    const data = encoder.encode(textInput)

    const computedMd5 = md5(textInput)

    Promise.all([
      crypto.subtle.digest('SHA-1', data).then(bufferToHex),
      crypto.subtle.digest('SHA-256', data).then(bufferToHex),
      crypto.subtle.digest('SHA-512', data).then(bufferToHex)
    ]).then(([sha1, sha256, sha512]) => {
      setTextHashes({
        md5: computedMd5,
        sha1,
        sha256,
        sha512
      })
    })
  }, [textInput])
  ```
- **Impact:**
  1. `useMemo` is strictly reserved for pure synchronous value calculation. Calling `setTextHashes` (a state setter) inside `useMemo` violates React core contracts. Under React 19 concurrent mode, this causes double-invocations, infinite render loops, or silent warning suppressions.
  2. As the user types, asynchronous `crypto.subtle.digest` operations run concurrently. Fast typing causes out-of-order resolution: an earlier keystroke's promise can resolve *after* a later one, overwriting current hashes with stale calculations.
  3. No `.catch()` handler exists, causing unhandled promise rejections if `SubtleCrypto` fails.
- **Recommendation:** Refactor into `useEffect` with an `isCancelled` flag or `AbortController`:
  ```typescript
  useEffect(() => {
    let isCurrent = true
    const encoder = new TextEncoder()
    const data = encoder.encode(textInput)
    const computedMd5 = md5(textInput)

    Promise.all([
      crypto.subtle.digest('SHA-1', data).then(bufferToHex),
      crypto.subtle.digest('SHA-256', data).then(bufferToHex),
      crypto.subtle.digest('SHA-512', data).then(bufferToHex)
    ])
      .then(([sha1, sha256, sha512]) => {
        if (isCurrent) {
          setTextHashes({ md5: computedMd5, sha1, sha256, sha512 })
        }
      })
      .catch((err) => console.error('Digest failed:', err))

    return () => { isCurrent = false }
  }, [textInput])
  ```

#### [CODE-02] Memory Leak: Unrevoked Object URL on CSV Export
- **File:** `src/renderer/src/components/SqliteViewer.tsx:294-301`
- **Severity:** Medium
- **Observation:**
  ```typescript
  // Lines 293-301
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${selectedTable || 'sqlite_export'}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  cyberAudio.copySuccess()
  // Note: URL.revokeObjectURL(url) is missing!
  ```
- **Impact:** Every time a user exports a table from `SqliteViewer`, a Blob object URL is allocated and stays pinned in WebView2 memory indefinitely. Repeated exports leak memory.
- **Recommendation:** Call `URL.revokeObjectURL(url)` immediately after `document.body.removeChild(link)`.

#### [CODE-03] Direct DOM Manipulation in React Components
- **File:** `src/renderer/src/pages/CyberFortress.tsx:492, 576`
- **Severity:** Medium
- **Observation:**
  ```typescript
  // Line 492
  const input = document.getElementById('stego-encode-input') as HTMLInputElement
  // Line 576
  const input = document.getElementById('stego-decode-input') as HTMLInputElement
  ```
- **Impact:** Direct `document.getElementById` bypasses React's virtual DOM and ref lifecycle. If components re-render or if another view has identical element IDs, this will cause null references or incorrect element targeting.
- **Recommendation:** Replace with standard React `useRef<HTMLInputElement>(null)`.

#### [CODE-04] Unhandled Promise Rejections in Core Lifecycle & State
- **File:** `src/renderer/src/components/Sidebar.tsx:319`, `src/renderer/src/lib/LicenseContext.tsx:26`, `src/renderer/src/pages/Account.tsx:46`
- **Severity:** Medium
- **Observation:**
  - `Sidebar.tsx:319`: `window.nexusAPI?.getVersion?.().then((v) => { ... })` lacks `.catch()`.
  - `LicenseContext.tsx:26`: `window.nexusAPI.license.check().then((res: any) => { ... })` lacks `.catch()`.
  - `Account.tsx:46`: `window.nexusAPI?.getVersion?.().then((ver: string) => { ... })` lacks `.catch()`.
- **Impact:** If IPC channel is busy, unmounted, or throws during startup, uncaught promise rejections trigger React ErrorBoundary or crash the renderer.
- **Recommendation:** Append `.catch((err) => console.error(...))` to all root IPC promise invocations.

---

### Category C: Architecture, Routing & Bundle Optimization

#### [ARCH-01] Dead Pages & Redundant Chunk Generation (`DevSandbox.tsx` & `CurlRunner.tsx`)
- **File:** `src/renderer/src/App.tsx:36, 41, 366, 383`
- **Severity:** High
- **Observation:**
  - `App.tsx:36`: `const DevSandbox = lazy(() => import('./pages/DevSandbox'))`
  - `App.tsx:41`: `const CurlRunner = lazy(() => import('./pages/CurlRunner'))`
  - `App.tsx:366`: `<Route path="/curl-runner" element={<Navigate to="/api-studio" replace />} />`
  - `App.tsx:383`: `<Route path="/dev-sandbox" element={<Navigate to="/api-studio" replace />} />`
  - Both `DevSandbox.tsx` (13.8 KB) and `CurlRunner.tsx` (8.7 KB) remain in `src/renderer/src/pages/`, are bundled by Rollup/Vite as separate async chunks, and are referenced in `Dashboard.tsx` and `CommandPalette.tsx`, but immediately redirect to `/api-studio`.
- **Impact:** Dead code in repo, wasted build artifacts, unnecessary network redirects in UI.
- **Recommendation:**
  1. Remove `DevSandbox.tsx` and `CurlRunner.tsx` from `src/renderer/src/pages/`.
  2. Remove lazy imports from `App.tsx`.
  3. Replace `/curl-runner` and `/dev-sandbox` card entries on `Dashboard.tsx` and `CommandPalette.tsx` to point directly to `/api-studio`.

#### [ARCH-02] Ghost / Unused Production Dependencies in `package.json`
- **File:** `package.json:19, 20, 24`
- **Severity:** High
- **Observation:**
  ```json
  "dependencies": {
    "@tauri-apps/api": "^2.2.0",
    "@tauri-apps/plugin-opener": "^2.2.0",
    "axios": "^1.7.9",
    "cheerio": "^1.0.0",
    "dompurify": "^3.4.15",
    "mermaid": "^11.17.2",
    "qrcode": "^1.5.4",
    "validator": "^13.12.0"
  }
  ```
  - `cheerio`: 0 imports in the entire project. Completely unused legacy Electron/Node scraping residue.
  - `validator`: 0 imports in the entire project.
  - `axios`: Only imported in dead `DevSandbox.tsx` and as an unused import in `ApiStudio.tsx:30`.
- **Impact:** Bloats `node_modules`, increases installation time, introduces unnecessary third-party supply-chain vulnerability attack surface.
- **Recommendation:** Run `npm uninstall cheerio validator axios` in the root workspace.

#### [ARCH-03] Misplaced Dependencies: `sql.js` in `devDependencies` vs `dompurify` in `dependencies`
- **File:** `package.json:21, 42`
- **Severity:** Medium
- **Observation:**
  - `sql.js` is imported at runtime in `src/renderer/src/lib/sqliteEngine.ts:1`, but is declared in `"devDependencies"`.
  - `dompurify` is only used inside `tests/mermaidStudio.test.ts:18`, but is declared in `"dependencies"`.
- **Impact:** Misconfigured dependency tiers risk build failures in clean production container builds (`npm install --production`).
- **Recommendation:** Move `sql.js` to `"dependencies"` and `dompurify` + `@types/dompurify` to `"devDependencies"`.

#### [ARCH-04] Missing Vite Chunking Strategy for Heavy Libraries (`mermaid`, `sql.js`)
- **File:** `vite.config.ts:19-27`
- **Severity:** Medium
- **Observation:**
  `vite.config.ts` does not define `rollupOptions.output.manualChunks`. Heavy third-party packages such as `mermaid` (~2.5 MB) and `framer-motion` risk getting combined into monolithic or poorly optimized chunks.
- **Impact:** Slower initial download and higher memory consumption when viewing diagrams.
- **Recommendation:** Configure vendor chunking in `vite.config.ts`:
  ```typescript
  rollupOptions: {
    input: resolve(__dirname, 'src/renderer/index.html'),
    output: {
      manualChunks: {
        vendor_react: ['react', 'react-dom', 'react-router-dom'],
        vendor_motion: ['framer-motion', 'lucide-react'],
        vendor_mermaid: ['mermaid'],
      }
    }
  }
  ```

#### [ARCH-05] Legacy Platform Branding in Desktop UI
- **File:** `src/renderer/src/components/Sidebar.tsx:604`
- **Severity:** Medium
- **Observation:**
  ```tsx
  // Sidebar.tsx:603-605
  <div className="glass-card p-2.5 text-center">
    <p className="text-[10px] text-nexus-muted font-mono font-semibold">ZenDev v{appVersion}</p>
    <p className="text-[9px] text-nexus-muted/60 mt-0.5">Electron + React + TypeScript</p>
  </div>
  ```
  The sidebar footer explicitly states **"Electron + React + TypeScript"** in an application that has been migrated to Tauri v2 + Rust!
- **Impact:** Misleads users and enterprise clients regarding security, memory footprint, and underlying architecture.
- **Recommendation:** Update text to **"Tauri v2 + Rust + React"**.

#### [ARCH-06] Inconsistent Hardcoded Version Fallbacks
- **File:** `Sidebar.tsx:276`, `tauriBridge.ts:135, 202`, `Account.tsx:64`
- **Severity:** Low
- **Observation:**
  - `Sidebar.tsx:276`: `const [appVersion, setAppVersion] = useState('2.4.3')`
  - `tauriBridge.ts:135`: `currentVersion: '2.4.2'`
  - `tauriBridge.ts:202`: `app_get_version fallback: '2.4.2'`
  - `Account.tsx:64`: `fallback: 'v1.0.2'`
  - `package.json:3`: `"version": "2.5.5"`
- **Impact:** Discrepant version numbers flash in the UI if IPC version retrieval is delayed.
- **Recommendation:** Unify all fallback version strings to `2.5.5` or import from package metadata.

---

### Category D: Strict Bilingual i18n Parity Audit

#### [I18N-01] Missing Translation Keys in `tr.json` and `en.json`
- **File:** `src/renderer/src/pages/Dashboard.tsx:213, 223`
- **Severity:** High
- **Observation:**
  `Dashboard.tsx` invokes:
  - Line 213: `t('dashboard.tools.colorStudio.desc')`
  - Line 223: `t('dashboard.tools.scratchpad.desc')`
  Neither key exists in `tr.json` or `en.json`. Because of this, they always fall back to the inline fallback string, which is hardcoded in Turkish:
  - ColorStudio fallback: `'HEX, RGB, HSL dönüştürücü, ekran damlalığı, görsel palet çıkarıcı ve WCAG kontrast denetleyici.'`
  - Scratchpad fallback: `'Canlı çift panel önizleme, anlık metin istatistiği ve otomatik kayıt özellikli not alanı.'`
- **Impact:** English users see Turkish descriptions for Color Studio and Scratchpad on the dashboard.
- **Recommendation:** Add `dashboard.tools.colorStudio.desc` and `dashboard.tools.scratchpad.desc` to both `tr.json` and `en.json`.

#### [I18N-02] Placeholder Semantic Mismatch in `apiStudio.urlPlaceholder`
- **File:** `src/renderer/src/locales/tr.json:800` vs `src/renderer/src/locales/en.json:800`
- **Severity:** Medium
- **Observation:**
  - `tr.json`: `"URL veya {{değişken}} girin (örn. https://api.example.com/v1/users)"`
  - `en.json`: `"Enter URL or {{variable}} (e.g. https://api.example.com/v1/users)"`
- **Impact:** In the Turkish locale, the placeholder uses `{{değişken}}`, whereas the actual variable interpolation syntax in `envInterpolator.ts` expects `{{variable}}` or `{{key}}`. A Turkish user copying or typing the suggested placeholder will write an invalid token name.
- **Recommendation:** Standardize both locales to use `{{variable}}` or clarify the token documentation.

#### [I18N-03] Duplicate Case-Insensitive Key Conflict in Locales
- **File:** `src/renderer/src/locales/en.json:896-897` & `src/renderer/src/locales/tr.json:896-897`
- **Severity:** Medium
- **Observation:**
  ```json
  // en.json:893-898
  "tabs": {
    "text": "Text Converter",
    "file": "File & Data-URL",
    "hexdump": "Hex Dump Viewer",
    "hexDump": "Hex Dump Inspector"
  }
  ```
  Both `"hexdump"` and `"hexDump"` are defined under `encodingStudio.tabs`. `EncodingStudio.tsx:296` only uses `hexdump`. In environments or tools with case-insensitive property lookups (like PowerShell's `ConvertFrom-Json` or certain serializers), this throws duplicate key exceptions.
- **Impact:** Breaches JSON schema hygiene and crashes tooling.
- **Recommendation:** Remove `"hexDump"` line from both `tr.json` and `en.json`.

#### [I18N-04] Widespread Hardcoded UI Strings Bypassing `t(...)` (261 occurrences)
- **File:** Across 41 files in `src/renderer/src/`
- **Severity:** High
- **Major Offending Components:**
  1. `QrCodeStudio.tsx` (23 occurrences): Complete form controls ("Destination URL", "Plain Text Payload", "Network Name (SSID)", "Password", "Encryption", "Hidden Network", "Full Name", "Phone", "Organization", "Subject", "Message") have no i18n keys.
  2. `SqliteViewer.tsx` (20 occurrences): Does not import `useT` at all. Error messages, column headers, actions ("Örnek veritabanı yüklenemedi", "Export CSV", "Copy Markdown") are hardcoded.
  3. `Account.tsx` (19 occurrences): Cyber Themes section title ("Siber Tema & Arayüz Renk Motoru"), "AKTİF" badge, subscription management buttons are hardcoded in Turkish.
  4. `BulkOrganizer.tsx` (16 occurrences): Batch file organization options and status dialogs hardcoded in Turkish.
  5. `DiagnosticsTab.tsx` (16 occurrences): Latency, DNS, and TLS metrics headers hardcoded in English without `t(...)`.
  6. `NetworkTools.tsx` (15 occurrences): Tab buttons use hardcoded English array, status badge uses `{open ? 'Açık' : 'Kapalı'}`, and Public IP hero uses hardcoded Turkish.
  7. `App.tsx` (13 occurrences): File Gateway drag-and-drop overlay and 9 ProLockGate descriptions are hardcoded in English.
  8. `ErrorBoundary.tsx` (5 occurrences): All crash screens and retry buttons hardcoded in Turkish because the boundary sits outside `I18nProvider`.
- **Impact:** Incomplete bilingual support breaks localization immersion for global English-speaking developers.
- **Recommendation:** Extract all 261 strings into `tr.json` and `en.json` under appropriate namespaces.

---

## 2. Logic Chain

```
[Observation PURGE-01: Dashboard.tsx lines 50, 52 pins 'port-killer']
    ↓
(Logic Step 1) SaaS Directive Principle 2 mandates complete removal of Port Killer.
    ↓
(Inference 1) Incomplete purge left stale identifier in React initial state, showing dead configuration.

[Observation CODE-01: HashStudio.tsx useMemo contains setState and async SubtleCrypto]
    ↓
(Logic Step 2) useMemo must be pure and synchronous; concurrent async calls have no AbortController.
    ↓
(Inference 2) Fast user typing causes out-of-order state updates (race condition) and unhandled promise rejections.

[Observation CODE-02: SqliteViewer.tsx creates object URL on line 294 without revokeObjectURL]
    ↓
(Logic Step 3) Browsers retain Blob references in memory until explicitly revoked or window is reloaded.
    ↓
(Inference 3) Repeated exports accumulate memory in WebView2 process.

[Observation ARCH-01 & ARCH-02: CurlRunner/DevSandbox are redirects; cheerio/validator/axios are unused]
    ↓
(Logic Step 4) Rollup bundles unused pages as separate async chunks; unused npm packages enlarge lockfile and node_modules.
    ↓
(Inference 4) Dead code increases bundle surface and maintenance overhead without providing functionality.

[Observation I18N-01 & I18N-04: 2 missing keys in locales, 261 hardcoded strings in JSX]
    ↓
(Logic Step 5) Frontend claims 100% bilingual i18n parity, but fallbacks default to hardcoded Turkish or English.
    ↓
(Conclusion) ZenDev's i18n system has structural key parity but suffers from significant component-level bypass and missing keys.
```

---

## 3. Caveats

1. **Static Analysis of Dynamic String Construction:** A small number of `t(...)` keys may be constructed dynamically via template strings (e.g. `t(\`nav.tools.\${toolId}\`)`). Our static AST scan cataloged direct literal calls; any dynamic keys are captured in the unused keys dictionary pool (173 keys).
2. **Build Execution:** Node/npm was not installed in the Windows system PATH of the testing subagent shell, so build bundle sizes were analyzed via source code inspection rather than post-build rollup stats.
3. **Third-Party Styles:** Custom CSS variables in `index.css` were reviewed for theme switching, but deep DOM canvas rendering in Mermaid was validated via code logic only.

---

## 4. Conclusion

The ZenDev frontend codebase possesses a modern, responsive UI built on React 19, Tailwind CSS, and Framer Motion, with high-quality styling and code-split routing. However, our audit revealed critical architectural and code health gaps that must be remediated:

1. **Purge Completion (Principle 2):** Lingering traces of Port Killer in `Dashboard.tsx`, System Optimizer in `FloatingOrb.tsx` and CommandPalette search placeholders, and dead `Mail`/`Clipboard` imports must be excised.
2. **State & Memory Hygiene:** `HashStudio.tsx`'s `useMemo` side-effect and race condition is a critical React violation; `SqliteViewer.tsx` has a Blob URL memory leak.
3. **Dead Code Elimination:** `DevSandbox.tsx` and `CurlRunner.tsx` must be removed from the pages directory and routing.
4. **Package Hygiene:** `cheerio`, `validator`, and `axios` should be uninstalled; `sql.js` moved to dependencies.
5. **i18n Hardening:** Missing keys `dashboard.tools.colorStudio.desc` and `dashboard.tools.scratchpad.desc` must be added; the duplicate `hexDump` key removed; and the 261 hardcoded strings migrated to `tr.json` / `en.json`.

---

## 5. Verification Method

### Independent Verification Steps

1. **Verify i18n Key Parity & Duplicate Keys:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .agents/explorer_frontend/compare_i18n.ps1
   ```
   *Expected result:* Outputs 784 keys, detects duplicate `hexdump` / `hexDump`, and reports 2 missing keys.

2. **Verify Hardcoded Strings:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .agents/explorer_frontend/scan_hardcoded.ps1
   ```
   *Expected result:* Identifies 261 occurrences across 41 component files.

3. **Verify Dead Imports & References:**
   ```powershell
   # Search for port-killer in src/renderer
   Get-ChildItem -Path src/renderer -Recurse -Include *.tsx, *.ts | Select-String "port-killer"
   # Search for cheerio in src/renderer
   Get-ChildItem -Path src/renderer -Recurse -Include *.tsx, *.ts | Select-String "cheerio"
   ```

4. **Verify React Build (Once Node is configured):**
   ```bash
   npm run build
   ```
   *Invalidation condition:* Build fails if dead routes or invalid types are removed without updating `App.tsx` routes.
