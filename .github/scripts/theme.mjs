// Shared look for every generated image: Queen's lofi palette (same as her portfolio),
// fonts that exist on every device (SVGs shown as images can't load web fonts), and helpers.

export const C = {
  lavender: '#bda6ff', cyan: '#4ff7ff', pink: '#ff4fae', green: '#3dffc5', purple: '#9f72ff',
  rose: '#ff8ccc', mint: '#7dffcb', sky: '#9fdcff', gold: '#ffd95e',
  night0: '#0b0818', night1: '#160f33', night2: '#24164f', ink: '#e9e2ff', dim: '#b7aedc',
}
export const RAINBOW = [C.lavender, C.cyan, C.pink, C.green, C.gold, C.rose, C.mint, C.sky, C.purple]
export const BULBS = [C.gold, C.pink, C.cyan, C.lavender, C.green, C.rose, C.sky]

export const SERIF = "Georgia, 'Times New Roman', 'Noto Serif', serif"
export const SANS = "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, 'Noto Sans', sans-serif"
export const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace"

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export const r1 = (n) => Math.round(n * 10) / 10

// deterministic pseudo-random (same picture every time the files are rebuilt)
export function rng(seed = 1) {
  let s = seed >>> 0 || 1
  return () => { s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0; s ^= s >>> 13; return (s >>> 0) / 4294967296 }
}

/** Card frame: night gradient, rounded, with an animated rainbow border. */
export function cardFrame(w, h, id, inner, { title, titleColor = C.lavender } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title ?? '')}">
<defs>
  <linearGradient id="${id}-bg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${C.night2}"/><stop offset="1" stop-color="${C.night0}"/></linearGradient>
  <linearGradient id="${id}-rim" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="${h}">
    <stop offset="0" stop-color="${C.lavender}"/><stop offset="0.25" stop-color="${C.cyan}"/><stop offset="0.5" stop-color="${C.pink}"/><stop offset="0.75" stop-color="${C.green}"/><stop offset="1" stop-color="${C.lavender}"/>
    <animateTransform attributeName="gradientTransform" type="rotate" values="0 ${w / 2} ${h / 2};360 ${w / 2} ${h / 2}" dur="8s" repeatCount="indefinite"/>
  </linearGradient>
  <radialGradient id="${id}-glow" cx="0.5" cy="0" r="0.9"><stop offset="0" stop-color="${C.purple}" stop-opacity="0.28"/><stop offset="1" stop-color="${C.purple}" stop-opacity="0"/></radialGradient>
</defs>
<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="18" fill="url(#${id}-bg)"/>
<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="18" fill="url(#${id}-glow)"/>
<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="18" fill="none" stroke="url(#${id}-rim)" stroke-width="2.2"/>
${title ? `<text x="24" y="38" font-family="${SANS}" font-size="15" font-weight="800" letter-spacing="2.4" fill="${titleColor}">${esc(title.toUpperCase())}</text>` : ''}
${inner}
</svg>
`
}
