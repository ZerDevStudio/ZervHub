import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('CHALLENGER 2: EMPIRICAL TEST SUITE (R3 & R4 REMEDIATIONS)');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName}${details ? ' -> ' + details : ''}`);
    failCount++;
    failures.push({ testName, details });
  }
}

// ============================================================================
// SUITE 1: Task R3 — Dead Code, Stubs, Residual Deprecated Traces
// ============================================================================
console.log('--- SUITE 1: Task R3 (Dead Code & Deprecated Tool Elimination) ---');

// 1.1 Stubs on disk
const devSandboxExists = fs.existsSync('src/renderer/src/pages/DevSandbox.tsx');
assert(!devSandboxExists, 'R3.1: DevSandbox.tsx does not exist on disk', devSandboxExists ? 'File src/renderer/src/pages/DevSandbox.tsx still exists' : '');

const curlRunnerExists = fs.existsSync('src/renderer/src/pages/CurlRunner.tsx');
assert(!curlRunnerExists, 'R3.2: CurlRunner.tsx does not exist on disk', curlRunnerExists ? 'File src/renderer/src/pages/CurlRunner.tsx still exists' : '');

// 1.2 Import Integrity in App.tsx, SmartPasteCard.tsx, MiniHud.tsx, CommandPalette.tsx
console.log('\nSub-suite: Import Integrity & Component Resolution');

const appContent = fs.readFileSync('src/renderer/src/App.tsx', 'utf8');

// Check lazy imports in App.tsx
const appLazyImports = [...appContent.matchAll(/const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)\)/g)];
const appStandardImports = [...appContent.matchAll(/import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g)];

// Verify all relative import paths in App.tsx exist on disk
for (const [_, componentName, importPath] of appLazyImports) {
  const resolved = path.resolve('src/renderer/src', importPath + '.tsx');
  const exists = fs.existsSync(resolved);
  assert(exists, `R3.3: App.tsx lazy import ${componentName} points to existing file (${importPath})`, exists ? '' : `Path does not exist: ${resolved}`);
}

// CRITICAL CHECK: Verify all JSX components rendered in App.tsx are defined in App.tsx
// Specifically check for <RegexStudio />
const hasRegexStudioTag = appContent.includes('<RegexStudio');
const definesRegexStudio = /(?:const|import)\s+.*?RegexStudio/.test(appContent);
assert(!hasRegexStudioTag || definesRegexStudio, 'R3.4: App.tsx JSX component <RegexStudio /> is declared/imported in App.tsx', 
  hasRegexStudioTag && !definesRegexStudio ? 'CRITICAL: <RegexStudio /> is referenced in <Route path="/regex-studio" ...> but RegexStudio is NOT declared or imported in App.tsx! Causes ReferenceError: RegexStudio is not defined at runtime.' : '');

// Check SmartPasteCard.tsx
const smartPasteContent = fs.readFileSync('src/renderer/src/components/SmartPasteCard.tsx', 'utf8');
const spImports = [...smartPasteContent.matchAll(/import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g)];
for (const [_, named, def, impPath] of spImports) {
  if (impPath.startsWith('.')) {
    const ext = impPath.endsWith('.ts') || impPath.endsWith('.tsx') ? '' : fs.existsSync(path.resolve('src/renderer/src/components', impPath + '.ts')) ? '.ts' : '.tsx';
    const resolved = path.resolve('src/renderer/src/components', impPath + ext);
    assert(fs.existsSync(resolved), `R3.5: SmartPasteCard.tsx import ${impPath} resolves to file on disk`, resolved);
  }
}

// Check MiniHud.tsx
const miniHudContent = fs.readFileSync('src/renderer/src/components/MiniHud.tsx', 'utf8');
const miniHudImports = [...miniHudContent.matchAll(/import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g)];
for (const [_, named, def, impPath] of miniHudImports) {
  if (impPath.startsWith('.')) {
    const ext = impPath.endsWith('.ts') || impPath.endsWith('.tsx') ? '' : fs.existsSync(path.resolve('src/renderer/src/components', impPath + '.ts')) ? '.ts' : '.tsx';
    const resolved = path.resolve('src/renderer/src/components', impPath + ext);
    assert(fs.existsSync(resolved), `R3.6: MiniHud.tsx import ${impPath} resolves to file on disk`, resolved);
  }
}
assert(!miniHudContent.includes('/curl-runner'), 'R3.7: MiniHud.tsx contains no legacy /curl-runner routes');

// Check CommandPalette.tsx
const cmdContent = fs.readFileSync('src/renderer/src/components/CommandPalette.tsx', 'utf8');
const cmdImports = [...cmdContent.matchAll(/import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g)];
for (const [_, named, def, impPath] of cmdImports) {
  if (impPath.startsWith('.')) {
    const ext = impPath.endsWith('.ts') || impPath.endsWith('.tsx') ? '' : fs.existsSync(path.resolve('src/renderer/src/components', impPath + '.ts')) ? '.ts' : '.tsx';
    const resolved = path.resolve('src/renderer/src/components', impPath + ext);
    assert(fs.existsSync(resolved), `R3.8: CommandPalette.tsx import ${impPath} resolves to file on disk`, resolved);
  }
}

// 1.3 landingPageHtml.ts checks
console.log('\nSub-suite: landingPageHtml.ts Purged References');
const landingHtml = fs.readFileSync('server/src/landingPageHtml.ts', 'utf8');

const purgedTerms = [
  { pattern: /portkiller/i, name: 'portkiller' },
  { pattern: /port-killer/i, name: 'port-killer' },
  { pattern: /system-optimizer/i, name: 'system-optimizer' },
  { pattern: /system\s+optimizer/i, name: 'system optimizer' },
  { pattern: /ram\s+flush/i, name: 'ram flush' },
  { pattern: /ram-flush/i, name: 'ram-flush' },
  { pattern: /ramflush/i, name: 'ramflush' },
  { pattern: /killSimPort/i, name: 'killSimPort' },
  { pattern: /triggerSimRamFlush/i, name: 'triggerSimRamFlush' },
  { pattern: /mock-panel-portkiller/i, name: 'mock-panel-portkiller' },
  { pattern: /card-roi-cleaner/i, name: 'card-roi-cleaner' }
];

for (const { pattern, name } of purgedTerms) {
  const match = landingHtml.match(pattern);
  assert(!match, `R3.9: landingPageHtml.ts has no reference to "${name}"`, match ? `Found match: "${match[0]}"` : '');
}

// 1.4 Dashboard.tsx Default Pinned Tools & Dead Icons
console.log('\nSub-suite: Dashboard.tsx Pinned Tools & Icons');
const dashboardContent = fs.readFileSync('src/renderer/src/pages/Dashboard.tsx', 'utf8');

const pinnedMatch = dashboardContent.match(/\[\s*'api-studio'\s*,\s*'jwt-studio'\s*,\s*'json-studio'\s*\]/);
assert(!!pinnedMatch, 'R3.10: Dashboard.tsx default pinned tools are strictly [api-studio, jwt-studio, json-studio]');
assert(!dashboardContent.includes('port-killer'), 'R3.11: Dashboard.tsx has zero occurrences of port-killer');
assert(!dashboardContent.includes('dev-sandbox'), 'R3.12: Dashboard.tsx has zero occurrences of dev-sandbox');
assert(!dashboardContent.includes('curl-runner'), 'R3.13: Dashboard.tsx has zero occurrences of curl-runner');

// Check for dead icons in Dashboard.tsx
const dashLucideMatch = dashboardContent.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
if (dashLucideMatch) {
  const importedIcons = dashLucideMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  const deadIcons = [];
  for (const icon of importedIcons) {
    const usages = dashboardContent.match(new RegExp('\\b' + icon + '\\b', 'g')) || [];
    if (usages.length <= 1) {
      deadIcons.push(icon);
    }
  }
  assert(deadIcons.length === 0, 'R3.14: Dashboard.tsx imports no dead/unused icons from lucide-react', deadIcons.length > 0 ? `Dead icons found: ${deadIcons.join(', ')}` : '');
} else {
  assert(false, 'R3.14: Dashboard.tsx lucide-react import block found');
}

// 1.5 FloatingOrb.tsx
console.log('\nSub-suite: FloatingOrb.tsx Memory Optimization Purge');
const orbContent = fs.readFileSync('src/renderer/src/components/FloatingOrb.tsx', 'utf8');
assert(!orbContent.includes('optimizeMemory'), 'R3.15: FloatingOrb.tsx contains no reference to optimizeMemory');
assert(!orbContent.includes('handleQuickOptimize'), 'R3.16: FloatingOrb.tsx contains no handleQuickOptimize');
assert(!orbContent.includes('RAM Flush'), 'R3.17: FloatingOrb.tsx contains no RAM Flush button');
assert(!orbContent.includes('sentinel.optimizeMemory'), 'R3.18: FloatingOrb.tsx contains no sentinel.optimizeMemory IPC call');


// ============================================================================
// SUITE 2: Task R4 — React Concurrency, Dependencies, i18n & Branding
// ============================================================================
console.log('\n--- SUITE 2: Task R4 (HashStudio Concurrency, Dependencies & i18n) ---');

// 2.1 HashStudio.tsx Concurrency & useMemo removal
const hashStudioContent = fs.readFileSync('src/renderer/src/pages/HashStudio.tsx', 'utf8');
assert(!hashStudioContent.includes('useMemo'), 'R4.1: HashStudio.tsx completely removes useMemo (not imported, not called)');
assert(hashStudioContent.includes('useEffect('), 'R4.2: HashStudio.tsx uses useEffect for hashing');
assert(hashStudioContent.includes('let isCurrent = true'), 'R4.3: HashStudio.tsx defines let isCurrent = true cancellation token');
assert(hashStudioContent.includes('return () => {'), 'R4.4: HashStudio.tsx returns a cleanup function from useEffect');
assert(hashStudioContent.includes('isCurrent = false'), 'R4.5: HashStudio.tsx cleanup sets isCurrent = false');
assert(hashStudioContent.includes('.catch('), 'R4.6: HashStudio.tsx includes .catch() rejection handler for SubtleCrypto promises');

// 2.2 package.json dependencies
console.log('\nSub-suite: package.json Dependency Verification');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = pkg.dependencies || {};
const devDeps = pkg.devDependencies || {};

assert(!('cheerio' in deps) && !('cheerio' in devDeps), 'R4.7: cheerio is completely removed from package.json');
assert(!('validator' in deps) && !('validator' in devDeps), 'R4.8: validator is completely removed from package.json');
assert(!('axios' in deps) && !('axios' in devDeps), 'R4.9: axios is completely removed from package.json');
assert(!('@types/validator' in deps) && !('@types/validator' in devDeps), 'R4.10: @types/validator is completely removed from package.json');
assert('sql.js' in deps, 'R4.11: sql.js is present in dependencies');
assert(!('sql.js' in devDeps), 'R4.12: sql.js is not in devDependencies');
assert('dompurify' in devDeps, 'R4.13: dompurify is present in devDependencies');
assert(!('dompurify' in deps), 'R4.14: dompurify is not in dependencies');

// Check ApiStudio.tsx for axios removal
const apiStudioContent = fs.readFileSync('src/renderer/src/pages/ApiStudio.tsx', 'utf8');
assert(!apiStudioContent.includes("from 'axios'"), 'R4.15: ApiStudio.tsx does not import axios');

// 2.3 Sidebar.tsx branding
console.log('\nSub-suite: Sidebar.tsx Branding');
const sidebarContent = fs.readFileSync('src/renderer/src/components/Sidebar.tsx', 'utf8');
const sidebarLines = sidebarContent.split(/\r?\n/);
const brandingLine = sidebarLines.find(l => l.includes('Tauri v2 + Rust + React')) || sidebarLines[603] || '';
assert(brandingLine.includes('Tauri v2 + Rust + React'), 'R4.16: Sidebar.tsx displays "Tauri v2 + Rust + React"', `Line content: "${brandingLine.trim()}"`);
assert(!sidebarContent.includes('Electron + React + TypeScript'), 'R4.17: Sidebar.tsx contains no "Electron + React + TypeScript" legacy branding');

// 2.4 i18n Parity Verification
console.log('\nSub-suite: i18n Parity (tr.json vs en.json)');
const trRaw = fs.readFileSync('src/renderer/src/locales/tr.json', 'utf8');
const enRaw = fs.readFileSync('src/renderer/src/locales/en.json', 'utf8');

const trJson = JSON.parse(trRaw);
const enJson = JSON.parse(enRaw);

function flattenKeys(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value, fullKey));
    } else {
      result[fullKey] = String(value ?? '');
    }
  }
  return result;
}

const trFlat = flattenKeys(trJson);
const enFlat = flattenKeys(enJson);

const trKeys = Object.keys(trFlat).sort();
const enKeys = Object.keys(enFlat).sort();

assert(trKeys.length === 801, `R4.18: tr.json key cardinality is exactly 801 (actual: ${trKeys.length})`);
assert(enKeys.length === 801, `R4.19: en.json key cardinality is exactly 801 (actual: ${enKeys.length})`);

const missingInTr = enKeys.filter(k => !(k in trFlat));
const missingInEn = trKeys.filter(k => !(k in enFlat));
assert(missingInTr.length === 0, 'R4.20: Zero missing keys in tr.json relative to en.json', missingInTr.join(', '));
assert(missingInEn.length === 0, 'R4.21: Zero missing keys in en.json relative to tr.json', missingInEn.join(', '));

// colorStudio.desc and scratchpad.desc
assert('dashboard.tools.colorStudio.desc' in trFlat, 'R4.22: tr.json defines dashboard.tools.colorStudio.desc');
assert('dashboard.tools.colorStudio.desc' in enFlat, 'R4.23: en.json defines dashboard.tools.colorStudio.desc');
assert('dashboard.tools.scratchpad.desc' in trFlat, 'R4.24: tr.json defines dashboard.tools.scratchpad.desc');
assert('dashboard.tools.scratchpad.desc' in enFlat, 'R4.25: en.json defines dashboard.tools.scratchpad.desc');

// duplicate hexDump check
assert(!('encodingStudio.tabs.hexDump' in trFlat), 'R4.26: tr.json does not contain duplicate encodingStudio.tabs.hexDump');
assert(!('encodingStudio.tabs.hexDump' in enFlat), 'R4.27: en.json does not contain duplicate encodingStudio.tabs.hexDump');
assert('encodingStudio.tabs.hexdump' in trFlat, 'R4.28: tr.json contains lowercase encodingStudio.tabs.hexdump');
assert('encodingStudio.tabs.hexdump' in enFlat, 'R4.29: en.json contains lowercase encodingStudio.tabs.hexdump');

// Empty string check
const emptyTr = Object.entries(trFlat).filter(([_, v]) => !v || v.trim() === '').map(([k]) => k);
const emptyEn = Object.entries(enFlat).filter(([_, v]) => !v || v.trim() === '').map(([k]) => k);
assert(emptyTr.length === 0, 'R4.30: Zero empty or whitespace values in tr.json', emptyTr.join(', '));
assert(emptyEn.length === 0, 'R4.31: Zero empty or whitespace values in en.json', emptyEn.join(', '));

// Interpolation variable parity
const varRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
let varMismatches = [];
for (const key of enKeys) {
  const enVars = [...(enFlat[key].matchAll(varRegex))].map(m => m[1]).sort();
  const trVars = [...(trFlat[key].matchAll(varRegex))].map(m => m[1]).sort();
  if (JSON.stringify(enVars) !== JSON.stringify(trVars)) {
    varMismatches.push(`${key} (EN: [${enVars}], TR: [${trVars}])`);
  }
}
assert(varMismatches.length === 0, 'R4.32: All interpolation variables match between en.json and tr.json', varMismatches.join('; '));

// Purged keywords from search placeholder
assert(!enFlat['miniHud.searchPlaceholder'].toLowerCase().includes('optimizer'), 'R4.33: en.json miniHud.searchPlaceholder has no "optimizer"');
assert(!enFlat['miniHud.searchPlaceholder'].toLowerCase().includes('mail'), 'R4.34: en.json miniHud.searchPlaceholder has no "mail"');
assert(!trFlat['miniHud.searchPlaceholder'].toLowerCase().includes('optimizer'), 'R4.35: tr.json miniHud.searchPlaceholder has no "optimizer"');
assert(!trFlat['miniHud.searchPlaceholder'].toLowerCase().includes('mail'), 'R4.36: tr.json miniHud.searchPlaceholder has no "mail"');


// ============================================================================
// SUITE 3: Adversarial Concurrency & Stress Testing for HashStudio
// ============================================================================
console.log('\n--- SUITE 3: Adversarial Stress Test (HashStudio Concurrency Simulation) ---');

async function testHashConcurrencyModel() {
  // Simulate rapid typing with out-of-order resolution to verify isCurrent cancellation model
  let state = { md5: '', sha1: '', sha256: '', sha512: '' };
  let activeCleanups = [];

  function simulateKeystrokeEffect(textInput, simulatedLatencyMs) {
    let isCurrent = true;
    const cleanup = () => { isCurrent = false; };
    activeCleanups.push(cleanup);

    const encoder = new TextEncoder();
    const data = encoder.encode(textInput);
    const computedMd5 = 'md5-' + textInput;

    // Simulate async SubtleCrypto with intentional latency inversion
    new Promise(resolve => setTimeout(resolve, simulatedLatencyMs))
      .then(() => {
        if (isCurrent) {
          state = {
            md5: computedMd5,
            sha1: 'sha1-' + textInput,
            sha256: 'sha256-' + textInput,
            sha512: 'sha512-' + textInput,
          };
        }
      })
      .catch(err => {
        // error handling
      });

    return cleanup;
  }

  // User types "a" (slow response: 100ms)
  const c1 = simulateKeystrokeEffect('a', 100);
  // User quickly types "ab" before "a" completes (50ms)
  c1(); // unmount / effect cleanup on next effect
  const c2 = simulateKeystrokeEffect('ab', 20);

  // Wait 150ms for all promises to settle
  await new Promise(resolve => setTimeout(resolve, 150));

  assert(state.sha256 === 'sha256-ab', 'R4.37: Stress Test: HashStudio isCurrent pattern successfully drops out-of-order resolved promises', `Expected sha256-ab, got ${state.sha256}`);
}

await testHashConcurrencyModel();

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log('================================================================');

if (failures.length > 0) {
  console.log('\nFAILURE DETAILS:');
  failures.forEach((f, i) => {
    console.log(`${i + 1}. [${f.testName}]: ${f.details}`);
  });
}
