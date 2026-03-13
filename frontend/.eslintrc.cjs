module.exports = {
    root: true,
    env: {
        browser: true,
        es2020: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:jsx-a11y/recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
    ],
    ignorePatterns: [
        "dist",
        "coverage",
        "docs",
        "docs/**",
        ".eslintrc.cjs",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
    },
    settings: {
        react: { version: "detect" },
        "import/resolver": {
            typescript: {},
        },
    },
    plugins: ["react-refresh", "@typescript-eslint"],
    overrides: [
        {
            files: ["vite.config.js", "*.config.js", "*.config.cjs", "*.config.mjs"],
            env: {
                node: true,
            },
        },
        {
            files: ["src/__tests__/**/*.{js,jsx,ts,tsx}", "src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
            plugins: ["testing-library", "jest-dom", "vitest-globals"],
            env: {
                "vitest-globals/env": true,
            },
            extends: [
                "plugin:testing-library/react",
                "plugin:jest-dom/recommended",
            ],
        },
    ],
    rules: {
        "react/prop-types": "off",
        "jsx-quotes": ["error", "prefer-double"],
        "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
        "@typescript-eslint/no-explicit-any": "off",

        "import/no-named-as-default": "off",
        "import/no-cycle": "error",
        "import/order": [
            "error",
            {
                groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
                "newlines-between": "always",
                alphabetize: { order: "asc", caseInsensitive: true },
            },
        ],
    },
};