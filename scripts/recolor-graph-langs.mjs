// Remap the 3D contribution graph's language-pie colors onto the brand palette.
// github-profile-3d-contrib hardcodes GitHub's official language colors (HTML
// orange, JavaScript yellow, ...) with no setting to override them — the one
// warm clash left on an otherwise electric-blue card. Empirically (v0.9.3) the
// pie slices + legend are the ONLY inline fills in the SVG (towers/radar/text
// are class-styled from SETTING_JSON), so recoloring every inline fill hex, in
// first-appearance order, touches exactly the pie.
//
// Usage: node scripts/recolor-graph-langs.mjs <file.svg>

import { readFileSync, writeFileSync } from "node:fs";

// DESIGN.md iridescence, largest slice first; slate last suits the "other" slice.
const RAMP = ["#3A52FF", "#56C7FF", "#7C3AED", "#5B8CFF", "#9D8CFF", "#565C70", "#2B3B9E", "#7FD8FF"];

// Theme colors from conf/github-profile-3d-contrib.json — never rewrite these,
// which also makes a re-run a no-op.
const KEEP = new Set(
  ["#08080D", "#E9E9F2", "#56C7FF", "#8B93A8", "#9D8CFF", "#171C33", "#2B3B9E", "#3A52FF", "#5B8CFF", "#7FD8FF"].map(
    (c) => c.toLowerCase()
  )
);

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/recolor-graph-langs.mjs <file.svg>");
  process.exit(1);
}

let svg = readFileSync(file, "utf8");

const seen = [];
for (const m of svg.matchAll(/(?:fill="|style="fill: )(#[0-9a-fA-F]{6})/g)) {
  const c = m[1];
  if (!KEEP.has(c.toLowerCase()) && !seen.includes(c)) seen.push(c);
}

seen.forEach((color, i) => {
  svg = svg.replaceAll(color, RAMP[i % RAMP.length]);
});

writeFileSync(file, svg);
console.log(`recolored ${seen.length} language color(s): ${seen.join(", ") || "(none)"}`);
