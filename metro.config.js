const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Avoid Metro watching native build dirs (reanimated/cmake ENOENT crashes).
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  /android[\\/].*[\\/]build[\\/].*/,
  /ios[\\/].*[\\/]build[\\/].*/,
];

module.exports = withNativeWind(config, { input: './global.css' });
