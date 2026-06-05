# Design System — Mark Chu Profile

The README is a direct extension of the portfolio at **markchu-git.github.io**. Same language, same restraint. Editorial dark-tech, not a sticker wall.

**Dials** — VARIANCE 7 · MOTION 4 · DENSITY 2. Airy, confident, one strong idea (the rasterized editorial nameplate), motion only where it earns attention.

## 1. Atmosphere
A warm-charcoal editorial surface. The hero is a machined nameplate — massive grotesk name, a quiet principles column, a single live indicator. Everything else breathes underneath it. The feeling is a well-lit studio at night, not a neon arcade.

## 2. Color Palette
| Token | Hex | Role |
|---|---|---|
| Warm Charcoal | `#0A0908` | Primary background (never pure black) |
| Surface | `#1A1814` | Elevated tint, ambient orb core |
| Warm Off-White | `#EEEBE3` | Display type, primary text |
| Muted Stone | `#6B6760` | Secondary text, captions |
| Deep Stone | `#34322E` / `#5A564E` | Eyebrows, faint labels |
| **Amber** | `#D4A843` | THE accent — numbers, links, logos, live url |
| Live Green | `#00DC82` | Status dot ONLY (matches favicon) |
| Hairline | `rgba(255,255,255,0.06)` | Dividers, frame lines |

One accent (amber), locked across every element. Green is reserved exclusively for the live dot.

## 3. Typography
- **Display:** Arial Black (rasterized) — heaviest available grotesk, stands in for the portfolio's `font-weight: 900`. Letter-spacing `-5` at display size.
- **Mono / labels / body:** JetBrains Mono — the exact portfolio font, installed locally and baked into the PNG.
- No serif. No emoji in headings. Hierarchy comes from weight + color, not raw scale.

## 4. The Hero is a PNG (hard rule)
GitHub's markdown sanitizer **strips `<style>` and `@keyframes` from committed SVGs**, so an animated SVG banner renders broken. The hero is therefore rasterized to PNG via `rsvg-convert` + ImageMagick (Arial Black + JetBrains Mono baked in, subtle soft-light film grain, quantized to ~240KB at 1600px). Bulletproof: a raster image never depends on a third-party service being up.

## 5. Reliability Rule (every embed is curl-verified 200)
The previous version broke because `github-readme-stats` returns **503** and a custom animated SVG was stripped. Rule going forward: **no asset ships unless `curl` confirms HTTP 200.** Verified-good services only:
- `readme-typing-svg.demolab.com` — animated tagline
- `skillicons.dev` — stack icons
- `github-readme-activity-graph.vercel.app` — contribution graph (amber-themed)
- `img.shields.io` — link badges (CDN-backed, always up)
- `komarev.com/ghpvc` — view counter

Banned (verified failing): `github-readme-stats` (503), `streak-stats` (timeout), `github-profile-trophy` (402).

## 6. Motion
One animated element only: the typing tagline, cycling real project names. Everything else is static and calm. Motion must be motivated — it names what he's currently building, it isn't decoration.

## 7. Anti-Patterns (banned)
No pure black. No AI-purple. No emoji soup. No committed animated SVG. No unverified image services. No generic "Hi 👋 I'm X" header. No three-column trophy/stat wall. No fake-precise stats. The nameplate carries the page; supporting elements stay quiet.
