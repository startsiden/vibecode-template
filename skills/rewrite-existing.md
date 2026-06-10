# skills/rewrite-existing.md — Port an existing project to the FA Vibe Starter

**When to load**: journalist hands you a folder / git repo and says "make this Finansavisen-style", "redo this in our format", "use my old project as a starting point".

**Goal**: keep their content + behavior, replace the framework + styling with this starter's stack.

---

## Discover before you delete

Before you change a single file, **read everything**:

```bash
ls -la <their-project>
cat <their-project>/package.json 2>/dev/null || cat <their-project>/index.html
```

Inventory what they have:

| Their stack          | Notes                                                    |
|----------------------|----------------------------------------------------------|
| Plain HTML / CSS / JS| Easiest. Map files 1:1 to `src/pages/*.astro`.           |
| React (Vite / CRA)   | Convert pages to `.astro`; keep components as `.tsx` islands. |
| Next.js (pages / app)| Pages → `src/pages/*.astro`. API routes → `src/pages/api/*.ts` or drop if not needed. |
| Vue / Svelte / Solid | Either port to Astro components, or run as islands with the matching `@astrojs/*` integration. Pick based on the journalist's energy. |
| WordPress / static export | Walk the HTML pages, port 1:1.                      |

If you don't recognize the stack — ask. Don't guess.

---

## Walk the journalist through the plan

Before any edits, summarize in plain words:

> "You have N pages, M images, and one form. I'll move each page into the new template, copy your text exactly, switch the styling to the Finansavisen palette, and keep your images. I won't change what the pages say. Sound good?"

Wait for confirmation. Then go page by page.

---

## Port one page at a time

For each of their pages:

1. **Create a matching Astro file** in `src/pages/`. Use the URL as the guide:
   - `index.html` → `src/pages/index.astro`
   - `about.html` → `src/pages/about.astro`
   - `articles/2024-01.html` → `src/pages/articles/2024-01.astro`

2. **Wrap in `<Base>`** and copy the content into the slot. Preserve the exact text — do not paraphrase, do not "improve" copy.

3. **Replace styling** as you go:
   - `style="color: #abcdef"` inline → nearest FA token (`text-blue-500`, etc.)
   - Custom `<link rel="stylesheet">` → Tailwind utilities
   - Bootstrap classes → equivalent Tailwind
   - Their custom font → `font-sans` (Inter) unless the journalist asks otherwise

4. **Images / assets**: copy to `public/`. Reference as `/image.png` (note the leading slash). Astro serves `public/` at the root.

5. **Save** after every 3–5 pages: `skills/save.md`. Don't accumulate a massive uncommitted diff — small saves keep undo cheap.

---

## React / framework code

If the original had interactive components:

- Move `.tsx` / `.jsx` files into `src/components/`.
- Run `pnpm astro add react` (see `skills/add-react.md`) if not already added.
- Reference them as islands from `.astro` pages, e.g. `<TheirThing client:visible />`.
- Strip the original mount code (`ReactDOM.createRoot(…)`, `app.mount(…)`) — Astro handles mounting via the island directive.

Vue / Svelte / Solid get the same treatment with `@astrojs/vue` / `-svelte` / `-solid`.

---

## API routes

If their app talks to a backend, two paths:

1. **The backend is theirs** → keep using it. Configure the URL via `PUBLIC_API_URL` env var (read in components as `import.meta.env.PUBLIC_API_URL`).
2. **The backend was Next.js API routes** → port to `src/pages/api/*.ts` (Astro supports API routes the same way) OR move to a separate small Node service. Ask the journalist.

---

## Things to actively throw away

- Old build configs (`webpack.config.js`, `next.config.js`, `vite.config.ts` not ours).
- Their `package.json` (replace, don't merge — too much conflict).
- Lockfiles from the previous package manager (`yarn.lock`, `package-lock.json`).
- Custom routers (React Router, Vue Router) — Astro file-based routing replaces them.
- State management libs (Redux, Vuex, Pinia) — keep them only if the journalist actually uses them.
- CSS frameworks other than Tailwind — port styles to Tailwind utilities.
- Their `node_modules/` and `dist/` — never commit, never copy.

---

## Don't throw away

- Their **content** (HTML text, markdown, images, videos).
- Their **logic** (form validation rules, data fetching, business rules).
- Their **git history** if they ask to preserve it — port into a sub-folder of the new repo first, then move content out, then save.

---

## After the port

1. `pnpm dev` — walk the journalist through every page, side-by-side with their old version. Confirm content matches.
2. `pnpm exec astro check` passes.
3. `pnpm build` succeeds.
4. Run `skills/theme.md` if they want brand tweaks.
5. Save (`skills/save.md`).
6. If they're ready, deploy (`skills/deploy.md`).
