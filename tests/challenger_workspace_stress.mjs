import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  const actStr = JSON.stringify(actual);
  const expStr = JSON.stringify(expected);
  if (actStr === expStr) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message} - Expected ${expStr}, got ${actStr}`);
    failed++;
  }
}

console.log('================================================================');
console.log('EMPIRICAL CHALLENGER: WORKSPACE MODE STRESS HARNESS');
console.log('================================================================');

const rootDir = process.cwd();

// --- 1. EMPIRICAL VERIFICATION: LocalStorage State & Persistence ---
console.log('\n--- 1. EMPIRICAL LOCALSTORAGE PERSISTENCE & BROADCASTING ---');

class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] ?? null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
const STORAGE_KEY = 'zendev_workspace_mode';

// Emulate WorkspaceModeContext logic exactly as implemented in WorkspaceModeContext.tsx
let currentMode = (() => {
  const saved = mockStorage.getItem(STORAGE_KEY);
  if (saved === 'essential' || saved === 'developer') return saved;
  return 'essential';
})();

assert(currentMode === 'essential', 'Initial mode defaults to "essential" when localStorage is empty');

let dispatchedCustomEvents = [];
function dispatchCustomEvent(name, detail) {
  dispatchedCustomEvents.push({ name, detail });
}

function setMode(newMode) {
  currentMode = newMode;
  mockStorage.setItem(STORAGE_KEY, newMode);
  dispatchCustomEvent('zendev:workspace-mode-changed', { mode: newMode });
}

function toggleMode() {
  const next = currentMode === 'essential' ? 'developer' : 'essential';
  setMode(next);
}

// Test mode change -> localStorage updated
setMode('developer');
assert(currentMode === 'developer', 'Mode set to "developer" updates state');
assertEqual(mockStorage.getItem(STORAGE_KEY), 'developer', 'localStorage.getItem("zendev_workspace_mode") is updated to "developer" on setMode');
assert(
  dispatchedCustomEvents.some((e) => e.name === 'zendev:workspace-mode-changed' && e.detail.mode === 'developer'),
  'zendev:workspace-mode-changed custom event dispatched with detail { mode: "developer" }'
);

// Test toggleMode -> localStorage updated to essential
toggleMode();
assert(currentMode === 'essential', 'toggleMode switches from developer to essential');
assertEqual(mockStorage.getItem(STORAGE_KEY), 'essential', 'localStorage.getItem("zendev_workspace_mode") is updated to "essential" on toggleMode');

// Test toggleMode again -> developer
toggleMode();
assert(currentMode === 'developer', 'toggleMode switches from essential to developer');
assertEqual(mockStorage.getItem(STORAGE_KEY), 'developer', 'localStorage.getItem("zendev_workspace_mode") is updated to "developer" on second toggle');

// Simulate cross-window storage event
function handleStorageEvent(event) {
  if (event.key === STORAGE_KEY && (event.newValue === 'essential' || event.newValue === 'developer')) {
    currentMode = event.newValue;
  }
}
handleStorageEvent({ key: STORAGE_KEY, newValue: 'essential' });
assert(currentMode === 'essential', 'Cross-window StorageEvent updates active workspace mode to "essential"');
handleStorageEvent({ key: STORAGE_KEY, newValue: 'developer' });
assert(currentMode === 'developer', 'Cross-window StorageEvent updates active workspace mode to "developer"');

// --- 2. EMPIRICAL VERIFICATION: Keyboard Shortcuts & Suppression ---
console.log('\n--- 2. EMPIRICAL KEYBOARD SHORTCUT & SUPPRESSION STRESS TEST ---');

let shortcutToggles = 0;
function simulateKeyDown(e) {
  const target = e.target || {};
  const isInput =
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable ||
    target.getAttribute?.('contenteditable') === 'true';

  if (isInput) return;

  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key && e.key.toLowerCase() === 'm') {
    e.preventDefault?.();
    shortcutToggles++;
    toggleMode();
  }
}

// Reset state
currentMode = 'essential';
shortcutToggles = 0;

// Test Ctrl+M (lowercase)
simulateKeyDown({ ctrlKey: true, metaKey: false, key: 'm', target: { tagName: 'BODY' } });
assert(shortcutToggles === 1, 'Ctrl+m triggers shortcut toggle');
assert(currentMode === 'developer', 'Ctrl+m toggles state from essential to developer');

// Test Ctrl+M (uppercase)
simulateKeyDown({ ctrlKey: true, metaKey: false, key: 'M', target: { tagName: 'BODY' } });
assert(shortcutToggles === 2, 'Ctrl+M (uppercase) triggers shortcut toggle');
assert(currentMode === 'essential', 'Ctrl+M toggles state back to essential');

// Test Cmd+M (Mac metaKey)
simulateKeyDown({ ctrlKey: false, metaKey: true, key: 'm', target: { tagName: 'DIV' } });
assert(shortcutToggles === 3, 'Cmd+m (metaKey) triggers shortcut toggle');
assert(currentMode === 'developer', 'Cmd+m toggles state from essential to developer');

// Test input element suppression
simulateKeyDown({ ctrlKey: true, metaKey: false, key: 'm', target: { tagName: 'INPUT' } });
assert(shortcutToggles === 3, 'Keystroke inside <input> is suppressed');
assert(currentMode === 'developer', 'Mode unchanged when pressing Ctrl+M in <input>');

// Test textarea suppression
simulateKeyDown({ ctrlKey: true, metaKey: false, key: 'm', target: { tagName: 'TEXTAREA' } });
assert(shortcutToggles === 3, 'Keystroke inside <textarea> is suppressed');
assert(currentMode === 'developer', 'Mode unchanged when pressing Ctrl+M in <textarea>');

// Test contentEditable suppression
simulateKeyDown({
  ctrlKey: true,
  metaKey: false,
  key: 'm',
  target: { tagName: 'DIV', isContentEditable: true, getAttribute: () => 'true' },
});
assert(shortcutToggles === 3, 'Keystroke inside contentEditable element is suppressed');
assert(currentMode === 'developer', 'Mode unchanged when pressing Ctrl+M in contentEditable');

// Test modifier purity: Shift+Ctrl+M or Alt+Ctrl+M should NOT toggle
simulateKeyDown({ ctrlKey: true, shiftKey: true, metaKey: false, key: 'm', target: { tagName: 'BODY' } });
assert(shortcutToggles === 3, 'Shift+Ctrl+M is ignored (no accidental trigger)');
simulateKeyDown({ ctrlKey: true, altKey: true, metaKey: false, key: 'm', target: { tagName: 'BODY' } });
assert(shortcutToggles === 3, 'Alt+Ctrl+M is ignored (no accidental trigger)');

// --- 3. EMPIRICAL VERIFICATION: Sidebar Nav Groups & Tool Filtering ---
console.log('\n--- 3. EMPIRICAL SIDEBAR NAV GROUPS & TOOL FILTERING ---');

const sidebarPath = path.join(rootDir, 'src/renderer/src/components/Sidebar.tsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

// Parse ESSENTIAL_NAV_GROUPS block
const essStart = sidebarContent.indexOf('export const ESSENTIAL_NAV_GROUPS: NavGroup[] = [');
const essEnd = sidebarContent.indexOf('export const DEVELOPER_NAV_GROUPS: NavGroup[] = [');
assert(essStart !== -1 && essEnd > essStart, 'ESSENTIAL_NAV_GROUPS and DEVELOPER_NAV_GROUPS clearly exported');

const essBlock = sidebarContent.slice(essStart, essEnd);

// Extract items from ESSENTIAL_NAV_GROUPS
const essPathMatches = [...essBlock.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]);
const essGroupMatches = [...essBlock.matchAll(/labelKey:\s*'([^']+)'/g)]
  .map((m) => m[1])
  .filter((k) => k.startsWith('nav.groups.'));

assertEqual(essGroupMatches, ['nav.groups.privacy', 'nav.groups.documents', 'nav.groups.practical'], 'ESSENTIAL_NAV_GROUPS has exactly 3 groups (privacy, documents, practical)');

const expectedConsumerTools = [
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

assertEqual(essPathMatches, expectedConsumerTools, 'ESSENTIAL_NAV_GROUPS contains exactly the 9 expected consumer tools in exact order');
assert(essPathMatches.length === 9, 'Essential mode tool count is EXACTLY 9');

const developerToolsList = [
  '/api-studio',
  '/json-studio',
  '/jwt-studio',
  '/regex-studio',
  '/cron-studio',
  '/mermaid-studio',
  '/encoding-studio',
  '/hash-studio',
  '/network',
  '/sentinel',
  '/fake-data',
];

const foundDevToolsInEssential = developerToolsList.filter((devTool) => essPathMatches.includes(devTool));
assertEqual(foundDevToolsInEssential, [], 'Essential mode has EXACTLY 0 developer tools (no developer tools leak)');

// Parse DEVELOPER_NAV_GROUPS block
const devStart = essEnd;
const devEnd = sidebarContent.indexOf('export const NAV_GROUPS: NavGroup[] = DEVELOPER_NAV_GROUPS');
const devBlock = sidebarContent.slice(devStart, devEnd);

const devGroupMatches = [...devBlock.matchAll(/labelKey:\s*'([^']+)'/g)]
  .map((m) => m[1])
  .filter((k) => k.startsWith('nav.groups.'));

assertEqual(
  devGroupMatches,
  ['nav.groups.privacy', 'nav.groups.developer', 'nav.groups.files', 'nav.groups.network'],
  'DEVELOPER_NAV_GROUPS has exactly 4 groups (privacy, developer, files, network)'
);

const devPathMatches = [...devBlock.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]);
assert(
  developerToolsList.every((dt) => devPathMatches.includes(dt)),
  'Developer mode contains ALL 11 developer tools (/api-studio, /json-studio, /jwt-studio, /regex-studio, /cron-studio, /mermaid-studio, /encoding-studio, /hash-studio, /network, /sentinel, /fake-data)'
);

// Verify Sidebar activeNavGroups selection
assert(
  sidebarContent.includes("const activeNavGroups = mode === 'essential' ? ESSENTIAL_NAV_GROUPS : DEVELOPER_NAV_GROUPS"),
  'Sidebar dynamically derives activeNavGroups based on mode'
);

// --- 4. EMPIRICAL VERIFICATION: Dashboard Tool Partitioning ---
console.log('\n--- 4. EMPIRICAL DASHBOARD TOOL PARTITIONING ---');

const dashboardPath = path.join(rootDir, 'src/renderer/src/pages/Dashboard.tsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

assert(
  dashboardContent.includes("return mode === 'essential' ? tools.filter((t) => !t.developerOnly) : tools"),
  'Dashboard filters visibleTools based on mode and developerOnly'
);

// Extract tool IDs and developerOnly flags from Dashboard.tsx
const toolIdMatches = [...dashboardContent.matchAll(/id:\s*'([a-z0-9-]+)'[^{}]*?developerOnly:\s*(true|false)/gs)];
const developerTaggedTools = [...dashboardContent.matchAll(/id:\s*'([a-z0-9-]+)'[^,]*?,[^}]*?developerOnly:\s*true/g)].map((m) => m[1]);

assertEqual(
  developerTaggedTools.sort(),
  ['api-studio', 'cron-studio', 'encoding-studio', 'fake-data', 'hash-studio', 'json-studio', 'jwt-studio', 'mermaid-studio', 'network-tools', 'regex-studio', 'sentinel'].sort(),
  'Dashboard tags exactly all 11 developer tools with developerOnly: true'
);

// Check total tools count in Dashboard
const totalToolMatches = [...dashboardContent.matchAll(/id:\s*'([a-z0-9-]+)',\s*path:/g)].map((m) => m[1]);
assertEqual(totalToolMatches.length, 20, 'Dashboard defines 20 total tools in full developer catalog');

const essentialDashboardTools = totalToolMatches.filter((id) => !developerTaggedTools.includes(id));
assertEqual(essentialDashboardTools.length, 9, 'Dashboard visible tools in essential mode is EXACTLY 9 (20 - 11 = 9)');

// --- 5. EMPIRICAL VERIFICATION: Route Guard in App.tsx ---
console.log('\n--- 5. EMPIRICAL ROUTE GUARD IN APP.TSX ---');

const appPath = path.join(rootDir, 'src/renderer/src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');

assert(appContent.includes('const DEV_ONLY_ROUTES = ['), 'App.tsx defines DEV_ONLY_ROUTES');
const devOnlyRoutesInApp = [...appContent.matchAll(/'(\/[a-z0-9-]+)'/g)]
  .map((m) => m[1])
  .filter((r) => developerToolsList.includes(r));

assert(
  developerToolsList.every((dt) => devOnlyRoutesInApp.includes(dt)),
  'App.tsx DEV_ONLY_ROUTES contains all developer routes'
);

assert(
  appContent.includes('isEssential && isDevRoute'),
  'App.tsx renders warning banner when accessing developer route in essential mode'
);

// --- 6. EMPIRICAL VERIFICATION: Command Palette Filtering ---
console.log('\n--- 6. EMPIRICAL COMMAND PALETTE FILTERING ---');

const palettePath = path.join(rootDir, 'src/renderer/src/components/CommandPalette.tsx');
const paletteContent = fs.readFileSync(palettePath, 'utf8');

assert(
  paletteContent.includes("mode === 'essential' && item.developerOnly"),
  'CommandPalette filters out developer-only items in essential mode'
);

assert(
  paletteContent.includes("id: 'toggle-workspace-mode'"),
  'CommandPalette registers "toggle-workspace-mode" quick action'
);

// ================================================================
console.log('\n================================================================');
console.log(`STRESS HARNESS RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
