#!/usr/bin/env bash
#
# Custom installer for the solana-versioned-transactions Claude Code skill.
# Lets you choose a personal or project install location.
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Install solana-versioned-transactions"
echo "  1) Personal  (~/.claude/skills)   - available in every project"
echo "  2) Project   (./.claude/skills)   - this project only"
read -r -p "Choose [1/2] (default 1): " choice

case "$choice" in
  2) BASE="$(pwd)/.claude/skills" ;;
  *) BASE="$HOME/.claude/skills" ;;
esac

mkdir -p "$BASE"
exec "$SCRIPT_DIR/install.sh" "$BASE"
