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

# Install skills via npx skills add
npx --yes skills add coreyhaines31/marketingskills 2>/dev/null || true
npx --yes skills add https://github.com/Leonxlnx/taste-skill 2>/dev/null || true
npx --yes skills add https://github.com/emilkowalski/skill 2>/dev/null || true
npx --yes skills add https://github.com/obra/superpowers 2>/dev/null || true
npx --yes skills add https://github.com/kepano/obsidian-skills 2>/dev/null || true

# Install caveman skill
curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash 2>/dev/null || true
