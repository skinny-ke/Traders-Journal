import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        // Treat JSX identifiers as "used" to suppress false positives
        // when components are used only inside JSX (not called as functions).
        jsxPragma: null,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Components used only in JSX are reported as unused by no-unused-vars
      // in the flat-config preset (no react/jsx-uses-react rule).
      // Downgrade to "off" for vars that look like React components (PascalCase).
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_|^[A-Z]",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];
