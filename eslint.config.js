import globals from 'globals';

export default [
    {
        ignores: ['node_modules/**', 'public/**'],
    },
    {
        files: ['src/**/*.js', 'src/**/*.jsx', 'tests/**/*.js', '*.js'],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
        rules: {
            // The rule that matters here: an unimported helper (createConfetti)
            // shipped to production and crashed at runtime.
            'no-undef': 'error',
            'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],
            'no-empty': ['warn', { allowEmptyCatch: true }],
            'no-const-assign': 'error',
            'no-dupe-keys': 'error',
            'no-duplicate-case': 'error',
            'no-unreachable': 'error',
            'no-fallthrough': 'error',
            'valid-typeof': 'error',
            eqeqeq: ['warn', 'smart'],
        },
    },
];
