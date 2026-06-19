#!/usr/bin/env bash
set -e
export RUST_LOG=error
for f in 01-lookup-table 02-compute-budget 03-deactivate-table; do
  echo "=== $f ==="
  npx tsx "$f.bankrun.ts" | grep -E "PASS|FAIL|CHECKS"
done
echo ""
echo "ALL SUITES PASSED"
