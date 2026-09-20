# Security Policy

ZenDev (ZervHub) takes the security and privacy of our users, their local environments, and engineering teams very seriously. As an offline-first desktop developer workstation, our security model is founded on local isolation, least-privilege IPC boundaries, zero unconsented telemetry, and cryptographic integrity.

This document outlines our vulnerability disclosure process, security boundaries, and supported versions.

---

## 🛡️ Supported Versions

We provide active security fixes for current and recent production releases:

| Version | Supported | Security Policy |
| :--- | :---: | :--- |
| **2.5.x** | ✅ Yes | Actively supported with immediate security patches |
| **2.4.x** | ⚠️ Partial | Critical security hotfixes only |
| **< 2.4.0** | ❌ No | Deprecated legacy releases (Migrate to v2.5+) |

We strongly encourage all users to remain on the latest stable release.

---

## 🚨 Reporting a Vulnerability

**DO NOT disclose vulnerabilities or zero-day exploits in public GitHub issues, discussions, or pull requests.**

If you discover a security vulnerability in ZenDev, please report it through one of our private, encrypted channels:

### 1. Primary Channel: Security Email
Send your encrypted report directly to:
📧 **`security@zerdev.studio`**

*Subject line format*: `[SECURITY] Vulnerability Report: <Brief Description>`

### 2. Alternative Channel: GitHub Private Vulnerability Reporting
You may also submit a confidential report directly via GitHub:
👉 **[Report a vulnerability via GitHub Advisory](https://github.com/ZerDevStudio/ZervHub/security/advisories/new)**

---

## 📋 What to Include in Your Report

To help us triage and remediate the issue quickly, please provide as much context as possible:

1. **Vulnerability Type**: (e.g., IPC command injection, memory corruption, path traversal, insecure cryptographic storage, updater spoofing).
2. **Affected Components**: Specify whether the issue affects the Tauri/Rust core (`src-tauri/`), React renderer (`src/renderer/`), IPC bridge commands, or network/crypto modules.
3. **Environment & Version**: Operating system (Windows, macOS, Linux), architecture (x64, arm64), and ZenDev version tested.
4. **Step-by-Step Reproduction**: Detailed reproduction steps or a minimal Proof of Concept (PoC) demonstrating the vulnerability.
5. **Impact Assessment**: How an attacker could exploit this vulnerability, preconditions required, and potential blast radius.
6. **Suggested Fix**: (Optional) Remediation patch or mitigation proposal.

---

## ⏱️ Response SLA & Coordinated Disclosure

We are committed to transparent, timely, and responsible vulnerability remediation:

- **Initial Acknowledgement**: Within **48 hours** of receiving your report, our security team will acknowledge receipt and assign a case coordinator.
- **Triage & Assessment**: Within **5 business days**, we will complete an initial assessment, determine CVSS severity, and share our findings with you.
- **Remediation & Patching**:
  - *Critical / High severity*: We target release of a patched build within **14 calendar days**.
  - *Medium / Low severity*: Remediated in the next scheduled release cycle (typically within **30 days**).
- **Coordinated Disclosure**: We follow coordinated vulnerability disclosure. We ask that reporters refrain from publicly discussing or publishing vulnerability details until:
  1. A formal patch has been released.
  2. Reasonable time has elapsed for users to update (typically 14 to 30 days post-release).
  3. A joint CVE/Advisory has been coordinated if appropriate.

We maintain a Security Hall of Fame acknowledging security researchers who responsibly report vulnerabilities to us.

---

## 🔍 Security Architecture & In-Scope Boundaries

When auditing or reviewing ZenDev, note our core security perimeters:

### 1. Rust Backend & Memory Safety (`src-tauri/src/`)
- Native system code is written in 100% safe, idiomatic Rust (2021 edition).
- Memory safety, safe buffer allocations, and structured error handling without unchecked panics (`unwrap` on untrusted input).

### 2. Tauri v2 IPC Bridge Boundary
- The IPC bridge connects the web renderer to native Rust commands.
- Commands adhere to the principle of least privilege.
- Arguments passed across the IPC boundary are strictly validated, deserialized using serde schemas, and path-traversal sanitized.

### 3. Encrypted Storage & Cryptography (Cyber Fortress)
- File encryption utilizes **AES-256-GCM** with cryptographically secure random nonces (`rand::rngs::OsRng`).
- Key derivation utilizes **PBKDF2-HMAC-SHA256** with high iteration counts and secure salt generation.
- Memory holding keys or sensitive buffers is zeroized upon drop using the `zeroize` crate.
- File shredding implements multi-pass cryptographic overwrite routines.

### 4. Updater Integrity & Safe Subprocesses
- Releases are cryptographically signed.
- Update flows require explicit user confirmation with transparent changelog modals.
- ZenDev strictly forbids silent background execution (`CREATE_NO_WINDOW`) for unsigned third-party processes.
- External link dispatch is restricted to `http:` and `https:` schemes and opened via OS-native handlers without shell command expansion.

---

## 🚫 Out of Scope

The following are generally considered out of scope unless they produce unexpected privilege escalation or arbitrary code execution:

- Physical access attacks where the attacker already has administrator/root access to the host machine.
- Theoretical attacks without practical proof of concept.
- Social engineering attacks against ZenDev developers or maintainers.
- Issues in third-party websites or services linked to from developer studios.
