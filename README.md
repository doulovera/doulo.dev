# doulo.dev

The source for [doulo.dev](https://doulo.dev), Douglas Lovera's minimalist portfolio and link shortener on Cloudflare Workers.

## Overview

- Minimalist dark landing page centered on Douglas Lovera — **Software Developer & Engineering**
- Dynamic macOS-style frosted glass dock populated directly from the Cloudflare KV `LINKS` namespace
- Smooth pointer-driven dock magnification physics, floating tooltips, keyboard navigation, and reduced-motion support
- Short-link redirects at `/<slug>` resolved via Cloudflare KV

## Project structure

```text
src/
├── index.ts      # Cloudflare Worker router (/, /<slug>, 404)
├── links.ts      # KV namespace reader, redirect lookup, and icon presets
└── page.ts       # Server-rendered HTML templates
public/
├── favicon.svg
└── assets/
    ├── main.css  # Dark Apple-inspired styling and dock surfaces
    └── dock.js   # macOS dock magnification physics
wrangler.jsonc    # Cloudflare Workers & KV configuration
```

## Run locally

Requires Node.js and pnpm.

```bash
pnpm install
pnpm dev
```

## Deploy

```bash
pnpm deploy
```
