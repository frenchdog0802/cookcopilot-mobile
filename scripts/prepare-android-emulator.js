/**
 * Reset app state and install the E2E APK before Maestro runs.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mobileRoot = path.join(__dirname, '..');
const releaseApk = path.join(mobileRoot, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const debugApk = path.join(mobileRoot, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', shell: true });
}

const apkPath = process.env.E2E_APK_PATH || (fs.existsSync(releaseApk) ? releaseApk : debugApk);

if (!fs.existsSync(apkPath)) {
  console.error(`[e2e] APK not found: ${apkPath}`);
  console.error('[e2e] Build first: npm run android:e2e');
  process.exit(1);
}

try {
  console.log(`[e2e] Installing ${path.basename(apkPath)}…`);
  run(`adb install -r "${apkPath}"`);
  run('adb shell pm clear com.lardermind.app');
} catch (err) {
  console.warn('[e2e] prepare-android-emulator:', err.message);
  process.exitCode = 1;
}
