// Generates the live GitHub charts in /generated from real profile data (GitHub GraphQL).
// Runs daily in .github/workflows/profile.yml.  `node cards.mjs --mock` draws sample data.
// If the API is unreachable, the existing images are kept (nothing breaks on the profile).
import { writeFileSync, mkdirSync } from 'node:fs'
import { C, BULBS, SERIF, SANS, esc, r1, cardFrame } from './theme.mjs'

const LOGIN = process.env.PROFILE_LOGIN || 'Queen-00'
const OUT = new URL('../../generated/', import.meta.url)
mkdirSync(OUT, { recursive: true })
const save = (name, svg) => writeFileSync(new URL(name, OUT), svg)

// ─── data ─────────────────────────────────────────────────────────────────────
async function gql(query, variables) {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN missing')
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'queen-profile-cards' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data
}

async function fetchData() {
  const d = await gql(`query($login: String!) {
    user(login: $login) {
      createdAt
      followers { totalCount }
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
        totalCount
        nodes { stargazerCount languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } } }
      }
      contributionsCollection {
        totalCommitContributions totalPullRequestContributions totalIssueContributions
        totalPullRequestReviewContributions restrictedContributionsCount
        contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
      }
    }
  }`, { login: LOGIN })
  const u = d.user
  const days = u.contributionsCollection.contributionCalendar.weeks.flatMap((w) => w.contributionDays)
  const langs = new Map()
  for (const repo of u.repositories.nodes) for (const e of repo.languages.edges) {
    const cur = langs.get(e.node.name) ?? { size: 0, color: e.node.color }
    cur.size += e.size; langs.set(e.node.name, cur)
  }
  return {
    year: u.contributionsCollection.contributionCalendar.totalContributions,
    commits: u.contributionsCollection.totalCommitContributions,
    prs: u.contributionsCollection.totalPullRequestContributions,
    issues: u.contributionsCollection.totalIssueContributions,
    reviews: u.contributionsCollection.totalPullRequestReviewContributions,
    privateContribs: u.contributionsCollection.restrictedContributionsCount,
    repos: u.repositories.totalCount,
    stars: u.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0),
    followers: u.followers.totalCount,
    since: new Date(u.createdAt).getFullYear(),
    days,
    langs: [...langs.entries()].map(([name, v]) => ({ name, size: v.size })).sort((a, b) => b.size - a.size),
  }
}

function mockData() {
  const days = []
  const start = new Date(Date.UTC(2025, 9, 5))
  for (let i = 0; i < 364; i++) {
    const d = new Date(start.getTime() + i * 864e5)
    const wave = 0.5 + 0.5 * Math.sin(i / 19) + (i > 300 ? 0.8 : 0)
    days.push({ date: d.toISOString().slice(0, 10), contributionCount: Math.random() < 0.25 ? 0 : Math.round(Math.random() * 7 * wave) })
  }
  return { year: days.reduce((a, d) => a + d.contributionCount, 0), commits: 812, prs: 64, issues: 23, reviews: 18, privateContribs: 340, repos: 14, stars: 41, followers: 27, since: 2024, days,
    langs: [{ name: 'TypeScript', size: 900 }, { name: 'JavaScript', size: 520 }, { name: 'CSS', size: 180 }, { name: 'HTML', size: 120 }, { name: 'Python', size: 70 }, { name: 'Ruby', size: 30 }] }
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function streaks(days) {
  let longest = 0, run = 0
  for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run) }
  // current streak: today may still be empty without breaking it
  let current = 0, i = days.length - 1
  if (i >= 0 && days[i].contributionCount === 0) i--
  for (; i >= 0 && days[i].contributionCount > 0; i--) current++
  return { current, longest }
}
const fmt = (n) => n >= 10000 ? `${r1(n / 1000)}k` : n.toLocaleString('en-US')
const LANG_COLORS = [C.cyan, C.pink, C.lavender, C.gold, C.green, C.rose, C.sky, C.purple]

// ─── cards ────────────────────────────────────────────────────────────────────
function statsCard(d) {
  const items = [
    ['Contributions (1 yr)', fmt(d.year), C.cyan], ['Commits', fmt(d.commits), C.pink],
    ['Pull requests', fmt(d.prs), C.lavender], ['Issues & reviews', fmt(d.issues + d.reviews), C.gold],
    ['Public repos', fmt(d.repos), C.green], ['Stars earned', fmt(d.stars), C.rose],
  ]
  let inner = ''
  items.forEach(([label, val, c], i) => {
    const col = i % 2, row = Math.floor(i / 2), x = 24 + col * 184, y = 62 + row * 84
    inner += `<g opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="${r1(0.1 + i * 0.12)}s" fill="freeze"/>
<rect x="${x}" y="${y}" width="168" height="72" rx="14" fill="${c}" opacity="0.09"/><rect x="${x}" y="${y}" width="168" height="72" rx="14" fill="none" stroke="${c}" stroke-opacity="0.45"/>
<text x="${x + 16}" y="${y + 36}" font-family="${SERIF}" font-size="28" font-weight="700" fill="${c}">${esc(val)}</text>
<text x="${x + 16}" y="${y + 58}" font-family="${SANS}" font-size="12.5" font-weight="700" fill="${C.sky}">${esc(label)}</text></g>`
  })
  return cardFrame(400, 330, 'stats', inner, { title: 'GitHub stats', titleColor: C.cyan })
}

function streakCard(d) {
  const s = streaks(d.days)
  const ring = (cx, val, label, c, delay) => {
    const R = 46, circ = r1(2 * Math.PI * R), frac = Math.min(1, val / Math.max(30, s.longest || 1))
    return `<circle cx="${cx}" cy="160" r="${R}" fill="none" stroke="#fff" stroke-opacity="0.08" stroke-width="9"/>
<circle cx="${cx}" cy="160" r="${R}" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" transform="rotate(-90 ${cx} 160)" stroke-dasharray="${circ}" stroke-dashoffset="${circ}">
<animate attributeName="stroke-dashoffset" from="${circ}" to="${r1(circ * (1 - frac))}" dur="1.6s" begin="${delay}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.8 0.2 1"/></circle>
<text x="${cx}" y="171" text-anchor="middle" font-family="${SERIF}" font-size="32" font-weight="700" fill="${c}">${val}</text>
<text x="${cx}" y="236" text-anchor="middle" font-family="${SANS}" font-size="13" font-weight="700" fill="${C.sky}">${esc(label)}</text>`
  }
  const flame = `<g transform="translate(200 82)"><path d="M0 -26 C 12 -10 16 -2 12 10 C 8 22 -8 22 -12 10 C -15 0 -8 -8 -4 -14 C -4 -6 2 -4 2 -10 C 2 -16 -2 -20 0 -26 Z" fill="${C.gold}"><animateTransform attributeName="transform" type="scale" values="1;1.08;0.96;1" dur="1.4s" repeatCount="indefinite"/></path><path d="M0 -6 C 6 2 6 10 0 14 C -6 10 -6 2 0 -6 Z" fill="${C.pink}"/></g>`
  return cardFrame(400, 330, 'streak', `${flame}${ring(110, s.current, 'Current streak (days)', C.pink, 0.2)}${ring(290, s.longest, 'Longest streak (days)', C.cyan, 0.4)}
<text x="200" y="300" text-anchor="middle" font-family="${SANS}" font-size="13" font-weight="700" fill="${C.lavender}">${fmt(d.year)} contributions in the last year</text>`, { title: 'Streaks', titleColor: C.pink })
}

function languagesCard(d) {
  const total = d.langs.reduce((a, l) => a + l.size, 0) || 1
  const top = d.langs.slice(0, 6)
  const R = 78, cx = 120, cy = 186, circ = 2 * Math.PI * R
  let acc = 0, ring = '', legend = ''
  top.forEach((l, i) => {
    const frac = l.size / total, c = LANG_COLORS[i]
    ring += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${c}" stroke-width="26" transform="rotate(${r1(-90 + acc * 360)} ${cx} ${cy})" stroke-dasharray="0 ${r1(circ)}">
<animate attributeName="stroke-dasharray" from="0 ${r1(circ)}" to="${r1(Math.max(0, frac * circ - 2))} ${r1(circ)}" dur="1.2s" begin="${r1(0.1 + i * 0.12)}s" fill="freeze"/></circle>`
    acc += frac
    const y = 92 + i * 34
    legend += `<circle cx="248" cy="${y - 5}" r="6" fill="${c}"/><text x="262" y="${y}" font-family="${SANS}" font-size="14" font-weight="700" fill="${c}">${esc(l.name)}</text>
<text x="378" y="${y}" text-anchor="end" font-family="${SANS}" font-size="13" font-weight="600" fill="${C.sky}">${r1(frac * 100)}%</text>`
  })
  if (!top.length) legend = `<text x="200" y="180" text-anchor="middle" font-family="${SANS}" font-size="14" fill="${C.sky}">No public code yet</text>`
  return cardFrame(400, 330, 'langs', `${ring}<circle cx="${cx}" cy="${cy}" r="58" fill="${C.night1}"/><text x="${cx}" y="${cy + 6}" text-anchor="middle" font-family="${SERIF}" font-size="18" font-weight="700" fill="${C.ink}">code</text>${legend}`, { title: 'Most used languages', titleColor: C.lavender })
}

function heatmap(d) {
  const W = 840, H = 230, cell = 12, gap = 2.6
  const days = d.days.slice(-53 * 7)
  const max = Math.max(1, ...days.map((x) => x.contributionCount))
  const lv = [C.night2, '#3b2a7a', '#6a46c9', C.lavender, C.pink]
  let cells = ''
  const first = new Date(days[0]?.date ?? Date.now()).getUTCDay()
  days.forEach((day, i) => {
    const k = i + first, col = Math.floor(k / 7), row = k % 7
    const lvl = day.contributionCount === 0 ? 0 : Math.min(4, 1 + Math.floor((day.contributionCount / max) * 3.99))
    const x = r1(36 + col * (cell + gap)), y = r1(64 + row * (cell + gap))
    cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${lv[lvl]}"${lvl ? ` opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="${r1(col * 0.025)}s" fill="freeze"/></rect>` : '/>'}`
    if (lvl === 4) cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${C.gold}" opacity="0"><animate attributeName="opacity" values="0;0.75;0" dur="${r1(2 + (i % 5) * 0.6)}s" begin="${r1(1.5 + (i % 7) * 0.4)}s" repeatCount="indefinite"/></rect>`
  })
  // month labels
  let months = '', last = -1
  days.forEach((day, i) => {
    const m = new Date(day.date).getUTCMonth(), col = Math.floor((i + first) / 7)
    if (m !== last && new Date(day.date).getUTCDate() <= 7) { months += `<text x="${r1(36 + col * (cell + gap))}" y="56" font-family="${SANS}" font-size="11" font-weight="700" fill="${C.dim}">${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m]}</text>`; last = m }
  })
  const legend = lv.map((c, i) => `<rect x="${r1(686 + i * 18)}" y="196" width="13" height="13" rx="3" fill="${c}"/>`).join('')
  return cardFrame(W, H, 'heat', `${months}${cells}<text x="36" y="207" font-family="${SANS}" font-size="12.5" font-weight="700" fill="${C.sky}">${fmt(d.year)} contributions in the last year</text>
<text x="676" y="207" text-anchor="end" font-family="${SANS}" font-size="11" fill="${C.dim}">less</text>${legend}<text x="782" y="207" font-family="${SANS}" font-size="11" fill="${C.dim}">more</text>`, { title: 'Contribution calendar', titleColor: C.green })
}

function activity(d) {
  const W = 840, H = 260, days = d.days.slice(-30)
  const max = Math.max(4, ...days.map((x) => x.contributionCount))
  const x0 = 50, x1 = 810, y0 = 210, y1 = 70
  const px = (i) => r1(x0 + (i / Math.max(1, days.length - 1)) * (x1 - x0))
  const py = (v) => r1(y0 - (v / max) * (y0 - y1))
  // smooth curve through the points
  let line = `M${px(0)} ${py(days[0]?.contributionCount ?? 0)}`
  for (let i = 1; i < days.length; i++) {
    const xm = r1((px(i - 1) + px(i)) / 2)
    line += ` C ${xm} ${py(days[i - 1].contributionCount)} ${xm} ${py(days[i].contributionCount)} ${px(i)} ${py(days[i].contributionCount)}`
  }
  const area = `${line} L ${px(days.length - 1)} ${y0} L ${px(0)} ${y0} Z`
  let grid = ''
  for (let k = 0; k <= 4; k++) { const y = r1(y0 - k * (y0 - y1) / 4); grid += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#fff" stroke-opacity="0.06"/><text x="${x0 - 10}" y="${y + 4}" text-anchor="end" font-family="${SANS}" font-size="11" fill="${C.dim}">${Math.round(k * max / 4)}</text>` }
  let dots = ''
  days.forEach((day, i) => { if (day.contributionCount > 0) dots += `<circle cx="${px(i)}" cy="${py(day.contributionCount)}" r="4" fill="${BULBS[i % BULBS.length]}" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="${r1(0.6 + i * 0.05)}s" fill="freeze"/><animate attributeName="r" values="4;6;4" dur="2.4s" begin="${r1(2 + (i % 6) * 0.4)}s" repeatCount="indefinite"/></circle>` })
  const dl = (s) => { const t = new Date(s); return `${t.getUTCDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][t.getUTCMonth()]}` }
  return cardFrame(W, H, 'act', `<defs><linearGradient id="act-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.pink}" stop-opacity="0.45"/><stop offset="1" stop-color="${C.purple}" stop-opacity="0"/></linearGradient>
<linearGradient id="act-line" x1="0" x2="1"><stop offset="0" stop-color="${C.cyan}"/><stop offset="0.5" stop-color="${C.lavender}"/><stop offset="1" stop-color="${C.pink}"/></linearGradient>
<clipPath id="act-reveal"><rect x="0" y="0" width="0" height="${H}"><animate attributeName="width" from="0" to="${W}" dur="1.8s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.3 0.7 0.3 1"/></rect></clipPath></defs>
${grid}<g clip-path="url(#act-reveal)"><path d="${area}" fill="url(#act-fill)"/><path d="${line}" fill="none" stroke="url(#act-line)" stroke-width="3" stroke-linecap="round"/></g>${dots}
<text x="${x0}" y="236" font-family="${SANS}" font-size="11.5" font-weight="700" fill="${C.dim}">${esc(dl(days[0]?.date ?? Date.now()))}</text>
<text x="${x1}" y="236" text-anchor="end" font-family="${SANS}" font-size="11.5" font-weight="700" fill="${C.dim}">${esc(dl(days[days.length - 1]?.date ?? Date.now()))}</text>`, { title: 'Activity — last 30 days', titleColor: C.cyan })
}

// ─── run ──────────────────────────────────────────────────────────────────────
const mock = process.argv.includes('--mock')
try {
  const d = mock ? mockData() : await fetchData()
  save('stats.svg', statsCard(d))
  save('streak.svg', streakCard(d))
  save('languages.svg', languagesCard(d))
  save('calendar.svg', heatmap(d))
  save('activity.svg', activity(d))
  console.log(`cards written for ${LOGIN}${mock ? ' (mock data)' : ''}: ${d.year} contributions, ${d.langs.length} languages`)
} catch (e) {
  console.warn('Could not refresh cards, keeping the previous ones:', e.message)
}
