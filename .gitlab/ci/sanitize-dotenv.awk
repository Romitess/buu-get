# Sanitize dotenv for kubectl --from-env-file.
# - strip BOM/CRLF, comments, blank lines
# - allow optional `export ` prefix (v1.0.3 behavior)
# - trim key and value
# - skip invalid env keys
# - last-wins on duplicate keys
BEGIN { n = 0 }
{
  line = $0
  sub(/\r$/, "", line)
  if (NR == 1) sub(/^\xef\xbb\xbf/, "", line)
  gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)
  if (line == "") next
  if (line ~ /^#/) next
  if (line ~ /^export[[:space:]]+/) sub(/^export[[:space:]]+/, "", line)
  eq = index(line, "=")
  if (eq < 2) next
  key = substr(line, 1, eq - 1)
  val = substr(line, eq + 1)
  gsub(/^[[:space:]]+|[[:space:]]+$/, "", key)
  gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)
  if (key == "") next
  if (key !~ /^[A-Za-z_][A-Za-z0-9_]*$/) {
    printf "WARN: Skipping invalid dotenv key: %s\n", key > "/dev/stderr"
    next
  }
  if (key in vals) {
    dups[key]++
  } else {
    order[++n] = key
  }
  vals[key] = val
}
END {
  for (i = 1; i <= n; i++) {
    k = order[i]
    print k "=" vals[k]
  }
  for (k in dups) {
    printf "WARN: Duplicate dotenv key (kept last): %s (%d extras)\n", k, dups[k] > "/dev/stderr"
  }
}
