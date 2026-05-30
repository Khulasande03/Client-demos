#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 300000}'

# Install graphify skill
uv tool install graphifyy --quiet 2>/dev/null || true

# Install ui-ux-pro-max skill
if ! command -v uipro &>/dev/null; then
  npm install -g uipro-cli --quiet 2>/dev/null || true
fi
uipro init --ai claude 2>/dev/null || true
