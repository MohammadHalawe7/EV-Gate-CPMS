# EV Gate — Brand

**`EV-Gate-Brand-Guidelines.pdf` in this folder is the official brand source of truth.**
It travels with the repository so that every product copied from this foundation carries the
brand with it. Do not delete it, and do not replace it with a redrawn or re-exported version.

The **Design System** (`/design-system`, `DESIGN_SYSTEM.md`) remains the mandatory **UI** source of
truth. Where a screen and the guidelines appear to disagree, keep the Design System's structure,
spacing and component behaviour, and satisfy the brand through the tokens below — which already
encode the guideline values.

---

## 1. Logo

The primary lockup is the only lockup. There are no secondary constructions.

| Asset | Where | Use |
|---|---|---|
| `src/assets/brand/evgate-logo.svg` | full lockup, single-path | The mask the app renders through `EvGateLogo` — inherits `currentColor` |
| `src/assets/brand/evgate-mark.svg` | mark only | Collapsed sidebar, favicons, avatars |
| `src/assets/brand/evgate-logo-purple.png` | `#2A0944` | Raster export for documents and email |
| `src/assets/brand/evgate-logo-saffron.png` | `#F9BF58` | Raster export for dark backgrounds |
| `src/assets/brand/evgate-logo-white.png` | `#FFFFFF` | Raster export for photography and dark neutrals |
| `src/assets/brand/evgate-favicon.svg` | — | Browser tab |

In the application, **always render the logo through `EvGateLogo` / `BrandLockup`**
(`src/components/layout/Brand.tsx`). It applies the SVG as a CSS mask, so the mark takes
`currentColor` and can never drift from an approved colour. Do not `<img>` the PNGs into a screen.

### Approved logo colours

Purple `#2A0944` · Saffron `#F9BF58` · White `#FFFFFF` · Plum `#A32469` · Brand purple light
`#3B185F` · Near-black `#1D1D1B`. In this product that means `text-brand-900`, `text-accent-400`,
`text-white` and — rarely — `text-plum-700`.

### Never

Recolour outside the approved list · stretch, skew, rotate or add perspective · add a shadow,
outline or gradient · rearrange or re-letter the elements · place on a busy pattern or a
low-contrast field · redraw the mark.

---

## 2. Colour

The guideline palette is already the Design System's `@theme`. Use the token, not the hex.

| Brand value | Guideline hex | Token |
|---|---|---|
| Dark Purple (primary) | `#2A0944` | `brand-900` |
| Saffron Mango (primary) | `#F9BF58` | `accent-400` |
| Purple (secondary) | `#3B185F` | `brand-800` |
| Plum (secondary) | `#A32469` | `plum-700` |
| Near-black (secondary) | `#1D1D1B` | — use `ink-900` in UI |
| White | `#FFFFFF` | `white` |

**Saffron is a highlight, not a surface.** The guidelines show large saffron and purple fields for
print and social; the product does not. In the interface, purple carries identity and primary
actions, saffron carries a small number of accents, and the interface itself is white on `ink-50`.

Brand **gradients and patterns** from the guidelines belong to marketing surfaces. They are not
used inside the CPMS, which is a light, dense operations product.

---

## 3. Typography

| | Guideline | Token |
|---|---|---|
| English | Avenir LT Std | `--font-sans` (Avenir LT Std → Avenir Next → Nunito Sans → system) |
| Arabic | HONOR Sans Arabic | `--font-arabic` (HONOR Sans Arabic → IBM Plex Sans Arabic → Noto Sans Arabic) |

Both are declared in `src/index.css`. `html[dir='rtl'] body` switches to the Arabic stack, so
Arabic is a first-class direction rather than a translation layer. Weights in use: Light, Roman
(regular), Bold.

---

## 4. Photography

Three official frames live in `src/assets/brand/imagery/`, with their own
README covering crops, scrims and where each is used.

The guidelines show large saffron and purple fields; the product does not use
them as interface surfaces. **Photography is the one licensed exception** — a
picture under a `brand-950` scrim carries the brand on the public sign-in,
demo and confirmation screens. Inside the authenticated CPMS the interface
stays white on `ink-50`, exactly as `DESIGN_SYSTEM.md` requires.

---

## 5. Where the brand lives in the code

```
src/assets/brand/    logo assets — copied with the repository
src/assets/brand/imagery/   official photography (see its own README)
docs/brand/          this file + the official guidelines PDF
src/index.css        @theme — the brand colours and type stacks as tokens
src/design-system/tokens.ts   typed mirror of the above
design-tokens.json   generated export (npm run tokens:export)
src/components/layout/Brand.tsx   the only approved way to render the logo
```
