#!/bin/bash
set -euo pipefail

# Only run in remote (web) sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install claude-mem plugin persistently
if ! npx --yes claude-mem@13.4.0 status &>/dev/null 2>&1; then
  npx --yes claude-mem@13.4.0 install --force 2>&1 | tail -5 || true
fi

# Fix claude-mem peer-dep conflict if present
PLUGIN_DIR="$HOME/.claude/plugins/cache/thedotmack/claude-mem/13.4.0"
if [ -d "$PLUGIN_DIR" ] && [ ! -f "$PLUGIN_DIR/.deps-fixed" ]; then
  cd "$PLUGIN_DIR" && npm install --force &>/dev/null 2>&1 && touch .deps-fixed && cd - &>/dev/null || true
fi
