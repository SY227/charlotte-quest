#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

restore_echo() {
  stty echo 2>/dev/null || true
}
trap restore_echo EXIT INT TERM

printf "Paste your Gemini API key (it will stay hidden): "
stty -echo
IFS= read -r GEMINI_API_KEY
stty echo
printf "\n"

if [[ -z "$GEMINI_API_KEY" ]]; then
  printf "No key was entered. Nothing changed.\n" >&2
  exit 1
fi

printf 'GEMINI_API_KEY=%s\nGEMINI_MODEL=gemini-3.6-flash\nPORT=3000\n' "$GEMINI_API_KEY" > .env.local
chmod 600 .env.local
unset GEMINI_API_KEY
printf "Gemini is configured. Run: npm start\n"
