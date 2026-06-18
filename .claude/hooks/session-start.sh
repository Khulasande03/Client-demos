#!/bin/bash
set -euo pipefail

SKILLS_SRC="$(cd "$(dirname "$0")/../skills" && pwd)"
SKILLS_DEST="$HOME/.claude/skills"

mkdir -p "$SKILLS_DEST"

for skill_dir in "$SKILLS_SRC"/*/; do
  skill_name=$(basename "$skill_dir")
  mkdir -p "$SKILLS_DEST/$skill_name"
  cp "$skill_dir/SKILL.md" "$SKILLS_DEST/$skill_name/SKILL.md"
done

exit 0
