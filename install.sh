#!/usr/bin/env bash
#
# Installer for the solana-versioned-transactions Claude Code skill.
# Standard install into the personal skills directory.
# For location options, use ./install-custom.sh
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="${1:-$HOME/.claude/skills}"
DEST="$BASE/solana-versioned-transactions"

echo "Installing solana-versioned-transactions -> $DEST"

rm -rf "$DEST"
mkdir -p "$DEST"

cp -r "$SCRIPT_DIR/skill/." "$DEST/"
cp -r "$SCRIPT_DIR/agents" "$SCRIPT_DIR/commands" "$SCRIPT_DIR/rules" "$DEST/"
cp "$SCRIPT_DIR/CLAUDE.md" "$DEST/CLAUDE.md"

echo "Done."
echo "  Skill entry : $DEST/SKILL.md"
echo "  Agents      : $DEST/agents/"
echo "  Commands    : $DEST/commands/"
echo ""
echo "Tested examples live in $SCRIPT_DIR/examples"
echo "  Run them:  cd \"$SCRIPT_DIR/examples\" && npm install && npm test"
echo ""
echo 'Try: "My transaction has too many accounts, set up a lookup table"'
