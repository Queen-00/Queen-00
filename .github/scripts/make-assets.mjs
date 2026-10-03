// Builds the hand-made animated graphics in /assets (banner, dividers, headers, skill
// cards, buttons). Run with: node .github/scripts/make-assets.mjs
// Every graphic is a standalone .svg shown as an <img>, so it renders (and animates) the
// same on github.com, mobile browsers and the GitHub app — inline <svg> does not.
import { writeFileSync, mkdirSync } from 'node:fs'
import { C, BULBS, SERIF, SANS, esc, r1, rng, cardFrame } from './theme.mjs'

const OUT = new URL('../../assets/', import.meta.url)
mkdirSync(OUT, { recursive: true })
const save = (name, svg) => writeFileSync(new URL(name, OUT), svg)

const sparkle = (x, y, s, color, delay = 0) => `<g transform="translate(${x} ${y})"><path d="M0 ${-s} C ${s * 0.18} ${-s * 0.18} ${s * 0.18} ${-s * 0.18} ${s} 0 C ${s * 0.18} ${s * 0.18} ${s * 0.18} ${s * 0.18} 0 ${s} C ${-s * 0.18} ${s * 0.18} ${-s * 0.18} ${s * 0.18} ${-s} 0 C ${-s * 0.18} ${-s * 0.18} ${-s * 0.18} ${-s * 0.18} 0 ${-s} Z" fill="${color}"><animate attributeName="opacity" values="0.25;1;0.25" dur="2.4s" begin="${delay}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="scale" values="0.7;1.15;0.7" dur="2.4s" begin="${delay}s" repeatCount="indefinite"/></path></g>`

const leaf = (x, y, rot, s, fill) => `<path transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(rot)}) scale(${r1(s * 100) / 100})" d="M0 0 C -9 4 -10 17 0 24 C 10 17 9 4 0 0 Z" fill="${fill}"/>`

// fairy-light string: drooping wire + glass bulbs that each fade on their own rhythm
function lights(w, y0, sag, n, seed, swags = 3) {
  const r = rng(seed)
  const wy = (x) => { const u = x / w * swags, f = u - Math.floor(u); return y0 + sag * 4 * f * (1 - f) }
  let path = `M0 ${y0}`
  for (let x = 6; x <= w; x += 6) path += ` L${x} ${r1(wy(x))}`
  let out = `<path d="${path}" fill="none" stroke="#1e3a2e" stroke-width="2"/>`
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * w / n, y = wy(x) + 2, c = BULBS[Math.floor(r() * BULBS.length)]
    const dur = r1(1.6 + r() * 2.2), d = r1(-r() * 4)
    out += `<g><rect x="${r1(x - 3)}" y="${r1(y - 2)}" width="6" height="7" rx="1.5" fill="#22352c"/>
<circle cx="${r1(x)}" cy="${r1(y + 12)}" r="17" fill="${c}" opacity="0.2"><animate attributeName="opacity" values="0.05;0.42;0.05" dur="${dur}s" begin="${d}s" repeatCount="indefinite"/></circle>
<ellipse cx="${r1(x)}" cy="${r1(y + 12)}" rx="5.5" ry="7.5" fill="${c}"><animate attributeName="opacity" values="0.45;1;0.45" dur="${dur}s" begin="${d}s" repeatCount="indefinite"/></ellipse>
<ellipse cx="${r1(x - 1.8)}" cy="${r1(y + 9.5)}" rx="1.4" ry="2.6" fill="#fff" opacity="0.7"/></g>`
    if (i % 2 === 0) out += leaf(x + 14, wy(x + 14), 120 + r() * 60, 0.55, i % 4 ? '#3fd88f' : '#2fbf79')
  }
  return out
}

// ─── Banner ───────────────────────────────────────────────────────────────────
function banner() {
  const W = 1200, H = 420, r = rng(7)
  let stars = '', rain = '', clouds = ''
  for (let i = 0; i < 46; i++) stars += `<circle cx="${r1(r() * W)}" cy="${r1(20 + r() * 260)}" r="${r1(0.6 + r() * 1.4)}" fill="#fff"><animate attributeName="opacity" values="0.15;0.9;0.15" dur="${r1(2 + r() * 3)}s" begin="${r1(-r() * 4)}s" repeatCount="indefinite"/></circle>`
  const rc = [C.lavender, C.cyan, C.sky, C.pink, C.purple]
  for (let i = 0; i < 70; i++) {
    const x = r1(r() * (W + 120)), len = r1(12 + r() * 16), dur = r1(0.8 + r() * 0.9)
    rain += `<line x1="${x}" y1="0" x2="${r1(x - len * 0.15)}" y2="${len}" stroke="${rc[i % rc.length]}" stroke-width="${r1(1 + r())}" stroke-linecap="round" opacity="${r1(0.25 + r() * 0.4)}"><animateTransform attributeName="transform" type="translate" values="0 -40;-70 ${H + 20}" dur="${dur}s" begin="${r1(-r() * 2)}s" repeatCount="indefinite"/></line>`
  }
  const cloud = (cx, cy, s, op, dur, begin) => `<g opacity="${op}"><animateTransform attributeName="transform" type="translate" values="-${W * 0.35} 0;${W * 0.35} 0;-${W * 0.35} 0" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
<g transform="translate(${cx} ${cy}) scale(${s})" fill="url(#cloud)"><ellipse cx="0" cy="0" rx="120" ry="34"/><ellipse cx="-50" cy="-18" rx="55" ry="38"/><ellipse cx="30" cy="-30" rx="62" ry="46"/><ellipse cx="85" cy="-8" rx="46" ry="30"/></g></g>`
  clouds += cloud(230, 300, 1.1, 0.5, 70, -10) + cloud(900, 330, 1.3, 0.45, 90, -40) + cloud(620, 150, 0.8, 0.3, 80, -25) + cloud(1050, 210, 0.9, 0.32, 75, -60)
  // vines in the top corners
  const vine = (x, flip, len, seed) => {
    const rr = rng(seed); let p = `M${x} 0`, ls = ''
    for (let y = 8; y <= len; y += 8) p += ` L${r1(x + Math.sin(y / 30 + seed) * 7 * (y / len + 0.2) * flip)} ${y}`
    for (let y = 16, i = 0; y < len; y += 18 + rr() * 8, i++) ls += leaf(x + Math.sin(y / 30 + seed) * 7 * (y / len + 0.2) * flip, y, (i % 2 ? 1 : -1) * (40 + rr() * 30), 0.75 + rr() * 0.4, ['#5ff2a8', '#3fd88f', '#7dffc0', '#2fbf79'][i % 4])
    return `<g><animateTransform attributeName="transform" type="rotate" values="-2 ${x} 0;2 ${x} 0;-2 ${x} 0" dur="${6 + seed % 3}s" repeatCount="indefinite"/><path d="${p}" stroke="#1f8a57" stroke-width="2.4" fill="none"/>${ls}</g>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Queen — full-stack developer, game dev and creator">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0824"/><stop offset="0.55" stop-color="#241552"/><stop offset="1" stop-color="#3b1a5e"/></linearGradient>
  <linearGradient id="cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3b2ff"/><stop offset="1" stop-color="#4b3a8f"/></linearGradient>
  <radialGradient id="moonGlow"><stop offset="0" stop-color="#fff3cf" stop-opacity="0.55"/><stop offset="1" stop-color="#fff3cf" stop-opacity="0"/></radialGradient>
  <linearGradient id="title" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1200" y2="0">
    <stop offset="0" stop-color="${C.lavender}"/><stop offset="0.2" stop-color="${C.cyan}"/><stop offset="0.4" stop-color="${C.pink}"/><stop offset="0.6" stop-color="${C.green}"/><stop offset="0.8" stop-color="${C.lavender}"/><stop offset="1" stop-color="${C.cyan}"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="-600 0;0 0" dur="6s" repeatCount="indefinite"/>
  </linearGradient>
  <linearGradient id="rim" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="${H}">
    <stop offset="0" stop-color="${C.lavender}"/><stop offset="0.33" stop-color="${C.cyan}"/><stop offset="0.66" stop-color="${C.pink}"/><stop offset="1" stop-color="${C.green}"/>
    <animateTransform attributeName="gradientTransform" type="rotate" values="0 600 210;360 600 210" dur="10s" repeatCount="indefinite"/>
  </linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
  <clipPath id="frame"><rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="26"/></clipPath>
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars}
  <circle cx="1060" cy="96" r="80" fill="url(#moonGlow)"/>
  <circle cx="1060" cy="96" r="30" fill="#ffeec2"/><circle cx="1074" cy="86" r="27" fill="#150d34"/>
  ${clouds}
  ${rain}
  ${vine(28, 1, 230, 3)}${vine(64, 1, 150, 5)}${vine(W - 28, -1, 210, 4)}${vine(W - 66, -1, 160, 6)}
  ${lights(W, 14, 46, 30, 11, 3)}
  <text x="600" y="262" text-anchor="middle" font-family="${SERIF}" font-size="138" font-weight="700" fill="url(#title)" opacity="0.55" filter="url(#soft)">Queen</text>
  <text x="600" y="262" text-anchor="middle" font-family="${SERIF}" font-size="138" font-weight="700" fill="url(#title)">Queen</text>
  ${sparkle(352, 168, 13, C.gold, 0)}${sparkle(866, 150, 10, C.cyan, 0.8)}${sparkle(838, 262, 8, C.pink, 1.6)}
  <text x="600" y="314" text-anchor="middle" font-family="${SANS}" font-size="25" font-weight="700" letter-spacing="1.5" fill="${C.sky}">Full-Stack Developer · Game Dev · Creator</text>
  <text x="600" y="350" text-anchor="middle" font-family="${SANS}" font-size="17" font-weight="600" letter-spacing="1" fill="${C.rose}">Owner, CEO &amp; Founder of WonderlandXXX Industries™  ·  coding &amp; coffee</text>
</g>
<rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="26" fill="none" stroke="url(#rim)" stroke-width="4"/>
</svg>
`
}

// ─── Fairy-light divider with hanging vines ───────────────────────────────────
const LEAVES = ['#5ff2a8', '#3fd88f', '#7dffc0', '#2fbf79']
const PETALS = [C.pink, C.lavender, C.rose, C.sky, C.gold]

const flower = (x, y, s, c, d) => {
  let p = ''
  for (let k = 0; k < 5; k++) p += `<ellipse cx="0" cy="${-3.6 * s}" rx="${r1(2.4 * s)}" ry="${r1(3.6 * s)}" fill="${c}" transform="rotate(${k * 72})"/>`
  return `<g transform="translate(${r1(x)} ${r1(y)})"><circle r="${r1(9 * s)}" fill="${c}" opacity="0.18"><animate attributeName="opacity" values="0.05;0.35;0.05" dur="3s" begin="${d}s" repeatCount="indefinite"/></circle>${p}<circle r="${r1(1.7 * s)}" fill="${C.gold}"/></g>`
}

// a vine strand dangling from (x, y): wiggly stem, alternating leaves, a flower or two, gently swaying
function hangingVine(x, y, len, seed, flowers = 2) {
  const r = rng(seed), ph = r() * 6
  const px = (t) => x + Math.sin(t / 22 + ph) * 5 * (t / len + 0.15)
  let d = `M${r1(x)} ${r1(y)}`
  for (let t = 5; t <= len; t += 5) d += ` L${r1(px(t))} ${r1(y + t)}`
  let ls = '', fl = ''
  for (let t = 10, i = 0; t < len - 4; t += 11 + r() * 6, i++) ls += leaf(px(t), y + t, (i % 2 ? 1 : -1) * (35 + r() * 35), 0.42 + 0.3 * (1 - t / len), LEAVES[i % 4])
  for (let k = 0; k < flowers; k++) {
    const t = len * (k === 0 ? 1 : 0.35 + r() * 0.3)
    fl += flower(px(t), y + t + 2, 0.9 + r() * 0.35, PETALS[Math.floor(r() * PETALS.length)], r1(-r() * 3))
  }
  const sway = r1(2.5 + r() * 2.5), dur = r1(4.5 + r() * 3)
  return `<g><animateTransform attributeName="transform" type="rotate" values="-${sway} ${r1(x)} ${r1(y)};${sway} ${r1(x)} ${r1(y)};-${sway} ${r1(x)} ${r1(y)}" dur="${dur}s" begin="${r1(-r() * dur)}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
<path d="${d}" stroke="#1f8a57" stroke-width="2" fill="none" stroke-linecap="round"/>${ls}${fl}</g>`
}

// a small charm hanging on a thread: crescent moon or star, twinkling
function charm(x, y, len, kind, c, seed) {
  const r = rng(seed), dur = r1(5 + r() * 2), cy = y + len
  const body = kind === 'moon'
    ? `<path d="M${x + 9} ${cy + 6} A11 11 0 1 1 ${x - 1} ${cy - 9} A8.5 8.5 0 0 0 ${x + 9} ${cy + 6} Z" fill="${c}"/>`
    : `<path d="M${x} ${cy - 11} L${r1(x + 3.2)} ${r1(cy - 3.5)} L${x + 11} ${r1(cy - 3.2)} L${r1(x + 4.8)} ${r1(cy + 2)} L${r1(x + 6.8)} ${cy + 10} L${x} ${r1(cy + 5.4)} L${r1(x - 6.8)} ${cy + 10} L${r1(x - 4.8)} ${r1(cy + 2)} L${x - 11} ${r1(cy - 3.2)} L${r1(x - 3.2)} ${r1(cy - 3.5)} Z" fill="${c}" stroke-linejoin="round"/>`
  return `<g><animateTransform attributeName="transform" type="rotate" values="-6 ${x} ${y};6 ${x} ${y};-6 ${x} ${y}" dur="${dur}s" begin="${r1(-r() * dur)}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
<line x1="${x}" y1="${y}" x2="${x}" y2="${cy - 10}" stroke="${c}" stroke-opacity="0.45" stroke-width="1"/>
<circle cx="${x}" cy="${cy}" r="22" fill="${c}" opacity="0.15"><animate attributeName="opacity" values="0.05;0.3;0.05" dur="2.8s" repeatCount="indefinite"/></circle>${body}</g>`
}

// little cat sitting on the wire, tail swishing, blinking
function wireCat(x, y) {
  return `<g transform="translate(${x} ${y}) scale(1.45)">
<g><animateTransform attributeName="transform" type="rotate" values="-14 10 -6;18 10 -6;-14 10 -6" dur="3.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
<path d="M10 -6 C 22 -2 26 10 20 22 C 18 27 22 30 26 28" stroke="#43307f" stroke-width="5" fill="none" stroke-linecap="round"/></g>
<path d="M-14 0 C -16 -16 -10 -26 0 -27 C 10 -26 16 -16 14 0 Z" fill="#43307f" stroke="${C.lavender}" stroke-opacity="0.5" stroke-width="1.2"/>
<path d="M-11 -34 L -12 -48 L -3 -40 Z M11 -34 L 12 -48 L 3 -40 Z" fill="#43307f"/>
<ellipse cx="0" cy="-34" rx="13" ry="11" fill="#43307f" stroke="${C.lavender}" stroke-opacity="0.5" stroke-width="1.2"/>
<path d="M-9.5 -38 L -10 -45 L -5.5 -40 Z M9.5 -38 L 10 -45 L 5.5 -40 Z" fill="${C.pink}" opacity="0.6"/>
<g transform="translate(0 -35)"><g fill="${C.gold}"><ellipse cx="-4.6" cy="0" rx="2.1" ry="2.6"/><ellipse cx="4.6" cy="0" rx="2.1" ry="2.6"/>
<animateTransform attributeName="transform" type="scale" values="1 1;1 1;1 0.1;1 1" keyTimes="0;0.9;0.95;1" dur="4.5s" repeatCount="indefinite"/></g></g>
<path d="M-1.5 -30.5 L 1.5 -30.5 L 0 -29 Z" fill="${C.pink}"/>
<path d="M-6 0 C -6 -3 -2 -3 -2 0 M2 0 C 2 -3 6 -3 6 0" stroke="#5a44a3" stroke-width="2" fill="none"/>
</g>`
}

function divider(seed, extra, top = 0) {
  const W = 1200, H = 170 + top, y0 = 8 + top, sag = 30, sw = 3
  const wy = (x) => { const u = x / W * sw, f = u - Math.floor(u); return y0 + sag * 4 * f * (1 - f) + 2 }
  const r = rng(seed + 100)
  let vines = ''
  // a few strands of different lengths spaced along the string, longest near each swag's low point
  const spots = [70, 205, 330, 470, 600, 735, 870, 1000, 1135]
  spots.forEach((x, i) => {
    const xx = x + (r() - 0.5) * 30, low = Math.sin(Math.PI * ((xx / W * sw) % 1))
    vines += hangingVine(xx, wy(xx), 42 + low * 50 + r() * 20, seed * 10 + i, i % 3 === 1 ? 2 : 1)
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="fairy lights with hanging vines">
${vines}
${lights(W, y0, sag, 28, seed, sw)}
${extra ? extra(wy) : ''}
</svg>
`
}

// ─── Coloured taglines (short lines of shimmering text under each header) ────
function tagline(text, from, to, seed) {
  const W = 620, H = 56, id = 't' + seed
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(text)}">
<defs>
  <linearGradient id="${id}" gradientUnits="userSpaceOnUse" spreadMethod="reflect" x1="0" y1="0" x2="${W}" y2="0">
    <stop offset="0" stop-color="${from}"/><stop offset="0.5" stop-color="${to}"/><stop offset="1" stop-color="${from}"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="0 0;${W} 0" dur="6s" repeatCount="indefinite"/>
  </linearGradient>
</defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${H / 2 - 1}" fill="${C.night0}" opacity="0.92"/>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${H / 2 - 1}" fill="none" stroke="url(#${id})" stroke-opacity="0.35"/>
${sparkle(26, 28, 8, from, 0)}${sparkle(W - 26, 28, 8, to, 1.2)}
<text x="${W / 2}" y="36" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="24" font-weight="700" fill="url(#${id})">${esc(text)}</text>
</svg>
`
}

// ─── Line-art icons (used instead of emojis) ──────────────────────────────────
// Drawn on a 24-unit grid with a neon gradient stroke and a softly pulsing glow.
const ICONS = {
  web: `<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 8.5 H21 M9 12 L6.8 14.5 L9 17 M15 12 L17.2 14.5 L15 17 M12.8 11.3 L11.2 17.7"/>`,
  cube: `<path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z M4 7.5 L12 12 L20 7.5 M12 12 V21"/>`,
  game: `<path d="M7 8 H17 C20 8 22 11 22 15 C22 18 20 19 18.5 17.5 L16 15 H8 L5.5 17.5 C4 19 2 18 2 15 C2 11 4 8 7 8 Z M7 10.5 V13.5 M5.5 12 H8.5"/><circle cx="16" cy="11" r="0.9"/><circle cx="18" cy="13" r="0.9"/>`,
  music: `<path d="M9 18 V6 L19 4 V16"/><circle cx="7" cy="18" r="2.2"/><circle cx="17" cy="16" r="2.2"/>`,
  bot: `<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 5 V8 M10 16 H14 M3 12 V15 M21 12 V15"/><circle cx="12" cy="4" r="1.1"/><circle cx="9.5" cy="12.5" r="1.1"/><circle cx="14.5" cy="12.5" r="1.1"/>`,
  palette: `<path d="M12 3 C7 3 3 6.8 3 11.5 C3 16 6.5 20 11 20 C12.5 20 13 19 12.5 17.8 C12 16.5 12.8 15.5 14 15.5 H16 C19 15.5 21 13.5 21 11 C21 6.5 17 3 12 3 Z"/><circle cx="8" cy="10.5" r="1.2"/><circle cx="11" cy="7" r="1.2"/><circle cx="15.5" cy="7.5" r="1.2"/><circle cx="17.5" cy="11" r="1.2"/>`,
  film: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5 V19 M17 5 V19 M3 9 H7 M3 15 H7 M17 9 H21 M17 15 H21 M10.5 9.5 L14 12 L10.5 14.5 Z"/>`,
  frame: `<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 16 L9 11 L13 15 L15 13 L20 18"/><circle cx="15" cy="8.5" r="1.6"/>`,
  layers: `<rect x="8" y="3" width="12" height="15" rx="2"/><path d="M5 6.5 V19 C5 20.2 5.8 21 7 21 H16 M11 8 H17 M11 11 H17 M11 14 H15"/>`,
  ai: `<path d="M6 7 L12 12 L18 7 M6 17 L12 12 L18 17 M6 7 V17 M18 7 V17"/><circle cx="6" cy="7" r="1.8"/><circle cx="6" cy="17" r="1.8"/><circle cx="12" cy="12" r="2.2"/><circle cx="18" cy="7" r="1.8"/><circle cx="18" cy="17" r="1.8"/>`,
  quill: `<path d="M20 3 C12 4 7 9 5 19 M20 3 C19.5 10 14.5 15 7.5 15.5 M8.5 12 L13 12 M5 19 L4 21.5"/>`,
  cap: `<path d="M2 9 L12 4 L22 9 L12 14 Z M6 11 V16 C6 17.5 9 19 12 19 C15 19 18 17.5 18 16 V11 M22 9 V14"/>`,
  medal: `<circle cx="12" cy="15" r="5.5"/><path d="M8 2.5 L10.5 10 M16 2.5 L13.5 10 M12 12.5 L12.8 14.3 L14.6 14.4 L13.2 15.6 L13.7 17.4 L12 16.4 L10.3 17.4 L10.8 15.6 L9.4 14.4 L11.2 14.3 Z"/>`,
  disk: `<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4 V9 H15 V4 M7 20 V13.5 H17 V20"/>`,
  globe: `<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12 H21"/>`,
  books: `<rect x="3.5" y="4" width="4.5" height="16" rx="1"/><rect x="9" y="4" width="4.5" height="16" rx="1"/><path d="M14.5 5.2 L18.2 4.3 L21.3 19 L17.6 19.9 Z"/>`,
  coffee: `<path d="M4 9.5 H16 V14 C16 17 13.5 19.5 10 19.5 C6.5 19.5 4 17 4 14 Z M16 10.5 H17.8 C19.3 10.5 20 11.4 20 12.6 C20 14 19 15 16 15"/><path d="M8 2.8 C7 4.3 9 4.8 8 6.5 M12 2.8 C11 4.3 13 4.8 12 6.5"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.2s" repeatCount="indefinite"/></path>`,
  toolbox: `<rect x="3" y="9" width="18" height="11" rx="2"/><path d="M9 9 V6 H15 V9 M3 13.5 H21"/><rect x="10.5" y="12" width="3" height="3" rx="0.5"/>`,
  heart: `<g transform="translate(12 12)"><g><animateTransform attributeName="transform" type="scale" values="1;1.1;1;1.06;1" keyTimes="0;0.15;0.3;0.45;1" dur="1.6s" repeatCount="indefinite"/><path transform="translate(-12 -12)" d="M12 20 C5 15 3 11.5 3 8.5 C3 6 5 4 7.5 4 C9.5 4 11 5 12 6.5 C13 5 14.5 4 16.5 4 C19 4 21 6 21 8.5 C21 11.5 19 15 12 20 Z"/></g></g>`,
  sparkle: `<path d="M12 2.5 C12.6 8.5 15.5 11.4 21.5 12 C15.5 12.6 12.6 15.5 12 21.5 C11.4 15.5 8.5 12.6 2.5 12 C8.5 11.4 11.4 8.5 12 2.5 Z"/><path d="M19 3 V6.5 M17.2 4.8 H20.8"/>`,
  sprout: `<path d="M12 21 V11 M12 14 C12 10 9 8 5 8 C5 12 8 14 12 14 M12 11 C12 7.5 14.5 5 19 5 C19 9 16 11 12 11"/>`,
  rose: `<path d="M12 4 C8 4 7 7.5 8.5 10 C10 12.5 14 12.5 15.5 10 C17 7.5 16 4 12 4 Z M12 7 C10.8 7 10.5 8.3 11.4 9 M12 12 V21 M12 16 C10 14.5 7.5 14.8 6.5 16.5 C8.5 17.5 10.5 17.2 12 16 M12 18 C13.6 16.8 15.8 16.9 17 18.3"/>`,
}
const ICON_COLORS = {
  web: [C.cyan, C.lavender], cube: [C.lavender, C.pink], game: [C.cyan, C.green], music: [C.gold, C.pink],
  bot: [C.lavender, C.cyan], palette: [C.pink, C.gold], film: [C.rose, C.lavender], frame: [C.sky, C.pink],
  layers: [C.mint, C.cyan], ai: [C.purple, C.cyan], quill: [C.rose, C.lavender], cap: [C.gold, C.lavender],
  medal: [C.gold, C.pink], disk: [C.cyan, C.sky], globe: [C.green, C.cyan], books: [C.lavender, C.rose],
  coffee: [C.gold, C.rose], toolbox: [C.cyan, C.gold], heart: [C.pink, C.rose], sparkle: [C.gold, C.pink],
  sprout: [C.green, C.mint], rose: [C.pink, C.green],
}
function icon(name) {
  const [a, b] = ICON_COLORS[name], id = 'i-' + name
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" role="img" aria-label="${name}">
<defs>
  <linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    <animateTransform attributeName="gradientTransform" type="rotate" values="0 12 12;360 12 12" dur="6s" repeatCount="indefinite"/></linearGradient>
  <filter id="${id}-g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1"/></filter>
</defs>
<g fill="none" stroke="url(#${id})" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
  <g filter="url(#${id}-g)" opacity="0.6"><animate attributeName="opacity" values="0.25;0.75;0.25" dur="2.6s" repeatCount="indefinite"/>${ICONS[name]}</g>
  ${ICONS[name]}
</g>
</svg>
`
}

// ─── Section headers ──────────────────────────────────────────────────────────
function header(text, from, to, seed) {
  const W = 820, H = 78, id = 'h' + seed
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(text)}">
<defs>
  <linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">
    <stop offset="0" stop-color="${from}"/><stop offset="0.25" stop-color="${to}"/><stop offset="0.5" stop-color="${from}"/><stop offset="0.75" stop-color="${to}"/><stop offset="1" stop-color="${from}"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="-${W / 2} 0;0 0" dur="5s" repeatCount="indefinite"/>
  </linearGradient>
</defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="22" fill="${C.night1}"/>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="22" fill="none" stroke="url(#${id})" stroke-opacity="0.55" stroke-width="1.5"/>
<rect x="250" y="62" width="320" height="3" rx="1.5" fill="url(#${id})" opacity="0.8"/>
${sparkle(170, 34, 11, from, 0)}${sparkle(650, 34, 11, to, 1.2)}
<text x="410" y="46" text-anchor="middle" font-family="${SERIF}" font-size="36" font-weight="700" fill="url(#${id})">${esc(text)}</text>
</svg>
`
}

// ─── Skill cards (bars fill in when the image loads) ──────────────────────────
function skillCard(id, title, color, skills) {
  const W = 400, H = 340
  let bars = ''
  skills.forEach(([name, level, pct, c], i) => {
    const y = 74 + i * 43, bw = 352, fw = r1(bw * pct / 100)
    bars += `<text x="24" y="${y}" font-family="${SANS}" font-size="15" font-weight="700" fill="${c}">${esc(name)}</text>
<text x="376" y="${y}" text-anchor="end" font-family="${SANS}" font-size="13" font-weight="600" fill="${c}" opacity="0.85">${esc(level)}</text>
<rect x="24" y="${y + 8}" width="${bw}" height="9" rx="4.5" fill="#ffffff" opacity="0.08"/>
<rect x="24" y="${y + 8}" width="0" height="9" rx="4.5" fill="url(#${id}-b${i})"><animate attributeName="width" from="0" to="${fw}" dur="1.5s" begin="${r1(0.15 + i * 0.12)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.8 0.2 1"/></rect>
<circle cx="24" cy="${y + 12.5}" r="5" fill="#fff" opacity="0"><animate attributeName="cx" from="24" to="${r1(24 + fw)}" dur="1.5s" begin="${r1(0.15 + i * 0.12)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.8 0.2 1"/><animate attributeName="opacity" values="0;0.9;0.6" dur="1.5s" begin="${r1(0.15 + i * 0.12)}s" fill="freeze"/></circle>`
  })
  const defs = skills.map(([, , , c], i) => `<linearGradient id="${id}-b${i}" x1="0" x2="1"><stop offset="0" stop-color="${c}" stop-opacity="0.55"/><stop offset="1" stop-color="${c}"/></linearGradient>`).join('')
  return cardFrame(W, H, id, `<defs>${defs}</defs>${bars}`, { title, titleColor: color })
}

function learningCard() {
  const W = 400, H = 340, id = 'learn'
  const item = (y, name, note, c, d) => `<rect x="24" y="${y}" width="352" height="96" rx="14" fill="${c}" opacity="0.1"/>
<rect x="24" y="${y}" width="352" height="96" rx="14" fill="none" stroke="${c}" stroke-opacity="0.5"/>
<text x="44" y="${y + 38}" font-family="${SERIF}" font-size="26" font-weight="700" fill="${c}">${esc(name)}</text>
<text x="44" y="${y + 62}" font-family="${SANS}" font-size="13.5" font-weight="600" fill="${C.sky}">${esc(note)}</text>
<rect x="44" y="${y + 74}" width="312" height="6" rx="3" fill="#fff" opacity="0.08"/>
<rect x="44" y="${y + 74}" width="90" height="6" rx="3" fill="${c}"><animate attributeName="x" values="44;266;44" dur="3.2s" begin="${d}s" repeatCount="indefinite"/></rect>`
  return cardFrame(W, H, id, `${item(62, 'Unity', 'C# game engine · 2D & 3D builds', C.green, 0)}${item(176, 'Verse', 'Epic’s language for UEFN / Fortnite islands', C.pink, 0.6)}
<text x="200" y="312" text-anchor="middle" font-family="${SANS}" font-size="13" font-weight="700" fill="${C.lavender}">always something new to learn &amp; try</text>`, { title: 'Currently learning', titleColor: C.green })
}

// ─── Buttons ──────────────────────────────────────────────────────────────────
function button(id, label, from, to) {
  const W = 260, H = 60
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
<defs>
  <linearGradient id="${id}" gradientUnits="userSpaceOnUse" spreadMethod="reflect" x1="0" y1="0" x2="${W}" y2="0"><stop offset="0" stop-color="${from}"/><stop offset="0.5" stop-color="${to}"/><stop offset="1" stop-color="${from}"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="-${W} 0;${W} 0" dur="4s" repeatCount="indefinite"/></linearGradient>
  <linearGradient id="${id}-s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="${id}-c"><rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="28"/></clipPath>
</defs>
<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="28" fill="${C.night1}"/>
<g clip-path="url(#${id}-c)"><rect x="-80" y="0" width="60" height="${H}" fill="url(#${id}-s)" transform="skewX(-20)"><animate attributeName="x" values="-80;${W + 60}" dur="3s" repeatCount="indefinite"/></rect></g>
<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="28" fill="none" stroke="url(#${id})" stroke-width="2.5"/>
<text x="${W / 2}" y="37" text-anchor="middle" font-family="${SANS}" font-size="17" font-weight="800" letter-spacing="0.5" fill="url(#${id})">${esc(label)}</text>
</svg>
`
}

save('banner.svg', banner())
save('divider-1.svg', divider(21))
save('divider-2.svg', divider(37, () => charm(400, 26, 62, 'moon', C.gold, 1) + charm(800, 26, 76, 'star', C.lavender, 2) + charm(1100, 30, 52, 'star', C.cyan, 3)))
save('divider-3.svg', divider(53, (wy) => wireCat(668, wy(668) - 1), 44))
const T = [
  ['t-about.svg', 'Coding since 13 · building worlds ever since', C.lavender, C.pink],
  ['t-build.svg', 'Your vision, your way · from concept to launch', C.mint, C.cyan],
  ['t-skills.svg', 'TypeScript has my whole heart ♥', C.pink, C.lavender],
  ['t-games.svg', 'No downloads · just press play', C.cyan, C.gold],
  ['t-music.svg', 'Every note made in code · zero audio files', C.gold, C.pink],
  ['t-stats.svg', 'Redrawn every day, straight from my commits', C.green, C.cyan],
  ['t-certs.svg', 'Art-school trained · Adobe certified', C.gold, C.rose],
  ['t-contact.svg', 'No matter what you do, I can build your vision', C.cyan, C.pink],
]
T.forEach(([f, t, a, b], i) => save(f, tagline(t, a, b, i)))
mkdirSync(new URL('icons/', OUT), { recursive: true })
for (const name of Object.keys(ICONS)) save(`icons/${name}.svg`, icon(name))
const H = [
  ['h-about.svg', 'Heya, I’m Queen!', C.lavender, C.cyan],
  ['h-build.svg', 'What I Build', C.mint, C.cyan],
  ['h-skills.svg', 'Skills & Stack', C.pink, C.lavender],
  ['h-games.svg', 'Game Development', C.cyan, C.gold],
  ['h-music.svg', 'Lofi Sound Studio', C.pink, C.gold],
  ['h-stats.svg', 'My GitHub, in Charts', C.green, C.cyan],
  ['h-certs.svg', 'Background & Certs', C.gold, C.rose],
  ['h-contact.svg', 'Let’s Work Together', C.cyan, C.pink],
]
H.forEach(([f, t, a, b], i) => save(f, header(t, a, b, i)))
save('skills-core.svg', skillCard('core', 'Core — strongest', C.cyan, [
  ['JavaScript', 'Expert', 95, C.gold], ['TypeScript ♥', 'Advanced', 90, C.cyan], ['React 19', 'Advanced', 88, C.sky],
  ['Next.js', 'Advanced', 87, C.lavender], ['Three.js / R3F', 'Strong', 80, C.mint], ['Python', 'Proficient', 73, C.green]]))
save('skills-creative.svg', skillCard('creative', 'Design & Creative', C.pink, [
  ['Photoshop', 'Expert', 95, C.pink], ['UI / UX Design', 'Advanced', 88, C.rose], ['Framer Motion', 'Advanced', 85, C.lavender],
  ['Graphic Design', 'Advanced', 85, C.purple], ['AI Tools & Prompting', '3+ yrs', 80, C.cyan], ['Video Editing', 'Strong', 75, C.mint]]))
save('skills-games.svg', skillCard('games', 'Game engines & libraries', C.gold, [
  ['Phaser 3', 'Expert', 92, C.cyan], ['Babylon.js', 'Advanced', 85, C.lavender], ['Matter.js (Physics)', 'Advanced', 83, C.pink],
  ['Three.js / R3F', 'Strong', 80, C.mint], ['Tone.js / Web Audio', 'Strong', 78, C.gold], ['C# / Unity', 'Proficient', 72, C.green]]))
save('skills-learning.svg', learningCard())
save('btn-portfolio.svg', button('bp', 'Visit my portfolio', C.pink, C.lavender))
save('btn-games.svg', button('bg', 'Play my mini games', C.cyan, C.green))
save('btn-music.svg', button('bm', 'Tune in: lofi radio', C.gold, C.pink))
console.log('assets written')
