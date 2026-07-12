// Contribution graph renderer — first-party replacement for third-party stat services.
// Fetches the trailing-12-month contribution calendar from the GitHub GraphQL API and
// renders static SVGs (presentation attributes only — GitHub strips <style> from
// committed SVGs, see DESIGN.md §4). A daily Action pushes the output to the
// `output` branch; the README embeds the raw URLs via <picture>.
//
// Usage: GITHUB_TOKEN=<token> node scripts/contribution-graph.mjs
// Env:   GH_LOGIN (default: repo owner or MarkChu-git), OUT_DIR (default: out)

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const LOGIN = process.env.GH_LOGIN || process.env.GITHUB_REPOSITORY_OWNER || "MarkChu-git";
const OUT_DIR = process.env.OUT_DIR || "out";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!TOKEN) {
  console.error("error: GITHUB_TOKEN (or GH_TOKEN) is required");
  process.exit(1);
}

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

async function fetchCalendar() {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "contribution-graph-renderer",
    },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  const cal = json.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal || !Array.isArray(cal.weeks) || cal.weeks.length === 0) {
    throw new Error("empty contribution calendar — refusing to render");
  }
  return cal;
}

// ---------- data ----------

function computeStats(cal) {
  const days = cal.weeks.flatMap((w) => w.contributionDays);
  const weekly = cal.weeks.map((w) =>
    w.contributionDays.reduce((s, d) => s + d.contributionCount, 0)
  );
  let longest = 0, run = 0, bestDay = 0, activeDays = 0;
  for (const d of days) {
    if (d.contributionCount > 0) {
      run += 1;
      longest = Math.max(longest, run);
      activeDays += 1;
      bestDay = Math.max(bestDay, d.contributionCount);
    } else {
      run = 0;
    }
  }
  return {
    total: cal.totalContributions,
    weekly,
    weeks: cal.weeks,
    activeDays,
    bestDay,
    longestStreak: longest,
    lastDate: days[days.length - 1].date,
  };
}

// ---------- geometry ----------

const fmt = (n) => {
  const s = n.toFixed(2);
  return s.replace(/\.?0+$/, "");
};

// Monotone cubic interpolation (Fritsch–Carlson): smooth but never overshoots,
// so zero-weeks stay pinned to the baseline instead of dipping below it.
function monotonePath(pts) {
  const n = pts.length;
  if (n < 3) return "M" + pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join(" L");
  const dx = [], m = [], t = new Array(n);
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push((pts[i + 1][1] - pts[i][1]) / dx[i]);
  }
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${fmt(pts[i][0] + h)} ${fmt(pts[i][1] + h * t[i])} ${fmt(pts[i + 1][0] - h)} ${fmt(pts[i + 1][1] - h * t[i + 1])} ${fmt(pts[i + 1][0])} ${fmt(pts[i + 1][1])}`;
  }
  return d;
}

// ---------- render ----------

const W = 760, H = 168;
const PAD_L = 8, PAD_R = 8;
const PLOT_TOP = 72, BASE = 140;
const MONO = "JetBrains Mono, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace";
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const THEMES = {
  dark: {
    heroVal: "#56C7FF", val: "#E9E9F2", label: "#8B93A8", dim: "#565C70",
    line: "#56C7FF", glow: "#3A52FF", glowOp: 0.55,
    areaTop: "#3A52FF", areaTopOp: 0.50, areaMid: "#7C3AED", areaMidOp: 0.18,
    baseline: "#FFFFFF", baselineOp: 0.10,
    peak: "#7FD8FF", dot: "#7FD8FF", halo: "#56C7FF",
  },
  light: {
    heroVal: "#3A52FF", val: "#14151C", label: "#6E7787", dim: "#9098AC",
    line: "#3A52FF", glow: "#5B8CFF", glowOp: 0.30,
    areaTop: "#3A52FF", areaTopOp: 0.34, areaMid: "#7C3AED", areaMidOp: 0.10,
    baseline: "#0A0A0F", baselineOp: 0.14,
    peak: "#7C3AED", dot: "#3A52FF", halo: "#5B8CFF",
  },
};

function render(stats, theme) {
  const t = THEMES[theme];
  const { weekly, weeks } = stats;
  const n = weekly.length;
  const peak = Math.max(...weekly, 0);
  const span = W - PAD_L - PAD_R;
  const x = (i) => PAD_L + (n === 1 ? span / 2 : (i * span) / (n - 1));
  const y = (v) => BASE - (peak > 0 ? (v / peak) * (BASE - PLOT_TOP) : 0);
  const pts = weekly.map((v, i) => [x(i), y(v)]);

  const linePath = monotonePath(pts);
  const areaPath = `${linePath} L${fmt(x(n - 1))} ${BASE} L${fmt(x(0))} ${BASE} Z`;

  // month boundaries: label the week whose first day starts a new month
  let monthTicks = "";
  let prevMonth = new Date(weeks[0].contributionDays[0].date + "T00:00:00Z").getUTCMonth();
  let lastLabelX = -Infinity;
  for (let i = 1; i < n; i++) {
    const mo = new Date(weeks[i].contributionDays[0].date + "T00:00:00Z").getUTCMonth();
    if (mo !== prevMonth) {
      const tx = x(i);
      if (tx - lastLabelX >= 34 && tx < W - 26) {
        monthTicks += `<line x1="${fmt(tx)}" y1="${BASE}" x2="${fmt(tx)}" y2="${BASE + 4}" stroke="${t.dim}" stroke-opacity="0.7" stroke-width="1"/>`;
        monthTicks += `<text x="${fmt(tx)}" y="${BASE + 17}" font-family="${MONO}" font-size="9" letter-spacing="1" fill="${t.dim}" text-anchor="middle">${MONTHS[mo]}</text>`;
        lastLabelX = tx;
      }
      prevMonth = mo;
    }
  }

  // peak marker: dotted guide + dot + value. The guide always sits at PLOT_TOP
  // (peak maps to the top), so the label goes below the line — and flips to the
  // left end when the peak week itself is near the right edge.
  let peakMark = "";
  if (peak > 0) {
    const pi = weekly.indexOf(peak);
    const px = x(pi), py = y(peak);
    const labelRight = px < W - 150;
    const lx = labelRight ? W - PAD_R : PAD_L;
    const anchor = labelRight ? "end" : "start";
    peakMark = `
  <line x1="${PAD_L}" y1="${fmt(py)}" x2="${W - PAD_R}" y2="${fmt(py)}" stroke="${t.label}" stroke-opacity="0.30" stroke-width="1" stroke-dasharray="1 4"/>
  <text x="${lx}" y="${fmt(py + 13)}" font-family="${MONO}" font-size="9" letter-spacing="1" fill="${t.peak}" text-anchor="${anchor}">PEAK ${peak}/WK</text>
  <circle cx="${fmt(px)}" cy="${fmt(py)}" r="7" fill="${t.halo}" fill-opacity="0.16"/>
  <circle cx="${fmt(px)}" cy="${fmt(py)}" r="2.6" fill="${t.dot}"/>`;
  }

  const total = stats.total.toLocaleString("en-US");
  const statsStrip =
    `<tspan fill="${t.val}" font-weight="700">${stats.activeDays}</tspan><tspan fill="${t.label}"> ACTIVE DAYS</tspan>` +
    `<tspan fill="${t.dim}">  ·  </tspan>` +
    `<tspan fill="${t.val}" font-weight="700">${stats.bestDay}</tspan><tspan fill="${t.label}"> BEST DAY</tspan>` +
    `<tspan fill="${t.dim}">  ·  </tspan>` +
    `<tspan fill="${t.val}" font-weight="700">${stats.longestStreak}</tspan><tspan fill="${t.label}"> DAY STREAK</tspan>`;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${total} contributions in the last 12 months">
  <defs>
    <linearGradient id="area" x1="0" y1="${PLOT_TOP}" x2="0" y2="${BASE}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${t.areaTop}" stop-opacity="${t.areaTopOp}"/>
      <stop offset="0.55" stop-color="${t.areaMid}" stop-opacity="${t.areaMidOp}"/>
      <stop offset="1" stop-color="${t.areaMid}" stop-opacity="0"/>
    </linearGradient>
    <filter id="blur" x="-10%" y="-60%" width="120%" height="220%">
      <feGaussianBlur stdDeviation="2.4"/>
    </filter>
  </defs>

  <text x="${PAD_L}" y="34" font-family="${MONO}" font-size="27" font-weight="800" fill="${t.heroVal}">${total}</text>
  <text x="${PAD_L}" y="52" font-family="${MONO}" font-size="9" letter-spacing="2" fill="${t.label}">CONTRIBUTIONS · TRAILING 12 MONTHS</text>

  <text x="${W - PAD_R}" y="34" font-family="${MONO}" font-size="11" text-anchor="end">${statsStrip}</text>
  <text x="${W - PAD_R}" y="52" font-family="${MONO}" font-size="9" letter-spacing="1.5" fill="${t.dim}" text-anchor="end">SYNCED ${stats.lastDate} · REFRESHED DAILY</text>

  <path d="${linePath}" stroke="${t.glow}" stroke-opacity="${t.glowOp}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" filter="url(#blur)"/>
  <path d="${areaPath}" fill="url(#area)"/>
  <path d="${linePath}" stroke="${t.line}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="${PAD_L}" y1="${BASE}" x2="${W - PAD_R}" y2="${BASE}" stroke="${t.baseline}" stroke-opacity="${t.baselineOp}" stroke-width="1"/>
${peakMark}
  ${monthTicks}
</svg>
`;
}

const cal = await fetchCalendar();
const stats = computeStats(cal);
console.log(
  `${LOGIN}: ${stats.total} contributions · ${stats.activeDays} active days · best ${stats.bestDay}/day · streak ${stats.longestStreak}d · through ${stats.lastDate}`
);

await mkdir(OUT_DIR, { recursive: true });
for (const theme of ["dark", "light"]) {
  const svg = render(stats, theme);
  const file = join(OUT_DIR, `contribution-graph-${theme}.svg`);
  await writeFile(file, svg);
  console.log(`wrote ${file} (${svg.length} bytes)`);
}
