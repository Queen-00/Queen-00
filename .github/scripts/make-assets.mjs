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

// ─── Fairy-light divider ──────────────────────────────────────────────────────
const divider = (seed) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="74" viewBox="0 0 1200 74" role="img" aria-label="fairy lights">
${lights(1200, 8, 30, 28, seed, 3)}
</svg>
`

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
save('divider-2.svg', divider(37))
save('divider-3.svg', divider(53))
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
