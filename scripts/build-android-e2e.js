/**
 * Clean rebuild APK with embedded JS for Maestro E2E.
 * Uses release variant to skip Expo Dev Launcher (no Metro required).
 */
const { execSync } = require('child_process');
const path = require('path');

const mobileRoot = path.join(__dirname, '..');
const androidDir = path.join(mobileRoot, 'android');
const variant = process.env.E2E_ANDROID_VARIANT || 'release';
const apkRelPath =
  variant === 'release'
    ? path.join('app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
    : path.join('app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', shell: true, ...opts });
}

console.log(`[android:e2e] Cleaning app module build (variant=${variant})…`);
run('.\\gradlew.bat :app:clean', { cwd: androidDir });

console.log(`[android:e2e] Building ${variant} APK with embedded bundle…`);
run(`npx expo run:android --variant ${variant} --no-bundler`, {
  cwd: mobileRoot,
  env: { ...process.env },
});

console.log('[android:e2e] Verifying embedded bundle…');
run(`node scripts/verify-embedded-bundle.js "${path.join(androidDir, apkRelPath)}"`, {
  cwd: mobileRoot,
});

console.log(`[android:e2e] Done. APK: android/${apkRelPath.replace(/\\/g, '/')}`);
console.log('[android:e2e] Install: adb install -r android/' + apkRelPath.replace(/\\/g, '/'));
console.log('[android:e2e] Run E2E without Metro: npm run test:e2e');

