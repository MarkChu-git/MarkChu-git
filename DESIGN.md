# Design System — Mark Chu Profile

This README **is** the showcase. There is no separate portfolio site — the standalone github.io build was retired, and this repo replaces it. One screen, one strong idea: a developer's terminal, lit by electric chroma.

**Dials** — VARIANCE 7 · MOTION 3 · DENSITY 3. One bold hero, calm supporting rows, motion only in the typed tagline.

## 1. Atmosphere
Electric, nocturnal, precise. A dark terminal window floats on an iridescent blue-violet light-streak field — the look of long-exposure light through prism glass, heavy with film grain. The terminal is the calm, legible center; the chroma is the energy around it. Think "oil-slick on black," not "neon arcade." The feeling: a focused engineer at 2am, screen glowing.

## 2. Color Palette
| Token | Hex | Role |
|---|---|---|
| Void | `#08080D` | Deepest background (never pure black) |
| Terminal Core | `#0C0C13` → `#08080D` | Card fill, vertical gradient |
| Electric Blue | `#3A52FF` | THE primary accent — view counter, mid-streaks |
| Sky Blue | `#5B8CFF` | Principle words, LinkedIn mark |
| Cyan | `#56C7FF` / `#7FD8FF` | Prompt `$`, string values, streak cores, typed tagline |
| Violet | `#7C3AED` / `#9D8CFF` | JSON keys, `$PHILOSOPHY`, graph title, deep streak shadows |
| Off-White | `#E9E9F2` | Commands, primary text |
| Bright White | `#FFFFFF` | The name `Mark Chu` only |
| Muted Slate | `#565C70` / `#9098AC` | JSON punctuation, comments, captions |
| Live Green | `#27C93F` | Terminal "go" dot only |
| Hairline | `rgba(255,255,255,0.06–0.13)` | Card border, dividers, top highlight |

Iridescence is the brand: blue ↔ violet ↔ cyan, never a single flat accent. Each badge logo picks a different note of that spectrum (cyan / white / sky / violet) — a controlled rainbow, not sticker soup.

## 3. Typography
- **Everything is JetBrains Mono** — the portfolio's exact font, baked into the hero PNG/JPEG across its full weight range (Regular → Medium → ExtraBold). A monospace-only system reads as "engineer," and the column alignment in the `profile.json` block depends on it.
- The name `Mark Chu` is JetBrains Mono **ExtraBold 46px** — the one moment of scale. Hierarchy comes from weight + color, not many sizes.
- No serif. No emoji. No second font family.

## 4. The Hero is a rasterized JPEG (hard rule)
GitHub's markdown sanitizer **strips `<style>`/`@keyframes` from committed SVGs**, so an animated SVG banner renders broken. The hero is therefore baked to a raster:
- **Chroma**: ImageMagick random noise → 27° motion-blur → iridescent CLUT (navy→violet→blue→cyan) → spatial violet bias → coarse film grain → vignette.
- **Terminal card**: SVG (JetBrains Mono, syntax-colored CLI session) rendered at 2× via `rsvg-convert`, downscaled for crisp text, composited with a soft drop shadow.
- **Format**: JPEG q88 4:2:0 (~282 KB). Grain is incompressible, so PNG bloats to ~1.7 MB; JPEG at this quality keeps text crisp with no visible fringing. A raster never depends on a third-party service being up.

## 5. Reliability Rule (every embed is curl-verified 200)
Earlier versions broke because `github-readme-stats` returns **503** and custom animated SVGs get stripped. Rule: **no asset ships unless `curl` confirms HTTP 200.** Verified-good services only:
- `readme-typing-svg.demolab.com` — animated tagline (cyan)
- `skillicons.dev` — stack icons (dark theme)
- `img.shields.io` — link badges (CDN-backed)
- `komarev.com/ghpvc` — view counter

Banned (verified failing): `github-readme-stats` (503), `streak-stats` (timeout), `github-profile-trophy` (402), `github-readme-activity-graph` (plots only the trailing **31 days** — any quiet month renders as a dead flat zero-line; replaced by the first-party graph below).

## 5b. Contribution Graph is First-Party (no service to break)
The graph is rendered by us, from the source of truth:
- `scripts/contribution-graph.mjs` (zero-dependency Node) pulls the trailing-12-month calendar from the **GitHub GraphQL API** and renders a weekly-total "electric signal" waveform — cyan line, indigo glow, blue→violet area fade — plus real stats (total / active days / best day / longest streak) and a `SYNCED <date>` stamp.
- **Static SVG, presentation attributes only** — no `<style>`, so GitHub's SVG sanitizer has nothing to strip (§4). Dark + light variants ship separately; the README picks via `<picture prefers-color-scheme>`.
- `.github/workflows/contribution-graph.yml` re-renders **daily at 02:23 UTC** (plus on script changes) and single-commit force-pushes to the `output` branch — main history stays clean, and the daily push keeps GitHub from auto-disabling the schedule.
- README embeds `raw.githubusercontent.com/MarkChu-git/MarkChu-git/output/contribution-graph-{dark,light}.svg` — still curl-verified 200 like every other embed.

## 6. Motion
One animated element: the typed tagline cycling real project names. Everything else is static and calm. Motion names what he's building — it is not decoration.

## 7. Anti-Patterns (banned)
No pure black. No generic AI-purple gradient slop — the violet here is half of a deliberate blue↔cyan iridescence, executed with intent. No emoji. No committed animated SVG. No PNG hero (grain bloats it). No unverified image services. No "Hi 👋 I'm X" header. No trophy/stat wall. No fake-precise stats. No link to the dead portfolio site. The terminal carries the page; everything else stays quiet.
