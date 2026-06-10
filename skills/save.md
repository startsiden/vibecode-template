# skills/save.md — Saving work

**When to load**: the journalist says "save", "save this", "commit", "push", or "back this up".

**Goal**: capture the journalist's current work into git and push it to the remote so it survives a laptop wipe and the deploy pipeline can pick it up.

The journalist does not say "commit" or "push". They say **save**. Mirror their vocabulary.

---

## Pre-flight

1. Confirm `.env` is **not** about to be committed:
   ```bash
   git status --porcelain | grep -E '^\.env$|^\?\?  \.env$' && echo "WARN .env staged" || true
   ```
   `.gitignore` already excludes it, but double-check after the journalist edits env vars.

2. Confirm a remote is configured:
   ```bash
   git remote -v
   ```
   If empty, see "First-time setup" below.

3. Show what's about to be saved:
   ```bash
   git status --short
   git diff --stat
   ```
   Read the changes to the journalist out loud in plain English: *"You changed the homepage and added two new images."*

---

## Save (commit + push)

```bash
git add -A
git commit -m "<one-line summary in plain language>"
git push origin HEAD
```

Commit message guidance:
- Plain English, present tense, no jargon. *"Update the about page with my bio"*, not *"feat: refactor about.astro"*.
- One line. No body, no co-author, no emoji unless the journalist asks.
- If they used a JIRA / ticket id, include it in brackets: `[FA-123] Add price table to homepage`.

After push, **read the result back**: *"Saved. Your latest version is now on GitHub."*

---

## First-time setup (no remote yet)

The journalist will have been given:
- A **GitHub repo URL** (HTTPS, ends in `.git`)
- A **GitHub PAT** (starts with `ghp_…`)

Add them to `.env` (already gitignored):

```bash
echo "GIT_REMOTE=https://<USERNAME>:<PAT>@github.com/<org>/<repo>.git" >> .env
```

Then configure the remote:

```bash
git init  # only if not already a repo
git branch -M main
# Read the URL out of .env without printing it
set -a; . ./.env; set +a
git remote add origin "$GIT_REMOTE"
unset GIT_REMOTE  # don't leave the PAT-bearing URL in the shell
git push -u origin main
```

⚠️ **Never echo `$GIT_REMOTE` or `$GITHUB_PAT`.** They contain the PAT. If a command would print them, redirect to `/dev/null`.

⚠️ **Never paste the PAT into chat.** If the journalist offers it, tell them to write it into `.env` themselves.

---

## Undo a save

If the journalist says "undo my last save" / "go back":

```bash
git log --oneline -5    # show recent saves
```

Read out the last 3 in plain English. Confirm which one they want to roll back to. Then:

```bash
# Undo the changes but keep them in your working files
git reset --soft HEAD~1

# Throw the changes away entirely (asks explicit confirmation first)
git reset --hard HEAD~1
```

After `--hard`, also undo on the remote (only if already pushed):

```bash
git push --force-with-lease origin main
```

Use `--force-with-lease`, **never** `--force`. Tell the journalist *"Undone — let me know if you need to bring it back."*

---

## "What's saved vs. not saved?"

```bash
git status --short      # files changed since last save
git log --oneline -5    # recent saves
git log origin/main..HEAD --oneline   # saved locally but not pushed
```

Translate the output. Don't paste the raw git words at them.
