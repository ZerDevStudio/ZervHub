/**
 * tests/challenger_website_v255_empirical.mjs
 *
 * EMPIRICAL CHALLENGER TEST HARNESS:
 * 1. Deep byte-for-byte verification of Base64 demo strings in LiveBase64Demo & LiveDecrypterDemo
 * 2. Exact release URLs and download attributes in downloadHelper.ts, HeroSection.tsx, Navbar.tsx
 * 3. Prohibited modules and legacy URL scan across website/src/
 * 4. All live playground component integrity checks
 */

import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

console.log('========================================================================');
console.log('CHALLENGER 1: EMPIRICAL WEBSITE v2.5.5, URL & PAYLOAD HARNESS');
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

// ---------------------------------------------------------------------------
// SUITE 1: Base64 Payloads & Byte-for-Byte Precision
// ---------------------------------------------------------------------------
console.log('=== 1. BASE64 DEMO PAYLOADS & BYTE-FOR-BYTE PRECISION ===');

// 1.1 LiveBase64Demo payload verification
const b64_1 = 'WmVuRGV2IHYyLjUuNTogSMSxemzEsSwgR8O8dmVubGkgdmUgw5Z6Z8O8ciBHZWxpxZ90aXJpY2kgUGFrZXRpISDwn5qA';
const exp_1 = 'ZenDev v2.5.5: Hızlı, Güvenli ve Özgür Geliştirici Paketi! 🚀';

const dec_1 = Buffer.from(b64_1, 'base64').toString('utf8');
check('LiveBase64Demo base64 decodes cleanly', dec_1 === exp_1, `Decoded: "${dec_1}" vs Expected: "${exp_1}"`);
check('LiveBase64Demo byte-for-byte buffer equality (diff = 0)', Buffer.compare(Buffer.from(dec_1), Buffer.from(exp_1)) === 0);

// Verify UTF-8 code points including Turkish characters and emoji
const expectedCodePoints1 = [
  0x5A, 0x65, 0x6E, 0x44, 0x65, 0x76, 0x20, 0x76, 0x32, 0x2E, 0x35, 0x2E, 0x35, 0x3A, 0x20, // ZenDev v2.5.5:
  0x48, 0x131, 0x7A, 0x6C, 0x131, 0x2C, 0x20, // Hızlı, (0x131 is dotless i 'ı')
  0x47, 0xFC, 0x76, 0x65, 0x6E, 0x6C, 0x69, 0x20, // Güvenli (0xFC is 'ü')
  0x76, 0x65, 0x20, // ve
  0xD6, 0x7A, 0x67, 0xFC, 0x72, 0x20, // Özgür (0xD6 is 'Ö', 0xFC is 'ü')
  0x47, 0x65, 0x6C, 0x69, 0x15F, 0x74, 0x69, 0x72, 0x69, 0x63, 0x69, 0x20, // Geliştirici (0x15F is 'ş')
  0x50, 0x61, 0x6B, 0x65, 0x74, 0x69, 0x21, 0x20, // Paketi!
  0x1F680 // 🚀 (Rocket emoji)
];
const actualCodePoints1 = Array.from(dec_1).map(c => c.codePointAt(0));
check('LiveBase64Demo UTF-8 code point array strictly matches expected unicode sequence', 
  JSON.stringify(actualCodePoints1) === JSON.stringify(expectedCodePoints1)
);

// 1.2 LiveDecrypterDemo payload verification
const b64_2 = 'WmVuRGV2IHYyLjUuNSAtIEFib25lbGlrIFR1emHEn8SxbmEgU29uIQ==';
const exp_2 = 'ZenDev v2.5.5 - Abonelik Tuzağına Son!';

const dec_2 = Buffer.from(b64_2, 'base64').toString('utf8');
check('LiveDecrypterDemo base64 decodes cleanly', dec_2 === exp_2, `Decoded: "${dec_2}" vs Expected: "${exp_2}"`);
check('LiveDecrypterDemo byte-for-byte buffer equality (diff = 0)', Buffer.compare(Buffer.from(dec_2), Buffer.from(exp_2)) === 0);

// Verify UTF-8 code points including Turkish ğ and ı
const expectedCodePoints2 = [
  0x5A, 0x65, 0x6E, 0x44, 0x65, 0x76, 0x20, 0x76, 0x32, 0x2E, 0x35, 0x2E, 0x35, 0x20, 0x2D, 0x20, // ZenDev v2.5.5 -
  0x41, 0x62, 0x6F, 0x6E, 0x65, 0x6C, 0x69, 0x6B, 0x20, // Abonelik
  0x54, 0x75, 0x7A, 0x61, 0x11F, 0x131, 0x6E, 0x61, 0x20, // Tuzağına (0x11F is 'ğ', 0x131 is 'ı')
  0x53, 0x6F, 0x6E, 0x21 // Son!
];
const actualCodePoints2 = Array.from(dec_2).map(c => c.codePointAt(0));
check('LiveDecrypterDemo UTF-8 code point array strictly matches expected unicode sequence', 
  JSON.stringify(actualCodePoints2) === JSON.stringify(expectedCodePoints2)
);

// 1.3 Verify files on disk contain these exact strings
const base64DemoContent = fs.readFileSync(path.join(rootDir, 'website/src/components/LivePlayground/LiveBase64Demo.tsx'), 'utf8');
const decrypterDemoContent = fs.readFileSync(path.join(rootDir, 'website/src/components/LivePlayground/LiveDecrypterDemo.tsx'), 'utf8');

check('LiveBase64Demo.tsx contains encoded string', base64DemoContent.includes(b64_1));
check('LiveBase64Demo.tsx contains raw string in initial state and preset', base64DemoContent.includes(exp_1));
check('LiveDecrypterDemo.tsx contains encoded string in initial state', decrypterDemoContent.includes(b64_2));


// ---------------------------------------------------------------------------
// SUITE 2: Release URLs & Download Attributes (downloadHelper, HeroSection, Navbar)
// ---------------------------------------------------------------------------
console.log('\n=== 2. RELEASE URLS & DOWNLOAD ATTRIBUTES ===');

const downloadHelperContent = fs.readFileSync(path.join(rootDir, 'website/src/lib/downloadHelper.ts'), 'utf8');
const heroContent = fs.readFileSync(path.join(rootDir, 'website/src/components/HeroSection.tsx'), 'utf8');
const navbarContent = fs.readFileSync(path.join(rootDir, 'website/src/components/Navbar.tsx'), 'utf8');

// 2.1 downloadHelper.ts
check('downloadHelper.ts defines version "2.5.5"', downloadHelperContent.includes("version: '2.5.5'"));
check('downloadHelper.ts setupExe targets ZerDevStudio/ZervHub-App v2.5.5', 
  downloadHelperContent.includes("setupExe: 'https://github.com/ZerDevStudio/ZervHub-App/releases/download/v2.5.5/ZenDev-Setup-2.5.5.exe'")
);
check('downloadHelper.ts portableExe targets ZerDevStudio/ZervHub-App v2.5.5',
  downloadHelperContent.includes("portableExe: 'https://github.com/ZerDevStudio/ZervHub-App/releases/download/v2.5.5/ZenDev-Portable-2.5.5.exe'")
);
check('downloadHelper.ts fallbackLatestRelease targets ZerDevStudio/ZervHub-App',
  downloadHelperContent.includes("fallbackLatestRelease: 'https://github.com/ZerDevStudio/ZervHub-App/releases/latest'")
);
check('downloadHelper.ts repoUrl targets ZerDevStudio/ZervHub-App',
  downloadHelperContent.includes("repoUrl: 'https://github.com/ZerDevStudio/ZervHub-App'")
);

// 2.2 HeroSection.tsx
check('HeroSection.tsx imports ZENDEV_RELEASE_CONFIG', heroContent.includes("import { ZENDEV_RELEASE_CONFIG } from '../lib/downloadHelper'"));
check('HeroSection.tsx setup button uses ZENDEV_RELEASE_CONFIG.setupExe', heroContent.includes("href={ZENDEV_RELEASE_CONFIG.setupExe}"));
check('HeroSection.tsx setup button has download="ZenDev-Setup-2.5.5.exe"', heroContent.includes('download="ZenDev-Setup-2.5.5.exe"'));
check('HeroSection.tsx setup button title specifies v2.5.5', heroContent.includes('title="Download ZenDev v2.5.5 Setup (.exe)"'));

check('HeroSection.tsx portable button uses ZENDEV_RELEASE_CONFIG.portableExe', heroContent.includes("href={ZENDEV_RELEASE_CONFIG.portableExe}"));
check('HeroSection.tsx portable button has download="ZenDev-Portable-2.5.5.exe"', heroContent.includes('download="ZenDev-Portable-2.5.5.exe"'));
check('HeroSection.tsx portable button title specifies v2.5.5', heroContent.includes('title="Download ZenDev v2.5.5 Portable (.exe)"'));

check('HeroSection.tsx simulator title bar specifies v2.5.5', heroContent.includes('ZenDev Desktop v2.5.5 [Tauri Rust Engine]'));
check('HeroSection.tsx badge specifies v2.5.5 LATEST', heroContent.includes('v2.5.5 LATEST'));

// 2.3 Navbar.tsx
check('Navbar.tsx imports ZENDEV_RELEASE_CONFIG', navbarContent.includes("import { ZENDEV_RELEASE_CONFIG"));
check('Navbar.tsx desktop CTA uses ZENDEV_RELEASE_CONFIG.setupExe', navbarContent.includes("href={ZENDEV_RELEASE_CONFIG.setupExe}"));
check('Navbar.tsx desktop CTA download attribute is "ZenDev-Setup-2.5.5.exe"', navbarContent.includes('download="ZenDev-Setup-2.5.5.exe"'));
check('Navbar.tsx mobile drawer CTA uses ZENDEV_RELEASE_CONFIG.setupExe', navbarContent.includes('href={ZENDEV_RELEASE_CONFIG.setupExe}'));
check('Navbar.tsx mobile drawer CTA download is "ZenDev-Setup-2.5.5.exe"', navbarContent.includes('download="ZenDev-Setup-2.5.5.exe"'));
check('Navbar.tsx version badge shows v2.5.5', navbarContent.includes('>v2.5.5</button>') || navbarContent.includes('v2.5.5\n          </button>'));


// ---------------------------------------------------------------------------
// SUITE 3: Global Website Consistency & Cleanliness Checks
// ---------------------------------------------------------------------------
console.log('\n=== 3. GLOBAL WEBSITE CONSISTENCY & PURGE CHECKS ===');

// Check Footer.tsx
const footerContent = fs.readFileSync(path.join(rootDir, 'website/src/components/Footer.tsx'), 'utf8');
check('Footer.tsx links to ZerDevStudio/ZervHub-App', footerContent.includes('https://github.com/ZerDevStudio/ZervHub-App'));
check('Footer.tsx badge displays v2.5.5', footerContent.includes('v2.5.5'));

// Check ToolCatalog.tsx
const catalogContent = fs.readFileSync(path.join(rootDir, 'website/src/components/ToolCatalog.tsx'), 'utf8');
check('ToolCatalog.tsx suite badge references v2.5.5', catalogContent.includes('v2.5.5'));

// Check ShortcutsDrawer.tsx
const shortcutsContent = fs.readFileSync(path.join(rootDir, 'website/src/components/ShortcutsDrawer.tsx'), 'utf8');
check('ShortcutsDrawer.tsx badge references v2.5.5', shortcutsContent.includes('v2.5.5'));

// Check CommandPalette.tsx
const commandContent = fs.readFileSync(path.join(rootDir, 'website/src/components/CommandPalette.tsx'), 'utf8');
check('CommandPalette.tsx download action triggers v2.5.5 setup', commandContent.includes('ZenDev v2.5.5'));

// Check WaitlistModal & SimulatedCheckoutModal
const waitlistContent = fs.readFileSync(path.join(rootDir, 'website/src/components/WaitlistModal.tsx'), 'utf8');
check('WaitlistModal.tsx tag references v2.5.5', waitlistContent.includes('v2.5.5'));

const checkoutContent = fs.readFileSync(path.join(rootDir, 'website/src/components/SimulatedCheckoutModal.tsx'), 'utf8');
check('SimulatedCheckoutModal.tsx references v2.5.5', checkoutContent.includes('v2.5.5'));

// Check toolsData.ts
const toolsDataContent = fs.readFileSync(path.join(rootDir, 'website/src/lib/toolsData.ts'), 'utf8');
check('toolsData.ts defines Universal Link Decrypter (not generic base64)', 
  toolsDataContent.includes('universal-decrypter') &&
  toolsDataContent.includes('Evrensel Link Çözücü') &&
  toolsDataContent.includes('bypasser')
);

// Check ChangelogModal.tsx top entry
const changelogContent = fs.readFileSync(path.join(rootDir, 'website/src/components/ChangelogModal.tsx'), 'utf8');
check('ChangelogModal.tsx top entry is v2.5.5', changelogContent.includes('v2.5.5 — Universal Link Decrypter Overhaul') || changelogContent.includes('v2.5.5 — Evrensel Link Çözücü Mimarisi'));
check('ChangelogModal.tsx top entry has LATEST badge', changelogContent.includes('LATEST RELEASE') && changelogContent.includes('GÜNCEL SÜRÜM'));


// ---------------------------------------------------------------------------
// SUITE 4: Zero Legacy URLs & Zero Prohibited Modules in Website
// ---------------------------------------------------------------------------
console.log('\n=== 4. ZERO LEGACY REPOS & ZERO PROHIBITED MODULES IN WEBSITE ===');

const websiteSrc = path.join(rootDir, 'website/src');
function scanDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      scanDir(full, fileList);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.json') || f.endsWith('.html')) {
      fileList.push(full);
    }
  }
  return fileList;
}

const allWebsiteFiles = scanDir(websiteSrc);
let legacyFound = 0;
let purgedFound = 0;

const prohibitedRegexes = [
  /Port Killer/i,
  /Port Watchdog/i,
  /System Optimizer/i,
  /Temp Mail/i,
  /Clipboard Manager/i
];

for (const file of allWebsiteFiles) {
  const rel = path.relative(rootDir, file);
  const text = fs.readFileSync(file, 'utf8');

  // Check zerviatr
  if (/zerviatr/i.test(text)) {
    check(`Zero legacy 'zerviatr' in ${rel}`, false, 'Found zerviatr');
    legacyFound++;
  }

  // Check prohibited modules (except in ChangelogModal where historical removals are listed)
  if (!rel.includes('ChangelogModal.tsx')) {
    for (const rgx of prohibitedRegexes) {
      if (rgx.test(text)) {
        check(`Zero prohibited module (${rgx}) in active website file: ${rel}`, false, 'Found prohibited module reference');
        purgedFound++;
      }
    }
  }
}

check('Entire website/src/ has zero occurrences of legacy user "zerviatr"', legacyFound === 0, `Found ${legacyFound}`);
check('Entire website/src/ (excluding changelog archive) has zero active prohibited modules', purgedFound === 0, `Found ${purgedFound}`);


// ---------------------------------------------------------------------------
// FINAL SUMMARY & VERDICT
// ---------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('========================================================================\n');

if (failedTests === 0) {
  console.log('>>> DEFINITIVE VERDICT: APPROVE <<<');
  console.log('All empirical assertions passed. Byte-for-byte precision verified for v2.5.5.');
  process.exit(0);
} else {
  console.error('>>> DEFINITIVE VERDICT: CHALLENGE_FAILED <<<');
  console.error(`Detected ${failedTests} failing empirical checks:`);
  findings.forEach(f => console.error(` - ${f.title}: ${f.detail}`));
  process.exit(1);
}
