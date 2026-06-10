#!/usr/bin/env bash
# Verifies the local toolchain matches what the FA Vibe Starter needs.
# Prints one line per tool. Exits 1 if anything required is missing.

set -uo pipefail

required_node_major=22
required_pnpm_major=10
required_git_minor=40

green=$'\033[32m'
red=$'\033[31m'
yellow=$'\033[33m'
reset=$'\033[0m'

ok=0
fail=0
warn=0

check() {
  local name="$1" cmd="$2" min="$3" hint="$4"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf '%s✗%s %-8s not installed — %s\n' "$red" "$reset" "$name" "$hint"
    fail=$((fail + 1))
    return
  fi
  local ver
  ver="$($cmd --version 2>/dev/null | head -n 1)"
  if [[ -n "$min" && ! "$ver" =~ $min ]]; then
    printf '%s⚠%s %-8s %s (expected %s)\n' "$yellow" "$reset" "$name" "$ver" "$min"
    warn=$((warn + 1))
  else
    printf '%s✓%s %-8s %s\n' "$green" "$reset" "$name" "$ver"
    ok=$((ok + 1))
  fi
}

echo "Toolchain check for fa-vibe-starter"
echo "-----------------------------------"

check "node"   "node"   "v$required_node_major\." "install Node $required_node_major LTS"
check "pnpm"   "pnpm"   "$required_pnpm_major\."  "run: corepack enable && corepack prepare pnpm@latest --activate"
check "git"    "git"    ""                         "install Git"
check "docker" "docker" ""                         "install Docker Desktop (optional, only for build smoke-tests)"

echo "-----------------------------------"
printf 'ok: %d, warnings: %d, missing: %d\n' "$ok" "$warn" "$fail"

if [[ $fail -gt 0 ]]; then
  echo
  echo "Install the missing tools above, then re-run this script."
  exit 1
fi
