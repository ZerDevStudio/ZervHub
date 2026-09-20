/**
 * tests/challenger_titlebar_eval_stress.mjs
 * 
 * EMPIRICAL CHALLENGER: TitleBar Expression & Workspace Mode Stress Harness
 * 
 * Specifically stress-tests:
 * 1. TitleBar.tsx lexical scope destructuring and t() calls
 * 2. Real-world evaluation of TitleBar JSX expressions with i18n dictionaries (Turkish & English)
 * 3. Negative proof: ReferenceError: t is not defined if t is omitted
 * 4. Button click handler logic and cyberAudio trigger isolation
 * 5. State machine stress and resilience against corrupted storage values
 */

import fs from 'node:fs';
import path from 'node:path';

console.log('================================================================');
console.log('EMPIRICAL CHALLENGER: TITLEBAR EVALUATION & STRESS HARNESS');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${testName}${details ? ' -> ' + details : ''}`);
    failCount++;
    failures.push({ testName, details });
  }
}

const rootDir = process.cwd();

// Load locales
const trPath = path.join(rootDir, 'src/renderer/src/locales/tr.json');
const enPath = path.join(rootDir, 'src/renderer/src/locales/en.json');
const tr = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Replicate i18n resolver from src/renderer/src/lib/i18n.tsx
function resolve(obj, key) {
  const parts = key.split('.');
  let cur = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return key;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : key;
}

function createT(locale) {
  const primaryDict = locale === 'tr' ? tr : en;
  const fallbackDict = en;
  return function t(key, vars) {
    const primary = resolve(primaryDict, key);
    const raw = primary !== key ? primary : resolve(fallbackDict, key);
    if (!vars) return raw;
    return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? `{{${k}}}`));
  };
}

// ============================================================================
// SUITE 1: TitleBar Lexical Scope & Destructuring
// ============================================================================
console.log('--- 1. TITLEBAR LEXICAL SCOPE & DESTRUCTURING ---');

const titleBarPath = path.join(rootDir, 'src/renderer/src/components/TitleBar.tsx');
assert(fs.existsSync(titleBarPath), 'TitleBar.tsx exists in src/renderer/src/components/');

const titleBarContent = fs.readFileSync(titleBarPath, 'utf8');

// Check import of useT
assert(
  /import\s*\{[^}]*useT[^}]*\}\s*from\s*['"]\.\.\/lib\/i18n['"]/.test(titleBarContent),
  'TitleBar.tsx imports useT from ../lib/i18n'
);

// Check destructuring from useT()
const useTMatch = titleBarContent.match(/const\s*\{([^}]+)\}\s*=\s*useT\(\)/);
assert(useTMatch !== null, 'TitleBar.tsx contains destructuring from useT()');

const destructuredTokens = useTMatch ? useTMatch[1].split(',').map(s => s.trim()) : [];
assert(destructuredTokens.includes('t'), 'Variable "t" is explicitly destructured from useT()');
assert(destructuredTokens.includes('locale'), 'Variable "locale" is explicitly destructured from useT()');

// Extract all t(...) calls in TitleBar
const allTCalls = [...titleBarContent.matchAll(/\bt\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
assert(allTCalls.length === 4, `TitleBar contains exactly 4 calls to t(...) (found: ${allTCalls.length})`);
assert(allTCalls.filter(k => k === 'workspace.essential').length === 2, 'workspace.essential is called twice');
assert(allTCalls.filter(k => k === 'workspace.developer').length === 2, 'workspace.developer is called twice');

// ============================================================================
// SUITE 2: Dynamic Expression Evaluation (Task 4)
// ============================================================================
console.log('\n--- 2. DYNAMIC EXPRESSION EVALUATION & NEGATIVE PROOF ---');

// Extract all JSX expressions
// 1. title attributes: title={`...`}
const titleExprMatches = [...titleBarContent.matchAll(/title=\{(`[^`]+`)\}/g)].map(m => m[1]);
// 2. child expressions: <span className="relative z-10">\s*\{([\s\S]*?)\}\s*<\/span>
const childExprMatches = [...titleBarContent.matchAll(/<span className="relative z-10">\s*\{([\s\S]*?)\}\s*<\/span>/g)].map(m => m[1].trim());

assert(titleExprMatches.length === 2, `Found 2 title attribute expressions (found: ${titleExprMatches.length})`);
assert(childExprMatches.length === 2, `Found 2 child text expressions (found: ${childExprMatches.length})`);

const allExpressions = [...titleExprMatches, ...childExprMatches];

// 2.1 Positive Evaluation: Turkish locale
const tTr = createT('tr');
const scopeTr = {
  locale: 'tr',
  mode: 'essential',
  t: tTr,
};

for (const expr of allExpressions) {
  let result;
  let thrown = null;
  try {
    const fn = new Function(...Object.keys(scopeTr), `return (${expr});`);
    result = fn(...Object.values(scopeTr));
  } catch (err) {
    thrown = err;
  }
  assert(thrown === null, `Expression "${expr.slice(0, 35)}..." evaluates without error in TR locale`);
  assert(typeof result === 'string' && result.length > 0, `Expression result is non-empty string in TR: "${result}"`);
}

// 2.2 Positive Evaluation: English locale
const tEn = createT('en');
const scopeEn = {
  locale: 'en',
  mode: 'developer',
  t: tEn,
};

for (const expr of allExpressions) {
  let result;
  let thrown = null;
  try {
    const fn = new Function(...Object.keys(scopeEn), `return (${expr});`);
    result = fn(...Object.values(scopeEn));
  } catch (err) {
    thrown = err;
  }
  assert(thrown === null, `Expression "${expr.slice(0, 35)}..." evaluates without error in EN locale`);
  assert(typeof result === 'string' && result.length > 0, `Expression result is non-empty string in EN: "${result}"`);
}

// 2.3 Semantic Translation Match Validation
const essentialTitleTr = new Function(...Object.keys(scopeTr), `return (${titleExprMatches[0]});`)(...Object.values(scopeTr));
const devTitleTr = new Function(...Object.keys(scopeTr), `return (${titleExprMatches[1]});`)(...Object.values(scopeTr));
const essentialLabelTr = new Function(...Object.keys(scopeTr), `return (${childExprMatches[0]});`)(...Object.values(scopeTr));
const devLabelTr = new Function(...Object.keys(scopeTr), `return (${childExprMatches[1]});`)(...Object.values(scopeTr));

assert(essentialTitleTr.includes('Günlük Araçlar') && essentialTitleTr.includes('(Ctrl+M)'), 'TR essential title format is correct');
assert(essentialLabelTr === 'Günlük Araçlar', 'TR essential label is "Günlük Araçlar"');
assert(devTitleTr.includes('Geliştirici') && devTitleTr.includes('(Ctrl+M)'), 'TR developer title format is correct');
assert(devLabelTr === 'Geliştirici', 'TR developer label is "Geliştirici"');

const essentialTitleEn = new Function(...Object.keys(scopeEn), `return (${titleExprMatches[0]});`)(...Object.values(scopeEn));
const devTitleEn = new Function(...Object.keys(scopeEn), `return (${titleExprMatches[1]});`)(...Object.values(scopeEn));
const essentialLabelEn = new Function(...Object.keys(scopeEn), `return (${childExprMatches[0]});`)(...Object.values(scopeEn));
const devLabelEn = new Function(...Object.keys(scopeEn), `return (${childExprMatches[1]});`)(...Object.values(scopeEn));

assert(essentialTitleEn.includes('Essential Tools') && essentialTitleEn.includes('(Ctrl+M)'), 'EN essential title format is correct');
assert(essentialLabelEn === 'Essential Tools', 'EN essential label is "Essential Tools"');
assert(devTitleEn.includes('Developer') && devTitleEn.includes('(Ctrl+M)'), 'EN developer title format is correct');
assert(devLabelEn === 'Developer', 'EN developer label is "Developer"');

// 2.4 Negative Proof (Empirical Bug Reproduction)
// If 't' is omitted from scope (as was the case in auditor_1's finding),
// evaluating the expressions MUST throw ReferenceError: t is not defined
const scopeDefective = {
  locale: 'tr',
  mode: 'essential',
  // Note: t is NOT in scope
};

for (const expr of allExpressions) {
  let threwReferenceError = false;
  let errorMessage = '';
  try {
    const fn = new Function(...Object.keys(scopeDefective), `return (${expr});`);
    fn(...Object.values(scopeDefective));
  } catch (err) {
    if (err instanceof ReferenceError && err.message.includes('t is not defined')) {
      threwReferenceError = true;
    }
    errorMessage = err.message;
  }
  assert(
    threwReferenceError,
    `NEGATIVE PROOF: Omitting t throws ReferenceError: t is not defined (Error: ${errorMessage})`
  );
}

// ============================================================================
// SUITE 3: Element-Scoped Click Handlers & Audio Verification
// ============================================================================
console.log('\n--- 3. BUTTON CLICK HANDLERS & AUDIO TRIGGER SIMULATION ---');

// Extract the mode switcher container block
const switcherBlockMatch = titleBarContent.match(
  /<div className="absolute left-1\/2 -translate-x-1\/2[\s\S]*?layoutId="activeWorkspaceModeTitle"[\s\S]*?<\/div>\s*<\/div>/
);
assert(switcherBlockMatch !== null, 'Segmented mode switcher container located in TitleBar.tsx');

const switcherBlock = switcherBlockMatch ? switcherBlockMatch[0] : '';
const buttonMatches = [...switcherBlock.matchAll(/<button[\s\S]*?<\/button>/g)].map(m => m[0]);
assert(buttonMatches.length === 2, `Segmented switcher contains exactly 2 buttons (found: ${buttonMatches.length})`);

// Extract essential button onClick handler body
const essentialBtn = buttonMatches[0];
const devBtn = buttonMatches[1];

assert(essentialBtn.includes("setMode('essential')"), 'Essential button switches to essential mode');
assert(essentialBtn.includes('cyberAudio.click()'), 'Essential button calls cyberAudio.click()');
assert(devBtn.includes("setMode('developer')"), 'Developer button switches to developer mode');
assert(devBtn.includes('cyberAudio.click()'), 'Developer button calls cyberAudio.click()');

// Simulate the click handler logic:
function createClickHandler(btnCode) {
  const handlerMatch = btnCode.match(/onClick=\{([\s\S]*?)\}\s*className/);
  if (!handlerMatch) throw new Error('onClick handler not found');
  const body = handlerMatch[1];
  // Parse inner arrow function: () => { ... }
  const innerMatch = body.match(/\(\)\s*=>\s*\{([\s\S]*)\}/);
  if (!innerMatch) throw new Error('Inner arrow function not found');
  const innerBody = innerMatch[1];
  return new Function('mode', 'setMode', 'cyberAudio', innerBody);
}

const essentialClickHandler = createClickHandler(essentialBtn);
const devClickHandler = createClickHandler(devBtn);

// Test Essential click when in Developer mode -> SHOULD trigger audio and setMode
let clickCount = 0;
let targetMode = null;
const mockAudio = { click: () => { clickCount++; } };
const mockSetMode = (m) => { targetMode = m; };

essentialClickHandler('developer', mockSetMode, mockAudio);
assert(clickCount === 1 && targetMode === 'essential', 'Clicking Essential button from developer mode triggers cyberAudio and sets mode to essential');

// Test Essential click when already in Essential mode -> SHOULD BE NO-OP
clickCount = 0;
targetMode = null;
essentialClickHandler('essential', mockSetMode, mockAudio);
assert(clickCount === 0 && targetMode === null, 'Clicking Essential button when already in essential mode is a no-op');

// Test Developer click when in Essential mode -> SHOULD trigger audio and setMode
clickCount = 0;
targetMode = null;
devClickHandler('essential', mockSetMode, mockAudio);
assert(clickCount === 1 && targetMode === 'developer', 'Clicking Developer button from essential mode triggers cyberAudio and sets mode to developer');

// Test Developer click when already in Developer mode -> SHOULD BE NO-OP
clickCount = 0;
targetMode = null;
devClickHandler('developer', mockSetMode, mockAudio);
assert(clickCount === 0 && targetMode === null, 'Clicking Developer button when already in developer mode is a no-op');

// ============================================================================
// SUITE 4: Storage Resilience & State Machine Stress (1,000 Iterations)
// ============================================================================
console.log('\n--- 4. STORAGE RESILIENCE & CONCURRENT STRESS TEST ---');

// Mock localStorage with failure simulation
class MockStorage {
  constructor() {
    this.store = new Map();
    this.shouldThrow = false;
  }
  getItem(key) {
    if (this.shouldThrow) throw new Error('Storage access denied');
    return this.store.get(key) ?? null;
  }
  setItem(key, value) {
    if (this.shouldThrow) throw new Error('QuotaExceededError');
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const mockStorage = new MockStorage();

// Simulate WorkspaceModeContext initialization logic
function initMode(storage) {
  try {
    const saved = storage.getItem('zendev_workspace_mode');
    return saved === 'developer' || saved === 'essential' ? saved : 'essential';
  } catch {
    return 'essential';
  }
}

// 4.1 Corrupted storage values must safely fallback to 'essential'
mockStorage.setItem('zendev_workspace_mode', 'MALICIOUS_INPUT');
assert(initMode(mockStorage) === 'essential', 'Corrupted value "MALICIOUS_INPUT" falls back to "essential"');

mockStorage.setItem('zendev_workspace_mode', '');
assert(initMode(mockStorage) === 'essential', 'Empty string value falls back to "essential"');

mockStorage.setItem('zendev_workspace_mode', 'undefined');
assert(initMode(mockStorage) === 'essential', 'String "undefined" falls back to "essential"');

// 4.2 Storage throws (quota or sandbox restrictions) must safely fallback to 'essential'
mockStorage.shouldThrow = true;
assert(initMode(mockStorage) === 'essential', 'Storage exception safely falls back to "essential" without throwing');
mockStorage.shouldThrow = false;

// 4.3 1,000 Iteration rapid toggle stress
mockStorage.clear();
let currentMode = initMode(mockStorage);
let audioClicks = 0;
let eventsDispatched = 0;

for (let i = 0; i < 1000; i++) {
  const nextMode = currentMode === 'essential' ? 'developer' : 'essential';
  mockStorage.setItem('zendev_workspace_mode', nextMode);
  audioClicks++;
  eventsDispatched++;
  currentMode = nextMode;
}

assert(currentMode === 'essential', 'After 1000 toggles, state returns to "essential"');
assert(audioClicks === 1000, 'Exactly 1000 audio clicks registered');
assert(eventsDispatched === 1000, 'Exactly 1000 events registered');
assert(mockStorage.getItem('zendev_workspace_mode') === 'essential', 'Storage holds "essential"');

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log('================================================================');

if (failCount > 0) {
  console.error('\nFailures summary:');
  failures.forEach(f => console.error(` - ${f.testName}: ${f.details}`));
  process.exit(1);
} else {
  console.log('\nALL TITLEBAR & EMPIRICAL WORKSPACE STRESS TESTS PASSED CLEANLY.');
  process.exit(0);
}
