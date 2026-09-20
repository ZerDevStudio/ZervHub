import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

const rootDir = process.cwd();

console.log('================================================================');
console.log('CHALLENGER ITER2_2: DEEP EMPIRICAL VERIFICATION HARNESS');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// -------------------------------------------------------------
// SUITE 1: TitleBar.tsx Forensic & Runtime Scope Verification
// -------------------------------------------------------------
console.log('--- SUITE 1: TitleBar.tsx Forensic Scope & Runtime Execution ---');

const titleBarPath = path.join(rootDir, 'src/renderer/src/components/TitleBar.tsx');
const titleBarContent = fs.readFileSync(titleBarPath, 'utf8');

test('TB1.1: TitleBar.tsx exists and is readable', () => {
  assert(fs.existsSync(titleBarPath), 'TitleBar.tsx missing');
  assert(titleBarContent.length > 500, 'TitleBar.tsx is too short');
});

test('TB1.2: useT() destructures t and locale explicitly', () => {
  const match = titleBarContent.match(/const\s*\{([^}]+)\}\s*=\s*useT\(\)/);
  assert(match, 'useT() destructuring not found');
  const vars = match[1].split(',').map((v) => v.trim());
  assert(vars.includes('t'), "'t' is missing from useT() destructuring in TitleBar.tsx");
  assert(vars.includes('locale'), "'locale' is missing from useT() destructuring in TitleBar.tsx");
});

test('TB1.3: All t(...) calls in TitleBar.tsx resolve without ReferenceError in simulated component scope', () => {
  const trData = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/renderer/src/locales/tr.json'), 'utf8'));
  const enData = JSON.parse(fs.readFileSync(path.join(rootDir, 'src/renderer/src/locales/en.json'), 'utf8'));

  // Flatten helper
  function flatten(obj, prefix = '') {
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
      const full = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object') {
        Object.assign(res, flatten(v, full));
      } else {
        res[full] = String(v);
      }
    }
    return res;
  }
  const trFlat = flatten(trData);
  const enFlat = flatten(enData);

  // Extract all t('...') occurrences
  const tCalls = [...titleBarContent.matchAll(/\bt\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
  assert(tCalls.length >= 2, 'Expected at least 2 t() calls in TitleBar');

  for (const key of tCalls) {
    assert(trFlat[key], `Key ${key} missing in tr.json`);
    assert(enFlat[key], `Key ${key} missing in en.json`);
  }

  // Simulate TitleBar scope evaluation
  const mockScopeTr = {
    t: (key) => trFlat[key] || key,
    locale: 'tr',
    mode: 'essential',
    setMode: () => {},
  };

  const exprMatches = [...titleBarContent.matchAll(/\{([^}{]+)\}/g)]
    .map((m) => m[1].trim())
    .filter((e) => e.includes("t('workspace."));

  assert(exprMatches.length === 4, `Expected 4 expressions in TitleBar referencing t('workspace.'), found ${exprMatches.length}`);

  for (const expr of exprMatches) {
    const fn = new Function(...Object.keys(mockScopeTr), `return (${expr});`);
    const val = fn(...Object.values(mockScopeTr));
    assert(typeof val === 'string' && val.length > 0, `Expression ${expr} returned empty or invalid string`);
  }
});

test('TB1.4: TitleBar segmented buttons have element-scoped cyberAudio.click() and correct setMode calls', () => {
  const switcherMatch = titleBarContent.match(
    /<div className="absolute left-1\/2 -translate-x-1\/2[\s\S]*?layoutId="activeWorkspaceModeTitle"[\s\S]*?<\/div>\s*<\/div>/
  );
  assert(switcherMatch, 'Segmented switcher block not found in TitleBar.tsx');
  const block = switcherMatch[0];

  const buttons = [...block.matchAll(/<button[\s\S]*?<\/button>/g)].map((m) => m[0]);
  assert(buttons.length === 2, `Expected 2 buttons in switcher block, found ${buttons.length}`);

  const [btnEssential, btnDeveloper] = buttons;

  assert(btnEssential.includes("setMode('essential')"), 'Essential button missing setMode("essential")');
  assert(btnEssential.includes('cyberAudio.click()'), 'Essential button missing element-level cyberAudio.click()');

  assert(btnDeveloper.includes("setMode('developer')"), 'Developer button missing setMode("developer")');
  assert(btnDeveloper.includes('cyberAudio.click()'), 'Developer button missing element-level cyberAudio.click()');
});

// -------------------------------------------------------------
// SUITE 2: WorkspaceModeContext.tsx Contract & Side Effect Hygiene
// -------------------------------------------------------------
console.log('\n--- SUITE 2: WorkspaceModeContext.tsx Contract & Side Effect Hygiene ---');

const ctxPath = path.join(rootDir, 'src/renderer/src/context/WorkspaceModeContext.tsx');
const ctxContent = fs.readFileSync(ctxPath, 'utf8');

test('CTX2.1: Context file has valid default export', () => {
  assert(ctxContent.includes('export default WorkspaceModeProvider;'), 'Missing export default WorkspaceModeProvider;');
});

test('CTX2.2: toggleMode uses modeRef.current without side-effects inside state updater', () => {
  assert(ctxContent.includes('modeRef = useRef'), 'modeRef not declared with useRef');
  assert(ctxContent.includes('const next = modeRef.current === \'essential\' ? \'developer\' : \'essential\''), 'toggleMode does not derive next from modeRef.current');
  assert(!ctxContent.includes('setModeState((current) =>'), 'Found side-effect prone functional updater setModeState((current) => ...');
});

test('CTX2.3: lib/WorkspaceModeContext.tsx re-exports without TS2614 violation', () => {
  const libPath = path.join(rootDir, 'src/renderer/src/lib/WorkspaceModeContext.tsx');
  const libContent = fs.readFileSync(libPath, 'utf8');

  assert(libContent.includes("export * from '../context/WorkspaceModeContext'"), 'Missing named re-exports');
  assert(libContent.includes("export { WorkspaceModeProvider as default } from '../context/WorkspaceModeContext';"), 'Missing explicit named-as-default re-export');
  assert(!libContent.match(/export\s*\{\s*default\s*\}\s*from/), 'Found illegal export { default } causing TS2614');
});

// -------------------------------------------------------------
// SUITE 3: Sidebar & Route Guard Integrity
// -------------------------------------------------------------
console.log('\n--- SUITE 3: Sidebar Partitioning & Route Guard Integrity ---');

const sidebarPath = path.join(rootDir, 'src/renderer/src/components/Sidebar.tsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
const appPath = path.join(rootDir, 'src/renderer/src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');

test('SB3.1: Sidebar exports ESSENTIAL_NAV_GROUPS with 3 groups and exactly 9 consumer tools', () => {
  assert(sidebarContent.includes('export const ESSENTIAL_NAV_GROUPS'), 'Missing ESSENTIAL_NAV_GROUPS');
  assert(sidebarContent.includes('export const DEVELOPER_NAV_GROUPS'), 'Missing DEVELOPER_NAV_GROUPS');

  const startIdx = sidebarContent.indexOf('export const ESSENTIAL_NAV_GROUPS');
  const endIdx = sidebarContent.indexOf('export const DEVELOPER_NAV_GROUPS');
  const essentialSection = sidebarContent.substring(startIdx, endIdx);

  const paths = [...essentialSection.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.strictEqual(paths.length, 9, `Expected 9 paths in ESSENTIAL_NAV_GROUPS, found ${paths.length}: ${paths.join(', ')}`);

  const expectedPaths = [
    '/decrypter',
    '/fortress',
    '/password',
    '/pdf-studio',
    '/image',
    '/organizer',
    '/qr-code',
    '/scratchpad',
    '/color-studio',
  ];
  for (const ep of expectedPaths) {
    assert(paths.includes(ep), `Expected essential path ${ep} not found in ESSENTIAL_NAV_GROUPS`);
  }
});

test('SB3.2: Sidebar accessible toggle button has switch role and aria-checked', () => {
  assert(sidebarContent.includes('role="switch"'), 'Sidebar missing role="switch"');
  assert(sidebarContent.includes("aria-checked={mode === 'developer'}"), 'Sidebar missing aria-checked');
});

test('APP3.3: App.tsx enforces DEV_ONLY_ROUTES and displays warning banner when restricted route is active', () => {
  assert(appContent.includes('DEV_ONLY_ROUTES'), 'Missing DEV_ONLY_ROUTES in App.tsx');
  assert(appContent.includes('isEssential && isDevRoute'), 'Missing isEssential && isDevRoute guard check in App.tsx');
  assert(appContent.includes("setMode('developer')"), 'Missing quick-action to switch to developer mode');
});

// -------------------------------------------------------------
// SUITE 4: CommandPalette & Dashboard Alignment
// -------------------------------------------------------------
console.log('\n--- SUITE 4: CommandPalette & Dashboard Alignment ---');

const cpPath = path.join(rootDir, 'src/renderer/src/components/CommandPalette.tsx');
const cpContent = fs.readFileSync(cpPath, 'utf8');
const dashPath = path.join(rootDir, 'src/renderer/src/pages/Dashboard.tsx');
const dashContent = fs.readFileSync(dashPath, 'utf8');

test('CP4.1: CommandPalette filters developerOnly items when mode is essential', () => {
  assert(cpContent.includes('developerOnly?: boolean'), 'CommandPalette missing developerOnly property');
  assert(cpContent.includes("mode === 'essential' && item.developerOnly"), 'CommandPalette missing essential filter check');
  assert(cpContent.includes('toggle-workspace-mode'), 'CommandPalette missing toggle-workspace-mode action');
});

test('DB4.2: Dashboard filters tools dynamically and renders Pro banner in essential mode', () => {
  assert(dashContent.includes("return mode === 'essential' ? tools.filter((t) => !t.developerOnly) : tools"), 'Dashboard missing visibleTools filter logic');
  assert(dashContent.includes('Pro Geliştirici Stüdyoları'), 'Dashboard missing Pro banner copy');
  assert(dashContent.includes("setMode('developer')"), 'Dashboard missing 1-click Pro mode activation');
});

// -------------------------------------------------------------
// SUITE 5: Zero Prohibited Module Trace Check
// -------------------------------------------------------------
console.log('\n--- SUITE 5: Zero Prohibited Module Trace (SaaS Directive Principle 2) ---');

const bannedTerms = ['portkiller', 'port-killer', 'systemoptimizer', 'system-optimizer', 'temp-mail', 'tempmail'];
const auditFiles = [
  titleBarPath,
  ctxPath,
  sidebarPath,
  appPath,
  cpPath,
  dashPath,
];

for (const f of auditFiles) {
  const relName = path.relative(rootDir, f);
  test(`REG5.1: ${relName} is free of prohibited module traces`, () => {
    const c = fs.readFileSync(f, 'utf8').toLowerCase();
    for (const b of bannedTerms) {
      assert(!c.includes(b), `Found prohibited term "${b}" in ${relName}`);
    }
  });
}

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
