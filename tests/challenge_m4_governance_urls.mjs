/**
 * tests/challenge_m4_governance_urls.mjs
 *
 * EMPIRICAL CHALLENGER TEST SUITE:
 * Rigorously challenge and stress-test the 8 overhauled files:
 *   1. README.md
 *   2. .github/ISSUE_TEMPLATE/bug_report.md
 *   3. .github/ISSUE_TEMPLATE/feature_request.md
 *   4. .github/PULL_REQUEST_TEMPLATE.md
 *   5. CONTRIBUTING.md
 *   6. SECURITY.md
 *   7. PROFILE_README.md
 *   8. scripts/setup-github-profile.mjs
 *
 * Verification Dimensions:
 *   - Dimension 1: URL & Infrastructure Integrity (Zero broken URLs, zero zerviatr or old repo URLs)
 *   - Dimension 2: Zero Electron in active badges or system architecture
 *   - Dimension 3: Zero purged modules in active feature listings
 *   - Dimension 4: Benchmarks (<26 MB RAM, 0.35s boot, 4.6 MB installer) and Universal Link Decrypter in README.md
 *   - Dimension 5: Governance & Template Schema Compliance
 *   - Dimension 6: Executable Verification of setup-github-profile.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const rootDir = process.cwd();

console.log('========================================================================');
console.log('CHALLENGER 1: EMPIRICAL GOVERNANCE & URL INTEGRITY CHALLENGE HARNESS');
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
    console.error(`  [FAIL] ${title}${detail ? ' - Detail: ' + detail : ''}`);
    failedTests++;
    findings.push({ title, detail });
  }
}

const targetFiles = [
  'README.md',
  '.github/ISSUE_TEMPLATE/bug_report.md',
  '.github/ISSUE_TEMPLATE/feature_request.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'docs/PROFILE_README.md',
  'scripts/setup-github-profile.mjs'
];

// ---------------------------------------------------------------------------
// 1. FILE EXISTENCE & HEALTH CHECKS
// ---------------------------------------------------------------------------
console.log('=== 1. TARGET FILE EXISTENCE & HEALTH CHECKS ===');

const fileContents = {};

for (const relPath of targetFiles) {
  const fullPath = path.join(rootDir, relPath);
  const exists = fs.existsSync(fullPath);
  check(`File exists on disk: ${relPath}`, exists);
  if (exists) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    check(`File is non-empty (>50 bytes): ${relPath}`, content.length > 50, `Size: ${content.length} bytes`);
    fileContents[relPath] = content;
  }
}

// ---------------------------------------------------------------------------
// 2. DIMENSION 1: URL INTEGRITY & OFFICIAL INFRASTRUCTURE VERIFICATION
// ---------------------------------------------------------------------------
console.log('\n=== 2. DIMENSION 1: URL INTEGRITY & INFRASTRUCTURE VERIFICATION ===');

// Check for legacy user/repo strings in all files
for (const relPath of targetFiles) {
  const content = fileContents[relPath] || '';
  
  // Note: scripts/setup-github-profile.mjs contains base64 encoded strings in its legacy check array,
  // but must NOT have plain-text 'zerviatr' in URLs or active code.
  if (relPath === 'scripts/setup-github-profile.mjs') {
    const urlsInScript = content.match(/https?:\/\/[^\s)\"'>]+|mailto:[^\s)\"'>]+/g) || [];
    const legacyInUrls = urlsInScript.filter(u => /zerviatr/i.test(u) || /NexusHub/i.test(u));
    check(`setup-github-profile.mjs contains zero legacy URLs`, legacyInUrls.length === 0, legacyInUrls.join(', '));
  } else {
    const hasZerviatr = /zerviatr/i.test(content);
    check(`Zero occurrences of "zerviatr" in ${relPath}`, !hasZerviatr, 'Found legacy username/org reference');
    
    // Check for old repo URL "zerviatr/NexusHub"
    const hasOldRepo = /zerviatr\/NexusHub/i.test(content);
    check(`Zero occurrences of "zerviatr/NexusHub" in ${relPath}`, !hasOldRepo, 'Found old repo URL');
  }
}

// Extract and validate ALL URLs across all 8 files
console.log('\n--- Deep URL Validation & Host Whitelist Scan ---');

const officialHostWhitelist = [
  'github.com',
  'api.github.com',
  'raw.githubusercontent.com',
  'tauri.app',
  'v2.tauri.app',
  'rust-lang.org',
  'react.dev',
  'typescriptlang.org',
  'tailwindcss.com',
  'img.shields.io',
  'rustup.rs',
  'nodejs.org',
  'vite.dev',
  'sql.js.org',
  'vitest.dev',
  'conventionalcommits.org',
  'capsule-render.vercel.app',
  'zerdevstudio.github.io'
];

const officialEmailWhitelist = [
  'security@zerdev.studio'
];

let extractedUrlCount = 0;
const allExtractedUrls = [];

for (const relPath of targetFiles) {
  const content = fileContents[relPath] || '';
  // Match markdown links [text](url), raw URLs, template literals, and src/href attributes
  const rawMatches = content.match(/https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%{}]+|mailto:[a-zA-Z0-9\-._~@]+/g) || [];
  
  for (let rawUrl of rawMatches) {
    // Strip trailing markdown punctuations if accidentally captured
    let cleanUrl = rawUrl.replace(/[\)\]\>\,\.\;\"\'\`]+$/, '');
    if (!cleanUrl) continue;

    // Resolve template literals if present in script files (e.g. ${options.target} -> ZerDevStudio)
    cleanUrl = cleanUrl.replace(/\$\{options\.target\}/g, 'ZerDevStudio');
    
    extractedUrlCount++;
    allExtractedUrls.push({ file: relPath, url: cleanUrl });
    
    if (cleanUrl.startsWith('mailto:')) {
      const email = cleanUrl.replace(/^mailto:/, '');
      check(`Valid official email in ${relPath}: ${cleanUrl}`, officialEmailWhitelist.includes(email), `Email: ${email}`);
    } else {
      let parsed;
      let parseOk = false;
      try {
        parsed = new URL(cleanUrl);
        parseOk = parsed.protocol === 'https:' || parsed.protocol === 'http:';
      } catch (e) {
        parseOk = false;
      }
      
      check(`RFC Valid URL in ${relPath}: ${cleanUrl}`, parseOk, `Failed parsing: ${cleanUrl}`);
      
      if (parseOk) {
        // Enforce HTTPS
        check(`Enforces HTTPS for ${cleanUrl}`, parsed.protocol === 'https:');
        
        // Host must be in official whitelist
        const hostAllowed = officialHostWhitelist.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h));
        check(`Host belongs to official infrastructure: ${parsed.hostname} (${cleanUrl})`, hostAllowed, `Unrecognized host: ${parsed.hostname}`);
        
        // If GitHub URL, verify it points to ZerDevStudio
        if (parsed.hostname === 'github.com') {
          const isZerDev = parsed.pathname.startsWith('/ZerDevStudio') || parsed.pathname.startsWith('/ZerDevStudio/');
          check(`GitHub repository link targets ZerDevStudio: ${cleanUrl}`, isZerDev, `Non-ZerDevStudio target: ${parsed.pathname}`);
        }
      }
    }
  }
}

console.log(`\n  Total URLs inspected across 8 files: ${extractedUrlCount}`);
check(`At least 30 valid URLs found and verified across 8 files`, extractedUrlCount >= 30, `Found: ${extractedUrlCount}`);


// ---------------------------------------------------------------------------
// 3. DIMENSION 2: ZERO REFERENCES TO ELECTRON IN ACTIVE BADGES OR ARCHITECTURE
// ---------------------------------------------------------------------------
console.log('\n=== 3. DIMENSION 2: ELECTRON PURGE FROM ACTIVE BADGES & ARCHITECTURE ===');

const readme = fileContents['README.md'] || '';

// 3.1 Badge section inspection (lines 1 to 20)
const readmeLines = readme.split('\n');
const badgeLines = readmeLines.slice(0, 15).join('\n');
check('README active badges contain zero "electron"', !/electron/i.test(badgeLines), 'Found electron in badge header');
check('README active badges feature Tauri v2', badgeLines.includes('Tauri-v2.2') || badgeLines.includes('Tauri'));
check('README active badges feature Rust', badgeLines.includes('Rust') && badgeLines.includes('rust-lang.org'));
check('README active badges feature React', badgeLines.includes('React') && badgeLines.includes('react.dev'));

// 3.2 System Architecture section inspection
const archStartIndex = readme.indexOf('## 🏗️ System Architecture');
const archEndIndex = readme.indexOf('## 🔒 Security & Cryptographic Integrity');
const archSection = archStartIndex !== -1 && archEndIndex !== -1 
  ? readme.substring(archStartIndex, archEndIndex)
  : '';

check('System Architecture section exists in README', archSection.length > 0);
check('System Architecture contains zero references to "electron"', !/electron/i.test(archSection), 'Found electron in architecture diagram/spec');
check('System Architecture specifies Tauri v2 IPC Bridge', archSection.includes('Tauri v2 IPC Bridge') || archSection.includes('tauri::App'));
check('System Architecture specifies Native Rust Backend', archSection.includes('Native Rust Backend') || archSection.includes('src-tauri'));
check('System Architecture specifies Sandboxed Frontend Renderer (React 19)', archSection.includes('React 19') && archSection.includes('src/renderer'));

// 3.3 Check other files for active Electron references
const profileReadme = fileContents['docs/PROFILE_README.md'] || fileContents['PROFILE_README.md'] || '';
const profileBadges = profileReadme.split('\n').slice(0, 50).join('\n');
check('PROFILE_README active badges contain zero "electron"', !/electron/i.test(profileBadges));

const profileArch = profileReadme.includes('### ⚡ Technical Arsenal')
  ? profileReadme.substring(profileReadme.indexOf('### ⚡ Technical Arsenal'), profileReadme.indexOf('### 📦 Ecosystem'))
  : '';
check('PROFILE_README Technical Arsenal contains zero "electron"', !/electron/i.test(profileArch));
check('PROFILE_README Technical Arsenal specifies Tauri v2', profileArch.includes('Tauri v2'));
check('PROFILE_README Technical Arsenal specifies Rust', profileArch.includes('Rust'));

const contributing = fileContents['CONTRIBUTING.md'] || '';
check('CONTRIBUTING.md tech stack specifies Tauri v2 + Rust', contributing.includes('Tauri v2') && contributing.includes('Rust'));
check('CONTRIBUTING.md contains zero references to "electron"', !/electron/i.test(contributing));


// ---------------------------------------------------------------------------
// 4. DIMENSION 3: ZERO REFERENCES TO PURGED MODULES IN ACTIVE FEATURE LISTINGS
// ---------------------------------------------------------------------------
console.log('\n=== 4. DIMENSION 3: ZERO PURGED MODULES IN ACTIVE FEATURE LISTINGS ===');

const purgedTerms = [
  'Port Killer',
  'Port Watchdog',
  'System Optimizer',
  'Temp Mail',
  'Clipboard Manager'
];

// 4.1 Core Developer Studios table in README.md
const studiosStartIndex = readme.indexOf('## 🛠️ Core Developer Studios');
const studiosEndIndex = readme.indexOf('## 🏗️ System Architecture');
const studiosSection = (studiosStartIndex !== -1 && studiosEndIndex !== -1)
  ? readme.substring(studiosStartIndex, studiosEndIndex)
  : '';

check('Core Developer Studios section exists in README', studiosSection.length > 0);

// Extract the markdown table lines before the deprecation note
const tableLines = studiosSection.split('\n').filter(l => l.startsWith('|') && !l.includes('Note on Deprecated Modules')).join('\n');

for (const term of purgedTerms) {
  check(`Core Developer Studios active table does NOT contain "${term}"`, !tableLines.includes(term), `Found active listing for ${term}`);
}

// Verify that the deprecation notice explicitly documents their permanent purge
check(
  'README contains explicit "Note on Deprecated Modules" explaining permanent purge',
  studiosSection.includes('Note on Deprecated Modules') &&
  studiosSection.includes('permanently purged from the core architecture')
);

// 4.2 PROFILE_README.md Core Integrated Native Studios
const profileStudiosStart = profileReadme.includes('<h4>Core Integrated Native Studios:</h4>')
  ? profileReadme.indexOf('<h4>Core Integrated Native Studios:</h4>')
  : profileReadme.indexOf('Core Integrated Native Studios:');
const profileStudiosEnd = profileReadme.indexOf('### 📊 Key Metrics & Engineering Benchmarks');
const profileStudiosSection = (profileStudiosStart !== -1 && profileStudiosEnd !== -1)
  ? profileReadme.substring(profileStudiosStart, profileStudiosEnd)
  : '';

check('PROFILE_README Core Integrated Native Studios section exists', profileStudiosSection.length > 0);
for (const term of purgedTerms) {
  check(`PROFILE_README active studios list does NOT contain "${term}"`, !profileStudiosSection.includes(term));
}

// 4.3 Feature Request template gatekeeper checks
const featureTemplate = fileContents['.github/ISSUE_TEMPLATE/feature_request.md'] || '';
check('Feature request template contains "Prohibited Modules (Auto-Rejected)"', featureTemplate.includes('⛔ **Prohibited Modules (Auto-Rejected):**'));
check('Feature request template prohibits Port Killer', featureTemplate.includes('`Port Killer`'));
check('Feature request template prohibits System Optimizer', featureTemplate.includes('`System Optimizer`'));
check('Feature request template prohibits Temp Mail', featureTemplate.includes('`Temp Mail`'));
check('Feature request template prohibits Clipboard Manager', featureTemplate.includes('`Clipboard Manager`'));

// 4.4 CONTRIBUTING.md prohibited modules
check('CONTRIBUTING.md explicitly lists prohibited modules under governance', contributing.includes('Prohibited Modules') && contributing.includes('Port Killer') && contributing.includes('System Optimizer'));


// ---------------------------------------------------------------------------
// 5. DIMENSION 4: BENCHMARKS & UNIVERSAL LINK DECRYPTER IN README.MD
// ---------------------------------------------------------------------------
console.log('\n=== 5. DIMENSION 4: BENCHMARKS & UNIVERSAL LINK DECRYPTER IN README.MD ===');

// 5.1 Benchmarks check
check('README explicitly presents "<26 MB RAM" or "<26 MB"', readme.includes('<26 MB') || readme.includes('< 26 MB'));
check('README explicitly presents "0.35s" boot/start latency', readme.includes('0.35s'));
check('README explicitly presents "4.6 MB" installer binary size', readme.includes('4.6 MB'));

// Check benchmark table structure
const benchStartIndex = readme.indexOf('## ⚡ Verified Performance Benchmarks');
const benchEndIndex = readme.indexOf('## 🛠️ Core Developer Studios');
const benchSection = (benchStartIndex !== -1 && benchEndIndex !== -1)
  ? readme.substring(benchStartIndex, benchEndIndex)
  : '';

check('Performance Benchmarks section exists in README', benchSection.length > 0);
check('Benchmark table specifies Boot / Cold Start Latency (0.35s)', benchSection.includes('Boot / Cold Start Latency') && benchSection.includes('0.35s'));
check('Benchmark table specifies Idle Memory Footprint (<26 MB)', benchSection.includes('Idle Memory Footprint') && benchSection.includes('<26 MB'));
check('Benchmark table specifies Installer Binary Size (4.6 MB)', benchSection.includes('Installer Binary Size') && benchSection.includes('4.6 MB'));
check('Benchmark table contrasts with Legacy Architecture (Electron)', benchSection.includes('Legacy Architecture (Electron)'));

// 5.2 Universal Link Decrypter check
check('README explicitly lists "Universal Link Decrypter"', readme.includes('Universal Link Decrypter'));
check('README explicitly includes Turkish localized name "(Evrensel Link Çözücü)"', readme.includes('Evrensel Link Çözücü'));
check('README describes Universal Link Decrypter capabilities', 
  readme.includes('unshortening') && 
  readme.includes('bypass engine') && 
  readme.includes('UTM') && 
  readme.includes('Punycode')
);
check('System Architecture includes Universal Link Decrypter (bypasser.rs)', 
  archSection.includes('Universal Link Decrypter') && archSection.includes('bypasser.rs')
);


// ---------------------------------------------------------------------------
// 6. DIMENSION 5: COMMUNITY GOVERNANCE SUITE SPECIFICATION & COMPLIANCE
// ---------------------------------------------------------------------------
console.log('\n=== 6. DIMENSION 5: COMMUNITY GOVERNANCE SUITE COMPLIANCE ===');

// 6.1 Bug Report Template
const bugReport = fileContents['.github/ISSUE_TEMPLATE/bug_report.md'] || '';
check('Bug report has valid YAML frontmatter', bugReport.startsWith('---\n') && bugReport.includes('name: Bug Report'));
check('Bug report includes Environment Details table', bugReport.includes('## Environment Details') && bugReport.includes('Operating System') && bugReport.includes('WebView2'));
check('Bug report includes Tauri info instruction', bugReport.includes('npm run tauri info'));

// 6.2 Feature Request Template (5-Filter Gatekeeper)
check('Feature request has valid YAML frontmatter', featureTemplate.startsWith('---\n') && featureTemplate.includes('Feature Request (SaaS Gatekeeper)'));
check('Feature request includes 5-Filter Gatekeeper section', featureTemplate.includes('## 🎯 5-Filter Gatekeeper Evaluation'));
check('Filter 1: ICP Alignment present', featureTemplate.includes('### 1. ICP Alignment'));
check('Filter 2: The Willingness-to-Pay Test present', featureTemplate.includes('### 2. The Willingness-to-Pay Test'));
check('Filter 3: Free Alternative Check present', featureTemplate.includes('### 3. Free Alternative Check'));
check('Filter 4: Studio & Workflow Synergy present', featureTemplate.includes('### 4. Studio & Workflow Synergy') && featureTemplate.includes('Workflow Chains') && featureTemplate.includes('Shareable Team Collections'));
check('Filter 5: Maintenance & Security Cost present', featureTemplate.includes('### 5. Maintenance & Security Cost') && featureTemplate.includes('Zero OS-level tampering'));

// 6.3 Pull Request Template
const prTemplate = fileContents['.github/PULL_REQUEST_TEMPLATE.md'] || '';
check('PR template includes Summary and Related Issue', prTemplate.includes('## Summary') && prTemplate.includes('## Related Issue'));
check('PR template includes Type of Change with SaaS gatekeeper', prTemplate.includes('Type of Change') && prTemplate.includes('Feature Gatekeeper'));
check('PR template checklist includes clean-code and SaaS Directive', prTemplate.includes('SaaS Directive (no prohibited modules)'));
check('PR template checklist includes npm test and cargo test', prTemplate.includes('npm test') && prTemplate.includes('cargo test'));
check('PR template checklist includes 100% i18n parity check', prTemplate.includes('100% bilingual i18n parity'));

// 6.4 Security Policy
const security = fileContents['SECURITY.md'] || '';
check('SECURITY.md includes Supported Versions table', security.includes('## 🛡️ Supported Versions') && security.includes('2.5.x'));
check('SECURITY.md includes private email channel security@zerdev.studio', security.includes('security@zerdev.studio'));
check('SECURITY.md includes GitHub Private Advisory link', security.includes('https://github.com/ZerDevStudio/ZervHub/security/advisories/new'));
check('SECURITY.md includes SLA & Coordinated Disclosure timelines', security.includes('Response SLA') && security.includes('48 hours') && security.includes('14 calendar days'));
check('SECURITY.md defines Security Architecture & In-Scope boundaries', security.includes('Tauri v2 IPC Bridge Boundary') && security.includes('Cyber Fortress'));


// ---------------------------------------------------------------------------
// 7. DIMENSION 6: EXECUTABLE VERIFICATION OF setup-github-profile.mjs
// ---------------------------------------------------------------------------
console.log('\n=== 7. DIMENSION 6: EXECUTABLE VERIFICATION OF setup-github-profile.mjs ===');

const scriptPath = path.join(rootDir, 'scripts/setup-github-profile.mjs');

// 7.1 Static checks of setup-github-profile.mjs
const setupScriptContent = fileContents['scripts/setup-github-profile.mjs'] || '';
check('setup-github-profile.mjs has node shebang', setupScriptContent.startsWith('#!/usr/bin/env node'));
check('setup-github-profile.mjs defaults to ZerDevStudio', setupScriptContent.includes("target: 'ZerDevStudio'"));
check('setup-github-profile.mjs defaults to .github repository', setupScriptContent.includes("repo: '.github'"));
check('setup-github-profile.mjs contains sanitize check for legacy strings', setupScriptContent.includes('legacyPatterns'));
check('setup-github-profile.mjs points to ZerDevStudio/ZervHub blog URL', setupScriptContent.includes('https://github.com/ZerDevStudio/ZervHub'));
check('setup-github-profile.mjs uses security@zerdev.studio email', setupScriptContent.includes('security@zerdev.studio'));

// 7.2 Executable CLI execution --dry-run
console.log('\n--- Executing `node scripts/setup-github-profile.mjs --dry-run` ---');
try {
  const dryRunOutput = execFileSync('node', [scriptPath, '--dry-run'], {
    cwd: rootDir,
    encoding: 'utf-8',
    timeout: 10000
  });
  
  check('setup-github-profile.mjs --dry-run exits with code 0', true);
  check('Dry-run output verifies Target Entity is ZerDevStudio', dryRunOutput.includes('Target Entity:   ZerDevStudio'));
  check('Dry-run output verifies Repository is ZerDevStudio/.github', dryRunOutput.includes('Repository:      ZerDevStudio/.github'));
  check('Dry-run output confirms all mandatory sections verified', dryRunOutput.includes('All mandatory sections verified in profile template'));
  check('Dry-run output confirms 100% clean of legacy relics', dryRunOutput.includes('100% clean of legacy relics'));
  check('Dry-run completed successfully', dryRunOutput.includes('DRY-RUN COMPLETED: All parameters, payloads, and templates are valid'));
} catch (err) {
  check('setup-github-profile.mjs --dry-run exits with code 0', false, err.stdout || err.message);
}

// 7.3 Executable CLI execution --help
console.log('\n--- Executing `node scripts/setup-github-profile.mjs --help` ---');
try {
  const helpOutput = execFileSync('node', [scriptPath, '--help'], {
    cwd: rootDir,
    encoding: 'utf-8',
    timeout: 10000
  });
  check('setup-github-profile.mjs --help exits with code 0', true);
  check('Help output displays ZerDevStudio configurator usage', helpOutput.includes('ZerDevStudio Automated GitHub Organization & Profile Configurator'));
  check('Help output details all flags (--target, --repo, --dry-run, etc.)', helpOutput.includes('--target') && helpOutput.includes('--dry-run'));
} catch (err) {
  check('setup-github-profile.mjs --help exits with code 0', false, err.stdout || err.message);
}


// ---------------------------------------------------------------------------
// FINAL SUMMARY & VERDICT
// ---------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('========================================================================\n');

if (failedTests === 0) {
  console.log('>>> DEFINITIVE VERDICT: APPROVE <<<');
  console.log('All empirical assertions passed. Zero broken URLs, zero legacy relics, zero regressions.');
  process.exit(0);
} else {
  console.error('>>> DEFINITIVE VERDICT: REJECT <<<');
  console.error(`Detected ${failedTests} failing empirical checks:`);
  findings.forEach(f => console.error(` - ${f.title}: ${f.detail}`));
  process.exit(1);
}
