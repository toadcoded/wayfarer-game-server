#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[1/3] strict TypeScript compilation"
npx -y -p typescript@5.7.2 tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution node --lib ES2022,DOM --skipLibCheck $(find src/cleanroom-client -name '*.ts' -print)

echo "[2/3] TypeScript regression tests"
for test in $(find src/cleanroom-client -name '*.test.ts' | sort); do
  npx -y -p tsx@4.19.2 tsx "$test"
done

echo "[3/3] Go authoritative world and gateway tests"
(cd src/cleanroom-world && go test ./...)

echo "clean-room validation passed"
