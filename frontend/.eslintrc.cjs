module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    settings: { react: { version: '18.2' } },
    plugins: ['react-refresh'],
    overrides: [
        {
            files: ['src/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.{test,spec}.{js,jsx,ts,tsx}'],
            plugins: ['vitest-globals'],
            env: { 'vitest-globals/env': true },
        },
    ],
    rules: {
        'react/prop-types': 'off',
        'jsx-quotes': ['error', 'prefer-double'],
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
};
