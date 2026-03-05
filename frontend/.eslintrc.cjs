module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended",

        // ✅ TypeScript rules (base recommended set)
        "plugin:@typescript-eslint/recommended",
    ],
    ignorePatterns: ["dist", ".eslintrc.cjs"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
    },
    settings: { react: { version: "18.2" } },
    plugins: [
        "react-refresh",
        "@typescript-eslint",
    ],
    overrides: [
        {
            // ✅ Vitest test files
            files: ["src/__tests__/**/*.{js,jsx,ts,tsx}", "**/*.{test,spec}.{js,jsx,ts,tsx}"],
            plugins: ["vitest-globals"],
            env: { "vitest-globals/env": true },
        },
    ],
    rules: {
        "react/prop-types": "off",
        "jsx-quotes": ["error", "prefer-double"],
        "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

        /**
         * TS-specific lint tuning:
         * - Avoid duplicate warnings (base rule vs TS rule).
         * - Keep noise low while still catching issues.
         */
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

        // Optional: many teams disable this if they use TS types instead.
        "@typescript-eslint/no-explicit-any": "off",
    },
};