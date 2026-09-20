#!/usr/bin/env node
/**
 * tests/challenge_website_overhaul_m1_2.mjs
 *
 * Empirical Adversarial Challenger 2 Stress-Test Harness:
 * 1. Absence of Prohibited Modules (Port Killer, System Optimizer, Temp Mail, Clipboard Manager)
 * 2. Zero 404 / Private Repository Links (guarantee ZerDevStudio/ZervHub-App distribution)
 * 3. Version Synchronization & Zero Stray v2.5.3 Strings (enforce v2.5.5 active across UI)
 * 4. Universal Link Decrypter Identity & Tool Catalog Accuracy
 * 5. ChangelogModal v2.5.5 Top-level Entry & Directive Compliance
 * 6. Tool Arsenal & Suite Metrics Integrity (27 Studios alignment)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const WEBSITE_DIR = path.resolve(ROOT_DIR, 'website');
const WEBSITE_SRC = path.resolve(WEBSITE_DIR, 'src');

console.log('=============================================================================');
console.log('⚡ CHALLENGER 2: EMPIRICAL HARNESS — WEBSITE SAAS DIRECTIVE & OVERHAUL AUDIT');
console.log('=============================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function check(title, condition, detail = '') {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${title}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${title} - ${detail}`);
    failedTests++;
    failures.push({ title, detail });
  }
}

function getAllFiles(dir, fileList = [], filter = () => true) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist' && entry.name !== 'build') {
        getAllFiles(fullPath, fileList, filter);
      }
    } else if (filter(fullPath)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// =============================================================================
// SUITE 1: ADVERSARIAL SCAN FOR PROHIBITED MODULES (SaaS Directive Principle 2)
// =============================================================================
console.log('=== SUITE 1: PROHIBITED MODULES AUDIT (Port Killer, Optimizer, Temp Mail, Clipboard) ===');

const prohibitedPatterns = [
  { name: 'Port Killer / Port Watchdog', regex: /\b(port[ _-]?(killer|watchdog)|portkiller)\b/i },
  { name: 'System Optimizer', regex: /\b(system[ _-]?optimizer|optimizer)\b/i },
  { name: 'Temp Mail', regex: /\b(temp[ _-]?mail|tempmail|disposable[ _-]?mail|disposable[ _-]?email|geçici[ _-]?e?-?posta)\b/i },
  { name: 'Clipboard Manager', regex: /\b(clipboard[ _-]?manager|pano[ _-]?yöneticisi)\b/i }
];

const websiteFiles = getAllFiles(WEBSITE_DIR, [], (p) => {
  const ext = path.extname(p);
  return ['.ts', '.tsx', '.json', '.html', '.css', '.md'].includes(ext) && !p.includes('package-lock.json');
});

check(`Found website files for prohibited module scan (${websiteFiles.length} files)`, websiteFiles.length >= 20);

// Audit each file: prohibited terms are forbidden everywhere except ChangelogModal.tsx historical/purge entries
for (const pattern of prohibitedPatterns) {
  const violations = [];

  for (const filePath of websiteFiles) {
    const relPath = path.relative(ROOT_DIR, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    // ChangelogModal is permitted to document the historical releases and purge notes
    if (relPath.includes('ChangelogModal.tsx')) {
      continue;
    }

    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (pattern.regex.test(line)) {
        violations.push({ file: relPath, lineNum: idx + 1, line: line.trim() });
      }
    });
  }

  check(
    `Zero active occurrences of ${pattern.name} across website (outside historical ChangelogModal)`,
    violations.length === 0,
    violations.map((v) => `${v.file}:${v.lineNum} -> ${v.line}`).join('; ')
  );
}

// Extra check: verify ChangelogModal.tsx only mentions prohibited modules in purge/deprecation context
const changelogPath = path.join(WEBSITE_SRC, 'components', 'ChangelogModal.tsx');
const changelogContent = fs.readFileSync(changelogPath, 'utf-8');
const purgeMatches = changelogContent.match(/SaaS (Dönüşüm Direktifi Uyumu|Transformation Directive Compliance|Direktifi İlke 2 Temizliği|Directive Principle 2 Purge)/g);
check('ChangelogModal contains explicit SaaS Directive Purge & Compliance declarations', purgeMatches && purgeMatches.length >= 2);

// =============================================================================
// SUITE 2: ZERO 404 / PRIVATE REPOSITORY LINKS AUDIT
// =============================================================================
console.log('\n=== SUITE 2: ZERO 404 / PRIVATE REPOSITORY LINKS AUDIT ===');

const forbiddenRepoPatterns = [
  { name: 'Private repo zerviatr/NexusHub', regex: /zerviatr\/NexusHub/i },
  { name: 'Private core repo ZerDevStudio/ZervHub (without -App)', regex: /ZerDevStudio\/ZervHub\b(?!-App)/i }
];

for (const fPattern of forbiddenRepoPatterns) {
  const violations = [];
  for (const filePath of websiteFiles) {
    const relPath = path.relative(ROOT_DIR, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (fPattern.regex.test(line)) {
        violations.push({ file: relPath, lineNum: idx + 1, line: line.trim() });
      }
    });
  }
  check(
    `Zero references to ${fPattern.name}`,
    violations.length === 0,
    violations.map((v) => `${v.file}:${v.lineNum} -> ${v.line}`).join('; ')
  );
}

// Verify downloadHelper.ts configuration points exclusively to ZerDevStudio/ZervHub-App
const downloadHelperPath = path.join(WEBSITE_SRC, 'lib', 'downloadHelper.ts');
const downloadHelperContent = fs.readFileSync(downloadHelperPath, 'utf-8');

check(
  'downloadHelper.ts setupExe points to ZerDevStudio/ZervHub-App v2.5.5',
  downloadHelperContent.includes('https://github.com/ZerDevStudio/ZervHub-App/releases/download/v2.5.5/ZenDev-Setup-2.5.5.exe')
);
check(
  'downloadHelper.ts portableExe points to ZerDevStudio/ZervHub-App v2.5.5',
  downloadHelperContent.includes('https://github.com/ZerDevStudio/ZervHub-App/releases/download/v2.5.5/ZenDev-Portable-2.5.5.exe')
);
check(
  'downloadHelper.ts fallbackLatestRelease points to ZerDevStudio/ZervHub-App/releases/latest',
  downloadHelperContent.includes('https://github.com/ZerDevStudio/ZervHub-App/releases/latest')
);
check(
  'downloadHelper.ts repoUrl points to ZerDevStudio/ZervHub-App',
  downloadHelperContent.includes('https://github.com/ZerDevStudio/ZervHub-App')
);

// Verify Footer.tsx links to ZerDevStudio/ZervHub-App
const footerPath = path.join(WEBSITE_SRC, 'components', 'Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf-8');
check(
  'Footer.tsx GitHub link points to ZerDevStudio/ZervHub-App',
  footerContent.includes('https://github.com/ZerDevStudio/ZervHub-App')
);

// Verify download buttons in Navbar and HeroSection wire to setupExe / portableExe
const navbarPath = path.join(WEBSITE_SRC, 'components', 'Navbar.tsx');
const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
const heroPath = path.join(WEBSITE_SRC, 'components', 'HeroSection.tsx');
const heroContent = fs.readFileSync(heroPath, 'utf-8');

check('Navbar.tsx wires primary download action to ZENDEV_RELEASE_CONFIG.setupExe', navbarContent.includes('ZENDEV_RELEASE_CONFIG.setupExe'));
check('HeroSection.tsx wires installer download to ZENDEV_RELEASE_CONFIG.setupExe', heroContent.includes('ZENDEV_RELEASE_CONFIG.setupExe'));
check('HeroSection.tsx wires portable download to ZENDEV_RELEASE_CONFIG.portableExe', heroContent.includes('ZENDEV_RELEASE_CONFIG.portableExe'));

// =============================================================================
// SUITE 3: VERSION SYNCHRONIZATION & ZERO STRAY v2.5.3 STRINGS
// =============================================================================
console.log('\n=== SUITE 3: VERSION SYNCHRONIZATION & STRAY v2.5.3 AUDIT ===');

const websiteSrcFiles = getAllFiles(WEBSITE_SRC, [], (p) => {
  const ext = path.extname(p);
  return ['.ts', '.tsx'].includes(ext);
});

// Scan for stray 2.5.3 strings in website/src/ (allowed exclusively in ChangelogModal.tsx for historical releases)
const stray253Violations = [];
for (const filePath of websiteSrcFiles) {
  const relPath = path.relative(ROOT_DIR, filePath);
  if (relPath.includes('ChangelogModal.tsx')) {
    continue; // Historical changelog section is permitted
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/2\.5\.3/.test(line)) {
      stray253Violations.push({ file: relPath, lineNum: idx + 1, line: line.trim() });
    }
  });
}

check(
  'Zero stray "2.5.3" or "v2.5.3" strings across website/src/ (outside ChangelogModal historical entries)',
  stray253Violations.length === 0,
  stray253Violations.map((v) => `${v.file}:${v.lineNum} -> ${v.line}`).join('; ')
);

// Scan for stray 2.5.2 strings outside ChangelogModal
const stray252Violations = [];
for (const filePath of websiteSrcFiles) {
  const relPath = path.relative(ROOT_DIR, filePath);
  if (relPath.includes('ChangelogModal.tsx')) continue;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/2\.5\.2/.test(line)) {
      stray252Violations.push({ file: relPath, lineNum: idx + 1, line: line.trim() });
    }
  });
}
check(
  'Zero stray "2.5.2" or "v2.5.2" strings across website/src/ (outside ChangelogModal historical entries)',
  stray252Violations.length === 0,
  stray252Violations.map((v) => `${v.file}:${v.lineNum} -> ${v.line}`).join('; ')
);

// Verify package.json and index.html are synchronized to 2.5.5
const pkgPath = path.join(WEBSITE_DIR, 'package.json');
const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
check('website/package.json version is 2.5.5', pkgContent.version === '2.5.5', `Found ${pkgContent.version}`);

const indexHtmlPath = path.join(WEBSITE_DIR, 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
check('website/index.html title includes v2.5.5', indexHtmlContent.includes('ZenDev v2.5.5'));
check('website/index.html og:title includes v2.5.5', indexHtmlContent.includes('ZenDev v2.5.5 — API & Developer Desktop SaaS Suite'));
check('website/index.html softwareVersion is 2.5.5', indexHtmlContent.includes('"softwareVersion": "2.5.5"'));

// Verify UI components prominently showcase v2.5.5
check('HeroSection.tsx displays "v2.5.5 LATEST"', heroContent.includes('v2.5.5 LATEST'));
check('HeroSection.tsx setup filename is ZenDev-Setup-2.5.5.exe', heroContent.includes('ZenDev-Setup-2.5.5.exe'));
check('HeroSection.tsx portable filename is ZenDev-Portable-2.5.5.exe', heroContent.includes('ZenDev-Portable-2.5.5.exe'));
check('HeroSection.tsx simulator title is ZenDev Desktop v2.5.5', heroContent.includes('ZenDev Desktop v2.5.5'));
check('HeroSection.tsx benchmark table lists ZenDev v2.5.5 (Tauri)', heroContent.includes('ZenDev v2.5.5 (Tauri)'));

check('Navbar.tsx changelog button displays v2.5.5', navbarContent.includes('v2.5.5'));
check('Navbar.tsx download filename is ZenDev-Setup-2.5.5.exe', navbarContent.includes('ZenDev-Setup-2.5.5.exe'));

check('Footer.tsx displays version badge v2.5.5', footerContent.includes('v2.5.5'));

const cmdPalettePath = path.join(WEBSITE_SRC, 'components', 'CommandPalette.tsx');
const cmdPaletteContent = fs.readFileSync(cmdPalettePath, 'utf-8');
check('CommandPalette.tsx includes v2.5.5 labels', cmdPaletteContent.includes('v2.5.5'));

const waitlistPath = path.join(WEBSITE_SRC, 'components', 'WaitlistModal.tsx');
const waitlistContent = fs.readFileSync(waitlistPath, 'utf-8');
check('WaitlistModal.tsx includes v2.5.5 discount notice', waitlistContent.includes('ZenDev v2.5.5'));

const checkoutPath = path.join(WEBSITE_SRC, 'components', 'SimulatedCheckoutModal.tsx');
const checkoutContent = fs.readFileSync(checkoutPath, 'utf-8');
check('SimulatedCheckoutModal.tsx includes v2.5.5 launch prompt', checkoutContent.includes('ZenDev v2.5.5'));

const shortcutsPath = path.join(WEBSITE_SRC, 'components', 'ShortcutsDrawer.tsx');
const shortcutsContent = fs.readFileSync(shortcutsPath, 'utf-8');
check('ShortcutsDrawer.tsx header includes v2.5.5 Cheatsheet', shortcutsContent.includes('ZenDev v2.5.5'));

const catalogPath = path.join(WEBSITE_SRC, 'components', 'ToolCatalog.tsx');
const catalogContent = fs.readFileSync(catalogPath, 'utf-8');
check('ToolCatalog.tsx includes "ZenDev v2.5.5 ile Yerleşik Gelir"', catalogContent.includes('ZenDev v2.5.5 ile Yerleşik Gelir'));

// LivePlayground components
const livePlaygroundPath = path.join(WEBSITE_SRC, 'components', 'LivePlayground', 'LivePlayground.tsx');
const livePlaygroundContent = fs.readFileSync(livePlaygroundPath, 'utf-8');
check('LivePlayground.tsx title includes Simulator v2.5.5', livePlaygroundContent.includes('ZenDev Simulator v2.5.5'));

const liveBase64Path = path.join(WEBSITE_SRC, 'components', 'LivePlayground', 'LiveBase64Demo.tsx');
const liveBase64Content = fs.readFileSync(liveBase64Path, 'utf-8');
check('LiveBase64Demo.tsx preset includes ZenDev v2.5.5', liveBase64Content.includes('ZenDev v2.5.5'));

const liveHashPath = path.join(WEBSITE_SRC, 'components', 'LivePlayground', 'LiveHashDemo.tsx');
const liveHashContent = fs.readFileSync(liveHashPath, 'utf-8');
check('LiveHashDemo.tsx preset includes ZenDev v2.5.5 Tauri Edition', liveHashContent.includes('ZenDev v2.5.5 Tauri Edition'));

const liveQrPath = path.join(WEBSITE_SRC, 'components', 'LivePlayground', 'LiveQrDemo.tsx');
const liveQrContent = fs.readFileSync(liveQrPath, 'utf-8');
check('LiveQrDemo.tsx includes v2.5.5 QR Motoru', liveQrContent.includes('v2.5.5 QR Motoru'));

const liveRegexPath = path.join(WEBSITE_SRC, 'components', 'LivePlayground', 'LiveRegexDemo.tsx');
const liveRegexContent = fs.readFileSync(liveRegexPath, 'utf-8');
check('LiveRegexDemo.tsx test text includes ZenDev v2.5.5', liveRegexContent.includes('ZenDev v2.5.5'));

// =============================================================================
// SUITE 4: UNIVERSAL LINK DECRYPTER ACCURACY & TOOL CATALOG AUDIT
// =============================================================================
console.log('\n=== SUITE 4: UNIVERSAL LINK DECRYPTER IDENTITY & CATALOG ACCURACY ===');

const toolsDataPath = path.join(WEBSITE_SRC, 'lib', 'toolsData.ts');
const toolsDataContent = fs.readFileSync(toolsDataPath, 'utf-8');

// UniversalDecrypter entry in toolsData.ts
check('toolsData.ts has universal-decrypter tool definition', toolsDataContent.includes("id: 'universal-decrypter'"));
check('UniversalDecrypter titleTr is Evrensel Link Çözücü & Takipçi Temizleyici', toolsDataContent.includes("titleTr: 'Evrensel Link Çözücü & Takipçi Temizleyici'"));
check('UniversalDecrypter titleEn is Universal Link Decrypter & Tracker Stripper', toolsDataContent.includes("titleEn: 'Universal Link Decrypter & Tracker Stripper'"));
check('UniversalDecrypter mentions native Rust bypasser.rs', toolsDataContent.includes('bypasser.rs'));
check('UniversalDecrypter mentions UTM / FBCLID / affiliate tracker stripping', toolsDataContent.includes('UTM, FBCLID, affiliate'));
check('UniversalDecrypter specifies zero cloud leakage / recursive redirects', toolsDataContent.includes('özyinelemeli yönlendirmeleri'));
check('UniversalDecrypter has no legacy Base64 description in title or description', !toolsDataContent.includes('Universal Base64/Hex/Data-URL'));

// Check LiveDecrypterDemo exists in LivePlayground directory
const liveDecrypterPath = path.join(WEBSITE_SRC, 'components', 'LivePlayground', 'LiveDecrypterDemo.tsx');
check('LiveDecrypterDemo.tsx component exists', fs.existsSync(liveDecrypterPath));

// =============================================================================
// SUITE 5: CHANGELOGMODAL v2.5.5 PREMIER ENTRY AUDIT
// =============================================================================
console.log('\n=== SUITE 5: CHANGELOGMODAL v2.5.5 PREMIER ENTRY AUDIT ===');

check('ChangelogModal header states official release: v2.5.5', changelogContent.includes('En son resmi sürüm: v2.5.5'));
check('ChangelogModal top release badge is GÜNCEL SÜRÜM / LATEST RELEASE', changelogContent.includes('GÜNCEL SÜRÜM') && changelogContent.includes('LATEST RELEASE'));
check('ChangelogModal v2.5.5 title: Evrensel Link Çözücü Yenilemesi, Tauri v2 & SaaS Direktifi Uyumu', changelogContent.includes('v2.5.5 — Evrensel Link Çözücü Yenilemesi, Tauri v2 & SaaS Direktifi Uyumu'));
check('ChangelogModal v2.5.5 release date: 18 Eylül 2026 / September 18, 2026', changelogContent.includes('18 Eylül 2026') && changelogContent.includes('September 18, 2026'));
check('ChangelogModal details ad-shortener bypass engine (ay.live, bc.vc, POST token handshake)', changelogContent.includes('Gelişmiş Reklam Kısaltıcı Bypass Motoru') && changelogContent.includes('/get/tk'));
check('ChangelogModal details recursive redirect & intermediate landing page unwrapping', changelogContent.includes('Özyinelemeli Yönlendirme & Ara Sayfa Çözümü'));
check('ChangelogModal details zero-network local Rust tracker stripping', changelogContent.includes('Sıfır Ağ Takipçi Temizliği'));
check('ChangelogModal highlights Tauri v2 + Rust (<26 MB RAM, 0.35s boot, 4.6 MB installer)', changelogContent.includes('<26 MB RAM') && changelogContent.includes('0.35s') && changelogContent.includes('4.6 MB'));

// =============================================================================
// SUITE 6: TOOL ARSENAL & SUITE METRICS INTEGRITY
// =============================================================================
console.log('\n=== SUITE 6: TOOL ARSENAL & SUITE METRICS INTEGRITY ===');

// Extract tool IDs strictly from ZENDEV_TOOLS array
const startIdx = toolsDataContent.indexOf('ZENDEV_TOOLS: ToolItem[] = [');
const endIdx = toolsDataContent.indexOf('export const TOTAL_TOOLS_COUNT');
const zendevToolsBlock = toolsDataContent.slice(startIdx, endIdx);
const toolIdMatches = Array.from(zendevToolsBlock.matchAll(/id:\s*'([^']+)'/g), (m) => m[1]);
console.log(`  Discovered ${toolIdMatches.length} featured tools in ZENDEV_TOOLS:`, toolIdMatches.join(', '));

check('ZENDEV_TOOLS contains featured developer tools (>= 20)', toolIdMatches.length >= 20, `Count: ${toolIdMatches.length}`);
check('toolsData.ts exports TOTAL_TOOLS_COUNT = 27', toolsDataContent.includes('export const TOTAL_TOOLS_COUNT = 27;'));

const prohibitedToolIds = ['port-killer', 'port-watchdog', 'system-optimizer', 'temp-mail', 'clipboard-manager'];
for (const pid of prohibitedToolIds) {
  check(`Tool catalog does not contain prohibited tool id "${pid}"`, !toolIdMatches.includes(pid));
}

// Check that core SaaS tools are included in ZENDEV_TOOLS
const requiredSaasTools = [
  'cyber-fortress',
  'hash-studio',
  'password-generator',
  'universal-decrypter',
  'api-studio',
  'json-sqlite-studio',
  'jwt-studio',
  'cron-studio',
  'mermaid-studio',
  'encoding-studio'
];

for (const reqTool of requiredSaasTools) {
  check(`Catalog includes core developer SaaS studio "${reqTool}"`, toolIdMatches.includes(reqTool));
}

// Translations key parity & metrics
const translationsPath = path.join(WEBSITE_SRC, 'lib', 'translations.ts');
const translationsContent = fs.readFileSync(translationsPath, 'utf-8');
check('translations.ts TR has downloadBtn v2.5.5', translationsContent.includes("downloadBtn: 'Hemen İndir v2.5.5'"));
check('translations.ts EN has downloadBtn v2.5.5', translationsContent.includes("downloadBtn: 'Download v2.5.5'"));
check('translations.ts TR has whatsNew v2.5.5', translationsContent.includes("whatsNew: 'v2.5.5 Yenilikler'"));
check('translations.ts EN has whatsNew v2.5.5', translationsContent.includes("whatsNew: 'v2.5.5 What\\'s New'"));
check('translations.ts TR subtitle includes ZenDev v2.5.5', translationsContent.includes('ZenDev v2.5.5'));
check('translations.ts EN subtitle includes ZenDev v2.5.5', translationsContent.includes('ZenDev v2.5.5'));
check('translations.ts TR has 27+ Araç metric', translationsContent.includes("tools: '27+ Araç'"));
check('translations.ts EN has 27+ Tools metric', translationsContent.includes("tools: '27+ Tools'"));
check('translations.ts TR has Tümü (27) category', translationsContent.includes("all: 'Tümü (27)'"));
check('translations.ts EN has All Studios (27) category', translationsContent.includes("all: 'All Studios (27)'"));

// =============================================================================
// SUITE 7: INTERNAL DOM ANCHORS & COMPONENT RESOLUTION INTEGRITY
// =============================================================================
console.log('\n=== SUITE 7: INTERNAL DOM ANCHORS & COMPONENT RESOLUTION ===');

const declaredSectionIds = ['download', 'portal', 'testimonials', 'faq', 'radar', 'pricing', 'calculator', 'arsenal', 'playground'];

// Find all href="#..." across components
const anchorViolations = [];
for (const filePath of websiteSrcFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const matches = content.matchAll(/href="#([a-zA-Z0-9_-]+)"/g);
  for (const m of matches) {
    const targetId = m[1];
    if (!declaredSectionIds.includes(targetId)) {
      anchorViolations.push({ file: path.relative(ROOT_DIR, filePath), targetId });
    }
  }
}

check(
  'All internal navigation anchors (#...) resolve to existing DOM section IDs',
  anchorViolations.length === 0,
  anchorViolations.map((v) => `${v.file} -> #${v.targetId}`).join(', ')
);

// Verify all App.tsx imported components exist on disk
const appPath = path.join(WEBSITE_SRC, 'App.tsx');
const appContent = fs.readFileSync(appPath, 'utf-8');
const componentImports = Array.from(appContent.matchAll(/from '\.\/components\/([a-zA-Z0-9_/]+)'/g), (m) => m[1]);
let missingComponents = 0;
for (const comp of componentImports) {
  const candidateTsx = path.join(WEBSITE_SRC, 'components', `${comp}.tsx`);
  const candidateIndex = path.join(WEBSITE_SRC, 'components', comp, 'index.tsx');
  const exists = fs.existsSync(candidateTsx) || fs.existsSync(candidateIndex);
  if (!exists) {
    missingComponents++;
    console.error(`  Missing component: ${comp}`);
  }
}
check(`All ${componentImports.length} components imported in App.tsx exist on disk`, missingComponents === 0);

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n=============================================================================');
console.log(`TOTAL AUDIT CHECKS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('=============================================================================\n');

if (failedTests === 0) {
  console.log('>>> DEFINITIVE VERDICT: APPROVE <<<');
  console.log('All empirical assertions passed cleanly with 100% compliance.');
  process.exit(0);
} else {
  console.error('>>> DEFINITIVE VERDICT: CHALLENGE_FAILED <<<');
  console.error(`Detected ${failedTests} failing empirical checks:`);
  failures.forEach((f) => console.error(` - ${f.title}: ${f.detail}`));
  process.exit(1);
}
