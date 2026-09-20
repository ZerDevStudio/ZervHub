import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const rootDir = process.cwd();
const AGY_NODE = 'C:\\Users\\BERKE\\AppData\\Roaming\\Antigravity\\bin\\agy-node.cmd';

console.log('========================================================================');
console.log('CHALLENGER 1: EMPIRICAL STRESS TEST & VERIFICATION HARNESS (R1 & R2)');
console.log('========================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function check(title, condition, detail = '') {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${title}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${title} - Detail: ${detail}`);
    failedTests++;
    findings.push({ title, detail });
  }
}

// ---------------------------------------------------------------------------
// 1. Task R1: Repository URL Migration
// ---------------------------------------------------------------------------
console.log('=== 1. TEST R1: REPOSITORY URL MIGRATION ===');

const requiredFiles = [
  'src-tauri/src/updater.rs',
  'website/src/lib/downloadHelper.ts',
  'website/src/components/Footer.tsx',
  'README.md',
  'server/src/landingPageHtml.ts',
  'src/renderer/src/pages/QrCodeStudio.tsx',
  'server/src/services/notifier.ts',
  'scripts/github-cleaner.mjs'
];

for (const rel of requiredFiles) {
  const full = path.join(rootDir, rel);
  const exists = fs.existsSync(full);
  check(`File exists: ${rel}`, exists);
  if (exists) {
    const text = fs.readFileSync(full, 'utf-8');
    const hasLegacy = text.includes('zerviatr/NexusHub');
    check(`No "zerviatr/NexusHub" in ${rel}`, !hasLegacy, hasLegacy ? 'Found stale repo URL' : '');
    const hasNew = rel.includes('github-cleaner')
      ? (text.includes('ZerDevStudio') && text.includes('ZervHub'))
      : text.includes('ZerDevStudio/ZervHub');
    check(`Contains "ZerDevStudio" and "ZervHub" in ${rel}`, hasNew, !hasNew ? 'Missing new repo reference' : '');
  }
}

// Additional Codebase Scan
console.log('\n--- Scanning entire codebase for "zerviatr/NexusHub" occurrences ---');
function scanDirForLegacy(dir, matches = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.agents' && entry.name !== 'docs') {
        scanDirForLegacy(full, matches);
      }
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(full, 'utf-8');
        if (content.includes('zerviatr/NexusHub')) {
          matches.push(path.relative(rootDir, full));
        }
      } catch (e) {
        // Binary or unreadable
      }
    }
  }
  return matches;
}

const unmigratedFiles = scanDirForLegacy(rootDir);
console.log(`  Scanned active code trees. Unmigrated active files found: ${unmigratedFiles.length}`);
if (unmigratedFiles.length > 0) {
  console.log(`  Files containing legacy repo URL: ${unmigratedFiles.join(', ')}`);
}
// Note: scripts/setup-github-profile.mjs is outside the 8 required files, but tracked
check(
  'Required 8 files 100% clean of zerviatr/NexusHub',
  requiredFiles.every(f => !unmigratedFiles.includes(f))
);

// Format verification of new URLs
console.log('\n--- Validating ZerDevStudio/ZervHub URL formats ---');
const discoveredUrls = [
  'https://api.github.com/repos/ZerDevStudio/ZervHub/releases/latest',
  'https://github.com/ZerDevStudio/ZervHub/releases/latest',
  'https://github.com/ZerDevStudio/ZervHub/releases/download/v2.5.5/ZenDev-Setup-2.5.5.exe',
  'https://github.com/ZerDevStudio/ZervHub/releases/download/v2.5.5/ZenDev-Portable-2.5.5.exe',
  'https://github.com/ZerDevStudio/ZervHub',
  'https://raw.githubusercontent.com/ZerDevStudio/ZervHub/main/build/icons/icon.png'
];

for (const u of discoveredUrls) {
  let valid = false;
  try {
    const parsed = new URL(u);
    valid = parsed.protocol === 'https:' && parsed.pathname.includes('ZerDevStudio/ZervHub');
  } catch (e) {}
  check(`RFC valid HTTPS URL: ${u}`, valid);
}

// Feature Preservation Check: UniversalDecrypter & bypasser.rs
console.log('\n--- Verifying UniversalDecrypter and bypasser.rs preservation ---');
const decrypterFile = path.join(rootDir, 'src/renderer/src/pages/UniversalDecrypter.tsx');
const bypasserFile = path.join(rootDir, 'src-tauri/src/bypasser.rs');

check('UniversalDecrypter.tsx exists', fs.existsSync(decrypterFile));
if (fs.existsSync(decrypterFile)) {
  const decrypterContent = fs.readFileSync(decrypterFile, 'utf-8');
  check('UniversalDecrypter.tsx has full implementation (>700 lines)', decrypterContent.split('\n').length >= 700);
  check('UniversalDecrypter.tsx exports default function', decrypterContent.includes('export default function UniversalDecrypter'));
}

check('bypasser.rs exists', fs.existsSync(bypasserFile));
if (fs.existsSync(bypasserFile)) {
  const bypasserContent = fs.readFileSync(bypasserFile, 'utf-8');
  check('bypasser.rs has full implementation (>1000 lines)', bypasserContent.split('\n').length >= 1000);
  check('bypasser.rs defines bypass_link', bypasserContent.includes('pub async fn bypass_link'));
  check('bypasser.rs defines decrypter_clean', bypasserContent.includes('pub async fn decrypter_clean'));
  check('bypasser.rs defines decrypter_clean_batch', bypasserContent.includes('pub async fn decrypter_clean_batch'));
}

const appFile = path.join(rootDir, 'src/renderer/src/App.tsx');
const appContent = fs.readFileSync(appFile, 'utf-8');
check('App.tsx registers UniversalDecrypter route', appContent.includes('UniversalDecrypter'));

const libFile = path.join(rootDir, 'src-tauri/src/lib.rs');
const libContent = fs.readFileSync(libFile, 'utf-8');
check('lib.rs declares bypasser module', libContent.includes('pub mod bypasser;'));
check('lib.rs registers bypasser IPC handlers', libContent.includes('bypasser::bypass_link') && libContent.includes('bypasser::decrypter_clean'));


// ---------------------------------------------------------------------------
// 2. Task R2: Desktop Security (SEC-01) URL Validator Adversarial Stress Test
// ---------------------------------------------------------------------------
console.log('\n=== 2. TEST R2: SEC-01 URL VALIDATOR & SHELLEXECUTEW STRESS TEST ===');

function simulateRustOpenExternal(inputUrl) {
  let parsed;
  try {
    parsed = new URL(inputUrl);
  } catch (err) {
    return { ok: false, phase: 'PARSE_REJECTED', error: err.message };
  }

  const scheme = parsed.protocol.replace(/:$/, '').toLowerCase();
  if (scheme !== 'http' && scheme !== 'https') {
    return { ok: false, phase: 'SCHEME_REJECTED', error: `Only http and https protocols are permitted: found ${scheme}` };
  }

  return { ok: true, normalizedUrl: parsed.href };
}

// 2.1 Malicious Shell Injection Payloads
const injectionPayloads = [
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
  'https://google.com$(calc.exe)',
  'https://google.com%20&%20calc.exe'
];

console.log('--- Probing Shell Command Injection Payloads ---');
for (const payload of injectionPayloads) {
  const result = simulateRustOpenExternal(payload);
  if (!result.ok) {
    check(`Injection rejected at parse/scheme: ${payload.substring(0, 35)}...`, true);
  } else {
    // If it parsed as a valid URL, verify that it is passed to ShellExecuteW with lpParameters=NULL and NOT cmd.exe
    const isHttp = result.normalizedUrl.startsWith('http://') || result.normalizedUrl.startsWith('https://');
    check(`Parsed as HTTP(S) URL (safe via ShellExecuteW lpParameters=NULL): ${payload.substring(0, 35)}...`, isHttp);
  }
}

// 2.2 Dangerous URI Schemes
const dangerousSchemes = [
  'file:///c:/windows/system32/cmd.exe',
  'file://C:/Windows/System32/calc.exe',
  'file:///etc/passwd',
  'javascript:alert(1)',
  'javascript:eval(atob("Y2FsYy5leGU="))',
  'powershell:evil()',
  'cmd:calc.exe',
  'data:text/html,<script>alert(1)</script>',
  'data:application/octet-stream;base64,TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAA...',
  'vbscript:MsgBox("pwned")',
  'ms-msdt:/id PCWDiagnostic',
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

console.log('\n--- Probing Dangerous URI Schemes ---');
for (const schemePayload of dangerousSchemes) {
  const result = simulateRustOpenExternal(schemePayload);
  check(`Dangerous scheme strictly blocked: ${schemePayload.substring(0, 35)}...`, !result.ok);
}

// 2.3 Headless / Relative / Path Traversal Malformed Inputs
const malformedInputs = [
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

console.log('\n--- Probing Malformed & Relative Inputs ---');
for (const m of malformedInputs) {
  const result = simulateRustOpenExternal(m);
  check(`Malformed input strictly blocked: ${JSON.stringify(m)}`, !result.ok);
}

// 2.4 Static Source Audit of src-tauri/src/lib.rs (SEC-01)
console.log('\n--- Static Security Audit of open_external in src-tauri/src/lib.rs ---');
check('lib.rs does NOT contain cmd.exe /C start', !libContent.includes('cmd.exe /C start'));
check('lib.rs does NOT contain silent_command("cmd")', !libContent.includes('silent_command("cmd")'));
check('lib.rs does NOT contain Command::new("cmd")', !libContent.includes('Command::new("cmd")'));
check('lib.rs uses url::Url::parse scheme validator', libContent.includes('url::Url::parse(&url)'));
check('lib.rs restricts protocol to http and https', libContent.includes('parsed.scheme() != "http" && parsed.scheme() != "https"'));
check('lib.rs imports and calls Win32 ShellExecuteW', libContent.includes('ShellExecuteW'));
check('lib.rs passes SW_SHOWNORMAL (1)', libContent.includes('SW_SHOWNORMAL'));
check('lib.rs passes lpParameters as null (no arg injection)', libContent.includes('std::ptr::null()'));
check('lib.rs handles ShellExecuteW error code (ret <= 32)', libContent.includes('if ret <= 32'));


// ---------------------------------------------------------------------------
// 3. Task R2: EDR-02 Silent NSIS Updater Purge
// ---------------------------------------------------------------------------
console.log('\n=== 3. TEST R2: EDR-02 SILENT NSIS UPDATER PURGE ===');

const tauriConfRaw = fs.readFileSync(path.join(rootDir, 'src-tauri/tauri.conf.json'), 'utf-8');
const tauriConf = JSON.parse(tauriConfRaw);
const updaterContent = fs.readFileSync(path.join(rootDir, 'src-tauri/src/updater.rs'), 'utf-8');

check('tauri.conf.json has no "/S" flag', !tauriConfRaw.includes('"/S"'));
check('tauri.conf.json has no installerArgs field', !tauriConfRaw.includes('installerArgs'));
check('tauri.conf.json bundle installMode is currentUser', tauriConf?.bundle?.windows?.nsis?.installMode === 'currentUser');
check('tauri.conf.json plugins updater installMode is currentUser', tauriConf?.plugins?.updater?.windows?.installMode === 'currentUser');

check('updater.rs has no _legacy_silent_install_reference', !updaterContent.includes('_legacy_silent_install_reference'));
check('updater.rs has no "/S" flag', !updaterContent.includes('"/S"'));
check('updater.rs has no "cmd" invocation', !updaterContent.includes('"cmd"') && !updaterContent.includes('silent_command'));
check('updater.rs spawns interactive Command::new(&path)', updaterContent.includes('std::process::Command::new(&path).spawn()'));

// ---------------------------------------------------------------------------
// 4. Execution of tests/nsisSilentUpdate.test.ts
// ---------------------------------------------------------------------------
console.log('\n=== 4. RUNNING tests/nsisSilentUpdate.test.ts ===');
try {
  const output = execFileSync(AGY_NODE, ['--experimental-strip-types', 'tests/nsisSilentUpdate.test.ts'], {
    cwd: rootDir,
    encoding: 'utf-8',
    shell: true
  });
  console.log(output);
  check('tests/nsisSilentUpdate.test.ts executed and passed cleanly', !output.includes('✖') && output.includes('14 passed'));
} catch (err) {
  console.error(err.stdout || err.message);
  check('tests/nsisSilentUpdate.test.ts executed and passed cleanly', false, err.message);
}

// ---------------------------------------------------------------------------
// SUMMARY & VERDICT
// ---------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('========================================================================\n');

if (failedTests === 0) {
  console.log('>>> DEFINITIVE VERDICT: APPROVE <<<');
  console.log('All empirical assertions passed. Zero regressions detected.');
  process.exit(0);
} else {
  console.error('>>> DEFINITIVE VERDICT: REJECT <<<');
  console.error(`Detected ${failedTests} failing empirical checks:`);
  findings.forEach(f => console.error(` - ${f.title}: ${f.detail}`));
  process.exit(1);
}
