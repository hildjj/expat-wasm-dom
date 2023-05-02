module.exports = {
  root: true,
  extends: '@cto.af/eslint-config/modules',
  ignorePatterns: [
    'docs/',
    'coverage/',
    'lib/xpathPattern3.js',
  ],
  env: {
    es2020: true,
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2022,
  },
  rules: {
    'node/no-missing-import': ['error', {
      allowModules: ['ava'],
    }],
    'quotes': ['error', 'single', {avoidEscape: true}],
  },
}
