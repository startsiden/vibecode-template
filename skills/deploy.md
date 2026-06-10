# skills/deploy.md — Going live on OKD

**When to load**: journalist says "deploy", "publish", "go live", "put it online", "release".

**Goal**: hand a working build off to Profico DevOps for the OKD cluster. The journalist does not deploy — DevOps does. Your job is to make the handoff bulletproof.

---

## Pre-flight (do this first)

1. **Save everything** — see `skills/save.md`. The deploy pulls from the git remote, so anything not pushed will be missing.

2. **Build locally** to confirm nothing's broken:
   ```bash
   pnpm install
   pnpm exec astro check
   pnpm build
   ```
   All three must pass with zero errors. Warnings are OK.

3. **Smoke-test the production build**:
   ```bash
   PORT=3000 pnpm start
   ```
   Open `http://localhost:3000`. Click around. The Zephr header WILL be missing here — that's fine, the simulation only runs in dev. Everything else should look correct.

4. **Build the Docker image locally** before sending to DevOps:
   ```bash
   docker build -t fa-vibe-starter:local .
   docker run --rm -p 3000:3000 fa-vibe-starter:local
   ```
   Same smoke test inside the container. Catching a broken Dockerfile here saves a deploy round trip.

   Why: Coolify-style "push and pray" deploys are ~3 min round-trip each. Local Docker builds catch the same errors in seconds. (Same lesson as our mini-apps work — `pnpm dev` is not a replacement for `docker build .`.)

---

## What the DevOps ticket needs

Open a ticket for Profico DevOps with:

| Field          | Value                                               |
|----------------|-----------------------------------------------------|
| Project name   | Same as `name` in `package.json`                    |
| Git repo URL   | The HTTPS URL of the journalist's GitHub repo       |
| Default branch | Usually `main`                                      |
| Image name     | Suggest `<project-name>` in the FA registry         |
| Container port | `3000`                                              |
| Health path    | `/` (200 OK on the homepage is good enough)         |
| Public URL     | What URL should it live at? (e.g. `<name>.finansavisen.no`) |
| Env vars       | Anything from `.env.example` the journalist needs in prod. **Do not include `SIMULATE_ZEPHR` in prod** — Zephr CDN does the real injection. |
| Behind Zephr?  | Yes if they enabled the FA header. No otherwise.    |
| Resource hints | 256 MB RAM, 0.1 CPU is plenty for a starter app     |

The `deploy/okd/` folder in this repo contains stub manifests (Deployment + Service + Route). DevOps may use them as a starting point or replace with their own template — both fine, just attach them to the ticket.

---

## Production env vars

In production:

| Var                    | Value                                              |
|------------------------|----------------------------------------------------|
| `NODE_ENV`             | `production`                                       |
| `PORT`                 | `3000`                                             |
| `HOST`                 | `0.0.0.0` (Astro Node adapter)                     |
| `SIMULATE_ZEPHR`       | **unset** or `false` — Zephr CDN handles it        |
| `ZEPHR_COMPONENTS_URL` | **unset** — only used by the local sim             |
| `PUBLIC_*`             | Anything the app reads from `import.meta.env.PUBLIC_*` |
| `GITHUB_PAT`, `GIT_REMOTE` | **never** in prod — those are only for local saves |

Make this list explicit in the ticket so DevOps doesn't have to guess.

---

## If the app needs the FA header in production

Tell DevOps in the ticket: **"this app sits behind Zephr at `<URL>` — please confirm with Hegnar that the Zephr feature `finansavisen-header` is enabled for this hostname."**

If they forget, the journalist will see bare comments where the header should be — same failure mode as having `SIMULATE_ZEPHR=false` locally.

---

## After deploy

1. Visit the live URL. Confirm everything renders.
2. View page source → search for `ZEPHR_FEATURE`. If you see the bare comments in prod, Zephr isn't in the path — flag to DevOps + Hegnar.
3. Tell the journalist in plain English where their app is now: *"Your app is live at <URL>. Anyone with that link can see it."*

---

## Updating after first deploy

1. Edit the code.
2. `skills/save.md`.
3. DevOps' OKD pipeline picks up the push automatically (typically on the default branch). If they have a manual trigger, ping them.
4. Refresh the live URL after 2–5 min.

Tell the journalist: *"Every time you save, your changes go live within a few minutes. Refresh the page to see them."*

---

## Hard don'ts

- ❌ Don't propose Coolify, Vercel, Netlify, Cloudflare Pages, or any other host. Deployment target is OKD via Profico.
- ❌ Don't paste the journalist's PAT or production secrets into the ticket — DevOps has its own secret store.
- ❌ Don't try to `kubectl apply` yourself unless the journalist explicitly says they have cluster access. They don't.
- ❌ Don't commit a `.env.production` with real values. The OKD secret store holds those.
