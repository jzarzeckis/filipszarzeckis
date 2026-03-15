# filips.zarzeckis.lv

Personal website for experimenting with data visualizations. Built with Bun, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, and D3.

Live at **https://filips.zarzeckis.lv** · Deployed on Vercel.

## Dev

```bash
bun install
bun run dev      # http://localhost:3000
```

## Build & type check

```bash
bun run build    # → dist/
bunx tsc --noEmit
bun test
```

## Stack

- **Runtime/bundler** — Bun
- **UI** — React 19 + TypeScript
- **Styling** — Tailwind CSS v4 + shadcn/ui (new-york)
- **Visualizations** — D3
- **Deployment** — Vercel (static SPA)
