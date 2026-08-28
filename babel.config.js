module.exports = function (api) {
    const isTest = api.env('test');
    api.cache.using(() => (isTest ? 'test' : 'default'));

    if (isTest) {
        return {
            presets: ['babel-preset-expo'],
        };
    }

    return {
        presets: [
            ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
            'nativewind/babel',
        ],
        // Must be listed last — required for reanimated/worklets runtime
        plugins: ['react-native-reanimated/plugin'],
    };
};
