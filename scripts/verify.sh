#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[verify] TypeScript check..."
npx tsc --noEmit

echo "[verify] Jest unit tests..."
npm test

if [[ "${SKIP_E2E:-}" == "1" ]]; then
  echo "[verify] SKIP_E2E=1 — skipping Maestro"
  exit 0
fi

if ! command -v maestro >/dev/null 2>&1; then
  echo "[verify] Maestro not installed — skipping e2e"
  exit 0
fi

if ! adb devices | grep -q 'device$'; then
  echo "[verify] No Android device/emulator — skipping e2e"
  exit 0
fi

if [[ -z "${EMAIL:-}" || -z "${PASSWORD:-}" ]]; then
  echo "[verify] Set EMAIL and PASSWORD to run Maestro e2e"
  exit 0
fi

echo "[verify] Maestro e2e..."
maestro test .maestro/smoke.yaml .maestro/shopping-add.yaml .maestro/recipe-add.yaml \
  -e "EMAIL=${EMAIL}" -e "PASSWORD=${PASSWORD}"
