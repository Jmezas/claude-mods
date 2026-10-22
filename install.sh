#!/usr/bin/env bash
# Instala todo el conjunto de plugins de Claude Code de este repositorio a
# nivel de usuario: los plugins alojados aquí más los de terceros que usa este
# entorno. Se puede ejecutar varias veces: lo ya instalado se omite.
#
# Uso, desde una shell con Claude Code y una credencial de GitHub:
#   gh repo clone Jmezas/claude-mods && ./claude-mods/install.sh
# o, sin clonar:
#   bash <(gh api repos/Jmezas/claude-mods/contents/install.sh -H 'Accept: application/vnd.github.raw')
#
# CLAUDE_MODS_REPO cambia el origen del marketplace (por defecto Jmezas/claude-mods).
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
install_plugin guard-rails@claude-mods
install_plugin cost-budget@claude-mods
install_plugin release-notes@claude-mods
install_plugin api-contract@claude-mods

# Third-party plugins of this setup.
install_plugin antislop@anti-slop
install_plugin caveman@caveman
install_plugin mattpocock-skills@claude-plugins-official
install_plugin frontend-design@claude-plugins-official
install_plugin postman@claude-plugins-official

echo
echo "Listo. Abre una sesión nueva de Claude Code o ejecuta /reload-plugins en una abierta."
echo "Comandos: /router, /timer, /guard, /budget, /release, /api-contract, /thermos."
