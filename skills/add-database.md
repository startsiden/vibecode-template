# skills/add-database.md — Storing data that survives

**When to load**: journalist says "save it", "remember", "store", "keep a list", "log", "history", "database", "it forgets everything when I refresh".

**Goal**: give the app a real database with the least machinery possible, and never let the journalist touch a credential.

---

## First — does this actually need a database?

Stop here and check. Most "save it" requests don't need one:

| What they want | Use this instead |
|---|---|
| Remember a setting for one visitor | `localStorage` in the browser — zero backend |
| A fixed list that rarely changes (staff, links, categories) | A `.json` or `.ts` file in the repo, edited by saving |
| Content pages, articles, copy | Astro content collections / markdown files |
| Show data from another FA system | Fetch their API on each request. Don't copy the data |

A database is right when the app **writes** data that must outlive a redeploy and be shared between visitors: submissions, flags, logs, queues, anything accumulating over time.

If a file in the repo works, use the file. It's simpler, it's versioned, and the journalist can see it.

---

## How the database works here

Every app on the FA app platform shares **one Postgres server** running on the platform's Coolify host. Each app gets:

- its **own database** on that server, and
- its **own login** that can reach only that database.

Apps cannot read each other's data. Your app sees one database and nothing else.

You do **not** create this. The platform owner provisions it and puts the connection string into the app's environment in Coolify as:

```
DATABASE_URL=postgres://<user>:<password>@<host>:5432/<dbname>
```

Your code reads `process.env.DATABASE_URL`. That is the whole integration.

### What you must never do

- ❌ Never write a real `DATABASE_URL` into the repo, into `.env.example`, or into any file you commit. Placeholders only.
- ❌ Never ask the journalist to paste a database password into the chat.
- ❌ Never `CREATE DATABASE`, create roles, or connect to any database other than your own.
- ❌ Never use SQLite. It works locally and then silently loses everything on redeploy, because the container's disk is thrown away each time.

If `DATABASE_URL` isn't set yet, say to the journalist in their words: *"Your app needs a database. I've written the code for it — the platform team needs to switch it on before it can go live."* Then keep building; don't block.

---

## Setup

One dependency. No ORM, no migration framework — those cost more to understand than they save on an app this size.

```bash
pnpm add pg
pnpm add -D @types/pg
```

Create `src/lib/db.ts`:

```ts
import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — the database has not been switched on for this app yet.");
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // small app, small pool — the server is shared with every other app
});

/** Runs once at boot. Safe to run every time. */
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS entries (
      id         SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      body       TEXT NOT NULL
    )
  `);
}
```

Change the table to match what the app actually stores. Keep `CREATE TABLE IF NOT EXISTS` — that *is* the migration strategy. To add a column later, add a separate `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` line below it. Both are safe to run on every boot.

Call `initDb()` once at startup — in `src/middleware.ts` behind a module-level flag, or at the top of the first page that needs it.

---

## Using it

Always use parameters (`$1`, `$2`). Never build SQL by joining strings — that's how an app gets taken over by whatever someone types into a form.

```ts
// read
const { rows } = await pool.query("SELECT * FROM entries ORDER BY created_at DESC LIMIT 50");

// write
await pool.query("INSERT INTO entries (body) VALUES ($1)", [text]);
```

```ts
// ❌ never
await pool.query(`INSERT INTO entries (body) VALUES ('${text}')`);
```

`pg` is async — every query needs `await`. In `.astro` files that's fine, the frontmatter is already async.

---

## Running it locally

The journalist needs a Postgres on their own machine to develop against. One command, needs Docker running:

```bash
docker run -d --name fa-local-db -p 5432:5432 -e POSTGRES_PASSWORD=local -e POSTGRES_DB=app postgres:17-alpine
```

Then in `.env` (which is gitignored — never `.env.example`):

```
DATABASE_URL=postgres://postgres:local@localhost:5432/app
```

Stop it with `docker stop fa-local-db`, start it again with `docker start fa-local-db`. The data stays between restarts.

Tell the journalist: *"Your app now has a memory. On your machine it's a practice database — anything you add here is only on your computer, and the live version keeps its own separate data."*

---

## Before going live

Add to `.env.example` — placeholder only:

```
# Provided by the platform in Coolify. Never fill this in here.
DATABASE_URL=postgres://user:password@host:5432/dbname
```

Then in `skills/deploy.md`, flag that this app needs a database so the platform owner provisions one before first deploy. An app that boots without `DATABASE_URL` will crash on start, which is deliberate — better a clear failure than an app that silently saves nothing.

---

## Hard don'ts

- ❌ No SQLite, no `better-sqlite3`, no local files for data that must persist.
- ❌ No ORM (Prisma, Drizzle, Sequelize) unless the journalist has a schema too complex for plain SQL — they don't.
- ❌ No second database, no Redis, no queue. If it seems necessary, ask the platform owner first.
- ❌ Don't store personal data about readers or sources without checking — that's a GDPR question, not a coding one. Ask before building it.
