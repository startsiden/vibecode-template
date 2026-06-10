# skills/add-react.md — Make a page interactive with React

**When to load**: journalist says "I want a dashboard", "it should update live", "make this filterable", "an interactive chart", "the page should react to clicks", "react-ish", "an app, not a page".

**Goal**: drop a React island into an Astro page without breaking the Zephr header / footer.

---

## Install React support

One-time install for the project:

```bash
pnpm astro add react
```

Confirm `y` to all prompts. This:
- Adds `@astrojs/react`, `react`, `react-dom` to `package.json`
- Updates `astro.config.mjs` to include the React integration
- Updates `tsconfig.json` for `.tsx` files

Don't hand-edit any of this — let `astro add` own it.

---

## Two patterns — pick by need

### Pattern A — small island on a static page

The page is mostly content; one widget is interactive (a filter, a counter, an embed).

```astro
---
// src/pages/index.astro
import Base from '../layouts/Base.astro';
import StockTicker from '../components/StockTicker.tsx';
---
<Base title="Home" showFaChrome={true}>
  <section class="mx-auto max-w-2xl px-6 py-16">
    <h1>Market today</h1>
    <p>Static text the CDN can transform freely.</p>

    <!-- Interactive bit, hydrated when scrolled into view -->
    <StockTicker client:visible symbol="EQNR" />
  </section>
</Base>
```

```tsx
// src/components/StockTicker.tsx
import { useEffect, useState } from 'react';

export default function StockTicker({ symbol }: { symbol: string }) {
  const [price, setPrice] = useState<number | null>(null);
  useEffect(() => {
    // fetch the price …
  }, [symbol]);
  return (
    <div class="rounded-lg bg-blue-50 px-4 py-2 text-blue-900">
      {symbol}: {price ?? '—'}
    </div>
  );
}
```

### Pattern B — fully Reactful page (dashboard, app-like UX)

The whole page is a React app. Wrap it in one `client:only="react"` island. The Astro page is just a shell; the FA header stays in the layout outside the React tree.

```astro
---
// src/pages/dashboard.astro
import Base from '../layouts/Base.astro';
import Dashboard from '../components/Dashboard.tsx';
---
<Base title="Dashboard" showFaChrome={true}>
  <Dashboard client:only="react">
    <div slot="fallback" class="mx-auto max-w-4xl px-6 py-16 text-gray-500">
      Loading dashboard…
    </div>
  </Dashboard>
</Base>
```

`client:only="react"` skips SSR entirely — the dashboard renders in the browser only. This is the right pick when the dashboard depends on `window`, `localStorage`, `IntersectionObserver`, or wants to manage its own routing inside.

---

## Hydration directives — when to use which

| Directive            | When to use                                       |
|----------------------|---------------------------------------------------|
| `client:visible`     | Default for islands lower on the page             |
| `client:idle`        | Nice-to-have widgets that can wait                |
| `client:load`        | Above-the-fold interactivity, user clicks within 1s |
| `client:only="react"`| Browser-only components, full-page React apps    |
| `client:media="(min-width: 1024px)"` | Desktop-only widgets             |

---

## The Zephr boundary

⚠️ **Never put `<FinansavisenHeader />`, `<FinansavisenFooter />`, or any `<ZephrFeature />` inside a React component.** The Zephr CDN must own that HTML; a hydrating React island would overwrite the CDN-injected content.

Correct:
```astro
<Base showFaChrome={true}>
  <!-- FA header rendered here, by Astro -->
  <ReactApp client:only="react" />
  <!-- FA footer rendered here, by Astro -->
</Base>
```

Wrong:
```tsx
function ReactApp() {
  return (
    <>
      <FinansavisenHeader />  {/* ← React would clobber this on hydration */}
      <Dashboard />
    </>
  );
}
```

---

## Sharing state between islands

If two islands need to talk to each other, two options:

1. **Nano Stores** (`@nanostores/react`) — tiny, framework-agnostic. Recommended.
2. **DOM CustomEvents** — same pattern zephr-components uses. No deps. Works when the journalist explicitly says "I want this to be light".

Don't reach for Redux, Zustand, Jotai, or Recoil. The journalist's app doesn't need them.

---

## Styling React components

Same Tailwind utilities as Astro:

```tsx
<button class="rounded-full bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
  Buy
</button>
```

The FA palette is available identically. No styled-components, no Emotion.

---

## Verify

```bash
pnpm dev
```

- Open the page, interact with the island, confirm it responds.
- View page source → confirm the static parts of the page (and Zephr markers) are intact.
- `pnpm exec astro check` should still pass.
- `pnpm build` should still succeed.
