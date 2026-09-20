## Summary
<!-- Provide a concise summary of the changes introduced in this pull request and their motivation. -->

## Related Issue
<!-- Link the related issue(s) resolved or referenced by this PR. E.g., Fixes #123, Closes #456 -->
- Fixes #

## Type of Change
<!-- Select all that apply by replacing [ ] with [x]. -->
- [ ] 🐛 **Bug fix** (non-breaking fix for an existing issue)
- [ ] 🚀 **New studio / feature** (must satisfy the 5-filter ZenDev Feature Gatekeeper)
- [ ] ⚡ **Performance optimization** (latency, memory, or bundle size improvements)
- [ ] 📚 **Documentation** (updates to docs, README, guides, or specifications)
- [ ] 🛠️ **Refactor / Architecture** (code structure improvements with no behavior alterations)
- [ ] 🔒 **Security hardening** (IPC perimeter, crypto, or vulnerability mitigations)

---

## 📋 Quality & Compliance Checklist

Please ensure all checks pass before requesting a review:

- [ ] Code adheres to clean-code standards and SaaS Directive (no prohibited modules).
- [ ] Passing npm test (frontend Vitest suites).
- [ ] Passing cargo check and cargo test (Rust backend).
- [ ] 100% bilingual i18n parity verified between src/renderer/src/locales/tr.json and en.json.
- [ ] No silent background processes or AV/EDR heuristic triggers (CREATE_NO_WINDOW used appropriately or transparent user confirmation).
- [ ] No hardcoded secrets, test mocks, or temporary debugging code.
- [ ] Cross-platform compatibility verified or evaluated (Windows, macOS, Linux).

---

## 🧪 Testing Performed
<!-- Describe the specific tests, manual scenarios, and reproduction steps used to verify these changes. -->
1. 
2. 

## 📸 Screenshots / Recordings (if applicable)
<!-- Attach before/after screenshots or recordings for UI and studio changes. -->
