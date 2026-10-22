#!/usr/bin/env bash
# Installs the whole Claude Code plugin set of this repository at the user
# scope: the three plugins hosted here plus the third-party ones this setup
# relies on. Safe to run again: marketplaces and plugins already present are
# skipped.
#
# Usage, from a shell on a machine with Claude Code and a GitHub credential:
#   gh repo clone Jmezas/claude-mods && ./claude-mods/install.sh
# or, without cloning:
#   bash <(gh api repos/Jmezas/claude-mods/contents/install.sh -H 'Accept: application/vnd.github.raw')
#
# CLAUDE_MODS_REPO overrides the marketplace source (default Jmezas/claude-mods).
set -euo pipefail

REPO="${CLAUDE_MODS_REPO:-Jmezas/claude-mods}"

if ! command -v claude >/dev/null 2>&1; then
  echo "claude is not on PATH. Install Claude Code first: https://claude.com/claude-code" >&2
  exit 1
fi

MARKETPLACES="$(claude plugin marketplace list 2>/dev/null || true)"
PLUGINS="$(claude plugin list 2>/dev/null || true)"

add_marketplace() {
  local name="$1" source="$2"
  if grep -qE "❯ ${name}\$" <<<"$MARKETPLACES"; then
    echo "marketplace ${name}: already added"
  else
    echo "marketplace ${name}: adding from ${source}"
    claude plugin marketplace add "$source"
  fi
}

install_plugin() {
  local id="$1"
  if grep -qE "❯ ${id}\$" <<<"$PLUGINS"; then
    echo "plugin ${id}: already installed"
  else
    echo "plugin ${id}: installing"
    claude plugin install "$id" --scope user
  fi
}

# Marketplaces. claude-plugins-official ships with Claude Code.
add_marketplace claude-mods "$REPO"
add_marketplace anti-slop https://github.com/miqdadbadjuber/anti-slop
add_marketplace caveman JuliusBrussee/caveman

# Plugins hosted in this repository.
install_plugin model-router@claude-mods
install_plugin task-timer@claude-mods
install_plugin thermos@claude-mods
install_plugin reverse-engineer-anything@claude-mods

# Third-party plugins of this setup.
install_plugin antislop@anti-slop
install_plugin caveman@caveman
install_plugin mattpocock-skills@claude-plugins-official
install_plugin frontend-design@claude-plugins-official
install_plugin postman@claude-plugins-official

echo
echo "Done. Start a new Claude Code session, or run /reload-plugins in an open one."
echo "Then: /router shows the model router, /timer opens the stopwatch pane."
