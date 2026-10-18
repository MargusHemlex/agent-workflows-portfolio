import js from "@eslint/js";
export default [
  { ignores: ["node_modules/**", "pipeline-output/**", "coverage/**"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        structuredClone: "readonly",
        URL: "readonly",
      },
    },
  },
];
