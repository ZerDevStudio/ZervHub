// Copyright 2026 Lee Boonstra
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

/**
 * scripts/gen-icons.js
 *
 * Generates ZenDev app icons from an inline SVG design.
 * Output:
 *   build/icons/icon.png         — 512×512 master PNG
 *   build/icons/icon.ico         — multi-size ICO (16/32/48/64/128/256 px)
 *   build/icons/icon.svg         — raw SVG vector asset
 *   src/renderer/src/assets/logo.png — app UI sidebar brand logo
 *
 * Usage: node scripts/gen-icons.js
 * Requires: sharp (in devDependencies / dependencies)
 */

'use strict'
const sharp = require('sharp')
const fs    = require('fs')
const path  = require('path')

// ─── Output Paths ─────────────────────────────────────────────────────────────
const OUT_ICONS = path.resolve(__dirname, '../build/icons')
const OUT_RENDERER_LOGO = path.resolve(__dirname, '../src/renderer/src/assets/logo.png')
fs.mkdirSync(OUT_ICONS, { recursive: true })
fs.mkdirSync(path.dirname(OUT_RENDERER_LOGO), { recursive: true })

// ─── ZenDev Iconic "Z" Cyberpunk SVG Design ──────────────────────────────────
const SVG = `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="512" height="512"
  viewBox="0 0 512 512"
>
  <defs>
    <!-- Background dark obsidian gradient -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b0d19"/>
      <stop offset="50%" stop-color="#07080f"/>
      <stop offset="100%" stop-color="#030407"/>
    </linearGradient>

    <!-- Outer rim glow gradient -->
    <linearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00f2fe"/>
      <stop offset="40%" stop-color="#06b6d4"/>
      <stop offset="80%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#d946ef"/>
    </linearGradient>

    <!-- Main Z Top Bar gradient -->
    <linearGradient id="zTopGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#00f2fe"/>
      <stop offset="70%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>

    <!-- Main Z Diagonal gradient -->
    <linearGradient id="zDiagGrad" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="45%" stop-color="#06b6d4"/>
      <stop offset="75%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>

    <!-- Main Z Bottom Bar gradient -->
    <linearGradient id="zBottomGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="40%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>

    <!-- Inner Core Glow -->
    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
      <stop offset="30%" stop-color="#38bdf8" stop-opacity="0.8"/>
      <stop offset="70%" stop-color="#8b5cf6" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
    </radialGradient>

    <!-- Ambient backdrop glow -->
    <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.25"/>
      <stop offset="45%" stop-color="#8b5cf6" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- High-tech circuit stroke -->
    <linearGradient id="circuitGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.2"/>
    </linearGradient>

    <!-- Intense neon glow filter -->
    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Subtle glow for fine lines -->
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- 1. Background squircle container -->
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  <rect width="512" height="512" rx="116" fill="url(#ambientGlow)"/>

  <!-- 2. Futuristic double border rim -->
  <rect x="10" y="10" width="492" height="492" rx="108" fill="none" stroke="url(#borderGrad)" stroke-width="2.5" stroke-opacity="0.45"/>
  <rect x="18" y="18" width="476" height="476" rx="100" fill="none" stroke="url(#borderGrad)" stroke-width="1" stroke-opacity="0.15" stroke-dasharray="12 6"/>

  <!-- 3. Ambient Corner Tech Nodes -->
  <circle cx="80" cy="80" r="3.5" fill="#00f2fe" opacity="0.4"/>
  <line x1="80" y1="80" x2="130" y2="80" stroke="url(#circuitGrad)" stroke-width="1.5"/>
  <line x1="80" y1="80" x2="80" y2="130" stroke="url(#circuitGrad)" stroke-width="1.5"/>

  <circle cx="432" cy="432" r="3.5" fill="#d946ef" opacity="0.4"/>
  <line x1="432" y1="432" x2="382" y2="432" stroke="url(#circuitGrad)" stroke-width="1.5"/>
  <line x1="432" y1="432" x2="432" y2="382" stroke="url(#circuitGrad)" stroke-width="1.5"/>

  <!-- 4. Background Zen Enso Ring / Hex Shield -->
  <circle cx="256" cy="256" r="176" fill="none" stroke="url(#borderGrad)" stroke-width="1.5" stroke-opacity="0.14" stroke-dasharray="24 12"/>
  <polygon points="256,92 398,174 398,338 256,420 114,338 114,174" fill="none" stroke="url(#borderGrad)" stroke-width="1" stroke-opacity="0.12"/>

  <!-- 5. Iconic ZENDEV "Z" Monogram Geometry -->
  <!-- Top Bar: Cyber Blade -->
  <path
    d="M 116 128 L 388 128 C 402 128 412 138 410 152 L 398 196 C 396 204 388 210 380 210 L 224 210 L 320 128 Z"
    fill="url(#zTopGrad)"
    filter="url(#softGlow)"
  />

  <!-- Main Diagonal Laser Conduit -->
  <polygon
    points="386,138 412,154 200,378 132,378"
    fill="url(#zDiagGrad)"
    filter="url(#neonGlow)"
  />

  <!-- Bottom Bar: Inverted Cyber Blade -->
  <path
    d="M 396 384 L 124 384 C 110 384 100 374 102 360 L 114 316 C 116 308 124 302 132 302 L 288 302 L 192 384 Z"
    fill="url(#zBottomGrad)"
    filter="url(#softGlow)"
  />

  <!-- High-Power Core Neon Beam along Z diagonal -->
  <line x1="368" y1="168" x2="164" y2="352" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" filter="url(#neonGlow)"/>
  <line x1="368" y1="168" x2="164" y2="352" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" opacity="0.6" filter="url(#neonGlow)"/>

  <!-- 6. Central Zen Diamond Core (Nexus Pulse) -->
  <polygon
    points="256,232 280,256 256,280 232,256"
    fill="url(#centerGlow)"
    filter="url(#neonGlow)"
  />
  <polygon
    points="256,242 270,256 256,270 242,256"
    fill="#ffffff"
  />
  <!-- Orbiting micro energy nodes -->
  <circle cx="210" cy="256" r="4.5" fill="#00f2fe" filter="url(#softGlow)"/>
  <circle cx="302" cy="256" r="4.5" fill="#d946ef" filter="url(#softGlow)"/>

  <!-- 7. Tech Accent Terminals on Z tips -->
  <circle cx="126" cy="138" r="4" fill="#ffffff" filter="url(#softGlow)"/>
  <circle cx="386" cy="374" r="4" fill="#ffffff" filter="url(#softGlow)"/>
</svg>`

// ─── ICO binary builder ─────────────────────────────────────────────────────
function buildIco(images) {
  const HEADER_SIZE = 6
  const DIR_ENTRY_SIZE = 16
  const count = images.length
  let offset = HEADER_SIZE + count * DIR_ENTRY_SIZE

  // Header
  const header = Buffer.alloc(HEADER_SIZE)
  header.writeUInt16LE(0, 0)     // reserved — must be 0
  header.writeUInt16LE(1, 2)     // type: 1 = ICO
  header.writeUInt16LE(count, 4) // image count

  // Directory entries
  const dirs = images.map(({ size, buf }) => {
    const entry = Buffer.alloc(DIR_ENTRY_SIZE)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)  // width  (0 encodes 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)  // height (0 encodes 256)
    entry.writeUInt8(0, 2)                        // color count (0 = true color)
    entry.writeUInt8(0, 3)                        // reserved
    entry.writeUInt16LE(1, 4)                     // color planes
    entry.writeUInt16LE(32, 6)                    // bits per pixel
    entry.writeUInt32LE(buf.length, 8)            // byte size of this image
    entry.writeUInt32LE(offset, 12)               // offset from file start
    offset += buf.length
    return entry
  })

  return Buffer.concat([header, ...dirs, ...images.map((i) => i.buf)])
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('ZenDev icon generator starting...\n')

  const svgBuffer = Buffer.from(SVG)
  fs.writeFileSync(path.join(OUT_ICONS, 'icon.svg'), svgBuffer)
  console.log('✓  icon.svg        Vector master')

  // ── 512×512 PNG ──────────────────────────────────────────────────────────
  const png512 = await sharp(svgBuffer, { density: 300 })
    .resize(512, 512)
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer()

  fs.writeFileSync(path.join(OUT_ICONS, 'icon.png'), png512)
  fs.writeFileSync(OUT_RENDERER_LOGO, png512)
  console.log(`✓  icon.png        512×512  (${(png512.length / 1024).toFixed(1)} KB) -> build/icons & src/renderer/assets`)

  // ── ICO: 16 / 32 / 48 / 64 / 128 / 256 px ───────────────────────────────
  const ICO_SIZES = [16, 32, 48, 64, 128, 256]
  const icoImages = await Promise.all(
    ICO_SIZES.map(async (size) => {
      const buf = await sharp(svgBuffer, { density: 300 })
        .resize(size, size)
        .png()
        .toBuffer()
      console.log(`   → ${String(size).padStart(3)}×${size}  (${(buf.length / 1024).toFixed(1)} KB)`)
      return { size, buf }
    })
  )
  const ico = buildIco(icoImages)
  fs.writeFileSync(path.join(OUT_ICONS, 'icon.ico'), ico)
  console.log(`✓  icon.ico        multi-size  (${(ico.length / 1024).toFixed(1)} KB)`)

  console.log(`\nAll ZenDev icons successfully written.`)
}

main().catch((err) => {
  console.error('✗ Icon generation failed:', err.message)
  process.exit(1)
})
