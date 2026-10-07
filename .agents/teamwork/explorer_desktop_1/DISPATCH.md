# Dispatch: Explorer 2 (Desktop Application Functional & Security)

## Objective
Conduct deep QA, user flow, stability, and security validation on the ZenDev desktop application codebase (`src/` and `src-tauri/`).

## Authority & Inputs
- Original Request: `c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\.agents\teamwork\ORIGINAL_REQUEST.md` (Read this first!)
- Scope: `src/renderer/` (React 19 + TypeScript frontend), `src-tauri/` (Rust Tauri v2 backend)

## Specific Investigation Tasks
1. **Dual-Mode Workspace Flow & State Hygiene**:
   - Audit `WorkspaceModeContext.tsx`, `TitleBar.tsx`, `Sidebar.tsx`, `CommandPalette.tsx`, `Dashboard.tsx`, and `App.tsx`.
   - Verify mode switching (`essential` vs `developer`), `localStorage` persistence (`zendev_workspace_mode`), keyboard shortcut (`Ctrl+M` / `Cmd+M`), and route guards for unlisted developer tools when in Essential mode.
   - Check tool switching state retention, memory leaks, and unmounted state updates.
2. **Local Security Posture & Cryptography**:
   - CyberFortress vault encryption (`AES-GCM`): evaluate key derivation, nonce reuse risks, in-memory key clearing, zero-pass file shredding safety in `src-tauri/src/`.
   - Hardware ID licensing integrity (`hwid.rs`): verify compatibility with legacy `node-machine-id` format, byte-for-byte fidelity, registry query safety.
   - Zero-network privacy: verify that offline-first developer tools do not make unauthorized background telemetry or network calls.
   - Tauri IPC Capabilities (`src-tauri/capabilities/` and `src-tauri/tauri.conf.json`): audit exposed commands and principle of least privilege.
3. **Subprocess Execution & AV/EDR Behavioral Heuristics**:
   - Audit `src-tauri/src/` for all `std::process::Command` and `tokio::process::Command` usage.
   - Check whether `CREATE_NO_WINDOW` (`0x08000000`) is consistently applied, and whether background processes could trigger AV/EDR heuristic alarms.
   - Verify updater security (`updater.rs`): ensure transparent, user-approved update flow rather than silent background execution.
4. **Error Handling, Latency & Panic Risks**:
   - Search for panic risks in Rust backend: unchecked `unwrap()`, `expect()`, slice index bounds, recursion.
   - Evaluate React Error Boundary coverage across all pages and studios (`src/renderer/src/pages/`).
   - Audit IPC error handling: what happens on corrupt input, timeouts, or process failures?

## Deliverable
Write your comprehensive report to:
`c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\.agents\teamwork\explorer_desktop_1\handoff.md`
Include:
- Executive Summary & Audit Scorecard
- Categorized Findings (Critical, High, Medium, Low) with exact file paths and line citations
- Security & Panic Risk Matrix
- Concrete Remediation Actions & Priority recommendations
- Send a summary message back to the orchestrator when completed.

## 2026-10-07T15:08:04Z
From: 88f3108c-6adc-4331-bf1e-706e66062369 (Orchestrator)

You are the Desktop Application Auditor (Explorer 2).
Working directory: c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\.agents\teamwork\explorer_desktop_1
Orchestrator Conversation ID: 88f3108c-6adc-4331-bf1e-706e66062369

MANDATORY FIRST STEPS:
1. Read ORIGINAL_REQUEST.md at: c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read your dispatch file at: c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\.agents\teamwork\explorer_desktop_1\DISPATCH.md

MISSION:
Conduct deep QA, flow, stability, and security validation on the ZenDev desktop application codebase (src/ and src-tauri/):
- Dual-mode workspace validation: Essential Tools vs Developer Suite modes, WorkspaceModeContext, localStorage persistence (zendev_workspace_mode), mode switcher (TitleBar, Sidebar, CommandPalette, Dashboard), route guards for unlisted developer tools, hotkeys (Ctrl+M / Cmd+M).
- Security posture & cryptography: CyberFortress vault encryption (AES-GCM), key derivation, nonce reuse risks, in-memory key hygiene, zero-pass file shredding safety in src-tauri/src/.
- Hardware ID licensing integrity (hwid.rs): backward compatibility with legacy node-machine-id format, byte-for-byte fidelity, registry query safety.
- Zero-network privacy: verify that offline-first developer tools do not make unauthorized telemetry or network calls.
- Tauri IPC Capabilities (src-tauri/capabilities/ and tauri.conf.json) and command sanitization against principle of least privilege.
- Subprocess execution & AV/EDR heuristics: investigate CREATE_NO_WINDOW (0x08000000) usage across all Command::new sites in src-tauri/src/, updater security (transparent vs silent background execution).
- Error handling & panic risks in Rust backend (unwrap(), expect(), slice indexing) and React Error Boundary coverage across all pages and studios (src/renderer/src/pages/).

Deliver your comprehensive audit report with exact file paths, line ranges, severity (Critical, High, Medium, Low), and prioritized remediation actions to:
c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\.agents\teamwork\explorer_desktop_1\handoff.md

When complete, send a message to orchestrator (ID: 88f3108c-6adc-4331-bf1e-706e66062369) summarizing your findings.
