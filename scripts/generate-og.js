// Generates public/og-cover.png (1200×630) — the social preview image.
// Builds an SVG string, then rasterizes it to PNG with sharp.
// Run with: node scripts/generate-og.js
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = join(__dirname, '..', 'public', 'og-cover.png')

const W = 1200
const H = 630
const BG = '#0a0a0f'
const CYAN = '#00e5ff'
const PURPLE = '#7c3aed'

// A four-point sparkle star, drawn as a path so we don't depend on emoji fonts.
function star(cx, cy, r) {
  const i = r * 0.34 // inner radius
  return `M ${cx} ${cy - r} L ${cx + i} ${cy - i} L ${cx + r} ${cy} L ${cx + i} ${cy + i} L ${cx} ${cy + r} L ${cx - i} ${cy + i} L ${cx - r} ${cy} L ${cx - i} ${cy - i} Z`
}

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#1a0533"/>
    </linearGradient>
    <linearGradient id="title" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${CYAN}"/>
      <stop offset="100%" stop-color="#7df9ff"/>
    </linearGradient>
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,229,255,0.08)" stroke-width="1"/>
    </pattern>
    <radialGradient id="glow" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="rgba(124,58,237,0.35)"/>
      <stop offset="100%" stop-color="rgba(124,58,237,0)"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Neon frame -->
  <rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="24"
        fill="none" stroke="rgba(0,229,255,0.25)" stroke-width="2"/>

  <!-- Aria badge -->
  <g transform="translate(600, 150)">
    <rect x="-110" y="-30" width="220" height="60" rx="30"
          fill="rgba(124,58,237,0.18)" stroke="${PURPLE}" stroke-width="2"/>
    <path d="${star(-72, 0, 14)}" fill="${CYAN}"/>
    <text x="6" y="11" font-family="Arial, Helvetica, sans-serif" font-size="30"
          font-weight="700" fill="#e9d5ff" text-anchor="middle">Aria</text>
  </g>

  <!-- Title -->
  <text x="600" y="350" font-family="Arial, Helvetica, sans-serif" font-size="118"
        font-weight="800" fill="url(#title)" text-anchor="middle"
        letter-spacing="-2">EnglishQuest</text>

  <!-- Subtitle -->
  <text x="600" y="430" font-family="Arial, Helvetica, sans-serif" font-size="46"
        font-weight="700" fill="${PURPLE}" text-anchor="middle">Your AI English Coach</text>

  <!-- Feature line -->
  <text x="600" y="500" font-family="Arial, Helvetica, sans-serif" font-size="28"
        fill="#94a3b8" text-anchor="middle">14 modules · Live voice coaching · XP &amp; streaks</text>

  <!-- URL -->
  <text x="600" y="575" font-family="Arial, Helvetica, sans-serif" font-size="26"
        font-weight="600" fill="${CYAN}" text-anchor="middle">english-quest-olive.vercel.app</text>
</svg>`

const buf = await sharp(Buffer.from(svg)).png().toBuffer()
await sharp(buf).toFile(out)
console.log(`Wrote ${out} (${buf.length} bytes)`)
