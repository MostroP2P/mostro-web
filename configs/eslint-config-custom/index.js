module.exports = {
  extends: [
    "prettier",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  plugins: ["@typescript-eslint", "prettier"],
  parser: "@typescript-eslint/parser",
  ignorePatterns: ["node_modules", "dist", "build", "coverage", "lib"],
  rules: {
    "import/no-extraneous-dependencies": [
      "off",
      {
        devDependencies: [
          "vite",
          "@vitejs/plugin-vue",
          "vite-plugin-vuetify",
          "vite-plugin-eslint",
          "@storybook/testing-library",
        ],
      },
    ],
  },
};
