# skills/theme.md — Colors, typography, brand tweaks

**When to load**: journalist says "change the colors", "make it darker", "different font", "less blue", "I want a red theme", "give it more personality".

**Goal**: customize the brand surface of one app without drifting the FA visual identity into chaos. Keep changes scoped to `src/styles/globals.css`.

---

## The two palettes

| Layer                | What it is                                              |
|----------------------|---------------------------------------------------------|
| **FA brand palette** | The 7 color families from `zephr-components/colors.json`. Pre-wired as Tailwind tokens (`blue-500`, `gray-900`, etc.). Don't change these. |
| **App accents**      | Custom variables the journalist's app uses for its own personality on top of the FA palette. Add these. |

Never overwrite the FA palette values. The same shade of `blue-500` must stay `#0373E3` across every FA app so the header / footer match the page content.

---

## Add a custom accent

Open `src/styles/globals.css`. Inside the existing `@theme { … }` block, add a new variable:

```css
@theme {
  /* …existing FA palette… */

  /* Per-app accent — tweak freely */
  --color-accent-50:  #fff7ed;
  --color-accent-500: #f59e0b;
  --color-accent-700: #b45309;
}
```

You can now use `bg-accent-500`, `text-accent-700`, etc., everywhere in `.astro` and `.tsx` files. Tailwind 4 picks them up automatically — no config restart needed.

Naming guidance:
- `--color-accent-*` for one extra brand colour the app uses heavily.
- `--color-success-*`, `--color-warn-*`, `--color-danger-*` for semantic colors.
- Always provide at least `-50`, `-500`, `-700` so hover / dark / light variants exist.

---

## Pick a color in plain English

The journalist says **"make it more orange"** or **"warmer"** — pick a shade off the FA orange ramp first before inventing one:

```html
<button class="bg-orange-500 hover:bg-orange-600 text-white …">…</button>
```

That's the FA orange `#F77222`. If they want richer / darker, go `bg-orange-600`. If they want softer, `bg-orange-50` as a background with `text-orange-800`.

For "I want something specific" with a hex code from a designer, add it as a custom accent (see above) rather than inlining the hex.

---

## Typography

The base font is Inter Variable (loaded from `@fontsource-variable/inter`). To use a different font on top — only on request:

```css
@theme {
  --font-display: "Playfair Display", Georgia, serif;
}
```

```astro
<h1 class="font-display text-5xl">…</h1>
```

Install the font: `pnpm add @fontsource/playfair-display`, then `@import "@fontsource/playfair-display"` at the top of `globals.css`.

Hard rule: keep `--font-sans = Inter`. Body copy in anything else looks visually disconnected from finansavisen.no.

---

## Dark mode

If the journalist asks for dark mode, propose `class="dark"` toggling on `<html>` and Tailwind's `dark:` variants:

```html
<body class="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-50">
```

A tiny script in `Base.astro` toggles the class based on `localStorage` + `prefers-color-scheme`. Ask first — most short-lived journalist apps don't need it and it doubles the styling work.

---

## Don'ts

- ❌ Don't change the values of existing `--color-blue-*`, `--color-gray-*`, etc. Those are the FA brand.
- ❌ Don't add a CSS file outside `src/styles/`. One source of truth.
- ❌ Don't inline hex colors in components (`bg-[#abcdef]`). Always use a token.
- ❌ Don't pull in another design system (DaisyUI, shadcn, MUI). The FA tokens are the design system.

---

## Verify

```bash
pnpm dev
```

The journalist scrolls the page and confirms it looks how they want. If they say "no, more like _that_" and point at another page, screenshot it, sample the hex, drop it into `@theme` as an accent.
