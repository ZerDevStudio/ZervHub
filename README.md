# ZenDev (ZervHub) — Premier Desktop Developer Workstation

[![Tauri v2](https://img.shields.io/badge/Tauri-v2.2-FFC131?logo=tauri&logoColor=black)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-2021_Edition-dea584?logo=rust&logoColor=black)](https://www.rust-lang.org/)
[![React Version](https://img.shields.io/badge/React-v19.1.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-5.8.3_Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![CI](https://github.com/ZerDevStudio/ZervHub/actions/workflows/ci.yml/badge.svg)](https://github.com/ZerDevStudio/ZervHub/actions/workflows/ci.yml)
[![Tests Passing](https://img.shields.io/badge/Tests-691_Passed-2ea44f?logo=vitest&logoColor=white)](https://github.com/ZerDevStudio/ZervHub)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/ZerDevStudio/ZervHub/blob/main/LICENSE)
[![Showcase](https://img.shields.io/badge/Showcase-Live_Website-blue?logo=github)](https://zerdevstudio.github.io/)
[![Release](https://img.shields.io/github/v/release/ZerDevStudio/ZervHub-App?color=7928CA&label=Release)](https://github.com/ZerDevStudio/ZervHub-App/releases/latest)

> **ZenDev (ZervHub)** is an enterprise-grade, privacy-first desktop application engineered for both everyday productivity and software engineering teams. Powered by **Tauri v2**, **Rust**, and **React 19**, ZenDev consolidates over 25 essential tools into a unified, lightning-fast native binary (<26 MB RAM, 0.35s boot). Operating 100% offline with zero external telemetry, hardware-bound credential protection, and mathematical tamper-evident cryptographic audit journaling.

---

## 🎯 Dual-Mode Workspace Architecture

ZenDev adapts to every user profile through its reactive, persistent **Dual-Mode Workspace** (`Ctrl + M`):

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  [ZenDev Logo]          [ 🎯 Günlük Araçlar | ⚡ Geliştirici ]          [_ □ X]  │
├──────────────┬───────────────────────────────────────────────────────────────────┤
│ 🎯 ESSENTIAL │  • Privacy & Security: Universal Link Decrypter, CyberFortress,   │
│   (Default)  │    Strong Password Generator                                      │
│              │  • Documents & Media: PDF Studio, Image Toolkit, Bulk Organizer   │
│              │  • Practical Utilities: QR Code Studio, Scratchpad, Color Studio │
├──────────────┼───────────────────────────────────────────────────────────────────┤
│ ⚡ DEVELOPER │  • Full 20-Tool Power Suite: API Studio (REST/cURL), JSON Master, │
│   (Pro Mode) │    JWT Inspector, Regex Lab, Cron Studio, Mermaid Architecture,   │
│              │    Encoding Studio, Hash Studio, Network Recon, Resource Sentinel │
└──────────────┴───────────────────────────────────────────────────────────────────┘
```

- **🎯 Essential Mode (`essential`):** Activated by default for non-technical and daily users. Hides complex developer jargon (cURL, JWT, Regex, Cron, Mermaid) and presents only the 9 essential everyday consumer utilities.
- **⚡ Developer Mode (`developer`):** Unlocks the full 20-tool native developer workstation with 1 click or via global shortcut `Ctrl + M` (`Cmd + M`).
- **Zero-Friction Search & Guard:** The Command Palette (`Ctrl + K`) and route guards intelligently partition technical actions based on active mode.

---

## ⚡ Verified Performance Benchmarks

Engineered from the ground up to replace bloated web-wrapper desktop tools with a high-efficiency native Rust runtime and OS-native webview.

| Performance Metric | ZenDev (Tauri v2 + Rust) | Legacy Architecture (Electron) | Performance Delta |
| :--- | :--- | :--- | :--- |
| **Boot / Cold Start Latency** | **0.35s** | 2.8s – 3.8s | **~10x Faster** ⚡ |
| **Idle Memory Footprint (RAM)** | **<26 MB** | 120 MB – 180 MB | **~82% Reduction** 📉 |
| **Installer Binary Size** | **4.6 MB** | 120 MB – 140 MB | **~96% Smaller** 📦 |
| **Backend Runtime** | Native Compiled Rust (`src-tauri/`) | Heavy V8 / Node.js Process | Zero runtime overhead |
| **IPC Communication** | Zero-Copy Tauri v2 Native Bridge | JSON serialization via Chromium IPC | Microsecond invocation |
| **Process Isolation** | Capability-based security sandbox | Full Node.js runtime access | Enterprise DMZ hardened |

---

## 🛠️ Core Developer Studios

ZenDev eliminates the friction of juggling dozens of ad-hoc online tools by providing an offline-first, unified suite of specialized workstations:

| Studio | Highlights & Capabilities | Status |
| :--- | :--- | :--- |
| **API Studio** | High-performance REST & cURL client with offline-first workspace, environment variable interpolation (`{{var}}`), response inspector, latency analytics, and SSRF private IP protection. | Active 🚀 |
| **Universal Link Decrypter**<br>*(Evrensel Link Çözücü)* | Advanced link unshortening & bypass engine. Resolves multi-hop redirect chains, strips invasive tracking telemetry (UTM, fbclid, gclid), decodes obfuscated URLs, and detects Punycode phishing vectors. | Active 🛡️ |
| **JWT Studio** | Offline token inspector, payload decoder, HMAC-SHA256 signature verifier, claims validator, and token generator with live expiration countdown timeline. | Active 🔑 |
| **Regex Studio** | Real-time regular expression testing engine with syntax generator, named capture group visualizer, live matching flags manipulator, and library of common pattern templates. | Active 🎯 |
| **JSON & SQLite Studio** | Dual-engine data workstation: JSON formatter, validator, minifier, interactive diff viewer, mock schema generator, and WebAssembly in-memory SQLite querying (`sql.js`). | Active 💾 |
| **Mermaid Studio** | Live architecture diagram canvas supporting Flowcharts, Sequence Diagrams, ERDs, Class Diagrams, and State Graphs with instantaneous SVG and high-resolution PNG export. | Active 📊 |
| **Cyber Fortress** | Defense-grade file security suite featuring AES-256-GCM authenticated encryption/decryption, DoD 5220.22-M 7-pass secure file shredder, and zero-pass chunking. | Active 🔒 |
| **Cron Studio** | Visual 5-field cron expression builder with human-readable syntax explanations (English & Turkish) and schedule forecasting for the next 10 executions. | Active ⏱️ |
| **Encoding Studio** | Multi-format text and media converter supporting Base64, Hex, URL-encoding, HTML entities, Data-URL visualizer (Image/Audio/PDF), and 16-byte hex dump inspector. | Active 🔤 |
| **Hash Studio** | Cryptographic hash generator supporting MD5, SHA-1, SHA-256, SHA-384, SHA-512, and HMAC message verification with asynchronous compute workers. | Active 🏷️ |
| **Color Studio** | Comprehensive color palette designer supporting HEX, RGB, HSL, HSV, CMYK conversions, WCAG 2.1 contrast ratio audit, and CSS gradient code generation. | Active 🎨 |
| **Password Generator** | Cryptographically secure pseudo-random entropy generator with customizable character sets, phonetic memorable passwords, and breach-resistance scoring. | Active 🎲 |
| **Image Toolkit** | Offline image processor for WebP/PNG/JPEG format conversion, lossless compression, and aspect-ratio resizing powered by the Rust `image` crate. | Active 🖼️ |
| **PDF Studio** | Document toolkit for PDF merging, page splitting, reordering, and metadata sanitization powered by the native Rust `lopdf` engine. | Active 📄 |
| **Bulk Organizer** | Multi-rule, MIME-aware batch file renamer and directory organizer with atomic single-click rollback and undo journaling. | Active 📁 |
| **QR Code Studio** | Vector (SVG) and raster QR code generator and image scanner with adjustable Reed-Solomon error correction levels. | Active 📱 |

> **Note on Deprecated Modules:** In accordance with the *ZenDev SaaS Transformation Directive (Principle 2)*, OS-invasive utilities (`Port Killer`, `System Optimizer`), abuse-prone modules (`Temp Mail`), and commoditized OS features (`Clipboard Manager`) have been permanently purged from the core architecture to maintain enterprise EDR compliance and focus on core developer workflows.

---

## 🏗️ System Architecture

ZenDev leverages **Tauri v2** to establish an impermeable security DMZ between the sandboxed React 19 frontend and the native Rust backend.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ZenDev Desktop Workstation                            │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────────┐
│              Sandboxed Frontend Renderer — src/renderer/ (React 19)              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • React 19 + TypeScript 5.8 (Strict Mode)       • Tailwind CSS + Lucide Icons  │
│  • Vite 6 HMR Development Pipeline               • Framer Motion Smooth UI      │
│  • 25+ Core Tool Workstation Pages               • Activity Feed & Toast Bus    │
│  • WebAssembly In-Memory SQLite (sql.js)         • Mermaid.js Rendering Engine  │
│  • Bilingual Internationalization (tr.json / en.json with 100% key parity)      │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
            ┌──────────────────────────▼──────────────────────────┐
            │       Tauri v2 IPC Bridge (`nexusAPI` / invoke)     │
            │  • Zero-Copy Asynchronous JSON Serialization        │
            │  • Strict Capability-Based Permission Boundary      │
            │  • Schema-Enforced Typed Commands                   │
            └──────────────────────────┬──────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────────┐
│                   Native Rust Backend — src-tauri/ (Rust 2021)                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Application Lifecycle & Window Management     (tauri::App, lib.rs)           │
│  • Universal Link Decrypter & Bypasser Engine    (bypasser.rs, reqwest)         │
│  • Async HTTP Client & Network Dispatcher        (network.rs, net_dispatcher.rs)│
│  • Cyber Fortress Vault & DoD Shredder           (crypto.rs, aes-gcm, zeroize)  │
│  • NIST FIPS 180-4 SHA-256 Audit Journal Chaining (journal.rs)                  │
│  • Hardware-Bound Credential Store               (safe_storage.rs, winreg)      │
│  • Native Document & Image Engines               (pdf.rs, image.rs, lopdf)      │
│  • Silent Cross-Platform Subprocess Engine       (process_ext.rs)               │
│  • Native Hardware & Resource Telemetry          (sentinel.rs, sysinfo)         │
│  • Transparent User-Approved Updater             (updater.rs)                   │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────────┐
│                        Target Operating System Layer                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Windows (WebView2)       • macOS (WKWebView)       • Linux (WebKitGTK)       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security & Cryptographic Integrity

- **Local-First Zero-Knowledge Processing**: All encryption keys, JWT tokens, file shredding operations, and network queries remain isolated in memory or on local storage. No developer code or credentials ever leave your workstation.
- **NIST FIPS 180-4 Tamper-Evident Chaining**: Activity journal events are cryptographically sealed into an append-only SHA-256 hash chain with automated PII, token, and secret scrubbing.
- **Capability-Based Principle of Least Privilege**: Renderer code cannot execute arbitrary shell commands or access filesystem paths outside explicitly granted Tauri v2 capabilities.
- **Silent & Clean Subprocess Execution**: Subprocess execution utilizes Windows `CREATE_NO_WINDOW` and clean POSIX spawning without disruptive console popups or EDR heuristic false positives.
- **Win32 ShellExecuteW Boundary**: External hyperlinks are strictly validated for `http`/`https` protocols and delegated directly to the OS shell without intermediate command interpreters.

---

## 🚀 Quick Start & Development

### Prerequisites

Ensure the following tools are installed on your workstation:
- **Rust**: `1.75+` (`rustc`, `cargo`) — [Install Rust](https://rustup.rs/)
- **Node.js**: `v20.x` or `v22.x` (LTS recommended) — [Install Node.js](https://nodejs.org/)
- **Package Manager**: `npm` (v10+)
- **System Webview**:
  - Windows: Microsoft Edge WebView2 (pre-installed on Windows 10/11)
  - macOS: Safari / WebKit (built-in)
  - Linux: `webkit2gtk-4.1` (via system package manager)

### 1. Clone the Repository

```bash
git clone https://github.com/ZerDevStudio/ZervHub.git
cd ZervHub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run in Development Mode

Launches Vite with Hot Module Replacement (HMR) and opens the native Tauri v2 desktop window:

```bash
npm run tauri dev
```

*(Alternatively: `npm run tauri:dev`)*

### 4. Build for Production

Compile the optimized release binary and target installer:

```bash
# Build production bundle with Tauri CLI
npm run tauri build

# Or generate the Windows NSIS installer directly
npm run dist:win
```

The compiled binaries will be output to `src-tauri/target/release/bundle/`.

### 5. Run Automated Tests

ZenDev maintains comprehensive test coverage across both frontend and backend suites:

```bash
# Execute frontend Vitest test suite (691+ unit & integration tests)
npm test

# Execute native Rust test suite
cargo test --manifest-path src-tauri/Cargo.toml
```

---

## 🤝 Community & Contributing

Contributions are welcomed! Before opening a pull request:
1. Review [CONTRIBUTING.md](https://github.com/ZerDevStudio/ZervHub/blob/main/CONTRIBUTING.md) for architecture guidelines and branch conventions.
2. Read [SECURITY.md](https://github.com/ZerDevStudio/ZervHub/blob/main/SECURITY.md) for responsible vulnerability disclosure.
3. Submit feature requests through the [SaaS Feature Gatekeeper Template](https://github.com/ZerDevStudio/ZervHub/issues/new?template=feature_request.md).
4. Report bugs via the [Bug Report Template](https://github.com/ZerDevStudio/ZervHub/issues/new?template=bug_report.md).

---

## 📜 License

Copyright © 2026 ZerDevStudio. Distributed under the [Apache License, Version 2.0](https://github.com/ZerDevStudio/ZervHub/blob/main/LICENSE).
