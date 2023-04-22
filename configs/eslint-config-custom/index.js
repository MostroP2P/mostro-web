module.exports = {
  extends: ["prettier", "airbnb-base", "airbnb-typescript/base"],
  plugins: ["@typescript-eslint", "prettier"],
  parser: "@typescript-eslint/parser",
  ignorePatterns: ["node_modules", "dist", "build", "coverage", "lib"],
  rules: {
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: [
          "vite",
          "@vitejs/plugin-vue",
          "vite-plugin-vuetify",
          "vite-plugin-eslint",
        ],
      },
    ],
  },
};
