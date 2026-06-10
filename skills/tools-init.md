# skills/tools-init.md — First-time setup check

**When to load**: the first time you open a project. The journalist says "let's start", "I'm new", "set this up", or hits an error that looks like a missing tool.

**Goal**: make sure the journalist's machine has everything to run `pnpm dev` without errors. Friendly, plain-English. Don't dump install instructions on them — check, then offer.

---

## What we need

| Tool   | Version  | Used for                  |
|--------|----------|---------------------------|
| Node   | 22.x LTS | Running Astro             |
| pnpm   | 10.x     | Installing dependencies   |
| git    | 2.40+    | Saving + publishing       |
| Docker | optional | Building the deploy image |

---

## Detect the OS first

```bash
# macOS
uname -s   # → Darwin

# Linux
uname -s   # → Linux

# Windows
ver        # in cmd.exe → "Microsoft Windows [Version 10.0.…"
$PSVersionTable.OS  # in PowerShell → "Microsoft Windows …"
```

Or just ask: "Are you on Mac, Windows, or Linux?"

---

## Run the check script

The repo ships two equivalent scripts:

- macOS / Linux: `bash scripts/check-tools.sh`
- Windows: `pwsh scripts/check-tools.ps1` (PowerShell 7+)

These print one line per tool with a ✓ or ✗ and the detected version. If any line shows ✗, follow the matching install section below.

---

## Install — macOS

Use Homebrew. If the journalist doesn't have it:

```bash
# Open https://brew.sh and follow the official one-liner — never paste
# a brew install command from chat, the official site is the source of truth.
```

Then:

```bash
brew install node@22 git
corepack enable
corepack prepare pnpm@latest --activate
```

Optional Docker: `brew install --cask docker` (Docker Desktop).

---

## Install — Windows

Use **winget** (built into Windows 11, available on Windows 10):

```powershell
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id Git.Git
corepack enable
corepack prepare pnpm@latest --activate
```

Optional Docker: `winget install -e --id Docker.DockerDesktop`.

Tell the journalist to **close and reopen PowerShell** after the installs so `PATH` refreshes.

---

## Install — Linux

```bash
# Debian / Ubuntu
sudo apt update && sudo apt install -y nodejs npm git
# Then upgrade Node to 22 via nodesource:
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
corepack enable
corepack prepare pnpm@latest --activate
```

For Fedora / RHEL, swap `apt` for `dnf` and use `https://rpm.nodesource.com/setup_22.x`.

---

## After install — first dependency install

```bash
pnpm install
```

This downloads everything `package.json` lists. First run takes a couple of minutes — totally normal. Then:

```bash
pnpm dev
```

Tell the journalist: open **http://localhost:3000** in their browser. They should see the starter page.

If that works, you're done. If not, copy the error into chat and ask for help.

---

## Common gotchas

- **"corepack: command not found"** → upgrade Node to 22. Old Node versions ship pnpm separately.
- **"pnpm: ENOENT"** on Windows → close + reopen PowerShell after install so PATH refreshes.
- **Port 3000 already in use** → another app is on that port. Either close it, or change `PORT=3000` in `.env`.
- **"fetch is not defined"** → Node version is below 18. Upgrade.
- **Apple Silicon Mac, Node from Intel Homebrew** → reinstall Homebrew under `/opt/homebrew` first.
