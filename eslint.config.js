import es6 from '@cto.af/eslint-config/es6.js';
import jsdoc from '@cto.af/eslint-config/jsdoc.js';

export default [
  {
    ignores: [
      '**/*.d.ts',
      'lib/xpathPattern3.js',
    ],
  },
  ...es6,
  ...jsdoc,
];
