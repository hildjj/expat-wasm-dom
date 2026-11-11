export default {
  dts: true,
  format: 'es',
  input: 'src/xpathPattern3.peggy',
  output: 'lib/xpathPattern3.js',
  returnTypes: {
    XPath: 'import("xpath.js").Functor',
  },
};
