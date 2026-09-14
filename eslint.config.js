import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["build", "dist", "node_modules"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Matches the previous CRA (eslint-config-react-app) setup, which left
      // `any` allowed while the d3 typing gets cleaned up.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
  {
    // Test helpers and the vite config run in Node.
    files: ["vite.config.ts", "src/**/*.tests.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  }
);
