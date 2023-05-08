# expat-wasm-dom

A Document Object Model for [expat-wasm](https://github.com/hildjj/expat-wasm).

To install:

```sh
npm install --save expat-wasm-dom
```

To use:

```js
import DomParser from 'expat-wasm-dom'
const doc = DomParser.parse('<foo><bar/></foo>')
console.log(doc.root.toString())
console.log(doc.get('//bar'))
```

Note that there is an implementation of XPath3 included.  It is not in any way
feature-complete yet, but it has a bunch of useful features already.

Full [documentation](https://hildjj.github.io/expat-wasm-dom/) is available.

A Command Line Interface is available in [expat-wasm-dom-cli](https://github.com/hildjj/expat-wasm-dom/tree/main/cli).

---
[![Tests](https://github.com/hildjj/expat-wasm-dom/actions/workflows/node.js.yml/badge.svg)](https://github.com/hildjj/expat-wasm-dom/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/hildjj/expat-wasm-dom/branch/main/graph/badge.svg?token=MPGGvwbrqR)](https://codecov.io/gh/hildjj/expat-wasm-dom)
