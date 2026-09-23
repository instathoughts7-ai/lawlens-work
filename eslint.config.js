import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "bun.lock",
      ".system_generated/**",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
    },
  }
);
