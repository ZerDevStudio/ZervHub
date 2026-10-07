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

import React, { useState, Suspense } from 'react';
import { Sparkles, Binary, KeyRound, Regex, Database, Unlock, Palette, QrCode, Shuffle, ShieldAlert, Code2 } from 'lucide-react';
import { Language } from '../../lib/types';
import { translations } from '../../lib/translations';
import { cyberAudio } from '../../lib/cyberAudio';

// Code-split all interactive playground demos to shrink initial bundle size (<200KB)
const LiveRegexDemo = React.lazy(() => import('./LiveRegexDemo').then((m) => ({ default: m.LiveRegexDemo })));
const LiveHashDemo = React.lazy(() => import('./LiveHashDemo').then((m) => ({ default: m.LiveHashDemo })));
const LiveBase64Demo = React.lazy(() => import('./LiveBase64Demo').then((m) => ({ default: m.LiveBase64Demo })));
const LiveQrDemo = React.lazy(() => import('./LiveQrDemo').then((m) => ({ default: m.LiveQrDemo })));
const LiveJwtDemo = React.lazy(() => import('./LiveJwtDemo').then((m) => ({ default: m.LiveJwtDemo })));
const LiveDecrypterDemo = React.lazy(() => import('./LiveDecrypterDemo').then((m) => ({ default: m.LiveDecrypterDemo })));
const LivePasswordDemo = React.lazy(() => import('./LivePasswordDemo').then((m) => ({ default: m.LivePasswordDemo })));
const LiveColorDemo = React.lazy(() => import('./LiveColorDemo').then((m) => ({ default: m.LiveColorDemo })));
const LiveFakeDataDemo = React.lazy(() => import('./LiveFakeDataDemo').then((m) => ({ default: m.LiveFakeDataDemo })));
const LiveShredderDemo = React.lazy(() => import('./LiveShredderDemo').then((m) => ({ default: m.LiveShredderDemo })));

interface LivePlaygroundProps {
  lang: Language;
}

type TabKey = 'regex' | 'hash' | 'base64' | 'qr' | 'jwt' | 'decoder' | 'password' | 'color' | 'fakeData' | 'shredder';

export const LivePlayground: React.FC<LivePlaygroundProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('regex');
  const t = translations[lang].playground;

  const tabList = [
    { key: 'regex' as TabKey, label: lang === 'tr' ? 'RegexStudio (Canlı)' : 'RegexStudio (Live)', icon: Regex, color: 'text-cyan-400' },
    { key: 'hash' as TabKey, label: 'HashStudio (SHA-256)', icon: Binary, color: 'text-purple-400' },
    { key: 'base64' as TabKey, label: lang === 'tr' ? 'Base64Studio (İki Yönlü)' : 'Base64Studio (Two-Way)', icon: Code2, color: 'text-cyan-300' },
    { key: 'qr' as TabKey, label: 'QrCodeStudio', icon: QrCode, color: 'text-sky-400' },
    { key: 'jwt' as TabKey, label: 'JsonStudio (JWT)', icon: Database, color: 'text-sky-300' },
    { key: 'decoder' as TabKey, label: 'UniversalDecrypter', icon: Unlock, color: 'text-emerald-400' },
    { key: 'password' as TabKey, label: lang === 'tr' ? 'PasswordGen (Entropi)' : 'PasswordGen (Entropy)', icon: KeyRound, color: 'text-purple-300' },
    { key: 'color' as TabKey, label: 'ColorStudio (WCAG)', icon: Palette, color: 'text-amber-300' },
    { key: 'fakeData' as TabKey, label: 'FakeDataStudio', icon: Shuffle, color: 'text-teal-300' },
    { key: 'shredder' as TabKey, label: 'DoD 7-Pass Shredder', icon: ShieldAlert, color: 'text-rose-400' }
  ];

  return (
    <section id="playground" className="py-24 relative overflow-hidden bg-[#070914] border-t border-b border-gray-800/80">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-cyan-500/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {t.tag}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            {t.title}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-gray-400 leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Playground Console Box */}
        <div className="bg-[#0b0e1b] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden">
          {/* Header Bar */}
          <div className="bg-[#060812] border-b border-gray-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-gray-400 ml-2 hidden sm:inline">
                ZenDev Simulator v2.5.6 (WebAssembly & WebCrypto Core)
              </span>
            </div>

            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/50 px-2.5 py-0.5 rounded border border-cyan-500/30">
              ⚡ 0ms Latency / %100 İstemci Taraflı
            </span>
          </div>

          {/* Tab Selector Bar */}
          <div className="bg-[#080b16] border-b border-gray-800/80 px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-thin">
            {tabList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    cyberAudio.playClick();
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/15 text-white border border-cyan-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Demo Content Area */}
          <div className="p-6 sm:p-8 min-h-[310px] flex flex-col justify-center">
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-xs font-mono text-cyan-400/80">
                    ⚡ {lang === 'tr' ? 'Modül yükleniyor...' : 'Loading studio module...'}
                  </span>
                </div>
              }
            >
              {activeTab === 'regex' && <LiveRegexDemo />}
              {activeTab === 'hash' && <LiveHashDemo />}
              {activeTab === 'base64' && <LiveBase64Demo />}
              {activeTab === 'qr' && <LiveQrDemo />}
              {activeTab === 'jwt' && <LiveJwtDemo />}
              {activeTab === 'decoder' && <LiveDecrypterDemo />}
              {activeTab === 'password' && <LivePasswordDemo />}
              {activeTab === 'color' && <LiveColorDemo />}
              {activeTab === 'fakeData' && <LiveFakeDataDemo />}
              {activeTab === 'shredder' && <LiveShredderDemo />}
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
};
