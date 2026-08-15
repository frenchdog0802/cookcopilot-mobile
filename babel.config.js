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
    };
};
