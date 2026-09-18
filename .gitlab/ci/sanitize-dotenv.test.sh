#!/usr/bin/env bash
# One check for sanitize-dotenv.awk: export prefix, trim, last-wins, invalid skip.
set -euo pipefail

AWK_FILE="$(cd "$(dirname "$0")" && pwd)/sanitize-dotenv.awk"
IN="$(mktemp)"
OUT="$(mktemp)"
trap 'rm -f "$IN" "$OUT"' EXIT

cat > "$IN" <<'EOF'
# comment
export BUU_LOGIN_BUU_PROVISION_KEY=  first-key  
BUU_DOMAIN = https://kong-dev.buu.ac.th
BUU_LOGIN_BUU_PROVISION_KEY=second-wins
invalid key=foo
export BUU_LOGIN_BUU_SCOPE=read
EOF

awk -f "$AWK_FILE" "$IN" > "$OUT"

expect_line() {
  if ! grep -qxF "$1" "$OUT"; then
    echo "FAIL: expected line: $1" >&2
    echo "--- output ---" >&2
    cat "$OUT" >&2
    exit 1
  fi
}

expect_line "BUU_LOGIN_BUU_PROVISION_KEY=second-wins"
expect_line "BUU_DOMAIN=https://kong-dev.buu.ac.th"
expect_line "BUU_LOGIN_BUU_SCOPE=read"

if grep -q 'invalid' "$OUT"; then
  echo "FAIL: invalid key should have been skipped" >&2
  cat "$OUT" >&2
  exit 1
fi

if grep -q 'first-key' "$OUT"; then
  echo "FAIL: duplicate should keep last value" >&2
  cat "$OUT" >&2
  exit 1
fi

echo "sanitize-dotenv.awk OK"
