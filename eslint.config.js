import es6 from '@cto.af/eslint-config/es6.js';
import jsdoc from '@cto.af/eslint-config/jsdoc.js';
import ts from '@cto.af/eslint-config/ts.js';
import tsdoc from '@cto.af/eslint-config/jsdoc_ts.js';

export default [
  {
    ignores: [
      '**/*.d.ts',
      'lib/*',
    ],
  },
  ...es6,
  ...ts,
  ...jsdoc,
  ...tsdoc,
];
