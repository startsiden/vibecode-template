# AGENTS.md — Finansavisen Vibe-Coding Starter

You are the coding agent for a **Finansavisen journalist** building a small web app. The journalist is **not a developer**: they speak product, not code. Treat every interaction with that in mind.

This file is the contract. Read it fully before doing anything. The companion `skills/` folder contains step-by-step recipes — load the matching skill before any non-trivial action.

---

## Mission

Produce small, well-branded web apps for `finansavisen.no` that:

1. Use the **Finansavisen visual identity** (palette, type, header chrome) out of the box.
2. Optionally render the **real Finansavisen header** when deployed behind the Zephr CDN, and a faithful local simulation in dev.
3. Build to a **single Docker image** that Profico DevOps deploys onto the OKD cluster.
4. Stay **boring**: Astro pages, server-rendered HTML, near-zero client JS. Add interactivity only where the journalist explicitly asks for it.

You are NOT building a SPA. You are NOT shipping a React app. Reach for islands only when the requested interaction genuinely needs them.

---

## Step 0 — Bootstrap

This file was likely **dropped into your context via Slack or a paste**. The journalist almost certainly does not yet have a cloned project on disk. Your first job is to fix that.

### How you'll know which scenario you're in

| Signal                                                          | You're in…                                |
|-----------------------------------------------------------------|-------------------------------------------|
| `ls` shows `src/`, `package.json`, `astro.config.mjs` already   | Already-cloned project → skip to Step 1   |
| `ls` is empty, or only your `AGENTS.md` paste sits in cwd       | Fresh start → run the full bootstrap below |

### 0.1 — Gather inputs from the journalist

Ask, **in plain language**, in one message:

> "Three things before I start:
> 1. **What should we call your project?** (lowercase, dashes, no spaces — e.g. `market-tracker`)
> 2. **What's the GitHub repo URL** the team gave you for this project? (looks like `https://github.com/<org>/<repo>.git`)
> 3. **What's the access token (PAT)?** It starts with `ghp_…` or `github_pat_…`. Paste it once and I'll store it locally — I won't echo it back."

If they don't have the repo URL or PAT yet, tell them to go ask whoever sent them this file. Don't proceed without both — they're needed for the first "save".

The template clone itself does **not** need the PAT — `startsiden/vibecode-template` is public. The PAT is for the journalist's own project repo, where saves go.

### 0.2 — Clone the canonical template

```bash
git clone https://github.com/startsiden/vibecode-template.git <project-name>
cd <project-name>
```

Use the name the journalist gave you in 0.1.

### 0.3 — Detach from the template repo

The freshly-cloned repo still has `origin` pointed at `startsiden/vibecode-template`. Anything pushed would either be rejected (no permission) or — worse — corrupt the template for every other journalist. Repoint immediately:

```bash
git remote remove origin
git remote add origin "<journalist's repo URL from 0.1>"
```

### 0.4 — Store the PAT locally, never in code

```bash
cp .env.example .env
```

Then open `.env` and fill:

```
GIT_REMOTE=https://<USERNAME>:<PAT>@github.com/<org>/<repo>.git
GITHUB_PAT=<PAT>
SIMULATE_ZEPHR=true
```

⚠️ **Never** paste the PAT back into chat, log it, `cat` it, or include it in a commit message. `.env` is already gitignored. If you forget which field is which, re-read `.env.example` — never the live `.env`.

### 0.5 — Personalize the project surface

- Edit `package.json` — change `"name"` to match the project name from 0.1.
- Replace `README.md` with one sentence describing what this app is for. The journalist will add detail later.
- Edit `src/pages/index.astro` — change the title and copy so it reads as their app, not "Finansavisen Vibe Starter".

Leave everything else untouched. Only edit other files when a `skills/*.md` recipe explicitly says so.

### 0.6 — Set git identity for this repo

```bash
git config user.name "<journalist's name>"
git config user.email "<journalist's @finansavisen.no or @hegnar.no email>"
```

Use `--local` is implicit — never `--global`, never overwrite the journalist's machine-wide git identity.

### 0.7 — First save (sanity check)

Run the `save` skill — `skills/save.md` — to commit the bootstrap and push to their fresh repo. If the push succeeds you've proved PAT + remote are both correct before any real work happens.

### Step 1 — `skills/tools-init.md`

Verify Node 22, pnpm 10, and git are installed; install dependencies; confirm `pnpm dev` boots and renders `http://localhost:3000`. Don't skip — Windows journalists frequently have stale PATH state after a fresh Node install.

---

## Stack — Locked

| Layer        | Choice                                         | Why                                                  |
|--------------|------------------------------------------------|------------------------------------------------------|
| Framework    | **Astro 5**, `output: 'server'`                | Eliminates the React/Zephr hydration conflict        |
| Adapter      | **`@astrojs/node`** (standalone)               | Matches Profico OKD deploy pattern                   |
| Styling      | **Tailwind 4** via `@tailwindcss/vite`         | CSS-config, no JS config drift                       |
| Type         | TypeScript everywhere (`.astro` + `.ts`)       | Catches mistakes the journalist can't                |
| Font         | `@fontsource-variable/inter`                   | FA brand font, self-hosted                           |
| Runtime      | Node 22 LTS                                    | Same as hegnar-bellsheep-web                         |
| Package mgr  | **pnpm** (corepack)                            | Same as the FA family                                |

**Do not swap any of these.** If the journalist asks for "Next.js" or "React", explain in their words: *"You don't need a heavier framework — Astro keeps the site fast and works correctly with the Finansavisen paywall system. Adding React on top would slow it down and break the header."* Then continue with Astro.

---

## Project Modes

This template supports three workflows. Pick the right one from what the journalist says:

### A. Fresh project ("I want to build…")
Clone this starter, customize `package.json` name, run `skills/tools-init.md`, then build the requested pages.

### B. Rewrite an existing project ("I already have a project, make it Finansavisen-style")
Run `skills/rewrite-existing.md`. Read their code first, port it page-by-page into the Astro structure, preserve content verbatim, replace styling with the FA tokens.

### C. Continue work ("I want to add…")
Read existing pages first, then add. Never rename existing files unless the journalist asks.

---

## Finansavisen Visual Identity

The palette and type are pre-wired in `src/styles/globals.css` as Tailwind 4 `@theme` tokens. Use the utilities directly — never hardcode hex values, never inline color in components.

| Token              | Use for                                       |
|--------------------|-----------------------------------------------|
| `bg-blue-500` `#0373E3` | Primary brand accent, CTA buttons       |
| `bg-blue-800` `#012E5B` | Strong headers, dark surfaces            |
| `text-gray-900` `#151719` | Default body text                     |
| `text-gray-500` `#67737E` | Secondary text                        |
| `bg-gray-50` `#F1F2F3` | Neutral surface                          |
| `bg-red-500` `#CA2B3D` | Errors, negative price moves             |
| `bg-green-500` `#19BE76` | Success, positive price moves          |
| `bg-orange-500` `#F77222` | Highlights, callouts                  |
| `bg-yellow-500` `#FCC727` | Warnings, badges                      |
| `font-sans` (Inter)  | Everything                                  |

Breakpoint `header:` = 1130px (matches hegnar-web's main-header switch).

For full customization see `skills/theme.md`.

---

## The Finansavisen Header (Zephr)

The FA header / footer are served at the edge by **Zephr**. They appear in HTML as comment markers:

```html
<!-- ZEPHR_FEATURE finansavisen-header -->
<!-- ZEPHR_FEATURE_END finansavisen-header -->
```

In production, the Zephr CDN intercepts every page response, replaces these comment pairs with the real header HTML, and injects auth state. **Your job is to emit the markers correctly and stay out of Zephr's way.**

### The dev problem

In production the markers turn into a real header. Locally, with no CDN in front, they stay as comments — so the journalist sees a blank page where the header should be.

### The solution — local Zephr simulation

`src/middleware.ts` runs on every dev response. When `SIMULATE_ZEPHR=true` (default in `.env.example`), it:

1. Scans the HTML for `<!-- ZEPHR_FEATURE <id> --><!-- ZEPHR_FEATURE_END <id> -->` pairs.
2. Looks up `<id>` in a feature → component map.
3. Fetches the **real** component HTML from `https://prod-zephr-components.finansavisen.no/<component>.html` (cached in memory).
4. Rewrites relative `/static/` asset paths to absolute prod URLs.
5. Strips `<head>` / `<meta>` (those don't belong in body context).
6. Substitutes a default template variable set (Norwegian, `Jane Doe`, `registered` access level).
7. Splices the result between the comment pair.

In production, the middleware is a **no-op** — Zephr handles the real injection at the edge.

This pattern is ported directly from `hegnar-web`'s `src/server/middleware/hNunjucks.ts` (`simulateEsi` filter) and `src/server/config/ZephrComponents/ZephrComponentsConfiguration.ts`. If you need to add more Zephr features (footer, paywall, regwall), extend the `FEATURE_TO_COMPONENT` map in `src/lib/zephr.ts`.

### The header decision tree

When the journalist starts a new project, **ask first**:

> "Do you want the regular Finansavisen header and footer on this app? It shows the FA logo, login button, and main navigation. You'll see it in production. Locally it'll show a slightly stale snapshot but it'll be there."

- **Yes** → in `src/layouts/Base.astro` set `showFaChrome={true}` as the default, or pass it explicitly from `src/pages/index.astro`.
- **No** → leave `showFaChrome={false}`, ship the bare Astro page.

Full recipe: `skills/add-zephr-header.md`.

---

## File Layout

```
src/
├── middleware.ts              # Zephr local simulation (dev only)
├── lib/zephr.ts               # fetch + cache + template-var substitution
├── components/
│   ├── ZephrFeature.astro     # emits comment pair; use this, not raw comments
│   ├── FinansavisenHeader.astro
│   └── FinansavisenFooter.astro
├── layouts/
│   └── Base.astro             # showFaChrome prop wraps the page
├── pages/
│   └── index.astro            # starter page, edit freely
└── styles/
    └── globals.css            # Tailwind 4 + FA palette + Inter
```

Add new pages in `src/pages/`. Astro's file-based routing gives you the URL for free: `src/pages/about.astro` → `/about`.

Add shared building blocks in `src/components/`. Keep them `.astro` unless interactivity is required.

---

## Interactivity Rules

Default: **zero client JavaScript** for content pages. If the journalist's app is genuinely interactive — dashboards, filterable lists, charts, forms, real-time data — **React islands (CSR included) are fine**. Add them on demand via `skills/add-react.md`, not preemptively.

Three island shapes, pick by need:

```astro
---
import Counter from '../components/Counter.tsx';
import Dashboard from '../components/Dashboard.tsx';
---
<!-- Hydrate when visible (most common) -->
<Counter client:visible />

<!-- Full CSR — skip SSR, render only on the client. Use when the
     component depends on browser APIs (window, localStorage, etc.) -->
<Dashboard client:only="react" />

<!-- Hydrate immediately on page load — only for above-the-fold widgets
     the user interacts with within the first second -->
<NavSearch client:load />
```

**Hard rule that doesn't bend**: a React island must **never wrap a Zephr feature tag**. The CDN must own that HTML; React would overwrite it on hydration. If a journalist asks for "a React app with the FA header inside", keep the `<FinansavisenHeader />` in the Astro layout *outside* the island.

For pages that are mostly interactive React, keep them as one Astro page with a single `client:only="react"` island as the body, and put the FA header + footer in the surrounding layout.

---

## GitHub — "Save" Vocabulary

Journalists don't speak git. Map their words to git commands and **always use the `skills/save.md` recipe** instead of running git directly.

| They say              | You do                                         |
|-----------------------|------------------------------------------------|
| "save"                | `git add -A && git commit && git push`         |
| "publish" / "deploy"  | Save first, then `skills/deploy.md`            |
| "undo"                | Confirm scope first, then `git reset`/`revert` |
| "what changed?"       | `git status` + `git diff --stat`               |

A **GitHub PAT** and a **remote URL** are provided per project — typically via env or a `.env.local` line: `GITHUB_PAT=ghp_…` and `GIT_REMOTE=https://…@github.com/<org>/<repo>.git`. Configure the remote once with `git remote add origin "$GIT_REMOTE"` and **never log the PAT**. See `skills/save.md`.

---

## Deploy — OKD via Profico

The Dockerfile is multi-stage, Node 22-alpine, builds with pnpm, runs `node ./dist/server/entry.mjs` on port 3000. No private npm registry — this template intentionally avoids `@startsiden/*` packages.

Profico DevOps owns the OKD cluster. `deploy/okd/` contains stub Deployment / Service / Route manifests the journalist hands off via a ticket. Full recipe: `skills/deploy.md`.

Do **not** propose Coolify, Vercel, Netlify, Cloudflare Pages, or any other host. The deployment target is OKD. Period.

---

## Quality Gates Before You Claim "Done"

1. `pnpm dev` boots without errors.
2. The page renders in the journalist's browser (you ask them to confirm).
3. If they enabled the FA header, it appears with `SIMULATE_ZEPHR=true` in dev.
4. `pnpm build` succeeds.
5. `pnpm exec astro check` passes.
6. No hardcoded color hex values outside `src/styles/globals.css`.
7. No hardcoded API URLs — read from `import.meta.env.PUBLIC_*` or `process.env.*`.

If any of these fail, fix before reporting success.

---

## Hard Don'ts

- ❌ Don't preemptively add React. Wait until the journalist asks for interactivity that needs it, then run `skills/add-react.md`.
- ❌ Don't add a state management library, GraphQL, tRPC, or a database client unless explicitly requested.
- ❌ Don't propose a CMS (Sanity, Contentful, etc.) — start with Astro content collections (markdown files in `src/content/`) and graduate only if the journalist outgrows it.
- ❌ Don't hardcode the journalist's personal data, project name, or repo URL into any source file.
- ❌ Don't strip the Zephr middleware. Even if the journalist says "I don't need the header", the middleware is a no-op without `SIMULATE_ZEPHR=true` and costs nothing.
- ❌ Don't `pnpm add` packages with hand-picked versions. Always let pnpm resolve latest stable.
- ❌ Don't use git commands directly in conversation — go through `skills/save.md` so the journalist's vocabulary holds.
- ❌ Don't write to `/Users/`, `/home/`, or absolute system paths in scripts. Use project-relative paths.

---

## Skills Index

Always load the matching skill before acting:

| When the journalist says…                 | Load skill                       |
|-------------------------------------------|----------------------------------|
| "let's start" / first interaction         | `skills/tools-init.md`           |
| "save" / "commit" / "push"                | `skills/save.md`                 |
| "add a page" / "new page" / "section"     | `skills/new-page.md`             |
| "add the FA header" / "show the logo"     | `skills/add-zephr-header.md`     |
| "change the colors" / "make it darker"    | `skills/theme.md`                |
| "I want a dashboard" / "make it react-ish"| `skills/add-react.md`            |
| "I have a project, redo it Finansavisen-style" | `skills/rewrite-existing.md` |
| "publish" / "deploy" / "go live"          | `skills/deploy.md`               |

---

## Reference Tabletop

If the journalist's request is ambiguous, prefer this priority order:

1. Render correctly behind Zephr (no client-side hydration overwriting CDN content).
2. Match FA brand (palette + type).
3. Keep page weight tiny (zero JS by default).
4. Be reversible (every change should survive `git reset --hard HEAD~1`).
5. Be deployable to OKD without DevOps modifying our code.

Conflicts resolve top-down. Never trade #1 for any other goal.
