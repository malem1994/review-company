import globals from "globals";
import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      "react-hook-form": require("eslint-plugin-react-hook-form")
    },
    rules: {
      "react-hook-form/exhaustive-deps": "warn"
    }
  }
];
