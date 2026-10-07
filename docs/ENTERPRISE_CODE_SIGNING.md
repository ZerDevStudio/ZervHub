# ZenDev Enterprise Code Signing & Distribution Architecture

> **Document Version:** 1.0.0  
> **Audience:** DevOps Engineers, Release Managers, Security Architects  
> **Product:** ZenDev Desktop Developer SaaS (`ZerDevStudio/ZervHub`)  
> **Compliance Directive:** `.agents/rules/zendev-saas-directive.md` (Faz 4: Güvenlik, Uyumluluk & Dağıtım Mükemmeliyeti)

---

## 1. Overview & Objectives

In enterprise software distribution, software authenticity and publisher verification are foundational. Without trusted digital signatures:
- **Windows SmartScreen** displays aggressive warning dialogs (*"Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting"*), eroding end-user trust and blocking non-admin enterprise installations.
- **macOS Gatekeeper** terminates or quarantines unsigned binaries (*"App cannot be opened because Apple cannot check it for malicious software"*).
- **Group Policy (GPO) & Microsoft Intune** enterprise application policies reject unsigned or untrusted executables by default.

This document outlines the end-to-end code signing infrastructure for ZenDev, including **Extended Validation (EV) Hardware Security Modules (HSM)**, **Microsoft Azure Trusted Signing**, **Apple Developer Notarization**, and automated CI/CD pipeline integration.

---

## 2. Windows Code Signing Architecture

### 2.1 Standard vs. Extended Validation (EV) Signing

| Feature | Standard Code Signing | EV Code Signing (HSM / Cloud) | Microsoft Azure Trusted Signing |
| :--- | :---: | :---: | :---: |
| **Identity Verification** | Domain / Basic Organization | Strict Vetting & Dun & Bradstreet | Microsoft Verified Identity & Tenant |
| **Private Key Storage** | Software / PFX File | FIPS 140-2 Level 2+ HSM | Microsoft Managed FIPS HSM |
| **Instant SmartScreen Trust** | ❌ (Requires building reputation) | ✅ Instant Reputation Boost | ✅ Instant High-Reputation Trust |
| **Kernel Driver Signing** | ❌ | ✅ | ✅ |
| **CI/CD Integration** | Simple file-based | Requires Cloud Key Vault | Native GitHub Actions / Azure CLI |

ZenDev standardizes on **Microsoft Azure Trusted Signing** (formerly Microsoft Identity Verification) backed by dedicated **Azure Key Vault HSMs** for all production release artifacts.

---

## 3. Microsoft Azure Trusted Signing Integration

### 3.1 Architecture Workflow

```
+---------------------+       +---------------------------+       +-----------------------------+
| GitHub Actions CI   | ----> | Azure Trusted Signing CLI | ----> | Microsoft FIPS 140-2 Level 2|
| (Release Pipeline)  |       | (dlib integration)        |       | Cloud Hardware HSM Vault    |
+---------------------+       +---------------------------+       +-----------------------------+
           |                                                                     |
           v                                                                     v
+---------------------+                                           +-----------------------------+
| ZenDev-Setup.exe /  | <---------------------------------------- | Authenticode RSA-4096 /     |
| ZenDev-Portable.exe |       (Digitally Signed & Timestamped)    | RFC 3161 SHA-256 Digest     |
+---------------------+                                           +-----------------------------+
```

### 3.2 Automated CI/CD Signing Script (`signtool.exe`)

For Windows production builds (`src-tauri/target/release/bundle/nsis/`):

```powershell
# Authenticate against Azure Key Vault / Trusted Signing Provider
az login --service-principal -u $env:AZURE_CLIENT_ID -p $env:AZURE_CLIENT_SECRET --tenant $env:AZURE_TENANT_ID

# Invoke SignTool with Trusted Signing dlib
& "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe" sign `
    /v `
    /dlib "C:\AzureTrustedSigning\Azure.CodeSigning.Dlib.dll" `
    /dmdf "C:\AzureTrustedSigning\metadata.json" `
    /fd SHA256 `
    /tr "http://timestamp.acs.microsoft.com" `
    /td SHA256 `
    "src-tauri\target\release\bundle\nsis\ZenDev-Setup-2.5.6.exe"

# Verify digital signature authenticity
& "signtool.exe" verify /pa /v "src-tauri\target\release\bundle\nsis\ZenDev-Setup-2.5.6.exe"
```

### 3.3 Trusted Signing Metadata Configuration (`metadata.json`)

```json
{
  "Endpoint": "https://eus.codesigning.azure.net/",
  "CodeSigningAccountName": "ZerDevStudioTrustedSigning",
  "CertificateProfileName": "ZenDevEnterpriseRelease",
  "CorrelationId": "zendev-release-v2.5.6"
}
```

---

## 4. macOS Gatekeeper & Notarization Architecture

For macOS distribution (DMG / `.app` bundle):

### 4.1 Developer ID Application Signing
1. The `.app` bundle and helper binaries are signed with the **Apple Developer ID Application Certificate**:
   ```bash
   codesign --force --options runtime --deep --sign "Developer ID Application: ZerDev Studio Inc." \
       --entitlements "src-tauri/Entitlements.plist" \
       "src-tauri/target/release/bundle/macos/ZenDev.app"
   ```

### 4.2 Hardened Runtime & Entitlements
ZenDev enables macOS Hardened Runtime with minimal required entitlements:
- `com.apple.security.network.client`: Allows local network and HTTPS loopback requests.
- `com.apple.security.cs.allow-jit`: Used by WebKit JavaScript engine inside Tauri webview.

### 4.3 Apple Notarization Pipeline (`notarytool`)
The signed DMG is submitted to Apple Notary Service via GitHub Actions:
```bash
xcrun notarytool submit "ZenDev.dmg" \
    --apple-id "$APPLE_ID" \
    --team-id "$APPLE_TEAM_ID" \
    --password "$APPLE_APP_SPECIFIC_PASSWORD" \
    --wait

# Staple the notarization ticket to the DMG
xcrun stapler staple "ZenDev.dmg"
```

---

## 5. SmartScreen Reputation Warm-Up & Maintenance Strategy

For newly generated certificate profiles or minor patch versions:
1. **Microsoft Partner Center Submission:** Submit release binaries to the [Microsoft Security Intelligence Developer Portal](https://www.microsoft.com/en-us/wdsi/filesubmission) for pre-release automated classification.
2. **Dual-Timestamping:** All executables use RFC 3161 SHA-256 timestamps (`http://timestamp.acs.microsoft.com`), ensuring signatures remain permanently valid even after certificate expiration.
3. **Consistent Authenticode Publisher Identity:** Publisher identity (`CN=ZerDev Studio Inc., O=ZerDev Studio Inc., C=US`) remains immutable across all NSIS setup and portable `.exe` artifacts.

---

## 6. Enterprise IT Deployment & Packaging

### 6.1 Silent Installation for System Administrators
Enterprise administrators deploying ZenDev via Microsoft Intune or SCCM can deploy the verified NSIS installer using command-line arguments:
```cmd
ZenDev-Setup-2.5.6.exe /S /allusers
```
*(Note: Silent switches are strictly reserved for administrative GPO/Intune deployment and are never invoked autonomously by the client itself).*

### 6.2 Application Hash Whitelisting (AppLocker / WDAC)
Enterprise organizations enforcing **Windows Defender Application Control (WDAC)** or **AppLocker** can whitelist ZenDev using either:
- **Publisher Rule:** Whitelist all binaries signed by `ZerDev Studio Inc.`.
- **File Hash Rule:** Utilize the SHA-256 checksums published alongside each official GitHub Release:
  ```powershell
  Get-FileHash -Algorithm SHA256 "ZenDev-Setup-2.5.6.exe"
  ```
