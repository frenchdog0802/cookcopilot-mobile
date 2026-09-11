# Mobile E2E (Maestro)

Run automated checks **before** `eas build` to avoid wasting build quota.

## Quick verify (no emulator needed)

```bash
cd mobile
npm run verify
```

Runs TypeScript check + all Jest unit tests (~45 tests).

## Full verify with E2E (requires dev build on emulator/device)

1. Install [Maestro](https://maestro.mobile.dev/docs/getting-started/installing-maestro)
2. Start Android emulator and install the dev client (`expo run:android` or latest EAS dev build)
3. Set test account credentials:

```bash
# Windows PowerShell
$env:EMAIL="your-test@example.com"
$env:PASSWORD="your-password"
npm run test:e2e

# macOS/Linux
EMAIL=you@example.com PASSWORD=secret npm run test:e2e
```

Or use the all-in-one script:

```bash
# Windows
set EMAIL=you@example.com
set PASSWORD=secret
npm run verify:all
```

## Flows

| File | What it checks |
|------|----------------|
| `smoke.yaml` | Login + drawer nav to Calendar / Inventory / Shopping / Recipes / Settings / Chat |
| `shopping-add.yaml` | Add shopping item |
| `recipe-add.yaml` | Create recipe in folder |
| `bottom-nav-last-tab.yaml` | Settings via drawer (legacy filename) |

## Pre-build checklist

- [ ] `npm run verify` passes
- [ ] Emulator running with dev build installed
- [ ] `npm run test:e2e` passes with test account
