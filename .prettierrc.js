module.exports = {
  printWidth: 120,
  trailingComma: "all",
  overrides: [
    {
      files: ["*.js", ".*.js"],
      options: {
        singleQuote: true,
      },
    },
  ],
};
