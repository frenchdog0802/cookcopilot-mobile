/**
 * Jest Configuration for Diet_APP_mobile
 * Using jest-expo/ios preset for better compatibility
 */
module.exports = {
    preset: 'jest-expo/ios',

    setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
    setupFiles: ['<rootDir>/jest.setup.js'],

    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|native-base|react-native-svg|nativewind|react-native-css-interop|react-native-reanimated|react-native-auth0)',
    ],

    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testMatch: ['**/__tests__/**/*.(test|spec).[jt]s?(x)'],
    clearMocks: true,
    verbose: true,

    // Extend the haste map to properly handle node_modules
    haste: {
        defaultPlatform: 'ios',
        platforms: ['android', 'ios', 'native'],
    },
};
