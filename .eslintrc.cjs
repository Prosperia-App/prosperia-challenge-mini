module.exports = {
  root: true,
  env: { node: true, es2020: true },
  extends: ["eslint:recommended", "prettier"],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  rules: {
    "no-console": ["warn", { allow: ["warn", "error", "log"] }]
  }
};
