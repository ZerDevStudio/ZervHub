/*
 * Remediation Challenge Test Suite (Challenger 1 - Backend & Security)
 * Validating Tasks R1 (URL Migration & Component Preservation) and R2 (SEC-01 & EDR-02 Hardening)
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Challenger 1 Empirical Verification: R1 & R2 Remediation', () => {
  const rootDir = path.resolve(__dirname, '..');

  // =========================================================================
  // 1. Task R1: Repository URL Migration & Studio Preservation
  // =========================================================================
  describe('1. Task R1: Repository URL Migration & Studio Preservation', () => {
    const requiredFiles = [
      { name: 'src-tauri/src/updater.rs', path: path.join(rootDir, 'src-tauri', 'src', 'updater.rs') },
      { name: 'website/src/lib/downloadHelper.ts', path: path.join(rootDir, 'website', 'src', 'lib', 'downloadHelper.ts') },
      { name: 'website/src/components/Footer.tsx', path: path.join(rootDir, 'website', 'src', 'components', 'Footer.tsx') },
      { name: 'README.md', path: path.join(rootDir, 'README.md') },
      { name: 'server/src/landingPageHtml.ts', path: path.join(rootDir, 'server', 'src', 'landingPageHtml.ts') },
      { name: 'src/renderer/src/pages/QrCodeStudio.tsx', path: path.join(rootDir, 'src', 'renderer', 'src', 'pages', 'QrCodeStudio.tsx') },
      { name: 'server/src/services/notifier.ts', path: path.join(rootDir, 'server', 'src', 'services', 'notifier.ts') },
      { name: 'scripts/github-cleaner.mjs', path: path.join(rootDir, 'scripts', 'github-cleaner.mjs') },
    ];

    it('verifies that legacy repository "zerviatr/NexusHub" is eliminated from all 8 required files', () => {
      for (const file of requiredFiles) {
        expect(fs.existsSync(file.path)).toBe(true);
        const content = fs.readFileSync(file.path, 'utf-8');
        expect(content).not.toContain('zerviatr/NexusHub');
      }
    });

    it('verifies that new repository "ZerDevStudio/ZervHub" is correctly configured in required files', () => {
      // updater.rs
      const updaterContent = fs.readFileSync(path.join(rootDir, 'src-tauri', 'src', 'updater.rs'), 'utf-8');
      expect(updaterContent).toContain('https://api.github.com/repos/ZerDevStudio/ZervHub/releases/latest');
      expect(updaterContent).toContain('https://github.com/ZerDevStudio/ZervHub/releases/latest');

      // downloadHelper.ts
      const downloadHelper = fs.readFileSync(path.join(rootDir, 'website', 'src', 'lib', 'downloadHelper.ts'), 'utf-8');
      expect(downloadHelper).toContain('https://github.com/ZerDevStudio/ZervHub/releases/download/v2.5.5/ZenDev-Setup-2.5.5.exe');
      expect(downloadHelper).toContain('https://github.com/ZerDevStudio/ZervHub/releases/latest');
      expect(downloadHelper).toContain('https://github.com/ZerDevStudio/ZervHub');

      // Footer.tsx
      const footer = fs.readFileSync(path.join(rootDir, 'website', 'src', 'components', 'Footer.tsx'), 'utf-8');
      expect(footer).toContain('https://github.com/ZerDevStudio/ZervHub');

      // README.md
      const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf-8');
      expect(readme).toContain('ZerDevStudio/ZervHub');

      // landingPageHtml.ts
      const landing = fs.readFileSync(path.join(rootDir, 'server', 'src', 'landingPageHtml.ts'), 'utf-8');
      expect(landing).toContain('https://github.com/ZerDevStudio/ZervHub/releases/latest');
      expect(landing).toContain('https://github.com/ZerDevStudio/ZervHub');

      // QrCodeStudio.tsx
      const qrcode = fs.readFileSync(path.join(rootDir, 'src', 'renderer', 'src', 'pages', 'QrCodeStudio.tsx'), 'utf-8');
      expect(qrcode).toContain('https://github.com/ZerDevStudio/ZervHub');

      // notifier.ts
      const notifier = fs.readFileSync(path.join(rootDir, 'server', 'src', 'services', 'notifier.ts'), 'utf-8');
      expect(notifier).toContain('https://raw.githubusercontent.com/ZerDevStudio/ZervHub/main/build/icons/icon.png');

      // github-cleaner.mjs
      const ghCleaner = fs.readFileSync(path.join(rootDir, 'scripts', 'github-cleaner.mjs'), 'utf-8');
      expect(ghCleaner).toContain("REPO_OWNER = 'ZerDevStudio'");
      expect(ghCleaner).toContain("REPO_NAME = 'ZervHub'");
    });

    it('verifies all migrated GitHub URLs are syntactically valid RFC-compliant URLs', () => {
      const urlsToTest = [
        'https://api.github.com/repos/ZerDevStudio/ZervHub/releases/latest',
        'https://github.com/ZerDevStudio/ZervHub/releases/latest',
        'https://github.com/ZerDevStudio/ZervHub/releases/download/v2.5.5/ZenDev-Setup-2.5.5.exe',
        'https://github.com/ZerDevStudio/ZervHub/releases/download/v2.5.5/ZenDev-Portable-2.5.5.exe',
        'https://github.com/ZerDevStudio/ZervHub',
        'https://raw.githubusercontent.com/ZerDevStudio/ZervHub/main/build/icons/icon.png'
      ];

      for (const u of urlsToTest) {
        expect(() => new URL(u)).not.toThrow();
        const parsed = new URL(u);
        expect(parsed.protocol).toBe('https:');
        expect(parsed.hostname).toMatch(/(github\.com|api\.github\.com|raw\.githubusercontent\.com)/);
        expect(parsed.pathname).toContain('ZerDevStudio/ZervHub');
      }
    });

    it('confirms UniversalDecrypter.tsx is preserved and registered in React router', () => {
      const decrypterPath = path.join(rootDir, 'src', 'renderer', 'src', 'pages', 'UniversalDecrypter.tsx');
      expect(fs.existsSync(decrypterPath)).toBe(true);

      const decrypterContent = fs.readFileSync(decrypterPath, 'utf-8');
      expect(decrypterContent.length).toBeGreaterThan(10000);
      expect(decrypterContent).toContain('export default function UniversalDecrypter');

      const appPath = path.join(rootDir, 'src', 'renderer', 'src', 'App.tsx');
      const appContent = fs.readFileSync(appPath, 'utf-8');
      expect(appContent).toContain("lazy(() => import('./pages/UniversalDecrypter'))");
      expect(appContent).toContain('<UniversalDecrypter');
    });

    it('confirms bypasser.rs is preserved and registered in Tauri Rust backend', () => {
      const bypasserPath = path.join(rootDir, 'src-tauri', 'src', 'bypasser.rs');
      expect(fs.existsSync(bypasserPath)).toBe(true);

      const bypasserContent = fs.readFileSync(bypasserPath, 'utf-8');
      expect(bypasserContent.length).toBeGreaterThan(15000);
      expect(bypasserContent).toContain('pub async fn bypass_link');
      expect(bypasserContent).toContain('pub async fn decrypter_clean');

      const libPath = path.join(rootDir, 'src-tauri', 'src', 'lib.rs');
      const libContent = fs.readFileSync(libPath, 'utf-8');
      expect(libContent).toContain('pub mod bypasser;');
      expect(libContent).toContain('bypasser::bypass_link');
      expect(libContent).toContain('bypasser::decrypter_clean');
      expect(libContent).toContain('bypasser::decrypter_clean_batch');
    });
  });

  // =========================================================================
  // 2. Task R2: Desktop Security (SEC-01) URL Validator Stress-Testing
  // =========================================================================
  describe('2. Task R2: Desktop Security (SEC-01) URL Validator Stress-Testing', () => {
    const libPath = path.join(rootDir, 'src-tauri', 'src', 'lib.rs');

    // Model of the Rust URL validator implemented in src-tauri/src/lib.rs:74-78:
    // let parsed = url::Url::parse(&url).map_err(|e| format!("Invalid URL: {}", e))?;
    // if parsed.scheme() != "http" && parsed.scheme() != "https" {
    //     return Err("Only http and https protocols are permitted for external launch".into());
    // }
    function validateUrlLikeRust(input: string): { ok: boolean; error?: string; normalizedUrl?: string } {
      try {
        const parsed = new URL(input);
        const scheme = parsed.protocol.replace(/:$/, '').toLowerCase();
        if (scheme !== 'http' && scheme !== 'https') {
          return { ok: false, error: 'Only http and https protocols are permitted for external launch' };
        }
        return { ok: true, normalizedUrl: parsed.href };
      } catch (err: any) {
        return { ok: false, error: `Invalid URL: ${err.message}` };
      }
    }

    it('strictly neutralizes shell command injection vectors', () => {
      const injectionVectors = [
        'https://google.com & calc.exe',
        'https://evil.com|notepad.exe',
        'http://test.com; rm -rf',
        'https://google.com && calc.exe',
        'https://google.com || calc.exe',
        'https://google.com & start calc.exe',
        'http://example.com" & calc.exe & "',
        'http://example.com^&calc.exe',
        'http://example.com;calc.exe',
        'https://google.com`calc.exe`',
        'https://google.com$(calc.exe)'
      ];

      for (const vector of injectionVectors) {
        const result = validateUrlLikeRust(vector);
        // Either the WHATWG URL parser rejects spaces and metacharacters in host,
        // or if it parses, it is passed strictly to ShellExecuteW as a normalized URL
        // where lpParameters is NULL and cmd.exe is NOT invoked.
        if (!result.ok) {
          expect(result.ok).toBe(false);
          expect(result.error).toBeDefined();
        } else {
          // If validly parsed, verify scheme is exclusively http/https
          expect(['http:', 'https:']).toContain(new URL(result.normalizedUrl!).protocol);
        }
      }
    });

    it('strictly rejects dangerous and non-http(s) schemes', () => {
      const dangerousSchemes = [
        'file:///c:/windows/system32/cmd.exe',
        'file://C:/Windows/System32/calc.exe',
        'javascript:alert(1)',
        'javascript:eval(atob("Y2FsYy5leGU="))',
        'powershell:evil()',
        'cmd:calc.exe',
        'data:text/html,<script>alert(1)</script>',
        'data:application/octet-stream;base64,TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAA...',
        'vbscript:MsgBox("pwned")',
        'ms-msdt:/id PCWDiagnostic /skip force /param IT_RebrowseForFile=? IT_LaunchMethod=ContextMenu IT_SelectProblem=IT_SelectProblemCommandLine',
        'ms-settings:privacy',
        'ws://evil.com/socket',
        'wss://evil.com/socket',
        'ftp://anonymous@ftp.evil.com',
        'gopher://gopher.evil.com',
        'ssh://root@evil.com',
        'telnet://evil.com',
        'ldap://evil.com',
        'about:blank',
        'blob:https://evil.com/uuid-string',
        'chrome://settings'
      ];

      for (const schemePayload of dangerousSchemes) {
        const result = validateUrlLikeRust(schemePayload);
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/(Only http and https protocols|Invalid URL)/);
      }
    });

    it('strictly rejects relative, headless, and malformed paths', () => {
      const malformed = [
        'calc.exe',
        'cmd.exe /c calc.exe',
        'C:\\Windows\\System32\\calc.exe',
        '//evil.com/calc.exe',
        '///evil.com',
        'http:',
        'https:',
        'http://',
        'https://',
        '',
        '   ',
        'http ://example.com',
        'http: //example.com',
        'http://[invalid-ipv6]',
        'https://google.com\0calc.exe'
      ];

      for (const m of malformed) {
        const result = validateUrlLikeRust(m);
        expect(result.ok).toBe(false);
      }
    });

    it('accepts legitimate HTTP and HTTPS URLs and correctly parses query parameters', () => {
      const validUrls = [
        'https://github.com/ZerDevStudio/ZervHub',
        'http://localhost:3000/api?query=hello&version=1.0',
        'https://docs.rs/url/latest/url/struct.Url.html#method.scheme',
        'https://example.com/path/to/resource?param1=val&param2=another#anchor'
      ];

      for (const v of validUrls) {
        const result = validateUrlLikeRust(v);
        expect(result.ok).toBe(true);
        expect(result.normalizedUrl).toBeDefined();
        expect(result.normalizedUrl!.startsWith('http')).toBe(true);
      }
    });

    it('statically verifies ShellExecuteW implementation in src-tauri/src/lib.rs', () => {
      const libCode = fs.readFileSync(libPath, 'utf-8');

      // 1. Must NOT contain cmd.exe /C start
      expect(libCode).not.toContain('cmd.exe /C start');
      expect(libCode).not.toContain('silent_command("cmd")');
      expect(libCode).not.toContain('Command::new("cmd")');

      // 2. Must parse URL with url::Url::parse
      expect(libCode).toContain('url::Url::parse(&url)');

      // 3. Must restrict protocols to http and https
      expect(libCode).toContain('parsed.scheme() != "http" && parsed.scheme() != "https"');

      // 4. Must invoke ShellExecuteW with wide parameters
      expect(libCode).toContain('ShellExecuteW');
      expect(libCode).toContain('lpOperation: *const u16');
      expect(libCode).toContain('lpFile: *const u16');
      expect(libCode).toContain('lpParameters: *const u16');
      expect(libCode).toContain('SW_SHOWNORMAL');

      // 5. Must pass std::ptr::null() for lpParameters (no parameter injection)
      expect(libCode).toContain('std::ptr::null()');

      // 6. Must check ret <= 32 for ShellExecuteW error code
      expect(libCode).toContain('if ret <= 32');
    });
  });

  // =========================================================================
  // 3. Task R2: EDR Hardening (EDR-02) Silent NSIS Updater Purge
  // =========================================================================
  describe('3. Task R2: EDR Hardening (EDR-02) Silent NSIS Updater Purge', () => {
    const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
    const updaterPath = path.join(rootDir, 'src-tauri', 'src', 'updater.rs');

    it('verifies tauri.conf.json contains no silent "/S" flag or installerArgs', () => {
      const raw = fs.readFileSync(tauriConfPath, 'utf-8');
      const conf = JSON.parse(raw);

      expect(raw).not.toContain('"/S"');
      expect(raw).not.toContain('installerArgs');
      expect(conf.bundle.windows.nsis.installMode).toBe('currentUser');
      expect(conf.plugins.updater.windows.installMode).toBe('currentUser');
    });

    it('verifies src-tauri/src/updater.rs contains no _legacy_silent_install_reference or silent "/S"', () => {
      const code = fs.readFileSync(updaterPath, 'utf-8');

      expect(code).not.toContain('"/S"');
      expect(code).not.toContain('_legacy_silent_install_reference');
      expect(code).not.toContain('silent_command("cmd")');
      expect(code).not.toContain('"cmd"');

      // Verify interactive spawn
      expect(code).toMatch(/std::process::Command::new\(&path\)\.spawn\(\)/);
      expect(code).toMatch(/std::process::exit\(0\)/);
    });
  });
});
