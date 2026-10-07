// Copyright 2025 Lee Boonstra
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useState, useEffect, Suspense } from 'react';
import { Language, Currency, ToolItem } from './lib/types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { LivePlayground } from './components/LivePlayground/LivePlayground';
import { ToolCatalog } from './components/ToolCatalog';
import { ArchitectureRadar } from './components/ArchitectureRadar';
import { TestimonialsWall } from './components/TestimonialsWall';
import { RoiCalculator } from './components/RoiCalculator';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { LicensePortal } from './components/LicensePortal';
import { Footer } from './components/Footer';

// Code-split heavy interactive modals using React.lazy to optimize initial bundle size
const ChangelogModal = React.lazy(() =>
  import('./components/ChangelogModal').then((m) => ({ default: m.ChangelogModal }))
);
const CommandPalette = React.lazy(() =>
  import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette }))
);
const ShortcutsDrawer = React.lazy(() =>
  import('./components/ShortcutsDrawer').then((m) => ({ default: m.ShortcutsDrawer }))
);
const WaitlistModal = React.lazy(() =>
  import('./components/WaitlistModal').then((m) => ({ default: m.WaitlistModal }))
);

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('tr');
  const [currency, setCurrency] = useState<Currency>('TRY');
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K for Command Palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      // Open Shortcuts drawer on Ctrl+Shift+? or Alt+K
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectToolFromPalette = (tool: ToolItem) => {
    // Scroll smoothly to the arsenal and highlight
    const arsenalEl = document.getElementById('arsenal');
    if (arsenalEl) {
      arsenalEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#05060b] text-gray-200 selection:bg-cyan-500 selection:text-black font-sans relative">
      {/* Top Fixed Navbar */}
      <Navbar
        lang={lang}
        setLang={setLang}
        currency={currency}
        setCurrency={setCurrency}
        onOpenChangelog={() => setChangelogOpen(true)}
        onOpenSearch={() => setCommandPaletteOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenWaitlist={() => setWaitlistOpen(true)}
      />

      {/* Main Content Sections */}
      <main>
        {/* 1. Hero Section with 3D Desktop Window Simulator */}
        <HeroSection lang={lang} />

        {/* 2. Expanded 9-Tool In-Browser WASM/WebCrypto Playground */}
        <LivePlayground lang={lang} />

        {/* 3. Complete 27-Tool Categorized Arsenal */}
        <ToolCatalog lang={lang} />

        {/* 4. Tauri v2 vs Electron Architecture & Benchmarks Radar */}
        <ArchitectureRadar lang={lang} />

        {/* 5. Verified Engineer Reviews & Wall of Love */}
        <TestimonialsWall lang={lang} />

        {/* 6. Anti-SaaS Interactive ROI Calculator */}
        <RoiCalculator lang={lang} currency={currency} />

        {/* 7. Pricing Matrix with Coupon Engine */}
        <PricingSection lang={lang} currency={currency} setCurrency={setCurrency} />

        {/* 8. Searchable Categorized FAQ Accordion */}
        <FaqSection lang={lang} />

        {/* 9. Self-Service HWID License Recovery Portal */}
        <LicensePortal lang={lang} />
      </main>

      {/* Footer */}
      <Footer lang={lang} />

      {/* Real-Time Social Proof Ticker (Deactivated per user request until verified real telemetry is gathered) */}
      {/* <LiveActivityTicker lang={lang} /> */}

      {/* Global Command Palette (Ctrl+K) */}
      <Suspense fallback={null}>
        {commandPaletteOpen && (
          <CommandPalette
            isOpen={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            onSelectTool={handleSelectToolFromPalette}
            lang={lang}
          />
        )}
      </Suspense>

      {/* Keyboard Shortcuts & CLI Cheatsheet Drawer */}
      <Suspense fallback={null}>
        {shortcutsOpen && (
          <ShortcutsDrawer
            isOpen={shortcutsOpen}
            onClose={() => setShortcutsOpen(false)}
            lang={lang}
          />
        )}
      </Suspense>

      {/* 20% Discount Early Access Waitlist Modal */}
      <Suspense fallback={null}>
        {waitlistOpen && (
          <WaitlistModal
            isOpen={waitlistOpen}
            onClose={() => setWaitlistOpen(false)}
            lang={lang}
          />
        )}
      </Suspense>

      {/* What's New & Release Notes Modal */}
      <Suspense fallback={null}>
        {changelogOpen && (
          <ChangelogModal
            isOpen={changelogOpen}
            onClose={() => setChangelogOpen(false)}
            lang={lang}
          />
        )}
      </Suspense>
    </div>
  );
};

export default App;
