# Rust Backend & Security Audit Report — ZenDev (NexusHub)

## 1. Observation

A comprehensive, top-to-bottom static code audit and security architecture analysis was conducted across all 16 Rust backend source files in `src-tauri/src/`, configuration files (`src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`), capability declarations (`src-tauri/capabilities/default.json`), and the IPC frontend bridge (`src/renderer/src/lib/tauriBridge.ts`).

### 1.1 Codebase Survey & Module Inventory
The Rust backend is structured as a Tauri v2 library crate (`zendev_tauri_lib`) with an application binary (`src/main.rs`). The audited modules comprise:

| Module | File Path | SLOC / Size | Primary Responsibility | IPC Commands Exposed |
|---|---|---|---|---|
| Core / Window | `src-tauri/src/lib.rs` | 223 lines / 6.2 KB | Application lifecycle, window controls, URL opener | `window_*`, `open_external`, `app_get_version`, `app_memory_sweep` |
| Process Ext | `src-tauri/src/process_ext.rs` | 152 lines / 4.9 KB | `CREATE_NO_WINDOW` subprocess builder abstraction | None (internal utility) |
| HWID Engine | `src-tauri/src/hwid.rs` | 180 lines / 6.9 KB | Hardware ID extraction & node-machine-id parity | `get_device_id` |
| Safe Storage | `src-tauri/src/safe_storage.rs` | 359 lines / 10.8 KB | DPAPI & AES-256-GCM secret persistence | `safe_storage_*` (6 commands) |
| License Engine | `src-tauri/src/license.rs` | 594 lines / 19.8 KB | HMAC & ECDSA validation, 72h Pro trial | `license_*`, `check_license` (6 commands) |
| Cyber Fortress | `src-tauri/src/crypto.rs` | 878 lines / 30.2 KB | AES-GCM file vault & DoD 7-pass shredder | `fortress_encrypt_file`, `fortress_decrypt_file`, `fortress_shred_file`, `fortress_select_file` |
| Network Tools | `src-tauri/src/network.rs` | 1,280 lines / 46.0 KB | Native ping, port scan, IP lookup, DoH/nslookup, SSL inspector | `network_ping`, `network_port_scan`, `network_ip_lookup`, `network_my_ip`, `network_dns_query`, `network_ssl_inspect` |
| Net Dispatcher | `src-tauri/src/net_dispatcher.rs` | 763 lines / 28.0 KB | Outbound CORS-bypassing HTTP dispatcher & SSRF guard | `net_dispatch_request`, `net_dispatcher_send`, `net_dns_lookup`, `net_tcp_ping`, `net_ssl_check` |
| PDF Engine | `src-tauri/src/pdf.rs` | 737 lines / 24.7 KB | Lopdf metadata inspection, merge, and split | `pdf_inspect`, `pdf_inspect_files`, `pdf_merge`, `pdf_split`, `pdf_select_files` |
| Image Processing | `src-tauri/src/image.rs` | 616 lines / 21.0 KB | Lanczos3 resize, transcoding, EXIF auto-rotation | `image_get_metadata`, `image_process_single`, `image_process_batch`, `image_process`, `image_select_files` |
| Bulk Organizer | `src-tauri/src/organizer.rs` | 396 lines / 11.9 KB | Extension classification, file relocation & undo | `organizer_select_dir`, `organizer_scan`, `organizer_execute`, `organizer_can_undo`, `organizer_undo` |
| Link Bypasser | `src-tauri/src/bypasser.rs` | 1,072 lines / 39.0 KB | Ad-shortener token extraction & tracking stripper | `bypass_link`, `decrypter_clean`, `decrypter_clean_batch` |
| Resource Sentinel | `src-tauri/src/sentinel.rs` | 162 lines / 4.5 KB | Sysinfo hardware stats & Win32 working-set trim | `sentinel_get_stats`, `sentinel_optimize_memory` |
| Activity Journal | `src-tauri/src/journal.rs` | 832 lines / 27.8 KB | Cryptographic SHA-256 hash-chained audit log | `journal_record`, `journal_query`, `journal_clear`, `journal_verify_chain`, `journal_export`, `journal_get_stats` |
| Auto Updater | `src-tauri/src/updater.rs` | 290 lines / 9.5 KB | GitHub releases checker & installer execution | `updater_check_now`, `updater_install_now` |
| Entry Point | `src-tauri/src/main.rs` | 6 lines / 111 B | Binary bootstrap | None |

---

### 1.2 Itemized Audit Findings

```
====================================================================================================
FINDING ID: SEC-01
TITLE:      Critical Windows Command Injection via `cmd.exe /C start ""` in `open_external`
SEVERITY:   CRITICAL (CVSS: 9.8 - AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)
CATEGORY:   Security Vulnerability / RCE
FILE:       src-tauri/src/lib.rs (Lines 74–97)
====================================================================================================
```
#### Vulnerable Code:
```rust
// src-tauri/src/lib.rs:74-97
#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        silent_command("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        silent_command("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        silent_command("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
```

#### Threat Model & Attack Scenario:
1. `cmd.exe /C start ""` interprets cmd shell metacharacters (`&`, `&&`, `|`, `||`, `%VAR%`, `^`).
2. The `url` parameter received from the Tauri IPC layer is unvalidated. No scheme verification (`http://` / `https://`) or character sanitization is performed.
3. If an attacker delivers a URL such as:
   `https://example.com & calc.exe` or `https://example.com & powershell -ep bypass -enc ...`
   `cmd.exe` executes `start "" "https://example.com"` followed immediately by the injected command `calc.exe`.
4. This command is callable from the webview via `window.nexusAPI.openExternal(url)` and is also invoked automatically during updates by `updater_install_now`. Any XSS in the frontend, malicious Markdown link rendered in `MermaidStudio`, or untrusted redirected URL processed by `bypasser` can trigger full Remote Code Execution (RCE) on the user's workstation.

#### Concrete Remediation & Proposed Code Diff:
Never invoke `cmd.exe` to open URLs. On Windows, use `ShellExecuteW` directly via Win32 API or Tauri's native `tauri_plugin_opener`, ensuring only `http://` and `https://` URLs are accepted.

```rust
// Proposed fix in src-tauri/src/lib.rs:
#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    let parsed = url::Url::parse(&url).map_err(|e| format!("Invalid URL: {}", e))?;
    if parsed.scheme() != "http" && parsed.scheme() != "https" {
        return Err("Only http and https protocols are permitted for external opening".into());
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::ffi::OsStrExt;
        let wide: Vec<u16> = std::ffi::OsStr::new(parsed.as_str())
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
        let op: Vec<u16> = std::ffi::OsStr::new("open")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();

        extern "system" {
            fn ShellExecuteW(
                hwnd: isize,
                lpOperation: *const u16,
                lpFile: *const u16,
                lpParameters: *const u16,
                lpDirectory: *const u16,
                nShowCmd: i32,
            ) -> isize;
        }

        let ret = unsafe {
            ShellExecuteW(0, op.as_ptr(), wide.as_ptr(), std::ptr::null(), std::ptr::null(), 1)
        };
        if ret <= 32 {
            return Err(format!("ShellExecuteW failed with error code: {}", ret));
        }
    }
    #[cfg(target_os = "macos")]
    {
        silent_command("open").arg(parsed.as_str()).spawn().map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        silent_command("xdg-open").arg(parsed.as_str()).spawn().map_err(|e| e.to_string())?;
    }
    Ok(())
}
```

---

```
====================================================================================================
FINDING ID: SEC-02
TITLE:      Arbitrary File Deletion & Cross-Platform Path Traversal in `fortress_shred_file`
SEVERITY:   HIGH (CVSS: 8.6 - AV:L/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:H)
CATEGORY:   Security Vulnerability / Data Destruction
FILE:       src-tauri/src/crypto.rs (Lines 140–219, 503–596, 630–642)
====================================================================================================
```
#### Vulnerable Code:
```rust
// src-tauri/src/crypto.rs:140-218
pub fn is_system_protected_path(target_path: &Path) -> bool {
    let path_str = target_path.to_string_lossy().to_string();
    if path_str.trim().is_empty() { return false; }
    let normalized = path_str.replace('/', "\\").to_lowercase();
    let trimmed = normalized.trim_end_matches('\\');

    let system_drive = std::env::var("SystemDrive").unwrap_or_else(|_| "c:".to_string()).to_lowercase();
    let sys_drive_prefix = system_drive.trim_end_matches('\\');
    if trimmed == sys_drive_prefix || normalized == format!("{}\\", sys_drive_prefix) { return true; }
    // ... checks SystemRoot, ProgramFiles, ProgramFiles(x86), ProgramW6432
    false
}

// src-tauri/src/crypto.rs:503-513
pub fn shred_file(file_path: &Path) -> Result<VaultOpResult, String> {
    if is_system_protected_path(file_path) {
        return Ok(VaultOpResult::err("Sistem güvenliği nedeniyle korumalı Windows dizinleri imha edilemez."));
    }
    // Overwrites file 7 times with DoD 5220.22-M passes, truncates to 0, and unlinks
    // ...
```

#### Threat Model & Attack Scenario:
1. `is_system_protected_path` relies exclusively on Windows-specific environment variables (`SystemDrive`, `SystemRoot`, `ProgramFiles`). On Linux and macOS, these environment variables do not exist; the function returns `false` for every single path, including `/etc/passwd`, `/etc/shadow`, `/usr/bin`, `/home/user/.ssh`.
2. On Windows, `is_system_protected_path` checks string prefixes without path canonicalization (`fs::canonicalize`). Relative paths (e.g. `C:\Users\foo\..\Windows\System32\somefile.dll`) can bypass the string prefix checks.
3. More critically, the shredder allows targeting *any user file*. There is no boundary verification to ensure the file was picked by the user or resides in an authorized vault workspace. Any script calling `window.nexusAPI.fortress.shredFile("C:\\Users\\User\\.ssh\\id_rsa")` will permanently overwrite and delete SSH keys, Git repositories, or source files with zero confirmation dialog.

#### Concrete Remediation:
1. Resolve and canonicalize paths using `std::fs::canonicalize`.
2. Add cross-platform root / system directory protection for Linux and macOS (`/`, `/etc`, `/bin`, `/usr`, `/System`, `/Library`, `/dev`, `/proc`).
3. Enforce that files to be shredded must either reside within a dedicated vault sandbox or require explicit cryptographic confirmation tokens from the native file picker dialog.

---

```
====================================================================================================
FINDING ID: SEC-03
TITLE:      Arbitrary File Relocation & System Modification in `organizer_execute`
SEVERITY:   HIGH (CVSS: 8.2 - AV:L/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:H)
CATEGORY:   Security Vulnerability / Unauthorized Modification
FILE:       src-tauri/src/organizer.rs (Lines 264–331)
====================================================================================================
```
#### Vulnerable Code:
```rust
// src-tauri/src/organizer.rs:264-315
#[tauri::command]
pub async fn organizer_execute(operations: Vec<FileOperation>) -> Result<ExecutionResult, String> {
    tokio::task::spawn_blocking(move || {
        // ...
        for op in operations {
            let src = Path::new(&op.old_path);
            let dest = Path::new(&op.new_path);

            if !src.exists() {
                failed_ops += 1;
                errors.push(format!("Source file does not exist: {}", op.old_path));
                continue;
            }

            if let Some(dest_dir) = dest.parent() {
                if let Err(err) = fs::create_dir_all(dest_dir) { ... }
            }

            let safe_dest = get_unique_path(dest);
            match safe_move_file(src, &safe_dest) { ... }
        }
```

#### Threat Model & Attack Scenario:
`organizer_execute` accepts arbitrary `FileOperation` structs containing `old_path` and `new_path`. There is NO check to verify that `old_path` or `new_path` are inside the folder selected during `organizer_select_dir` or scanned during `organizer_scan`.
An attacker can invoke `organizer_execute` with:
- `old_path`: `C:\Users\<Victim>\.ssh\authorized_keys`
- `new_path`: `C:\Users\<Victim>\AppData\Local\Temp\stolen_key`
or move critical system configuration files, causing application corruption, privilege escalation, or arbitrary relocation of sensitive assets across the filesystem.

#### Concrete Remediation:
Enforce directory root confinement:
1. Maintain an active workspace directory session.
2. For every `op` in `operations`, canonicalize `src` and `dest` and enforce `canonical_path.starts_with(&authorized_dir)`.

---

```
====================================================================================================
FINDING ID: SEC-04
TITLE:      SSRF Filter Bypass via HTTP Redirects & Insecure Default (`allow_local = true`)
SEVERITY:   HIGH (CVSS: 8.3 - AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:L/A:N)
CATEGORY:   Security Vulnerability / SSRF
FILE:       src-tauri/src/net_dispatcher.rs (Lines 428–469)
====================================================================================================
```
#### Vulnerable Code:
```rust
// src-tauri/src/net_dispatcher.rs:428-430
let allow_local = options.allow_local.unwrap_or(true);
let parsed_url = match validate_target_url(&options.url, allow_local) { ... };

// src-tauri/src/net_dispatcher.rs:463-468
let follow = options.follow_redirects.unwrap_or(true);
let redirect_policy = if follow {
    reqwest::redirect::Policy::limited(10)
} else {
    reqwest::redirect::Policy::none()
};
```

#### Threat Model & Attack Scenario:
1. In `net_dispatcher.rs`, `options.allow_local.unwrap_or(true)` means private IPs (`127.0.0.1`, `localhost`, `192.168.x.x`, `10.x.x.x`) are allowed by default unless the caller explicitly opts out.
2. Even if `allow_local: false` is supplied, `reqwest` is configured with `reqwest::redirect::Policy::limited(10)`. If the target server responds with an HTTP 302 redirect pointing to `http://169.254.169.254/latest/meta-data/` or `http://127.0.0.1:8080/admin`, `reqwest` follows the redirect transparently without invoking `validate_target_url` on the redirect target!
3. This allows full SSRF into cloud instance metadata endpoints (AWS, GCP, Azure) and local microservices via open redirectors.

#### Concrete Remediation:
1. Change `allow_local` default to `false` (`options.allow_local.unwrap_or(false)`).
2. Configure a custom redirect policy with `reqwest::redirect::Policy::custom` that executes `validate_target_url` on every redirect step:

```rust
// Proposed fix in src-tauri/src/net_dispatcher.rs:
let redirect_policy = if follow {
    reqwest::redirect::Policy::custom(move |attempt| {
        if attempt.previous().len() >= 10 {
            attempt.error("Too many redirects")
        } else {
            let next_url = attempt.url().as_str();
            match validate_target_url(next_url, allow_local) {
                Ok(_) => attempt.follow(),
                Err(err) => attempt.error(format!("SSRF Guard blocked redirect: {}", err)),
            }
        }
    })
} else {
    reqwest::redirect::Policy::none()
};
```

---

```
====================================================================================================
FINDING ID: SEC-05
TITLE:      Complete Absence of SSRF Guard in `bypasser` Module
SEVERITY:   HIGH (CVSS: 7.5 - AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N)
CATEGORY:   Security Vulnerability / SSRF
FILE:       src-tauri/src/bypasser.rs (Lines 517–591, 593–624)
====================================================================================================
```
#### Vulnerable Code:
```rust
// src-tauri/src/bypasser.rs:521-526
let client = reqwest::Client::builder()
    .cookie_store(true)
    .redirect(reqwest::redirect::Policy::none())
    .timeout(std::time::Duration::from_secs(12))
    .build()
    .map_err(|e| e.to_string())?;
// Directly fetches start_url and follows Location headers without checking IP/host
```

#### Threat Model & Attack Scenario:
`bypasser::bypass_link` and `decrypter_clean` accept arbitrary URLs from the frontend and execute HTTP requests without ANY SSRF validation. Unlike `net_dispatcher.rs`, `bypasser.rs` never checks if the target is `169.254.169.254`, `127.0.0.1`, or an internal RFC 1918 service. An attacker can use `bypass_link` or `decrypter_clean` as an unconstrained internal network proxy.

#### Concrete Remediation:
Call `crate::net_dispatcher::validate_target_url(url, false)` at the entry point of `bypass_link`, `decrypter_clean`, and inside `resolve_redirects`.

---

```
====================================================================================================
FINDING ID: SEC-06
TITLE:      Hardcoded Default Symmetric Secret & Lack of HWID Lock in Legacy License System
SEVERITY:   HIGH (CVSS: 7.5 - AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N)
CATEGORY:   Licensing / Monetization Security
FILE:       src-tauri/src/license.rs (Lines 35, 183–187, 256–268, 400–403)
====================================================================================================
```
#### Vulnerable Code:
```rust
// src-tauri/src/license.rs:35, 185-187
pub const DEFAULT_LICENSE_SECRET: &str = "NEXUS_DEV_SECRET_DO_NOT_USE_IN_PROD";

pub fn get_hmac_secret() -> String {
    std::env::var("NEXUS_LICENSE_SECRET")
        .unwrap_or_else(|_| DEFAULT_LICENSE_SECRET.to_string())
}
```

#### Threat Model & Monetization Impact:
1. In desktop binary distributions, `NEXUS_LICENSE_SECRET` is not set by end users. As a result, the default fallback `"NEXUS_DEV_SECRET_DO_NOT_USE_IN_PROD"` is active on production installs.
2. `validate_hmac_license_key` allows symmetric HMAC keys formatted as `NEXUS-L000...` (Lifetime Pro/Team). These legacy keys have `hwid: None`, which completely bypasses hardware ID device-locking.
3. Anyone reading this open-source / reverse-engineered string can compute HMAC-SHA256 signatures and generate unlimited lifetime licenses that validate on every ZenDev installation.

#### Concrete Remediation:
1. Deprecate symmetric HMAC validation in production releases.
2. Require NIST P-256 ECDSA asymmetric licensing (`validate_ecdsa_license_key`) with mandatory HWID device-locking.

---

```
====================================================================================================
FINDING ID: SEC-07
TITLE:      Trivially Recoverable AES Key in `safe_storage` Fallback
SEVERITY:   MEDIUM (CVSS: 5.5 - AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N)
CATEGORY:   Cryptographic Design
FILE:       src-tauri/src/safe_storage.rs (Lines 80–87)
====================================================================================================
```
#### Vulnerable Code:
```rust
// src-tauri/src/safe_storage.rs:81-87
fn derive_aes_key() -> [u8; 32] {
    let device_id = get_device_id();
    let mut hasher = Sha256::new();
    hasher.update(b"nexus-safestorage-salt-2025");
    hasher.update(device_id.as_bytes());
    hasher.finalize().into()
}
```

#### Threat Model & Attack Scenario:
When Windows DPAPI is unavailable or on macOS/Linux, `safe_storage` encrypts `nexus_secrets.enc` using AES-256-GCM. However, the key derivation function consists only of `Sha256(b"nexus-safestorage-salt-2025" + device_id)`. The `device_id` is computed from publicly readable machine identifiers (`MachineGuid` or `ioreg`). Any local user or background process can derive the exact same AES key and decrypt the secrets file without needing administrator privileges or user credentials.

#### Concrete Remediation:
Use platform-native secure credential storage (Windows DPAPI, macOS Keychain via `security-framework`, Linux Secret Service). If falling back to password-based encryption, require a user-supplied master passphrase with Argon2id / PBKDF2 (100,000+ iterations).

---

```
====================================================================================================
FINDING ID: EDR-01
TITLE:      AV/EDR Heuristic Triggers: Hidden Shell & Subprocess Execution with `CREATE_NO_WINDOW`
SEVERITY:   HIGH (CVSS: 7.1 - AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N)
CATEGORY:   AV / EDR Malware Heuristics
FILE:       src-tauri/src/process_ext.rs, src-tauri/src/lib.rs:77, src-tauri/src/hwid.rs:119
====================================================================================================
```
#### Vulnerable Code:
```rust
// src-tauri/src/process_ext.rs:28-30, 56-77
pub const CREATE_NO_WINDOW: u32 = 0x0800_0000;
// Injects CREATE_NO_WINDOW into all Command invocations
```
```rust
// src-tauri/src/lib.rs:77-80
silent_command("cmd")
    .args(["/C", "start", "", &url])
    .spawn()
```
```rust
// src-tauri/src/hwid.rs:119-122
let output = silent_command("REG.exe")
    .args(["QUERY", r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography", "/v", "MachineGuid"])
    .output()?;
```

#### EDR Behavioral Impact:
1. **Hidden Process Execution:** Spawning `cmd.exe` or `REG.exe` with `CREATE_NO_WINDOW` (0x08000000) matches standard heuristics monitored by Microsoft Defender (Behavior:Win32/CmdLineAbuse), CrowdStrike Falcon, and SentinelOne. Malware authors frequently use `CREATE_NO_WINDOW` to hide malicious command-line activity.
2. **Redundant Process Spawning:** ZenDev already links `winreg = "0.52"`. Running `REG.exe QUERY` as a subprocess when `winreg` fails is redundant and creates a noisy process tree (`ZenDev.exe` -> `REG.exe`).
3. **Unnecessary Command Shell:** Invoking `cmd.exe /C start` to launch a browser URL or execute an update binary located in `%TEMP%` (`ZenDev-Setup-x.x.x.exe`) triggers "Executable launched from Temp via command interpreter" EDR alarms.

#### Concrete Remediation:
1. Replace `cmd.exe /C start` with `ShellExecuteW`.
2. Remove `REG.exe` invocation in `hwid.rs` entirely; rely exclusively on `winreg`.
3. Reserve `process_ext.rs` solely for developer-initiated CLI utilities (like `ping.exe`), eliminating hidden shell interpreters.

---

```
====================================================================================================
FINDING ID: EDR-02
TITLE:      Silent NSIS Flag (`/S`) in `tauri.conf.json` Violating SaaS Directive Principle 2
SEVERITY:   HIGH (CVSS: 7.0 - AV:L/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N)
CATEGORY:   SaaS Directive Violation / EDR Threat
FILE:       src-tauri/tauri.conf.json (Lines 44–51), src-tauri/src/updater.rs (Lines 281–289)
====================================================================================================
```
#### Vulnerable Configuration:
```json
// src-tauri/tauri.conf.json:43-52
  "plugins": {
    "updater": {
      "windows": {
        "installMode": "passive",
        "installerArgs": [
          "/S"
        ]
      }
    }
  }
```

#### SaaS Directive Violation & EDR Risk:
- **ZenDev SaaS Dönüşüm Direktifi Principle 2** explicitly dictates:
  *"Sessiz Otonom Güncelleyici (Şeffaf / Onaylı Akışa Taşınacak): Arka planda kullanıcının haberi olmadan çalışan, CREATE_NO_WINDOW ile gizlenen otonom NSIS güncelleme davranışı KESİNLİKLE TERK EDİLMELİDİR. Gerekçe: Güvenlik ve EDR yazılımları tarafından şüpheli/malware davranışı olarak işaretlenme riski taşır."*
- `tauri.conf.json` still configures `"installerArgs": [ "/S" ]`. Executing NSIS installers silently in the background without explicit user confirmation triggers AV heuristics (TrojanDownloader:Win32/DropExec).
- In `updater.rs`, `_legacy_silent_install_reference` contains code attempting `cmd /C start "" installer.exe /S`.
- Although `updater_install_now` was changed to call `open_external`, `tauri.conf.json` remains misconfigured.

#### Concrete Remediation:
Remove `/S` from `tauri.conf.json`. Use interactive installer mode with standard UAC prompt, and verify that the download checksum matches the GitHub release manifest before execution.

```json
// Proposed fix in src-tauri/tauri.conf.json:
  "plugins": {
    "updater": {
      "windows": {
        "installMode": "passive",
        "installerArgs": []
      }
    }
  }
```

---

```
====================================================================================================
FINDING ID: REL-01
TITLE:      Panic Vulnerability via Unhandled `.unwrap()` on `JoinSet` Failures in `bypasser`
SEVERITY:   MEDIUM (CVSS: 5.3 - AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L)
CATEGORY:   Reliability / Panic Vulnerability
FILE:       src-tauri/src/bypasser.rs (Lines 917–923)
====================================================================================================
```
#### Vulnerable Code:
```rust
// src-tauri/src/bypasser.rs:917-923
    while let Some(res) = join_set.join_next().await {
        if let Ok((idx, dec_res)) = res {
            results[idx] = Some(dec_res);
        }
    }

    results.into_iter().map(|r| r.unwrap()).collect()
```

#### Failure Scenario:
If any task spawned inside `join_set` panics or is cancelled, `res` returns `Err(JoinError)`. The `if let Ok((idx, dec_res)) = res` check fails to match, leaving `results[idx]` as `None`.
Immediately following the loop, `results.into_iter().map(|r| r.unwrap()).collect()` executes `r.unwrap()` on `None`, causing a panic that crashes the Tokio worker thread and terminates the entire ZenDev desktop application.

#### Concrete Remediation:
```rust
// Proposed fix in src-tauri/src/bypasser.rs:
    while let Some(res) = join_set.join_next().await {
        match res {
            Ok((idx, dec_res)) => {
                results[idx] = Some(dec_res);
            }
            Err(join_err) => {
                // Prevent unwrap panic by populating with error
                eprintln!("Batch task failed to join: {}", join_err);
            }
        }
    }

    results
        .into_iter()
        .enumerate()
        .map(|(i, r)| {
            r.unwrap_or_else(|| DecryptResult {
                success: false,
                original_url: None,
                final_url: None,
                clean_url: None,
                trackers_removed: None,
                removed_list: None,
                error: Some(format!("Task execution failed at index {}", i)),
            })
        })
        .collect()
```

---

```
====================================================================================================
FINDING ID: PERF-01
TITLE:      Denial of Service via Unbounded File Reads in `crypto.rs`, `image.rs`, `pdf.rs`
SEVERITY:   MEDIUM (CVSS: 5.3 - AV:L/AC:L/PR:N/UI:R/S:U/C:N/I:N/A:L)
CATEGORY:   Resource Allocation / OOM
FILE:       src-tauri/src/crypto.rs (Lines 281, 391), src-tauri/src/image.rs (Line 424)
====================================================================================================
```
#### Vulnerable Code:
```rust
// src-tauri/src/crypto.rs:281
let plaintext = match std::fs::read(file_path) {
    Ok(data) => data,
    Err(e) => return Ok(VaultOpResult::err(format!("Dosya okunamadı: {}", e))),
};
// Then in-place duplicates: let mut ciphertext_buffer = plaintext;
```

#### Vulnerability & Performance Impact:
Loading entire files into memory using `std::fs::read` without chunking or size gating creates Out-Of-Memory (OOM) abort conditions when users attempt to encrypt or process large files (e.g. 2GB+ disk images, databases, videos). For encryption, the memory footprint is doubled (`plaintext` + `ciphertext_buffer` + staging buffer).
Similarly, in `image.rs`, decompressing a 30,000x30,000 pixel image decompresses into gigabytes of raw uncompressed RGBA pixels, crashing the process.

#### Concrete Remediation:
1. Enforce a maximum file size limit (e.g. 500 MB) for single-pass in-memory processing.
2. For larger files in `crypto.rs`, implement chunked streaming encryption using an authenticated streaming AEAD scheme.

---

```
====================================================================================================
FINDING ID: PERF-02
TITLE:      Blocking Sleep & Excessive Sysinfo Inspection in `sentinel_get_stats`
SEVERITY:   LOW (CVSS: 3.3 - AV:L/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L)
CATEGORY:   Performance & Concurrency
FILE:       src-tauri/src/sentinel.rs (Lines 74–78)
====================================================================================================
```
#### Vulnerable Code:
```rust
// src-tauri/src/sentinel.rs:74-78
pub fn get_system_metrics() -> SentinelStatsResult {
    let mut sys = System::new_all();
    sys.refresh_all();
    std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    sys.refresh_cpu_all();
```

#### Impact:
1. Allocating `System::new_all()` and calling `sys.refresh_all()` queries all OS processes, disk partitions, and network sockets from the kernel on every call.
2. `std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL)` halts the executing thread for 200 milliseconds. When polled repeatedly by the frontend, this degrades responsiveness and exhausts the `tokio::task::spawn_blocking` worker pool.

#### Concrete Remediation:
Maintain a singleton `Arc<Mutex<System>>` and refresh only CPU and memory (`refresh_cpu_usage`, `refresh_memory`) on a periodic background timer rather than performing blocking full scans per IPC request.

---

```
====================================================================================================
FINDING ID: SAAS-01
TITLE:      SaaS Directive Architectural Deviations: Link Bypasser & Memory Flusher Retained
SEVERITY:   MEDIUM (CVSS: 4.0)
CATEGORY:   SaaS Directive Compliance (Principle 1 & 2)
FILE:       src-tauri/src/sentinel.rs, src-tauri/src/bypasser.rs
====================================================================================================
```
#### Directive Conflict:
1. **Memory Working Set Flush (`sentinel_optimize_memory`):** Calls Win32 `SetProcessWorkingSetSize(handle, usize::MAX, usize::MAX)`. This is a classic OS memory optimization trick that conflicts directly with SaaS Principle 2 ("System Optimizer ... OS araçları ticari bir geliştirici SaaS ürününde yer alamaz").
2. **Universal Link Bypasser (`bypasser.rs`):** Contains 1,072 lines of code designed to bypass ad shorteners (`aylink`, `trlink`, `cpmlink`) and scrape third-party websites by spoofing mouse movements (`signal` JSON). This introduces legal, anti-scraping, and brand reputation risks that contradict ZenDev's positioning as an enterprise B2B Developer SaaS for API engineers.

#### Concrete Remediation:
1. Remove `sentinel_optimize_memory` from `sentinel.rs` and `lib.rs`.
2. Decouple `bypasser.rs` or restrict it exclusively to local tracking parameter stripping (`strip_tracking_parameters`), removing automated ad-bypass scraping flows.

---

## 2. Logic Chain

The audit conclusions are derived through a verifiable chain of evidence connecting direct code observations to security and architectural impacts:

```
[Observation: lib.rs:77 uses silent_command("cmd").args(["/C", "start", "", &url])]
   │
   ├──> [Fact: cmd.exe parses '&', '|', '%', '^' as command separators]
   ├──> [Fact: open_external is exposed via Tauri IPC to the webview]
   │
   └──> [Conclusion: SEC-01 Critical Command Injection / RCE vulnerability exists]

[Observation: crypto.rs:503 deletes any file passed to shred_file]
   │
   ├──> [Fact: is_system_protected_path only checks Windows env vars, fails on Linux/macOS]
   ├──> [Fact: No canonicalization or workspace boundary checks exist for user files]
   │
   └──> [Conclusion: SEC-02 Arbitrary file destruction / data wipe vulnerability exists]

[Observation: organizer.rs:264 moves any old_path to new_path]
   │
   ├──> [Fact: No directory boundary verification is performed on old_path/new_path]
   │
   └──> [Conclusion: SEC-03 Arbitrary file relocation vulnerability exists]

[Observation: net_dispatcher.rs:466 configures reqwest with Policy::limited(10)]
   │
   ├──> [Fact: reqwest follows redirects without re-checking SSRF filter]
   ├──> [Fact: allow_local defaults to true]
   │
   └──> [Conclusion: SEC-04 SSRF bypass via 302 redirect & internal access exists]

[Observation: tauri.conf.json:48 contains "installerArgs": ["/S"]]
   │
   ├──> [Fact: SaaS Directive Principle 2 strictly bans silent /S updater execution]
   ├──> [Fact: Hidden installers launched from Temp trigger EDR heuristic detections]
   │
   └──> [Conclusion: EDR-02 SaaS directive non-compliance & malware heuristic risk exists]
```

---

## 3. Caveats

1. **Static Analysis Scope:** The audit was conducted via exhaustive static code analysis of Rust files, configuration files, and IPC definitions. Dynamic runtime debugging with a live debugger was not executed as Cargo is not currently in the system PATH on this workstation.
2. **Frontend Callers:** This report focuses strictly on the Rust backend (`src-tauri/`). Frontend validation in React was audited where it bridges to Tauri IPC (`tauriBridge.ts`), but full frontend UI component testing is handled by dedicated frontend auditors.
3. **Crate Vulnerabilities:** `Cargo.lock` dependencies were surveyed, but an automated `cargo audit` advisory database check was not run due to cargo binary absence in PATH.

---

## 4. Conclusion

ZenDev's Tauri v2 Rust backend migration represents a major leap in execution speed, native resource efficiency, and type safety compared to Electron. The implementations of cryptographic algorithms in `crypto.rs` (PBKDF2 + AES-GCM) and `journal.rs` (canonical JSON hash chaining) demonstrate solid cryptographic foundations.

However, the backend harbors **three Critical / High security vulnerabilities** that require immediate remediation before commercial B2B release:
1. **SEC-01 (Command Injection):** `open_external` passes unvalidated strings to `cmd.exe /C start`, enabling trivial RCE.
2. **SEC-02 & SEC-03 (Path Boundary Violations):** `fortress_shred_file` and `organizer_execute` allow destructive file operations outside authorized workspaces.
3. **SEC-04 & SEC-05 (SSRF):** Redirect following bypasses SSRF protections in `net_dispatcher`, and `bypasser` lacks SSRF controls entirely.
4. **EDR-01 & EDR-02 (AV/EDR Heuristics):** Retaining `/S` in `tauri.conf.json` and spawning hidden command shells triggers enterprise antivirus flags and directly violates SaaS Directive Principle 2.

Addressing these findings will transform ZenDev into a hardened, enterprise-ready desktop platform compliant with modern security standards.

---

## 5. Verification Method

To independently verify these findings on a workstation with Rust / Cargo installed:

1. **Verify SEC-01 (Command Injection):**
   Inspect `src-tauri/src/lib.rs` line 77. Notice `silent_command("cmd").args(["/C", "start", "", &url])`. In PowerShell:
   `cmd.exe /C start "" "https://google.com" & calc.exe`
   Observe `calc.exe` launching immediately.
2. **Verify EDR-02 (Silent Updater Flag):**
   Inspect `src-tauri/tauri.conf.json` lines 44–51:
   ```json
   "plugins": { "updater": { "windows": { "installerArgs": ["/S"] } } }
   ```
   Compare against SaaS Directive Principle 2 (`.agents/rules/zendev-saas-directive.md`).
3. **Verify REL-01 (Panic on JoinSet failure):**
   Inspect `src-tauri/src/bypasser.rs` line 923. Observe that if any task in `join_set` returns `Err`, `results[idx]` remains `None`, causing `r.unwrap()` on line 923 to panic.
4. **Verify Compiler Integrity (when Cargo is available):**
   Run:
   ```bash
   cd src-tauri
   cargo check
   cargo test
   ```
