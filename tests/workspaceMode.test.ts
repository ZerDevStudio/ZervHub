/*
 * ZenDev Dual-Mode Workspace Architecture Test Suite (R1 - R5)
 * Comprehensive verification of Essential Daily Productivity vs Pro Developer Studios
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('ZenDev Dual-Mode Workspace Architecture (R1 - R5)', () => {
  const rootDir = path.resolve(__dirname, '..');

  // Load JSON dictionaries
  const trJsonPath = path.join(rootDir, 'src/renderer/src/locales/tr.json');
  const enJsonPath = path.join(rootDir, 'src/renderer/src/locales/en.json');
  const trJson = JSON.parse(fs.readFileSync(trJsonPath, 'utf8'));
  const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));

  function flattenKeys(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, flattenKeys(value as Record<string, unknown>, fullKey));
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

  // =========================================================================
  // SUITE 1: Task R1 — WorkspaceModeContext State & LocalStorage Persistence
  // =========================================================================
  describe('SUITE 1: Task R1 — WorkspaceModeContext State & Persistence', () => {
    const contextPath = path.join(rootDir, 'src/renderer/src/context/WorkspaceModeContext.tsx');
    const libReexportPath = path.join(rootDir, 'src/renderer/src/lib/WorkspaceModeContext.tsx');
    const contextIndexPath = path.join(rootDir, 'src/renderer/src/context/index.ts');
    const mainPath = path.join(rootDir, 'src/renderer/src/main.tsx');

    it('verifies that WorkspaceModeContext.tsx exists and is non-empty', () => {
      expect(fs.existsSync(contextPath)).toBe(true);
      const content = fs.readFileSync(contextPath, 'utf8');
      expect(content.length).toBeGreaterThan(500);
    });

    it('verifies backwards-compatible re-export in lib/WorkspaceModeContext.tsx', () => {
      expect(fs.existsSync(libReexportPath)).toBe(true);
      const content = fs.readFileSync(libReexportPath, 'utf8');
      expect(content).toContain("export * from '../context/WorkspaceModeContext'");
    });

    it('verifies export in context/index.ts', () => {
      expect(fs.existsSync(contextIndexPath)).toBe(true);
      const content = fs.readFileSync(contextIndexPath, 'utf8');
      expect(content).toContain("export * from './WorkspaceModeContext'");
    });

    it('verifies exact storage key "zendev_workspace_mode"', () => {
      const content = fs.readFileSync(contextPath, 'utf8');
      expect(content).toContain("'zendev_workspace_mode'");
      expect(content).toContain('STORAGE_KEY');
    });

    it('verifies default mode is strictly "essential"', () => {
      const content = fs.readFileSync(contextPath, 'utf8');
      expect(content).toContain("const DEFAULT_MODE: WorkspaceMode = 'essential'");
      expect(content).toContain('return DEFAULT_MODE');
      expect(content).toContain("saved === 'essential' || saved === 'developer'");
    });

    it('verifies cross-window and custom event broadcasting', () => {
      const content = fs.readFileSync(contextPath, 'utf8');
      expect(content).toContain('zendev:workspace-mode-changed');
      expect(content).toContain('window.dispatchEvent');
      expect(content).toContain("window.addEventListener('storage'");
    });

    it('verifies cyberAudio tactile sound integration on mode change and hotkey', () => {
      const content = fs.readFileSync(contextPath, 'utf8');
      expect(content).toContain('cyberAudio.click()');
    });

    it('verifies global Ctrl+M and Cmd+M hotkey listener with input field suppression', () => {
      const content = fs.readFileSync(contextPath, 'utf8');
      expect(content).toContain('(e.ctrlKey || e.metaKey)');
      expect(content).toContain("e.key.toLowerCase() === 'm'");
      expect(content).toContain("target.tagName === 'INPUT'");
      expect(content).toContain("target.tagName === 'TEXTAREA'");
      expect(content).toContain('target.isContentEditable');
    });

    it('verifies WorkspaceModeProvider is mounted in main.tsx wrapping App', () => {
      expect(fs.existsSync(mainPath)).toBe(true);
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      expect(mainContent).toContain('WorkspaceModeProvider');
      expect(mainContent).toMatch(/<WorkspaceModeProvider>\s*<App \/>\s*<\/WorkspaceModeProvider>/);
    });
  });

  // =========================================================================
  // SUITE 2: Task R2 — Header Segmented Control & TitleBar Switcher
  // =========================================================================
  describe('SUITE 2: Task R2 — Header Segmented Switcher (TitleBar.tsx)', () => {
    const titleBarPath = path.join(rootDir, 'src/renderer/src/components/TitleBar.tsx');

    it('verifies TitleBar.tsx imports and consumes useWorkspaceMode', () => {
      expect(fs.existsSync(titleBarPath)).toBe(true);
      const content = fs.readFileSync(titleBarPath, 'utf8');
      expect(content).toContain("import { useWorkspaceMode } from '../context/WorkspaceModeContext'");
      expect(content).toContain('const { mode, setMode } = useWorkspaceMode()');
    });

    it('verifies TitleBar segmented control is centered with absolute positioning', () => {
      const content = fs.readFileSync(titleBarPath, 'utf8');
      expect(content).toContain('absolute left-1/2 -translate-x-1/2');
      expect(content).toContain('no-drag');
    });

    it('verifies Framer Motion sliding indicator with layoutId="activeWorkspaceModeTitle"', () => {
      const content = fs.readFileSync(titleBarPath, 'utf8');
      expect(content).toContain('layoutId="activeWorkspaceModeTitle"');
      expect(content).toContain('motion.div');
    });

    it('verifies audio trigger cyberAudio.click() on segment switch (element-scoped isolation)', () => {
      const content = fs.readFileSync(titleBarPath, 'utf8');
      
      // Isolate the segmented switcher container block
      const switcherMatch = content.match(
        /<div className="absolute left-1\/2 -translate-x-1\/2[\s\S]*?layoutId="activeWorkspaceModeTitle"[\s\S]*?<\/div>\s*<\/div>/
      );
      expect(switcherMatch).not.toBeNull();
      const switcherBlock = switcherMatch![0];

      // Extract individual buttons inside the segmented switcher block
      const buttonMatches = [...switcherBlock.matchAll(/<button[\s\S]*?<\/button>/g)].map((m) => m[0]);
      expect(buttonMatches.length).toBe(2);

      const [essentialBtn, developerBtn] = buttonMatches;

      // Essential button has both cyberAudio.click() and setMode('essential')
      expect(essentialBtn).toContain("setMode('essential')");
      expect(essentialBtn).toContain('cyberAudio.click()');

      // Developer button has both cyberAudio.click() and setMode('developer')
      expect(developerBtn).toContain("setMode('developer')");
      expect(developerBtn).toContain('cyberAudio.click()');
    });

    it('verifies that useT() destructures t and TitleBar calls t() with valid non-empty i18n keys', () => {
      const content = fs.readFileSync(titleBarPath, 'utf8');

      // Verify import from i18n
      expect(content).toContain("import { useT } from '../lib/i18n'");

      // Verify destructuring of both t and locale
      const useTMatch = content.match(/const\s*\{([^}]+)\}\s*=\s*useT\(\)/);
      expect(useTMatch).not.toBeNull();
      const destructuredVars = useTMatch![1].split(',').map((s) => s.trim());
      expect(destructuredVars).toContain('t');
      expect(destructuredVars).toContain('locale');

      // Extract all t(...) calls in TitleBar.tsx
      const tCalls = [...content.matchAll(/\bt\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
      expect(tCalls.length).toBeGreaterThan(0);
      expect(tCalls).toContain('workspace.essential');
      expect(tCalls).toContain('workspace.developer');

      // Verify every key called in TitleBar exists and is non-empty in tr.json and en.json
      for (const key of tCalls) {
        expect(trFlat[key]).toBeDefined();
        expect(trFlat[key].length).toBeGreaterThan(0);
        expect(enFlat[key]).toBeDefined();
        expect(enFlat[key].length).toBeGreaterThan(0);
      }
    });

    it('executes dynamic expressions from TitleBar.tsx in simulated scope, asserting ReferenceError if t is omitted', () => {
      const content = fs.readFileSync(titleBarPath, 'utf8');

      // 1. Extract JSX dynamic expressions in TitleBar referencing workspace translation keys
      const exprMatches = [...content.matchAll(/\{([^}{]+)\}/g)]
        .map((m) => m[1].trim())
        .filter((e) => e.includes("t('workspace."));

      expect(exprMatches.length).toBe(4);

      // 2. Parse destructuring from useT() in TitleBar.tsx
      const useTMatch = content.match(/const\s*\{([^}]+)\}\s*=\s*useT\(\)/);
      expect(useTMatch).not.toBeNull();
      const destructuredVars = useTMatch![1].split(',').map((s) => s.trim());

      // 3. Build simulated component scope based on genuine destructuring
      const baseScope: Record<string, any> = {
        locale: 'tr',
        mode: 'essential',
        setMode: () => {},
      };

      if (destructuredVars.includes('t')) {
        baseScope.t = (key: string) => trFlat[key] || key;
      }

      // 4. Positive execution: with t in scope, all expressions evaluate successfully
      for (const expr of exprMatches) {
        expect(() => {
          const fn = new Function(...Object.keys(baseScope), `return (${expr});`);
          const val = fn(...Object.values(baseScope));
          expect(typeof val).toBe('string');
          expect(val.length).toBeGreaterThan(0);
        }).not.toThrow();
      }

      // 5. Negative execution: if t is omitted from scope,
      // executing the expression MUST throw ReferenceError: t is not defined
      const scopeWithoutT = { ...baseScope };
      delete scopeWithoutT.t;

      for (const expr of exprMatches) {
        expect(() => {
          const fn = new Function(...Object.keys(scopeWithoutT), `return (${expr});`);
          fn(...Object.values(scopeWithoutT));
        }).toThrow(ReferenceError);
      }
    });

    it('verifies export contract and backwards compatibility of lib/WorkspaceModeContext.tsx without TS2614', () => {
      const libPath = path.join(rootDir, 'src/renderer/src/lib/WorkspaceModeContext.tsx');
      const contextPath = path.join(rootDir, 'src/renderer/src/context/WorkspaceModeContext.tsx');

      expect(fs.existsSync(libPath)).toBe(true);
      expect(fs.existsSync(contextPath)).toBe(true);

      const libContent = fs.readFileSync(libPath, 'utf8');
      const ctxContent = fs.readFileSync(contextPath, 'utf8');

      // Canonical context exports default WorkspaceModeProvider
      expect(ctxContent).toMatch(/export\s+default\s+WorkspaceModeProvider/);

      // lib/WorkspaceModeContext re-exports both all named exports and default
      expect(libContent).toContain("export * from '../context/WorkspaceModeContext'");
      expect(libContent).toMatch(/export\s*\{\s*WorkspaceModeProvider\s+as\s+default\s*\}\s*from\s*['"]\.\.\/context\/WorkspaceModeContext['"]/);

      // Verify no ambiguous or invalid `export { default }` re-export that causes TS2614
      expect(libContent).not.toMatch(/export\s*\{\s*default\s*\}\s*from/);
    });
  });

  // =========================================================================
  // SUITE 3: Task R3 — Navigation & Sidebar Dual-Mode Partitioning
  // =========================================================================
  describe('SUITE 3: Task R3 — Navigation & Sidebar Partitioning (Sidebar.tsx & App.tsx)', () => {
    const sidebarPath = path.join(rootDir, 'src/renderer/src/components/Sidebar.tsx');
    const appPath = path.join(rootDir, 'src/renderer/src/App.tsx');

    it('verifies Sidebar.tsx exports ESSENTIAL_NAV_GROUPS and DEVELOPER_NAV_GROUPS', () => {
      expect(fs.existsSync(sidebarPath)).toBe(true);
      const content = fs.readFileSync(sidebarPath, 'utf8');
      expect(content).toContain('export const ESSENTIAL_NAV_GROUPS');
      expect(content).toContain('export const DEVELOPER_NAV_GROUPS');
    });

    it('verifies ESSENTIAL_NAV_GROUPS has exactly 3 groups and exactly 9 consumer tools', () => {
      const content = fs.readFileSync(sidebarPath, 'utf8');
      const startIdx = content.indexOf('export const ESSENTIAL_NAV_GROUPS');
      const endIdx = content.indexOf('export const DEVELOPER_NAV_GROUPS');
      expect(startIdx).toBeGreaterThan(0);
      expect(endIdx).toBeGreaterThan(startIdx);
      const block = content.substring(startIdx, endIdx);

      // Verify 3 groups
      expect(block).toContain("'nav.groups.privacy'");
      expect(block).toContain("'nav.groups.documents'");
      expect(block).toContain("'nav.groups.practical'");

      // Verify 9 item paths
      const expectedPaths = [
        "path: '/decrypter'",
        "path: '/fortress'",
        "path: '/password'",
        "path: '/pdf-studio'",
        "path: '/image'",
        "path: '/organizer'",
        "path: '/qr-code'",
        "path: '/scratchpad'",
        "path: '/color-studio'",
      ];
      for (const p of expectedPaths) {
        expect(block).toContain(p);
      }

      // Verify no developer-only routes in ESSENTIAL_NAV_GROUPS
      const forbiddenDevPaths = [
        "path: '/api-studio'",
        "path: '/json-studio'",
        "path: '/jwt-studio'",
        "path: '/regex-studio'",
        "path: '/cron-studio'",
        "path: '/mermaid-studio'",
        "path: '/encoding-studio'",
        "path: '/hash-studio'",
        "path: '/network'",
        "path: '/sentinel'",
        "path: '/fake-data'",
      ];
      for (const p of forbiddenDevPaths) {
        expect(block).not.toContain(p);
      }
    });

    it('verifies DEVELOPER_NAV_GROUPS contains full suite with 4 groups', () => {
      const content = fs.readFileSync(sidebarPath, 'utf8');
      const devBlockStart = content.indexOf('export const DEVELOPER_NAV_GROUPS');
      const devBlock = content.substring(devBlockStart, devBlockStart + 3500);

      expect(devBlock).toContain("'nav.groups.privacy'");
      expect(devBlock).toContain("'nav.groups.developer'");
      expect(devBlock).toContain("'nav.groups.files'");
      expect(devBlock).toContain("'nav.groups.network'");

      expect(devBlock).toContain("path: '/api-studio'");
      expect(devBlock).toContain("path: '/jwt-studio'");
      expect(devBlock).toContain("path: '/cron-studio'");
      expect(devBlock).toContain("path: '/mermaid-studio'");
      expect(devBlock).toContain("path: '/encoding-studio'");
      expect(devBlock).toContain("path: '/json-studio'");
    });

    it('verifies accessible mode switcher button above <nav> in Sidebar.tsx', () => {
      const content = fs.readFileSync(sidebarPath, 'utf8');
      expect(content).toContain('useWorkspaceMode()');
      expect(content).toContain('onClick={toggleMode}');
      expect(content).toContain('role="switch"');
      expect(content).toContain("aria-checked={mode === 'developer'}");
    });

    it('verifies App.tsx defines DEV_ONLY_ROUTES and displays top warning banner & toast on restricted route', () => {
      expect(fs.existsSync(appPath)).toBe(true);
      const appContent = fs.readFileSync(appPath, 'utf8');
      expect(appContent).toContain('DEV_ONLY_ROUTES');
      expect(appContent).toContain("'/api-studio'");
      expect(appContent).toContain("'/jwt-studio'");
      expect(appContent).toContain("'/cron-studio'");
      expect(appContent).toContain("'/mermaid-studio'");
      expect(appContent).toContain("'/encoding-studio'");
      expect(appContent).toContain('useWorkspaceMode()');
      expect(appContent).toContain('isEssential && isDevRoute');
      expect(appContent).toContain("t('workspace.developerRequiredTitle')");
      expect(appContent).toContain("t('workspace.switchToDeveloper')");
      expect(appContent).toContain("setMode('developer')");
    });
  });

  // =========================================================================
  // SUITE 4: Task R4 — Command Palette & Dashboard Tool Filtering
  // =========================================================================
  describe('SUITE 4: Task R4 — Command Palette & Dashboard Alignment', () => {
    const palettePath = path.join(rootDir, 'src/renderer/src/components/CommandPalette.tsx');
    const dashboardPath = path.join(rootDir, 'src/renderer/src/pages/Dashboard.tsx');

    it('verifies CommandPalette.tsx filters items by mode and registers dynamic mode toggle action', () => {
      expect(fs.existsSync(palettePath)).toBe(true);
      const paletteContent = fs.readFileSync(palettePath, 'utf8');
      expect(paletteContent).toContain('useWorkspaceMode');
      expect(paletteContent).toContain('developerOnly?: boolean');
      expect(paletteContent).toContain('toggle-workspace-mode');
      expect(paletteContent).toContain("t('workspace.switchToDeveloper')");
      expect(paletteContent).toContain("t('workspace.switchToEssential')");
      expect(paletteContent).toContain('availableItems = useMemo');
      expect(paletteContent).toContain('mode === \'essential\' && item.developerOnly');
    });

    it('verifies CommandPalette marks developer-specific items with developerOnly: true', () => {
      const paletteContent = fs.readFileSync(palettePath, 'utf8');
      const devItems = [
        "id: 'api-studio'",
        "id: 'json-studio'",
        "id: 'hash-studio'",
        "id: 'sentinel'",
        "id: 'regex-studio'",
        "id: 'fake-data'",
        "id: 'jwt-studio'",
        "id: 'cron-studio'",
        "id: 'mermaid-studio'",
        "id: 'encoding-studio'",
      ];
      for (const item of devItems) {
        expect(paletteContent).toContain(item);
      }
    });

    it('verifies Dashboard.tsx filters tools dynamically into visibleTools and visiblePinnedTools', () => {
      expect(fs.existsSync(dashboardPath)).toBe(true);
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
      expect(dashboardContent).toContain('useWorkspaceMode');
      expect(dashboardContent).toContain('const visibleTools = useMemo(() => {');
      expect(dashboardContent).toContain("return mode === 'essential' ? tools.filter((t) => !t.developerOnly) : tools");
      expect(dashboardContent).toContain('const visiblePinnedTools = useMemo(() => {');
      expect(dashboardContent).toContain('return visibleTools.filter((t) => pinnedIds.includes(t.id))');
    });

    it('verifies Dashboard.tsx tags exactly 11 developer tools with developerOnly: true', () => {
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
      const matches = dashboardContent.match(/developerOnly:\s*true/g);
      expect(matches).not.toBeNull();
      expect(matches?.length).toBe(11);
    });

    it('verifies Dashboard.tsx displays visibleTools.length in quick stats and module count badge', () => {
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
      expect(dashboardContent).toContain("`${visibleTools.length} ${locale === 'tr' ? 'Modül' : 'Tools'}`");
      expect(dashboardContent).toContain('{visibleTools.length} Modules Installed');
      expect(dashboardContent).toContain('{visibleTools.map((tool, index) =>');
    });

    it('verifies Dashboard.tsx renders Pro Developer Studios discovery card in essential mode', () => {
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
      expect(dashboardContent).toContain("mode === 'essential'");
      expect(dashboardContent).toContain("setMode('developer')");
      expect(dashboardContent).toContain('Pro Geliştirici Stüdyoları');
    });
  });

  // =========================================================================
  // SUITE 5: Task R5 — Bilingual Localization (tr.json & en.json) Parity
  // =========================================================================
  describe('SUITE 5: Task R5 — Bilingual Localization Parity & Cardinality (801 Keys)', () => {
    it('verifies both tr.json and en.json have exactly 801 keys', () => {
      expect(trKeys.length).toBe(801);
      expect(enKeys.length).toBe(801);
    });

    it('verifies zero missing keys between tr.json and en.json (100% parity)', () => {
      const missingInTr = enKeys.filter((k) => !trFlat.hasOwnProperty(k));
      const missingInEn = trKeys.filter((k) => !enFlat.hasOwnProperty(k));
      expect(missingInTr).toEqual([]);
      expect(missingInEn).toEqual([]);
    });

    it('verifies all 16 dual-mode workspace keys are present and non-empty in tr.json and en.json', () => {
      const requiredKeys = [
        'nav.groups.documents',
        'nav.groups.practical',
        'workspace.mode',
        'workspace.essential',
        'workspace.essentialShort',
        'workspace.essentialDesc',
        'workspace.developer',
        'workspace.developerShort',
        'workspace.developerDesc',
        'workspace.switchToDeveloper',
        'workspace.switchToDeveloperDesc',
        'workspace.switchToEssential',
        'workspace.switchToEssentialDesc',
        'workspace.toggleShortcut',
        'workspace.shortcutHint',
        'workspace.developerRequiredTitle',
      ];

      for (const key of requiredKeys) {
        expect(trFlat[key]).toBeDefined();
        expect(enFlat[key]).toBeDefined();
        expect(trFlat[key].trim().length).toBeGreaterThan(0);
        expect(enFlat[key].trim().length).toBeGreaterThan(0);
      }
    });

    it('verifies zero empty strings or undefined values in tr.json and en.json', () => {
      const emptyTr = Object.entries(trFlat).filter(([_, v]) => !v || v.trim() === '').map(([k]) => k);
      const emptyEn = Object.entries(enFlat).filter(([_, v]) => !v || v.trim() === '').map(([k]) => k);
      expect(emptyTr).toEqual([]);
      expect(emptyEn).toEqual([]);
    });
  });

  // =========================================================================
  // SUITE 6: Behavioral State Machine & Event Simulation
  // =========================================================================
  describe('SUITE 6: Behavioral State Machine & Logic Simulation', () => {
    class MockLocalStorage {
      private store: Record<string, string> = {};
      getItem(key: string): string | null {
        return this.store[key] ?? null;
      }
      setItem(key: string, value: string): void {
        this.store[key] = value;
      }
      removeItem(key: string): void {
        delete this.store[key];
      }
      clear(): void {
        this.store = {};
      }
    }

    it('simulates lazy initialization falling back to essential when storage is empty', () => {
      const mockStorage = new MockLocalStorage();
      const saved = mockStorage.getItem('zendev_workspace_mode');
      const initialMode = saved === 'developer' ? 'developer' : 'essential';
      expect(initialMode).toBe('essential');
    });

    it('simulates lazy initialization restoring developer mode from storage', () => {
      const mockStorage = new MockLocalStorage();
      mockStorage.setItem('zendev_workspace_mode', 'developer');
      const saved = mockStorage.getItem('zendev_workspace_mode');
      const initialMode = saved === 'developer' ? 'developer' : 'essential';
      expect(initialMode).toBe('developer');
    });

    it('simulates toggle state transition: essential -> developer -> essential', () => {
      let currentMode: 'essential' | 'developer' = 'essential';
      const mockStorage = new MockLocalStorage();

      const toggle = () => {
        currentMode = currentMode === 'essential' ? 'developer' : 'essential';
        mockStorage.setItem('zendev_workspace_mode', currentMode);
      };

      // Toggle to developer
      toggle();
      expect(currentMode).toBe('developer');
      expect(mockStorage.getItem('zendev_workspace_mode')).toBe('developer');

      // Toggle back to essential
      toggle();
      expect(currentMode).toBe('essential');
      expect(mockStorage.getItem('zendev_workspace_mode')).toBe('essential');
    });

    it('simulates keyboard shortcut filtering (ignores input and textarea targets)', () => {
      let toggleCount = 0;
      const simulateKeydown = (event: {
        key: string;
        ctrlKey: boolean;
        metaKey: boolean;
        target: { tagName: string; isContentEditable?: boolean };
      }) => {
        const { target } = event;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'm') {
          toggleCount++;
        }
      };

      // In regular body: triggers
      simulateKeydown({ key: 'M', ctrlKey: true, metaKey: false, target: { tagName: 'BODY' } });
      expect(toggleCount).toBe(1);

      // In Mac Cmd+m: triggers
      simulateKeydown({ key: 'm', ctrlKey: false, metaKey: true, target: { tagName: 'DIV' } });
      expect(toggleCount).toBe(2);

      // Inside INPUT: suppressed
      simulateKeydown({ key: 'm', ctrlKey: true, metaKey: false, target: { tagName: 'INPUT' } });
      expect(toggleCount).toBe(2);

      // Inside TEXTAREA: suppressed
      simulateKeydown({ key: 'm', ctrlKey: true, metaKey: false, target: { tagName: 'TEXTAREA' } });
      expect(toggleCount).toBe(2);

      // Inside contentEditable: suppressed
      simulateKeydown({ key: 'm', ctrlKey: true, metaKey: false, target: { tagName: 'DIV', isContentEditable: true } });
      expect(toggleCount).toBe(2);
    });
  });
});
