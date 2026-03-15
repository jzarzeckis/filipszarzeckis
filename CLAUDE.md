# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website for Filip Szarzeckis, hosted on **Vercel** at https://filips.zarzeckis.lv. Built with Bun, React 19, TypeScript, Tailwind CSS v4, and shadcn/ui.

## Hosting & Deployment

This app is deployed on **Vercel** as a static SPA. `Bun.serve()` is used only for local development (HMR, console echoing). In production, Vercel serves the static build output.

- **API routes must use Vercel Serverless Functions** (`api/` directory), not `Bun.serve()` routes. The current `src/index.ts` server is dev-only.
- `vercel.json` configures SPA rewrites (all routes → `index.html`).
- Build output goes to `dist/`.

## Commands

```bash
bun run dev          # Local dev server with HMR (bun --hot src/index.ts)
bun run build        # Production build → dist/ (runs build.ts with Tailwind plugin)
bunx tsc --noEmit    # Type check
bun test             # Run tests (bun:test)
bun test path/to/file.test.ts  # Run a single test file
```

## Runtime: Bun, not Node.js

Default to Bun for everything:
- `bun <file>` not `node`/`ts-node`
- `bun install` not `npm`/`yarn`/`pnpm`
- `bunx` not `npx`
- `bun test` not `jest`/`vitest`
- Bun auto-loads `.env` — don't use dotenv

Prefer Bun built-in APIs:
- `Bun.file` over `node:fs` readFile/writeFile
- `bun:sqlite` over `better-sqlite3`
- `Bun.$\`cmd\`` over `execa`
- `WebSocket` built-in — don't use `ws`

## Architecture

**Frontend (SPA):**
- Entry: `src/index.html` → imports `src/frontend.tsx` (React root)
- Main app component: `src/App.tsx`
- Build: `build.ts` uses Bun's native bundler with `bun-plugin-tailwind`

**Styling:**
- Tailwind CSS v4 with CSS variables for theming
- Global styles in `styles/globals.css`
- Component styles in `src/index.css`

**Path alias:** `@/*` → `./src/*` (configured in tsconfig.json)

## UI Components: shadcn/ui

Uses [shadcn/ui](https://ui.shadcn.com) (new-york style, Radix UI + CVA + tailwind-merge).

- Components live in `src/components/ui/`
- Add new components: `bunx shadcn@latest add <component-name>`
- Config: `components.json`
- Utility: `cn()` from `src/lib/utils.ts` for merging Tailwind classes
- Icons: `lucide-react`
- Full component docs available in `shad_llms.txt`

## D3 in React

D3 is used for data-driven visuals (e.g., `MazeCanvas.tsx`). The project uses `d3` (full package) with custom type declarations in `src/d3.d.ts` — do not install `@types/d3` or any `@types/d3-*` packages, they pull in `@types/node` which conflicts with Bun's TypeScript.

**Pattern for canvas-based D3 visuals:**
- All rendering and D3 logic lives inside a `useEffect` with a `[]` dependency array
- Use `useRef<HTMLCanvasElement>` for canvas access — never touch the DOM outside `useEffect`
- For interactive overlays (e.g., highlighted paths), use **two stacked canvases**: base canvas (drawn once) + overlay canvas (cleared and redrawn on interaction)
- Attach interaction listeners to `window`, not the canvas element — more reliable across browsers and iOS
- Add `touchstart` + `touchmove` with `{ passive: false }` and `e.preventDefault()` to suppress iOS scroll/zoom behavior
- Handle `window.devicePixelRatio` for sharp rendering on retina/HiDPI displays: set `canvas.width = vw * dpr`, `canvas.height = vh * dpr`, `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`
- Return cleanup from `useEffect` removing all `window` listeners

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on PRs:
1. `bun install --frozen-lockfile`
2. `bunx tsc --noEmit`
3. `bun test`
4. `bun build src/index.html --outdir dist`
