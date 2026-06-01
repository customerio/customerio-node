module.exports = {
  printWidth: 120,
  trailingComma: 'all',
  overrides: [
    {
      files: ['*.js', '.*.js', '*.mjs', '*.cjs'],
      options: {
        singleQuote: true,
      },
    },
  ],
};
