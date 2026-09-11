/**
 * Run Maestro E2E against an APK with an embedded JS bundle (Path A).
 * Does not require Metro. Rebuild first: npm run android:e2e
 */
const { spawnSync } = require('child_process');

require('./prepare-android-emulator');

const email = process.env.EMAIL;
const password = process.env.PASSWORD;

if (!email || !password) {
  console.error('[e2e] Set EMAIL and PASSWORD environment variables before running test:e2e');
  process.exit(1);
}

const flows = [
  '.maestro/smoke.yaml',
  '.maestro/shopping-add.yaml',
  '.maestro/recipe-add.yaml',
  '.maestro/bottom-nav-last-tab.yaml',
];

const result = spawnSync(
  'maestro',
  ['test', '-e', `EMAIL=${email}`, '-e', `PASSWORD=${password}`, ...flows],
  { stdio: 'inherit', shell: true },
);

process.exit(result.status ?? 1);
