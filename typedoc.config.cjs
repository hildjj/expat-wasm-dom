'use strict';

/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: [
    'lib/index.js',
  ],
  out: 'docs',
  cleanOutputDir: true,
  sidebarLinks: {
    GitHub: 'https://github.com/hildjj/expat-wasm-dom/',
    Documentation: 'http://hildjj.github.io/expat-wasm-dom/',
  },
  navigation: {
    includeCategories: false,
    includeGroups: false,
  },
  categorizeByGroup: false,
  sort: ['static-first', 'alphabetical'],
  exclude: ['**/*.spec.ts'],
};
