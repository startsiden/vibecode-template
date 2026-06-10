# skills/add-zephr-header.md — Finansavisen header + footer

**When to load**: journalist says "add the FA header", "show the Finansavisen logo", "make it look like finansavisen.no", "add the login button".

**Goal**: turn on the real Finansavisen header + footer (served at the edge by Zephr in production) and make them visible locally via the simulation.

---

## What's actually happening

The FA header is a separately-deployed React component at `prod-zephr-components.finansavisen.no`. The Zephr CDN injects it into every page on `finansavisen.no` whenever it sees `<!-- ZEPHR_FEATURE finansavisen-header -->` in the HTML response.

Our `src/components/FinansavisenHeader.astro` just emits the marker. Production Zephr handles the rest. Locally, `src/middleware.ts` downloads the real component HTML and splices it in — visually identical, slightly stale auth state.

---

## Turn it on

Find `src/pages/index.astro` (and any other page the journalist wants the header on). Flip `showFaChrome` to `true`:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="…" showFaChrome={true}>
  <!-- content -->
</Base>
```

That's it. Both header and footer appear together — they're a package deal for brand consistency.

To make it the **default for the whole app**, change the default value in `src/layouts/Base.astro`:

```astro
const { title, description, showFaChrome = true } = Astro.props;
```

Now every page using `Base` gets the chrome unless it opts out.

---

## Make sure it shows locally

Confirm `.env` has:

```bash
SIMULATE_ZEPHR=true
ZEPHR_COMPONENTS_URL=https://prod-zephr-components.finansavisen.no
```

Restart `pnpm dev` (env changes don't hot-reload). The journalist should see the FA header at the top of the page.

If the header doesn't appear, check:
1. Browser devtools → view page source → search for `ZEPHR_FEATURE`. If you see the bare comments, the middleware isn't running — check `SIMULATE_ZEPHR=true` is set.
2. Network tab → look for the GET to `prod-zephr-components.finansavisen.no/header.html`. If it 404s, Zephr has renamed the component — ask the FA team.
3. The header is downloaded once per dev session and cached in memory. Kill the dev server to clear the cache.

---

## What the journalist needs to know

Tell them in plain words:

> "The Finansavisen header is on. Locally you'll see a slightly stale snapshot — the login button works visually, but won't actually log you in until the site is deployed behind Finansavisen's edge. That's normal."

If they ask "why isn't the login working in dev?", explain:

> "The header is a piece of finansavisen.no's login system. Locally we're showing you a copy of what it looks like, but the login itself only runs when the page is served from finansavisen.no for real."

---

## Add more Zephr features

If the journalist needs a different Zephr-controlled section (paywall, regwall, subscriber-only banner), extend `FEATURE_TO_COMPONENT` in `src/lib/zephr.ts`. The set of allowed feature IDs lives in the Zephr Console — coordinate with the FA team before adding a new one. Known IDs are listed in our wiki under [[Zephr]] → "Known Feature IDs".

Wrap any new feature in a `<ZephrFeature id="…" />` component, same shape as `FinansavisenHeader.astro`.

---

## Hard rule — React boundaries

If the app uses a React island (`client:only="react"` or `client:visible`), the FA header must stay **outside** that island, in the Astro layout. Wrapping a Zephr feature tag inside React makes React overwrite the CDN-injected content on hydration. See AGENTS.md → "Interactivity Rules" for the why.

This is enforced by structure: `<FinansavisenHeader />` only ever appears in `src/layouts/Base.astro`, never inside a `.tsx` component.
