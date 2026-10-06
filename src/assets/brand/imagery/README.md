# EV Gate brand imagery

Official photography, optimised for the web. Source PNGs were 1122 × 1402;
these are WebP at quality 82 — **312 KB for all three**, against 5.7 MB for the
originals.

| File | Subject | Used by |
|---|---|---|
| `evgate-charging-sunset.webp` | Charger and vehicle at sunset, wind and solar behind | Auth carousel slide 1 · mobile brand band |
| `evgate-network-map.webp` | Illuminated network map with charging pedestals | Auth carousel slide 2 · submitted screen |
| `evgate-flagship-station.webp` | Flagship canopy station at dusk | Auth carousel slide 3 · demo-request aside |

## Rules

- **Always under a scrim.** Photography carries the brand purple on public
  screens, but the caption on top must stay legible — every use here sits under
  a `brand-950` gradient weighted to the lower third.
- **Never inside the authenticated product.** The operations UI is light,
  dense and white; imagery belongs to the public marketing-facing screens only.
- **`alt=""` and `aria-hidden`.** These frames are decorative — the meaning is
  in the caption beside them, never in the picture.
- **Set an `objectPosition`.** Each frame has a focal point (the charger, the
  station) that must survive the crop at any panel width.
- **Do not place the logo over a busy area of the frame.** The brand guidelines
  forbid it; the showcase panel keeps the lockup in the quiet upper corner with
  a soft shadow.

Re-exporting: keep the portrait aspect (the panel is tall), stay at or under
~1200 px on the long edge, and use WebP. Do not upscale the sources.
