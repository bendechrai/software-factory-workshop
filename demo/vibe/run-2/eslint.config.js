import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/", "data/"] },
  js.configs.recommended,
  {
    files: ["src/**/*.js", "test/**/*.js", "eslint.config.js"],
    languageOptions: { globals: globals.node },
  },
];
