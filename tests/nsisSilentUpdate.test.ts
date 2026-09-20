/*
 * Copyright 2025 Lee Boonstra
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Milestone M8: NSIS Silent Background Update & v2.5.2 Release Verification', () => {
  const rootDir = path.resolve(__dirname, '..');
  const srcTauriDir = path.join(rootDir, 'src-tauri');
  const websiteDir = path.join(rootDir, 'website');

  describe('1. Tauri Configuration (src-tauri/tauri.conf.json)', () => {
    const tauriConfPath = path.join(srcTauriDir, 'tauri.conf.json');

    it('exists and is valid JSON', () => {
      expect(fs.existsSync(tauriConfPath)).toBe(true);
      const raw = fs.readFileSync(tauriConfPath, 'utf-8');
      expect(() => JSON.parse(raw)).not.toThrow();
    });

    it('sets version to 2.5.5', () => {
      const config = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
      expect(config.version).toBe('2.5.5');
    });

    it('configures bundle.windows.nsis.installMode as "currentUser" to prevent UAC elevation', () => {
      const config = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
      expect(config.bundle).toBeDefined();
      expect(config.bundle.windows).toBeDefined();
      expect(config.bundle.windows.nsis).toBeDefined();
      expect(config.bundle.windows.nsis.installMode).toBe('currentUser');
    });

    it('configures plugins.updater.windows with currentUser installMode and NO silent "/S" installerArgs', () => {
      const raw = fs.readFileSync(tauriConfPath, 'utf-8');
      const config = JSON.parse(raw);
      expect(config.plugins).toBeDefined();
      expect(config.plugins.updater).toBeDefined();
      expect(config.plugins.updater.windows).toBeDefined();
      expect(config.plugins.updater.windows.installMode).toBe('currentUser');
      expect(config.plugins.updater.windows.installerArgs).toBeUndefined();
      expect(raw).not.toContain('"/S"');
    });
  });

  describe('2. Rust Updater Backend & EDR Hardening (src-tauri/src/updater.rs & lib.rs)', () => {
    const updaterPath = path.join(srcTauriDir, 'src', 'updater.rs');
    const libPath = path.join(srcTauriDir, 'src', 'lib.rs');

    it('launches installer transparently and interactively without silent "/S" flag', () => {
      expect(fs.existsSync(updaterPath)).toBe(true);
      const code = fs.readFileSync(updaterPath, 'utf-8');

      // Must NOT contain silent /S flag or legacy silent helper
      expect(code).not.toContain('"/S"');
      expect(code).not.toContain('_legacy_silent_install_reference');

      // Must NOT invoke cmd.exe
      expect(code).not.toMatch(/silent_command\("cmd"\)/);
      expect(code).not.toContain('"cmd"');

      // Must spawn interactive installer directly
      expect(code).toMatch(/std::process::Command::new\(&path\)\.spawn\(\)/);

      // Must preserve sleep delay for clean process handoff
      expect(code).toMatch(/std::thread::sleep\(std::time::Duration::from_millis\(500\)\)/);

      // Must terminate main process to allow file overwrite
      expect(code).toMatch(/std::process::exit\(0\)/);
    });

    it('verifies open_external in lib.rs does not spawn cmd.exe and validates URL protocols', () => {
      const libCode = fs.readFileSync(libPath, 'utf-8');
      expect(libCode).not.toMatch(/silent_command\("cmd"\)/);
      expect(libCode).toContain('ShellExecuteW');
      expect(libCode).toContain('url::Url::parse');
    });
  });

  describe('3. Repository-wide Version Alignment (v2.5.5)', () => {
    it('verifies root package.json version is 2.5.5', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
      expect(pkg.version).toBe('2.5.5');
    });

    it('verifies root package-lock.json version is 2.5.5', () => {
      const lock = JSON.parse(fs.readFileSync(path.join(rootDir, 'package-lock.json'), 'utf-8'));
      expect(lock.version).toBe('2.5.5');
      expect(lock.packages[''].version).toBe('2.5.5');
    });

    it('verifies src-tauri/Cargo.toml package version is 2.5.5', () => {
      const cargoToml = fs.readFileSync(path.join(srcTauriDir, 'Cargo.toml'), 'utf-8');
      expect(cargoToml).toMatch(/name\s*=\s*"zendev"\s*\r?\nversion\s*=\s*"2\.5\.5"/);
    });

    it('verifies src-tauri/Cargo.lock zendev package version is 2.5.5', () => {
      const cargoLock = fs.readFileSync(path.join(srcTauriDir, 'Cargo.lock'), 'utf-8');
      expect(cargoLock).toMatch(/\[\[package\]\]\r?\nname = "zendev"\r?\nversion = "2\.5\.5"/);
    });

    it('verifies website/package.json version is 2.5.5', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(websiteDir, 'package.json'), 'utf-8'));
      expect(pkg.version).toBe('2.5.5');
    });

    it('verifies website/package-lock.json version is 2.5.5', () => {
      const lock = JSON.parse(fs.readFileSync(path.join(websiteDir, 'package-lock.json'), 'utf-8'));
      expect(lock.version).toBe('2.5.5');
      expect(lock.packages[''].version).toBe('2.5.5');
    });

    it('verifies .github/workflows/release.yml fallback tag is v2.5.5', () => {
      const workflow = fs.readFileSync(path.join(rootDir, '.github', 'workflows', 'release.yml'), 'utf-8');
      expect(workflow).toContain('"v2.5.5"');
    });

    it('verifies website/src/lib/downloadHelper.ts declares version 2.5.5 with valid release URLs', () => {
      const helper = fs.readFileSync(path.join(websiteDir, 'src', 'lib', 'downloadHelper.ts'), 'utf-8');
      expect(helper).toContain("version: '2.5.5'");
      expect(helper).toContain('ZenDev-Setup-2.5.5.exe');
      expect(helper).toContain('ZenDev-Portable-2.5.5.exe');
    });
  });
});
