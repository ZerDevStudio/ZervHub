# Independent Victory Audit Verification Script
$ErrorActionPreference = "Continue"

Write-Host "=== INDEPENDENT FORENSIC & CITATION VERIFICATION ===" -ForegroundColor Cyan
$Results = @()

function Check-Finding {
    param(
        [string]$Id,
        [string]$File,
        [int]$StartLine,
        [int]$EndLine,
        [string]$Pattern,
        [string]$Description
    )
    
    if (-not (Test-Path $File)) {
        $Results += [PSCustomObject]@{ Id = $Id; Status = "FAIL"; Reason = "File not found: $File" }
        Write-Host "[-] ${Id}: File not found: $File" -ForegroundColor Red
        return
    }

    $lines = Get-Content $File
    $maxLine = $lines.Count
    $checkStart = [Math]::Max(1, $StartLine - 5)
    $checkEnd = [Math]::Min($maxLine, $EndLine + 5)
    
    $chunk = ($lines[($checkStart - 1)..($checkEnd - 1)]) -join "`n"
    if ($chunk -match $Pattern) {
        $Results += [PSCustomObject]@{ Id = $Id; Status = "PASS"; Reason = "Verified in $File at lines $StartLine-$EndLine" }
        Write-Host "[+] ${Id}: PASS - Verified in $File" -ForegroundColor Green
    } else {
        # Check whole file just in case lines shifted slightly
        if (($lines -join "`n") -match $Pattern) {
            $Results += [PSCustomObject]@{ Id = $Id; Status = "LINE_SHIFT"; Reason = "Pattern found in $File, but shifted from $StartLine-$EndLine" }
            Write-Host "[~] ${Id}: LINE_SHIFT in $File" -ForegroundColor Yellow
        } else {
            $Results += [PSCustomObject]@{ Id = $Id; Status = "FAIL"; Reason = "Pattern '$Pattern' NOT found in $File" }
            Write-Host "[-] ${Id}: FAIL - Pattern not found in $File" -ForegroundColor Red
        }
    }
}

# 1. SEC-01: lib.rs open_external cmd.exe /C start
Check-Finding "SEC-01" "src-tauri/src/lib.rs" 74 97 'silent_command\("cmd"\)[\s\S]*?"/C",\s*"start"' "Command Injection / RCE via cmd.exe"

# 2. SEC-02: crypto.rs is_system_protected_path & shred
Check-Finding "SEC-02" "src-tauri/src/crypto.rs" 140 218 'is_system_protected_path' "Shredder path protection"

# 3. SEC-03: organizer.rs organizer_execute arbitrary move
Check-Finding "SEC-03" "src-tauri/src/organizer.rs" 264 315 'pub async fn organizer_execute' "Arbitrary file relocation"

# 4. SEC-04: net_dispatcher.rs allow_local & redirect policy
Check-Finding "SEC-04" "src-tauri/src/net_dispatcher.rs" 428 470 'options\.allow_local\.unwrap_or\(true\)' "SSRF allow_local defaults true"

# 5. SEC-05: bypasser.rs bypass_link lack of SSRF guard
Check-Finding "SEC-05" "src-tauri/src/bypasser.rs" 517 591 'pub async fn bypass_link' "Bypasser outbound HTTP without SSRF check"

# 6. SEC-06: license.rs DEFAULT_LICENSE_SECRET
Check-Finding "SEC-06" "src-tauri/src/license.rs" 35 190 'DEFAULT_LICENSE_SECRET\s*:\s*&str\s*=\s*"NEXUS_DEV_SECRET_DO_NOT_USE_IN_PROD"' "Hardcoded HMAC secret"

# 7. SEC-07: safe_storage.rs derive_aes_key salt
Check-Finding "SEC-07" "src-tauri/src/safe_storage.rs" 80 88 'nexus-safestorage-salt-2025' "Static AES derivation salt"

# 8. EDR-01: process_ext.rs CREATE_NO_WINDOW
Check-Finding "EDR-01" "src-tauri/src/process_ext.rs" 25 35 '0x08000000' "CREATE_NO_WINDOW constant"

# 9. EDR-02: tauri.conf.json installerArgs ["/S"]
Check-Finding "EDR-02" "src-tauri/tauri.conf.json" 43 55 '"installerArgs":\s*\[\s*"/S"\s*\]' "Silent updater switch /S"

# 10. REL-01: bypasser.rs join_set unwrap panic
Check-Finding "REL-01" "src-tauri/src/bypasser.rs" 917 925 'results\.into_iter\(\)\.map\(\|r\|\s*r\.unwrap\(\)\)' "JoinSet unwrap panic"

# 11. PERF-01: crypto.rs fs::read unbounded
Check-Finding "PERF-01" "src-tauri/src/crypto.rs" 275 285 'std::fs::read\(file_path\)' "Unbounded file read"

# 12. PERF-02: sentinel.rs sleep
Check-Finding "PERF-02" "src-tauri/src/sentinel.rs" 70 80 'std::thread::sleep\(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL\)' "Blocking thread sleep in IPC"

# 13. CODE-01: HashStudio.tsx useMemo setTextHashes
Check-Finding "CODE-01" "src/renderer/src/pages/HashStudio.tsx" 215 240 'useMemo\(\(\)\s*=>[\s\S]*?setTextHashes' "Asynchronous state mutation inside useMemo"

# 14. CODE-02: SqliteViewer.tsx createObjectURL
Check-Finding "CODE-02" "src/renderer/src/components/SqliteViewer.tsx" 290 305 'URL\.createObjectURL' "Unrevoked Object URL"

# 15. CODE-03: CyberFortress.tsx getElementById
Check-Finding "CODE-03" "src/renderer/src/pages/CyberFortress.tsx" 490 580 'document\.getElementById\(''stego-encode-input''\)' "Direct DOM getElementById"

# 16. ARCH-01: DevSandbox.tsx and CurlRunner.tsx redirection in App.tsx
Check-Finding "ARCH-01a" "src/renderer/src/App.tsx" 360 375 'path="/curl-runner"\s+element=\{<Navigate to="/api-studio"' "CurlRunner redirect"
Check-Finding "ARCH-01b" "src/renderer/src/App.tsx" 380 390 'path="/dev-sandbox"\s+element=\{<Navigate to="/api-studio"' "DevSandbox redirect"

# 17. ARCH-02: package.json cheerio, validator, axios
Check-Finding "ARCH-02a" "package.json" 1 60 '"cheerio"' "Ghost dep cheerio"
Check-Finding "ARCH-02b" "package.json" 1 60 '"validator"' "Ghost dep validator"
Check-Finding "ARCH-02c" "package.json" 1 60 '"axios"' "Ghost dep axios"

# 18. ARCH-03: package.json sql.js in devDependencies, dompurify in dependencies
Check-Finding "ARCH-03a" "package.json" 30 80 '"devDependencies":[\s\S]*?"sql\.js"' "sql.js in devDependencies"
Check-Finding "ARCH-03b" "package.json" 15 50 '"dependencies":[\s\S]*?"dompurify"' "dompurify in dependencies"

# 19. ARCH-05: Sidebar.tsx Electron branding
Check-Finding "ARCH-05" "src/renderer/src/components/Sidebar.tsx" 600 610 'Electron \+ React \+ TypeScript' "Electron branding in Sidebar"

# 20. I18N-01: Dashboard.tsx missing keys
Check-Finding "I18N-01a" "src/renderer/src/pages/Dashboard.tsx" 210 216 'dashboard\.tools\.colorStudio\.desc' "Missing key colorStudio.desc"
Check-Finding "I18N-01b" "src/renderer/src/pages/Dashboard.tsx" 220 226 'dashboard\.tools\.scratchpad\.desc' "Missing key scratchpad.desc"

# 21. I18N-02: tr.json placeholder mismatch
Check-Finding "I18N-02" "src/renderer/src/locales/tr.json" 795 805 'URL veya \{\{değişken\}\} girin' "Placeholder mismatch in tr.json"

# 22. I18N-03: duplicate hexdump/hexDump in en.json
Check-Finding "I18N-03" "src/renderer/src/locales/en.json" 890 900 '"hexdump":' "Hexdump duplicate in en.json"

# 23. DEP-01: landingPageHtml.ts lingering purged modules
Check-Finding "DEP-01a" "server/src/landingPageHtml.ts" 950 960 'System Optimizer' "System Optimizer card"
Check-Finding "DEP-01b" "server/src/landingPageHtml.ts" 960 972 'Burner Mail' "Burner Mail card"
Check-Finding "DEP-01c" "server/src/landingPageHtml.ts" 980 992 'Paste / Cloud Clipboard' "Cloud Clipboard card"
Check-Finding "DEP-01d" "server/src/landingPageHtml.ts" 1555 1575 'openToolDrawer\(''portkiller''' "Disguised portkiller onclick"
Check-Finding "DEP-01e" "server/src/landingPageHtml.ts" 1570 1585 'Sistem & Bloatware Temizleyici' "Sistem Bloatware drawer"

# 24. DEP-02: Dashboard.tsx pinned port-killer
Check-Finding "DEP-02" "src/renderer/src/pages/Dashboard.tsx" 48 55 '''port-killer''' "port-killer in default pinned tools"

# 25. DEP-03: FloatingOrb.tsx optimizeMemory
Check-Finding "DEP-03" "src/renderer/src/components/FloatingOrb.tsx" 80 185 'sentinel\.optimizeMemory' "FloatingOrb optimizeMemory call"

# 26. DEP-04: tests/nsisSilentUpdate.test.ts silent assertion
Check-Finding "DEP-04" "tests/nsisSilentUpdate.test.ts" 45 80 'installerArgs.*\/S' "nsisSilentUpdate tests assert /S"

Write-Host "`n=== SUMMARY TABLE ===" -ForegroundColor Cyan
$Results | Format-Table -AutoSize
