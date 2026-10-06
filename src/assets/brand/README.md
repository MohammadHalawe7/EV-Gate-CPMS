# EV Gate brand assets

Official assets. Copied with the repository so every EV Gate product starts with them.

- `evgate-logo.svg` — full lockup, single path, rendered as a CSS mask by `EvGateLogo`
- `evgate-mark.svg` — mark only
- `evgate-favicon.svg` — browser tab
- `evgate-logo-purple.png` — `#2A0944`
- `evgate-logo-saffron.png` — `#F9BF58`
- `evgate-logo-white.png` — `#FFFFFF`
- `imagery/` — official photography for the public screens (see `imagery/README.md`)

**In the application, render the logo through `EvGateLogo` / `BrandLockup`
(`src/components/layout/Brand.tsx`) — never as a raw `<img>`.** The PNGs are for documents,
email and anything outside React.

Rules, approved colours and misuse: `docs/brand/README.md` and
`docs/brand/EV-Gate-Brand-Guidelines.pdf`.
