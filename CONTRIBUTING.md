# Contributing to ZenDev (ZervHub)

Thank you for your interest in contributing to **ZenDev** (ZervHub)! ZenDev is an enterprise desktop developer SaaS workstation designed for API-heavy software engineers and engineering teams. We welcome contributions that align with our core values: speed, memory safety, privacy-first local execution, and seamless team collaboration.

- **Repository**: [https://github.com/ZerDevStudio/ZervHub](https://github.com/ZerDevStudio/ZervHub)
- **Issue Tracker**: [https://github.com/ZerDevStudio/ZervHub/issues](https://github.com/ZerDevStudio/ZervHub/issues)
- **Discussions**: [https://github.com/ZerDevStudio/ZervHub/discussions](https://github.com/ZerDevStudio/ZervHub/discussions)

---

## 🧭 ZenDev Architectural Philosophy & Governance

Before proposing or writing code, all contributors must understand the **ZenDev SaaS Transformation Directive**:

1. **Desktop SaaS, Not a Swiss-Army Toy**: ZenDev consolidates high-frequency developer web tools (API/cURL, JSON, Regex, JWT, Cron, Mermaid, Encoding) into an ultra-fast, offline-first desktop environment with team synchronization.
2. **Prohibited Modules**: The following utilities are permanently removed from the project and pull requests introducing them will be rejected:
   - System-level process killing (`Port Killer` / `Port Watchdog`)
   - OS-level disk or cache clearing (`System Optimizer`)
   - Disposable email services (`Temp Mail`)
   - Silent background updaters (all updates must have transparent UI modals and user confirmation)
3. **Feature Gatekeeper**: Every new studio or feature proposal must satisfy the 5-filter test (ICP alignment, willingness to pay, necessity over 1-line CLI / free web tools, studio workflow synergy, low maintenance and security cost).

---

## 🛠️ Technology Stack

ZenDev combines a modern, reactive web UI with an ultra-lightweight, memory-safe native core:

| Layer | Technologies |
| :--- | :--- |
| **Backend & System** | [Tauri v2](https://v2.tauri.app/), [Rust](https://www.rust-lang.org/) (2021 Edition), Tokio, reqwest, aes-gcm |
| **Frontend & UI** | [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/), [Vite 6](https://vite.dev/), [Tailwind CSS](https://tailwindcss.com/) |
| **State & Data** | React Hooks, SQLite ([sql.js](https://sql.js.org/)), Web Crypto API, Mermaid.js |
| **Testing** | [Vitest](https://vitest.dev/), Rust `cargo test` |

---

## ⚙️ Development Environment Prerequisites

Ensure you have the following installed on your host machine:

### 1. Node.js & Package Manager
- **Node.js**: v18.18+ or v20.x LTS (v22+ supported)
- **npm**: v9+ (shipped with Node.js)

Verify:
```bash
node -v
npm -v
```

### 2. Rust Toolchain
Install the stable Rust toolchain via [rustup](https://rustup.rs/):
```bash
# Verify installation
rustc --version
cargo --version
```
Target edition: **Rust 2021 edition**.

### 3. OS-Specific Requirements for Tauri v2

#### Windows:
- **Microsoft Visual Studio C++ Build Tools** (Select "Desktop development with C++").
- **Microsoft Edge WebView2 Runtime** (installed by default on Windows 10/11).

#### macOS:
- **Xcode Command Line Tools**:
  ```bash
  xcode-select --install
  ```

#### Linux (Debian / Ubuntu):
- System packages:
  ```bash
  sudo apt update
  sudo apt install -y libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
  ```

Check your complete environment with the Tauri CLI helper:
```bash
npm run tauri info
```

---

## 🚀 Getting Started & Local Workflow

### 1. Clone the Repository
```bash
git clone https://github.com/ZerDevStudio/ZervHub.git
cd ZervHub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch the Application

#### Full Desktop Application (Frontend + Rust Backend)
Runs the Vite development server and launches the native Tauri desktop window with hot-module reloading (HMR) and Rust automatic recompilation:
```bash
npm run tauri dev
```

#### Frontend-Only Web Mode (Rapid UI Prototyping)
To prototype UI components rapidly in a browser without launching the native desktop window:
```bash
npm run dev
```

---

## 🌿 Branch & Git Conventions

### Branch Naming
Create focused branches branching off `main`:
- `feature/<short-name>`: New developer studio or user-facing feature
- `fix/<issue-number>-<short-description>`: Bug fixes
- `perf/<target-metric>`: Performance improvements (memory, boot time)
- `docs/<subject>`: Documentation, guides, or RFC updates
- `refactor/<target>`: Internal architectural cleanups without behavior change

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

**Allowed types:**
- `feat`: A new studio or feature
- `fix`: A bug fix
- `perf`: A code change improving performance
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `docs`: Documentation changes
- `test`: Adding or modifying tests
- `chore`: Build tasks, dependency bumps, or tooling adjustments

*Examples:*
- `feat(jwt-studio): add HMAC-SHA256 signature verification slider`
- `fix(bypasser): resolve query string parsing edge case for shortened URLs`
- `docs(readme): update performance benchmark comparison table`

---

## 🧪 Testing & Quality Commands

Every contribution must pass all local verification checks before creating a pull request.

### 1. Frontend Test Suite (Vitest)
Run all unit and component tests:
```bash
npm run test
```
To run tests in watch mode:
```bash
npx vitest
```

### 2. Rust Backend Compilation & Tests
Check compilation without building full artifacts:
```bash
cargo check --manifest-path src-tauri/Cargo.toml
```
Execute all Rust unit and integration test suites:
```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

### 3. TypeScript Type Checking & Linting
Validate strict TypeScript contracts and code formatting hygiene:
```bash
npm run lint    # or npx tsc --noEmit
```

### 4. Production Build Verification
Verify clean production packaging:
```bash
npm run build
```

---

## 🌐 Internationalization (i18n) Guidelines

ZenDev provides full bilingual support for **Turkish (tr)** and **English (en)**.

1. **Parity Requirement**: All string keys added to `src/renderer/src/locales/tr.json` **MUST** also be added to `src/renderer/src/locales/en.json` (and vice-versa).
2. **No Hardcoded Strings**: Never hardcode user-visible strings inside React components. Always use the translation hook:
   ```tsx
   import { useTranslation } from '../context/I18nContext';
   
   const MyComponent = () => {
     const { t } = useTranslation();
     return <span>{t('myStudio.title')}</span>;
   };
   ```
3. **Naming Convention**: Group keys semantically by studio name or domain:
   ```json
   {
     "myStudio": {
       "title": "My Studio",
       "description": "Studio description",
       "action": "Execute"
     }
   }
   ```

---

## 🔒 Security & Safe Execution Practices

ZenDev operates as a desktop application with native system capabilities. Maintain the highest security standards:

- **Least Privilege IPC**: Only expose necessary Rust commands to the Tauri IPC bridge. Validate and sanitize all parameters on the Rust side.
- **Never Execute Uncontrolled Subprocesses**: Do not use shell execution with unsanitized user inputs.
- **No Hidden Background Tasks**: Subprocesses must never run silently without transparent UI disclosure.
- **URL Validation**: All external URLs must be strictly validated to `http:` or `https:` protocols before invoking the system opener.

For reporting security vulnerabilities, refer to [SECURITY.md](SECURITY.md).

---

## 📦 Pull Request Process

1. Open an issue first to discuss substantial feature proposals or architectural refactoring.
2. Fork the repository and create your branch from `main`.
3. Verify that all tests pass (`npm run test` and `cargo test`).
4. Ensure 100% i18n parity between `tr.json` and `en.json`.
5. Open a Pull Request referencing your issue, and complete the checklist in [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md).
6. A maintainer will review your pull request and provide feedback.
